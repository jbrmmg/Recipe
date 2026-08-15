import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
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

  formatTime(minutes: number | undefined): string {
    if (!minutes) return '';
    if (minutes < 60) return `${minutes}m`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m ? `${h}h ${m}m` : `${h}h`;
  }
}
