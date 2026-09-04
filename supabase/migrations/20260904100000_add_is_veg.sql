-- WorthIt — add is_veg column to items table
-- Source menu data includes a veg/non-veg flag per item.
-- Default true because most items in the tuck shop are vegetarian.

ALTER TABLE public.items
  ADD COLUMN IF NOT EXISTS is_veg boolean NOT NULL DEFAULT true;

-- Recreate the item_stats view with is_veg included.
-- Must DROP first because CREATE OR REPLACE can't add columns mid-list.
DROP VIEW IF EXISTS public.item_stats;
CREATE VIEW public.item_stats AS
SELECT
  i.id,
  i.name,
  i.price,
  i.category,
  i.photo_url,
  i.is_active,
  i.is_veg,
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

GRANT SELECT ON public.item_stats TO anon, authenticated;
