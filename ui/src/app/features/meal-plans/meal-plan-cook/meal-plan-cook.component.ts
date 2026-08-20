import { Component, OnInit, inject, signal } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DatePipe } from '@angular/common';
import { MealPlanService } from '../../../services/meal-plan.service';
import { MealPlanDetail, MealPlanEntry } from '../../../models/meal-plan.model';

@Component({
  selector: 'app-meal-plan-cook',
  imports: [
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    DatePipe,
  ],
  templateUrl: './meal-plan-cook.component.html',
  styleUrl: './meal-plan-cook.component.scss',
})
export class MealPlanCookComponent implements OnInit {
  private mealPlanService = inject(MealPlanService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  loading = signal(true);
  plan = signal<MealPlanDetail | null>(null);

  ngOnInit() {
    const id = +this.route.snapshot.paramMap.get('id')!;
    this.mealPlanService.getById(id).subscribe({
      next: plan => {
        this.plan.set(plan);
        this.loading.set(false);
      },
      error: () => {
        this.snackBar.open('Failed to load meal plan', 'Close', { duration: 3000 });
        this.router.navigate(['/meal-plans']);
      },
    });
  }

  cookMeal(entry: MealPlanEntry) {
    this.router.navigate(['/meals', entry.mealId, 'cook']);
  }

  back() {
    this.router.navigate(['/meal-plans']);
  }

  parseDate(d: string): Date {
    const [y, m, day] = d.split('-').map(Number);
    return new Date(y, m - 1, day);
  }
}
