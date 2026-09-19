/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

const base_url = environment.apiUrl;

@Injectable({
    providedIn: 'root'
})
export class PtlSesionesService {

    constructor(private http: HttpClient) {
        console.log('******* Servicio de Sesiones (Auditoría y En Vivo) iniciado correctamente');
    }

    getSesionesActivas(): Observable<any[]> {
        const url = `${base_url}/sesiones`;

        return this.http.get(url).pipe(
            map((resp: any) => {
                console.log('🔄 Sesiones activas cargadas desde SQL:', resp.sesiones);
                return resp.sesiones || [];
            })
        );
    }

    getSesionById(codigoSesion: string): Observable<any> {
        const url = `${base_url}/sesiones/${codigoSesion}`;

        return this.http.get(url).pipe(
            map((resp: any) => {
                console.log('🔍 Sesión encontrada:', resp.sesion);
                return resp.sesion || null;
            })
        );
    }

    registrarSesion(payload: any): Observable<any> {
        const url = `${base_url}/sesiones`;

        console.log('📤 Registrando nueva sesión:', payload);

        return this.http.post(url, payload).pipe(
            map((resp: any) => {
                console.log('✅ Sesión registrada exitosamente:', resp);
                return resp;
            })
        );
    }

    actualizarContextoNavegacion(codigoSesion: string, datosContexto: {
        codigoSuscriptor?: string;
        codigoSuite?: string;
        codigoAplicacion?: string;
        codigoModulo?: string;
    }): Observable<any> {
        const url = `${base_url}/sesiones/contexto/${codigoSesion}`;

        console.log('📤 Actualizando contexto de sesión:', { codigoSesion, datosContexto });

        return this.http.put(url, datosContexto).pipe(
            map((resp: any) => {
                console.log('✅ Contexto de sesión actualizado:', resp);
                return resp;
            })
        );
    }

    cerrarSesion(codigoSesion: string): Observable<any> {
        const url = `${base_url}/sesiones/${codigoSesion}`;

        console.log('📤 Cerrando sesión:', codigoSesion);

        return this.http.delete(url).pipe(
            map((resp: any) => {
                console.log('✅ Sesión cerrada exitosamente:', resp);
                return resp;
            })
        );
    }
}
