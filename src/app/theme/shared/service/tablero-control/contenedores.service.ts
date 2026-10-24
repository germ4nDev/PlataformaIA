/* eslint-disable @typescript-eslint/no-explicit-any */
/*
    Author: German Valencia
    Service: PORTTOS Contenedores Service (Patrón Autónomo Reutilizable)
*/
/* eslint-disable @typescript-eslint/no-explicit-any */
/*
    Author: German Valencia
    Service: PORTTOS Contenedores Service
*/
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, shareReplay, tap } from 'rxjs/operators';
import { FiltroTableroService } from './filtro-tablero.service';
import { environment } from 'src/environments/environment';

@Injectable({
    providedIn: 'root'
})
export class ContenedoresService {
    private readonly baseApi: string;
    private contenedoresCachePorPuerto$ = new Map<string, Observable<any>>();

    constructor(
        private http: HttpClient,
        private _filtroTablero: FiltroTableroService
    ) {
        const rawUrl = (environment.apiUrl || 'http://localhost:3000/api').replace(/\/+$/, '');
        this.baseApi = rawUrl.endsWith('/contenedores')
            ? rawUrl
            : `${rawUrl}/contenedores`;
    }

    private resolverPuertoReal(puertoCandidato?: any): string {
        if (!puertoCandidato || typeof puertoCandidato === 'object') {
            return (this._filtroTablero.getCiudadActual() || 'BUENAVENTURA').toString().trim().toUpperCase();
        }

        const limpio = String(puertoCandidato).trim().toUpperCase();
        if (limpio.startsWith('PTT_') || limpio.startsWith('TLC_') || limpio.includes('[OBJECT OBJECT]')) {
            return (this._filtroTablero.getCiudadActual() || 'BUENAVENTURA').toString().trim().toUpperCase();
        }
        return limpio;
    }

    public obtenerDashboardContenedores(puerto?: string, forzarRefresco: boolean = false): Observable<any> {
        const puertoFinal = this.resolverPuertoReal(puerto);

        if (forzarRefresco || !this.contenedoresCachePorPuerto$.has(puertoFinal)) {
            const params = new HttpParams().set('puerto', puertoFinal);

            const request$ = this.http.get<any>(this.baseApi, { params }).pipe(
                tap(res => console.log('📦 [ContenedoresService] Respuesta cruda:', res)),
                map((res: any) => this.procesarRespuesta(res, puertoFinal)),
                catchError((err) => {
                    console.error('❌ [ContenedoresService] Error consultando API:', err);
                    this.contenedoresCachePorPuerto$.delete(puertoFinal);
                    // 🟢 Corregido el espacio en blanco de "generarEstructuraVacia"
                    return of({ ok: false, puerto: puertoFinal, contenedores: this.generarEstructuraVacia() });
                }),
                shareReplay(1)
            );

            this.contenedoresCachePorPuerto$.set(puertoFinal, request$);
        }

        return this.contenedoresCachePorPuerto$.get(puertoFinal)!;
    }

    public obtenerDatosWidgetContenedores(
        codigoWidget: string,
        puerto?: string,
        forzarRefresco: boolean = false
    ): Observable<any> {
        const codigo = (codigoWidget || '').trim().toUpperCase();
        const puertoFinal = this.resolverPuertoReal(puerto);

        return this.obtenerDashboardContenedores(puertoFinal, forzarRefresco).pipe(
            map((resp: any) => {
                const cont = resp?.contenedores || this.generarEstructuraVacia();

                // Cada nodo lleva su origen (Fase 1, 2026-10-23); las listas van envueltas para poder llevarlo
                const o = cont.origenes || {};
                switch (codigo) {
                    case 'PTT_CONT_KPI_CARGADOS':
                        return cont.kpis?.cargadosPendientes || { valor: 0, subtitulo: '' };
                    case 'PTT_CONT_KPI_VACIOS':
                        return cont.kpis?.vaciosDevolver || { valor: 0, subtitulo: '' };
                    case 'PTT_CONT_KPI_REEFER':
                        return cont.kpis?.reeferActivos || { valor: 0, subtitulo: '' };
                    case 'PTT_CONT_KPI_FREETIME':
                        return cont.kpis?.freeTimeVencido || { valor: 0, subtitulo: '' };
                    case 'PTT_CONT_CHRT_RETIROS':
                        return cont.retirosPriorizacion || { labels: [], datasets: [] };
                    case 'PTT_CONT_CHRT_NAVIERA':
                        return cont.vaciosNaviera || { labels: [], datasets: [] };
                    case 'PTT_CONT_PANEL_PATIOS':
                        return { saturacionPatios: cont.saturacionPatios || [], origen: o.patios || null };
                    case 'PTT_CONT_CHRT_FREETIME':
                        return cont.freeTimeDistribucion || { labels: [], datasets: [] };
                    case 'PTT_CONT_TAB_MOVIMIENTOS':
                    case 'PTT_CONT_CHRT_FLUJO':
                        return { movimientos: cont.movimientos || [], origen: o.movimientos || null };
                    default:
                        return cont;
                }
            })
        );
    }

    private procesarRespuesta(res: any, puerto: string): any {
        const rawData = res?.data || res || {};
        const fuente = rawData.contenedores || rawData;

        const contenedores = {
            kpis: fuente.kpis || {},
            retirosPriorizacion: fuente.retirosPriorizacion || fuente.retiros || { labels: [], datasets: [] },
            vaciosNaviera: fuente.vaciosNaviera || { labels: [], datasets: [] },
            saturacionPatios: fuente.saturacionPatios || fuente.patios || [],
            freeTimeDistribucion: fuente.freeTimeDistribucion || { labels: [], datasets: [] },
            movimientos: fuente.movimientos || fuente.citas || [],
            origenes: fuente.origenes || {},
            origen: fuente.origen || null
        };

        return { ...res, ok: true, puerto, contenedores };
    }

    private generarEstructuraVacia(): any {
        return {
            kpis: {},
            retirosPriorizacion: { labels: [], datasets: [] },
            vaciosNaviera: { labels: [], datasets: [] },
            saturacionPatios: [],
            freeTimeDistribucion: { labels: [], datasets: [] },
            movimientos: []
        };
    }

    public limpiarCachePuerto(puerto?: string): void {
        if (puerto) this.contenedoresCachePorPuerto$.delete(puerto.trim().toUpperCase());
        else this.contenedoresCachePorPuerto$.clear();
    }
}
