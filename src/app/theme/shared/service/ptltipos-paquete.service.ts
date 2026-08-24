/* eslint-disable @typescript-eslint/no-explicit-any */
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, map, Observable, Subject, tap } from 'rxjs';
import { environment } from 'src/environments/environment';
import { PTLUsuarioModel } from '../_helpers/models/PTLUsuario.model';
import { LocalStorageService } from './local-storage.service';
import { SocketService } from './sockets.service';
import { PTLTipoPaqueteModel } from '../_helpers/models/PTLTiposPaquete.model'; // Asegúrate de crear este modelo

const base_url = environment.apiUrl;

@Injectable({
    providedIn: 'root'
})
export class PTLTiposPaqueteService {
    user: PTLUsuarioModel = new PTLUsuarioModel();
    private _tiposPaquete = new BehaviorSubject<PTLTipoPaqueteModel[]>([]);
    private _tiposPaqueteChange = new Subject<any>();
    tiposPaqueteChange$ = this._tiposPaqueteChange.asObservable();

    constructor(
        private http: HttpClient,
        private socketService: SocketService,
        private _localStorageService: LocalStorageService
    ) {
        // Escuchando el evento del backend
        this.socketService.listen('tipos-paquete-actualizados').subscribe({
            next: payload => {
                console.log('Evento de Socket.IO recibido:', payload.msg);
                this._tiposPaqueteChange.next(payload);
                this.cargarRegistros().subscribe();
            },
            error: err => console.error('Error en la escucha de sockets:', err)
        });
    }

    getRegistros() {
        const url = `${base_url}/tipos-paquete`;
        return this.http.get(url).pipe(
            map((resp: any) => {
                console.log('servicio de tipos de paquete', resp);
                return {
                    ok: true,
                    tiposPaquete: resp.respuesta.msg
                };
            })
        );
    }

    get tiposPaquete$(): Observable<PTLTipoPaqueteModel[]> {
        return this._tiposPaquete.asObservable();
    }

    getTiposPaqueteActuales(): PTLTipoPaqueteModel[] {
        return this._tiposPaquete.getValue();
    }

    cargarRegistros() {
        console.log('Consultando y ordenando tipos de paquete del servidor...');
        const url = `${base_url}/tipos-paquete`;
        return this.http.get(url).pipe(
            map((resp: any) => resp.respuesta.msg as PTLTipoPaqueteModel[]),
            map((tipos: PTLTipoPaqueteModel[]) => {
                return tipos.sort((a: any, b: any) => a.nombreTipoPaquete.localeCompare(b.nombreTipoPaquete));
            }),
            tap(tiposOrdenados => {
                console.log('tipos de paquete servicio', tiposOrdenados);
                this._tiposPaquete.next(tiposOrdenados);
            })
        );
    }

    getRegistroById(id: string) {
        const url = `${base_url}/tipos-paquete/${id}`;
        return this.http.get(url).pipe(
            map((resp: any) => {
                console.log('data de tipo de paquete', resp);
                return {
                    ok: true,
                    tipoPaquete: resp.respuesta.msg
                };
            })
        );
    }

    postCrearRegistro(tipoPaquete: PTLTipoPaqueteModel) {
        const url = `${base_url}/tipos-paquete`;
        console.log('data del tipo de paquete', tipoPaquete);
        return this.http.post(url, tipoPaquete).pipe(
            map((resp: any) => {
                console.log('respuesta', resp);
                return {
                    ok: true,
                    tipoPaquete: resp.respuesta.msg
                };
            })
        );
    }

    putModificarRegistro(tipoPaquete: PTLTipoPaqueteModel) {
        // Asumiendo que codigoTipoPaquete es la llave primaria
        const url = `${base_url}/tipos-paquete/${tipoPaquete.codigoTipoPaquete}`;
        return this.http.put(url, tipoPaquete).pipe(
            map((resp: any) => {
                console.log('data de tipo de paquete modificado', resp);
                return {
                    ok: true,
                    tipoPaquete: resp.respuesta.msg
                };
            })
        );
    }

    deleteEliminarRegistro(_id: string) {
        const url = `${base_url}/tipos-paquete/${_id}`;
        return this.http.delete(url).pipe(
            map((resp: any) => {
                console.log('data de tipo de paquete eliminado', resp);
                return {
                    ok: true,
                    tipoPaquete: resp.respuesta.msg
                };
            })
        );
    }
}
