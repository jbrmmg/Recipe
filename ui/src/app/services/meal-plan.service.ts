import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { MealPlanSummary, MealPlanDetail, ShoppingList } from '../models/meal-plan.model';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class MealPlanService {
  private http = inject(HttpClient);
  private url = `${environment.apiBase}/v1/meal-plan`;

  getAll(): Observable<MealPlanSummary[]> {
    return this.http.get<MealPlanSummary[]>(this.url);
  }

  getById(id: number): Observable<MealPlanDetail> {
    return this.http.get<MealPlanDetail>(`${this.url}/${id}`);
  }

  create(payload: object): Observable<MealPlanDetail> {
    return this.http.post<MealPlanDetail>(this.url, payload);
  }

  update(id: number, payload: object): Observable<MealPlanDetail> {
    return this.http.put<MealPlanDetail>(`${this.url}/${id}`, payload);
  }

  getShoppingList(ids: number[]): Observable<ShoppingList> {
    return this.http.get<ShoppingList>(`${this.url}/shopping-list`, {
      params: { ids: ids.map(String) },
    });
  }

  delete(id: number): Observable<void> {
    return this.http.delete(`${this.url}/${id}`, { responseType: 'text' }).pipe(map(() => undefined));
  }
}
