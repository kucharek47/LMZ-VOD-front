import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'logowanie',
    loadComponent: () => import('./c/login/login').then((m) => m.LogowanieComponent),
  },
  {
    path: 'main',
    loadComponent: () => import('./c/main/main').then((m) => m.MainComponent),
  },
  {
    path: 'play',
    loadComponent: () => import('./c/play/play').then((m) => m.PlayComponent),
  },
  {
    path: '',
    redirectTo: 'logowanie',
    pathMatch: 'full',
  },
];
