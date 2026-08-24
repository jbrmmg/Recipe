import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'recipes', pathMatch: 'full' },
  {
    path: 'recipes',
    loadComponent: () => import('./features/recipes/recipe-list/recipe-list.component')
      .then(m => m.RecipeListComponent)
  },
  {
    path: 'recipes/new',
    loadComponent: () => import('./features/recipes/recipe-form/recipe-form.component')
      .then(m => m.RecipeFormComponent)
  },
  {
    path: 'recipes/:id/edit',
    loadComponent: () => import('./features/recipes/recipe-form/recipe-form.component')
      .then(m => m.RecipeFormComponent)
  },
  {
    path: 'recipes/:id/cook',
    loadComponent: () => import('./features/recipes/cook/cook.component')
      .then(m => m.CookComponent)
  },
  {
    path: 'recipes/:id',
    loadComponent: () => import('./features/recipes/recipe-detail/recipe-detail.component')
      .then(m => m.RecipeDetailComponent)
  },
  {
    path: 'meal-plans',
    loadComponent: () => import('./features/meal-plans/meal-plan-list/meal-plan-list.component')
      .then(m => m.MealPlanListComponent)
  },
  {
    path: 'meal-plans/new',
    loadComponent: () => import('./features/meal-plans/meal-plan-form/meal-plan-form.component')
      .then(m => m.MealPlanFormComponent)
  },
  {
    path: 'meal-plans/:id/edit',
    loadComponent: () => import('./features/meal-plans/meal-plan-form/meal-plan-form.component')
      .then(m => m.MealPlanFormComponent)
  },
  {
    path: 'meal-plans/:id/cook',
    loadComponent: () => import('./features/meal-plans/meal-plan-cook/meal-plan-cook.component')
      .then(m => m.MealPlanCookComponent)
  },
  {
    path: 'shopping/:id',
    loadComponent: () => import('./features/meal-plans/shopping-list/shopping-list.component')
      .then(m => m.ShoppingListComponent)
  },
  {
    path: 'shopping-lists',
    loadComponent: () => import('./features/shopping-lists/shopping-lists.component')
      .then(m => m.ShoppingListsComponent)
  },
  {
    path: 'meals',
    loadComponent: () => import('./features/meals/meal-list/meal-list.component')
      .then(m => m.MealListComponent)
  },
  {
    path: 'meals/new',
    loadComponent: () => import('./features/meals/meal-form/meal-form.component')
      .then(m => m.MealFormComponent)
  },
  {
    path: 'meals/:id/cook',
    loadComponent: () => import('./features/meals/meal-cook/meal-cook.component')
      .then(m => m.MealCookComponent)
  },
  {
    path: 'meals/:id/edit',
    loadComponent: () => import('./features/meals/meal-form/meal-form.component')
      .then(m => m.MealFormComponent)
  },
  {
    path: 'ingredients',
    loadComponent: () => import('./features/ingredients/ingredient-list/ingredient-list.component')
      .then(m => m.IngredientListComponent)
  },
  {
    path: 'tags',
    loadComponent: () => import('./features/tags/tag-list/tag-list.component')
      .then(m => m.TagListComponent)
  },
];
