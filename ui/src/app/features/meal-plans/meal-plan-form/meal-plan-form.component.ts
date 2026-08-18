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
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatSnackBar } from '@angular/material/snack-bar';
import { forkJoin } from 'rxjs';
import { MealPlanService } from '../../../services/meal-plan.service';
import { MealService } from '../../../services/meal.service';
import { MealSummary } from '../../../models/meal.model';
import { MealPlanEntry } from '../../../models/meal-plan.model';

@Component({
  selector: 'app-meal-plan-form',
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
    MatDatepickerModule,
  ],
  templateUrl: './meal-plan-form.component.html',
  styleUrl: './meal-plan-form.component.scss',
})
export class MealPlanFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private mealPlanService = inject(MealPlanService);
  private mealService = inject(MealService);
  private snackBar = inject(MatSnackBar);

  loading = signal(true);
  saving = signal(false);
  isEdit = signal(false);
  planId = signal<number | null>(null);
  allMeals = signal<MealSummary[]>([]);

  form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    date: [null as Date | null, Validators.required],
    entries: this.fb.array([]),
  });

  get entriesArray(): FormArray { return this.form.get('entries') as FormArray; }
  get entryGroups(): FormGroup[] { return this.entriesArray.controls as FormGroup[]; }

  ngOnInit() {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.isEdit.set(true);
      this.planId.set(+idParam);
    }

    const load$ = this.isEdit()
      ? forkJoin({ meals: this.mealService.getAll(), plan: this.mealPlanService.getById(this.planId()!) })
      : forkJoin({ meals: this.mealService.getAll() });

    load$.subscribe({
      next: (result: any) => {
        this.allMeals.set(result.meals.sort((a: MealSummary, b: MealSummary) => a.name.localeCompare(b.name)));
        if (result.plan) {
          this.form.patchValue({
            name: result.plan.name,
            date: result.plan.date ? this.parseLocalDate(result.plan.date) : null,
          });
          result.plan.entries.forEach((e: MealPlanEntry) => this.addEntry(e));
        }
        this.loading.set(false);
      },
      error: () => {
        this.snackBar.open('Failed to load data', 'Close', { duration: 3000 });
        this.router.navigate(['/meal-plans']);
      },
    });
  }

  private mealSelectedValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const v = control.value;
      if (!v || typeof v !== 'object' || !v.id) return { mealNotSelected: true };
      return null;
    };
  }

  private makeEntryGroup(data?: MealPlanEntry): FormGroup {
    const matched = data ? this.allMeals().find(m => m.id === data.mealId) ?? null : null;
    return this.fb.group({
      meal: [matched, [Validators.required, this.mealSelectedValidator()]],
      dayLabel: [data?.dayLabel ?? ''],
    });
  }

  addEntry(data?: MealPlanEntry) {
    this.entriesArray.push(this.makeEntryGroup(data));
  }

  removeEntry(i: number) {
    this.entriesArray.removeAt(i);
  }

  moveEntry(i: number, dir: -1 | 1) {
    const target = i + dir;
    if (target < 0 || target >= this.entriesArray.length) return;
    const a = this.entriesArray.at(i);
    const b = this.entriesArray.at(target);
    this.entriesArray.setControl(i, b);
    this.entriesArray.setControl(target, a);
  }

  displayMeal(m: MealSummary | null): string {
    return m?.name ?? '';
  }

  filterMeals(value: MealSummary | string | null): MealSummary[] {
    if (!value) return this.allMeals();
    const term = typeof value === 'string' ? value : value.name;
    return this.allMeals().filter(m => m.name.toLowerCase().includes(term.toLowerCase()));
  }

  onMealSelected(event: MatAutocompleteSelectedEvent, i: number) {
    const meal = event.option.value as MealSummary;
    (this.entriesArray.at(i) as FormGroup).patchValue({ meal });
  }

  private parseLocalDate(dateStr: string): Date {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.snackBar.open('Please fill in all required fields', 'Close', { duration: 3000 });
      return;
    }

    this.saving.set(true);
    const v = this.form.getRawValue();

    const d = v.date as Date;
    const dateStr = d
      ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      : undefined;

    const payload = {
      name: v.name!,
      date: dateStr,
      entries: (v.entries as any[]).map((e, i) => ({
        mealId: (e.meal as MealSummary)?.id,
        dayLabel: e.dayLabel || undefined,
        displayOrder: i + 1,
      })),
    };

    const request = this.isEdit()
      ? this.mealPlanService.update(this.planId()!, payload)
      : this.mealPlanService.create(payload);

    request.subscribe({
      next: () => {
        this.snackBar.open('Meal plan saved', 'Close', { duration: 2000 });
        this.router.navigate(['/meal-plans']);
      },
      error: () => {
        this.snackBar.open('Failed to save meal plan', 'Close', { duration: 3000 });
        this.saving.set(false);
      },
    });
  }

  cancel() {
    this.router.navigate(['/meal-plans']);
  }
}
