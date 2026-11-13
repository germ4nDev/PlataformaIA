// Angular Import
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

// project import
import { AdminComponent } from './theme/layout/admin/admin.component';
import { GuestComponent } from './theme/layout/guest/guest.component';
// import { AuthGuard } from './theme/shared/_helpers/auth.guard';
import { inicioPorDominioGuard } from './theme/shared/_helpers/inicio-dominio.guard';
import { rutaPorDominioGuard } from './theme/shared/_helpers/ruta-dominio.guard';

const routes: Routes = [
    {
        path: '',
        component: AdminComponent,
        // canActivateChild: [AuthGuard],
        // Multidominio (OT-012): en el dominio de una aplicación, solo sus rutas (la consola y las demás apps no)
        canActivateChild: [rutaPorDominioGuard],
        // canLoad: [AuthGuard],
        children: [
            {
                // Raíz: porttos.co (sin sesión) → portal; cualquier otro dominio → login, como siempre (OT-010)
                path: '',
                pathMatch: 'full',
                canActivate: [inicioPorDominioGuard],
                children: []
            },
            {
                // Modo embebido (OT-014): la web dentro de la app Porttos (tableta); la sesión la entrega la app
                path: 'embebido',
                loadComponent: () => import('./plataforma/embebido/embebido.component').then((c) => c.EmbebidoComponent)
            },
            {
                path: 'administracion-bd',
                loadChildren: () =>
                    import('./plataforma/administracion-bd/administracion-bd.module').then((module) => module.AdministracionBDModule)
            },
            // 2026-11-09 (usuario): páginas de ejemplo de diseño de la plantilla retiradas a _respaldos/2026-11-09_paginas-ejemplo
            {
                path: 'suscriptor',
                loadChildren: () => import('./plataforma/suscriptor/suscriptor.module').then((module) => module.SuscriptorModule)
            },
            {
                path: 'aplicaciones',
                loadChildren: () => import('./plataforma/aplicaciones/aplicaciones.module').then((module) => module.AplicacionesModule)
            },
            {
                path: 'actividades',
                loadChildren: () => import('./plataforma/actividades/actividades.module').then((module) => module.ActividadesModule)
            },
            {
                path: 'licencias',
                loadChildren: () => import('./plataforma/licencias/licencias.module').then((module) => module.LicenciasModule)
            },
            {
                path: 'sites',
                loadChildren: () => import('./plataforma/sites/sites.module').then((module) => module.SitesModule)
            },
            {
                path: 'tickets',
                loadChildren: () => import('./plataforma/tickets/tickets.module').then((module) => module.TicketsModule)
            },
            {
                path: 'usuarios',
                loadChildren: () => import('./plataforma/usuarios/usuarios.module').then((module) => module.UsuariosModule)
            },
            {
                path: 'utilidades',
                loadChildren: () => import('./plataforma/utilidades/utilidades.module').then((module) => module.UtilidadesModule)
            },
            {
                path: 'biblioteca',
                loadChildren: () => import('./plataforma/biblioteca/bibliotecas.module').then((module) => module.BibliotecasModule)
            },
            {
                path: 'administracion',
                loadChildren: () => import('./apps/sistemas/administracion/administracion.module').then((module) => module.AdministracionModule)
            },
            {
                path: 'autenticacion',
                loadChildren: () => import('./plataforma/autenticacion/autenticacion.module').then((module) => module.AutenticacionModule)
            },
            {
                path: 'paquetes',
                loadChildren: () => import('./plataforma/paquetes/paquetes.module').then((module) => module.PaquetesModule)
            },
            {
                path: 'logs',
                loadChildren: () => import('./plataforma/logs/logs.module').then((module) => module.LogsModule)
            },
            {
                path: 'sistema',
                loadChildren: () => import('./plataforma/sistema/sistema.module').then((module) => module.SistemaModule)
            },
            {
                path: 'porttos',
                loadChildren: () => import('./apps/porttos/porttos.module').then((module) => module.PorttosModule)
            }
        ]
    },
    {
        path: '',
        component: GuestComponent,
        children: [
            {
                path: 'starter',
                loadChildren: () => import('./plataforma//starter/starter.module').then((module) => module.StarterModule)
            },
            {
                path: 'websites',
                loadChildren: () => import('./plataforma/websites/websites.module').then((module) => module.WebsitesModule)
            },
            {
                path: 'maintenance',
                loadChildren: () => import('./plataforma/maintenance/maintenance.module').then((module) => module.MaintenanceModule)
            }
        ]
    }
];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule]
})
export class AppRoutingModule { }
