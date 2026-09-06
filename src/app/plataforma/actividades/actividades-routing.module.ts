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
                path: 'actividades',
                loadComponent: () => import('./actividades/actividades.component').then((m) => m.ActividadesComponent),
                canActivate: [RoleGuard],
                data: { rolesPermitidos: ['ROLE_ADMINISTRADOR', 'ROLE_USUARIO'] }
            },
            {
                path: 'gestion-actividad',
                loadComponent: () => import('./actividades/gestiion-actividad/gestiion-actividad.component').then((m) => m.GestiionActividadComponent),
                canActivate: [RoleGuard],
                data: { rolesPermitidos: ['ROLE_ADMINISTRADOR', 'ROLE_USUARIO'] }
            },
            {
                path: 'actividades-roles',
                loadComponent: () => import('./actividades-roles/actividades-roles.component').then((m) => m.ActividadesRolesComponent),
                canActivate: [RoleGuard],
                data: { rolesPermitidos: ['ROLE_ADMINISTRADOR', 'ROLE_USUARIO'] }
            },
            {
                path: 'gestion-actividad-roles',
                loadComponent: () => import('./actividades-roles/gestion-actividad-role/gestion-actividad-role.component').then((m) => m.GestiionActividadRoleComponent),
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
export class ActividadesRoutingModule { }
