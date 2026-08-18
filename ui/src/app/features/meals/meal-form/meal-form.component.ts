import { Component, OnInit, inject, signal } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MealService } from '../../../services/meal.service';
import { RecipeService } from '../../../services/recipe.service';
import { RecipeSummary } from '../../../models/recipe.model';
import { MealRecipeItem } from '../../../models/meal.model';

@Component({
  selector: 'app-meal-form',
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatAutocompleteModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatTooltipModule,
  ],
  templateUrl: './meal-form.component.html',
  styleUrl: './meal-form.component.scss',
})
export class MealFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private mealService = inject(MealService);
  private recipeService = inject(RecipeService);
  private snackBar = inject(MatSnackBar);

  loading = signal(true);
  saving = signal(false);
  isEdit = signal(false);
  mealId = signal<number | null>(null);
  allRecipes = signal<RecipeSummary[]>([]);

  form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    notes: [''],
    recipes: this.fb.array([]),
  });

  get recipesArray(): FormArray { return this.form.get('recipes') as FormArray; }
  get recipeGroups(): FormGroup[] { return this.recipesArray.controls as FormGroup[]; }

  ngOnInit() {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.isEdit.set(true);
      this.mealId.set(+idParam);
    }

    this.recipeService.getAll().subscribe({
      next: recipes => {
        this.allRecipes.set(recipes.sort((a, b) => a.title.localeCompare(b.title)));

        if (this.isEdit()) {
          this.mealService.getById(this.mealId()!).subscribe({
            next: meal => {
              this.form.patchValue({ name: meal.name, notes: meal.notes ?? '' });
              meal.recipes.forEach(r => this.addRecipe(r));
              this.loading.set(false);
            },
            error: () => {
              this.snackBar.open('Failed to load meal', 'Close', { duration: 3000 });
              this.router.navigate(['/meals']);
            },
          });
        } else {
          this.loading.set(false);
        }
      },
      error: () => {
        this.snackBar.open('Failed to load recipes', 'Close', { duration: 3000 });
        this.loading.set(false);
      },
    });
  }

  private recipeSelectedValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const v = control.value;
      if (!v || typeof v !== 'object' || !v.id) return { recipeNotSelected: true };
      return null;
    };
  }

  private makeRecipeGroup(data?: MealRecipeItem): FormGroup {
    const matched = data
      ? this.allRecipes().find(r => r.id === data.recipeId) ?? null
      : null;
    return this.fb.group({
      recipe: [matched, [Validators.required, this.recipeSelectedValidator()]],
      servings: [data?.servings ?? (matched?.baseServings ?? 4), [Validators.required, Validators.min(1)]],
    });
  }

  addRecipe(data?: MealRecipeItem) {
    this.recipesArray.push(this.makeRecipeGroup(data));
  }

  removeRecipe(i: number) {
    this.recipesArray.removeAt(i);
  }

  moveRecipe(i: number, dir: -1 | 1) {
    const target = i + dir;
    if (target < 0 || target >= this.recipesArray.length) return;
    const a = this.recipesArray.at(i);
    const b = this.recipesArray.at(target);
    this.recipesArray.setControl(i, b);
    this.recipesArray.setControl(target, a);
  }

  displayRecipe(r: RecipeSummary | null): string {
    return r?.title ?? '';
  }

  filterRecipes(value: RecipeSummary | string | null): RecipeSummary[] {
    if (!value) return this.allRecipes();
    const term = typeof value === 'string' ? value : value.title;
    return this.allRecipes().filter(r => r.title.toLowerCase().includes(term.toLowerCase()));
  }

  onRecipeSelected(event: MatAutocompleteSelectedEvent, i: number) {
    const recipe = event.option.value as RecipeSummary;
    const group = this.recipesArray.at(i) as FormGroup;
    group.patchValue({ recipe, servings: recipe.baseServings });
  }

  save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.snackBar.open('Please fill in all required fields', 'Close', { duration: 3000 });
      return;
    }

    this.saving.set(true);
    const v = this.form.getRawValue();

    const payload = {
      name: v.name!,
      notes: v.notes || undefined,
      recipes: (v.recipes as any[]).map((r, i) => ({
        recipeId: (r.recipe as RecipeSummary)?.id,
        servings: r.servings,
        displayOrder: i + 1,
      })),
    };

    const request = this.isEdit()
      ? this.mealService.update(this.mealId()!, payload)
      : this.mealService.create(payload);

    request.subscribe({
      next: () => {
        this.snackBar.open('Meal saved', 'Close', { duration: 2000 });
        this.router.navigate(['/meals']);
      },
      error: () => {
        this.snackBar.open('Failed to save meal', 'Close', { duration: 3000 });
        this.saving.set(false);
      },
    });
  }

  cancel() {
    this.router.navigate(['/meals']);
  }
}
