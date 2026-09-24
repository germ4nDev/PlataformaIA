// /* eslint-disable @typescript-eslint/no-explicit-any */
// import { Injectable } from '@angular/core'
// import { HttpClient } from '@angular/common/http'
// import { environment } from 'src/environments/environment'
// import { map, tap } from 'rxjs/operators'
// import { PTLUsuarioModel } from '../_helpers/models/PTLUsuario.model'
// import { BehaviorSubject, Observable, Subject } from 'rxjs'
// import { SocketService } from './sockets.service'
// import { LocalStorageService } from './local-storage.service'
// import { SocketManagerService } from './socket-manager.service'
// import { PTLPestanaModel } from '../_helpers/models/PTLPestana.model'

// const base_url = environment.apiUrl

// @Injectable({
//     providedIn: 'root'
// })
// export class PtlpestanasService {
//     user: PTLUsuarioModel = new PTLUsuarioModel()
//     private _pestanas = new BehaviorSubject<PTLPestanaModel[]>([])
//     private _pestanasChange = new Subject<any>()
//     pestanasChange$ = this._pestanasChange.asObservable()

//     constructor(
//         private http: HttpClient,
//         private _socketService: SocketService,
//         private _socketManager: SocketManagerService,
//         private _localStorageService: LocalStorageService
//     ) {
//         console.log('******* Servicio de pestanas iniciado correctamente')
//         this._socketManager.pestanasActualizadoa$.subscribe({
//             next: (payload) => {
//                 console.log(`📡 Socket interceptado - Acción: ${payload.action}, ID: ${payload.id}`);
//                 this._pestanasChange.next(payload);
//                 this.cargarRegistros().subscribe();
//             },
//             error: (err) => console.error('Error escuchando al manager:', err)
//         });
//     }

//     get pestanas$(): Observable<PTLPestanaModel[]> {
//         return this._pestanas.asObservable()
//     }

//     getPestanasActuales(): PTLPestanaModel[] {
//         return this._pestanas.getValue()
//     }

//     cargarRegistros() {
//         console.log('Consultando y ordenando pestanas del servidor...')
//         const url = `${base_url}/pestanas`
//         return this.http.get(url).pipe(
//             map((resp: any) => resp.pestanas as PTLPestanaModel[]),
//             map((pestanas: PTLPestanaModel[]) => {
//                 return pestanas.sort((a: any, b: any) => a.nombrePestana.localeCompare(b.nombrePestana))
//             }),
//             tap(PestanasOrdenadas => {
//                 this._pestanas.next(PestanasOrdenadas)
//             })
//         )
//     }

//     getPestanas() {
//         const url = `${base_url}/pestanas/`
//         return this.http.get(url).pipe(
//             map((resp: any) => {
//                 console.log('respuesta servicio', resp)
//                 return {
//                     ok: true,
//                     pestanas: resp.pestanas
//                 }
//             })
//         )
//     }

//     getRegistroById(id: string) {
//         const url = `${base_url}/pestanas/${id}`
//         return this.http.get(url).pipe(
//             map((resp: any) => {
//                 console.log('data de pestanas', resp)
//                 return {
//                     ok: true,
//                     pestana: resp.pestana
//                 }
//             })
//         )
//     }

//     postCrearRegistro(data: PTLPestanaModel) {
//         console.log('registro servicio', data);
//         const url = `${base_url}/pestanas`
//         console.log('servicio de pestanas', data)
//         return this.http.post(url, data).pipe(
//             map((resp: any) => {
//                 return {
//                     ok: true,
//                     pestana: resp.pestana
//                 }
//             })
//         )
//     }

//     putModificarRegistro(pestana: PTLPestanaModel) {
//         const url = `${base_url}/pestanas/${pestana.codigoPestana}`
//         return this.http.put(url, pestana).pipe(
//             map((resp: any) => {
//                 console.log('data de pestana modificacda', resp)
//                 return {
//                     ok: true,
//                     pestana: resp.pestana
//                 }
//             })
//         )
//     }

//     deleteEliminarRegistro(_id: string) {
//         const url = `${base_url}/pestanas/${_id}`
//         return this.http.delete(url).pipe(
//             map((resp: any) => {
//                 console.log('data de pestana eliminado', resp)
//                 return {
//                     ok: true,
//                     pestana: resp.pestana
//                 }
//             })
//         )
//     }
// }
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { map, tap } from 'rxjs/operators';
import { PTLUsuarioModel } from '../_helpers/models/PTLUsuario.model';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { SocketService } from './sockets.service';
import { LocalStorageService } from './local-storage.service';
import { SocketManagerService } from './socket-manager.service';
import { PTLPestanaModel } from '../_helpers/models/PTLPestana.model';

const base_url = environment.apiUrl;

@Injectable({
    providedIn: 'root'
})
export class PtlpestanasService {
    user: PTLUsuarioModel = new PTLUsuarioModel();
    private _pestanas = new BehaviorSubject<PTLPestanaModel[]>([]);
    private _pestanasChange = new Subject<any>();
    pestanasChange$ = this._pestanasChange.asObservable();

    constructor(
        private http: HttpClient,
        private _socketService: SocketService,
        private _socketManager: SocketManagerService,
        private _localStorageService: LocalStorageService
    ) {
        console.log('******* Servicio de Pestañas iniciado correctamente');
        this._socketManager.pestanasActualizadoa$.subscribe({
            next: (payload) => {
                console.log(`📡 Socket interceptado - Acción: ${payload.action}, ID: ${payload.id}`);
                this._pestanasChange.next(payload);
                // Aquí podrías disparar cargarRegistros() o dejar que el componente escuche y recargue
                this.cargarRegistros().subscribe();
            },
            error: (err) => console.error('Error escuchando al manager de pestañas:', err)
        });
    }

    get pestanas$(): Observable<PTLPestanaModel[]> {
        return this._pestanas.asObservable();
    }

    getPestanasActuales(): PTLPestanaModel[] {
        return this._pestanas.getValue();
    }

    // ========================================================================
    // 🟢 NUEVO MÉTODO ORQUESTADOR: Consulta pestañas exclusivas de la Suite/App
    // ========================================================================
    obtenerPestanasDelContexto(codigoSuite: string, codigoAplicacion: string): Observable<any> {
        const url = `${base_url}/pestanas/${codigoSuite}/${codigoAplicacion}`;
        return this.http.get(url).pipe(
            tap((resp: any) => {
                // Actualizamos el BehaviorSubject global si la respuesta fue exitosa
                if (resp.success && resp.data) {
                    this._pestanas.next(resp.data);
                }
            })
        );
    }

    // ========================================================================
    // MÉTODOS CRUD ESTÁNDAR
    // ========================================================================

    cargarRegistros() {
        console.log('Consultando y ordenando pestañas globales del servidor...');
        const url = `${base_url}/pestanas`; // Si tienes un endpoint global
        return this.http.get(url).pipe(
            map((resp: any) => resp.data || resp.pestanas || []),
            map((pestanas: PTLPestanaModel[]) => {
                // 🟢 Mejoramos el ordenamiento usando la columna "orden" de la BD
                return pestanas.sort((a: any, b: any) => (a.orden || 0) - (b.orden || 0));
            }),
            tap(PestanasOrdenadas => {
                this._pestanas.next(PestanasOrdenadas);
            })
        );
    }

    getPestanas() {
        const url = `${base_url}/pestanas/`;
        return this.http.get(url).pipe(
            map((resp: any) => {
                console.log('Respuesta servicio getPestanas', resp);
                return {
                    ok: resp.success ?? true,
                    pestanas: resp.data || resp.pestanas
                };
            })
        );
    }

    getRegistroById(id: string) {
        const url = `${base_url}/pestanas/${id}`;
        return this.http.get(url).pipe(
            map((resp: any) => {
                console.log('Data de pestaña por ID', resp);
                return {
                    ok: resp.success ?? true,
                    pestana: resp.data || resp.pestana
                };
            })
        );
    }

    postCrearRegistro(data: PTLPestanaModel) {
        console.log('Enviando nueva pestaña', data);
        const url = `${base_url}/pestanas`;
        return this.http.post(url, data).pipe(
            map((resp: any) => {
                return {
                    ok: resp.success ?? true,
                    pestana: resp.data || resp.pestana
                };
            })
        );
    }

    putModificarRegistro(pestana: PTLPestanaModel) {
        const url = `${base_url}/pestanas/${pestana.codigoPestana}`;
        return this.http.put(url, pestana).pipe(
            map((resp: any) => {
                console.log('Pestaña modificada exitosamente', resp);
                return {
                    ok: resp.success ?? true,
                    pestana: resp.data || resp.pestana
                };
            })
        );
    }

    deleteEliminarRegistro(_id: string) {
        const url = `${base_url}/pestanas/${_id}`;
        return this.http.delete(url).pipe(
            map((resp: any) => {
                console.log('Pestaña eliminada', resp);
                return {
                    ok: resp.success ?? true,
                    pestana: resp.data || resp.pestana
                };
            })
        );
    }
}
