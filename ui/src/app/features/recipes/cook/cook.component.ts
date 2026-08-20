import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DecimalPipe } from '@angular/common';
import { RecipeService } from '../../../services/recipe.service';
import { RecipeDetail, RecipeStep } from '../../../models/recipe.model';
import { MEASUREMENT_UNITS } from '../../../models/ingredient.model';

const UNIT_SHORT: Record<string, string> = Object.fromEntries(
  MEASUREMENT_UNITS.map(u => [u.value, u.short])
);

@Component({
  selector: 'app-cook',
  imports: [
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatProgressBarModule,
    DecimalPipe,
  ],
  templateUrl: './cook.component.html',
  styleUrl: './cook.component.scss',
})
export class CookComponent implements OnInit, OnDestroy {
  private recipeService = inject(RecipeService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  loading = signal(true);
  recipe = signal<RecipeDetail | null>(null);
  screen = signal<'setup' | 'cooking' | 'done'>('setup');
  servings = signal(1);
  currentIndex = signal(0);
  showIngredients = signal(false);

  // Timer
  remaining = signal(0);
  timerRunning = signal(false);
  timerDone = signal(false);
  private timerHandle: ReturnType<typeof setInterval> | null = null;

  // Wake Lock
  private wakeLock: any = null;

  // ── Computed ────────────────────────────────────────────────────────────

  allSteps = computed<RecipeStep[]>(() => {
    const r = this.recipe();
    if (!r) return [];
    const prep = r.steps.filter(s => s.phase === 'PREP').sort((a, b) => a.stepOrder - b.stepOrder);
    const cook = r.steps.filter(s => s.phase === 'COOK').sort((a, b) => a.stepOrder - b.stepOrder);
    return [...prep, ...cook];
  });

  currentStep = computed(() => this.allSteps()[this.currentIndex()] ?? null);

  scaleFactor = computed(() => {
    const r = this.recipe();
    return r ? this.servings() / r.baseServings : 1;
  });

  scaledIngredients = computed(() => {
    const r = this.recipe();
    if (!r) return [];
    const sf = this.scaleFactor();
    return r.ingredients.map(ing => ({
      ...ing,
      quantity: Math.round(ing.quantity * sf * 100) / 100,
    }));
  });

  progress = computed(() => {
    const total = this.allSteps().length;
    return total ? ((this.currentIndex() + 1) / total) * 100 : 0;
  });

  timerDisplay = computed(() => {
    const secs = this.remaining();
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  });

  // ── Lifecycle ────────────────────────────────────────────────────────────

  ngOnInit() {
    const id = +this.route.snapshot.paramMap.get('id')!;
    this.recipeService.getById(id).subscribe({
      next: r => {
        this.recipe.set(r);
        this.servings.set(r.baseServings);
        this.loading.set(false);
      },
      error: () => this.router.navigate(['/recipes']),
    });
  }

  ngOnDestroy() {
    this.stopTimer();
    this.releaseWakeLock();
  }

  // ── Setup screen ─────────────────────────────────────────────────────────

  incrementServings() { this.servings.update(s => Math.min(s + 1, 99)); }
  decrementServings() { this.servings.update(s => Math.max(s - 1, 1)); }

  async startCooking() {
    if (this.allSteps().length === 0) {
      this.snackBar.open('No steps to cook — add steps to this recipe first.', 'Close', { duration: 3000 });
      return;
    }
    this.currentIndex.set(0);
    this.syncTimerToStep();
    this.screen.set('cooking');
    this.showIngredients.set(false);
    await this.requestWakeLock();
    await this.requestNotifications();
  }

  // ── Cooking screen ───────────────────────────────────────────────────────

  prevStep() {
    this.stopTimer();
    this.currentIndex.update(i => i - 1);
    this.syncTimerToStep();
  }

  nextStep() {
    this.stopTimer();
    if (this.currentIndex() < this.allSteps().length - 1) {
      this.currentIndex.update(i => i + 1);
      this.syncTimerToStep();
    } else {
      this.screen.set('done');
      this.releaseWakeLock();
    }
  }

  private syncTimerToStep() {
    const step = this.currentStep();
    this.remaining.set(step?.durationSeconds ?? 0);
    this.timerRunning.set(false);
    this.timerDone.set(false);
    this.showIngredients.set(false);
  }

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

  pauseTimer() {
    this.stopTimer();
  }

  resetTimer() {
    this.stopTimer();
    this.timerDone.set(false);
    this.remaining.set(this.currentStep()?.durationSeconds ?? 0);
  }

  private stopTimer() {
    if (this.timerHandle !== null) {
      clearInterval(this.timerHandle);
      this.timerHandle = null;
    }
    this.timerRunning.set(false);
  }

  private onTimerComplete() {
    this.playBeep();
    const step = this.currentStep();
    if (step?.timerRequired && 'Notification' in window && Notification.permission === 'granted') {
      new Notification('Timer done! ⏰', {
        body: step.description.substring(0, 80),
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
    } catch { /* Web Audio not available */ }
  }

  private async requestWakeLock() {
    try {
      if ('wakeLock' in navigator) {
        this.wakeLock = await (navigator as any).wakeLock.request('screen');
      }
    } catch { /* Wake Lock not available */ }
  }

  private releaseWakeLock() {
    this.wakeLock?.release();
    this.wakeLock = null;
  }

  private async requestNotifications() {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  }

  // ── Formatting ───────────────────────────────────────────────────────────

  formatQty(qty: number): string {
    if (qty % 1 === 0) return qty.toString();
    return parseFloat(qty.toFixed(2)).toString();
  }

  unitShort(unit: string): string {
    return UNIT_SHORT[unit] ?? '';
  }

  phaseLabel(step: RecipeStep): string {
    return step.phase === 'PREP' ? 'Prep' : 'Cook';
  }

  back() {
    this.router.navigate(['/recipes', this.recipe()!.id]);
  }
}
