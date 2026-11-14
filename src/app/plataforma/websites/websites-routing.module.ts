// Angular Import
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
    {
        path: '',
        children: [
            {
                // Portal público porttos.co (OT-010): vive en la carpeta de Porttos (regla 27, CC-177); la plataforma lo sirve en /websites/porttos.
                // Cruce de la regla 26 pendiente hasta el cargador por manifiesto (OT-032 fase 3/4), como las demás apps en app-routing.
                path: 'porttos',
                loadChildren: () => import('../../apps/porttos/websites/portal/porttos.routes').then(m => m.PORTAL_PORTTOS)
            }
        ]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class WebsitesRoutingModule { }
