/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { environment } from 'src/environments/environment';
import { map, tap } from 'rxjs/operators';
import { PTLUsuarioModel } from '../_helpers/models/PTLUsuario.model';
import { PTLColorSettingModel } from '../_helpers/models/PTLColorSetting.model';
import { LocalStorageService } from './local-storage.service';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { SocketManagerService } from './socket-manager.service';

const base_url = environment.apiUrl;

@Injectable({
    providedIn: 'root'
})
export class PtlColoresSettingsService {
    user: PTLUsuarioModel = new PTLUsuarioModel();
    private _coloresSettings = new BehaviorSubject<PTLColorSettingModel[]>([])
    private _coloresSettingsChange = new Subject<any>()
    coloresSettingsChange$ = this._coloresSettingsChange.asObservable()

    constructor(
        private http: HttpClient,
        private _socketManager: SocketManagerService,
        private _localStorageService: LocalStorageService
    ) {
        console.log('******* Servicio de colores Setingos correctamente')

        this._socketManager.actividadesRolesActualizadas$.subscribe({
            next: (payload) => {
                console.log(`📡 Socket interceptado - Acción: ${payload.action}, ID: ${payload.id}`);
                this._coloresSettingsChange.next(payload);
                this.cargarColoresSettings().subscribe();
            },
            error: (err) => console.error('Error escuchando al manager:', err)
        });
    }

    get coloresSettomgs$(): Observable<PTLColorSettingModel[]> {
        return this._coloresSettings.asObservable()
    }

    getBAplicacionesActuales(): PTLColorSettingModel[] {
        return this._coloresSettings.getValue()
    }

    getRegistros() {
        const url = `${base_url}/colores`;
        return this.http.get(url)
            .pipe(
                map((resp: any) => {
                    // console.log('servicio de colores', resp);
                    return {
                        ok: true,
                        coloresNav: resp.coloresNav
                    };
                })
            );
    }

    cargarColoresSettings() {
        console.log('Consultando y ordenando coloresSettings del servidor...')
        const url = `${base_url}/colores`
        return this.http.get(url).pipe(
            map((resp: any) => resp.aplicaciones as PTLColorSettingModel[]),
            tap(coloresOredenados => {
                this._coloresSettings.next(coloresOredenados)
            })
        )
    }

    getRegistroById(id: string) {
        const url = `${base_url}/colores/${id}`;
        return this.http.get(url).pipe(
            map((resp: any) => {
                // console.log('data de colorNav', resp);
                return {
                    ok: true,
                    colorNav: resp.colorNav
                };
            })
        );
    }

    postCrearRegistro(data: PTLColorSettingModel) {
        console.log('objeto servicio', data);
        const url = `${base_url}/colores`
        return this.http.post(url, data).pipe(
            map((resp: any) => {
                return {
                    ok: true,
                    colorNav: resp.colorNav
                }
            })
        )
    }

    putModificarRegistro(colorNav: PTLColorSettingModel, settingId: string) {
        const url = `${base_url}/colores/${settingId}`;
        return this.http.put(url, colorNav).pipe(
            map((resp: any) => {
                // console.log('data de colorNav modificacda', resp);
                return {
                    ok: true,
                    colorNav: resp.colorNav
                };
            })
        );
    }

    deleteEliminarRegistro(_id: number) {
        const url = `${base_url}/colores/${_id}`;
        return this.http.delete(url).pipe(
            map((resp: any) => {
                // console.log('data de colorNav eliminado', resp);
                return {
                    ok: true,
                    colorNav: resp.colorNav
                };
            })
        );
    }
}
