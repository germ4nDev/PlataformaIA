/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { environment } from 'src/environments/environment'
import { map, tap } from 'rxjs/operators'
import { PTLUsuarioModel } from '../_helpers/models/PTLUsuario.model'
import { BehaviorSubject, Observable, Subject } from 'rxjs'
import { SocketService } from './sockets.service'
import { LocalStorageService } from './local-storage.service'
import { SocketManagerService } from './socket-manager.service'
import { PTLPestanaModel } from '../_helpers/models/PTLPestana.model'
import { PTLTipoWidgetModel } from '../_helpers/models/PTLTipoWidget.model'

const base_url = environment.apiUrl

@Injectable({
    providedIn: 'root'
})
export class PtltiposWidgetService {
    user: PTLUsuarioModel = new PTLUsuarioModel()
    private _tiposWidget = new BehaviorSubject<PTLTipoWidgetModel[]>([])
    private _tiposWidgetChange = new Subject<any>()
    tiposWidgetChange$ = this._tiposWidgetChange.asObservable()

    constructor(
        private http: HttpClient,
        private _socketService: SocketService,
        private _socketManager: SocketManagerService,
        private _localStorageService: LocalStorageService
    ) {
        console.log('******* Servicio de tiposWidget iniciado correctamente')
        this._socketManager.tiposWidgetActualizadoa$.subscribe({
            next: (payload) => {
                console.log(`📡 Socket interceptado - Acción: ${payload.action}, ID: ${payload.id}`);
                this._tiposWidgetChange.next(payload);
                this.cargarRegistros().subscribe();
            },
            error: (err) => console.error('Error escuchando al manager:', err)
        });
    }

    get tiposWidget$(): Observable<PTLPestanaModel[]> {
        return this._tiposWidget.asObservable()
    }

    getPestanasActuales(): PTLPestanaModel[] {
        return this._tiposWidget.getValue()
    }

    cargarRegistros() {
        console.log('Consultando y ordenando tiposWidget del servidor...')
        const url = `${base_url}/tipos-widget`
        return this.http.get(url).pipe(
            map((resp: any) => resp.tiposWidget as PTLPestanaModel[]),
            map((tiposWidget: PTLPestanaModel[]) => {
                return tiposWidget.sort((a: any, b: any) => a.nombreTipo.localeCompare(b.nombreTipo))
            }),
            tap(tiposWidgetOrdenadas => {
                this._tiposWidget.next(tiposWidgetOrdenadas)
            })
        )
    }

    getPestanas() {
        const url = `${base_url}/tipos-widget/`
        return this.http.get(url).pipe(
            map((resp: any) => {
                console.log('respuesta servicio', resp)
                return {
                    ok: true,
                    tiposWidget: resp.tiposWidget
                }
            })
        )
    }

    getRegistroById(id: string) {
        const url = `${base_url}/tipos-widget/${id}`
        return this.http.get(url).pipe(
            map((resp: any) => {
                console.log('data de tiposWidget', resp)
                return {
                    ok: true,
                    tipoWidget: resp.tipoWidget
                }
            })
        )
    }

    postCrearRegistro(data: PTLPestanaModel) {
        console.log('registro servicio', data);
        const url = `${base_url}/tipos-widget`
        console.log('servicio de tiposWidget', data)
        return this.http.post(url, data).pipe(
            map((resp: any) => {
                return {
                    ok: true,
                    tipoWidget: resp.tipoWidget
                }
            })
        )
    }

    putModificarRegistro(tipoWidget: PTLTipoWidgetModel) {
        const url = `${base_url}/tipos-widget/${tipoWidget.codigoTipo}`
        return this.http.put(url, tipoWidget).pipe(
            map((resp: any) => {
                console.log('data de pestana modificacda', resp)
                return {
                    ok: true,
                    tipoWidget: resp.tipoWidget
                }
            })
        )
    }

    deleteEliminarRegistro(_id: string) {
        const url = `${base_url}/tipos-widget/${_id}`
        return this.http.delete(url).pipe(
            map((resp: any) => {
                console.log('data de tipoWidget eliminado', resp)
                return {
                    ok: true,
                    tipoWidget: resp.tipoWidget
                }
            })
        )
    }
}
