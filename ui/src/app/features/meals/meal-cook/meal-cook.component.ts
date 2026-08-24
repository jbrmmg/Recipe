import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SlicePipe } from '@angular/common';
import { MealService } from '../../../services/meal.service';
import { RecipeService } from '../../../services/recipe.service';
import { MealDetail, MealRecipeItem } from '../../../models/meal.model';
import { RecipeDetail, RecipeIngredient, RecipeStep } from '../../../models/recipe.model';
import { MEASUREMENT_UNITS } from '../../../models/ingredient.model';

const UNIT_SHORT: Record<string, string> = Object.fromEntries(
  MEASUREMENT_UNITS.map(u => [u.value, u.short])
);

const RECIPE_COLORS = [
  { bg: '#e3f2fd', text: '#1565c0' },
  { bg: '#fff3e0', text: '#e65100' },
  { bg: '#f3e5f5', text: '#6a1b9a' },
  { bg: '#e8f5e9', text: '#2e7d32' },
  { bg: '#fce4ec', text: '#c62828' },
];

export interface CookStep {
  recipeIndex: number;
  recipeTitle: string;
  color: { bg: string; text: string };
  step: RecipeStep;
  absoluteStart: number;
  scaledIngredients: (RecipeIngredient & { scaledQty: number })[];
  isRecipeStart: boolean;
}

@Component({
  selector: 'app-meal-cook',
  imports: [
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatProgressBarModule,
    SlicePipe,
  ],
  templateUrl: './meal-cook.component.html',
  styleUrl: './meal-cook.component.scss',
})
export class MealCookComponent implements OnInit, OnDestroy {
  private mealService = inject(MealService);
  private recipeService = inject(RecipeService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  loading = signal(true);
  meal = signal<MealDetail | null>(null);
  recipes = signal<RecipeDetail[]>([]);
  screen = signal<'setup' | 'cooking' | 'done'>('setup');
  timeline = signal<CookStep[]>([]);
  currentIndex = signal(0);
  showIngredients = signal(false);

  // Timer
  remaining = signal(0);
  timerRunning = signal(false);
  timerDone = signal(false);
  private timerHandle: ReturnType<typeof setInterval> | null = null;
  private wakeLock: any = null;

  currentStep = computed(() => this.timeline()[this.currentIndex()] ?? null);
  progress = computed(() => {
    const t = this.timeline().length;
    return t ? ((this.currentIndex() + 1) / t) * 100 : 0;
  });
  timerDisplay = computed(() => {
    const s = this.remaining();
    return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  });

  ngOnInit() {
    const mealId = +this.route.snapshot.paramMap.get('id')!;
    this.mealService.getById(mealId).subscribe({
      next: meal => {
        this.meal.set(meal);
        if (meal.recipes.length === 0) {
          this.snackBar.open('This meal has no recipes.', 'Close', { duration: 3000 });
          this.router.navigate(['/meals']);
          return;
        }
        const recipe$s = meal.recipes.map(r => this.recipeService.getById(r.recipeId));
        forkJoin(recipe$s).subscribe({
          next: recipes => {
            this.recipes.set(recipes);
            this.loading.set(false);
          },
          error: () => {
            this.snackBar.open('Failed to load recipes', 'Close', { duration: 3000 });
            this.router.navigate(['/meals']);
          },
        });
      },
      error: () => {
        this.snackBar.open('Failed to load meal', 'Close', { duration: 3000 });
        this.router.navigate(['/meals']);
      },
    });
  }

  ngOnDestroy() {
    this.stopTimer();
    this.wakeLock?.release();
  }

  // ── Timeline building ────────────────────────────────────────────────

  async startCooking() {
    const meal = this.meal()!;
    const recipes = this.recipes();

    const durations = recipes.map((recipe, i) => {
      const timed = recipe.steps.filter(s => s.phase === 'COOK').reduce((s, st) => s + (st.durationSeconds || 0), 0);
      if (timed > 0) return timed;
      const mr = meal.recipes[i];
      return (mr.recipeCookTime || 0) * 60;
    });

    const maxDuration = Math.max(0, ...durations);

    const steps: CookStep[] = [];

    recipes.forEach((recipe, ri) => {
      const mr = meal.recipes[ri];
      const dur = durations[ri];
      const startOffset = dur === 0 ? 0 : Math.max(0, maxDuration - dur);
      const scaleFactor = mr.servings / recipe.baseServings;
      const color = RECIPE_COLORS[ri % RECIPE_COLORS.length];

      const scaledIngredients = recipe.ingredients.map(ing => ({
        ...ing,
        scaledQty: Math.round(ing.quantity * scaleFactor * 100) / 100,
      }));

      const ordered = [
        ...recipe.steps.filter(s => s.phase === 'PREP').sort((a, b) => a.stepOrder - b.stepOrder),
        ...recipe.steps.filter(s => s.phase === 'COOK').sort((a, b) => a.stepOrder - b.stepOrder),
      ];

      let accum = 0;
      ordered.forEach((step, si) => {
        steps.push({
          recipeIndex: ri,
          recipeTitle: recipe.title,
          color,
          step,
          absoluteStart: startOffset + accum,
          scaledIngredients,
          isRecipeStart: si === 0 && startOffset > 0,
        });
        accum += step.durationSeconds || 0;
      });
    });

    steps.sort((a, b) =>
      a.absoluteStart !== b.absoluteStart
        ? a.absoluteStart - b.absoluteStart
        : a.recipeIndex - b.recipeIndex
    );

    if (steps.length === 0) {
      this.snackBar.open('No steps found — add steps to the recipes first.', 'Close', { duration: 3000 });
      return;
    }

    this.timeline.set(steps);
    this.currentIndex.set(0);
    this.syncTimer();
    this.screen.set('cooking');
    this.showIngredients.set(false);

    try {
      if ('wakeLock' in navigator) this.wakeLock = await (navigator as any).wakeLock.request('screen');
    } catch { /* ignore */ }
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  }

  // ── Navigation ───────────────────────────────────────────────────────

  prevStep() {
    this.stopTimer();
    this.currentIndex.update(i => i - 1);
    this.syncTimer();
    this.showIngredients.set(false);
  }

  nextStep() {
    this.stopTimer();
    if (this.currentIndex() < this.timeline().length - 1) {
      this.currentIndex.update(i => i + 1);
      this.syncTimer();
      this.showIngredients.set(false);
    } else {
      this.screen.set('done');
      this.wakeLock?.release();
      this.wakeLock = null;
    }
  }

  private syncTimer() {
    const step = this.currentStep();
    this.remaining.set(step?.step.durationSeconds ?? 0);
    this.timerRunning.set(false);
    this.timerDone.set(false);
  }

  // ── Timer ────────────────────────────────────────────────────────────

  startTimer() {
    if (this.timerRunning() || this.remaining() <= 0) return;
    this.timerRunning.set(true);
    this.timerHandle = setInterval(() => {
      const r = this.remaining() - 1;
      this.remaining.set(r);
      if (r <= 0) {
        this.stopTimer();
        this.timerDone.set(true);
        this.onTimerComplete();
      }
    }, 1000);
  }

  pauseTimer() { this.stopTimer(); }

  resetTimer() {
    this.stopTimer();
    this.timerDone.set(false);
    this.remaining.set(this.currentStep()?.step.durationSeconds ?? 0);
  }

  private stopTimer() {
    if (this.timerHandle !== null) { clearInterval(this.timerHandle); this.timerHandle = null; }
    this.timerRunning.set(false);
  }

  private onTimerComplete() {
    this.playBeep();
    const cs = this.currentStep();
    if (cs?.step.timerRequired && 'Notification' in window && Notification.permission === 'granted') {
      new Notification(`${cs.recipeTitle} — timer done! ⏰`, {
        body: cs.step.description.substring(0, 80),
        icon: '/favicon.ico',
      });
    }
  }

  private playBeep() {
    try {
      const ctx = new AudioContext();
      [0, 0.45, 0.9].forEach(delay => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.value = 880;
        osc.start(ctx.currentTime + delay);
        gain.gain.setValueAtTime(0.7, ctx.currentTime + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.35);
        osc.stop(ctx.currentTime + delay + 0.35);
      });
    } catch { /* ignore */ }
  }

  // ── Formatting ───────────────────────────────────────────────────────

  formatQty(qty: number): string {
    return qty % 1 === 0 ? qty.toString() : parseFloat(qty.toFixed(2)).toString();
  }

  unitShort(unit: string): string { return UNIT_SHORT[unit] ?? ''; }

  formatOffset(seconds: number): string {
    if (seconds <= 0) return '';
    const m = Math.round(seconds / 60);
    if (m < 60) return `${m} min`;
    const h = Math.floor(m / 60);
    const rem = m % 60;
    return rem ? `${h}h ${rem}m` : `${h}h`;
  }

  back() { this.router.navigate(['/meals']); }
}
