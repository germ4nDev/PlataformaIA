import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PermisoGuard } from '../../guards/permiso.guard';
import { RoleGuard } from '../../guards/role.guard';

const routes: Routes = [
    {
        path: '',
        children: [
            {
                path: 'suscriptores',
                loadComponent: () => import('./suscriptores/suscriptores.component').then((m) => m.SuscriptoresComponent),
                canActivate: [RoleGuard],
                data: { rolesPermitidos: ['ROLE_ADMINISTRADOR', 'ROLE_USUARIO'] }
            },
            {
                path: 'gestion-suscriptor',
                loadComponent: () =>
                    import('./suscriptores/gestion-suscriptor/gestion-suscriptor.component').then((m) => m.GestionSuscriptorComponent),
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
                path: 'empresas',
                loadComponent: () => import('./empresas/empresas.component').then((m) => m.EmpresasComponent),
                canActivate: [RoleGuard],
                data: { rolesPermitidos: ['ROLE_ADMINISTRADOR', 'ROLE_USUARIO'] }
            },
            {
                path: 'usuarios-empresa',
                loadComponent: () => import('./usuarios-empresa/usuarios-empresa.component').then((m) => m.UsuariosEmpresaComponent),
                canActivate: [RoleGuard],
                data: { rolesPermitidos: ['ROLE_ADMINISTRADOR', 'ROLE_USUARIO'] }
            },
            {
                path: 'gestion-usuarios-empresa',
                loadComponent: () => import('./usuarios-empresa/gestion-usuario-empresa/gestion-usuario-empresa.component').then((m) => m.GestionUsuarioEmpresaComponent),
                canActivate: [RoleGuard],
                data: { rolesPermitidos: ['ROLE_ADMINISTRADOR', 'ROLE_USUARIO'] }
            },
            {
                path: 'gestion-empresa',
                loadComponent: () => import('./empresas/gestion-empresa/gestion-empresa.component').then((m) => m.GestionEmpresaComponent),
                canActivate: [RoleGuard],
                data: { rolesPermitidos: ['ROLE_ADMINISTRADOR', 'ROLE_USUARIO'] }
            },
            {
                path: 'usuarios-suscriptor',
                loadComponent: () => import('./usuarios-suscriptor/usuarios-suscriptor.component').then((m) => m.UsuariosSuscriptorComponent),
                canActivate: [RoleGuard],
                data: { rolesPermitidos: ['ROLE_ADMINISTRADOR', 'ROLE_USUARIO'] }
            },
            {
                path: 'gestion-usuario-suscriptor',
                loadComponent: () =>
                    import('./usuarios-suscriptor/gestion-usuario-suscrptor/gestion-usuario-suscrptor.component').then((m) => m.GestionUsuarioSuscrptorComponent),
                canActivate: [RoleGuard],
                data: { rolesPermitidos: ['ROLE_ADMINISTRADOR', 'ROLE_USUARIO'] }
            },
            {
                path: 'paquetes-suscriptor',
                loadComponent: () => import('./paquetes-suscriptor/paquetes-suscriptor.component').then((m) => m.PaquetesSuscriptorComponent),
                canActivate: [RoleGuard],
                data: { rolesPermitidos: ['ROLE_ADMINISTRADOR', 'ROLE_USUARIO'] }
            },
            {
                path: 'gestion-paquete-suscriptor',
                loadComponent: () => import('./paquetes-suscriptor/gestion-paquete-suscriptor/gestion-paquete-suscriptor.component').then((m) => m.GestionPaqueteSuscriptorComponent),
                canActivate: [RoleGuard],
                data: { rolesPermitidos: ['ROLE_ADMINISTRADOR', 'ROLE_USUARIO'] }
            },
        ]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class SuscriptorRoutingModule { }
