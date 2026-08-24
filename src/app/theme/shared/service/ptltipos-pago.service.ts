/* eslint-disable @typescript-eslint/no-explicit-any */
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, map, Observable, Subject, tap } from 'rxjs';
import { environment } from 'src/environments/environment';
import { PTLUsuarioModel } from '../_helpers/models/PTLUsuario.model';
import { LocalStorageService } from './local-storage.service';
import { SocketService } from './sockets.service';
import { PTLTipoPagoModel } from '../_helpers/models/PTLTiposPago.model'; // Asegúrate de crear este modelo

const base_url = environment.apiUrl;

@Injectable({
    providedIn: 'root'
})
export class PTLTiposPagoService {
    user: PTLUsuarioModel = new PTLUsuarioModel();
    private _tiposPago = new BehaviorSubject<PTLTipoPagoModel[]>([]);
    private _tiposPagoChange = new Subject<any>();
    tiposPagoChange$ = this._tiposPagoChange.asObservable();

    constructor(
        private http: HttpClient,
        private socketService: SocketService,
        private _localStorageService: LocalStorageService
    ) {
        // Escuchando el evento exacto que emite nuestro backend
        this.socketService.listen('tipos-pago-actualizados').subscribe({
            next: payload => {
                console.log('Evento de Socket.IO recibido:', payload.msg);
                this._tiposPagoChange.next(payload);
                this.cargarRegistros().subscribe();
            },
            error: err => console.error('Error en la escucha de sockets:', err)
        });
    }

    getRegistros() {
        const url = `${base_url}/tipos-pago`;
        return this.http.get(url).pipe(
            map((resp: any) => {
                console.log('servicio de tipos de pago', resp);
                return {
                    ok: true,
                    // Usamos resp.respuesta.msg porque así lo estructuramos en el controlador de Node
                    tiposPago: resp.respuesta.msg
                };
            })
        );
    }

    get tiposPago$(): Observable<PTLTipoPagoModel[]> {
        return this._tiposPago.asObservable();
    }

    getTiposPagoActuales(): PTLTipoPagoModel[] {
        return this._tiposPago.getValue();
    }

    cargarRegistros() {
        console.log('Consultando y ordenando tipos de pago del servidor...');
        const url = `${base_url}/tipos-pago`;
        return this.http.get(url).pipe(
            map((resp: any) => resp.respuesta.msg as PTLTipoPagoModel[]),
            map((tipos: PTLTipoPagoModel[]) => {
                return tipos.sort((a: any, b: any) => a.nombreTipoPago.localeCompare(b.nombreTipoPago));
            }),
            tap(tiposOrdenados => {
                console.log('tipos de pago servicio', tiposOrdenados);
                this._tiposPago.next(tiposOrdenados);
            })
        );
    }

    getRegistroById(id: string) {
        const url = `${base_url}/tipos-pago/${id}`;
        return this.http.get(url).pipe(
            map((resp: any) => {
                console.log('data de tipo de pago', resp);
                return {
                    ok: true,
                    tipoPago: resp.respuesta.msg
                };
            })
        );
    }

    postCrearRegistro(tipoPago: PTLTipoPagoModel) {
        const url = `${base_url}/tipos-pago`;
        console.log('data del tipo de pago', tipoPago);
        return this.http.post(url, tipoPago).pipe(
            map((resp: any) => {
                console.log('respuesta', resp);
                return {
                    ok: true,
                    tipoPago: resp.respuesta.msg
                };
            })
        );
    }

    putModificarRegistro(tipoPago: PTLTipoPagoModel) {
        // Asumiendo que codigoTipoPago es la llave primaria que usas para editar
        const url = `${base_url}/tipos-pago/${tipoPago.codigoTipoPago}`;
        return this.http.put(url, tipoPago).pipe(
            map((resp: any) => {
                console.log('data de tipo de pago modificado', resp);
                return {
                    ok: true,
                    tipoPago: resp.respuesta.msg
                };
            })
        );
    }

    deleteEliminarRegistro(_id: string) {
        const url = `${base_url}/tipos-pago/${_id}`;
        return this.http.delete(url).pipe(
            map((resp: any) => {
                console.log('data de tipo de pago eliminado', resp);
                return {
                    ok: true,
                    tipoPago: resp.respuesta.msg
                };
            })
        );
    }
}
