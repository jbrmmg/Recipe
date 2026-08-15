import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RecipeSummary, RecipeDetail } from '../models/recipe.model';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class RecipeService {
  private http = inject(HttpClient);
  private url = `${environment.apiBase}/v1/recipe`;

  getAll(): Observable<RecipeSummary[]> {
    return this.http.get<RecipeSummary[]>(this.url);
  }

  getById(id: number): Observable<RecipeDetail> {
    return this.http.get<RecipeDetail>(`${this.url}/${id}`);
  }
}
