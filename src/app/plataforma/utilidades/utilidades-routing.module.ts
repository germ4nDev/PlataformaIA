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
            }
        ]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class UtilidadesRoutingModule { }
