/* eslint-disable @typescript-eslint/no-explicit-any */
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, map, Observable, Subject, tap } from 'rxjs';
import { environment } from 'src/environments/environment';
import { PTLUsuarioModel } from '../_helpers/models/PTLUsuario.model';
import { PTLTipoItemModel } from '../_helpers/models/PTLTipoItem.model';
import { LocalStorageService } from './local-storage.service';
import { SocketService } from './sockets.service';

const base_url = environment.apiUrl;

@Injectable({
    providedIn: 'root'
})
export class PtltiposItemsService {
    user: PTLUsuarioModel = new PTLUsuarioModel();
    private _registros = new BehaviorSubject<PTLTipoItemModel[]>([]);
    private _registrosChange = new Subject<any>();
    _registrosChange$ = this._registrosChange.asObservable();

    constructor(
        private http: HttpClient,
        private socketService: SocketService,
        private _localStorageService: LocalStorageService
    ) {
        this.socketService.listen('tickets-actualizados').subscribe({
            next: (payload) => {
                console.log('Evento de Socket.IO recibido:', payload.msg);
                this._registrosChange.next(payload);
                this.cargarRegistros().subscribe();
            },
            error: (err) => console.error('Error en la escucha de sockets:', err)
        });
    }

    get tiposItems$(): Observable<PTLTipoItemModel[]> {
        return this._registros.asObservable();
    }

    getTiposItemsActuales(): PTLTipoItemModel[] {
        return this._registros.getValue()
    }

    getRegistros() {
        const url = `${base_url}/tipos-item`;
        return this.http.get(url).pipe(
            map((resp: any) => {
                console.log('servicio de tipoItem', resp);
                return {
                    ok: true,
                    tiposItems: resp.tiposItems
                };
            })
        );
    }

    getRegistroById(codigo: string) {
        const url = `${base_url}/tipos-item/${codigo}`;
        return this.http.get(url).pipe(
            map((resp: any) => {
                console.log('data de tipoItem', resp);
                return {
                    ok: true,
                    tipoItem: resp.tipo
                };
            })
        );
    }

    cargarRegistros() {
        console.log('Consultando y ordenando tipos de items del servidor...');
        const url = `${base_url}/tipos-item`;
        return this.http.get(url).pipe(
            map((resp: any) => resp.tipos as PTLTipoItemModel[]),
            map((tipos: PTLTipoItemModel[]) => {
                return tipos.sort((a: any, b: any) => a.nombreTipo.localeCompare(b.nombreTipo));
            }),
            tap(tiposOrdenados => {
                console.log('tipos de items servicio', tiposOrdenados);
                this._registros.next(tiposOrdenados);
            })
        );
    }

    postCrearRegistro(tipoItem: PTLTipoItemModel) {
        console.log('servicio tipo itam', tipoItem);

        const url = `${base_url}/tipos-item`;
        console.log('data del tipo de Item', tipoItem);
        return this.http.post(url, tipoItem).pipe(
            map((resp: any) => {
                console.log('respuesta', resp);
                return {
                    ok: true,
                    tipoItem: resp.tipoItem
                };
            })
        );
    }

    putModificarRegistro(tipoItem: PTLTipoItemModel) {
        const url = `${base_url}/tipos-item/${tipoItem.codigoTipoItem}`;
        return this.http.put(url, tipoItem).pipe(
            map((resp: any) => {
                console.log('data de tipoItem modificacda', resp);
                return {
                    ok: true,
                    tipoItem: resp.tipoItem
                };
            })
        );
    }

    deleteEliminarRegistro(_id: number) {
        const url = `${base_url}/tipos-item/${_id}`;
        return this.http.delete(url).pipe(
            map((resp: any) => {
                console.log('data de tipoItem eliminado', resp);
                return {
                    ok: true,
                    tipoItem: resp.tipoItem
                };
            })
        );
    }
}
