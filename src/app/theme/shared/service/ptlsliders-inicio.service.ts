/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';

import { environment } from 'src/environments/environment';
import { map, tap } from 'rxjs/operators';
import { PTLUsuarioModel } from '../_helpers/models/PTLUsuario.model';
import { PTLSliderInicioModel } from '../_helpers/models/PTLSliderInicio.model';
import { LocalStorageService } from './local-storage.service';
import { SocketService } from './sockets.service';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { PTLPaqueteModel } from '../_helpers/models/PTLPaquete.model';
import { SocketManagerService } from './socket-manager.service';

const base_url = environment.apiUrl;

@Injectable({
    providedIn: 'root'
})
export class PtlSlidersInicioService {
    user: PTLUsuarioModel = new PTLUsuarioModel()
    private _sliders = new BehaviorSubject<PTLSliderInicioModel[]>([])
    private _slidersChange = new Subject<any>()
    slidersChange$ = this._slidersChange.asObservable()

    constructor(
        private http: HttpClient,
        private socketService: SocketService,
        private _socketManager: SocketManagerService,
        private _localStorageService: LocalStorageService
    ) {
        console.log('******* Servicio de sliders iniciado correctamente')
        this._socketManager.actividadesRolesActualizadas$.subscribe({
            next: (payload) => {
                console.log(`📡 Socket interceptado - Acción: ${payload.action}, ID: ${payload.id}`);
                this._slidersChange.next(payload);
                this.getRegistros().subscribe();
            },
            error: (err) => console.error('Error escuchando al manager:', err)
        });
    }

    get slider$(): Observable<PTLSliderInicioModel[]> {
        return this._sliders.asObservable()
    }

    getSlidersActuales(): PTLSliderInicioModel[] {
        return this._sliders.getValue()
    }

    getRegistros() {
        const url = `${base_url}/sliders`;
        return this.http.get(url).pipe(
            map((resp: any) => {
                console.log('servicio de sliders', resp);
                return {
                    ok: true,
                    slidersInicio: resp.sliders
                };
            })
        );
    }

    cargarSliders() {
        console.log('========== Consultando y ordenando sliders del servidor...')
        const url = `${base_url}/sliders`;
        return this.http.get(url).pipe(
            map((resp: any) => (resp.sliders || []) as PTLSliderInicioModel[]),
            map((sliders: PTLSliderInicioModel[]) => {
                const activos = sliders.filter(x => x.estadoSlider == true);
                return activos.sort((a: any, b: any) => a.nombreSlider.localeCompare(b.nombreSlider))
            }),
            tap(slidersOrdenadas => {
                console.log('sliders del sistema', slidersOrdenadas);
                this._sliders.next(slidersOrdenadas)
            })
        )
    }

    /**
     * Slides de un login (CC-104): `para` = codigoAplicacion del dominio (sus slides activos o, si no tiene, los generales)
     * o 'general'. No toca la lista compartida (slider$), que sigue siendo la de la gestión.
     */
    slidesPara(para: string | null): Observable<PTLSliderInicioModel[]> {
        const params = new HttpParams().set('para', para || 'general')
        return this.http.get(`${base_url}/sliders`, { params }).pipe(
            map((resp: any) => (resp?.sliders || []) as PTLSliderInicioModel[])
        )
    }

    getRegistroById(id: string) {
        const url = `${base_url}/sliders/${id}`;
        return this.http.get(url).pipe(
            map((resp: any) => {
                console.log('data de colorNav', resp);
                return {
                    ok: true,
                    sliderInicio: resp.sliderInicio
                };
            })
        );
    }

    postCrearRegistro(slider: PTLSliderInicioModel) {
        const url = `${base_url}/sliders`;
        return this.http.post(url, slider);
    }

    putModificarRegistro(sliderInicio: PTLSliderInicioModel, sliderId: string) {
        const url = `${base_url}/sliders/${sliderId}`;
        return this.http.put(url, sliderInicio).pipe(
            map((resp: any) => {
                console.log('data de sliderInicio modificacda', resp);
                return {
                    ok: true,
                    sliderInicio: resp.sliderInicio
                };
            })
        );
    }

    deleteEliminarRegistro(_id: number) {
        const url = `${base_url}/sliders/${_id}`;
        return this.http.delete(url).pipe(
            map((resp: any) => {
                console.log('data de sliderInicio eliminado', resp);
                return {
                    ok: true,
                    sliderInicio: resp.sliderInicio
                };
            })
        );
    }
}
