import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { BehaviorSubject, Observable, Subject, throwError } from 'rxjs';
import { SocketManagerService } from './socket-manager.service';

import { PTLWidgetMaestroModel } from '../_helpers/models/PTLWidgetMaestro.model';

const base_url = environment.apiUrl;

@Injectable({
    providedIn: 'root'
})
export class PTLWidgetsMaestroService {

    private _registros = new BehaviorSubject<PTLWidgetMaestroModel[]>([]);
    private _registrosChange = new Subject<any>();
    _registrosChange$ = this._registrosChange.asObservable();

    constructor(
        private http: HttpClient,
        private _socketManager: SocketManagerService
    ) {
        console.log('******* Servicio de Widgets Maestro iniciado correctamente');
        if (this._socketManager.widgetsActualizados$) {
            this._socketManager.widgetsActualizados$.subscribe({
                next: (payload: any) => {
                    console.log(`📡 Socket interceptado - Acción Widget: ${payload.action}, Msg: ${payload.msg}`);
                    this._registrosChange.next(payload);
                    this.cargarRegistros().subscribe();
                },
                error: (err) => console.error('Error escuchando al manager de widgets:', err)
            });
        }
    }

    get widgets$(): Observable<PTLWidgetMaestroModel[]> {
        return this._registros.asObservable();
    }

    getWidgetsActuales(): PTLWidgetMaestroModel[] {
        return this._registros.getValue();
    }

    cargarRegistros() {
        console.log('Consultando y ordenando catálogo de widgets del servidor...');
        const url = `${base_url}/widgets/activos`;
        return this.http.get(url).pipe(
            map((resp: any) => resp.widgets as PTLWidgetMaestroModel[]),
            map((regs: PTLWidgetMaestroModel[]) => {
                console.log('widgets cargados', regs);
                return regs.sort((a: any, b: any) => (a.nombreWidget || '').localeCompare(b.nombreWidget || ''));
            }),
            tap(registrosOrdenados => {
                this._registros.next(registrosOrdenados);
            })
        );
    }

    getWidgetsActivos() {
        const url = `${base_url}/widgets/activos`;
        return this.http.get(url).pipe(
            map((resp: any) => {
                return {
                    ok: true,
                    widgets: resp.widgets || resp.data
                };
            })
        );
    }

    getWidgetById(id: string) {
        const url = `${base_url}/widgets/${id}`;
        return this.http.get(url).pipe(
            map((resp: any) => {
                return {
                    ok: true,
                    widget: resp.widget || resp.data
                };
            })
        );
    }

    crearWidget(data: PTLWidgetMaestroModel) {
        const url = `${base_url}/widgets`;
        return this.http.post(url, data).pipe(
            map((resp: any) => {
                return {
                    ok: true,
                    widget: resp.widget || resp.data,
                    msg: resp.msg
                };
            })
        );
    }

    actualizarWidget(codigoWidget: string, data: PTLWidgetMaestroModel) {
        const url = `${base_url}/widgets/${codigoWidget}`;
        return this.http.put(url, data).pipe(
            map((resp: any) => {
                return {
                    ok: true,
                    widget: resp.widget || resp.data,
                    msg: resp.msg
                };
            })
        );
    }

    eliminarWidget(codigoWidget: string) {
        const url = `${base_url}/widgets/${codigoWidget}`;
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
