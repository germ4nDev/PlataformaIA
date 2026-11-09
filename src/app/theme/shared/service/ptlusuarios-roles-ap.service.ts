/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { environment } from 'src/environments/environment'
import { map, tap } from 'rxjs/operators'
import { PTLUsuarioModel } from '../_helpers/models/PTLUsuario.model'
import { LocalStorageService } from './local-storage.service'
import { BehaviorSubject, Observable, Subject } from 'rxjs'
import { SocketService } from './sockets.service'
import { PTLUsuarioRoleAPModel } from '../_helpers/models/PTLUsuarioRole.model'
import { SocketManagerService } from './socket-manager.service'
const base_url = environment.apiUrl

@Injectable({
    providedIn: 'root'
})
export class PtlusuariosRolesApService {
    user: PTLUsuarioModel = new PTLUsuarioModel()
    private _usuariosRoles = new BehaviorSubject<PTLUsuarioRoleAPModel[]>([])
    private _usuariosRolesChange = new Subject<any>()
    _usuariosRolesChange$ = this._usuariosRolesChange.asObservable()

    constructor(
        private http: HttpClient,
        private _socketService: SocketService,
        private _socketManager: SocketManagerService,
        private _localStorageService: LocalStorageService
    ) {
        console.log('******* Servicio de usuariosRoles iniciado correctamente')
        this._socketManager.actividadesRolesActualizadas$.subscribe({
            next: (payload) => {
                console.log(`📡 Socket interceptado - Acción: ${payload.action}, ID: ${payload.id}`);
                this._usuariosRolesChange.next(payload);
                this.cargarRegistros().subscribe();
            },
            error: (err) => console.error('Error escuchando al manager:', err)
        });
    }

    get _usuariosRoles$(): Observable<PTLUsuarioRoleAPModel[]> {
        return this._usuariosRoles.asObservable()
    }

    getUsuairosRolesActuales(): PTLUsuarioRoleAPModel[] {
        return this._usuariosRoles.getValue()
    }

    // CC-135: retirado getRolesPorUsuarioYEmpresa (llamaba a /usuarios-roles/usuario/:id/empresa/:id, que no existe en el API; sin uso). Copia en _respaldos/2026-11-07_roles-gestion-usuario/paso2

    cargarRegistros() {
        console.log('Consultando y ordenando usuariosRoles del servidor...')
        const url = `${base_url}/usuarios-roles`
        return this.http.get(url).pipe(
            map((resp: any) => resp.usuariosRoles as PTLUsuarioRoleAPModel[]),
            tap(RolesOrdenadas => {
                console.log(`usuariosRoles cargados: ${RolesOrdenadas.length}`)
                this._usuariosRoles.next(RolesOrdenadas)
            })
        )
    }

    getRegistros() {
        const url = `${base_url}/usuarios-roles`
        return this.http.get(url).pipe(
            map((resp: any) => {
                console.log('servicio de usuariosRoles', resp)
                return {
                    ok: true,
                    usuariosRoles: resp.usuariosRoles
                }
            })
        )
    }

    getRegistroById(id: StreamPipeOptions) {
        const url = `${base_url}/usuarios-roles/${id}`
        return this.http.get(url).pipe(
            map((resp: any) => {
                console.log('data de usuarios-roles', resp)
                return {
                    ok: true,
                    usuarioRole: resp.usuarioRole
                }
            })
        )
    }

    // CC-135: retirado getRegistroByCodigoRol (llamaba a /usuarios-roles/role/:id, que no existe en el API; sin uso). Copia en _respaldos/2026-11-07_roles-gestion-usuario/paso2

    // CC-134: retirado getRegistroByCodigoUsuario (llamaba GET /usuarios-roles/usuario/:id, que no existe)

    postUsuarioRole(data: PTLUsuarioRoleAPModel) {
        console.log('********** crear el usuarioRole', data)

        const url = `${base_url}/usuarios-roles`
        return this.http.post(url, data).pipe(
            map((resp: any) => {
                console.log('respuesta servicio usuarioRoles', resp)
                return {
                    ok: true,
                    usuarioRole: resp.usuarioRole
                }
            })
        )
    }

    postSincronizarRoles(payloadSync: any): Observable<any> {
        // Ajusta la URL base según cómo tengas configurado tu environment
        // y el nombre exacto de la ruta en tu backend Node.js
        const url = `${base_url}/usuarios-roles/sincronizar`;
        return this.http.post(url, payloadSync).pipe(
            map((resp: any) => {
                console.log('respuesta servicio usuarioRoles', resp)
                return {
                    ok: true,
                    usuarioRole: resp.usuarioRole
                }
            })
        )
    }

    postSincronizarUsuariosRol(payloadSync: any): Observable<any> {
        const url = `${base_url}/usuarios-roles/sincronizar-usuarios`;
        return this.http.post(url, payloadSync).pipe(
            map((resp: any) => {
                console.log('respuesta servicio usuarioRoles', resp)
                return {
                    ok: true,
                    usuarioRole: resp.usuarioRole
                }
            })
        )
    }

    putModificarRegistro(role: PTLUsuarioRoleAPModel) {
        console.log('data usuRole', role)
        const url = `${base_url}/usuarios-roles/${role.codigoUsuarioRole}`
        return this.http.put(url, role).pipe(
            map((resp: any) => {
                console.log('data de role modificacda', resp)
                return {
                    ok: true,
                    usuarioRole: resp.usuarioRole
                }
            })
        )
    }

    deleteEliminarRegistro(_id: number) {
        console.log('eliminar el registro id', _id)
        const url = `${base_url}/usuarios-roles/${_id}`
        return this.http.delete(url).pipe(
            map((resp: any) => {
                console.log('data de role eliminado', resp)
                return {
                    ok: true,
                    usuarioRole: resp.usuarioRole
                }
            })
        )
    }

    deleteTodosUsuarioRole(codigoRole: string) {
        const url = `${base_url}/usuarios-roles/${codigoRole}`
        return this.http.delete(url).pipe(
            map((resp: any) => {
                return resp
            })
        )
    }

    // CC-134: retirado deleteRolesPorUsuario (llamaba DELETE /usuarios-roles/clean-user/:id, que no existe)
}
