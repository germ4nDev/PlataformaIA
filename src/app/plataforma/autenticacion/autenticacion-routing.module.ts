import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PermisoGuard } from '../../guards/permiso.guard';
import { RoleGuard } from '../../guards/role.guard';

const routes: Routes = [
    {
        path: '',
        children: [
            {
                path: 'login',
                loadComponent: () => import('./login/login.component').then(m => m.LoginComponent)
            },
            {
                path: 'perfil-configuracion',
                loadComponent: () => import('./perfil-configuracion/perfil-configuracion.component').then(m => m.PerfilConfiguracionComponent)
            },
            {
                path: 'change-password',
                loadComponent: () => import('./change-password/change-password.component').then(m => m.ChangePasswordComponent)
            },
            {
                path: 'reset-password',
                loadComponent: () => import('./reset-password/reset-password.component').then(m => m.ResetPasswordComponent)
            }
        ]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class AutenticacionRoutingModule { }
