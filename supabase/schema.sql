-- ComeBien - Supabase Schema
-- Run this in your Supabase SQL editor

-- Table: daily_logs
CREATE TABLE IF NOT EXISTS daily_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  meal_time TEXT NOT NULL CHECK (meal_time IN ('desayuno', 'almuerzo', 'colación', 'cena')),
  description TEXT NOT NULL,
  parsed_portions JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast date queries
CREATE INDEX IF NOT EXISTS daily_logs_date_idx ON daily_logs (date DESC);

-- Table: user_settings (single row, id=1)
CREATE TABLE IF NOT EXISTS user_settings (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  cycle_day INTEGER NOT NULL DEFAULT 1 CHECK (cycle_day >= 1 AND cycle_day <= 35),
  cycle_length INTEGER NOT NULL DEFAULT 28 CHECK (cycle_length >= 21 AND cycle_length <= 35),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed default settings row
INSERT INTO user_settings (id, cycle_day, cycle_length)
VALUES (1, 1, 28)
ON CONFLICT (id) DO NOTHING;
