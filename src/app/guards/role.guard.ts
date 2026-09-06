import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { PtlPermisosService } from '../theme/shared/service/ptlpermisos.service';
import { SwalAlertService } from '../theme/shared/service/swal-alert.service';

export const RoleGuard: CanActivateFn = (route, state) => {

    const _permisosService = inject(PtlPermisosService);
    const _swalService = inject(SwalAlertService);
    const router = inject(Router);

    // Leemos los roles que autorizaste en el archivo de rutas (espera un Array)
    const rolesPermitidos = route.data?.['rolesPermitidos'] as string[];

    // Si la ruta no exige ningún rol, la dejamos pasar
    if (!rolesPermitidos || rolesPermitidos.length === 0) {
        return true;
    }

    // 🔍 Verificamos si el usuario tiene al menos UNO de los roles requeridos
    const tieneAcceso = rolesPermitidos.some(rol => _permisosService.tieneRole(rol));

    if (tieneAcceso) {
        return true;
    } else {
        console.warn(`🛑 Acceso denegado a la URL. Roles requeridos:`, rolesPermitidos);

        _swalService.getAlertError('Tu rol actual no tiene acceso a este módulo');

        // Redirigimos para que no se queden en una pantalla bloqueada/en blanco
        // router.navigate(['/starter/inicio-aplicaciones']);

        return false;
    }
};
