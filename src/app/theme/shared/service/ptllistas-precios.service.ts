/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { map, tap } from 'rxjs/operators';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { SocketService } from './sockets.service';
import { LocalStorageService } from './local-storage.service';
import { SocketManagerService } from './socket-manager.service';

const base_url = environment.apiUrl;

@Injectable({
    providedIn: 'root'
})
export class PTLListasPreciosService {
    private _listasPrecios = new BehaviorSubject<any[]>([]);
    private _listasPreciosChange = new Subject<any>();
    listasPreciosChange$ = this._listasPreciosChange.asObservable();

    constructor(
        private http: HttpClient,
        private _socketService: SocketService,
        private _socketManager: SocketManagerService,
        private _localStorageService: LocalStorageService
    ) {
        console.log('******* Servicio de Listas de Precios iniciado correctamente');
        if (this._socketManager.listasPreciosActualizadas$) {
            this._socketManager.listasPreciosActualizadas$.subscribe({
                next: (payload: any) => {
                    console.log(`📡 Socket interceptado - Acción: ${payload.action}, ID: ${payload.id}`);
                    this._listasPreciosChange.next(payload);
                    this.cargarRegistros().subscribe();
                },
                error: (err: any) => console.error('Error escuchando al manager:', err)
            });
        }
    }

    get listasPrecios$(): Observable<any[]> {
        return this._listasPrecios.asObservable();
    }

    getListasActuales(): any[] {
        return this._listasPrecios.getValue();
    }

    cargarRegistros() {
        console.log('Consultando y ordenando Listas de Precios del servidor...');
        const url = `${base_url}/lista-precios`;

        return this.http.get(url).pipe(
            map((resp: any) => resp.data as any[]), // Extraemos el array del response estándar de QPLUS
            map((listas: any[]) => {
                return listas.sort((a: any, b: any) => (a.nombreLista || '').localeCompare(b.nombreLista || ''));
            }),
            tap(listasOrdenadas => {
                this._listasPrecios.next(listasOrdenadas);
            })
        );
    }

    getRegistroById(id: string) {
        const url = `${base_url}/lista-precios/${id}`;
        return this.http.get(url).pipe(
            map((resp: any) => {
                console.log('data de lista de precios', resp);
                return {
                    ok: true,
                    data: resp.data
                };
            })
        );
    }

    postCrearRegistro(data: any) {
        const url = `${base_url}/lista-precios`;
        console.log('servicio crear lista', data);
        return this.http.post(url, data).pipe(
            map((resp: any) => {
                return {
                    ok: true,
                    data: resp.data,
                    msg: resp.msg
                };
            })
        );
    }

    putModificarRegistro(id: string, data: any) {
        console.log('servicio modificar lista', data);
        const url = `${base_url}/lista-precios/${id}`;
        return this.http.put(url, data).pipe(
            map((resp: any) => {
                console.log('data de lista modificada', resp);
                return {
                    ok: true,
                    data: resp.data,
                    msg: resp.msg
                };
            })
        );
    }

    agregarPrecioDetalle(codigoLista: string, data: any) {
        const url = `${base_url}/lista-precios/${codigoLista}/detalles`;
        return this.http.post(url, data).pipe(
            map((resp: any) => {
                return {
                    ok: true,
                    data: resp.data,
                    msg: resp.msg
                };
            })
        );
    }

    actualizarPrecioDetalle(codigoDetalle: string, data: any) {
        const url = `${base_url}/lista-precios/detalles/${codigoDetalle}`;
        return this.http.put(url, data).pipe(
            map((resp: any) => {
                return {
                    ok: true,
                    data: resp.data,
                    msg: resp.msg
                };
            })
        );
    }

    eliminarPrecioDetalle(codigoDetalle: string) {
        const url = `${base_url}/lista-precios/detalles/${codigoDetalle}`;
        return this.http.delete(url).pipe(
            map((resp: any) => {
                console.log('precio detalle eliminado', resp);
                return {
                    ok: true,
                    msg: resp.msg
                };
            })
        );
    }
}
