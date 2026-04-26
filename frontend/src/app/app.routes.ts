import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'p/inicio' },
  {
    path: 'p',
    loadChildren: () => import('./public/public.routes').then((m) => m.publicRoutes),
  },
  {
    path: 'app',
    loadChildren: () => import('./intranet/intranet.routes').then((m) => m.intranetRoutes),
  },
  { path: '**', redirectTo: 'p/inicio' },
];
