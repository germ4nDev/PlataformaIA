/*
    Author: German Valencia
    Pattern: PORTTOS Client - Recorrido del mapa (PlataformaApiIA · GET /api/recorrido-mapa/:puerto?horas=24)
    Los tipos reflejan el contrato de utils/recorrido-mapa.js (armarRecorrido + lineaDeTiempo).
    El token lo agrega el AuthInterceptor.
*/
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

export type TipoObjetoRecorrido = 'NAVE' | 'CAMION';
/** [segundo desde 'desde', lon, lat, rumbo, velocidad, índice en 'estados' (-1 sin estado)] */
export type PuntoRecorrido = [number, number, number, number | null, number | null, number];

export interface ObjetoRecorrido {
    tipo: TipoObjetoRecorrido;
    id: string;
    nombre: string | null;
    p: PuntoRecorrido[];
}

export interface EventoRecorrido {
    seg: number;
    fuente: 'alerta' | 'estado';
    nivel: 'info' | 'warning' | 'error';
    categoria: string | null;
    titulo: string;
    mensaje: string;
    coordenadas: [number, number] | null;
    entidad: string | null;
}

export interface RecorridoMapa {
    puerto: string;
    desde: string;
    hasta: string;
    duracionSeg: number;
    pasoSeg: number;
    huecoMaxSeg: number;
    estados: string[];
    totales: { naves: number; camiones: number; puntos: number };
    objetos: ObjetoRecorrido[];
    eventos: EventoRecorrido[];
}

interface RespuestaApi<T> { ok: boolean; data: T }

@Injectable({ providedIn: 'root' })
export class RecorridoMapaService {
    private readonly base = `${environment.apiUrl}/recorrido-mapa`;

    constructor(private http: HttpClient) { }

    /** Trayectorias de naves y camiones de las últimas :horas del puerto y su línea de tiempo. */
    recorrido(puerto: string, horas = 24): Observable<RecorridoMapa> {
        const params = new HttpParams().set('horas', String(horas));
        return this.http
            .get<RespuestaApi<RecorridoMapa>>(`${this.base}/${encodeURIComponent(puerto)}`, { params })
            .pipe(map((r) => r.data));
    }
}
