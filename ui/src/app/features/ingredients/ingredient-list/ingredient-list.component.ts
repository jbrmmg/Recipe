import { Component, OnInit, AfterViewInit, ViewChild, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { IngredientService } from '../../../services/ingredient.service';
import { Ingredient, INGREDIENT_CATEGORIES, MEASUREMENT_UNITS } from '../../../models/ingredient.model';
import { IngredientDialogComponent } from './ingredient-dialog.component';

@Component({
  selector: 'app-ingredient-list',
  imports: [
    ReactiveFormsModule,
    MatTableModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './ingredient-list.component.html',
  styleUrl: './ingredient-list.component.scss'
})
export class IngredientListComponent implements OnInit, AfterViewInit {
  private ingredientService = inject(IngredientService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  @ViewChild(MatSort) sort!: MatSort;

  loading = signal(true);
  displayedColumns = ['name', 'category', 'defaultUnit', 'purchase', 'actions'];
  dataSource = new MatTableDataSource<Ingredient>();
  searchControl = new FormControl('');

  private readonly units = MEASUREMENT_UNITS;
  private readonly categories = INGREDIENT_CATEGORIES;

  ngOnInit() {
    this.loadIngredients();
    this.searchControl.valueChanges.subscribe(value => {
      this.dataSource.filter = (value ?? '').toLowerCase().trim();
    });
    this.dataSource.filterPredicate = (data, filter) =>
      data.name.toLowerCase().includes(filter) ||
      data.category.toLowerCase().includes(filter);
  }

  ngAfterViewInit() {
    this.dataSource.sort = this.sort;
  }

  private loadIngredients() {
    this.ingredientService.getAll().subscribe({
      next: ingredients => {
        this.dataSource.data = ingredients;
        this.loading.set(false);
      },
      error: () => {
        this.snackBar.open('Failed to load ingredients', 'Close', { duration: 3000 });
        this.loading.set(false);
      }
    });
  }

  openDialog(ingredient?: Ingredient) {
    this.dialog.open(IngredientDialogComponent, {
      width: '480px',
      maxWidth: '95vw',
      data: ingredient ?? null,
    }).afterClosed().subscribe(result => {
      if (!result) return;
      if (ingredient) {
        this.ingredientService.update(ingredient.id, result).subscribe({
          next: updated => {
            this.dataSource.data = this.dataSource.data.map(i => i.id === updated.id ? updated : i);
          },
          error: () => this.snackBar.open('Failed to update ingredient', 'Close', { duration: 3000 })
        });
      } else {
        this.ingredientService.create(result).subscribe({
          next: created => {
            this.dataSource.data = [...this.dataSource.data, created];
          },
          error: () => this.snackBar.open('Failed to add ingredient', 'Close', { duration: 3000 })
        });
      }
    });
  }

  delete(ingredient: Ingredient) {
    this.ingredientService.delete(ingredient.id).subscribe({
      next: () => {
        this.dataSource.data = this.dataSource.data.filter(i => i.id !== ingredient.id);
        this.snackBar.open(`"${ingredient.name}" deleted`, 'Close', { duration: 2000 });
      },
      error: () =>
        this.snackBar.open(`Cannot delete "${ingredient.name}" — it may be used in recipes`, 'Close', { duration: 4000 })
    });
  }

  labelFor(value: string, type: 'unit' | 'category'): string {
    const list = type === 'unit' ? this.units : this.categories;
    return list.find(i => i.value === value)?.label ?? value;
  }
}
