// /*
//     Author: German Valencia
//     Refactored for: QPLUS Architecture & HTTP Client Communication
// */
// import { Injectable } from '@angular/core';
// import { HttpClient } from '@angular/common/http';
// import { BehaviorSubject, map, Observable, Subject, tap } from 'rxjs';
// import { environment } from 'src/environments/environment'
// import { PTLLayoutModel } from '../_helpers/models/PTLLayout.model';
// import { PTLUsuarioModel } from '../_helpers/models/PTLUsuario.model';
// import { PTLLayoutPestanaModel } from '../_helpers/models/PTLLayoutPestana.model';
// //import { SocketManagerService } from './socket-manager.service';
// const base_url = environment.apiUrl

// @Injectable({
//     providedIn: 'root'
// })
// export class LayoutService {
//     user: PTLUsuarioModel = new PTLUsuarioModel()
//     private _layout = new BehaviorSubject<PTLLayoutModel[]>([])
//     private _layoutChange = new Subject<any>()
//     layoutChange$ = this._layoutChange.asObservable()

//     constructor(
//         private http: HttpClient,
//         //private _socketManager: SocketManagerService
//     ) {
//         console.log('******* Servicio de layouts iniciado correctamente')
//         // this._socketManager.layoutActualizado$.subscribe({
//         //     next: (payload) => {
//         //         console.log(`📡 Socket interceptado - Acción: ${payload.action}, ID: ${payload.id}`);
//         //         this._layoutChange.next(payload);
//         //         this.cargarRegistros().subscribe();
//         //     },
//         //     error: (err) => console.error('Error escuchando al manager:', err)
//         // });
//     }

//     get layouts(): Observable<PTLLayoutModel[]> {
//         return this._layout.asObservable()
//     }

//     getlayoutsActuales(): PTLLayoutModel[] {
//         return this._layout.getValue()
//     }

//     getLayoutByUsuario(codigoUsuario: string): Observable<any> {
//         return this.http.get<any>(`${base_url}/layout/${codigoUsuario}`);
//     }

//     cargarRegistros() {
//         console.log('Consultando y ordenando layouts del usurio para el servidor...');
//         const url = `${base_url}/layout`;
//         return this.http.get(url).pipe(
//             map((resp: any) => resp.layout as PTLLayoutModel[]),
//             tap((layouts) => {
//                 console.log('layoutsservicio', layouts);
//                 this._layout.next(layouts);
//             })
//         );
//     }

//     cargarRegistrosUsuarioPestana(codigoUsuario?: string, codigoPestana?: string) {
//         const url = `${base_url}/layout/user/${codigoUsuario}/${codigoPestana}`;
//         return this.http.get(url).pipe(
//             map((resp: any) => resp.layout as PTLLayoutModel[]),
//             tap((layout) => {
//                 console.log('layout servicio', layout);

//                 this._layout.next(layout);
//             })
//         );
//     }

//     postCrearLayout(data: PTLLayoutModel[]) {
//         const url = `${base_url}/layout`
//         console.log('servicio layout', data)
//         return this.http.post(url, data).pipe(
//             map((resp: any) => {
//                 return {
//                     ok: true,
//                     layout: resp.layout
//                 }
//             })
//         )
//     }

//     obtenerPreferenciasPestanas(codigoUsuario: string) {
//         const url = `${base_url}/layout/pestanas/user/${codigoUsuario}`;
//         return this.http.get(url);
//     }

//     // Guardar las preferencias de pestañas en SQL Server
//     postGuardarPestanasUsuario(payload: PTLLayoutPestanaModel[]) {
//         const url = `${base_url}/layout/pestanas`;
//         return this.http.post(url, payload);
//     }

//     eliminarLayoutPestana(codigoUsuario: string, codigoPestana: string) {
//         const url = `${base_url}/layout/usuario/${codigoUsuario}/${codigoPestana}`;
//         return this.http.delete(url);
//     }
// }
/*
    Author: German Valencia
    Refactored for: QPLUS Architecture, HTTP Client Communication & Metadata-Driven Layouts
*/
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, map, Observable, Subject, tap } from 'rxjs';
import { environment } from 'src/environments/environment'
import { PTLLayoutModel } from '../_helpers/models/PTLLayout.model';
import { PTLUsuarioModel } from '../_helpers/models/PTLUsuario.model';
import { PTLLayoutPestanaModel } from '../_helpers/models/PTLLayoutPestana.model';

const base_url = environment.apiUrl

@Injectable({
    providedIn: 'root'
})
export class LayoutService {
    user: PTLUsuarioModel = new PTLUsuarioModel()
    private _layout = new BehaviorSubject<PTLLayoutModel[]>([])
    private _layoutChange = new Subject<any>()
    layoutChange$ = this._layoutChange.asObservable()

    constructor(private http: HttpClient) {
        console.log('******* Servicio de layouts iniciado correctamente')
        // this._socketManager.layoutActualizado$.subscribe({
        //     next: (payload) => {
        //         console.log(`📡 Socket interceptado - Acción: ${payload.action}, ID: ${payload.id}`);
        //         this._layoutChange.next(payload);
        //         this.cargarRegistros().subscribe();
        //     },
        //     error: (err) => console.error('Error escuchando al manager:', err)
        // });
    }

    get layouts(): Observable<PTLLayoutModel[]> {
        return this._layout.asObservable()
    }

    getlayoutsActuales(): PTLLayoutModel[] {
        return this._layout.getValue()
    }

    // ==========================================
    // WIDGETS POR USUARIO
    // ==========================================

    getLayoutByUsuario(codigoUsuario: string): Observable<any> {
        return this.http.get<any>(`${base_url}/layout/${codigoUsuario}`);
    }

    cargarRegistros() {
        console.log('Consultando y ordenando layouts del usurio para el servidor...');
        const url = `${base_url}/layout`;
        return this.http.get(url).pipe(
            map((resp: any) => resp.layout as PTLLayoutModel[]),
            tap((layouts) => {
                this._layout.next(layouts);
            })
        );
    }

    cargarRegistrosUsuarioPestana(codigoUsuario?: string, codigoPestana?: string) {
        const url = `${base_url}/layout/user/${codigoUsuario}/${codigoPestana}`;
        return this.http.get(url).pipe(
            map((resp: any) => resp.layout as PTLLayoutModel[]),
            tap((layout) => {
                this._layout.next(layout);
            })
        );
    }

    postCrearLayout(data: PTLLayoutModel[]) {
        const url = `${base_url}/layout`
        return this.http.post(url, data).pipe(
            map((resp: any) => {
                return {
                    ok: true,
                    layout: resp.layout
                }
            })
        )
    }

    eliminarLayoutPestana(codigoUsuario: string, codigoPestana: string) {
        const url = `${base_url}/layout/usuario/${codigoUsuario}/${codigoPestana}`;
        return this.http.delete(url);
    }

    // ==========================================
    // PREFERENCIAS DE PESTAÑAS (TABS)
    // ==========================================

    obtenerPreferenciasPestanas(codigoUsuario: string) {
        const url = `${base_url}/layout/pestanas/user/${codigoUsuario}`;
        return this.http.get(url);
    }

    postGuardarPestanasUsuario(payload: PTLLayoutPestanaModel[]) {
        const url = `${base_url}/layout/pestanas`;
        return this.http.post(url, payload);
    }

    // ==========================================
    // ⚙️ MOTOR DE PLANTILLAS METADATA-DRIVEN
    // ==========================================

    /**
     * Obtiene la plantilla maestra, estrategia y reglas matemáticas de una pestaña.
     * Se usa cuando un usuario entra por primera vez o restaura el tablero.
     */
    getPlantillaMaestra(codigoPestana: string): Observable<any> {
        const url = `${base_url}/layout/plantilla/${codigoPestana}`;
        return this.http.get(url).pipe(
            // Extraemos directamente el nodo 'data' que trae nuestro DTO
            map((resp: any) => resp.layout)
        );
    }

    /**
     * Guarda la configuración estratégica de una pestaña en BD.
     * (Ideal para usarlo más adelante en un panel de administración).
     */
    putConfiguracionMaestra(codigoPestana: string, payload: any): Observable<any> {
        const url = `${base_url}/layout/plantilla/configurar/${codigoPestana}`;
        return this.http.put(url, payload);
    }
}
