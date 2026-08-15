import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'recipes', pathMatch: 'full' },
  {
    path: 'recipes',
    loadComponent: () => import('./features/recipes/recipe-list/recipe-list.component')
      .then(m => m.RecipeListComponent)
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
