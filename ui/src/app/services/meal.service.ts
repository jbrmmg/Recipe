import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { MealSummary, MealDetail } from '../models/meal.model';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class MealService {
  private http = inject(HttpClient);
  private url = `${environment.apiBase}/v1/meal`;

  getAll(): Observable<MealSummary[]> {
    return this.http.get<MealSummary[]>(this.url);
  }

  getById(id: number): Observable<MealDetail> {
    return this.http.get<MealDetail>(`${this.url}/${id}`);
  }

  create(payload: object): Observable<MealDetail> {
    return this.http.post<MealDetail>(this.url, payload);
  }

  update(id: number, payload: object): Observable<MealDetail> {
    return this.http.put<MealDetail>(`${this.url}/${id}`, payload);
  }

  delete(id: number): Observable<void> {
    return this.http.delete(`${this.url}/${id}`, { responseType: 'text' }).pipe(map(() => undefined));
  }
}
