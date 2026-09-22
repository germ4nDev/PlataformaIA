/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http'
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { LocalStorageService } from './local-storage.service';
import { SocketManagerService } from './socket-manager.service';
import { PTLItemModel } from '../_helpers/models/PTLItem.model';

const base_url = environment.apiUrl

@Injectable({
    providedIn: 'root'
})
export class PTLItemsService {
    private _items = new BehaviorSubject<any[]>([]);
    private _itemsChange = new Subject<any>()
    itemsChange$ = this._itemsChange.asObservable();

    constructor(
        private http: HttpClient,
        private _socketManager: SocketManagerService,
        private _localStorageService: LocalStorageService
    ) {
        console.log('******* Servicio de items iniciado correctamente')
        this._socketManager.itemsActualizadas$.subscribe({
            next: (payload) => {
                console.log(`📡 Socket interceptado - Acción: ${payload.action}, ID: ${payload.id}`);
                this._itemsChange.next(payload);
                this.cargarRegistros().subscribe();
            },
            error: (err) => console.error('Error escuchando al manager:', err)
        });
    }

    get items$(): Observable<PTLItemModel[]> {
        return this._items.asObservable()
    }

    getItemsActuales(): PTLItemModel[] {
        return this._items.getValue()
    }

    cargarRegistros() {
        console.log('Consultando y ordenando Listas de Precios del servidor...');
        const url = `${base_url}/items`;
        return this.http.get(url).pipe(
            map((resp: any) => resp.items as PTLItemModel[]),
            map((listas: any[]) => {
                return listas.sort((a: any, b: any) => (a.nombreItem || '').localeCompare(b.nombreItem || ''));
            }),
            tap(listasOrdenadas => {
                console.log('listas servicio', listasOrdenadas);
                this._items.next(listasOrdenadas);
            })
        );
    }

    getRegistroById(codigoItem: string): Observable<any> {
        return this.http.get<any>(`${base_url}/items/${codigoItem}`);
    }

    postCrearRegistro(data: PTLItemModel) {
        const url = `${base_url}/items`
        console.log('data del item', data)
        return this.http.post(url, data).pipe(
            map((resp: any) => {
                return {
                    ok: true,
                    item: resp.item
                }
            })
        )
    }

    putModificarRegistro(data: any): Observable<any> {
        return this.http.put<any>(`${base_url}/items/${data.codigoItem}`, data).pipe(
            tap((resp: any) => {
                if (resp.ok) {
                    const currentItems = this._items.value;
                    const updatedItems = currentItems.map(item =>
                        item.codigoItem === data.codigoItem ? data : item
                    );
                    this._items.next(updatedItems);
                }
            })
        );
    }

    deleteEliminarRegistro(codigoItem: string): Observable<any> {
        return this.http.delete<any>(`${base_url}/items/${codigoItem}`).pipe(
            tap((resp: any) => {
                if (resp.ok) {
                    const currentItems = this._items.value;
                    const filteredItems = currentItems.filter(item => item.codigoItem !== codigoItem);
                    this._items.next(filteredItems);
                }
            })
        );
    }
}
