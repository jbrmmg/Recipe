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

export interface ShoppingListItem {
  ingredientId: number;
  ingredientName: string;
  category: string;
  unit: string;
  quantity: number;
}

export interface ShoppingList {
  planName: string;
  date: string;
  items: ShoppingListItem[];
}
