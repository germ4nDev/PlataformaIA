/* eslint-disable @typescript-eslint/no-explicit-any */
/*
    Author: German Valencia
    Pattern: PORTTOS Angular Service Pattern - Bodegas Service (Smart Widgets + shareReplay)
*/
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, shareReplay, catchError } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
const base_url = environment.apiUrl;

@Injectable({
    providedIn: 'root'
})
export class BodegasService {
    private readonly base_url = `${environment.apiUrl}/api/tablero-control`;
    private bodegasCachePorPuerto$ = new Map<string, Observable<any>>();

    constructor(private http: HttpClient) { }

    /**
     * Invalida la caché cuando el usuario cambia de puerto en el Header
     */
    public limpiarCachePuerto(puerto?: string): void {
        if (puerto) {
            this.bodegasCachePorPuerto$.delete(puerto.trim().toUpperCase());
        } else {
            this.bodegasCachePorPuerto$.clear();
        }
    }

    /**
     * Petición única compartida por puerto mediante shareReplay(1)
     */
    public obtenerDashboardBodegas(puerto: string): Observable<any> {
        const puertoKey = (puerto || 'BUENAVENTURA').trim().toUpperCase();

        if (!this.bodegasCachePorPuerto$.has(puertoKey)) {
            const peticion$ = this.http
                .get<any>(`${base_url}/bodegas`, { params: { puerto: puertoKey } })
                .pipe(
                    map((resp) => this.homologarPayloadBodegas(resp?.data || resp, puertoKey)),
                    shareReplay(1),
                    catchError((err) => {
                        console.error(`❌ [BodegasService] Error consultando puerto ${puertoKey}:`, err);
                        this.bodegasCachePorPuerto$.delete(puertoKey);
                        // Corregido 2026-10-23: el error ya no se ve como 0 % / 0 Ton (parecía un dato válido)
                        return of(this.homologarPayloadBodegas({ error: err?.error?.msg || 'No se pudo consultar el API de bodegas' }, puertoKey));
                    })
                );

            this.bodegasCachePorPuerto$.set(puertoKey, peticion$);
        }

        return this.bodegasCachePorPuerto$.get(puertoKey)!;
    }

    /**
     * Selector específico para que cada Smart Widget de Bodegas consuma solo su nodo
     */
    /**
     * Selector blindado para que cada Smart Widget y cada KPI de Bodegas reciba su nodo exacto
     */
    public obtenerDatosWidgetBodegas(puerto: string, codigoWidget: string): Observable<any> {
        const codigo = (codigoWidget || '').trim().toUpperCase();

        return this.obtenerDashboardBodegas(puerto).pipe(
            map((dashboard) => {
                // 1. Widgets de Panel, Gráficas y Tabla
                if (codigo === 'PTT_BOD_PANEL_SATURACION' || codigo.includes('SATURACION')) {
                    return { saturacionBodegas: dashboard.saturacionBodegas, origen: dashboard.origen };
                }
                if (codigo === 'PTT_BOD_CHRT_FLUJO' || (codigo.includes('CHRT') && codigo.includes('FLUJO'))) {
                    return dashboard.flujoEntradasSalidas;
                }
                if (codigo === 'PTT_BOD_CHRT_CARGA' || (codigo.includes('CHRT') && codigo.includes('CARGA'))) {
                    return dashboard.distribucionPorCarga;
                }
                if (codigo === 'PTT_BOD_TAB_MOVIMIENTOS' || codigo.includes('TAB_MOVIMIENTOS')) {
                    return { movimientos: dashboard.movimientosBodega, origen: dashboard.origen };
                }

                // 2. Tarjetas KPI de Bodegas (Coincidencia exacta o por palabra clave)
                const kpis = dashboard.kpis || {};
                // Corregido 2026-10-23: primero el código exacto; antes un código terminado en _1, _2... podía
                // tomar el KPI equivocado por coincidencia floja
                const exactos: Record<string, any> = {
                    PTT_BOD_KPI_OCUPACION: kpis.ocupacionGeneral,
                    PTT_BOD_KPI_INVENTARIO: kpis.inventarioTotal,
                    PTT_BOD_KPI_DESPACHOS: kpis.tasaDespacho,
                    PTT_BOD_KPI_ALERTAS: kpis.alertasBodega
                };
                let kpiSeleccionado: any = exactos[codigo] ?? null;
                if (!kpiSeleccionado && codigo.includes('_KPI_')) {
                    if (codigo.includes('OCUP') || codigo.includes('CAPACIDAD')) kpiSeleccionado = kpis.ocupacionGeneral;
                    else if (codigo.includes('INVENTARIO') || codigo.includes('EXISTENCIA')) kpiSeleccionado = kpis.inventarioTotal;
                    else if (codigo.includes('DESPACH') || codigo.includes('FLUJO') || codigo.includes('OPERATIV')) kpiSeleccionado = kpis.tasaDespacho;
                    else if (codigo.includes('ALERT') || codigo.includes('CRITIC')) kpiSeleccionado = kpis.alertasBodega;
                }

                // Si es un KPI, devolvemos todas las variantes de nombre de propiedad que usa KpiCardTclComponent
                if (kpiSeleccionado) {
                    return {
                        ...kpiSeleccionado,
                        titulo: kpiSeleccionado.titulo,
                        label: kpiSeleccionado.titulo,
                        nombreWidget: kpiSeleccionado.titulo,
                        valor: kpiSeleccionado.valor,
                        value: kpiSeleccionado.valor,
                        subtitulo: kpiSeleccionado.subtitulo,
                        icono: kpiSeleccionado.icono || 'feather icon-box',
                        colorBorde: kpiSeleccionado.colorBorde || 'borde-cyan'
                    };
                }

                return dashboard;
            })
        );
    }

    /**
     * Homologa la respuesta del Backend o calcula las agregaciones si recibe las tablas crudas de SQL
     */
    private homologarPayloadBodegas(raw: any, puerto: string): any {
        const bodegas: any[] = Array.isArray(raw?.bodegas)
            ? raw.bodegas
            : Array.isArray(raw?.saturacionBodegas)
                ? raw.saturacionBodegas
                : [];

        const movimientos: any[] = Array.isArray(raw?.movimientos)
            ? raw.movimientos
            : Array.isArray(raw?.movimientosBodega)
                ? raw.movimientosBodega
                : [];

        // Cálculo dinámico de KPIs a partir de las filas si no vienen precalculados
        const totalCapacidad = bodegas.reduce((acc, b) => acc + Number(b.capacidad_maxima_ton || b.capacidad || 0), 0);
        const totalInventario = bodegas.reduce((acc, b) => acc + Number(b.inventario_actual_ton || b.inventario || 0), 0);
        const pctOcupacion =
            totalCapacidad > 0
                ? Math.round((totalInventario / totalCapacidad) * 100)
                : Number(raw?.ocupacionPromedio || 0);

        const bodegasCriticas = bodegas.filter(
            (b) => Number(b.ocupacion_pct ?? b.porcentaje ?? 0) >= 90 || String(b.estado_operativo || '').includes('CRÍTIC')
        ).length;

        // Sin respuesta del API: las tarjetas dicen que no hay dato en lugar de mostrar 0 % / 0 Ton
        const sinDato = (titulo: string) => ({ titulo, valor: '—', subtitulo: raw?.error || 'Sin datos de bodegas', colorBorde: 'borde-gris' });
        const kpis = raw?.kpis || (raw?.error || !bodegas.length
            ? {
                ocupacionGeneral: sinDato('OCUPACIÓN DE BODEGAS'),
                inventarioTotal: sinDato('INVENTARIO ALMACENADO'),
                tasaDespacho: sinDato('FLUJO OPERATIVO (24H)'),
                alertasBodega: sinDato('BODEGAS EN ALERTA')
            }
            : {
                ocupacionGeneral: {
                    titulo: 'OCUPACIÓN DE BODEGAS',
                    valor: totalCapacidad > 0 ? `${pctOcupacion}%` : '—',
                    subtitulo: `${bodegas.length} Bodegas y Silos activos`,
                    colorBorde: pctOcupacion >= 90 ? 'borde-rojo' : 'borde-cyan'
                },
                inventarioTotal: {
                    titulo: 'INVENTARIO ALMACENADO',
                    valor: `${totalInventario.toLocaleString('es-CO')} Ton`,
                    subtitulo: `Capacidad: ${totalCapacidad.toLocaleString('es-CO')} Ton`,
                    colorBorde: 'borde-green'
                },
                tasaDespacho: { titulo: 'FLUJO OPERATIVO (24H)', valor: '—', subtitulo: 'El API no envió el cálculo de 24 h', colorBorde: 'borde-gris' },
                alertasBodega: {
                    titulo: 'BODEGAS EN ALERTA',
                    valor: String(bodegasCriticas),
                    subtitulo: bodegasCriticas > 0 ? 'Saturación ≥ 90% detectada' : 'Almacenamiento en rango normal',
                    colorBorde: bodegasCriticas > 0 ? 'borde-rojo' : 'borde-purple'
                }
            });

        return {
            puerto,
            kpis,
            saturacionBodegas: bodegas,
            flujoEntradasSalidas: raw?.flujoEntradasSalidas || {},
            distribucionPorCarga: raw?.distribucionPorCarga || {},
            movimientosBodega: movimientos,
            origen: raw?.origen || null,
            error: raw?.error || null
        };
    }

    // ---------------------------------------------------------------- detalle de la vista ampliada (Fase 3)

    /** Serie de ocupación por bodega (fotos de TCL_OcupacionNodos). */
    public ocupacionBodegas(puerto: string, horas: 24 | 72 | 168 = 24): Observable<any> {
        const p = (puerto || 'BUENAVENTURA').trim().toUpperCase();
        return this.http.get<any>(`${base_url}/bodegas/ocupacion`, { params: { puerto: p, horas: String(horas) } }).pipe(map((r) => r?.data));
    }

    /** Movimientos de los últimos días con la estadía calculada (hasta 2.000). */
    public movimientosRango(puerto: string, dias = 30): Observable<any> {
        const p = (puerto || 'BUENAVENTURA').trim().toUpperCase();
        return this.http.get<any>(`${base_url}/bodegas/movimientos/rango`, { params: { puerto: p, dias: String(dias) } }).pipe(map((r) => r?.data));
    }
}
