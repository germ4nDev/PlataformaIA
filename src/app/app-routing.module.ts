/*
    Author: German Valencia
    Pattern: PLATAFORMA - Rutas de la compilación de la plataforma (consola)
    Description: las comunes las pone el casco (plataforma/casco/rutas-casco.ts, OT-034, CC-191); aquí van las de la consola.
      Porttos y Sistemas siguen montadas aquí mientras no se publiquen con su propia compilación (OT-034 paso 5 las quita);
      son los dos cruces pendientes de _memoria/datos/fronteras-pendientes.json.
      Antes: el árbol completo aquí (copia en _respaldos/2026-11-15_ot034-piloto-sistemas/app-routing.module.ts).
*/
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { crearRutasCasco } from './plataforma/casco/rutas-casco';

const consola: Routes = [
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
];

const invitado: Routes = [
    {
        path: 'websites',
        loadChildren: () => import('./plataforma/websites/websites.module').then((module) => module.WebsitesModule)
    }
];

@NgModule({
    imports: [RouterModule.forRoot(crearRutasCasco({ admin: consola, invitado }))],
    exports: [RouterModule]
})
export class AppRoutingModule { }
