// Angular Import
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
    {
        path: '',
        children: [
            {
                // Portal público porttos.co (OT-010): contenedor con encabezado y pie propios y sus páginas hijas
                path: 'porttos',
                loadComponent: () => import('./porttos/porttos.component').then(m => m.PorttosComponent),
                loadChildren: () => import('./porttos/porttos.routes').then(m => m.PORTAL_RUTAS)
            }
        ]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class WebsitesRoutingModule { }
