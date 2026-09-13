/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable } from '@angular/core'
import { HttpClient } from '@angular/common/http'

import { map, tap } from 'rxjs/operators'
import { PTLGaleria } from '../_helpers/models/PTLGaleria.model'
import { environment } from 'src/environments/environment'
import { BehaviorSubject, Observable, Subject } from 'rxjs'
import { SocketService } from './sockets.service'
import { LocalStorageService } from './local-storage.service'
import { SocketManagerService } from './socket-manager.service'

const base_url = environment.apiUrl

@Injectable({
    providedIn: 'root'
})
export class PtlGaleriasService {
    private _galeria = new BehaviorSubject<PTLGaleria[]>([])
    private _galeriaChange = new Subject<any>()
    galeriaChange$ = this._galeriaChange.asObservable()

    constructor(
        private http: HttpClient,
        private socketService: SocketService,
        private _socketManager: SocketManagerService,
        private _localStorageService: LocalStorageService
    ) {
        console.log('******* Servicio de galerias correctamente')
        this._socketManager.actividadesRolesActualizadas$.subscribe({
            next: (payload) => {
                console.log(`📡 Socket interceptado - Acción: ${payload.action}, ID: ${payload.id}`);
                this._galeriaChange.next(payload);
                this.cargarGaleria().subscribe();
            },
            error: (err) => console.error('Error escuchando al manager:', err)
        });
    }

    get galeria$(): Observable<PTLGaleria[]> {
        return this._galeria.asObservable()
    }

    getGaleriasActuales(): PTLGaleria[] {
        return this._galeria.getValue()
    }

    getGaleria() {
        console.log('Consultando galería')
        const url = `${base_url}/galerias`
        return this.http.get(url).pipe(
            map((resp: any) => {
                return {
                    ok: true,
                    galeria: resp.galeria || resp.galerias
                }
            })
        )
    }

    cargarGaleria() {
        console.log('Consultando y ordenando galería del servidor...')
        const url = `${base_url}/galerias`
        return this.http.get(url).pipe(
            map((resp: any) => (resp.galeria || resp.galerias) as PTLGaleria[]),
            map((galeria: PTLGaleria[]) => {
                return galeria.sort((a: any, b: any) => (a.nombreGaleria || '').localeCompare(b.nombreGaleria || ''))
            }),
            tap(galeriaOrdenada => {
                this._galeria.next(galeriaOrdenada)
            })
        )
    }

    getGaleriaById(id: string) {
        const url = `${base_url}/galerias/${id}`
        return this.http.get(url).pipe(
            map((resp: any) => {
                console.log('data de galería', resp)
                return {
                    ok: true,
                    galeria: resp.galeria
                }
            })
        )
    }

    getGaleriaByCode(code: string) {
        const url = `${base_url}/galerias/code/${code}`
        return this.http.get(url).pipe(
            map((resp: any) => {
                console.log('data de la galería', resp.galeria)
                return {
                    ok: true,
                    galeria: resp.galeria
                }
            })
        )
    }

    crearGaleria(data: PTLGaleria) {
        const url = `${base_url}/galerias`
        return this.http.post(url, data).pipe(
            map((resp: any) => {
                return {
                    ok: true,
                    galeria: resp.galeria
                }
            })
        )
    }

    actualizarGaleria(galeria: PTLGaleria) {
        const url = `${base_url}/galerias/${galeria.codigoGaleria}`
        return this.http.put(url, galeria).pipe(
            map((resp: any) => {
                console.log('data de galería modificada', resp)
                return {
                    ok: true,
                    galeria: resp.galeria
                }
            })
        )
    }

    eliminarGaleria(id: string) {
        console.log('eliminar galería', id)
        const url = `${base_url}/galerias/${id}`
        return this.http.delete(url).pipe(
            map((resp: any) => {
                console.log('data de galería eliminada', resp)
                return {
                    ok: true,
                    galeria: resp.galeria
                }
            })
        )
    }
}
