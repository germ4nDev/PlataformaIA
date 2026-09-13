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
                path: 'colores-nav',
                loadComponent: () => import('./colores-nav/colores-nav.component').then(m => m.ColoresNavComponent),
                canActivate: [RoleGuard],
                data: { rolesPermitidos: ['ROLE_ADMINISTRADOR', 'ROLE_USUARIO'] }
            },
            {
                path: 'slider-inicio',
                loadComponent: () => import('./slider-inicio/slider-inicio.component').then(m => m.SliderInicioComponent),
                canActivate: [RoleGuard],
                data: { rolesPermitidos: ['ROLE_ADMINISTRADOR', 'ROLE_USUARIO'] }
            },
            {
                path: 'idiomas',
                loadComponent: () => import('./idiomas/idiomas.component').then(m => m.IdiomasComponent),
                canActivate: [RoleGuard],
                data: { rolesPermitidos: ['ROLE_ADMINISTRADOR', 'ROLE_USUARIO'] }
            },
            {
                path: 'gestion-slider',
                loadComponent: () => import('./slider-inicio/gestion-slider/gestion-slider.component').then(m => m.GestionSliderComponent),
                canActivate: [RoleGuard],
                data: { rolesPermitidos: ['ROLE_ADMINISTRADOR', 'ROLE_USUARIO'] }
            },
            {
                path: 'gestion-color',
                loadComponent: () => import('./colores-nav/gestion-color/gestion-color.component').then(m => m.GestionColorComponent),
                canActivate: [RoleGuard],
                data: { rolesPermitidos: ['ROLE_ADMINISTRADOR', 'ROLE_USUARIO'] }
            },
            {
                path: 'gestion-idioma',
                loadComponent: () => import('./idiomas/gestion-idioma/gestion-idioma.component').then(m => m.GestionIdiomaComponent),
                canActivate: [RoleGuard],
                data: { rolesPermitidos: ['ROLE_ADMINISTRADOR', 'ROLE_USUARIO'] }
            },
            {
                path: 'widgets',
                loadComponent: () => import('./widgets/widgets/widgets.component').then(m => m.WidgetsComponent),
                canActivate: [RoleGuard],
                data: { rolesPermitidos: ['ROLE_ADMINISTRADOR', 'ROLE_USUARIO'] }
            },
            {
                path: 'gestion-widget',
                loadComponent: () => import('./widgets/widgets/gestion-widget/gestion-widget.component').then(m => m.GestionWidgetComponent),
                canActivate: [RoleGuard],
                data: { rolesPermitidos: ['ROLE_ADMINISTRADOR', 'ROLE_USUARIO'] }
            },
            {
                path: 'widgets-roles',
                loadComponent: () => import('./widgets/widgets-roles/widgets-roles.component').then(m => m.WidgetsRolesComponent),
                canActivate: [RoleGuard],
                data: { rolesPermitidos: ['ROLE_ADMINISTRADOR', 'ROLE_USUARIO'] }
            },
            {
                path: 'gestion-widget-roles',
                loadComponent: () => import('./widgets/widgets-roles/gestion-widget-roles/gestion-widget-roles.component').then(m => m.GestionWidgetRolesComponent),
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
export class UtilidadesRoutingModule { }
