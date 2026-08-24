// Angular Import
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
    {
        path: '',
        children: [
            {
                path: 'funcionarios',
                loadComponent: () => import('./funcionarios/funcionarios.component').then((m) => m.FuncionariosComponent)
            },
            {
                path: 'gestion-funcionario',
                loadComponent: () => import('./funcionarios/gestion-funcionario/gestion-funcionario.component').then((m) => m.GestionFuncionarioComponent)
            },
            {
                path: 'cargos',
                loadComponent: () =>
                    import('./cargos/cargos.component').then((m) => m.CargosComponent)
            },
            {
                path: 'gestion-cargo',
                loadComponent: () =>
                    import('./cargos/gestion-cargo/gestion-cargo.component').then((m) => m.GestionCargoComponent)
            },
            {
                path: 'procesos',
                loadComponent: () => import('./procesos/procesos.component').then((m) => m.ProcesosComponent)
            },
            {
                path: 'gestion-proceso',
                loadComponent: () => import('./procesos/gestion-proceso/gestion-proceso.component').then((m) => m.GestionProcesoComponent)
            },
            {
                path: 'empresas',
                loadComponent: () => import('./empresas/empresas.component').then((m) => m.EmpresasComponent)
            },
            {
                path: 'gestion-empresa',
                loadComponent: () => import('./empresas/gestion-empresa/gestion-empresa.component').then((m) => m.GestionEmpresaComponent)
            }
        ]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class AdministracionRoutingModule { }
