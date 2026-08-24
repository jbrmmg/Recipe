export interface MealRecipeItem {
  id?: number;
  recipeId: number;
  recipeTitle?: string;
  recipeCookTime?: number;
  recipeBaseServings?: number;
  servings: number;
  displayOrder: number;
}

export interface MealSummary {
  id: number;
  name: string;
  notes?: string;
  recipeCount: number;
}

export interface MealDetail {
  id: number;
  name: string;
  notes?: string;
  recipes: MealRecipeItem[];
}
