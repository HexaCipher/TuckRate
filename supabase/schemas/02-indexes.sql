-- TuckRate indexes — per docs/5-Backend-Schema.md §3
-- The unique constraints below also create backing unique indexes.

create index if not exists ratings_item_id_idx on public.ratings (item_id);
create index if not exists ratings_user_id_idx on public.ratings (user_id);
create index if not exists items_is_active_idx on public.items (is_active);
create index if not exists reports_status_idx on public.reports (status);
