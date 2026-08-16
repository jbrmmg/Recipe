import { Component, OnInit, inject, signal } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { forkJoin } from 'rxjs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RecipeService } from '../../../services/recipe.service';
import { TagService } from '../../../services/tag.service';
import { IngredientService } from '../../../services/ingredient.service';
import { Tag } from '../../../models/tag.model';
import { Ingredient, MEASUREMENT_UNITS } from '../../../models/ingredient.model';
import { RecipeIngredient, RecipeStep } from '../../../models/recipe.model';

@Component({
  selector: 'app-recipe-form',
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatCheckboxModule,
    MatChipsModule,
    MatAutocompleteModule,
    MatCardModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
  ],
  templateUrl: './recipe-form.component.html',
  styleUrl: './recipe-form.component.scss',
})
export class RecipeFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private recipeService = inject(RecipeService);
  private tagService = inject(TagService);
  private ingredientService = inject(IngredientService);
  private snackBar = inject(MatSnackBar);

  loading = signal(true);
  saving = signal(false);
  isEdit = signal(false);
  recipeId = signal<number | null>(null);

  tags = signal<Tag[]>([]);
  allIngredients = signal<Ingredient[]>([]);
  readonly units = MEASUREMENT_UNITS;

  form = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(2)]],
    description: [''],
    baseServings: [4, [Validators.required, Validators.min(1)]],
    prepTime: [null as number | null],
    cookTime: [null as number | null],
    tagIds: [[] as number[]],
    ingredients: this.fb.array([]),
    prepSteps: this.fb.array([]),
    cookSteps: this.fb.array([]),
  });

  get ingredientsArray(): FormArray { return this.form.get('ingredients') as FormArray; }
  get prepStepsArray(): FormArray { return this.form.get('prepSteps') as FormArray; }
  get cookStepsArray(): FormArray { return this.form.get('cookSteps') as FormArray; }

  get ingredientGroups(): FormGroup[] { return this.ingredientsArray.controls as FormGroup[]; }
  get prepStepGroups(): FormGroup[] { return this.prepStepsArray.controls as FormGroup[]; }
  get cookStepGroups(): FormGroup[] { return this.cookStepsArray.controls as FormGroup[]; }

  ngOnInit() {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.isEdit.set(true);
      this.recipeId.set(+idParam);
    }

    forkJoin({
      tags: this.tagService.getAll(),
      ingredients: this.ingredientService.getAll(),
    }).subscribe({
      next: ({ tags, ingredients }) => {
        this.tags.set(tags.sort((a, b) => a.name.localeCompare(b.name)));
        this.allIngredients.set(ingredients.sort((a, b) => a.name.localeCompare(b.name)));

        if (this.isEdit()) {
          this.recipeService.getById(this.recipeId()!).subscribe({
            next: recipe => {
              this.form.patchValue({
                title: recipe.title,
                description: recipe.description ?? '',
                baseServings: recipe.baseServings,
                prepTime: recipe.prepTime ?? null,
                cookTime: recipe.cookTime ?? null,
                tagIds: recipe.tags.map(t => t.id),
              });
              recipe.ingredients.forEach(ing => this.addIngredient(ing));
              recipe.steps.filter(s => s.phase === 'PREP').forEach(s => this.addStep('prepSteps', s));
              recipe.steps.filter(s => s.phase === 'COOK').forEach(s => this.addStep('cookSteps', s));
              this.loading.set(false);
            },
            error: () => {
              this.snackBar.open('Failed to load recipe', 'Close', { duration: 3000 });
              this.router.navigate(['/recipes']);
            },
          });
        } else {
          this.loading.set(false);
        }
      },
      error: () => {
        this.snackBar.open('Failed to load data', 'Close', { duration: 3000 });
        this.loading.set(false);
      },
    });
  }

  private makeIngredientGroup(data?: RecipeIngredient): FormGroup {
    const matched = data ? this.allIngredients().find(i => i.id === data.ingredientId) ?? null : null;
    return this.fb.group({
      ingredient: [matched, Validators.required],
      quantity: [data?.quantity ?? null, [Validators.required, Validators.min(0.001)]],
      unit: [data?.unit ?? '', Validators.required],
      notes: [data?.notes ?? ''],
    });
  }

  addIngredient(data?: RecipeIngredient) {
    this.ingredientsArray.push(this.makeIngredientGroup(data));
  }

  removeIngredient(i: number) {
    this.ingredientsArray.removeAt(i);
  }

  private makeStepGroup(data?: RecipeStep): FormGroup {
    return this.fb.group({
      description: [data?.description ?? '', Validators.required],
      durationMinutes: [data && data.durationSeconds ? Math.round(data.durationSeconds / 60) : null],
      timerRequired: [data?.timerRequired ?? false],
      parallelGroup: [data?.parallelGroup ?? null],
    });
  }

  addStep(arrayName: 'prepSteps' | 'cookSteps', data?: RecipeStep) {
    (this.form.get(arrayName) as FormArray).push(this.makeStepGroup(data));
  }

  removeStep(arrayName: 'prepSteps' | 'cookSteps', i: number) {
    (this.form.get(arrayName) as FormArray).removeAt(i);
  }

  moveStep(arrayName: 'prepSteps' | 'cookSteps', i: number, dir: -1 | 1) {
    const arr = this.form.get(arrayName) as FormArray;
    const target = i + dir;
    if (target < 0 || target >= arr.length) return;
    const a = arr.at(i);
    const b = arr.at(target);
    arr.setControl(i, b);
    arr.setControl(target, a);
  }

  isTagSelected(id: number): boolean {
    return (this.form.get('tagIds')!.value as number[]).includes(id);
  }

  toggleTag(id: number) {
    const current = this.form.get('tagIds')!.value as number[];
    this.form.get('tagIds')!.setValue(
      current.includes(id) ? current.filter(x => x !== id) : [...current, id]
    );
  }

  displayIngredient(ing: Ingredient | null): string {
    return ing?.name ?? '';
  }

  filterIngredients(value: Ingredient | string | null): Ingredient[] {
    if (!value) return this.allIngredients();
    const term = typeof value === 'string' ? value : value.name;
    return this.allIngredients().filter(i => i.name.toLowerCase().includes(term.toLowerCase()));
  }

  onIngredientSelected(event: MatAutocompleteSelectedEvent, i: number) {
    const ing = event.option.value as Ingredient;
    const group = this.ingredientsArray.at(i) as FormGroup;
    group.patchValue({ ingredient: ing, unit: ing.defaultUnit });
  }

  save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.snackBar.open('Please fill in all required fields', 'Close', { duration: 3000 });
      return;
    }

    this.saving.set(true);
    const v = this.form.getRawValue();

    const prepSteps = (v.prepSteps as any[]).map((s, idx) => ({
      phase: 'PREP',
      stepOrder: idx + 1,
      description: s.description,
      durationSeconds: s.durationMinutes ? Math.round(s.durationMinutes * 60) : 0,
      timerRequired: s.timerRequired ?? false,
      parallelGroup: s.parallelGroup ?? undefined,
    }));
    const cookSteps = (v.cookSteps as any[]).map((s, idx) => ({
      phase: 'COOK',
      stepOrder: idx + 1,
      description: s.description,
      durationSeconds: s.durationMinutes ? Math.round(s.durationMinutes * 60) : 0,
      timerRequired: s.timerRequired ?? false,
      parallelGroup: s.parallelGroup ?? undefined,
    }));

    const payload = {
      title: v.title!,
      description: v.description || undefined,
      baseServings: v.baseServings!,
      prepTime: v.prepTime ?? undefined,
      cookTime: v.cookTime ?? undefined,
      tagIds: v.tagIds ?? [],
      ingredients: (v.ingredients as any[]).map(i => ({
        ingredientId: (i.ingredient as Ingredient).id,
        quantity: i.quantity,
        unit: i.unit,
        notes: i.notes || undefined,
      })),
      steps: [...prepSteps, ...cookSteps],
    };

    const request = this.isEdit()
      ? this.recipeService.update(this.recipeId()!, payload)
      : this.recipeService.create(payload);

    request.subscribe({
      next: () => {
        this.snackBar.open('Recipe saved', 'Close', { duration: 2000 });
        this.router.navigate(['/recipes']);
      },
      error: () => {
        this.snackBar.open('Failed to save recipe', 'Close', { duration: 3000 });
        this.saving.set(false);
      },
    });
  }

  cancel() {
    this.router.navigate(['/recipes']);
  }
}
