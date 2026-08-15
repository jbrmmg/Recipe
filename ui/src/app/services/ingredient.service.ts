import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Ingredient } from '../models/ingredient.model';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class IngredientService {
  private http = inject(HttpClient);
  private url = `${environment.apiBase}/v1/ingredient`;

  getAll(): Observable<Ingredient[]> {
    return this.http.get<Ingredient[]>(this.url);
  }
}
