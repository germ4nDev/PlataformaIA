// Angular Import
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PermisoGuard } from '../../guards/permiso.guard';
import { RoleGuard } from '../../guards/role.guard';

const routes: Routes = [
    {
        path: '',
        children: [
            {
                path: 'log-actividades',
                loadComponent: () => import('./log-actividades/log-actividades.component').then(m => m.LogActividadesComponent),
                canActivate: [RoleGuard],
                data: { rolesPermitidos: ['ROLE_ADMINISTRADOR', 'ROLE_USUARIO'] }
            },
            {
                path: 'log-actualizaciones',
                loadComponent: () => import('./log-actualizaciones/log-actualizaciones.component').then(m => m.LogActualizacionesComponent),
                canActivate: [RoleGuard],
                data: { rolesPermitidos: ['ROLE_ADMINISTRADOR', 'ROLE_USUARIO'] }
            },
            {
                path: 'log-transacciones',
                loadComponent: () => import('./log-transacciones/log-transacciones.component').then(m => m.LogTransaccionesComponent),
                canActivate: [RoleGuard],
                data: { rolesPermitidos: ['ROLE_ADMINISTRADOR', 'ROLE_USUARIO'] }
            },
            {
                path: 'estadisticas',
                loadComponent: () => import('./estadisticas/estadisticas.module').then(m => m.EstadisticasModule),
                canActivate: [RoleGuard],
                data: { rolesPermitidos: ['ROLE_ADMINISTRADOR', 'ROLE_USUARIO'] }
            },
            {
                path: 'tipos-logs',
                loadComponent: () => import('./tipos-logs/tipos-logs.component').then(m => m.TiposLogsComponent),
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
export class LogsRoutingModule { }
