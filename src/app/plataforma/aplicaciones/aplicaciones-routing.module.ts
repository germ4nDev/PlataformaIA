// Angular Import
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PermisoGuard } from '../../guards/permiso.guard';
import { RoleGuard } from '../../guards/role.guard';

const routes: Routes = [
    {
        path: '',
        // component: LayoutComponent,
        children: [
            {
                path: 'aplicaciones',
                loadComponent: () => import('./aplicaciones/aplicaciones.component').then((m) => m.AplicacionesComponent),
                canActivate: [RoleGuard],
                data: { rolesPermitidos: ['ROLE_ADMINISTRADOR', 'ROLE_USUARIO'] }
            },
            {
                path: 'gestion-aplicacion',
                loadComponent: () =>
                    import('./aplicaciones/gestion-aplicacion/gestion-aplicacion.component').then((m) => m.GestionAplicacionComponent),
                canActivate: [RoleGuard],
                data: { rolesPermitidos: ['ROLE_ADMINISTRADOR', 'ROLE_USUARIO'] }
            },
            {
                path: 'suites',
                loadComponent: () => import('./suites/suites.component').then((m) => m.SuitesComponent),
                canActivate: [RoleGuard],
                data: { rolesPermitidos: ['ROLE_ADMINISTRADOR', 'ROLE_USUARIO'] }
            },
            {
                path: 'gestion-suite',
                loadComponent: () => import('./suites/gestion-suite/gestion-suite.component').then((m) => m.GestionSuiteComponent),
                canActivate: [RoleGuard],
                data: { rolesPermitidos: ['ROLE_ADMINISTRADOR', 'ROLE_USUARIO'] }
            },
            {
                path: 'modulos',
                loadComponent: () => import('./modulos/modulos.component').then((m) => m.ModulosComponent),
                canActivate: [RoleGuard],
                data: { rolesPermitidos: ['ROLE_ADMINISTRADOR', 'ROLE_USUARIO'] }
            },
            {
                path: 'gestion-modulo',
                loadComponent: () => import('./modulos/gestion-modulo/gestion-modulo.component').then((m) => m.GestionModuloComponent),
                canActivate: [RoleGuard],
                data: { rolesPermitidos: ['ROLE_ADMINISTRADOR', 'ROLE_USUARIO'] }
            },
            {
                path: 'versiones',
                loadComponent: () => import('./versiones/versiones.component').then((m) => m.VersionesComponent),
                canActivate: [RoleGuard],
                data: { rolesPermitidos: ['ROLE_ADMINISTRADOR', 'ROLE_USUARIO'] }
            },
            {
                path: 'gestion-version',
                loadComponent: () => import('./versiones/gestion-version/gestion-version.component').then((m) => m.GestionVersionComponent),
                canActivate: [RoleGuard],
                data: { rolesPermitidos: ['ROLE_ADMINISTRADOR', 'ROLE_USUARIO'] }
            },
            {
                path: 'paquetes',
                loadComponent: () => import('./paquetes/paquetes.component').then((m) => m.PaquetesComponent),
                canActivate: [RoleGuard],
                data: { rolesPermitidos: ['ROLE_ADMINISTRADOR', 'ROLE_USUARIO'] }
            },
            {
                path: 'gestion-paquete',
                loadComponent: () => import('./paquetes/gestion-paquete/gestion-paquete.component').then((m) => m.GestionPaqueteComponent),
                canActivate: [RoleGuard],
                data: { rolesPermitidos: ['ROLE_ADMINISTRADOR', 'ROLE_USUARIO'] }
            },
            {
                path: 'items-paquete',
                loadComponent: () => import('./paquetes/items-paquete/items-paquete.component').then((m) => m.ItemsPaqueteComponent),
                canActivate: [RoleGuard],
                data: { rolesPermitidos: ['ROLE_ADMINISTRADOR', 'ROLE_USUARIO'] }
            },
            {
                path: 'modulos-paquete',
                loadComponent: () => import('./paquetes/modulos-paquete/modulos-paquete.component').then((m) => m.ModulosPaqueteComponent),
                canActivate: [RoleGuard],
                data: { rolesPermitidos: ['ROLE_ADMINISTRADOR', 'ROLE_USUARIO'] }
            },
            {
                path: 'gestion-itempq',
                loadComponent: () => import('./paquetes/items-paquete/gestion-itempq/gestion-itempq.component').then((m) => m.GestionItempqComponent),
                canActivate: [RoleGuard],
                data: { rolesPermitidos: ['ROLE_ADMINISTRADOR', 'ROLE_USUARIO'] }
            },
            {
                path: 'gestion-modulopq',
                loadComponent: () => import('./paquetes/modulos-paquete/gestion-modulopq/gestion-modulopq.component').then((m) => m.GestionModulopqComponent),
                canActivate: [RoleGuard],
                data: { rolesPermitidos: ['ROLE_ADMINISTRADOR', 'ROLE_USUARIO'] }
            },
            {
                path: 'estadisticas',
                loadComponent: () => import('./estadisticas/estadisticas.component').then((m) => m.EstadisticasComponent),
                canActivate: [RoleGuard],
                data: { rolesPermitidos: ['ROLE_ADMINISTRADOR', 'ROLE_USUARIO'] }
            }
        ]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class AplicacionesRoutingModule { }
