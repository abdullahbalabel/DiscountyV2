-- ============================================
-- Database Seed Script for Discounty
-- ============================================
-- Run this in Supabase SQL Editor

-- Temporarily disable RLS for seeding
ALTER TABLE categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE provider_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE customer_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE discounts DISABLE ROW LEVEL SECURITY;
ALTER TABLE redemptions DISABLE ROW LEVEL SECURITY;
ALTER TABLE reviews DISABLE ROW LEVEL SECURITY;

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
  (gen_random_uuid(), gen_random_uuid(), 'Pizza Palace', 'Restaurants', 24.7136, 46.6753, 'Authentic Italian pizzas made with fresh ingredients', 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=200', 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800', 'approved', '+966501234567', 'https://pizzapalace.com', '{"instagram":"@pizzapalace","facebook":"pizzapalace"}', '{"monday":"10:00-22:00","tuesday":"10:00-22:00","wednesday":"10:00-22:00","thursday":"10:00-23:00","friday":"14:00-23:00","saturday":"10:00-23:00","sunday":"10:00-22:00"}', 4.5, 128),
  (gen_random_uuid(), gen_random_uuid(), 'Coffee Corner', 'Cafes', 24.7136, 46.6753, 'Premium coffee and cozy atmosphere', 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=200', 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800', 'approved', '+966502345678', 'https://coffeecorner.com', '{"instagram":"@coffeecorner"}', '{"monday":"07:00-22:00","tuesday":"07:00-22:00","wednesday":"07:00-22:00","thursday":"07:00-23:00","friday":"14:00-23:00","saturday":"07:00-23:00","sunday":"08:00-22:00"}', 4.8, 256),
  (gen_random_uuid(), gen_random_uuid(), 'Fashion Hub', 'Shopping', 24.7136, 46.6753, 'Trendy fashion for all ages', 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=200', 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800', 'approved', '+966503456789', 'https://fashionhub.com', '{"instagram":"@fashionhub","tiktok":"@fashionhub"}', '{"monday":"10:00-22:00","tuesday":"10:00-22:00","wednesday":"10:00-22:00","thursday":"10:00-23:00","friday":"14:00-23:00","saturday":"10:00-23:00","sunday":"10:00-22:00"}', 4.2, 89),
  (gen_random_uuid(), gen_random_uuid(), 'Beauty Spa', 'Beauty', 24.7136, 46.6753, 'Relaxing spa treatments and beauty services', 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=200', 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800', 'approved', '+966504567890', 'https://beautyspa.com', '{"instagram":"@beautyspa","facebook":"beautyspa"}', '{"monday":"09:00-21:00","tuesday":"09:00-21:00","wednesday":"09:00-21:00","thursday":"09:00-22:00","friday":"14:00-22:00","saturday":"09:00-22:00","sunday":"10:00-20:00"}', 4.7, 167),
  (gen_random_uuid(), gen_random_uuid(), 'Game Zone', 'Entertainment', 24.7136, 46.6753, 'Fun gaming experience for everyone', 'https://images.unsplash.com/photo-1511882150382-421056c89033?w=200', 'https://images.unsplash.com/photo-1511882150382-421056c89033?w=800', 'approved', '+966505678901', 'https://gamezone.com', '{"instagram":"@gamezone","tiktok":"@gamezone"}', '{"monday":"12:00-23:00","tuesday":"12:00-23:00","wednesday":"12:00-23:00","thursday":"12:00-00:00","friday":"14:00-00:00","saturday":"12:00-00:00","sunday":"12:00-22:00"}', 4.6, 203),
  (gen_random_uuid(), gen_random_uuid(), 'Burger Barn', 'Restaurants', 24.7136, 46.6753, 'Juicy burgers and crispy fries', 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200', 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800', 'approved', '+966506789012', 'https://burgerbarn.com', '{"instagram":"@burgerbarn","facebook":"burgerbarn"}', '{"monday":"11:00-23:00","tuesday":"11:00-23:00","wednesday":"11:00-23:00","thursday":"11:00-00:00","friday":"14:00-00:00","saturday":"11:00-00:00","sunday":"11:00-22:00"}', 4.4, 312),
  (gen_random_uuid(), gen_random_uuid(), 'Sushi Master', 'Restaurants', 24.7136, 46.6753, 'Fresh sushi and Japanese cuisine', 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=200', 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800', 'approved', '+966507890123', 'https://sushimaster.com', '{"instagram":"@sushimaster"}', '{"monday":"12:00-22:00","tuesday":"12:00-22:00","wednesday":"12:00-22:00","thursday":"12:00-23:00","friday":"14:00-23:00","saturday":"12:00-23:00","sunday":"12:00-22:00"}', 4.9, 178),
  (gen_random_uuid(), gen_random_uuid(), 'Gym Plus', 'Health', 24.7136, 46.6753, 'State-of-the-art fitness facility', 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=200', 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800', 'approved', '+966508901234', 'https://gymplus.com', '{"instagram":"@gymplus","facebook":"gymplus"}', '{"monday":"05:00-23:00","tuesday":"05:00-23:00","wednesday":"05:00-23:00","thursday":"05:00-00:00","friday":"14:00-00:00","saturday":"05:00-00:00","sunday":"06:00-22:00"}', 4.3, 145);

-- Insert customer profiles
INSERT INTO customer_profiles (id, user_id, display_name, avatar_url, preferences) VALUES
  (gen_random_uuid(), gen_random_uuid(), 'Ahmed Al-Saud', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200', '{"Restaurants","Cafes"}'),
  (gen_random_uuid(), gen_random_uuid(), 'Fatima Al-Harbi', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200', '{"Beauty","Shopping"}'),
  (gen_random_uuid(), gen_random_uuid(), 'Mohammed Al-Qahtani', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200', '{"Entertainment","Restaurants"}'),
  (gen_random_uuid(), gen_random_uuid(), 'Noura Al-Dosari', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200', '{"Health","Cafes"}'),
  (gen_random_uuid(), gen_random_uuid(), 'Khalid Al-Rashid', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200', '{"Shopping","Entertainment"}');

-- Insert discounts for each provider
WITH provider_data AS (
  SELECT id, business_name, category FROM provider_profiles
),
category_data AS (
  SELECT id, name FROM categories
)
INSERT INTO discounts (id, provider_id, title, description, discount_value, type, category_id, image_url, start_time, end_time, status, max_redemptions, current_redemptions, view_count, alphanumeric_code)
SELECT 
  gen_random_uuid(),
  p.id,
  CASE (random() * 7)::int
    WHEN 0 THEN '20% Off Your First Order'
    WHEN 1 THEN 'Buy 1 Get 1 Free'
    WHEN 2 THEN '$10 Off'
    WHEN 3 THEN '30% Off Weekend Special'
    WHEN 4 THEN 'Free Delivery'
    WHEN 5 THEN '15% Off Happy Hour'
    WHEN 6 THEN '$25 Off Premium'
    ELSE '40% Off Clearance'
  END,
  CASE (random() * 7)::int
    WHEN 0 THEN 'Get 20% off on your first order. Valid for new customers only.'
    WHEN 1 THEN 'Buy one item and get another one free. Limited time offer!'
    WHEN 2 THEN 'Get $10 off on orders over $50. Don''t miss this deal!'
    WHEN 3 THEN 'Enjoy 30% off every weekend. Valid on all items.'
    WHEN 4 THEN 'Free delivery on all orders. No minimum order required.'
    WHEN 5 THEN '15% off during happy hour (3 PM - 6 PM). Weekdays only.'
    WHEN 6 THEN '$25 off on premium services. Book now!'
    ELSE 'Up to 40% off on selected items. While stocks last.'
  END,
  CASE (random() * 7)::int
    WHEN 0 THEN 20
    WHEN 1 THEN 50
    WHEN 2 THEN 10
    WHEN 3 THEN 30
    WHEN 4 THEN 5
    WHEN 5 THEN 15
    WHEN 6 THEN 25
    ELSE 40
  END,
  CASE WHEN random() > 0.5 THEN 'percentage' ELSE 'fixed' END,
  c.id,
  'https://images.unsplash.com/photo-' || (1500000000000 + floor(random() * 100000000)::int)::text || '?w=400',
  NOW() - (floor(random() * 30) || ' days')::interval,
  NOW() + (floor(random() * 60) + 30 || ' days')::interval,
  'active',
  floor(random() * 500 + 100)::int,
  floor(random() * 100)::int,
  floor(random() * 1000)::int,
  upper(substr(md5(random()::text), 1, 6))
FROM provider_data p
CROSS JOIN generate_series(1, 3) -- 3 deals per provider
LEFT JOIN category_data c ON c.name = p.category;

-- Insert redemptions
WITH customer_data AS (
  SELECT id FROM customer_profiles
),
deal_data AS (
  SELECT id, provider_id FROM discounts
)
INSERT INTO redemptions (id, discount_id, customer_id, qr_code_hash, status, claimed_at, redeemed_at)
SELECT 
  gen_random_uuid(),
  d.id,
  c.id,
  substr(md5(random()::text), 1, 12),
  CASE (random() * 3)::int
    WHEN 0 THEN 'claimed'
    WHEN 1 THEN 'redeemed'
    ELSE 'redeemed'
  END,
  NOW() - (floor(random() * 30) || ' days')::interval,
  CASE WHEN random() > 0.3 THEN NOW() - (floor(random() * 23) || ' days')::interval ELSE NULL END
FROM customer_data c
CROSS JOIN LATERAL (
  SELECT id, provider_id FROM deal_data ORDER BY random() LIMIT floor(random() * 4 + 2)::int
) d;

-- Insert reviews for redeemed deals
WITH redeemed_deals AS (
  SELECT r.id as redemption_id, r.customer_id, d.provider_id
  FROM redemptions r
  JOIN discounts d ON d.id = r.discount_id
  WHERE r.status = 'redeemed' AND random() > 0.2
)
INSERT INTO reviews (id, provider_id, customer_id, redemption_id, rating, comment, provider_reply, created_at, replied_at)
SELECT 
  gen_random_uuid(),
  rd.provider_id,
  rd.customer_id,
  rd.redemption_id,
  floor(random() * 2 + 4)::int, -- 4-5 stars
  CASE (random() * 9)::int
    WHEN 0 THEN 'Great experience! Will definitely come back.'
    WHEN 1 THEN 'Good value for money. Highly recommended!'
    WHEN 2 THEN 'The service was excellent. Very satisfied.'
    WHEN 3 THEN 'Nice atmosphere and friendly staff.'
    WHEN 4 THEN 'Quality products at reasonable prices.'
    WHEN 5 THEN 'Had a wonderful time. Thank you!'
    WHEN 6 THEN 'Exceeded my expectations. 5 stars!'
    WHEN 7 THEN 'Perfect for a family outing.'
    WHEN 8 THEN 'Quick service and delicious food.'
    ELSE 'Will recommend to friends and family.'
  END,
  CASE WHEN random() > 0.5 THEN 'Thank you for your feedback! We hope to see you again soon.' ELSE NULL END,
  NOW() - (floor(random() * 14) || ' days')::interval,
  CASE WHEN random() > 0.5 THEN NOW() - (floor(random() * 7) || ' days')::interval ELSE NULL END
FROM redeemed_deals rd;

-- Re-enable RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE discounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Summary
SELECT 
  'Categories: ' || (SELECT count(*) FROM categories) || E'\n' ||
  'Providers: ' || (SELECT count(*) FROM provider_profiles) || E'\n' ||
  'Customers: ' || (SELECT count(*) FROM customer_profiles) || E'\n' ||
  'Deals: ' || (SELECT count(*) FROM discounts) || E'\n' ||
  'Redemptions: ' || (SELECT count(*) FROM redemptions) || E'\n' ||
  'Reviews: ' || (SELECT count(*) FROM reviews) as summary;
