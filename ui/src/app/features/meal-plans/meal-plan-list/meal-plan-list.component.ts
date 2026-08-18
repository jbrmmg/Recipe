import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { DatePipe } from '@angular/common';
import { MealPlanService } from '../../../services/meal-plan.service';
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
    DatePipe,
  ],
  templateUrl: './meal-plan-list.component.html',
  styleUrl: './meal-plan-list.component.scss',
})
export class MealPlanListComponent implements OnInit {
  private mealPlanService = inject(MealPlanService);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  plans = signal<MealPlanSummary[]>([]);
  loading = signal(true);

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

  editPlan(plan: MealPlanSummary) {
    this.router.navigate(['/meal-plans', plan.id, 'edit']);
  }

  viewShopping(plan: MealPlanSummary) {
    this.router.navigate(['/meal-plans', plan.id, 'shopping']);
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
