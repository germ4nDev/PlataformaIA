/* eslint-disable @typescript-eslint/no-explicit-any */
/*
    Author: German Valencia
    Pattern: PLATAFORMA Servicio - Widgets permitidos del usuario (regla 18, fase 2)
    Description: Los widgets que permiten los roles del usuario en la aplicación salen al entrar (rolesYWidgetsDeAplicacion,
      guardados en usuario.widgets). Este servicio los entrega como permisos (núcleo plataforma/sesion/nucleo/widgets-visibles)
      y los recalcula en vivo: cuando llega otra lista de Widgets por rol o del maestro (sockets widgets-roles-actualizados y
      widgets-actualizados; cada servicio recarga su lista), vuelve a cruzar los roles del usuario con widgetsDeRoles, guarda
      usuario.widgets y avisa por cambios$. La Torre de Control (catálogo y tablero) lo escucha.
*/
import { Injectable } from '@angular/core';
import { Subject, merge } from 'rxjs';
import { filter, skip } from 'rxjs/operators';
import { LocalStorageService } from './local-storage.service';
import { PtlWidgetsRolesService } from './ptlwidgets-roles.service';
import { PTLWidgetsMaestroService } from './ptlwidgets-maestro.service';
import { CanalWidgets, PermisosWidgets, permisosDeWidgets, widgetVisible, widgetsDeRoles } from 'src/app/plataforma/sesion/nucleo';

@Injectable({
    providedIn: 'root'
})
export class WidgetsPermitidosService {
    private _cambios = new Subject<PermisosWidgets | null>();
    /** Emite cuando cambian los widgets permitidos del usuario. */
    cambios$ = this._cambios.asObservable();

    constructor(
        private _localStorage: LocalStorageService,
        private _widgetsRoles: PtlWidgetsRolesService,
        private _widgetsMaestro: PTLWidgetsMaestroService
    ) {
        // Las listas vacías son las de arranque (aún sin cargar): no se recalcula con ellas
        merge(this._widgetsRoles.widgetsRoles$.pipe(skip(1)), this._widgetsMaestro.widgets$.pipe(skip(1)))
            .pipe(filter((lista: any) => Array.isArray(lista) && lista.length > 0))
            .subscribe(() => this.recalcular());
    }

    /** Permisos de la sesión actual; null si la sesión no trae usuario.widgets (entonces no se ve nada). */
    permisos(): PermisosWidgets | null {
        return permisosDeWidgets(this._localStorage.getCurrentUserLocalStorage()?.usuario?.widgets);
    }

    visible(codigoWidget: string, canal: CanalWidgets = 'web'): boolean {
        return widgetVisible(codigoWidget, this.permisos(), canal);
    }

    private recalcular(): void {
        const current = this._localStorage.getCurrentUserLocalStorage();
        const roles = current?.usuario?.roles;
        const widgetsRoles = this._widgetsRoles.getWidgetRolesActuales() || [];
        const maestro = this._widgetsMaestro.getWidgetsActuales() || [];
        if (!Array.isArray(roles) || !widgetsRoles.length || !maestro.length) return;

        const antes = JSON.stringify(this.permisos());
        current.usuario.widgets = widgetsDeRoles(roles, widgetsRoles, maestro);
        this._localStorage.setCurrentUserLocalStorage(current);
        const ahora = this.permisos();
        if (JSON.stringify(ahora) !== antes) this._cambios.next(ahora);
    }
}
