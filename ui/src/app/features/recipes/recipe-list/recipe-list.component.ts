import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { startWith } from 'rxjs';
import { RecipeService } from '../../../services/recipe.service';
import { TagService } from '../../../services/tag.service';
import { RecipeSummary } from '../../../models/recipe.model';
import { Tag } from '../../../models/tag.model';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule, MatChipListboxChange } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ConfirmDialogComponent } from '../../../shared/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-recipe-list',
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatButtonModule,
  ],
  templateUrl: './recipe-list.component.html',
  styleUrl: './recipe-list.component.scss'
})
export class RecipeListComponent implements OnInit {
  private recipeService = inject(RecipeService);
  private tagService = inject(TagService);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  recipes = signal<RecipeSummary[]>([]);
  tags = signal<Tag[]>([]);
  loading = signal(true);
  selectedTags = signal<string[]>([]);

  searchControl = new FormControl('');
  private searchValue = toSignal(
    this.searchControl.valueChanges.pipe(startWith('')),
    { initialValue: '' }
  );

  filteredRecipes = computed(() => {
    const search = this.searchValue()?.toLowerCase() ?? '';
    const selected = this.selectedTags();
    return this.recipes().filter(r => {
      const matchesSearch = !search
        || r.title.toLowerCase().includes(search)
        || r.description?.toLowerCase().includes(search);
      const matchesTags = selected.length === 0
        || selected.every(t => r.tags.includes(t));
      return matchesSearch && matchesTags;
    });
  });

  ngOnInit() {
    this.recipeService.getAll().subscribe({
      next: recipes => {
        this.recipes.set(recipes);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
    this.tagService.getAll().subscribe(tags => this.tags.set(tags));
  }

  onTagFilterChange(event: MatChipListboxChange) {
    this.selectedTags.set(event.value ?? []);
  }

  createRecipe() {
    this.router.navigate(['/recipes/new']);
  }

  viewRecipe(recipe: RecipeSummary) {
    this.router.navigate(['/recipes', recipe.id]);
  }

  editRecipe(recipe: RecipeSummary) {
    this.router.navigate(['/recipes', recipe.id, 'edit']);
  }

  deleteRecipe(recipe: RecipeSummary) {
    this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Delete recipe', message: `Delete "${recipe.title}"? This cannot be undone.` }
    }).afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this.recipeService.delete(recipe.id).subscribe({
        next: () => {
          this.recipes.update(list => list.filter(r => r.id !== recipe.id));
          this.snackBar.open(`"${recipe.title}" deleted`, 'Close', { duration: 2000 });
        },
        error: () => this.snackBar.open('Failed to delete recipe', 'Close', { duration: 3000 })
      });
    });
  }

  formatTime(minutes: number | undefined): string {
    if (!minutes) return '';
    if (minutes < 60) return `${minutes}m`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m ? `${h}h ${m}m` : `${h}h`;
  }
}
