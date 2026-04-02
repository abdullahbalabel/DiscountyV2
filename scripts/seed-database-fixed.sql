-- ============================================
-- Database Seed Script for Discounty
-- ============================================

-- Disable RLS
ALTER TABLE categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE provider_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE customer_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE discounts DISABLE ROW LEVEL SECURITY;
ALTER TABLE redemptions DISABLE ROW LEVEL SECURITY;
ALTER TABLE reviews DISABLE ROW LEVEL SECURITY;

-- Drop FK constraints temporarily
ALTER TABLE provider_profiles DROP CONSTRAINT IF EXISTS provider_profiles_user_id_fkey;
ALTER TABLE customer_profiles DROP CONSTRAINT IF EXISTS customer_profiles_user_id_fkey;
ALTER TABLE redemptions DROP CONSTRAINT IF EXISTS redemptions_discount_id_fkey;
ALTER TABLE redemptions DROP CONSTRAINT IF EXISTS redemptions_customer_id_fkey;
ALTER TABLE reviews DROP CONSTRAINT IF EXISTS reviews_provider_id_fkey;
ALTER TABLE reviews DROP CONSTRAINT IF EXISTS reviews_customer_id_fkey;
ALTER TABLE reviews DROP CONSTRAINT IF EXISTS reviews_redemption_id_fkey;

-- Clean existing data
TRUNCATE TABLE reviews, redemptions, discounts, customer_profiles, provider_profiles, categories RESTART IDENTITY CASCADE;

-- Insert categories
INSERT INTO categories (id, name, name_ar, icon, sort_order, is_active) VALUES
  (gen_random_uuid(), 'Restaurants', 'مطاعم', 'restaurant', 1, true),
  (gen_random_uuid(), 'Cafes', 'مقاهي', 'local-cafe', 2, true),
  (gen_random_uuid(), 'Shopping', 'تسوق', 'shopping-bag', 3, true),
  (gen_random_uuid(), 'Beauty', 'جمال', 'spa', 4, true),
  (gen_random_uuid(), 'Entertainment', 'ترفيه', 'sports-esports', 5, true),
  (gen_random_uuid(), 'Health', 'صحة', 'fitness-center', 6, true),
  (gen_random_uuid(), 'Services', 'خدمات', 'build', 7, true),
  (gen_random_uuid(), 'Travel', 'سفر', 'flight', 8, true);

-- Insert provider profiles
INSERT INTO provider_profiles (id, user_id, business_name, category, latitude, longitude, description, logo_url, cover_photo_url, approval_status, phone, website, social_links, business_hours, average_rating, total_reviews) VALUES
  (gen_random_uuid(), '90451e6f-f66e-4a1d-ac9c-60932af913fd', 'Pizza Palace', 'Restaurants', 24.7136, 46.6753, 'Authentic Italian pizzas made with fresh ingredients', 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=200', 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800', 'approved', '+966501234567', 'https://pizzapalace.com', '{"instagram":"@pizzapalace","facebook":"pizzapalace"}', '{"monday":"10:00-22:00","tuesday":"10:00-22:00","wednesday":"10:00-22:00","thursday":"10:00-23:00","friday":"14:00-23:00","saturday":"10:00-23:00","sunday":"10:00-22:00"}', 4.5, 128),
  (gen_random_uuid(), 'fa1d36a1-afd3-4f00-bda6-fcc9c21cea2e', 'Coffee Corner', 'Cafes', 24.7136, 46.6753, 'Premium coffee and cozy atmosphere', 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=200', 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800', 'approved', '+966502345678', 'https://coffeecorner.com', '{"instagram":"@coffeecorner"}', '{"monday":"07:00-22:00","tuesday":"07:00-22:00","wednesday":"07:00-22:00","thursday":"07:00-23:00","friday":"14:00-23:00","saturday":"07:00-23:00","sunday":"08:00-22:00"}', 4.8, 256),
  (gen_random_uuid(), '5a1dc56c-c4ae-4b9e-b2a4-2204019eb78f', 'Fashion Hub', 'Shopping', 24.7136, 46.6753, 'Trendy fashion for all ages', 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=200', 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800', 'approved', '+966503456789', 'https://fashionhub.com', '{"instagram":"@fashionhub","tiktok":"@fashionhub"}', '{"monday":"10:00-22:00","tuesday":"10:00-22:00","wednesday":"10:00-22:00","thursday":"10:00-23:00","friday":"14:00-23:00","saturday":"10:00-23:00","sunday":"10:00-22:00"}', 4.2, 89),
  (gen_random_uuid(), '2df08bba-ab6c-4113-9d1f-6296159da02f', 'Beauty Spa', 'Beauty', 24.7136, 46.6753, 'Relaxing spa treatments and beauty services', 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=200', 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800', 'approved', '+966504567890', 'https://beautyspa.com', '{"instagram":"@beautyspa","facebook":"beautyspa"}', '{"monday":"09:00-21:00","tuesday":"09:00-21:00","wednesday":"09:00-21:00","thursday":"09:00-22:00","friday":"14:00-22:00","saturday":"09:00-22:00","sunday":"10:00-20:00"}', 4.7, 167),
  (gen_random_uuid(), '3d5454fc-cf1f-4be6-9b8e-44b72fa2b767', 'Game Zone', 'Entertainment', 24.7136, 46.6753, 'Fun gaming experience for everyone', 'https://images.unsplash.com/photo-1511882150382-421056c89033?w=200', 'https://images.unsplash.com/photo-1511882150382-421056c89033?w=800', 'approved', '+966505678901', 'https://gamezone.com', '{"instagram":"@gamezone","tiktok":"@gamezone"}', '{"monday":"12:00-23:00","tuesday":"12:00-23:00","wednesday":"12:00-23:00","thursday":"12:00-00:00","friday":"14:00-00:00","saturday":"12:00-00:00","sunday":"12:00-22:00"}', 4.6, 203),
  (gen_random_uuid(), 'b7f90c1d-de82-4715-b046-cc6c6905bc0a', 'Burger Barn', 'Restaurants', 24.7136, 46.6753, 'Juicy burgers and crispy fries', 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200', 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800', 'approved', '+966506789012', 'https://burgerbarn.com', '{"instagram":"@burgerbarn","facebook":"burgerbarn"}', '{"monday":"11:00-23:00","tuesday":"11:00-23:00","wednesday":"11:00-23:00","thursday":"11:00-00:00","friday":"14:00-00:00","saturday":"11:00-00:00","sunday":"11:00-22:00"}', 4.4, 312),
  (gen_random_uuid(), '1b816407-253c-4d18-ac42-18a30526f5ab', 'Sushi Master', 'Restaurants', 24.7136, 46.6753, 'Fresh sushi and Japanese cuisine', 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=200', 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800', 'approved', '+966507890123', 'https://sushimaster.com', '{"instagram":"@sushimaster"}', '{"monday":"12:00-22:00","tuesday":"12:00-22:00","wednesday":"12:00-22:00","thursday":"12:00-23:00","friday":"14:00-23:00","saturday":"12:00-23:00","sunday":"12:00-22:00"}', 4.9, 178),
  (gen_random_uuid(), '41fb5ff1-322f-4551-8a77-71186802584c', 'Gym Plus', 'Health', 24.7136, 46.6753, 'State-of-the-art fitness facility', 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=200', 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800', 'approved', '+966508901234', 'https://gymplus.com', '{"instagram":"@gymplus","facebook":"gymplus"}', '{"monday":"05:00-23:00","tuesday":"05:00-23:00","wednesday":"05:00-23:00","thursday":"05:00-00:00","friday":"14:00-00:00","saturday":"05:00-00:00","sunday":"06:00-22:00"}', 4.3, 145);

-- Insert customer profiles
INSERT INTO customer_profiles (id, user_id, display_name, avatar_url, preferences) VALUES
  (gen_random_uuid(), '1109141f-16ca-405a-bd2c-ab3a8e41379d', 'Ahmed Al-Saud', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200', '{"Restaurants","Cafes"}'),
  (gen_random_uuid(), '4cf141f4-2ffa-4910-b0c0-56a3c3d7c743', 'Fatima Al-Harbi', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200', '{"Beauty","Shopping"}'),
  (gen_random_uuid(), '38053c33-b8d5-42d5-9034-ff6a6541b784', 'Mohammed Al-Qahtani', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200', '{"Entertainment","Restaurants"}'),
  (gen_random_uuid(), '4ad56efd-1ca3-42a7-9c3e-d7f8c59db686', 'Noura Al-Dosari', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200', '{"Health","Cafes"}'),
  (gen_random_uuid(), 'c9588800-fa15-4a26-b959-97f1496d9f06', 'Khalid Al-Rashid', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200', '{"Shopping","Entertainment"}');

-- Insert discounts for each provider
WITH provider_data AS (
  SELECT id, category FROM provider_profiles
),
category_data AS (
  SELECT id, name FROM categories
)
INSERT INTO discounts (id, provider_id, title, description, discount_value, type, category_id, image_url, start_time, end_time, status, max_redemptions, current_redemptions, view_count, alphanumeric_code)
SELECT 
  gen_random_uuid(),
  p.id,
  CASE (random() * 4)::int
    WHEN 0 THEN '20% Off Your First Order'
    WHEN 1 THEN 'Buy 1 Get 1 Free'
    WHEN 2 THEN '$10 Off'
    ELSE '30% Off Weekend Special'
  END,
  CASE (random() * 4)::int
    WHEN 0 THEN 'Get 20% off on your first order.'
    WHEN 1 THEN 'Buy one and get another free!'
    WHEN 2 THEN 'Get $10 off on orders over $50.'
    ELSE 'Enjoy 30% off every weekend.'
  END,
  CASE (random() * 4)::int
    WHEN 0 THEN 20
    WHEN 1 THEN 50
    WHEN 2 THEN 10
    ELSE 30
  END,
  'percentage',
  c.id,
  'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400',
  NOW() - '7 days'::interval,
  NOW() + '60 days'::interval,
  'active',
  500,
  50,
  1000,
  upper(substr(md5(random()::text), 1, 6))
FROM provider_data p
LEFT JOIN category_data c ON c.name = p.category;

-- Insert redemptions (2-3 random deals per customer)
INSERT INTO redemptions (id, discount_id, customer_id, qr_code_hash, status, claimed_at, redeemed_at)
SELECT
  gen_random_uuid(),
  d.id,
  c.id,
  substr(md5(random()::text), 1, 12),
  'redeemed',
  NOW() - (floor(random() * 7) || ' days')::interval,
  NOW() - (floor(random() * 3) || ' days')::interval
FROM customer_profiles c
CROSS JOIN LATERAL (
  SELECT id FROM discounts ORDER BY random() LIMIT 2 + (random() * 2)::int
) d;

-- Insert reviews for redeemed redemptions
WITH redeemed_data AS (
  SELECT DISTINCT ON (r.id) r.id as redemption_id, r.customer_id, d.provider_id
  FROM redemptions r
  JOIN discounts d ON d.id = r.discount_id
  LEFT JOIN reviews rev ON rev.redemption_id = r.id
  WHERE rev.id IS NULL
  LIMIT 20
)
INSERT INTO reviews (id, provider_id, customer_id, redemption_id, rating, comment, created_at)
SELECT 
  gen_random_uuid(),
  rd.provider_id,
  rd.customer_id,
  rd.redemption_id,
  (floor(random() * 5)::int % 2 + 4), -- 4 or 5
  'Great experience! Will definitely come back.',
  NOW() - (floor(random() * 7) || ' days')::interval
FROM redeemed_data rd;

-- Re-enable RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE discounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Re-add FK constraints
ALTER TABLE provider_profiles ADD CONSTRAINT provider_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE customer_profiles ADD CONSTRAINT customer_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE redemptions ADD CONSTRAINT redemptions_discount_id_fkey FOREIGN KEY (discount_id) REFERENCES discounts(id) ON DELETE CASCADE;
ALTER TABLE redemptions ADD CONSTRAINT redemptions_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES customer_profiles(id) ON DELETE CASCADE;
ALTER TABLE reviews ADD CONSTRAINT reviews_provider_id_fkey FOREIGN KEY (provider_id) REFERENCES provider_profiles(id) ON DELETE CASCADE;
ALTER TABLE reviews ADD CONSTRAINT reviews_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES customer_profiles(id) ON DELETE CASCADE;
ALTER TABLE reviews ADD CONSTRAINT reviews_redemption_id_fkey FOREIGN KEY (redemption_id) REFERENCES redemptions(id) ON DELETE CASCADE;

-- Summary
SELECT 'Categories: ' || (SELECT count(*) FROM categories) || ', Providers: ' || (SELECT count(*) FROM provider_profiles) || ', Customers: ' || (SELECT count(*) FROM customer_profiles) || ', Deals: ' || (SELECT count(*) FROM discounts) || ', Redemptions: ' || (SELECT count(*) FROM redemptions) || ', Reviews: ' || (SELECT count(*) FROM reviews) as summary;
