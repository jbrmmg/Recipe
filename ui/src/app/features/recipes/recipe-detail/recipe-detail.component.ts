import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { RecipeService } from '../../../services/recipe.service';
import { RecipeDetail, RecipeStep } from '../../../models/recipe.model';
import { MEASUREMENT_UNITS } from '../../../models/ingredient.model';

@Component({
  selector: 'app-recipe-detail',
  imports: [
    MatCardModule,
    MatChipsModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDividerModule,
  ],
  templateUrl: './recipe-detail.component.html',
  styleUrl: './recipe-detail.component.scss',
})
export class RecipeDetailComponent implements OnInit {
  private recipeService = inject(RecipeService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  recipe = signal<RecipeDetail | null>(null);
  loading = signal(true);

  prepSteps = computed(() => this.recipe()?.steps.filter(s => s.phase === 'PREP') ?? []);
  cookSteps = computed(() => this.recipe()?.steps.filter(s => s.phase === 'COOK') ?? []);

  ngOnInit() {
    const id = +this.route.snapshot.paramMap.get('id')!;
    this.recipeService.getById(id).subscribe({
      next: r => {
        this.recipe.set(r);
        this.loading.set(false);
      },
      error: () => this.router.navigate(['/recipes']),
    });
  }

  edit() {
    this.router.navigate(['/recipes', this.recipe()!.id, 'edit']);
  }

  cook() {
    this.router.navigate(['/recipes', this.recipe()!.id, 'cook']);
  }

  back() {
    this.router.navigate(['/recipes']);
  }

  formatQty(qty: number): string {
    if (qty % 1 === 0) return qty.toString();
    return parseFloat(qty.toFixed(3)).toString();
  }

  unitShort(unit: string): string {
    return MEASUREMENT_UNITS.find(u => u.value === unit)?.short ?? unit.toLowerCase();
  }

  formatTime(minutes: number | undefined): string {
    if (!minutes) return '';
    if (minutes < 60) return `${minutes} min`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m ? `${h}h ${m}m` : `${h}h`;
  }

  formatDuration(seconds: number): string {
    if (!seconds) return '';
    const mins = Math.round(seconds / 60);
    if (mins < 1) return `${seconds}s`;
    if (mins < 60) return `${mins} min`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m ? `${h}h ${m}m` : `${h}h`;
  }

  parallelGroupLabel(step: RecipeStep, steps: RecipeStep[]): string {
    if (!step.parallelGroup) return '';
    const peers = steps.filter(s => s.parallelGroup === step.parallelGroup);
    return peers.length > 1 ? `Parallel group ${step.parallelGroup}` : '';
  }
}
