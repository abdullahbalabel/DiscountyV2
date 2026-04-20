-- Add first_name and last_name to customer_profiles
-- Fields are nullable — existing rows unaffected
ALTER TABLE customer_profiles
  ADD COLUMN first_name TEXT,
  ADD COLUMN last_name TEXT;
