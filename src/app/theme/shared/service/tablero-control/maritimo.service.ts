// import { Injectable } from '@angular/core';
// import { HttpClient, HttpParams } from '@angular/common/http';
// import { Observable, of } from 'rxjs';
// import { catchError, map, shareReplay } from 'rxjs/operators';
// import { environment } from '../../../../../environments/environment';
// const base_url = environment.apiUrl;

// @Injectable({
//     providedIn: 'root'
// })
// export class MaritimoService {

//     // 🚨 IMPORTANTE: Ajusta esta ruta base para que coincida con tu Express
//     // Por ejemplo, si tu backend corre en http://localhost:3000/api/torre-control
//     private baseUrl = `${environment.apiUrl}/maritimo`;
//     private resumenPuertoCache$ = new Map<string, Observable<any>>();
//     constructor(private http: HttpClient) { }

//     /**
//      * 1. Obtiene los KPIs operativos y la productividad (6 KPIs superiores)
//      */
//     obtenerOperacionesSLA(puerto: string): Observable<any> {
//         const params = new HttpParams().set('puerto', puerto);

//         return this.http.get<any>(`${base_url}/maritimo/operaciones-sla`, { params }).pipe(
//             catchError(error => {
//                 console.error('Error fetching Operaciones SLA:', error);
//                 // Retornamos un fallback vacío para que el dashboard no se rompa
//                 return of({ success: false, data: {} });
//             })
//         );
//     }

//     /**
//      * 2. Obtiene la tabla de motonaves / LineUp
//      */
//     obtenerLineUp(puerto: string): Observable<any> {
//         const params = new HttpParams().set('puerto', puerto);

//         return this.http.get<any>(`${base_url}/maritimo/lineup`, { params }).pipe(
//             catchError(error => {
//                 console.error('Error fetching LineUp:', error);
//                 return of({ success: false, data: [] });
//             })
//         );
//     }

//     /**
//      * 3. Obtiene el clima y estado del canal
//      */
//     obtenerClima(puerto: string): Observable<any> {
//         const params = new HttpParams().set('puerto', puerto);

//         return this.http.get<any>(`${base_url}/maritimo/clima`, { params }).pipe(
//             catchError(error => {
//                 console.error('Error fetching Clima:', error);
//                 return of({
//                     success: false,
//                     data: { marea: 'N/A', pleamar: 'N/A', visibilidad: 'N/A', viento: 'N/A', estadoCanal: 'Desconocido' }
//                 });
//             })
//         );
//     }

//     // /**
//     //  * 4. ORQUESTADOR MAESTRO: Obtiene absolutamente toda la pestaña marítima
//     //  * (Úsalo si tu componente principal carga todo de un solo golpe)
//     //  */
//     // obtenerResumenOperativo(puerto: string): Observable<any> {
//     //     const params = new HttpParams().set('puerto', puerto);

//     //     return this.http.get<any>(`${base_url}/maritimo/resumen`, { params }).pipe(
//     //         catchError(error => {
//     //             console.error('Error fetching Resumen Operativo Completo:', error);
//     //             return of({ success: false, data: {} });
//     //         })
//     //     );
//     // }

//     obtenerCapaMaritimaMapa(): Observable<any> {
//         return this.http.get<any>(`${base_url}/maritimo/mapa-posiciones`).pipe(
//             map(response => {
//                 if (response.exito) {
//                     return response.data;
//                 }
//                 // Si falla o viene vacío, retornamos un FeatureCollection vacío para que el mapa no explote
//                 return { type: 'FeatureCollection', features: [] };
//             })
//         );
//     }

//     obtenerCapaInfraestructuraMapa(): Observable<any> {
//         return this.http.get<any>(`${base_url}/maritimo/mapa-infraestructura`).pipe(
//             map(response => response.exito ? response.data : { type: 'FeatureCollection', features: [] })
//         );
//     }

//     /**
//          * Limpia la caché reactiva cuando el usuario cambia de puerto o pulsa actualizar
//          */
//     limpiarCachePuerto(puerto?: string): void {
//         if (puerto) {
//             this.resumenPuertoCache$.delete(puerto.trim().toUpperCase());
//         } else {
//             this.resumenPuertoCache$.clear();
//         }
//     }

//     /**
//      * Fuente compartida con shareReplay(1): 1 sola consulta HTTP alimenta a todos los widgets autónomos
//      */
//     obtenerResumenOperativo(puerto: string = 'BUENAVENTURA'): Observable<any> {
//         const key = (puerto || 'BUENAVENTURA').trim().toUpperCase();

//         if (!this.resumenPuertoCache$.has(key)) {
//             const peticion$ = this.http
//                 .get<any>(`${base_url}/maritimo/resumen?puerto=${key}`)
//                 .pipe(
//                     shareReplay(1),
//                     catchError(err => {
//                         this.resumenPuertoCache$.delete(key);
//                         throw err;
//                     })
//                 );
//             this.resumenPuertoCache$.set(key, peticion$);
//         }

//         return this.resumenPuertoCache$.get(key)!;
//     }

//     /**
//      * 1. Selector para T_Maestro_Terminales + TCL_EstadoTerminales + TCL_EstadoMuelles
//      */
//     obtenerTerminalesPorPuerto(puerto: string): Observable<any[]> {
//         const puertoUpper = (puerto || 'BUENAVENTURA').trim().toUpperCase();
//         return this.obtenerResumenOperativo(puertoUpper).pipe(
//             map(res => {
//                 const todos = res?.data?.WDG_TERMINALES || [];
//                 return todos.filter((t: any) =>
//                     (t.id_puerto || '').toUpperCase() === puertoUpper ||
//                     (t.ciudad || '').toUpperCase() === puertoUpper
//                 );
//             }),
//             catchError(() => of([]))
//         );
//     }

//     /**
//      * 2. Selector autónomo para una Tarjeta de Terminal individual (WDG_PORT_TERMINAL_INDIVIDUAL)
//      */
//     obtenerDatosTerminalSlot(puerto: string, idClonOrTerminal: string): Observable<any | null> {
//         return this.obtenerTerminalesPorPuerto(puerto).pipe(
//             map(terminales => {
//                 if (!terminales || terminales.length === 0) return null;

//                 // Si viene como TERM_SLOT_0, TERM_SLOT_1...
//                 if (idClonOrTerminal && idClonOrTerminal.startsWith('TERM_SLOT_')) {
//                     const idx = parseInt(idClonOrTerminal.replace('TERM_SLOT_', ''), 10);
//                     return !isNaN(idx) && terminales[idx] ? terminales[idx] : null;
//                 }

//                 // Si viene por id_terminal o nombre directo (ej. 'TER-SPRBUN' o 'SPRBUN')
//                 return terminales.find((t: any) =>
//                     t.id_terminal === idClonOrTerminal ||
//                     t.nombre === idClonOrTerminal ||
//                     t.codigo_corto === idClonOrTerminal
//                 ) || terminales[0];
//             })
//         );
//     }

//     /**
//      * 3. Selector autónomo para cualquier Smart Widget de Marítimo por su código en WIDGET_MAP
//      */
//     obtenerDatosWidgetMaritimo(puerto: string, codigoWidget: string): Observable<any> {
//         const codigo = (codigoWidget || '').trim().toUpperCase();

//         return this.obtenerResumenOperativo(puerto).pipe(
//             map(res => {
//                 const d = res?.data || {};

//                 switch (codigo) {
//                     // KPIs Superiores (TCL_RegistroCamiones, TCL_UnidadCarga, T_Maestro_NodosLogisticos)
//                     case 'PTT_MAE_KPI_CAMIONES':
//                         return d.KPI_CAMIONES_PUERTO || {
//                             titulo: 'CAMIONES EN OPERACIÓN',
//                             valor: d.camionesPuerto || '937',
//                             subtitulo: `ZONA URBANA ${puerto.toUpperCase()}`,
//                             colorBorde: 'borde-cyan'
//                         };
//                     case 'PTT_MAE_KPI_CONTENEDORES':
//                         return d.KPI_CONTENEDORES || {
//                             titulo: 'CONTENEDORES DÍA',
//                             valor: d.contenedoresDia || '2.200',
//                             subtitulo: 'FCL · LCL · Reefer activos',
//                             colorBorde: 'borde-amarillo'
//                         };
//                     case 'PTT_MAE_KPI_GRANEL':
//                         return d.KPI_GRANEL || {
//                             titulo: 'GRANEL - TONS DÍA',
//                             valor: d.granelTons || '1.8K',
//                             subtitulo: 'Agrícola · Mineral · Líquido',
//                             colorBorde: 'borde-naranja'
//                         };
//                     case 'PTT_MAE_KPI_CARGA_SUELTA':
//                         return d.KPI_CARGA_SUELTA || {
//                             titulo: 'CARGA SUELTA - TM',
//                             valor: d.cargaSuelta || '293',
//                             subtitulo: 'Break-bulk · Project · Paletizada',
//                             colorBorde: 'borde-green'
//                         };
//                     case 'PTT_MAE_KPI_RORO':
//                         return d.KPI_RORO || {
//                             titulo: 'VEHÍCULOS RO-RO',
//                             valor: d.vehiculosRoro || '147',
//                             subtitulo: 'Impo · Expo · Patios PDI',
//                             colorBorde: 'borde-teal'
//                         };
//                     case 'PTT_MAE_KPI_BODEGAS':
//                         return d.KPI_BODEGAS || {
//                             titulo: 'SATURACIÓN BODEGAS',
//                             valor: d.saturacionBodegas || '72%',
//                             subtitulo: '8 bodegas · monitoreo activo',
//                             colorBorde: 'borde-purple'
//                         };

//                     // Tablas, Paneles y Gráficas Operativas (Tablas TCL_*)
//                     case 'PTT_MAE_TAB_MOTONAVES':
//                         return d.TABLE_REPORTE_MOTONAVES || d.WDG_TABLE_REPORTE_MOTONAVES || null;
//                     case 'PTT_MAE_CHRT_ETA_ATA':
//                         return d.CHART_ETA_ATA || d.WDG_CHART_ETA_ATA || null;
//                     case 'PTT_MAE_CHRT_TONELADAS':
//                         return d.CHART_TONELADAS || d.WDG_CHART_TONELADAS || null;
//                     case 'PTT_MAE_PANEL_CANAL':
//                         return d.CONDICIONES_CANAL || d.WDG_CONDICIONES_CANAL || null;
//                     case 'PTT_MAE_PANEL_RESUMEN':
//                         return d.RESUMEN_SEMANAL || d.WDG_RESUMEN_SEMANAL || null;
//                     case 'PTT_MAE_CHRT_PROD':
//                         return d.CHART_PRODUCTIVIDAD || d.WDG_CHART_PRODUCTIVIDAD || null;
//                     case 'PTT_MAE_PANEL_ALERTAS':
//                         return d.REPORTES_OPERATIVOS || d.WDG_REPORTES_OPERATIVOS || null;

//                     // Bloque Supertransporte (TCL_TraficoPortuarioMaritimo + TCL_HistoricosSupertransporte)
//                     case 'PTT_MAE_PANEL_TRAFICO':
//                         return d.ANALISIS_TRAFICO || d.WDG_ANALISIS_TRAFICO || null;
//                     case 'PTT_MAE_CHRT_PART_TERM':
//                         return d.PARTICIPACION_NAC || d.WDG_PARTICIPACION_NAC || null;
//                     case 'PTT_MAE_CHRT_MEZCLA':
//                         return d.MEZCLA_CARGA || d.WDG_MEZCLA_CARGA || null;
//                     case 'PTT_MAE_CHRT_TIPO_OP':
//                         return d.TIPO_OPERACION || d.WDG_TIPO_OPERACION || null;
//                     case 'PTT_MAE_TAB_MATRIZ_CARGA':
//                         return d.MATRIZ_TERMINAL_CARGA || d.WDG_MATRIZ_TERMINAL_CARGA || null;
//                     case 'PTT_MAE_CHRT_HISTORICO':
//                         return d.HISTORICO_ANUAL || d.WDG_HISTORICO_ANUAL || null;
//                     case 'PTT_MAE_PANEL_IMPLICACIONES':
//                         return d.IMPLICACIONES_OPERATIVAS || d.WDG_IMPLICACIONES_OPERATIVAS || null;

//                     default:
//                         return null;
//                 }
//             })
//         );
//     }
// }
/* eslint-disable @typescript-eslint/no-explicit-any */
/*
    Author: German Valencia
    Service: PORTTOS Marítimo Service (Caché Compartido por Puerto + Cascada de Terminales)
*/
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, shareReplay, tap } from 'rxjs/operators';
import { LocalStorageService } from 'src/app/theme/shared/service';
import { environment } from 'src/environments/environment';
const base_url = environment.apiUrl;

@Injectable({
    providedIn: 'root'
})
export class MaritimoService {
    private readonly baseApi: string;
    private resumenCachePorPuerto$ = new Map<string, Observable<any>>();

    constructor(
        private http: HttpClient,
        private _localStorageService: LocalStorageService
    ) {
        this.baseApi = `${base_url}/maritimo/resumen`;
    }

    /**
     * Evita que códigos de widget ('PTT_MAE_...') u objetos se cuelen como nombre de puerto
     */
    private resolverPuertoReal(puertoCandidato?: any): string {
        if (!puertoCandidato || typeof puertoCandidato === 'object') {
            return (this._localStorageService.getPuertoLocalStorage() || 'BUENAVENTURA')
                .toString()
                .trim()
                .toUpperCase();
        }

        const limpio = String(puertoCandidato).trim().toUpperCase();
        if (
            limpio.startsWith('PTT_') ||
            limpio.startsWith('TLC_') ||
            limpio.startsWith('WDG_') ||
            limpio.startsWith('TERM_SLOT_') ||
            limpio.includes('[OBJECT OBJECT]')
        ) {
            return (this._localStorageService.getPuertoLocalStorage() || 'BUENAVENTURA')
                .toString()
                .trim()
                .toUpperCase();
        }

        return limpio;
    }

    /**
     * Petición única por puerto compartida entre KPIs, Terminales, Tablas y Gráficas
     */
    public obtenerResumenOperativo(puerto?: string, forzarRefresco: boolean = false): Observable<any> {
        const puertoFinal = this.resolverPuertoReal(puerto);

        if (forzarRefresco || !this.resumenCachePorPuerto$.has(puertoFinal)) {
            const params = new HttpParams().set('puerto', puertoFinal);

            const request$ = this.http.get<any>(this.baseApi, { params }).pipe(
                tap((res) => console.log(`🚢 [MaritimoService] Respuesta cruda (${puertoFinal}):`, res)),
                map((res: any) => this.normalizarRespuestaMaritima(res, puertoFinal)),
                catchError((err) => {
                    console.error('❌ [MaritimoService] Error consultando API Marítimo:', err);
                    this.resumenCachePorPuerto$.delete(puertoFinal);
                    return of({ success: false, ok: false, puerto: puertoFinal, data: {} });
                }),
                shareReplay(1)
            );

            this.resumenCachePorPuerto$.set(puertoFinal, request$);
        }

        return this.resumenCachePorPuerto$.get(puertoFinal)!;
    }

    /**
     * 🟢 CORREGIDO: Obtiene las terminales del puerto sin descartarlas cuando el backend
     * ya las envía filtradas o bajo distintas llaves.
     */
    public obtenerTerminalesPorPuerto(puerto?: string, forzarRefresco: boolean = false): Observable<any[]> {
        const puertoFinal = this.resolverPuertoReal(puerto);

        return this.obtenerResumenOperativo(puertoFinal, forzarRefresco).pipe(
            map((res: any) => {
                const d = res?.data || {};
                const listaTerminales: any[] = d.WDG_TERMINALES || d.terminales || [];
                return Array.isArray(listaTerminales) ? listaTerminales : [];
            })
        );
    }

    /**
     * Entrega la terminal correspondiente a un TERM_SLOT_N o ID específico
     */
    public obtenerDatosTerminalSlot(
        puerto: string,
        identificadorSlot: string,
        forzarRefresco: boolean = false
    ): Observable<any> {
        const puertoFinal = this.resolverPuertoReal(puerto);
        const slotClean = String(identificadorSlot || 'TERM_SLOT_0').trim();

        return this.obtenerTerminalesPorPuerto(puertoFinal, forzarRefresco).pipe(
            map((terminales: any[]) => {
                if (!terminales || terminales.length === 0) return null;

                // 1. Si viene como TERM_SLOT_0, TERM_SLOT_1, etc., extraemos por índice
                const matchSlot = slotClean.toUpperCase().match(/TERM_SLOT_(\d+)/);
                if (matchSlot) {
                    const idx = parseInt(matchSlot[1], 10);
                    return terminales[idx] || terminales[0] || null;
                }

                // 2. Si viene como ID o nombre de terminal
                const encontrada = terminales.find(
                    (t: any) =>
                        String(t.id_terminal || t.id || t.codigo || t.nombreTerminal || t.nombre || '')
                            .trim()
                            .toUpperCase() === slotClean.toUpperCase()
                );

                return encontrada || terminales[0] || null;
            })
        );
    }

    /**
     * Enrutador autónomo para todos los Smart Widgets de la pestaña Marítimo.
     * Soporta los parámetros en cualquier orden: (puerto, codigoWidget) o (codigoWidget, puerto).
     */
    public obtenerDatosWidgetMaritimo(
        param1: string,
        param2?: string,
        forzarRefresco: boolean = false
    ): Observable<any> {
        const p1 = String(param1 || '').trim().toUpperCase();
        const p2 = String(param2 || '').trim().toUpperCase();

        // Detectamos cuál parámetro es el código del widget y cuál es el puerto
        const esP1Codigo =
            p1.startsWith('PTT_') || p1.startsWith('WDG_') || p1.startsWith('TERM_SLOT_');
        const codigoWidget = esP1Codigo ? p1 : p2;
        const puertoCandidato = esP1Codigo ? p2 : p1;
        const puertoFinal = this.resolverPuertoReal(puertoCandidato);

        return this.obtenerResumenOperativo(puertoFinal, forzarRefresco).pipe(
            map((res: any) => {
                const d = res?.data || {};
                const kpis = d.kpisMap || {};

                // 1. Si es uno de los KPIs de Marítimo
                if (codigoWidget.startsWith('PTT_MAE_KPI_')) {
                    return kpis[codigoWidget] || {
                        titulo: 'Métrica Marítima',
                        valor: 0,
                        subtitulo: `Puerto ${puertoFinal}`,
                        colorBorde: 'borde-cyan'
                    };
                }

                // 2. Si es un clon de terminal
                if (
                    codigoWidget.startsWith('TERM_SLOT_') ||
                    codigoWidget === 'PTT_MAE_WGT_TERMINAL' ||
                    codigoWidget === 'WDG_PORT_TERMINAL_INDIVIDUAL'
                ) {
                    const terms = d.WDG_TERMINALES || [];
                    const match = codigoWidget.match(/TERM_SLOT_(\d+)/);
                    const idx = match ? parseInt(match[1], 10) : 0;
                    return terms[idx] || terms[0] || null;
                }

                // 3. Tablas, Gráficas y Paneles de Marítimo
                switch (codigoWidget) {
                    case 'PTT_MAE_TAB_MOTONAVES':
                        return d.TABLE_REPORTE_MOTONAVES;

                    case 'PTT_MAE_CHRT_ETA_ATA':
                        return d.CHART_ETA_ATA;

                    case 'PTT_MAE_CHRT_TONELADAS':
                        return d.CHART_TONELADAS;

                    case 'PTT_MAE_PANEL_CANAL':
                        return d.CONDICIONES_CANAL;

                    case 'PTT_MAE_PANEL_RESUMEN':
                        return d.RESUMEN_SEMANAL;

                    case 'PTT_MAE_CHRT_PROD':
                        return d.CHART_PRODUCTIVIDAD;

                    case 'PTT_MAE_PANEL_ALERTAS':
                        return d.REPORTES_OPERATIVOS;

                    case 'PTT_MAE_PANEL_TRAFICO':
                        return d.ANALISIS_TRAFICO;

                    case 'PTT_MAE_CHRT_PART_TERM':
                        return d.PARTICIPACION_TERMINAL;

                    case 'PTT_MAE_CHRT_MEZCLA':
                        return d.MEZCLA_CARGA;

                    case 'PTT_MAE_CHRT_TIPO_OP':
                        return d.TIPO_OPERACION;

                    case 'PTT_MAE_TAB_MATRIZ_CARGA':
                    case 'PTT_MAE_MATRIZ_CARGA':
                        return d.MATRIZ_TERMINAL_CARGA;

                    case 'PTT_MAE_CHRT_HISTORICO':
                        return d.HISTORICO_ANUAL;

                    case 'PTT_MAE_PANEL_IMPLICACIONES':
                        return d.IMPLICACIONES_OPERATIVAS;

                    default:
                        return d[codigoWidget] || d;
                }
            })
        );
    }

    /**
     * Normaliza la respuesta del backend sin importar cómo envíe los nombres de las propiedades
     */
    private normalizarRespuestaMaritima(res: any, puerto: string): any {
        const raw = res?.data || res?.maritimo || res || {};
        const resumen = raw.resumen || raw.kpis || raw;

        // 1. Extracción flexible de Terminales
        let terminalesCrudas: any[] = [];
        if (Array.isArray(raw.WDG_TERMINALES)) terminalesCrudas = raw.WDG_TERMINALES;
        else if (Array.isArray(raw.terminales)) terminalesCrudas = raw.terminales;
        else if (Array.isArray(raw.TERMINALES)) terminalesCrudas = raw.TERMINALES;
        else if (Array.isArray(raw.resumenTerminales)) terminalesCrudas = raw.resumenTerminales;
        else if (Array.isArray(raw.WDG_TERMINALES?.terminales)) terminalesCrudas = raw.WDG_TERMINALES.terminales;

        // Filtramos por puerto SOLO si los objetos traen explícitamente un puerto distinto;
        // si coinciden o no traen campo de puerto (porque el backend ya filtró), los conservamos todos.
        const filtradas = terminalesCrudas.filter((t: any) => {
            const pTerm = String(t.id_puerto || t.puerto || t.ciudad || '').trim().toUpperCase();
            if (!pTerm) return true;
            return pTerm === puerto || pTerm.includes(puerto) || puerto.includes(pTerm);
        });

        const terminalesFinales = filtradas.length > 0 ? filtradas : terminalesCrudas;

        // 2. Extracción flexible de KPIs para que ninguno quede en 0 si el dato existe
        const val = (obj: any, ...keys: string[]) => {
            for (const k of keys) {
                if (obj && obj[k] !== undefined && obj[k] !== null && obj[k] !== '') {
                    return typeof obj[k] === 'object' && obj[k].valor !== undefined ? obj[k].valor : obj[k];
                }
            }
            return null;
        };

        const sub = (obj: any, fallback: string, ...keys: string[]) => {
            for (const k of keys) {
                if (obj && obj[k] && typeof obj[k] === 'object' && obj[k].subtitulo) {
                    return obj[k].subtitulo;
                }
                if (obj && typeof obj[k] === 'string' && obj[k].trim() !== '') {
                    return obj[k];
                }
            }
            return fallback;
        };

        const kpisMap: { [key: string]: any } = {
            'PTT_MAE_KPI_CAMIONES': {
                titulo: 'CAMIONES EN PUERTO',
                valor: val(resumen, 'camionesPuerto', 'totalCamiones', 'camiones_puerto', 'camiones') ?? 0,
                subtitulo: sub(resumen, `ZONA LOGÍSTICA ${puerto}`, 'subtituloCamiones', 'camionesPuerto'),
                colorBorde: 'borde-cyan'
            },
            'PTT_MAE_KPI_CONTENEDORES': {
                titulo: 'CONTENEDORES DÍA',
                valor: val(resumen, 'contenedoresDia', 'totalContenedores', 'contenedores_dia', 'contenedores', 'teusDia') ?? 0,
                subtitulo: sub(resumen, 'FCL · LCL · Reefer', 'subtituloContenedores', 'contenedoresDia'),
                colorBorde: 'borde-amarillo'
            },
            'PTT_MAE_KPI_GRANEL': {
                titulo: 'GRANEL - TONS DÍA',
                valor: val(resumen, 'granelTons', 'totalGranel', 'granel_tons', 'granel') ?? 0,
                subtitulo: sub(resumen, 'Agrícola · Mineral · Líquido', 'subtituloGranel', 'granelTons'),
                colorBorde: 'borde-naranja'
            },
            'PTT_MAE_KPI_CARGA_SUELTA': {
                titulo: 'CARGA SUELTA - TM',
                valor: val(resumen, 'cargaSuelta', 'totalCargaSuelta', 'carga_suelta', 'suelta') ?? 0,
                subtitulo: sub(resumen, 'Break-bulk · Project · Paletizada', 'subtituloCargaSuelta', 'cargaSuelta'),
                colorBorde: 'borde-green'
            },
            'PTT_MAE_KPI_RORO': {
                titulo: 'VEHÍCULOS RO-RO',
                valor: val(resumen, 'vehiculosRoro', 'totalRoro', 'vehiculos_roro', 'roro') ?? 0,
                subtitulo: sub(resumen, 'Importación · Exportación · PDI', 'subtituloRoro', 'vehiculosRoro'),
                colorBorde: 'borde-teal'
            },
            'PTT_MAE_KPI_BODEGAS': {
                titulo: 'SATURACIÓN BODEGAS',
                valor: val(resumen, 'saturacionBodegas', 'ocupacionBodegas', 'saturacion_bodegas', 'bodegas') ?? '0%',
                subtitulo: sub(resumen, 'Ocupación operativa en puerto', 'subtituloBodegas', 'saturacionBodegas'),
                colorBorde: 'borde-purple'
            },
            'PTT_MAE_KPI_ESPERADOS': {
                titulo: 'BUQUES ESPERADOS',
                valor: val(resumen, 'buquesEsperados', 'esperados', 'navesEsperadas') ?? 0,
                subtitulo: sub(resumen, 'Arribos programados 72h', 'buquesEsperados'),
                colorBorde: 'borde-cyan'
            },
            'PTT_MAE_KPI_FONDEO': {
                titulo: 'BUQUES EN FONDEO',
                valor: val(resumen, 'buquesFondeo', 'fondeo', 'navesFondeo') ?? 0,
                subtitulo: sub(resumen, 'En bahía de espera', 'buquesFondeo'),
                colorBorde: 'borde-amarillo'
            },
            'PTT_MAE_KPI_MUELLE': {
                titulo: 'BUQUES EN MUELLE',
                valor: val(resumen, 'buquesMuelle', 'enMuelle', 'navesMuelle') ?? terminalesFinales.reduce((acc, t) => acc + Number(t.kpis?.motonaves ?? t.motonaves_activas ?? 0), 0),
                subtitulo: sub(resumen, 'Operando en línea de atraque', 'buquesMuelle'),
                colorBorde: 'borde-green'
            }
        };

        const dataNormalizada = {
            ...raw,
            WDG_TERMINALES: terminalesFinales,
            kpisMap,
            TABLE_REPORTE_MOTONAVES:
                raw.TABLE_REPORTE_MOTONAVES ||
                raw.WDG_TABLE_REPORTE_MOTONAVES ||
                raw.motonaves ||
                raw.naves ||
                raw.reporteMotonaves ||
                [],
            CHART_ETA_ATA: raw.CHART_ETA_ATA || raw.WDG_CHART_ETA_ATA || raw.etaAta || null,
            CHART_TONELADAS: raw.CHART_TONELADAS || raw.WDG_CHART_TONELADAS || raw.toneladas || null,
            CONDICIONES_CANAL: raw.CONDICIONES_CANAL || raw.WDG_CONDICIONES_CANAL || raw.condicionesCanal || raw.canal || null,
            RESUMEN_SEMANAL: raw.RESUMEN_SEMANAL || raw.WDG_RESUMEN_SEMANAL || raw.resumenSemanal || null,
            CHART_PRODUCTIVIDAD: raw.CHART_PRODUCTIVIDAD || raw.WDG_CHART_PRODUCTIVIDAD || raw.productividad || null,
            REPORTES_OPERATIVOS: raw.REPORTES_OPERATIVOS || raw.WDG_REPORTES_OPERATIVOS || raw.reportesOperativos || raw.alertas || null,
            ANALISIS_TRAFICO: raw.ANALISIS_TRAFICO || raw.WDG_ANALISIS_TRAFICO || raw.analisisTrafico || raw.trafico || null,
            PARTICIPACION_TERMINAL: raw.PARTICIPACION_TERMINAL || raw.WDG_PARTICIPACION_TERMINAL || raw.participacion || null,
            MEZCLA_CARGA: raw.MEZCLA_CARGA || raw.WDG_MEZCLA_CARGA || raw.mezclaCarga || null,
            TIPO_OPERACION: raw.TIPO_OPERACION || raw.WDG_TIPO_OPERACION || raw.tipoOperacion || null,
            MATRIZ_TERMINAL_CARGA: raw.MATRIZ_TERMINAL_CARGA || raw.WDG_MATRIZ_TERMINAL_CARGA || raw.matrizCarga || null,
            HISTORICO_ANUAL: raw.HISTORICO_ANUAL || raw.WDG_HISTORICO_ANUAL || raw.historicoAnual || null,
            IMPLICACIONES_OPERATIVAS: raw.IMPLICACIONES_OPERATIVAS || raw.WDG_IMPLICACIONES_OPERATIVAS || raw.implicaciones || null
        };

        return {
            ...res,
            success: true,
            ok: true,
            puerto,
            data: dataNormalizada
        };
    }

    public limpiarCachePuerto(puerto?: string): void {
        if (puerto) {
            this.resumenCachePorPuerto$.delete(puerto.trim().toUpperCase());
        } else {
            this.resumenCachePorPuerto$.clear();
        }
    }
}
