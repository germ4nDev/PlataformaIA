/* eslint-disable @typescript-eslint/no-explicit-any */
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, map, Observable, Subject, tap } from 'rxjs';
import { environment } from 'src/environments/environment';
import { PTLUsuarioModel } from '../_helpers/models/PTLUsuario.model';
import { LocalStorageService } from './local-storage.service';
import { SocketService } from './sockets.service';
import { PTLTiposRoleModel } from '../_helpers/models/PTLTiposRole.model'; // Asegúrate de crear este modelo

const base_url = environment.apiUrl;

@Injectable({
    providedIn: 'root'
})
export class PTLTiposRolesService {
    user: PTLUsuarioModel = new PTLUsuarioModel();
    private _tiposRoles = new BehaviorSubject<PTLTiposRoleModel[]>([]);
    private _tiposRolesChange = new Subject<any>();
    tiposRolesChange$ = this._tiposRolesChange.asObservable();

    constructor(
        private http: HttpClient,
        private socketService: SocketService,
        private _localStorageService: LocalStorageService
    ) {
        // Escuchando el evento del backend
        this.socketService.listen('tipos-roles-actualizados').subscribe({
            next: payload => {
                console.log('Evento de Socket.IO recibido:', payload.msg);
                this._tiposRolesChange.next(payload);
                this.cargarRegistros().subscribe();
            },
            error: err => console.error('Error en la escucha de sockets:', err)
        });
    }

    getRegistros() {
        const url = `${base_url}/tipos-roles`;
        return this.http.get(url).pipe(
            map((resp: any) => {
                console.log('servicio de tipos de roles', resp);
                return {
                    ok: true,
                    tiposRoles: resp.tiposRoles
                };
            })
        );
    }

    get tiposRoles$(): Observable<PTLTiposRoleModel[]> {
        return this._tiposRoles.asObservable();
    }

    getTiposRolesActuales(): PTLTiposRoleModel[] {
        return this._tiposRoles.getValue();
    }

    cargarRegistros() {
        console.log('Consultando y ordenando tipos de roles del servidor...');
        const url = `${base_url}/tipos-roles`;
        return this.http.get(url).pipe(
            map((resp: any) => resp.respuesta.msg as PTLTiposRoleModel[]),
            map((tipos: PTLTiposRoleModel[]) => {
                return tipos.sort((a: any, b: any) => a.nombreTipoRole.localeCompare(b.nombreTipoRole));
            }),
            tap(tiposOrdenados => {
                console.log('tipos de roles servicio', tiposOrdenados);
                this._tiposRoles.next(tiposOrdenados);
            })
        );
    }

    getRegistroById(id: string) {
        const url = `${base_url}/tipos-roles/${id}`;
        return this.http.get(url).pipe(
            map((resp: any) => {
                console.log('data de tipo de roles', resp);
                return {
                    ok: true,
                    tipoRoles: resp.respuesta.msg
                };
            })
        );
    }

    postCrearRegistro(tipoRoles: PTLTiposRoleModel) {
        const url = `${base_url}/tipos-roles`;
        console.log('data del tipo de roles', tipoRoles);
        return this.http.post(url, tipoRoles).pipe(
            map((resp: any) => {
                console.log('respuesta', resp);
                return {
                    ok: true,
                    tipoRoles: resp.respuesta.msg
                };
            })
        );
    }

    putModificarRegistro(tipoRoles: PTLTiposRoleModel) {
        // Asumiendo que codigoTipoRoles es la llave primaria
        const url = `${base_url}/tipos-roles/${tipoRoles.codigoTipoRole}`;
        return this.http.put(url, tipoRoles).pipe(
            map((resp: any) => {
                console.log('data de tipo de roles modificado', resp);
                return {
                    ok: true,
                    tipoRoles: resp.respuesta.msg
                };
            })
        );
    }

    deleteEliminarRegistro(_id: string) {
        const url = `${base_url}/tipos-roles/${_id}`;
        return this.http.delete(url).pipe(
            map((resp: any) => {
                console.log('data de tipo de roles eliminado', resp);
                return {
                    ok: true,
                    tipoRoles: resp.respuesta.msg
                };
            })
        );
    }
}
