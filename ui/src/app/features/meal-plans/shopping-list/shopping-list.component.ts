import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ShoppingListService } from '../../../services/shopping-list.service';
import { ShoppingListItem } from '../../../models/meal-plan.model';
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
  ],
  templateUrl: './shopping-list.component.html',
  styleUrl: './shopping-list.component.scss',
})
export class ShoppingListComponent implements OnInit {
  private shoppingListService = inject(ShoppingListService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  loading = signal(true);
  listName = signal('');
  items = signal<ShoppingListItem[]>([]);
  checked = signal<Set<string>>(new Set());
  shopMode = signal(false);

  private storageKey = '';

  groups = computed<ShoppingGroup[]>(() => {
    const inShopMode = this.shopMode();
    const checkedSet = this.checked();

    const visibleItems = inShopMode
      ? this.items().filter(i => !checkedSet.has(this.itemKey(i)))
      : this.items();

    const byCategory = new Map<string, ShoppingListItem[]>();
    for (const item of visibleItems) {
      if (!byCategory.has(item.category)) byCategory.set(item.category, []);
      byCategory.get(item.category)!.push(item);
    }
    return CATEGORY_ORDER
      .filter(cat => byCategory.has(cat))
      .map(cat => ({
        category: cat,
        label: CATEGORY_LABEL[cat] ?? cat,
        items: byCategory.get(cat)!,
      }));
  });

  neededCount = computed(() =>
    this.items().filter(i => !this.checked().has(this.itemKey(i))).length
  );

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      this.router.navigate(['/meal-plans']);
      return;
    }

    this.storageKey = `shopping-checked:${id}`;
    const saved = localStorage.getItem(this.storageKey);
    if (saved) {
      try { this.checked.set(new Set(JSON.parse(saved))); } catch { /* ignore */ }
    }

    this.shoppingListService.getById(id).subscribe({
      next: list => {
        this.listName.set(list.name);
        this.items.set(list.items);
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
    localStorage.setItem(this.storageKey, JSON.stringify(Array.from(next)));
  }

  goShopping() { this.shopMode.set(true); }
  backToKitchen() { this.shopMode.set(false); }

  clearChecked() {
    this.checked.set(new Set());
    localStorage.removeItem(this.storageKey);
  }

  formatQty(quantity: number, unit: string): string {
    const short = UNIT_SHORT[unit] ?? unit;
    const rounded = Math.round(quantity * 100) / 100;
    return short ? `${rounded} ${short}` : `${rounded}`;
  }

  back() {
    this.router.navigate(['/meal-plans']);
  }
}
