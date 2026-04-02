-- Seed reviews for each provider using customers that haven't claimed each deal yet

WITH provider_deals AS (
  SELECT d.id AS discount_id, d.provider_id
  FROM discounts d
),
available_pairs AS (
  SELECT
    pd.discount_id,
    pd.provider_id,
    cp.id AS customer_id,
    row_number() OVER (PARTITION BY pd.provider_id ORDER BY random()) AS rn
  FROM provider_deals pd
  CROSS JOIN customer_profiles cp
  WHERE NOT EXISTS (
    SELECT 1 FROM redemptions r
    WHERE r.discount_id = pd.discount_id AND r.customer_id = cp.id
  )
)
INSERT INTO redemptions (id, discount_id, customer_id, qr_code_hash, status, claimed_at, redeemed_at)
SELECT
  gen_random_uuid(),
  ap.discount_id,
  ap.customer_id,
  substr(md5(random()::text), 1, 12),
  'redeemed',
  NOW() - (floor(random() * 14) || ' days')::interval,
  NOW() - (floor(random() * 7) || ' days')::interval
FROM available_pairs ap
WHERE ap.rn <= 2;

-- Create reviews for redeemed redemptions that don't have reviews yet
INSERT INTO reviews (id, provider_id, customer_id, redemption_id, rating, comment, created_at)
SELECT
  gen_random_uuid(),
  d.provider_id,
  r.customer_id,
  r.id,
  (floor(random() * 2)::int + 4),
  CASE (random() * 4)::int
    WHEN 0 THEN 'Amazing experience! Highly recommend.'
    WHEN 1 THEN 'Great service and quality. Will come back!'
    WHEN 2 THEN 'Loved it! Best deal in town.'
    ELSE 'Fantastic! Exceeded my expectations.'
  END,
  r.redeemed_at
FROM redemptions r
JOIN discounts d ON d.id = r.discount_id
LEFT JOIN reviews rev ON rev.redemption_id = r.id
WHERE r.status = 'redeemed' AND rev.id IS NULL;

-- Update provider average ratings
UPDATE provider_profiles pp
SET
  average_rating = COALESCE(sub.avg_rating, 0),
  total_reviews = COALESCE(sub.review_count, 0)
FROM (
  SELECT
    r.provider_id,
    ROUND(AVG(r.rating)::numeric, 1) AS avg_rating,
    COUNT(*) AS review_count
  FROM reviews r
  GROUP BY r.provider_id
) sub
WHERE pp.id = sub.provider_id;
