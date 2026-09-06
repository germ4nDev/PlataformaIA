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
                path: 'usuarios',
                loadComponent: () => import('./usuarios/usuarios.component').then(m => m.UsuariosComponent),
                canActivate: [RoleGuard],
                data: { rolesPermitidos: ['ROLE_ADMINISTRADOR', 'ROLE_USUARIO'] }
            },
            {
                path: 'gestion-usuario',
                loadComponent: () => import('./usuarios/gestion-usuario/gestion-usuario.component').then(m => m.GestionUsuarioComponent),
                canActivate: [RoleGuard],
                data: { rolesPermitidos: ['ROLE_ADMINISTRADOR', 'ROLE_USUARIO'] }
            },
            {
                path: 'roles-usuario',
                loadComponent: () => import('./roles-usuarios/roles-usuarios.component').then(m => m.RolesUsuariosComponent),
                canActivate: [RoleGuard],
                data: { rolesPermitidos: ['ROLE_ADMINISTRADOR', 'ROLE_USUARIO'] }
            },
            {
                path: 'gestion-roles-usuario',
                loadComponent: () => import('./roles-usuarios/gestion-roles-usuario/gestion-roles-usuario.component').then(m => m.GestionRolesUsuarioComponent),
                canActivate: [RoleGuard],
                data: { rolesPermitidos: ['ROLE_ADMINISTRADOR', 'ROLE_USUARIO'] }
            },
            {
                path: 'usuarios-roles',
                loadComponent: () => import('./usuarios-roles/usuarios-roles.component').then(m => m.UsuariosRolesComponent),
                canActivate: [RoleGuard],
                data: { rolesPermitidos: ['ROLE_ADMINISTRADOR', 'ROLE_USUARIO'] }
            },
            {
                path: 'gestion-usuarios-role',
                loadComponent: () => import('./usuarios-roles/gestion-usuarios-role/gestion-usuarios-role.component').then(m => m.GestionUsuariosRoleComponent),
                canActivate: [RoleGuard],
                data: { rolesPermitidos: ['ROLE_ADMINISTRADOR', 'ROLE_USUARIO'] }
            },
            {
                path: 'roles',
                loadComponent: () => import('./roles/roles.component').then(m => m.RolesComponent),
                canActivate: [RoleGuard],
                data: { rolesPermitidos: ['ROLE_ADMINISTRADOR', 'ROLE_USUARIO'] }
            },
            {
                path: 'gestion-roles',
                loadComponent: () => import('./roles/gestion-roles/gestion-roles.component').then(m => m.GestionRolesComponent),
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
export class UsuariosRoutingModule { }
