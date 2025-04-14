import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Status } from '../enum/status.enum';
import { CustomResponse } from '../interface/custom-reponse';
import { Server } from '../interface/server';

@Injectable({ providedIn: 'root' })
export class ServerService {
  private readonly apiUrl = 'http://localhost:8080';

  constructor(private http: HttpClient) { }

  servers$ = (): Observable<CustomResponse> =>
    this.http.get<CustomResponse>(`${this.apiUrl}/server/list`)
      .pipe(
        tap(console.log),
        catchError(this.handleError)
      );

  save$(server: Server): Observable<CustomResponse> {
    return this.http.post<CustomResponse>(`${this.apiUrl}/server/save`, server)
      .pipe(
        tap(console.log),
        catchError(this.handleError)
      );
  }

  ping$(ipAddress: string): Observable<CustomResponse> {
    return this.http.get<CustomResponse>(`${this.apiUrl}/server/ping/${ipAddress}`)
      .pipe(
        tap(console.log),
        catchError(this.handleError)
      );
    }

  filter$(status: Status, response: CustomResponse): Observable<CustomResponse> {
    return new Observable<CustomResponse>(
      subscriber => {
        const servers = response?.data?.servers ?? [];
        const filteredServers = status === Status.ALL ? servers : servers.filter(s => s.status === status);
        const message = status === Status.ALL
          ? `Servers filtered by ${status} status`
          : filteredServers.length > 0
            ? `Servers filtered by ${status === Status.SERVER_UP ? 'SERVER UP' : 'SERVER DOWN'} status`
            : `No servers of ${status} found`;
        console.log(response);
        subscriber.next({
          ...response,
          message,
          data: {
            servers: filteredServers
          }
        });
        subscriber.complete();
      }
    )
      .pipe(
        tap(console.log),
        catchError(this.handleError)
      );
    }

  delete$(serverId: number): Observable<CustomResponse> {
    return this.http.delete<CustomResponse>(`${this.apiUrl}/server/delete/${serverId}`)
      .pipe(
        tap(console.log),
        catchError(this.handleError)
      );
    }

  private handleError(error: HttpErrorResponse): Observable<never> {
    console.log(error);
    return throwError(() => new Error(`Error Occurred - Error Code: ${error.status}`));
  }
}
