import { inject } from '@angular/core';
import {
  HttpRequest,
  HttpHandlerFn,
  HttpEvent,
  HttpErrorResponse,
  HttpClient,
} from '@angular/common/http';
import { Observable, throwError, catchError, switchMap } from 'rxjs';
import { Router } from '@angular/router';

export const auth_interceptor = (
  req: HttpRequest<any>,
  next: HttpHandlerFn,
): Observable<HttpEvent<any>> => {
  const http = inject(HttpClient);
  const router = inject(Router);

  const nowe_zadanie = req.clone({
    withCredentials: true,
  });

  return next(nowe_zadanie).pipe(
    catchError((blad: HttpErrorResponse) => {
      if (
        blad.status === 401 &&
        !req.url.includes('/user/refresh') &&
        !req.url.includes('/user/login')
      ) {
        return http.post('http://127.0.0.1:8000/user/refresh', {}, { withCredentials: true }).pipe(
          switchMap(() => {
            return next(nowe_zadanie);
          }),
          catchError((blad_odswiezania) => {
            router.navigate(['/login']);
            return throwError(() => blad_odswiezania);
          }),
        );
      }
      return throwError(() => blad);
    }),
  );
};
