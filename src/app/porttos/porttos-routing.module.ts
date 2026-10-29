import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { RoleGuard } from '../guards/role.guard';

const routes: Routes = [
    {
        path: '',
        // component: DashboardPanelComponent,
        children: [
            {
                path: '',
                redirectTo: 'dahboard-panel',
                pathMatch: 'full'
            },
            {
                path: 'dahboard-panel',
                loadComponent: () => import('./administacion/dashboard-panel/dashboard-panel.component')
                    .then(c => c.DashboardPanelComponent),
                canActivate: [RoleGuard],
                data: { rolesPermitidos: ['ROLE_ADMINISTRADOR', 'ROLE_USUARIO'] }
            },
            {
                path: 'panel-control',
                loadComponent: () => import('./administacion/panel-control/panel-control.component')
                    .then(c => c.PanelControlComponent),
                canActivate: [RoleGuard],
                data: { rolesPermitidos: ['ROLE_ADMINISTRADOR', 'ROLE_USUARIO'] }
            },
            {
                path: 'ingesta-panel',
                loadComponent: () => import('./administacion/ingesta-panel/ingesta-panel.component')
                    .then(c => c.IngestaPanelComponent),
                canActivate: [RoleGuard],
                data: { rolesPermitidos: ['ROLE_ADMINISTRADOR', 'ROLE_USUARIO'] }
            },
            {
                path: 'torre-control',
                loadComponent: () => import('./torre-control/torre-control.component')
                    .then(c => c.TorreControlComponent),
                canActivate: [RoleGuard],
                data: { rolesPermitidos: ['ROLE_ADMINISTRADOR', 'ROLE_USUARIO'] }
            },
            {
                path: 'puertos-panel',
                loadComponent: () => import('./administacion/puertos-panel/puertos-panel.component')
                    .then(c => c.PuertosPanelComponent),
                canActivate: [RoleGuard],
                data: { rolesPermitidos: ['ROLE_ADMINISTRADOR', 'ROLE_USUARIO'] }
            },
            {
                path: 'gestion-puerto-panel',
                loadComponent: () => import('./administacion/puertos-panel/gestion-pueerto-panel/gestion-pueerto-panel.component')
                    .then(c => c.GestionPueertoPanelComponent),
                canActivate: [RoleGuard],
                data: { rolesPermitidos: ['ROLE_ADMINISTRADOR', 'ROLE_USUARIO'] }
            },
            {
                path: 'terminales-panel',
                loadComponent: () => import('./administacion/terminales-panel/terminales-panel.component')
                    .then(c => c.TerminalesPanelComponent),
                canActivate: [RoleGuard],
                data: { rolesPermitidos: ['ROLE_ADMINISTRADOR', 'ROLE_USUARIO'] }
            },
            {
                path: 'gestion-terminal-panel',
                loadComponent: () => import('./administacion/terminales-panel/gestion-terminal-panel/gestion-terminal-panel.component')
                    .then(c => c.GestionTerminalPanelComponent),
                canActivate: [RoleGuard],
                data: { rolesPermitidos: ['ROLE_ADMINISTRADOR', 'ROLE_USUARIO'] }
            },
            {
                path: 'muelles-panel',
                loadComponent: () => import('./administacion/muelles-panel/muelles-panel.component')
                    .then(c => c.MuellesPanelComponent),
                canActivate: [RoleGuard],
                data: { rolesPermitidos: ['ROLE_ADMINISTRADOR', 'ROLE_USUARIO'] }
            },
            {
                path: 'gestion-muelle-panel',
                loadComponent: () => import('./administacion/muelles-panel/gestion-muelle-panel/gestion-muelle-panel.component')
                    .then(c => c.GestionMuellePanelComponent),
                canActivate: [RoleGuard],
                data: { rolesPermitidos: ['ROLE_ADMINISTRADOR', 'ROLE_USUARIO'] }
            },
            {
                path: 'faros-panel',
                loadComponent: () => import('./administacion/faros-panel/faros-panel.component')
                    .then(c => c.FarosPanelComponent),
                canActivate: [RoleGuard],
                data: { rolesPermitidos: ['ROLE_ADMINISTRADOR', 'ROLE_USUARIO'] }
            },
            {
                path: 'gestion-faro-panel',
                loadComponent: () => import('./administacion/faros-panel/gestion-faro-panel/gestion-faro-panel.component')
                    .then(c => c.GestionFaroPanelComponent),
                canActivate: [RoleGuard],
                data: { rolesPermitidos: ['ROLE_ADMINISTRADOR', 'ROLE_USUARIO'] }
            },
            {
                path: 'infraestructuras-panel',
                loadComponent: () => import('./administacion/infraestructuras-panel/infraestructuras-panel.component')
                    .then(c => c.InfraestructurasPanelComponent),
                canActivate: [RoleGuard],
                data: { rolesPermitidos: ['ROLE_ADMINISTRADOR', 'ROLE_USUARIO'] }
            },
            {
                path: 'gestion-infraestructura',
                loadComponent: () => import('./administacion/infraestructuras-panel/gestion-infraestructura/gestion-infraestructura.component')
                    .then(c => c.GestionInfraestructuraComponent),
                canActivate: [RoleGuard],
                data: { rolesPermitidos: ['ROLE_ADMINISTRADOR', 'ROLE_USUARIO'] }
            },
            {
                path: 'tipos-infraestructura-panel',
                loadComponent: () => import('./administacion/tipos-infraestructura-panel/tipos-infraestructura-panel.component')
                    .then(c => c.TiposInfraestructuraPanelComponent),
                canActivate: [RoleGuard],
                data: { rolesPermitidos: ['ROLE_ADMINISTRADOR', 'ROLE_USUARIO'] }
            },
            {
                path: 'reglas-alertas-panel',
                loadComponent: () => import('./administacion/reglas-alertas-panel/reglas-alertas-panel.component')
                    .then(c => c.ReglasAlertasPanelComponent),
                canActivate: [RoleGuard],
                data: { rolesPermitidos: ['ROLE_ADMINISTRADOR'] }
            },
            {
                // Capa de análisis con IA, fase 4: configuración por puerto y tarea, prompts y métricas
                path: 'ia-admin-panel',
                loadComponent: () => import('./administacion/ia-admin-panel/ia-admin-panel.component')
                    .then(c => c.IaAdminPanelComponent),
                canActivate: [RoleGuard],
                data: { rolesPermitidos: ['ROLE_ADMINISTRADOR'] }
            },
            {
                path: 'cron-monitor',
                loadComponent: () => import('./administacion/cron-monitor/cron-monitor.component')
                    .then(c => c.CronMonitorComponent),
                canActivate: [RoleGuard],
                data: { rolesPermitidos: ['ROLE_ADMINISTRADOR', 'ROLE_USUARIO'] }
            },
            {
                path: 'gestion-tipo-infraestructura',
                loadComponent: () => import('./administacion/tipos-infraestructura-panel/gestion-tipo-infraestructura/gestion-tipo-infraestructura.component')
                    .then(c => c.GestionTipoInfraestructuraComponent),
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
export class PorttosRoutingModule { }
