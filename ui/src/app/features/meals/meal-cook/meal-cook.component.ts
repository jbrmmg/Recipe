import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { forkJoin } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MealService } from '../../../services/meal.service';
import { RecipeService } from '../../../services/recipe.service';
import { MealDetail } from '../../../models/meal.model';
import { RecipeDetail, RecipeStep } from '../../../models/recipe.model';
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

interface PrepStep { key: string; description: string; }
interface PrepGroup { recipeId: number; title: string; color: { bg: string; text: string }; steps: PrepStep[]; }
interface StepBlock {
  key: string;
  absoluteStart: number;
  durationSeconds: number;
  steps: RecipeStep[];
  isParallelGroup: boolean;
}
interface GanttRecipe {
  recipeId: number;
  title: string;
  color: { bg: string; text: string };
  startOffset: number;
  totalDuration: number;
  blocks: StepBlock[];
}

@Component({
  selector: 'app-meal-cook',
  imports: [MatButtonModule, MatIconModule, MatProgressSpinnerModule, MatCheckboxModule],
  templateUrl: './meal-cook.component.html',
  styleUrl: './meal-cook.component.scss',
})
export class MealCookComponent implements OnInit, OnDestroy {
  private mealService   = inject(MealService);
  private recipeService = inject(RecipeService);
  private route         = inject(ActivatedRoute);
  private router        = inject(Router);
  private snackBar      = inject(MatSnackBar);

  loading = signal(true);
  meal    = signal<MealDetail | null>(null);
  recipes = signal<RecipeDetail[]>([]);

  screen    = signal<'setup' | 'main' | 'done'>('setup');
  activeTab = signal<'prep' | 'cook'>('prep');

  // Prep checklist
  prepChecked = signal<Set<string>>(new Set());

  // Running clock
  cookStartTime = signal<number | null>(null);
  elapsedSeconds = signal(0);
  private clockHandle: ReturnType<typeof setInterval> | null = null;

  // Per-step countdown timer
  timerKey       = signal<string | null>(null);
  timerRemaining = signal(0);
  timerRunning   = signal(false);
  timerDone      = signal(false);
  private timerHandle: ReturnType<typeof setInterval> | null = null;

  private wakeLock: any = null;

  // ── Computed ─────────────────────────────────────────────────────────

  cookingStarted = computed(() => this.cookStartTime() !== null);

  clockDisplay = computed(() => {
    const s = this.elapsedSeconds();
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return h > 0
      ? `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
      : `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  });

  timerDisplay = computed(() => {
    const r = this.timerRemaining();
    return `${String(Math.floor(r / 60)).padStart(2, '0')}:${String(r % 60).padStart(2, '0')}`;
  });

  recipeColors = computed(() => this.recipes().map((_, i) => RECIPE_COLORS[i % RECIPE_COLORS.length]));

  prepGroups = computed<PrepGroup[]>(() =>
    this.recipes()
      .map((recipe, i) => ({
        recipeId: recipe.id,
        title: recipe.title,
        color: RECIPE_COLORS[i % RECIPE_COLORS.length],
        steps: recipe.steps
          .filter(s => s.phase === 'PREP')
          .sort((a, b) => a.stepOrder - b.stepOrder)
          .map(s => ({ key: `prep-${recipe.id}-${s.id ?? s.stepOrder}`, description: s.description })),
      }))
      .filter(g => g.steps.length > 0)
  );

  prepOutstanding = computed(() => {
    const checked = this.prepChecked();
    return this.prepGroups().reduce((n, g) => n + g.steps.filter(s => !checked.has(s.key)).length, 0);
  });

  ganttRecipes = computed<GanttRecipe[]>(() => {
    const recipes = this.recipes();
    const meal    = this.meal();
    if (!meal || recipes.length === 0) return [];

    const data = recipes.map((recipe, i) => {
      const cookSteps = recipe.steps.filter(s => s.phase === 'COOK').sort((a, b) => a.stepOrder - b.stepOrder);
      return { recipe, cookSteps, duration: this.calcCookDuration(cookSteps), color: RECIPE_COLORS[i % RECIPE_COLORS.length] };
    }).filter(d => d.cookSteps.length > 0);

    if (data.length === 0) return [];

    const maxDuration = Math.max(...data.map(d => d.duration));

    return data.map(({ recipe, cookSteps, duration, color }) => {
      const startOffset = maxDuration - duration;
      return {
        recipeId: recipe.id,
        title: recipe.title,
        color,
        startOffset,
        totalDuration: duration,
        blocks: this.buildBlocks(cookSteps, startOffset),
      };
    });
  });

  totalDurationSeconds = computed(() =>
    this.ganttRecipes().length === 0 ? 0
      : Math.max(...this.ganttRecipes().map(r => r.startOffset + r.totalDuration))
  );

  // ── Lifecycle ────────────────────────────────────────────────────────

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
        forkJoin(meal.recipes.map(r => this.recipeService.getById(r.recipeId))).subscribe({
          next: recipes => { this.recipes.set(recipes); this.loading.set(false); },
          error: () => { this.snackBar.open('Failed to load recipes', 'Close', { duration: 3000 }); this.router.navigate(['/meals']); },
        });
      },
      error: () => { this.snackBar.open('Failed to load meal', 'Close', { duration: 3000 }); this.router.navigate(['/meals']); },
    });
  }

  ngOnDestroy() {
    this.stopClock();
    this.stopTimer();
    this.wakeLock?.release();
  }

  // ── Screen navigation ────────────────────────────────────────────────

  async startSession() {
    this.screen.set('main');
    try {
      if ('wakeLock' in navigator) this.wakeLock = await (navigator as any).wakeLock.request('screen');
    } catch { /* ignore */ }
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }

  finish() {
    this.screen.set('done');
    this.stopClock();
    this.stopTimer();
    this.wakeLock?.release();
    this.wakeLock = null;
  }

  back() { this.router.navigate(['/meals']); }

  // ── Clock ────────────────────────────────────────────────────────────

  startCooking() {
    if (this.cookingStarted()) return;
    this.cookStartTime.set(Date.now());
    this.clockHandle = setInterval(() => {
      this.elapsedSeconds.set(Math.floor((Date.now() - this.cookStartTime()!) / 1000));
    }, 1000);
  }

  private stopClock() {
    if (this.clockHandle !== null) { clearInterval(this.clockHandle); this.clockHandle = null; }
  }

  // ── Prep checklist ───────────────────────────────────────────────────

  isPrepChecked(key: string) { return this.prepChecked().has(key); }

  togglePrep(key: string) {
    const next = new Set(this.prepChecked());
    if (next.has(key)) next.delete(key); else next.add(key);
    this.prepChecked.set(next);
  }

  // ── Step timer ───────────────────────────────────────────────────────

  tapBlock(block: StepBlock) {
    if (block.durationSeconds <= 0) return;
    if (this.timerKey() === block.key) {
      this.timerRunning() ? this.pauseTimer() : this.resumeTimer();
      return;
    }
    this.stopTimer();
    this.timerKey.set(block.key);
    this.timerRemaining.set(block.durationSeconds);
    this.timerDone.set(false);
    this.timerRunning.set(true);
    this.runTimerTick();
  }

  toggleBlockTimer() { this.timerRunning() ? this.pauseTimer() : this.resumeTimer(); }

  resetBlockTimer() {
    this.stopTimer();
    this.timerKey.set(null);
    this.timerRemaining.set(0);
    this.timerDone.set(false);
  }

  private pauseTimer() {
    if (this.timerHandle !== null) { clearInterval(this.timerHandle); this.timerHandle = null; }
    this.timerRunning.set(false);
  }

  private resumeTimer() {
    if (this.timerRunning() || this.timerRemaining() <= 0) return;
    this.timerRunning.set(true);
    this.runTimerTick();
  }

  private runTimerTick() {
    this.timerHandle = setInterval(() => {
      const next = this.timerRemaining() - 1;
      if (next <= 0) {
        this.timerRemaining.set(0);
        this.timerDone.set(true);
        this.timerRunning.set(false);
        clearInterval(this.timerHandle!);
        this.timerHandle = null;
        this.playBeep();
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Timer done! ⏰');
        }
      } else {
        this.timerRemaining.set(next);
      }
    }, 1000);
  }

  private stopTimer() {
    if (this.timerHandle !== null) { clearInterval(this.timerHandle); this.timerHandle = null; }
    this.timerRunning.set(false);
  }

  // ── Block state ──────────────────────────────────────────────────────

  isBlockActive(block: StepBlock): boolean {
    if (!this.cookingStarted() || block.durationSeconds === 0) return false;
    const e = this.elapsedSeconds();
    return e >= block.absoluteStart && e < block.absoluteStart + block.durationSeconds;
  }

  isBlockPast(block: StepBlock): boolean {
    if (!this.cookingStarted() || block.durationSeconds === 0) return false;
    return this.elapsedSeconds() >= block.absoluteStart + block.durationSeconds;
  }

  // ── Helpers ──────────────────────────────────────────────────────────

  private calcCookDuration(steps: RecipeStep[]): number {
    const parallelMax = new Map<number, number>();
    let total = 0;
    for (const s of steps) {
      if (s.parallelGroup == null) {
        total += s.durationSeconds;
      } else {
        parallelMax.set(s.parallelGroup, Math.max(parallelMax.get(s.parallelGroup) ?? 0, s.durationSeconds));
      }
    }
    for (const v of parallelMax.values()) total += v;
    return total;
  }

  private buildBlocks(steps: RecipeStep[], startOffset: number): StepBlock[] {
    const blocks: StepBlock[] = [];
    let accum = startOffset;
    const handled = new Set<number>();

    for (let i = 0; i < steps.length; i++) {
      if (handled.has(i)) continue;
      const step = steps[i];

      if (step.parallelGroup == null) {
        blocks.push({ key: `step-${step.id ?? i}-${accum}`, absoluteStart: accum, durationSeconds: step.durationSeconds, steps: [step], isParallelGroup: false });
        accum += step.durationSeconds;
        handled.add(i);
      } else {
        const groupIdxs = steps.map((s, idx) => ({ s, idx })).filter(({ s }) => s.parallelGroup === step.parallelGroup).map(({ idx }) => idx);
        const groupSteps = groupIdxs.map(idx => steps[idx]);
        groupIdxs.forEach(idx => handled.add(idx));
        const maxDur = Math.max(...groupSteps.map(s => s.durationSeconds));
        blocks.push({ key: `parallel-${step.parallelGroup}-${accum}`, absoluteStart: accum, durationSeconds: maxDur, steps: groupSteps, isParallelGroup: true });
        accum += maxDur;
      }
    }
    return blocks;
  }

  blockHeight(seconds: number): number { return Math.max(80, seconds * 0.5); }
  waitHeight(seconds: number): number  { return Math.max(56, seconds * 0.5); }

  formatDuration(seconds: number): string {
    if (seconds <= 0) return '';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    if (m === 0) return `${s}s`;
    if (s === 0) return `${m}m`;
    return `${m}m ${s}s`;
  }

  recipeCookDisplay(recipe: RecipeDetail): string {
    return this.formatDuration(this.calcCookDuration(recipe.steps.filter(s => s.phase === 'COOK')));
  }

  prepCount(recipe: RecipeDetail): number { return recipe.steps.filter(s => s.phase === 'PREP').length; }

  formatQty(qty: number): string { return qty % 1 === 0 ? `${qty}` : parseFloat(qty.toFixed(2)).toString(); }
  unitShort(unit: string): string { return UNIT_SHORT[unit] ?? ''; }

  private playBeep() {
    try {
      const ctx = new AudioContext();
      [0, 0.45, 0.9].forEach(delay => {
        const osc  = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.type = 'sine'; osc.frequency.value = 880;
        osc.start(ctx.currentTime + delay);
        gain.gain.setValueAtTime(0.7, ctx.currentTime + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.35);
        osc.stop(ctx.currentTime + delay + 0.35);
      });
    } catch { /* ignore */ }
  }
}
