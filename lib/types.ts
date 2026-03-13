export interface Portions {
  legumes: number;
  cereals: number;
  eggs: number;
  vegetables: number;
  fruits: number;
  fats: number;
  soy_milk: number;
  yogurt: number;
}

export type MealTime = 'desayuno' | 'almuerzo' | 'colación' | 'cena';

export interface DailyLog {
  id: string;
  user_id: string;
  date: string;
  meal_time: MealTime;
  description: string;
  parsed_portions: Portions;
  created_at: string;
}

export interface UserProfile {
  id: string;
  name: string;
  weight_kg: number | null;
  height_cm: number | null;
  age: number | null;
  activity_level: string | null;
  diet_type: string;
  daily_targets: Portions;
  cycle_length: number;
  current_cycle_day: number;
  updated_at: string;
}

/** Derived from UserProfile for use in CycleIndicator */
export interface UserSettings {
  id: string;
  cycle_day: number;
  cycle_length: number;
  updated_at: string;
}

export interface CyclePhase {
  name: string;
  emoji: string;
  message: string;
}
