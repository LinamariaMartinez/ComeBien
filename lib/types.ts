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
  date: string;
  meal_time: MealTime;
  description: string;
  parsed_portions: Portions;
  created_at: string;
}

export interface UserSettings {
  id: number;
  cycle_day: number;
  cycle_length: number;
  updated_at: string;
}

export interface CyclePhase {
  name: string;
  emoji: string;
  message: string;
}
