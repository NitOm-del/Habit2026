import { Habit } from './types';

// Default template for a brand new user (no history)
export const DEFAULT_HABITS_TEMPLATE: Omit<Habit, 'checks'>[] = [
  { id: '1', name: 'Wake up at 05:00', icon: '⏰', goal: 30 },
  { id: '2', name: 'Gym', icon: '💪', goal: 30 },
  { id: '3', name: 'Reading / Learning', icon: '📖', goal: 30 },
  { id: '4', name: 'Day Planning', icon: '📝', goal: 30 },
  { id: '5', name: 'Budget Tracking', icon: '💰', goal: 30 },
  { id: '6', name: 'Project Work', icon: '🚀', goal: 30 },
  { id: '7', name: 'No Alcohol', icon: '🍷', goal: 30 },
  { id: '8', name: 'Social Media Detox', icon: '🌿', goal: 30 },
  { id: '9', name: 'Goal Journaling', icon: '📔', goal: 30 },
  { id: '10', name: 'Cold Shower', icon: '🚿', goal: 30 },
];

export const DAYS_OF_WEEK = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
