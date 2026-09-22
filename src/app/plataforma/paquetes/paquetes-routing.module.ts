// Angular Import
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { RoleGuard } from '../../guards/role.guard';

const routes: Routes = [
    {
        path: '',
        // component: LayoutComponent,
        children: [
            {
                path: 'paquetes',
                loadComponent: () => import('./paquetes/paquetes.component').then((m) => m.PaquetesComponent),
                canActivate: [RoleGuard],
                data: { rolesPermitidos: ['ROLE_ADMINISTRADOR', 'ROLE_USUARIO'] }
            },
            {
                path: 'gestion-paquete',
                loadComponent: () =>
                    import('./paquetes/gestion-paquete/gestion-paquete.component').then((m) => m.GestionPaqueteComponent),
                canActivate: [RoleGuard],
                data: { rolesPermitidos: ['ROLE_ADMINISTRADOR', 'ROLE_USUARIO'] }
            },
            {
                path: 'items-paquete',
                loadComponent: () => import('./items-paquete/items-paquete.component').then((m) => m.ItemsPaqueteComponent),
                canActivate: [RoleGuard],
                data: { rolesPermitidos: ['ROLE_ADMINISTRADOR', 'ROLE_USUARIO'] }
            },
            {
                path: 'gestion-item=paquete',
                loadComponent: () => import('./items-paquete/gestion-itempq/gestion-itempq.component').then((m) => m.GestionItempqComponent),
                canActivate: [RoleGuard],
                data: { rolesPermitidos: ['ROLE_ADMINISTRADOR', 'ROLE_USUARIO'] }
            },
            {
                path: 'modulos-paquete',
                loadComponent: () => import('./modulos-paquete/modulos-paquete.component').then((m) => m.ModulosPaqueteComponent),
                canActivate: [RoleGuard],
                data: { rolesPermitidos: ['ROLE_ADMINISTRADOR', 'ROLE_USUARIO'] }
            },
            {
                path: 'gestion-modulo-paquete',
                loadComponent: () => import('./modulos-paquete/gestion-modulopq/gestion-modulopq.component').then((m) => m.GestionModulopqComponent),
                canActivate: [RoleGuard],
                data: { rolesPermitidos: ['ROLE_ADMINISTRADOR', 'ROLE_USUARIO'] }
            },
            {
                path: 'precios-paquete',
                loadComponent: () => import('./precios-paquete/precios-paquete.component').then((m) => m.PreciosPaqueteComponent),
                canActivate: [RoleGuard],
                data: { rolesPermitidos: ['ROLE_ADMINISTRADOR', 'ROLE_USUARIO'] }
            },
            {
                path: 'gestion-precio-paquete',
                loadComponent: () => import('./precios-paquete/gestion-precio-paquete/gestion-precio-paquete.component').then((m) => m.GestionPrecioPaqueteComponent),
                canActivate: [RoleGuard],
                data: { rolesPermitidos: ['ROLE_ADMINISTRADOR', 'ROLE_USUARIO'] }
            },
            {
                path: 'items',
                loadComponent: () => import('./items/items.component').then((m) => m.ItemsComponent),
                canActivate: [RoleGuard],
                data: { rolesPermitidos: ['ROLE_ADMINISTRADOR', 'ROLE_USUARIO'] }
            },
            {
                path: 'gestion-item',
                loadComponent: () => import('./items/gestion-item/gestion-item.component').then((m) => m.GestionItemComponent),
                canActivate: [RoleGuard],
                data: { rolesPermitidos: ['ROLE_ADMINISTRADOR', 'ROLE_USUARIO'] }
            },
            {
                path: 'tipos-item',
                loadComponent: () => import('./tipos-item/tipos-item.component').then((m) => m.TiposItemComponent),
                canActivate: [RoleGuard],
                data: { rolesPermitidos: ['ROLE_ADMINISTRADOR', 'ROLE_USUARIO'] }
            },
            {
                path: 'gestion-tipo-item',
                loadComponent: () => import('./tipos-item/gestion-tipo-item/gestion-tipo-item.component').then((m) => m.GestionTipoItemComponent),
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
export class PaquetesRoutingModule { }
