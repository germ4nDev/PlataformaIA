import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { PtlPermisosService } from '../theme/shared/service/ptlpermisos.service';
import { SwalAlertService } from '../theme/shared/service/swal-alert.service';

export const PermisoGuard: CanActivateFn = (route, state) => {

    const _permisosService = inject(PtlPermisosService);
    const _swalService = inject(SwalAlertService);
    const router = inject(Router);

    const permisoRequerido = route.data?.['permisoRequerido'];

    if (!permisoRequerido) {
        return true;
    }

    // 🔍 Usa el motor de "Actividades"
    const tieneAcceso = _permisosService.tienePermiso(permisoRequerido);

    if (tieneAcceso) {
        return true;
    } else {
        console.warn(`🛑 Acceso denegado a la URL. Falta el permiso: ${permisoRequerido}`);

        // Disparamos la alerta usando la inyección de arriba
        _swalService.getAlertError('No tienes permisos para acceder a este módulo');

        // 💡 Tip: Es buena idea descomentar el redirect para que no se queden en una pantalla blanca
        router.navigate(['/starter/inicio-aplicaciones']);

        return false;
    }
};
