/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { BehaviorSubject, Observable, Subject, throwError } from 'rxjs';
import { SocketManagerService } from './socket-manager.service';
import { PTLWidgetRoleModel } from '../_helpers/models/PTLWidgetRole.model';

const base_url = environment.apiUrl;

@Injectable({
    providedIn: 'root'
})
export class PtlWidgetsRolesService {
    private _widgetsRoles = new BehaviorSubject<PTLWidgetRoleModel[]>([]);
    private _widgetsRolesChange = new Subject<any>();

    widgetsRolesChange$ = this._widgetsRolesChange.asObservable();

    constructor(
        private http: HttpClient,
        private _socketManager: SocketManagerService
    ) {
        console.log('******* Servicio de Widgets Roles iniciado correctamente');

        if (this._socketManager.widgetsRolesActualizados$) {
            this._socketManager.widgetsRolesActualizados$.subscribe({
                next: (payload: any) => {
                    console.log(`📡 Socket interceptado [WidgetsRoles] - Acción: ${payload.action}`);
                    this._widgetsRolesChange.next(payload);
                    // Recargamos el estado global silenciosamente
                    this.cargarRegistros().subscribe();
                },
                error: (err: any) => console.error('Error escuchando al manager de widgets-roles:', err)
            });
        }
    }

    get widgetsRoles$(): Observable<PTLWidgetRoleModel[]> {
        return this._widgetsRoles.asObservable();
    }

    getWidgetRolesActuales(): PTLWidgetRoleModel[] {
        return this._widgetsRoles.getValue();
    }

    // 🟢 Método utilizado en tu forkJoin del Login
    cargarRegistros() {
        console.log('Consultando asignaciones de widgets-roles del servidor...');
        const url = `${base_url}/widgets-roles`;
        return this.http.get(url).pipe(
            map((resp: any) => resp.widgetsRoles as PTLWidgetRoleModel[]),
            tap((RolesOrdenadas) => {
                console.log('actividades roles servicio', RolesOrdenadas);

                this._widgetsRoles.next(RolesOrdenadas);
            })
        );
    }

    getAsignaciones() {
        const url = `${base_url}/widgets-roles`;
        return this.http.get(url).pipe(
            map((resp: any) => {
                return {
                    ok: true,
                    widgetsRole: resp.widgetsRole
                };
            })
        );
    }

    asignarRolAWidget(data: any) {
        const url = `${base_url}/widgets-roles`;
        console.log('Servicio Widgets Roles (Crear)', data);
        return this.http.post(url, data).pipe(
            map((resp: any) => {
                return {
                    ok: true,
                    widgetsRole: resp.widgetsRole
                };
            }),
            catchError((error: HttpErrorResponse) => {
                const errorMessage = error.error?.msg || 'Error al asignar el rol';
                return throwError(() => errorMessage);
            })
        );
    }

    postCrearBulkRegistro(codigoWidget: string, data: PTLWidgetRoleModel[]) {
        const url = `${base_url}/widgets-roles/bulk/${codigoWidget}`;
        console.log('servicio widgetsRoles', data);
        return this.http.post(url, data).pipe(
            map((resp: any) => {
                return {
                    ok: true,
                    widgetRoles: resp.widgetRoles
                };
            })
        );
    }

    toggleEstadoRelacion(codigoWidget: string, codigoRol: string, data: any) {
        // La URL coincide con el endpoint del controlador Node (/:codigoWidget/:codigoRol)
        const url = `${base_url}/widgets-roles/${codigoWidget}/${codigoRol}`;
        return this.http.put(url, data).pipe(
            map((resp: any) => {
                console.log('Data de asignación modificada', resp);
                return {
                    ok: true,
                    widgetRole: resp.widgetRole
                };
            }),
            catchError((error: HttpErrorResponse) => {
                const errorMessage = error.error?.msg || 'Error al actualizar el estado';
                return throwError(() => errorMessage);
            })
        );
    }

    removerRolDeWidget(codigoWidget: string, codigoRol: string) {
        const url = `${base_url}/widgets-roles/${codigoWidget}/${codigoRol}`;
        return this.http.delete(url).pipe(
            map((resp: any) => {
                console.log('Data de asignación eliminada', resp);
                return {
                    ok: true,
                    msg: resp.msg
                };
            }),
            catchError((error: HttpErrorResponse) => {
                const errorMessage = error.error?.msg || 'Error al eliminar la asignación';
                return throwError(() => errorMessage);
            })
        );
    }
}
