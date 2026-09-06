import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PermisoGuard } from '../../guards/permiso.guard';
import { RoleGuard } from '../../guards/role.guard';

const routes: Routes = [
    {
        path: '',
        children: [
            {
                path: 'scripts',
                loadComponent: () => import('./scripts/scripts.component').then((m) => m.ScriptsComponent),
                canActivate: [RoleGuard],
                data: { rolesPermitidos: ['ROLE_ADMINISTRADOR', 'ROLE_USUARIO'] }
            },
            {
                path: 'gestion-script',
                loadComponent: () => import('./scripts/gestion-script/gestion-script.component').then((m) => m.GestionScriptComponent),
                canActivate: [RoleGuard],
                data: { rolesPermitidos: ['ROLE_ADMINISTRADOR', 'ROLE_USUARIO'] }
            },
            {
                path: 'servidores',
                loadComponent: () => import('./servidores/servidores.component').then((m) => m.ServidoresComponent),
                canActivate: [RoleGuard],
                data: { rolesPermitidos: ['ROLE_ADMINISTRADOR', 'ROLE_USUARIO'] }
            },
            {
                path: 'gestion-servidor',
                loadComponent: () => import('./servidores/gestion-servidor/gestion-servidor.component').then((m) => m.GestionServidorComponent),
                canActivate: [RoleGuard],
                data: { rolesPermitidos: ['ROLE_ADMINISTRADOR', 'ROLE_USUARIO'] }
            },
            {
                path: 'estadisticas',
                loadComponent: () => import('./estadisticas/estadisticas.component').then((m) => m.EstadisticasComponent),
                canActivate: [RoleGuard],
                data: { rolesPermitidos: ['ROLE_ADMINISTRADOR', 'ROLE_USUARIO'] }
            },
            {
                path: 'tipos-scripts',
                loadComponent: () => import('./tipos-scripts/tipos-scripts.component').then((m) => m.TiposScriptsComponent),
                canActivate: [RoleGuard],
                data: { rolesPermitidos: ['ROLE_ADMINISTRADOR', 'ROLE_USUARIO'] }
            },
            {
                path: 'gestion-tipo',
                loadComponent: () => import('./tipos-scripts/gestion-tipo/gestion-tipo.component').then((m) => m.GestionTipoComponent),
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
export class AdministracionBDRoutingModule { }
