-- ComeBien - Supabase Schema (v2 - multi-user)
-- Run this in your Supabase SQL editor

-- ─────────────────────────────────────────────────────────
-- 1. EXTENSIONS
-- ─────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─────────────────────────────────────────────────────────
-- 2. USER PROFILES (one row per auth user)
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_profiles (
  id               UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  name             TEXT NOT NULL DEFAULT '',
  weight_kg        NUMERIC,
  height_cm        NUMERIC,
  age              INTEGER,
  activity_level   TEXT DEFAULT 'moderada',
  diet_type        TEXT DEFAULT 'ovo-vegetariana',
  daily_targets    JSONB NOT NULL DEFAULT '{
    "legumes": 3,
    "cereals": 3,
    "eggs":    2,
    "vegetables": 4,
    "fruits":  4,
    "fats":    3,
    "soy_milk": 2,
    "yogurt":  1
  }',
  cycle_length     INTEGER NOT NULL DEFAULT 28
                   CHECK (cycle_length >= 21 AND cycle_length <= 35),
  current_cycle_day INTEGER NOT NULL DEFAULT 1
                   CHECK (current_cycle_day >= 1 AND current_cycle_day <= 35),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────
-- 3. DAILY LOGS
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS daily_logs (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id          UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  date             DATE NOT NULL DEFAULT CURRENT_DATE,
  meal_time        TEXT NOT NULL CHECK (meal_time IN ('desayuno', 'almuerzo', 'colación', 'cena')),
  description      TEXT NOT NULL,
  parsed_portions  JSONB NOT NULL DEFAULT '{}',
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS daily_logs_user_date_idx ON daily_logs (user_id, date DESC);

-- ─────────────────────────────────────────────────────────
-- 4. USER RECIPES (optional, future)
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_recipes (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  name        TEXT NOT NULL,
  description TEXT,
  portions    JSONB NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS user_recipes_user_idx ON user_recipes (user_id);

-- ─────────────────────────────────────────────────────────
-- 5. ROW LEVEL SECURITY
-- ─────────────────────────────────────────────────────────

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users see own profile" ON user_profiles;
CREATE POLICY "Users see own profile"
  ON user_profiles FOR ALL
  USING (auth.uid() = id);

ALTER TABLE daily_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users see own logs" ON daily_logs;
CREATE POLICY "Users see own logs"
  ON daily_logs FOR ALL
  USING (auth.uid() = user_id);

ALTER TABLE user_recipes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users see own recipes" ON user_recipes;
CREATE POLICY "Users see own recipes"
  ON user_recipes FOR ALL
  USING (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────
-- 6. AUTO-CREATE PROFILE ON SIGN-UP
-- ─────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (id, name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ─────────────────────────────────────────────────────────
-- 7. SEED USER 1 (Linamaría) - run after creating the user in Supabase Auth
-- Replace <USER_1_UUID> with the real UUID from auth.users
-- ─────────────────────────────────────────────────────────
-- INSERT INTO user_profiles (id, name, daily_targets, cycle_length, current_cycle_day)
-- VALUES (
--   '<USER_1_UUID>',
--   'Linamaría',
--   '{"legumes":3,"cereals":3,"eggs":2,"vegetables":4,"fruits":4,"fats":3,"soy_milk":2,"yogurt":1}',
--   28,
--   1
-- )
-- ON CONFLICT (id) DO UPDATE SET
--   name = EXCLUDED.name,
--   daily_targets = EXCLUDED.daily_targets;
