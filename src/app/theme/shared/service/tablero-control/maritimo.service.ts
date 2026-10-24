/* eslint-disable @typescript-eslint/no-explicit-any */
/*
    Author: German Valencia
    Service: PORTTOS Marítimo Service (Caché Compartido por Puerto + Cascada de Terminales)
*/
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, shareReplay, tap } from 'rxjs/operators';
import { FiltroTableroService } from './filtro-tablero.service';
import { environment } from 'src/environments/environment';
const base_url = environment.apiUrl;

/**
 * Códigos del registro cuyo nodo el API publica con otro nombre (corregido 2026-10-22: estos widgets quedaban
 * sin hidratación y al ampliarse se veían vacíos).
 */
const ALIAS_MARITIMO: Record<string, string> = {
    PTT_MAE_PANEL_ALERTAS: 'PTT_MAE_PANEL_REPORTES',
    PTT_MAE_TAB_MATRIZ_CARGA: 'PTT_MAE_TAB_MATRIZ',
    PTT_MAE_MATRIZ_CARGA: 'PTT_MAE_TAB_MATRIZ'
};

@Injectable({
    providedIn: 'root'
})
export class MaritimoService {
    private readonly baseApi: string;
    private resumenCachePorPuerto$ = new Map<string, Observable<any>>();

    constructor(
        private http: HttpClient,
        private _filtroTablero: FiltroTableroService
    ) {
        this.baseApi = `${base_url}/maritimo/resumen`;
    }

    /**
     * Evita que códigos de widget ('PTT_MAE_...') u objetos se cuelen como nombre de puerto
     */
    private resolverPuertoReal(puertoCandidato?: any): string {
        if (!puertoCandidato || typeof puertoCandidato === 'object') {
            return (this._filtroTablero.getCiudadActual() || 'BUENAVENTURA')
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
            return (this._filtroTablero.getCiudadActual() || 'BUENAVENTURA')
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

                // 3. El API publica cada nodo con el código PTT_MAE_* del widget (homologación): se usa primero
                const directo = d[codigoWidget] ?? d[ALIAS_MARITIMO[codigoWidget]];
                if (directo !== undefined && directo !== null) return directo;

                // 4. Tablas, Gráficas y Paneles de Marítimo (llaves anteriores)
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

        // Corregido 2026-10-22: el API publica cada KPI con su código (PTT_MAE_KPI_*); kpisMap buscaba nombres
        // heredados (contenedoresDia, granelTons...) que ya no llegan y al ampliar la tarjeta mostraba 0
        Object.keys(raw)
            .filter((k) => k.startsWith('PTT_MAE_KPI_') && raw[k] && typeof raw[k] === 'object' && raw[k].valor !== undefined)
            .forEach((k) => (kpisMap[k] = { ...(kpisMap[k] || {}), ...raw[k] }));

        const dataNormalizada = {
            ...raw,
            // Alias de códigos del registro (ver ALIAS_MARITIMO); así también los hidrata el dashboard
            ...Object.fromEntries(Object.entries(ALIAS_MARITIMO).filter(([codigo, origen]) => raw[codigo] === undefined && raw[origen] !== undefined).map(([codigo, origen]) => [codigo, raw[origen]])),
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
            PARTICIPACION_TERMINAL: raw.PARTICIPACION_TERMINAL || raw.WDG_PARTICIPACION_TERMINAL || raw.WDG_PARTICIPACION_NAC || raw.participacion || null,
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
