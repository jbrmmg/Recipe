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
  shoppingListId?: number;
}

export interface MealPlanDetail {
  id: number;
  name: string;
  date: string;
  shoppingListId?: number;
  entries: MealPlanEntry[];
}

export interface SavedShoppingListSummary {
  id: number;
  name: string;
  mealPlanId: number;
  createdDate: string;
  itemCount: number;
}

export interface SavedShoppingListDetail {
  id: number;
  name: string;
  mealPlanId: number;
  createdDate: string;
  items: ShoppingListItem[];
}

export interface ShoppingListItem {
  ingredientId: number;
  ingredientName: string;
  category: string;
  unit: string;
  quantity: number;
}

export interface ShoppingPlanInfo {
  name: string;
  date: string;
}

export interface ShoppingList {
  plans: ShoppingPlanInfo[];
  items: ShoppingListItem[];
}
