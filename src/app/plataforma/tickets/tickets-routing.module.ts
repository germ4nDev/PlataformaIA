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
                path: 'tickets',
                loadComponent: () => import('./tickets/tickets.component').then(m => m.TicketsComponent),
                canActivate: [RoleGuard],
                data: { rolesPermitidos: ['ROLE_ADMINISTRADOR', 'ROLE_USUARIO'] }
            },
            {
                path: 'gestion-ticket',
                loadComponent: () => import('./tickets/gestion-ticket/gestion-ticket.component').then(m => m.GestionTicketComponent),
                canActivate: [RoleGuard],
                data: { rolesPermitidos: ['ROLE_ADMINISTRADOR', 'ROLE_USUARIO'] }
            },
            {
                path: 'seguimientos',
                loadComponent: () => import('./seguimientos/seguimientos.component').then(m => m.SeguimientosComponent),
                canActivate: [RoleGuard],
                data: { rolesPermitidos: ['ROLE_ADMINISTRADOR', 'ROLE_USUARIO'] }
            },
            {
                path: 'gestion-seguimiento',
                loadComponent: () => import('./seguimientos/gestion-seguimiento/gestion-seguimiento.component').then(m => m.GestionSeguimientoComponent),
                canActivate: [RoleGuard],
                data: { rolesPermitidos: ['ROLE_ADMINISTRADOR', 'ROLE_USUARIO'] }
            },
            {
                path: 'estadisticas',
                loadComponent: () => import('./estadisticas/estadisticas.component').then(m => m.EstadisticasComponent),
                canActivate: [RoleGuard],
                data: { rolesPermitidos: ['ROLE_ADMINISTRADOR', 'ROLE_USUARIO'] }
            },
            {
                path: 'clases-ticket',
                loadComponent: () => import('./clases-ticket/clases-ticket.component').then(m => m.ClasesTicketComponent),
                canActivate: [RoleGuard],
                data: { rolesPermitidos: ['ROLE_ADMINISTRADOR', 'ROLE_USUARIO'] }
            },
            {
                path: 'gestion-clases-ticket',
                loadComponent: () => import('./clases-ticket/gestion-clases-ticket/gestion-clases-ticket.component').then(m => m.GestionClasesTicketComponent),
                canActivate: [RoleGuard],
                data: { rolesPermitidos: ['ROLE_ADMINISTRADOR', 'ROLE_USUARIO'] }
            },
            {
                path: 'requerimientos',
                loadComponent: () => import('./requerimientos/requerimientos.component').then(m => m.RequerimientosComponent),
                canActivate: [RoleGuard],
                data: { rolesPermitidos: ['ROLE_ADMINISTRADOR', 'ROLE_USUARIO'] }
            },
            {
                path: 'gestion-requerimiento',
                loadComponent: () => import('./requerimientos/gestion-requerimiento/gestion-requerimiento.component').then(m => m.GestionRequerimientoComponent),
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
export class TicketsRoutingModule { }
