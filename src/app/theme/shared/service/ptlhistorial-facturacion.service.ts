/* eslint-disable @typescript-eslint/no-explicit-any */
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, map, Observable, Subject, tap } from 'rxjs';
import { environment } from 'src/environments/environment';
import { PTLUsuarioModel } from '../_helpers/models/PTLUsuario.model';
import { LocalStorageService } from './local-storage.service';
import { SocketService } from './sockets.service';
import { PTLHistorialFacturacionModel } from '../_helpers/models/PTLHistorialFacturacion.model';

const base_url = environment.apiUrl;

@Injectable({
    providedIn: 'root'
})
export class PTLHistorialFacturacionService {
    user: PTLUsuarioModel = new PTLUsuarioModel();
    private _historiales = new BehaviorSubject<PTLHistorialFacturacionModel[]>([]);
    private _historialesChange = new Subject<any>();
    historialesChange$ = this._historialesChange.asObservable();

    constructor(
        private http: HttpClient,
        private socketService: SocketService,
        private _localStorageService: LocalStorageService
    ) {
        // 🟢 AJUSTE: El evento que emite nuestro backend en Node.js se llama 'facturacion-actualizada'
        this.socketService.listen('facturacion-actualizada').subscribe({
            next: payload => {
                console.log('Evento de Socket.IO recibido:', payload.msg);
                this._historialesChange.next(payload);
                this.cargarRegistros().subscribe();
            },
            error: err => console.error('Error en la escucha de sockets:', err)
        });
    }

    get historiales$(): Observable<PTLHistorialFacturacionModel[]> {
        return this._historiales.asObservable();
    }

    getHistorialesActuales(): PTLHistorialFacturacionModel[] {
        return this._historiales.getValue();
    }

    cargarRegistros() {
        console.log('Consultando y ordenando historiales del servidor...');
        const url = `${base_url}/historial-facturacion`;
        return this.http.get(url).pipe(
            map((resp: any) => resp.historiales as PTLHistorialFacturacionModel[]),
            tap(historialesOrdenadas => {
                console.log('historiales sc servicio', historialesOrdenadas);
                this._historiales.next(historialesOrdenadas);
            })
        );
    }

    getRegistros() {
        const url = `${base_url}/historial-facturacion`;
        return this.http.get(url).pipe(
            map((resp: any) => {
                console.log('servicio de historiales sc', resp);
                return {
                    ok: true,
                    historiales: resp.historiales
                };
            })
        );
    }

    getRegistroById(id: string) {
        const url = `${base_url}/historial-facturacion/${id}`;
        return this.http.get(url).pipe(
            map((resp: any) => {
                console.log('data de historial', resp);
                return {
                    ok: true,
                    historial: resp.historial
                };
            })
        );
    }

    // =========================================================================
    // 🟢 CAMINO 1: PAGO EN LÍNEA (MERCADO PAGO BRICKS)
    // =========================================================================
    postProcesarPagoEnLinea(payload: { facturaData: PTLHistorialFacturacionModel, formData: any }) {
        const url = `${base_url}/historial-facturacion/procesar-crear`;
        return this.http.post(url, payload).pipe(
            map((resp: any) => {
                console.log('Respuesta MP en línea', resp);
                return {
                    ok: true,
                    respuestaMP: resp.respuestaMP
                };
            })
        );
    }

    // =========================================================================
    // 🟢 CAMINO 2: PAGO MANUAL (EFECTIVO / ADMINISTRADOR)
    // =========================================================================
    postCrearRegistroManual(historial: PTLHistorialFacturacionModel) {
        const url = `${base_url}/historial-facturacion/manual`;
        return this.http.post(url, historial).pipe(
            map((resp: any) => {
                console.log('Respuesta de creación manual', resp);
                return {
                    ok: true,
                    historial: resp.historial
                };
            })
        );
    }

    // =========================================================================
    // OPERACIONES CRUD BÁSICAS (ACTUALIZAR Y ELIMINAR)
    // =========================================================================
    putModificarRegistro(historial: PTLHistorialFacturacionModel) {
        const url = `${base_url}/historial-facturacion/${historial.codigoHistorial}`;
        return this.http.put(url, historial).pipe(
            map((resp: any) => {
                console.log('data de historial modificada', resp);
                return {
                    ok: true,
                    historial: resp.historial
                };
            })
        );
    }

    deleteEliminarRegistro(_id: string) {
        const url = `${base_url}/historial-facturacion/${_id}`;
        return this.http.delete(url).pipe(
            map((resp: any) => {
                console.log('data de historial eliminado', resp);
                return {
                    ok: true,
                    historial: resp.historial
                };
            })
        );
    }
}
