import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DatePipe, DecimalPipe } from '@angular/common';
import { MealPlanService } from '../../../services/meal-plan.service';
import { ShoppingList, ShoppingListItem } from '../../../models/meal-plan.model';
import { MEASUREMENT_UNITS, INGREDIENT_CATEGORIES } from '../../../models/ingredient.model';

const UNIT_SHORT: Record<string, string> = Object.fromEntries(
  MEASUREMENT_UNITS.map(u => [u.value, u.short])
);

const CATEGORY_ORDER: string[] = [
  'PRODUCE', 'MEAT', 'FISH', 'DAIRY', 'BAKERY', 'TINNED', 'FROZEN', 'SPICES', 'DRINKS', 'OTHER'
];

const CATEGORY_LABEL: Record<string, string> = Object.fromEntries(
  INGREDIENT_CATEGORIES.map(c => [c.value, c.label])
);

export interface ShoppingGroup {
  category: string;
  label: string;
  items: ShoppingListItem[];
}

@Component({
  selector: 'app-shopping-list',
  imports: [
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatCheckboxModule,
    MatDividerModule,
    DatePipe,
    DecimalPipe,
  ],
  templateUrl: './shopping-list.component.html',
  styleUrl: './shopping-list.component.scss',
})
export class ShoppingListComponent implements OnInit {
  private mealPlanService = inject(MealPlanService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  loading = signal(true);
  shoppingList = signal<ShoppingList | null>(null);
  checked = signal<Set<string>>(new Set());

  groups = computed<ShoppingGroup[]>(() => {
    const list = this.shoppingList();
    if (!list) return [];
    const byCategory = new Map<string, ShoppingListItem[]>();
    for (const item of list.items) {
      const cat = item.category;
      if (!byCategory.has(cat)) byCategory.set(cat, []);
      byCategory.get(cat)!.push(item);
    }
    return CATEGORY_ORDER
      .filter(cat => byCategory.has(cat))
      .map(cat => ({
        category: cat,
        label: CATEGORY_LABEL[cat] ?? cat,
        items: byCategory.get(cat)!,
      }));
  });

  ngOnInit() {
    const id = +this.route.snapshot.paramMap.get('id')!;
    this.mealPlanService.getShoppingList(id).subscribe({
      next: list => {
        this.shoppingList.set(list);
        this.loading.set(false);
      },
      error: () => {
        this.snackBar.open('Failed to load shopping list', 'Close', { duration: 3000 });
        this.router.navigate(['/meal-plans']);
      },
    });
  }

  itemKey(item: ShoppingListItem): string {
    return `${item.ingredientId}:${item.unit}`;
  }

  isChecked(item: ShoppingListItem): boolean {
    return this.checked().has(this.itemKey(item));
  }

  toggleChecked(item: ShoppingListItem) {
    const key = this.itemKey(item);
    const next = new Set(this.checked());
    if (next.has(key)) next.delete(key); else next.add(key);
    this.checked.set(next);
  }

  formatQty(quantity: number, unit: string): string {
    const short = UNIT_SHORT[unit] ?? unit;
    const rounded = Math.round(quantity * 100) / 100;
    const num = Number.isInteger(rounded) ? `${rounded}` : `${rounded}`;
    return short ? `${num}${short}` : num;
  }

  back() {
    this.router.navigate(['/meal-plans']);
  }
}
