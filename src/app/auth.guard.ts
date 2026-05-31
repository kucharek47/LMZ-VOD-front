import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { catchError, map, of } from 'rxjs';

export const auth_guard: CanActivateFn = () => {
  const router = inject(Router);
  const http = inject(HttpClient);

  return http.get('/user/check', { withCredentials: true }).pipe(
    map(() => true),
    catchError(() => {
      router.navigate(['/login']);
      return of(false);
    }),
  );
};
