import { Routes } from '@angular/router';
import { LogowanieComponent } from './c/login/login';
import { MainComponent } from './c/main/main';
import { PlayComponent} from './c/play/play';
import { auth_guard } from './auth.guard';

export const routes: Routes = [
  { path: 'login', component: LogowanieComponent },
  { path: 'main', component: MainComponent, canActivate: [auth_guard] },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'play', component: PlayComponent },
];
