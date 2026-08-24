import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DatePipe } from '@angular/common';
import { MealPlanService } from '../../../services/meal-plan.service';
import { ShoppingListService } from '../../../services/shopping-list.service';
import { MealPlanSummary } from '../../../models/meal-plan.model';
import { ConfirmDialogComponent } from '../../../shared/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-meal-plan-list',
  imports: [
    MatListModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatTooltipModule,
    DatePipe,
  ],
  templateUrl: './meal-plan-list.component.html',
  styleUrl: './meal-plan-list.component.scss',
})
export class MealPlanListComponent implements OnInit {
  private mealPlanService = inject(MealPlanService);
  private shoppingListService = inject(ShoppingListService);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  plans = signal<MealPlanSummary[]>([]);
  loading = signal(true);
  creating = signal<Set<number>>(new Set());

  ngOnInit() {
    this.mealPlanService.getAll().subscribe({
      next: plans => {
        this.plans.set(plans);
        this.loading.set(false);
      },
      error: () => {
        this.snackBar.open('Failed to load meal plans', 'Close', { duration: 3000 });
        this.loading.set(false);
      },
    });
  }

  addPlan() {
    this.router.navigate(['/meal-plans/new']);
  }

  cookPlan(plan: MealPlanSummary) {
    this.router.navigate(['/meal-plans', plan.id, 'cook']);
  }

  editPlan(plan: MealPlanSummary) {
    this.router.navigate(['/meal-plans', plan.id, 'edit']);
  }

  openShopping(plan: MealPlanSummary) {
    if (plan.shoppingListId) {
      this.router.navigate(['/shopping', plan.shoppingListId]);
      return;
    }
    const next = new Set(this.creating());
    next.add(plan.id);
    this.creating.set(next);
    this.shoppingListService.createFromMealPlan(plan.id).subscribe({
      next: list => {
        this.plans.update(ps => ps.map(p => p.id === plan.id ? { ...p, shoppingListId: list.id } : p));
        this.creating.update(s => { const n = new Set(s); n.delete(plan.id); return n; });
        this.router.navigate(['/shopping', list.id]);
      },
      error: () => {
        this.creating.update(s => { const n = new Set(s); n.delete(plan.id); return n; });
        this.snackBar.open('Failed to create shopping list', 'Close', { duration: 3000 });
      },
    });
  }

  isCreating(plan: MealPlanSummary): boolean {
    return this.creating().has(plan.id);
  }

  deletePlan(plan: MealPlanSummary) {
    this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Delete meal plan', message: `Delete "${plan.name}"?` },
    }).afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this.mealPlanService.delete(plan.id).subscribe({
        next: () => {
          this.plans.update(list => list.filter(p => p.id !== plan.id));
          this.snackBar.open(`"${plan.name}" deleted`, 'Close', { duration: 2000 });
        },
        error: () => this.snackBar.open('Failed to delete meal plan', 'Close', { duration: 3000 }),
      });
    });
  }

  mealLabel(count: number): string {
    return count === 1 ? '1 meal' : `${count} meals`;
  }
}
