import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, shareReplay } from 'rxjs/operators';
import { environment } from '../../../../../environments/environment';
const base_url = environment.apiUrl;

@Injectable({
    providedIn: 'root'
})
export class MaritimoService {

    // 🚨 IMPORTANTE: Ajusta esta ruta base para que coincida con tu Express
    // Por ejemplo, si tu backend corre en http://localhost:3000/api/torre-control
    private baseUrl = `${environment.apiUrl}/maritimo`;
    private resumenPuertoCache$ = new Map<string, Observable<any>>();
    constructor(private http: HttpClient) { }

    /**
     * 1. Obtiene los KPIs operativos y la productividad (6 KPIs superiores)
     */
    obtenerOperacionesSLA(puerto: string): Observable<any> {
        const params = new HttpParams().set('puerto', puerto);

        return this.http.get<any>(`${base_url}/maritimo/operaciones-sla`, { params }).pipe(
            catchError(error => {
                console.error('Error fetching Operaciones SLA:', error);
                // Retornamos un fallback vacío para que el dashboard no se rompa
                return of({ success: false, data: {} });
            })
        );
    }

    /**
     * 2. Obtiene la tabla de motonaves / LineUp
     */
    obtenerLineUp(puerto: string): Observable<any> {
        const params = new HttpParams().set('puerto', puerto);

        return this.http.get<any>(`${base_url}/maritimo/lineup`, { params }).pipe(
            catchError(error => {
                console.error('Error fetching LineUp:', error);
                return of({ success: false, data: [] });
            })
        );
    }

    /**
     * 3. Obtiene el clima y estado del canal
     */
    obtenerClima(puerto: string): Observable<any> {
        const params = new HttpParams().set('puerto', puerto);

        return this.http.get<any>(`${base_url}/maritimo/clima`, { params }).pipe(
            catchError(error => {
                console.error('Error fetching Clima:', error);
                return of({
                    success: false,
                    data: { marea: 'N/A', pleamar: 'N/A', visibilidad: 'N/A', viento: 'N/A', estadoCanal: 'Desconocido' }
                });
            })
        );
    }

    // /**
    //  * 4. ORQUESTADOR MAESTRO: Obtiene absolutamente toda la pestaña marítima
    //  * (Úsalo si tu componente principal carga todo de un solo golpe)
    //  */
    // obtenerResumenOperativo(puerto: string): Observable<any> {
    //     const params = new HttpParams().set('puerto', puerto);

    //     return this.http.get<any>(`${base_url}/maritimo/resumen`, { params }).pipe(
    //         catchError(error => {
    //             console.error('Error fetching Resumen Operativo Completo:', error);
    //             return of({ success: false, data: {} });
    //         })
    //     );
    // }

    obtenerCapaMaritimaMapa(): Observable<any> {
        return this.http.get<any>(`${base_url}/maritimo/mapa-posiciones`).pipe(
            map(response => {
                if (response.exito) {
                    return response.data;
                }
                // Si falla o viene vacío, retornamos un FeatureCollection vacío para que el mapa no explote
                return { type: 'FeatureCollection', features: [] };
            })
        );
    }

    obtenerCapaInfraestructuraMapa(): Observable<any> {
        return this.http.get<any>(`${base_url}/maritimo/mapa-infraestructura`).pipe(
            map(response => response.exito ? response.data : { type: 'FeatureCollection', features: [] })
        );
    }

    /**
         * Limpia la caché reactiva cuando el usuario cambia de puerto o pulsa actualizar
         */
    limpiarCachePuerto(puerto?: string): void {
        if (puerto) {
            this.resumenPuertoCache$.delete(puerto.trim().toUpperCase());
        } else {
            this.resumenPuertoCache$.clear();
        }
    }

    /**
     * Fuente compartida con shareReplay(1): 1 sola consulta HTTP alimenta a todos los widgets autónomos
     */
    obtenerResumenOperativo(puerto: string = 'BUENAVENTURA'): Observable<any> {
        const key = (puerto || 'BUENAVENTURA').trim().toUpperCase();

        if (!this.resumenPuertoCache$.has(key)) {
            const peticion$ = this.http
                .get<any>(`${base_url}/maritimo/resumen?puerto=${key}`)
                .pipe(
                    shareReplay(1),
                    catchError(err => {
                        this.resumenPuertoCache$.delete(key);
                        throw err;
                    })
                );
            this.resumenPuertoCache$.set(key, peticion$);
        }

        return this.resumenPuertoCache$.get(key)!;
    }

    /**
     * 1. Selector para T_Maestro_Terminales + TCL_EstadoTerminales + TCL_EstadoMuelles
     */
    obtenerTerminalesPorPuerto(puerto: string): Observable<any[]> {
        const puertoUpper = (puerto || 'BUENAVENTURA').trim().toUpperCase();
        return this.obtenerResumenOperativo(puertoUpper).pipe(
            map(res => {
                const todos = res?.data?.WDG_TERMINALES || [];
                return todos.filter((t: any) =>
                    (t.id_puerto || '').toUpperCase() === puertoUpper ||
                    (t.ciudad || '').toUpperCase() === puertoUpper
                );
            }),
            catchError(() => of([]))
        );
    }

    /**
     * 2. Selector autónomo para una Tarjeta de Terminal individual (WDG_PORT_TERMINAL_INDIVIDUAL)
     */
    obtenerDatosTerminalSlot(puerto: string, idClonOrTerminal: string): Observable<any | null> {
        return this.obtenerTerminalesPorPuerto(puerto).pipe(
            map(terminales => {
                if (!terminales || terminales.length === 0) return null;

                // Si viene como TERM_SLOT_0, TERM_SLOT_1...
                if (idClonOrTerminal && idClonOrTerminal.startsWith('TERM_SLOT_')) {
                    const idx = parseInt(idClonOrTerminal.replace('TERM_SLOT_', ''), 10);
                    return !isNaN(idx) && terminales[idx] ? terminales[idx] : null;
                }

                // Si viene por id_terminal o nombre directo (ej. 'TER-SPRBUN' o 'SPRBUN')
                return terminales.find((t: any) =>
                    t.id_terminal === idClonOrTerminal ||
                    t.nombre === idClonOrTerminal ||
                    t.codigo_corto === idClonOrTerminal
                ) || terminales[0];
            })
        );
    }

    /**
     * 3. Selector autónomo para cualquier Smart Widget de Marítimo por su código en WIDGET_MAP
     */
    obtenerDatosWidgetMaritimo(puerto: string, codigoWidget: string): Observable<any> {
        const codigo = (codigoWidget || '').trim().toUpperCase();

        return this.obtenerResumenOperativo(puerto).pipe(
            map(res => {
                const d = res?.data || {};

                switch (codigo) {
                    // KPIs Superiores (TCL_RegistroCamiones, TCL_UnidadCarga, T_Maestro_NodosLogisticos)
                    case 'PTT_MAE_KPI_CAMIONES':
                        return d.KPI_CAMIONES_PUERTO || {
                            titulo: 'CAMIONES EN OPERACIÓN',
                            valor: d.camionesPuerto || '937',
                            subtitulo: `ZONA URBANA ${puerto.toUpperCase()}`,
                            colorBorde: 'borde-cyan'
                        };
                    case 'PTT_MAE_KPI_CONTENEDORES':
                        return d.KPI_CONTENEDORES || {
                            titulo: 'CONTENEDORES DÍA',
                            valor: d.contenedoresDia || '2.200',
                            subtitulo: 'FCL · LCL · Reefer activos',
                            colorBorde: 'borde-amarillo'
                        };
                    case 'PTT_MAE_KPI_GRANEL':
                        return d.KPI_GRANEL || {
                            titulo: 'GRANEL - TONS DÍA',
                            valor: d.granelTons || '1.8K',
                            subtitulo: 'Agrícola · Mineral · Líquido',
                            colorBorde: 'borde-naranja'
                        };
                    case 'PTT_MAE_KPI_CARGA_SUELTA':
                        return d.KPI_CARGA_SUELTA || {
                            titulo: 'CARGA SUELTA - TM',
                            valor: d.cargaSuelta || '293',
                            subtitulo: 'Break-bulk · Project · Paletizada',
                            colorBorde: 'borde-green'
                        };
                    case 'PTT_MAE_KPI_RORO':
                        return d.KPI_RORO || {
                            titulo: 'VEHÍCULOS RO-RO',
                            valor: d.vehiculosRoro || '147',
                            subtitulo: 'Impo · Expo · Patios PDI',
                            colorBorde: 'borde-teal'
                        };
                    case 'PTT_MAE_KPI_BODEGAS':
                        return d.KPI_BODEGAS || {
                            titulo: 'SATURACIÓN BODEGAS',
                            valor: d.saturacionBodegas || '72%',
                            subtitulo: '8 bodegas · monitoreo activo',
                            colorBorde: 'borde-purple'
                        };

                    // Tablas, Paneles y Gráficas Operativas (Tablas TCL_*)
                    case 'PTT_MAE_TAB_MOTONAVES':
                        return d.TABLE_REPORTE_MOTONAVES || d.WDG_TABLE_REPORTE_MOTONAVES || null;
                    case 'PTT_MAE_CHRT_ETA_ATA':
                        return d.CHART_ETA_ATA || d.WDG_CHART_ETA_ATA || null;
                    case 'PTT_MAE_CHRT_TONELADAS':
                        return d.CHART_TONELADAS || d.WDG_CHART_TONELADAS || null;
                    case 'PTT_MAE_PANEL_CANAL':
                        return d.CONDICIONES_CANAL || d.WDG_CONDICIONES_CANAL || null;
                    case 'PTT_MAE_PANEL_RESUMEN':
                        return d.RESUMEN_SEMANAL || d.WDG_RESUMEN_SEMANAL || null;
                    case 'PTT_MAE_CHRT_PROD':
                        return d.CHART_PRODUCTIVIDAD || d.WDG_CHART_PRODUCTIVIDAD || null;
                    case 'PTT_MAE_PANEL_ALERTAS':
                        return d.REPORTES_OPERATIVOS || d.WDG_REPORTES_OPERATIVOS || null;

                    // Bloque Supertransporte (TCL_TraficoPortuarioMaritimo + TCL_HistoricosSupertransporte)
                    case 'PTT_MAE_PANEL_TRAFICO':
                        return d.ANALISIS_TRAFICO || d.WDG_ANALISIS_TRAFICO || null;
                    case 'PTT_MAE_CHRT_PART_TERM':
                        return d.PARTICIPACION_NAC || d.WDG_PARTICIPACION_NAC || null;
                    case 'PTT_MAE_CHRT_MEZCLA':
                        return d.MEZCLA_CARGA || d.WDG_MEZCLA_CARGA || null;
                    case 'PTT_MAE_CHRT_TIPO_OP':
                        return d.TIPO_OPERACION || d.WDG_TIPO_OPERACION || null;
                    case 'PTT_MAE_TAB_MATRIZ_CARGA':
                        return d.MATRIZ_TERMINAL_CARGA || d.WDG_MATRIZ_TERMINAL_CARGA || null;
                    case 'PTT_MAE_CHRT_HISTORICO':
                        return d.HISTORICO_ANUAL || d.WDG_HISTORICO_ANUAL || null;
                    case 'PTT_MAE_PANEL_IMPLICACIONES':
                        return d.IMPLICACIONES_OPERATIVAS || d.WDG_IMPLICACIONES_OPERATIVAS || null;

                    default:
                        return null;
                }
            })
        );
    }
}
