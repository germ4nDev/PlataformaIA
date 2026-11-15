import { Routes } from '@angular/router';

// Solo para abrir el remoto por sí mismo en el puerto 4201; dentro de la plataforma se carga el componente expuesto
export const routes: Routes = [
  { path: '', loadComponent: () => import('./poc-sistemas/poc-sistemas.component').then((c) => c.PocSistemasComponent) }
];
