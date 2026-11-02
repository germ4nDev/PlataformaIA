/*
    Author: German Valencia
    Pattern: PORTTOS Rutas - Portal porttos.co dentro de la web (OT-010, OT-011)
    Description: Páginas hijas de websites/porttos; todas usan la página genérica con el nombre de la página en /api/portal.
      data.bloque: 'planes' | 'contacto' | 'puertos' (bloque propio después de la primera sección); data.conPlanes: la página
      necesita los planes aunque no los pinte (Para quién muestra el plan recomendado de cada perfil).
      Planes (CC-106): la ruta solo abre con TCL_PortalConfig.planesActivos = '1'; si no, vuelve al inicio del portal.
      No hay ingreso propio: «Iniciar sesión» va al login de la plataforma (rutaIngreso).
*/
import { inject } from '@angular/core';
import { CanActivateFn, Router, Routes } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { PortalPorttosService } from 'src/app/theme/shared/service/portal-porttos.service';
import { RUTA_PORTAL, planesActivos } from 'src/app/plataforma/websites/porttos/nucleo';
import { PaginaComponent } from './pagina/pagina.component';

/** Planes de comercialización apagados por ahora (usuario, 2026-11-01): sin planesActivos = '1', /planes lleva al inicio del portal. */
export const planesActivosGuard: CanActivateFn = () => {
  const router = inject(Router);
  return inject(PortalPorttosService).config().pipe(
    catchError(() => of(null)),
    map((c) => (planesActivos(c) ? true : router.parseUrl(RUTA_PORTAL))),
  );
};

export const PORTAL_RUTAS: Routes = [
  { path: '', component: PaginaComponent, data: { pagina: 'inicio' } },
  { path: 'solucion', component: PaginaComponent, data: { pagina: 'solucion' } },
  { path: 'app', component: PaginaComponent, data: { pagina: 'app' } },
  { path: 'perfiles', component: PaginaComponent, data: { pagina: 'perfiles', conPlanes: true } },
  { path: 'puertos', component: PaginaComponent, data: { pagina: 'puertos', bloque: 'puertos' } },
  { path: 'gobierno', component: PaginaComponent, data: { pagina: 'gobierno' } },
  { path: 'planes', component: PaginaComponent, canActivate: [planesActivosGuard], data: { pagina: 'planes', bloque: 'planes' } },
  { path: 'mision', component: PaginaComponent, data: { pagina: 'mision' } },
  { path: 'contacto', component: PaginaComponent, data: { pagina: 'contacto', bloque: 'contacto' } },
  { path: '**', redirectTo: '' },
];
