// /* eslint-disable @typescript-eslint/no-explicit-any */
// /*
//     Author: German Valencia
//     Pattern: PORTTOS Angular Service Pattern - Contenedores (Smart Widgets + shareReplay)
// */
// import { Injectable } from '@angular/core';
// import { HttpClient } from '@angular/common/http';
// import { Observable } from 'rxjs';
// import { map, shareReplay, catchError } from 'rxjs/operators';
// import { environment } from 'src/environments/environment';

// const base_url = environment.apiUrl;

// @Injectable({
//     providedIn: 'root'
// })
// export class ContenedoresService {
//     // Caché reactiva en vuelo por puerto para evitar peticiones HTTP duplicadas
//     private contenedoresCachePorPuerto$ = new Map<string, Observable<any>>();

//     constructor(private http: HttpClient) { }

//     public limpiarCachePuerto(puerto?: string): void {
//         if (puerto) {
//             this.contenedoresCachePorPuerto$.delete(puerto.trim().toUpperCase());
//         } else {
//             this.contenedoresCachePorPuerto$.clear();
//         }
//     }

//     /**
//      * Conserva el endpoint original ${base_url}/contenedores con deduplicación shareReplay(1)
//      */
//     public obtenerDashboardContenedores(puerto: string = 'BUENAVENTURA'): Observable<any> {
//         const key = (puerto || 'BUENAVENTURA').trim().toUpperCase();

//         if (!this.contenedoresCachePorPuerto$.has(key)) {
//             const url = `${base_url}/contenedores`;
//             const peticion$ = this.http.get<any>(url).pipe(
//                 map((resp: any) => ({
//                     ok: true,
//                     data: resp?.data || resp || {}
//                 })),
//                 shareReplay(1),
//                 catchError((err) => {
//                     this.contenedoresCachePorPuerto$.delete(key);
//                     throw err;
//                 })
//             );
//             this.contenedoresCachePorPuerto$.set(key, peticion$);
//         }

//         return this.contenedoresCachePorPuerto$.get(key)!;
//     }

//     /**
//      * Selector autónomo para cada Smart Widget de la Pestaña 3 (Contenedores)
//      */
//     public obtenerDatosWidgetContenedores(puerto: string, codigoWidget: string): Observable<any> {
//         const puertoUpper = (puerto || 'BUENAVENTURA').trim().toUpperCase();
//         const codigo = (codigoWidget || '').trim().toUpperCase();

//         return this.obtenerDashboardContenedores(puertoUpper).pipe(
//             map((res: any) => {
//                 const dataObj = res?.data || {};
//                 const kpis = dataObj.kpis || {};
//                 const movimientos: any[] = Array.isArray(dataObj.movimientos)
//                     ? dataObj.movimientos
//                     : Array.isArray(dataObj.movimientos?.movimientos)
//                         ? dataObj.movimientos.movimientos
//                         : Array.isArray(dataObj)
//                             ? dataObj
//                             : [];

//                 switch (codigo) {
//                     // =========================================================
//                     // 1. FILA DE 4 KPIs DE CONTENEDORES (PTT_CONT_KPI_*)
//                     // =========================================================
//                     case 'PTT_CONT_KPI_CARGADOS':
//                         return {
//                             titulo: 'CARGADOS PENDIENTES',
//                             valor: kpis.cargadosPendientes?.valor ?? '1.920',
//                             subtitulo: kpis.cargadosPendientes?.subtitulo || 'En patio esperando retiro',
//                             color: kpis.cargadosPendientes?.color || '#00d4ff',
//                             colorBorde: 'borde-cyan'
//                         };

//                     case 'PTT_CONT_KPI_VACIOS':
//                         return {
//                             titulo: 'VACÍOS POR DEVOLVER',
//                             valor: kpis.vaciosDevolver?.valor ?? '634',
//                             subtitulo: kpis.vaciosDevolver?.subtitulo || 'Asignados por naviera',
//                             color: kpis.vaciosDevolver?.color || '#ffb547',
//                             colorBorde: 'borde-naranja'
//                         };

//                     case 'PTT_CONT_KPI_REEFER':
//                         return {
//                             titulo: 'REEFER ACTIVOS',
//                             valor: kpis.reeferActivos?.valor ?? '312',
//                             subtitulo: kpis.reeferActivos?.subtitulo || 'Conectados a cadena de frío',
//                             color: kpis.reeferActivos?.color || '#00c896',
//                             colorBorde: 'borde-teal'
//                         };

//                     case 'PTT_CONT_KPI_FREETIME':
//                         return {
//                             titulo: 'FREE TIME VENCIDO',
//                             valor: kpis.freeTimeVencido?.valor ?? '47',
//                             subtitulo: kpis.freeTimeVencido?.subtitulo || 'Generando cobro de mora',
//                             color: kpis.freeTimeVencido?.color || '#ff5b6e',
//                             colorBorde: 'borde-blue'
//                         };

//                     // =========================================================
//                     // 2. GRÁFICAS, PANEL DE PATIOS Y TABLA DE MOVIMIENTOS
//                     // =========================================================
//                     case 'PTT_CONT_CHRT_RETIROS':
//                         return dataObj.retirosPriorizacion || this.derivarRetirosPriorizacion(movimientos);

//                     case 'PTT_CONT_CHRT_NAVIERA':
//                         return dataObj.vaciosNaviera || this.derivarVaciosPorNaviera(movimientos);

//                     case 'PTT_CONT_PANEL_PATIOS':
//                         return dataObj.saturacionPatios || dataObj.patios || [];

//                     case 'PTT_CONT_CHRT_FREETIME':
//                         return dataObj.freeTimeDistribucion || this.derivarDistribucionFreeTime(movimientos);

//                     case 'PTT_CONT_TAB_MOVIMIENTOS':
//                         return Array.isArray(dataObj.movimientos)
//                             ? { movimientos: dataObj.movimientos }
//                             : dataObj.movimientos || { movimientos };

//                     default:
//                         return dataObj;
//                 }
//             })
//         );
//     }

//     /**
//      * Respaldo desde TCL_MovimientosContenedor (operacion + free_time)
//      */
//     private derivarRetirosPriorizacion(movimientos: any[]): any {
//         if (!movimientos || movimientos.length === 0) return null;
//         return { movimientos };
//     }

//     /**
//      * Agrupa devoluciones de vacíos por columna 'naviera' de dbo.TCL_MovimientosContenedor
//      */
//     private derivarVaciosPorNaviera(movimientos: any[]): any {
//         if (!movimientos || movimientos.length === 0) return null;

//         const conteo = new Map<string, number>();
//         movimientos
//             .filter((m) => /vac[ií]o|devoluci/i.test(`${m.tipo || ''} ${m.operacion || ''}`))
//             .forEach((m) => {
//                 const nav = (m.naviera || 'OTROS').trim().toUpperCase();
//                 conteo.set(nav, (conteo.get(nav) || 0) + 1);
//             });

//         if (conteo.size === 0) {
//             movimientos.forEach((m) => {
//                 const nav = (m.naviera || 'OTROS').trim().toUpperCase();
//                 conteo.set(nav, (conteo.get(nav) || 0) + 1);
//             });
//         }

//         const ordenados = Array.from(conteo.entries()).sort((a, b) => b[1] - a[1]);
//         return {
//             labels: ordenados.map(([n]) => n),
//             valores: ordenados.map(([, c]) => c)
//         };
//     }

//     /**
//      * Agrupa columna 'free_time' de dbo.TCL_MovimientosContenedor en los 4 tramos de semáforo
//      */
//     private derivarDistribucionFreeTime(movimientos: any[]): any {
//         if (!movimientos || movimientos.length === 0) return null;

//         let vencidos = 0;
//         let criticos1a2 = 0;
//         let alerta3a5 = 0;
//         let holgadosMas5 = 0;

//         movimientos.forEach((m) => {
//             const ft = String(m.free_time || '').toLowerCase();
//             if (ft.includes('vencid') || ft.includes('-')) {
//                 vencidos++;
//             } else {
//                 const matchDias = ft.match(/(\d+)/);
//                 const dias = matchDias ? parseInt(matchDias[1], 10) : 6;
//                 if (dias <= 2) criticos1a2++;
//                 else if (dias <= 5) alerta3a5++;
//                 else holgadosMas5++;
//             }
//         });

//         return {
//             labels: ['> 5 días libre', '3-5 días', '1-2 días (crítico)', 'Vencido (mora)'],
//             valores: [holgadosMas5, alerta3a5, criticos1a2, vencidos]
//         };
//     }
// }
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
import { LocalStorageService } from 'src/app/theme/shared/service';
import { environment } from 'src/environments/environment';

@Injectable({
    providedIn: 'root'
})
export class ContenedoresService {
    private readonly baseApi: string;
    private contenedoresCachePorPuerto$ = new Map<string, Observable<any>>();

    constructor(
        private http: HttpClient,
        private _localStorageService: LocalStorageService
    ) {
        const rawUrl = (environment.apiUrl || 'http://localhost:3000/api').replace(/\/+$/, '');
        this.baseApi = rawUrl.endsWith('/contenedores')
            ? rawUrl
            : `${rawUrl}/contenedores`;
    }

    private resolverPuertoReal(puertoCandidato?: any): string {
        if (!puertoCandidato || typeof puertoCandidato === 'object') {
            return (this._localStorageService.getPuertoLocalStorage() || 'BUENAVENTURA').toString().trim().toUpperCase();
        }

        const limpio = String(puertoCandidato).trim().toUpperCase();
        if (limpio.startsWith('PTT_') || limpio.startsWith('TLC_') || limpio.includes('[OBJECT OBJECT]')) {
            return (this._localStorageService.getPuertoLocalStorage() || 'BUENAVENTURA').toString().trim().toUpperCase();
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
                        return cont.saturacionPatios || [];
                    case 'PTT_CONT_CHRT_FREETIME':
                        return cont.freeTimeDistribucion || { labels: [], datasets: [] };
                    case 'PTT_CONT_TAB_MOVIMIENTOS':
                        return cont.movimientos || [];
                    case 'PTT_CONT_CHRT_FLUJO':
                        return cont.movimientos || [];
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
            movimientos: fuente.movimientos || fuente.citas || []
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
