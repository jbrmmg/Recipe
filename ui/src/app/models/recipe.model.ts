export interface RecipeSummary {
  id: number;
  title: string;
  description?: string;
  baseServings: number;
  prepTime?: number;
  cookTime?: number;
  imagePath?: string;
  tags: string[];
}

export interface RecipeIngredient {
  ingredientId: number;
  ingredientName: string;
  quantity: number;
  unit: string;
  notes?: string;
}

export interface RecipeStep {
  id: number;
  phase: 'PREP' | 'COOK';
  stepOrder: number;
  parallelGroup?: number;
  description: string;
  durationSeconds?: number;
  timerRequired: boolean;
}

export interface RecipeDetail extends RecipeSummary {
  ingredients: RecipeIngredient[];
  steps: RecipeStep[];
  createdDate: string;
  lastModifiedDate: string;
}
