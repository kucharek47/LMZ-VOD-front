import { inject } from '@angular/core';
import {
  HttpRequest,
  HttpHandlerFn,
  HttpEvent,
  HttpErrorResponse,
  HttpClient,
} from '@angular/common/http';
import { Observable, throwError, catchError, switchMap, BehaviorSubject, filter, take } from 'rxjs';
import { Router } from '@angular/router';

const czy_odswieza = new BehaviorSubject<boolean>(false);
const odswiezony_token = new BehaviorSubject<boolean | null>(null);

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
        if (czy_odswieza.value) {
          return odswiezony_token.pipe(
            filter((wynik) => wynik !== null),
            take(1),
            switchMap((wynik) => {
              if (wynik) {
                return next(req.clone({ withCredentials: true }));
              }
              return throwError(() => blad);
            }),
          );
        }

        czy_odswieza.next(true);
        odswiezony_token.next(null);

        return http.post('/user/refresh', {}, { withCredentials: true }).pipe(
          switchMap(() => {
            czy_odswieza.next(false);
            odswiezony_token.next(true);
            return next(req.clone({ withCredentials: true }));
          }),
          catchError((blad_odswiezania) => {
            czy_odswieza.next(false);
            odswiezony_token.next(false);
            router.navigate(['/login']);
            return throwError(() => blad_odswiezania);
          }),
        );
      }
      return throwError(() => blad);
    }),
  );
};
