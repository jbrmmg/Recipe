import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Tag } from '../models/tag.model';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class TagService {
  private http = inject(HttpClient);
  private url = `${environment.apiBase}/v1/tag`;

  getAll(): Observable<Tag[]> {
    return this.http.get<Tag[]>(this.url);
  }

  create(name: string): Observable<Tag> {
    return this.http.post<Tag>(this.url, { name });
  }

  update(id: number, name: string): Observable<Tag> {
    return this.http.put<Tag>(`${this.url}/${id}`, { name });
  }

  delete(id: number): Observable<void> {
    return this.http.delete(`${this.url}/${id}`, { responseType: 'text' }).pipe(map(() => undefined));
  }
}
