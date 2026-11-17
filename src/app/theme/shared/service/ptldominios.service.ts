/*
    Author: German Valencia
    CC-224: servicio de Utilidades › Dominios (API /api/dominios): qué abre cada dominio (consola o aplicación), su portal, su inicio y su marca.
*/
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from 'src/environments/environment';

const base_url = `${environment.apiUrl}/dominios`;

export interface Dominio {
    dominioId?: number;
    dominio: string;
    tipo: 'consola' | 'aplicacion';
    codigoAplicacion: string | null;
    nombreAplicacion?: string | null;
    codigoSuite: string | null;
    nombreSuite?: string | null;
    rutaPortal: string | null;
    rutaInicio: string | null;
    nombreMarca: string | null;
    logoMarca: string | null;
    descripcion: string | null;
    estado: boolean;
}

const deApi = (d: any): Dominio => ({ ...d, estado: d?.estado === true || d?.estado === 1 || d?.estado === '1' });

@Injectable({ providedIn: 'root' })
export class PtlDominiosService {
    constructor(private readonly http: HttpClient) {}

    listar(): Observable<Dominio[]> {
        return this.http.get<any>(base_url).pipe(map((r) => (r?.dominios || []).map(deApi)));
    }

    obtener(id: number | string): Observable<Dominio> {
        return this.http.get<any>(`${base_url}/${encodeURIComponent(String(id))}`).pipe(map((r) => deApi(r?.dominio)));
    }

    crear(d: Partial<Dominio>): Observable<Dominio> {
        return this.http.post<any>(base_url, d).pipe(map((r) => deApi(r?.dominio)));
    }

    modificar(id: number | string, d: Partial<Dominio>): Observable<Dominio> {
        return this.http.put<any>(`${base_url}/${encodeURIComponent(String(id))}`, d).pipe(map((r) => deApi(r?.dominio)));
    }

    /** Inactiva (nunca borra) */
    eliminar(id: number | string): Observable<Dominio> {
        return this.http.delete<any>(`${base_url}/${encodeURIComponent(String(id))}`).pipe(map((r) => deApi(r?.dominio)));
    }
}
