// Angular Import
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
    {
        path: '',
        children: [
            {
                path: 'parametros',
                loadComponent: () => import('./parametros/parametros.component').then(m => m.ParametrosComponent)
            },
            {
                path: 'gestion-parametro',
                loadComponent: () => import('./parametros/gestion-parametro/gestion-parametro.component').then(m => m.GestionParametroComponent)
            }
        ]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class SistemaRoutingModule { }
