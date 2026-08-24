/* eslint-disable @typescript-eslint/no-explicit-any */
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, map, Observable, Subject, tap } from 'rxjs';
import { environment } from 'src/environments/environment';
import { PTLPaquetesSCModel } from '../_helpers/models/PTLPaquetesSC.model';
import { PTLUsuarioModel } from '../_helpers/models/PTLUsuario.model';
import { LocalStorageService } from './local-storage.service';
import { SocketService } from './sockets.service';

const base_url = environment.apiUrl;

@Injectable({
    providedIn: 'root'
})
export class PTLPaquetesSCService {
    user: PTLUsuarioModel = new PTLUsuarioModel();
    private _paquetesSC = new BehaviorSubject<PTLPaquetesSCModel[]>([])
    private _paquetesSCChange = new Subject<any>()
    paquetesSCChange$ = this._paquetesSCChange.asObservable()

    constructor(
        private http: HttpClient,
        private socketService: SocketService,
        private _localStorageService: LocalStorageService
    ) {
        this.socketService.listen('paquetes-sc-actualizados').subscribe({
            next: payload => {
                console.log('Evento de Socket.IO recibido:', payload.msg)
                this._paquetesSCChange.next(payload)
                this.cargarRegistros()
            },
            error: err => console.error('Error en la escucha de sockets:', err)
        })
    }

    getRegistros() {
        const url = `${base_url}/paquetes-sc`;
        return this.http.get(url).pipe(
            map((resp: any) => {
                console.log('servicio de paquetes sc', resp);
                return {
                    ok: true,
                    paquetes: resp.paquetes
                };
            })
        );
    }

    get paquetesSC$(): Observable<PTLPaquetesSCModel[]> {
        return this._paquetesSC.asObservable()
    }

    getPaquetesSCActuales(): PTLPaquetesSCModel[] {
        return this._paquetesSC.getValue()
    }

    cargarRegistros() {
        console.log('Consultando y ordenando paquetesSC del servidor...')
        const url = `${base_url}/paquetes-sc`
        return this.http.get(url).pipe(
            map((resp: any) => resp.paquetes as PTLPaquetesSCModel[]),
            tap(paquetesOrdenadas => {
                console.log('paquetes sc servicio', paquetesOrdenadas)
                this._paquetesSC.next(paquetesOrdenadas)
            })
        )
    }

    getRegistroById(id: number) {
        const url = `${base_url}/paquetes-sc/${id}`;
        return this.http.get(url).pipe(
            map((resp: any) => {
                console.log('data de paquete', resp);
                return {
                    ok: true,
                    paquete: resp.paquete
                };
            })
        );
    }

    postCrearRegistro(paquete: PTLPaquetesSCModel) {
        const url = `${base_url}/paquetes-sc`;
        return this.http.post(url, paquete).pipe(
            map((resp: any) => {
                console.log('respuesta', resp)
                return {
                    ok: true,
                    paquete: resp.paquete
                }
            })
        )
    }

    putModificarRegistro(paquete: PTLPaquetesSCModel) {
        const url = `${base_url}/paquetes-sc/${paquete.codigoSuscriptorPaquete}`;
        return this.http.put(url, paquete).pipe(
            map((resp: any) => {
                console.log('data de paquete modificacda', resp);
                return {
                    ok: true,
                    paquete: resp.paquete
                };
            })
        );
    }

    deleteEliminarRegistro(_id: number) {
        const url = `${base_url}/paquetes-sc/${_id}`;
        return this.http.delete(url).pipe(
            map((resp: any) => {
                console.log('data de paquete eliminado', resp);
                return {
                    ok: true,
                    paquete: resp.paquete
                };
            })
        );
    }
}
