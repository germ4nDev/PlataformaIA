/*
    Author: German Valencia
    Pattern: PLATAFORMA Casco - Rutas comunes de toda compilación (OT-034, CC-191)
    Description: arma el árbol de rutas del casco: layout de administración (raíz por dominio, modo embebido, autenticación) y
      layout de invitado (starter, mantenimiento). Cada compilación agrega las suyas: la plataforma su consola, cada aplicación las
      de su manifiesto. El casco no conoce ninguna aplicación.
*/
import { Routes } from '@angular/router';

import { AdminComponent } from '../../theme/layout/admin/admin.component';
import { GuestComponent } from '../../theme/layout/guest/guest.component';
import { inicioPorDominioGuard } from '../../theme/shared/_helpers/inicio-dominio.guard';
import { rutaPorDominioGuard } from '../../theme/shared/_helpers/ruta-dominio.guard';

export interface RutasDeCompilacion {
    /** Hijas del layout de administración (con menú). */
    admin?: Routes;
    /** Hijas del layout de invitado (sin menú: sitios públicos, páginas sueltas). */
    invitado?: Routes;
}

export function crearRutasCasco(rutas: RutasDeCompilacion = {}): Routes {
    return [
        {
            path: '',
            component: AdminComponent,
            // Multidominio (OT-012): en el dominio de una aplicación, solo sus rutas (la consola y las demás apps no)
            canActivateChild: [rutaPorDominioGuard],
            children: [
                {
                    // Raíz: porttos.co (sin sesión) → portal; cualquier otro dominio → login, como siempre (OT-010)
                    path: '',
                    pathMatch: 'full',
                    canActivate: [inicioPorDominioGuard],
                    children: []
                },
                {
                    // Modo embebido (OT-014): la web dentro de la app móvil; la sesión la entrega la app
                    path: 'embebido',
                    loadComponent: () => import('../embebido/embebido.component').then((c) => c.EmbebidoComponent)
                },
                {
                    path: 'autenticacion',
                    loadChildren: () => import('../autenticacion/autenticacion.module').then((m) => m.AutenticacionModule)
                },
                ...(rutas.admin ?? [])
            ]
        },
        {
            path: '',
            component: GuestComponent,
            children: [
                {
                    path: 'starter',
                    loadChildren: () => import('../starter/starter.module').then((m) => m.StarterModule)
                },
                {
                    path: 'maintenance',
                    loadChildren: () => import('../maintenance/maintenance.module').then((m) => m.MaintenanceModule)
                },
                ...(rutas.invitado ?? [])
            ]
        }
    ];
}
