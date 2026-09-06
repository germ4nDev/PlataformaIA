/* eslint-disable @typescript-eslint/no-explicit-any */
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map } from 'rxjs';
import { environment } from 'src/environments/environment';
import { PTLUsuarioModel } from '../_helpers/models/PTLUsuario.model';
import { PTLTipoActividadModel } from '../_helpers/models/PTLTipoActividad.model';
import { LocalStorageService } from './local-storage.service';

const base_url = environment.apiUrl;

@Injectable({
    providedIn: 'root'
})
export class PtltiposActividadService {
    user: PTLUsuarioModel = new PTLUsuarioModel();

    constructor(
        private http: HttpClient,
        private _localStorageService: LocalStorageService
    ) { }

    getRegistros() {
        const url = `${base_url}/tipos-actividad`;
        return this.http.get(url).pipe(
            map((resp: any) => {
                console.log('servicio de tipoActividad', resp);
                return {
                    ok: true,
                    tiposActividades: resp.tiposActividades
                };
            })
        );
    }

    getRegistroById(id: number) {
        const url = `${base_url}/tipos-actividad/${id}`;
        return this.http.get(url).pipe(
            map((resp: any) => {
                console.log('data de tipoActividad', resp);
                return {
                    ok: true,
                    tipoActividad: resp.tipoActividad
                };
            })
        );
    }

    postCrearRegistro(tipoActividad: PTLTipoActividadModel) {
        const url = `${base_url}/tipos-actividad`;
        return this.http.post(url, tipoActividad);
    }

    putModificarRegistro(tipoActividad: PTLTipoActividadModel) {
        const url = `${base_url}/tipos-actividad/${tipoActividad.tipoActividadId}`;
        return this.http.put(url, tipoActividad).pipe(
            map((resp: any) => {
                console.log('data de tipoActividad modificacda', resp);
                return {
                    ok: true,
                    tipoActividad: resp.tipoActividad
                };
            })
        );
    }

    deleteEliminarRegistro(_id: number) {
        const url = `${base_url}/tipos-actividad/${_id}`;
        return this.http.delete(url).pipe(
            map((resp: any) => {
                console.log('data de tipoActividad eliminado', resp);
                return {
                    ok: true,
                    tipoActividad: resp.tipoActividad
                };
            })
        );
    }
}
