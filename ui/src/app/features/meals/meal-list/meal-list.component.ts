import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MealService } from '../../../services/meal.service';
import { MealSummary } from '../../../models/meal.model';
import { ConfirmDialogComponent } from '../../../shared/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-meal-list',
  imports: [
    MatListModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDividerModule,
  ],
  templateUrl: './meal-list.component.html',
  styleUrl: './meal-list.component.scss',
})
export class MealListComponent implements OnInit {
  private mealService = inject(MealService);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  meals = signal<MealSummary[]>([]);
  loading = signal(true);

  ngOnInit() {
    this.mealService.getAll().subscribe({
      next: meals => {
        this.meals.set(meals.sort((a, b) => a.name.localeCompare(b.name)));
        this.loading.set(false);
      },
      error: () => {
        this.snackBar.open('Failed to load meals', 'Close', { duration: 3000 });
        this.loading.set(false);
      },
    });
  }

  addMeal() {
    this.router.navigate(['/meals/new']);
  }

  cookMeal(meal: MealSummary) {
    this.router.navigate(['/meals', meal.id, 'cook']);
  }

  editMeal(meal: MealSummary) {
    this.router.navigate(['/meals', meal.id, 'edit']);
  }

  deleteMeal(meal: MealSummary) {
    this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Delete meal', message: `Delete "${meal.name}"?` },
    }).afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this.mealService.delete(meal.id).subscribe({
        next: () => {
          this.meals.update(list => list.filter(m => m.id !== meal.id));
          this.snackBar.open(`"${meal.name}" deleted`, 'Close', { duration: 2000 });
        },
        error: () => this.snackBar.open('Failed to delete meal', 'Close', { duration: 3000 }),
      });
    });
  }

  recipeLabel(count: number): string {
    return count === 1 ? '1 recipe' : `${count} recipes`;
  }
}
