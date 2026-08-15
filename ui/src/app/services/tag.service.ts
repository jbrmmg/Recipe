import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Tag } from '../models/tag.model';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class TagService {
  private http = inject(HttpClient);
  private url = `${environment.apiBase}/v1/tag`;

  getAll(): Observable<Tag[]> {
    return this.http.get<Tag[]>(this.url);
  }
}
