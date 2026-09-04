-- TuckRate Phase 3 — aggregated item stats view
-- Paste this into the Supabase SQL editor to create the view.
-- Recorded here as the migration file for the repo record.

CREATE OR REPLACE VIEW public.item_stats AS
SELECT
  i.id,
  i.name,
  i.price,
  i.category,
  i.photo_url,
  i.is_active,
  coalesce(r.rating_count, 0)::int        AS rating_count,
  coalesce(r.avg_stars, 0)::numeric(3,1)   AS avg_stars,
  coalesce(r.worth_it_count, 0)::int       AS worth_it_count,
  CASE WHEN coalesce(r.rating_count, 0) > 0
       THEN round(coalesce(r.worth_it_count, 0)::numeric / r.rating_count * 100, 0)
       ELSE 0
  END::int                                 AS worth_it_pct,
  coalesce(r.hygiene_flag_count, 0)::int   AS hygiene_flag_count
FROM public.items i
LEFT JOIN (
  SELECT
    item_id,
    count(*)                              AS rating_count,
    avg(stars)                            AS avg_stars,
    count(*) FILTER (WHERE worth_it)      AS worth_it_count,
    count(*) FILTER (WHERE hygiene_flag)  AS hygiene_flag_count
  FROM public.ratings
  GROUP BY item_id
) r ON r.item_id = i.id
WHERE i.is_active = true;

-- Grant select so the anon/authenticated roles can read it
-- (views inherit the base table's RLS — items has public select)
GRANT SELECT ON public.item_stats TO anon, authenticated;
