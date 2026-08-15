import { Component, OnInit, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatListModule } from '@angular/material/list';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { TagService } from '../../../services/tag.service';
import { Tag } from '../../../models/tag.model';

@Component({
  selector: 'app-tag-list',
  imports: [
    ReactiveFormsModule,
    MatListModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDividerModule,
  ],
  templateUrl: './tag-list.component.html',
  styleUrl: './tag-list.component.scss'
})
export class TagListComponent implements OnInit {
  private tagService = inject(TagService);
  private snackBar = inject(MatSnackBar);

  tags = signal<Tag[]>([]);
  loading = signal(true);
  saving = signal(false);
  editingId = signal<number | null>(null);

  newTagControl = new FormControl('', [Validators.required, Validators.minLength(2)]);
  editControl = new FormControl('', [Validators.required, Validators.minLength(2)]);

  ngOnInit() {
    this.loadTags();
  }

  private loadTags() {
    this.tagService.getAll().subscribe({
      next: tags => {
        this.tags.set(tags.sort((a, b) => a.name.localeCompare(b.name)));
        this.loading.set(false);
      },
      error: () => {
        this.snackBar.open('Failed to load tags', 'Close', { duration: 3000 });
        this.loading.set(false);
      }
    });
  }

  addTag() {
    const name = this.newTagControl.value?.trim();
    if (!name || this.newTagControl.invalid) return;

    this.saving.set(true);
    this.tagService.create(name).subscribe({
      next: tag => {
        this.tags.update(tags => [...tags, tag].sort((a, b) => a.name.localeCompare(b.name)));
        this.newTagControl.reset();
        this.saving.set(false);
      },
      error: () => {
        this.snackBar.open('Failed to add tag', 'Close', { duration: 3000 });
        this.saving.set(false);
      }
    });
  }

  startEdit(tag: Tag) {
    this.editingId.set(tag.id);
    this.editControl.setValue(tag.name);
  }

  cancelEdit() {
    this.editingId.set(null);
    this.editControl.reset();
  }

  saveEdit(tag: Tag) {
    const name = this.editControl.value?.trim();
    if (!name || this.editControl.invalid) return;

    this.tagService.update(tag.id, name).subscribe({
      next: updated => {
        this.tags.update(tags =>
          tags.map(t => t.id === updated.id ? updated : t)
              .sort((a, b) => a.name.localeCompare(b.name))
        );
        this.editingId.set(null);
      },
      error: () => this.snackBar.open('Failed to update tag', 'Close', { duration: 3000 })
    });
  }

  deleteTag(tag: Tag) {
    this.tagService.delete(tag.id).subscribe({
      next: () => {
        this.tags.update(tags => tags.filter(t => t.id !== tag.id));
        this.snackBar.open(`"${tag.name}" deleted`, 'Close', { duration: 2000 });
      },
      error: () =>
        this.snackBar.open(`Cannot delete "${tag.name}" — it may be assigned to recipes`, 'Close', { duration: 4000 })
    });
  }
}
