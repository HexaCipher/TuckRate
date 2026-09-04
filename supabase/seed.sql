-- WorthIt seed data — ~10 sample items for development/testing.
--
-- NOTE: the Supabase Git integration does NOT auto-apply seed files.
-- Run this once via the Supabase dashboard → SQL editor.
-- Fixed UUIDs + ON CONFLICT DO NOTHING make it safe to re-run.

insert into public.items (id, name, description, price, category) values
  ('00000000-0000-4000-8000-000000000001', 'Samosa', 'Classic fried potato samosa', 15.00, 'snacks'),
  ('00000000-0000-4000-8000-000000000002', 'Vada Pav', 'Spiced potato patty in a bun', 20.00, 'snacks'),
  ('00000000-0000-4000-8000-000000000003', 'Maggi Masala', 'Instant noodles, hostel staple', 25.00, 'meals'),
  ('00000000-0000-4000-8000-000000000004', 'Veg Sandwich', 'Grilled sandwich with chutney', 40.00, 'meals'),
  ('00000000-0000-4000-8000-000000000005', 'Paneer Paratha', 'Two parathas with curd', 50.00, 'meals'),
  ('00000000-0000-4000-8000-000000000006', 'Chai', 'Cutting chai', 10.00, 'beverages'),
  ('00000000-0000-4000-8000-000000000007', 'Cold Coffee', 'Chilled coffee with milk', 35.00, 'beverages'),
  ('00000000-0000-4000-8000-000000000008', 'Lassi', 'Sweet punjabi lassi', 30.00, 'beverages'),
  ('00000000-0000-4000-8000-000000000009', 'Biscuit Pack (Parle-G)', 'Standard 5-pack', 5.00, 'snacks'),
  ('00000000-0000-4000-8000-000000000010', 'Chocolate Brownie', 'Fudge brownie, sometimes warm', 45.00, 'snacks')
on conflict (id) do nothing;
