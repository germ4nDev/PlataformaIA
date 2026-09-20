/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, Subject, throwError, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

import { PTLParametroSistemaModel } from '../_helpers/models/PTLParametroSistema.model';
import { LocalStorageService } from './local-storage.service';
import { SocketManagerService } from './socket-manager.service';

const base_url = environment.apiUrl;

@Injectable({
    providedIn: 'root'
})
export class PTLParametrosSistemaService {

    parametro: PTLParametroSistemaModel = new PTLParametroSistemaModel();

    // 🟢 Manejo de Estado Local QPLUS (BehaviorSubject)
    private _registros = new BehaviorSubject<PTLParametroSistemaModel[]>([]);
    private _registrosChange = new Subject<any>();
    _registrosChange$ = this._registrosChange.asObservable();

    constructor(
        private http: HttpClient,
        private _localStorageService: LocalStorageService,
        private _socketManager: SocketManagerService
    ) {
        console.log('******* Servicio de Parámetros del Sistema iniciado correctamente');

        // 🟢 Sockets: Escucha global de actualizaciones para recargar la tabla en tiempo real
        if (this._socketManager.parametrosActualizados$) {
            this._socketManager.parametrosActualizados$.subscribe({
                next: (payload: any) => {
                    console.log(`📡 Socket interceptado (Parámetros) - Acción: ${payload.action}`);
                    this._registrosChange.next(payload);
                    this.cargarRegistros().subscribe();
                },
                error: (err: any) => console.error('Error escuchando al manager de parámetros:', err)
            });
        }
    }

    // ==========================================
    // 🟢 GETTERS REACTIVOS
    // ==========================================
    get parametros$(): Observable<PTLParametroSistemaModel[]> {
        return this._registros.asObservable();
    }

    getParametrosActuales(): PTLParametroSistemaModel[] {
        return this._registros.getValue();
    }

    // ==========================================
    // 🟢 CARGA INICIAL Y MANTENIMIENTO DEL ESTADO
    // ==========================================
    cargarRegistros() {
        console.log('Consultando y ordenando parámetros del servidor...');
        const url = `${base_url}/parametros`;

        return this.http.get(url).pipe(
            map((resp: any) => resp.parametros as PTLParametroSistemaModel[]),
            map((regs: PTLParametroSistemaModel[]) => {
                // Ordenamos alfabéticamente por la llave lógica o el nombre
                return regs.sort((a: any, b: any) =>
                    (a.llaveParametro || '').localeCompare(b.llaveParametro || '')
                );
            }),
            tap(registrosOrdenados => {
                this._registros.next(registrosOrdenados);
            }),
            catchError((err: HttpErrorResponse) => {
                console.error('Error cargando el estado de parámetros:', err);
                return of([]);
            })
        );
    }

    // ==========================================
    // 🟢 CRUD DIRECTO A LA API
    // ==========================================
    getParametros() {
        const url = `${base_url}/parametros`;
        return this.http.get(url).pipe(
            map((resp: any) => {
                return {
                    ok: true,
                    parametros: resp.parametros
                };
            })
        );
    }

    getParametroByCodigo(id: string) {
        const url = `${base_url}/parametros/${id}`;
        return this.http.get(url).pipe(
            map((resp: any) => {
                console.log('respuesta servicio', resp);

                return {
                    ok: true,
                    parametro: resp.parametro
                };
            })
        );
    }

    crearParametro(data: PTLParametroSistemaModel) {
        const url = `${base_url}/parametros`;
        return this.http.post(url, data).pipe(
            map((resp: any) => {
                return {
                    ok: true,
                    parametro: resp.parametro,
                    msg: resp.msg
                };
            })
        );
    }

    actualizarParametro(id: string, data: PTLParametroSistemaModel) {
        const url = `${base_url}/parametros/${id}`;
        return this.http.put(url, data).pipe(
            map((resp: any) => {
                return {
                    ok: true,
                    parametro: resp.parametro,
                    msg: resp.msg
                };
            })
        );
    }

    eliminarParametro(id: string) {
        const url = `${base_url}/parametros/${id}`;
        return this.http.delete(url).pipe(
            map((resp: any) => {
                return {
                    ok: true,
                    msg: resp.msg
                };
            })
        );
    }
}
