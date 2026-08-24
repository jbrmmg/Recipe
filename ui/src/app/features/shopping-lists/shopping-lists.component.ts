import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { DatePipe } from '@angular/common';
import { ShoppingListService } from '../../services/shopping-list.service';
import { SavedShoppingListSummary } from '../../models/meal-plan.model';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-shopping-lists',
  imports: [
    MatListModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    DatePipe,
  ],
  templateUrl: './shopping-lists.component.html',
  styleUrl: './shopping-lists.component.scss',
})
export class ShoppingListsComponent implements OnInit {
  private shoppingListService = inject(ShoppingListService);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  lists = signal<SavedShoppingListSummary[]>([]);
  loading = signal(true);

  ngOnInit() {
    this.shoppingListService.getAll().subscribe({
      next: lists => {
        this.lists.set(lists);
        this.loading.set(false);
      },
      error: () => {
        this.snackBar.open('Failed to load shopping lists', 'Close', { duration: 3000 });
        this.loading.set(false);
      },
    });
  }

  view(list: SavedShoppingListSummary) {
    this.router.navigate(['/shopping', list.id]);
  }

  delete(list: SavedShoppingListSummary) {
    this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Delete shopping list', message: `Delete "${list.name}"?` },
    }).afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this.shoppingListService.delete(list.id).subscribe({
        next: () => {
          this.lists.update(ls => ls.filter(l => l.id !== list.id));
          this.snackBar.open(`"${list.name}" deleted`, 'Close', { duration: 2000 });
        },
        error: () => this.snackBar.open('Failed to delete shopping list', 'Close', { duration: 3000 }),
      });
    });
  }

  itemLabel(count: number): string {
    return count === 1 ? '1 item' : `${count} items`;
  }
}
