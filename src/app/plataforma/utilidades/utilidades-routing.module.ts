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
                // OT-027: llaves de traducción de los idiomas (es.json, en.json…)
                path: 'traducciones',
                loadComponent: () => import('./traducciones/traducciones.component').then(m => m.TraduccionesComponent),
                canActivate: [RoleGuard],
                data: { rolesPermitidos: ['ROLE_ADMINISTRADOR', 'ROLE_USUARIO'] }
            },
            {
                path: 'gestion-traduccion',
                loadComponent: () => import('./traducciones/gestion-traduccion/gestion-traduccion.component').then(m => m.GestionTraduccionComponent),
                canActivate: [RoleGuard],
                data: { rolesPermitidos: ['ROLE_ADMINISTRADOR', 'ROLE_USUARIO'] }
            },
            {
                // OT-027: llaves de traducción de los idiomas (es.json, en.json…)
                path: 'paises',
                loadComponent: () => import('./paises/paises.component').then(m => m.PaisesComponent),
                canActivate: [RoleGuard],
                data: { rolesPermitidos: ['ROLE_ADMINISTRADOR', 'ROLE_USUARIO'] }
            },
            {
                path: 'gestion-pais',
                loadComponent: () => import('./paises/gestion-pais/gestion-pais.component').then(m => m.GestionPaisComponent),
                canActivate: [RoleGuard],
                data: { rolesPermitidos: ['ROLE_ADMINISTRADOR', 'ROLE_USUARIO'] }
            },
            {
                // CC-203: Utilidades › Pestañas y Tipos de pestaña (patrón de los módulos de administración)
                path: 'pestanas',
                loadComponent: () => import('./pestanas/pestanas/pestanas.component').then(m => m.PestanasComponent),
                canActivate: [RoleGuard],
                data: { rolesPermitidos: ['ROLE_ADMINISTRADOR', 'ROLE_USUARIO'] }
            },
            {
                path: 'gestion-pestana',
                loadComponent: () => import('./pestanas/pestanas/gestion-pestana/gestion-pestana.component').then(m => m.GestionPestanaComponent),
                canActivate: [RoleGuard],
                data: { rolesPermitidos: ['ROLE_ADMINISTRADOR', 'ROLE_USUARIO'] }
            },
            {
                path: 'tipos-pestana',
                loadComponent: () => import('./pestanas/tipos-pestana/tipos-pestana.component').then(m => m.TiposPestanaComponent),
                canActivate: [RoleGuard],
                data: { rolesPermitidos: ['ROLE_ADMINISTRADOR', 'ROLE_USUARIO'] }
            },
            {
                path: 'gestion-tipo-pestana',
                loadComponent: () => import('./pestanas/tipos-pestana/gestion-tipo-pestana/gestion-tipo-pestana.component').then(m => m.GestionTipoPestanaComponent),
                canActivate: [RoleGuard],
                data: { rolesPermitidos: ['ROLE_ADMINISTRADOR', 'ROLE_USUARIO'] }
            },
            {
                // CC-204: Utilidades › Catálogos (tipos de rol, widget, pago, paquete, actividad, tipos de estado y estados)
                path: 'catalogos',
                pathMatch: 'full',
                redirectTo: 'catalogos/tipos-rol'
            },
            {
                path: 'catalogos/:catalogo',
                loadComponent: () => import('./catalogos/catalogos/catalogos.component').then(m => m.CatalogosComponent),
                canActivate: [RoleGuard],
                data: { rolesPermitidos: ['ROLE_ADMINISTRADOR', 'ROLE_USUARIO'] }
            },
            {
                path: 'gestion-catalogo/:catalogo',
                loadComponent: () => import('./catalogos/catalogos/gestion-catalogo/gestion-catalogo.component').then(m => m.GestionCatalogoComponent),
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
