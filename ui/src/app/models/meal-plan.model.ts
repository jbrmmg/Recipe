export interface MealPlanEntry {
  id?: number;
  mealId: number;
  mealName?: string;
  dayLabel?: string;
  displayOrder: number;
}

export interface MealPlanSummary {
  id: number;
  name: string;
  date: string;
  entryCount: number;
}

export interface MealPlanDetail {
  id: number;
  name: string;
  date: string;
  entries: MealPlanEntry[];
}
