import { Routes } from '@angular/router';

export const publicRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./layout/public-layout.component').then((m) => m.PublicLayoutComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'inicio' },
      {
        path: 'inicio',
        loadComponent: () => import('./pages/home/home.component').then((m) => m.HomeComponent),
        title: 'Inicio — Hospital H&H',
      },
      {
        path: 'nosotros',
        loadComponent: () => import('./pages/about/about.component').then((m) => m.AboutComponent),
        title: 'Quiénes somos — Hospital H&H',
      },
      {
        path: 'servicios',
        loadComponent: () => import('./pages/services/services.component').then((m) => m.ServicesComponent),
        title: 'Servicios — Hospital H&H',
      },
      {
        path: 'especialidades',
        loadComponent: () => import('./pages/specialties/specialties.component').then((m) => m.SpecialtiesComponent),
        title: 'Especialidades — Hospital H&H',
      },
      {
        path: 'contacto',
        loadComponent: () => import('./pages/contact/contact.component').then((m) => m.ContactComponent),
        title: 'Contacto — Hospital H&H',
      },
      {
        path: 'acceso',
        loadComponent: () => import('./pages/login/login.component').then((m) => m.LoginComponent),
        title: 'Acceso personal — Hospital H&H',
      },
    ],
  },
];
