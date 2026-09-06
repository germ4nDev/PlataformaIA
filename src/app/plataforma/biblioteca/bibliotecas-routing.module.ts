// Angular Import
import { NgModule } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'
import { PermisoGuard } from '../../guards/permiso.guard';
import { RoleGuard } from '../../guards/role.guard';

const routes: Routes = [
    {
        path: '',
        // component: LayoutComponent,
        children: [
            {
                path: 'bibliotecas',
                loadComponent: () => import('./bibliotecas/bibliotecas.component').then(m => m.BibliotecasComponent),
                canActivate: [RoleGuard],
                data: { rolesPermitidos: ['ROLE_ADMINISTRADOR', 'ROLE_USUARIO'] }
            },
            {
                path: 'gestion-biblioteca',
                loadComponent: () => import('./bibliotecas/gestion-biblioteca/gestion-biblioteca.component').then(m => m.GestionBibliotecaComponent),
                canActivate: [RoleGuard],
                data: { rolesPermitidos: ['ROLE_ADMINISTRADOR', 'ROLE_USUARIO'] }
            },
            {
                path: 'galeria',
                loadComponent: () => import('./galerias/galerias.component').then(m => m.GaleriasComponent),
                canActivate: [RoleGuard],
                data: { rolesPermitidos: ['ROLE_ADMINISTRADOR', 'ROLE_USUARIO'] }
            },
            {
                path: 'gestion-galeria',
                loadComponent: () => import('./galerias/gestion-galeria/gestion-galeria.component').then(m => m.GestionGaleriaComponent),
                canActivate: [RoleGuard],
                data: { rolesPermitidos: ['ROLE_ADMINISTRADOR', 'ROLE_USUARIO'] }
            },
            {
                path: 'tipos-galeria',
                loadComponent: () => import('./tipos-galeria/tipos-galeria.component').then(m => m.TiposGaleriaComponent),
                canActivate: [RoleGuard],
                data: { rolesPermitidos: ['ROLE_ADMINISTRADOR', 'ROLE_USUARIO'] }
            },
            {
                path: 'gestion-tipos-galeria',
                loadComponent: () =>
                    import('./tipos-galeria/gestion-tiposGaleria/gestion-tipos-galeria.component').then(m => m.GestionTiposGaleriaComponent),
                canActivate: [RoleGuard],
                data: { rolesPermitidos: ['ROLE_ADMINISTRADOR', 'ROLE_USUARIO'] }
            },
            {
                path: 'formatos-galeria',
                loadComponent: () => import('./formatos-galeria/formatos-galeria.component').then(m => m.FormatosGaleriaComponent),
                canActivate: [RoleGuard],
                data: { rolesPermitidos: ['ROLE_ADMINISTRADOR', 'ROLE_USUARIO'] }
            },
            {
                path: 'gestion-formatos-galeria',
                loadComponent: () =>
                    import('./formatos-galeria/gestion-formatos-galeria/gestion-formatos-galeria.component').then(m => m.GestionFormatosGaleriaComponent),
                canActivate: [RoleGuard],
                data: { rolesPermitidos: ['ROLE_ADMINISTRADOR', 'ROLE_USUARIO'] }
            }
        ]
    }
]

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class BibliotecasRoutingModule { }
