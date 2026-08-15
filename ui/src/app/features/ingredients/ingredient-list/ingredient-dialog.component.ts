import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { Ingredient, INGREDIENT_CATEGORIES, MEASUREMENT_UNITS } from '../../../models/ingredient.model';

@Component({
  selector: 'app-ingredient-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
  ],
  templateUrl: './ingredient-dialog.component.html',
})
export class IngredientDialogComponent {
  dialogRef = inject(MatDialogRef<IngredientDialogComponent>);
  ingredient = inject<Ingredient | null>(MAT_DIALOG_DATA);

  readonly units = MEASUREMENT_UNITS;
  readonly categories = INGREDIENT_CATEGORIES;
  readonly isEdit = !!this.ingredient;

  form = new FormGroup({
    name:             new FormControl(this.ingredient?.name ?? '',             { nonNullable: true, validators: [Validators.required, Validators.minLength(2)] }),
    category:         new FormControl(this.ingredient?.category ?? '',         { nonNullable: true, validators: [Validators.required] }),
    defaultUnit:      new FormControl(this.ingredient?.defaultUnit ?? '',      { nonNullable: true, validators: [Validators.required] }),
    purchaseQuantity: new FormControl(this.ingredient?.purchaseQuantity ?? 1,  { nonNullable: true, validators: [Validators.required, Validators.min(0.001)] }),
    purchaseUnit:     new FormControl(this.ingredient?.purchaseUnit ?? '',     { nonNullable: true, validators: [Validators.required] }),
  });

  save() {
    if (this.form.invalid) return;
    const v = this.form.getRawValue();
    this.dialogRef.close({ ...v, purchaseQuantity: Number(v.purchaseQuantity) });
  }
}
