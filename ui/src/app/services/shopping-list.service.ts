import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { SavedShoppingListDetail, SavedShoppingListSummary } from '../models/meal-plan.model';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ShoppingListService {
  private http = inject(HttpClient);
  private url = `${environment.apiBase}/v1/shopping-list`;

  getAll(): Observable<SavedShoppingListSummary[]> {
    return this.http.get<SavedShoppingListSummary[]>(this.url);
  }

  getById(id: number): Observable<SavedShoppingListDetail> {
    return this.http.get<SavedShoppingListDetail>(`${this.url}/${id}`);
  }

  createFromMealPlan(mealPlanId: number): Observable<SavedShoppingListDetail> {
    return this.http.post<SavedShoppingListDetail>(`${this.url}/meal-plan/${mealPlanId}`, {});
  }

  delete(id: number): Observable<void> {
    return this.http.delete(`${this.url}/${id}`, { responseType: 'text' }).pipe(map(() => undefined));
  }
}
