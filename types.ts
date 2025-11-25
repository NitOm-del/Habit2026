export interface Habit {
  id: string;
  name: string;
  icon: string;
  goal: number;
  checks: boolean[]; // Array of N days
}

export interface MentalState {
  day: number;
  mood: number;
  motivation: number;
}

export interface DayConfig {
  dayNum: number;
  dayName: string; // Su, Mo, Tu, etc.
}

export interface MonthData {
  habits: Habit[];
  mentalState: MentalState[];
  lastUpdated: number;
}
