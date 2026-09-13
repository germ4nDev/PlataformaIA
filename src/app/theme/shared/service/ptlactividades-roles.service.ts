/*
    Author: German Valencia
*/
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { map, tap } from 'rxjs/operators';
import { PTLActividadRoleModel } from '../_helpers/models/PTLActividadesRoles.model';
import { PTLUsuarioModel } from '../_helpers/models/PTLUsuario.model';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { SocketManagerService } from './socket-manager.service';
import { LocalStorageService } from './local-storage.service';

const base_url = environment.apiUrl;

@Injectable({
    providedIn: 'root'
})
export class PtlactividadesRolesService {
    user: PTLUsuarioModel = new PTLUsuarioModel();
    private _actividadesRoles = new BehaviorSubject<PTLActividadRoleModel[]>([]);
    private _actividadesRolesChange = new Subject<any>();

    actividadesRolesChange$ = this._actividadesRolesChange.asObservable();

    constructor(
        private http: HttpClient,
        private _socketManager: SocketManagerService,
        private _localStorageService: LocalStorageService
    ) {
        console.log('******* Servicio de actividadesRoles iniciado correctamente');

        this._socketManager.actividadesRolesActualizadas$.subscribe({
            next: (payload) => {
                console.log(`📡 Socket interceptado - Acción: ${payload.action}, ID: ${payload.id}`);

                this._actividadesRolesChange.next(payload);

                if (payload.action === 'delete') {
                    this.cargarRegistros().subscribe();
                    this.actualizarMemoriaDelUsuario(payload.action, payload.id);
                }
                else if (payload.action === 'update' || payload.action === 'create') {
                    this.cargarRegistros().subscribe(() => {
                        this.actualizarMemoriaDelUsuario(payload.action, payload.id);
                    });
                }
            },
            error: (err) => console.error('Error escuchando al manager:', err)
        });
    }

    get actividadesRoles$(): Observable<PTLActividadRoleModel[]> {
        return this._actividadesRoles.asObservable();
    }

    getActividadesRolesActuales(): PTLActividadRoleModel[] {
        return this._actividadesRoles.getValue();
    }

    private actualizarMemoriaDelUsuario(accion: string, registroId: string) {
        const currentUser = this._localStorageService.getCurrentUserLocalStorage();

        // Verificamos si hay alguien logueado
        if (!currentUser || !currentUser.usuario) return;

        // Aquí aplicas tu regla de negocio:
        // ¿Este cambio en las Actividades-Roles afecta al usuario actual?
        // (Por ejemplo, verificando si el ID del rol modificado pertenece a su lista de roles)

        const misRoles = this._localStorageService.roles || [];
        // Supongamos que el payload trae el codigoRole afectado
        // const meAfecta = misRoles.some(rol => rol.codigoRole === payload.codigoRole);

        // Si me afecta (o si prefieres actualizar siempre por seguridad):
        console.log('🔄 Actualizando permisos del usuario en sesión...');

        // Petición rápida para traer los nuevos permisos del usuario logueado
        // (Asumiendo que tienes un endpoint que te devuelve los roles de un usuario)
        // this.http.get(`${base_url}/usuarios/${currentUser.usuario.codigoUsuario}/roles`).subscribe(nuevosRoles => {
        //     this._localStorageService.setRolesLocalStorage(nuevosRoles);
        // });
    }

    cargarRegistros() {
        console.log('Consultando y ordenando actividadesRoles del servidor...');
        const url = `${base_url}/actividades-roles`;

        return this.http.get(url).pipe(
            map((resp: any) => resp.actividadesRoles as PTLActividadRoleModel[]),
            tap((RolesOrdenadas) => {
                console.log('actividades roles servicio', RolesOrdenadas);

                this._actividadesRoles.next(RolesOrdenadas);
            })
        );
    }

    getRegistroByCodeActividad(id: string) {
        const url = `${base_url}/actividades-roles/acti/${id}`;

        return this.http.get(url).pipe(
            map((resp: any) => {
                console.log('data de actividadesRoles', resp);
                return {
                    ok: true,
                    actividadesRoles: resp.actividadesRoles
                };
            })
        );
    }

    getRegistroByCodeRole(codigoRole: string) {
        const url = `${base_url}/actividades-roles/role/${codigoRole}`;

        return this.http.get(url).pipe(
            map((resp: any) => {
                console.log('data de actividadesRoles role', resp);

                return resp.data || [];
            })
        );
    }

    postCrearRegistro(data: PTLActividadRoleModel) {
        const url = `${base_url}/actividades-roles`;
        console.log('servicio actividadesRoles', data);

        return this.http.post(url, data).pipe(
            map((resp: any) => {
                return {
                    ok: true,
                    actividadRole: resp.actividadRole
                };
            })
        );
    }

    postCrearBulkRegistro(codigoActividad: string, data: PTLActividadRoleModel[]) {
        const url = `${base_url}/actividades-roles/bulk/${codigoActividad}`;
        console.log('servicio actividadesRoles', data);
        return this.http.post(url, data).pipe(
            map((resp: any) => {
                return {
                    ok: true,
                    actividadRole: resp.actividadRole
                };
            })
        );
    }

    putModificarRegistro(actividad: PTLActividadRoleModel) {
        console.log('modificar actividadesRoles', actividad);
        const url = `${base_url}/actividades-roles/${actividad.codigoActividadRole}`;
        return this.http.put(url, actividad).pipe(
            map((resp: any) => {
                console.log('data de actividad modificada', resp);
                return {
                    ok: true,
                    actividadRole: resp.actividadRole
                };
            })
        );
    }

    deleteEliminarRegistro(_id: string) {
        const url = `${base_url}/actividades-roles/${_id}`;

        return this.http.delete(url).pipe(
            map((resp: any) => {
                console.log('data de actividad eliminada', resp);
                return {
                    ok: true,
                    actividadRole: resp.actividadRole
                };
            })
        );
    }
}
