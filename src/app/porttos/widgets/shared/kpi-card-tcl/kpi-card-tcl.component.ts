/* eslint-disable @typescript-eslint/no-explicit-any */
/*
    Author: German Valencia
    Pattern: PORTTOS Smart Widget - KPI Card Inteligente (Autónomo + Retrocompatible)
    Description: Tarjeta universal que detecta su prefijo (PTT_MAE_, PTT_BOD_, PTT_GATE_, PTT_GNL_, PTT_CONT_)
                 y se auto-conecta a su respectivo servicio en la Torre de Control.
*/
import { Component, Input, OnInit, OnChanges, OnDestroy, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, Subscription } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { DashboardService } from 'src/app/theme/shared/service/tablero-control/dashboard.service';
import { MaritimoService } from 'src/app/theme/shared/service/tablero-control/maritimo.service';
import { BodegasService } from 'src/app/theme/shared/service/tablero-control/bodegas.service';
import { VirtualGateService } from 'src/app/theme/shared/service/tablero-control/virtual-gate.service';
import { GnlStateService } from 'src/app/theme/shared/service/tablero-control/gnl-state.service';
import { ContenedoresService } from 'src/app/theme/shared/service/tablero-control/contenedores.service';
import { TablerosPestanasService } from 'src/app/theme/shared/service/tablero-control/tableros-pestanas.service';

import { KpiShellComponent } from 'src/app/theme/shared/components/kpi-shell/kpi-shell.component';
import { KpiFormatPipe } from 'src/app/theme/shared/pipes/kpi-format.pipe';
import { GraficaTclComponent, SerieGrafica } from '../grafica-tcl/grafica-tcl.component';
import { OrigenDatoTclComponent } from 'src/app/theme/shared/components/origen-dato/origen-dato.component';
import { exportarCsv } from '../exportar-csv';

@Component({
    selector: 'app-kpi-card-tcl',
    standalone: true,
    imports: [CommonModule, KpiShellComponent, KpiFormatPipe, GraficaTclComponent, OrigenDatoTclComponent],
    templateUrl: './kpi-card-tcl.component.html',
    styleUrl: './kpi-card-tcl.component.scss'
})
export class KpiCardTclComponent implements OnInit, OnChanges, OnDestroy {
    @Input() widgetConfig: any;
    @Input() isEnfoque: boolean = false;
    @Input() mostrarTabla: boolean = false;

    // Retrocompatibilidad para pestañas pendientes de migrar y modo Enfoque
    @Input() datosVivos: any;

    private datosAutonomosSQL: any = null;
    /** Detalle que solo se pide al ampliar (p. ej. la serie de la TRM). */
    private extraEnfoque: any = null;
    public cargandoKpi: boolean = false;

    // Bandera para evitar múltiples suscripciones en modo autónomo (Memory Leak)
    private gnlSubscrito: boolean = false;
    /** KPI en vivo de las pestañas Granel, Carga suelta, Capacidad y Noticias (se cambia si cambia el puerto). */
    private kpiTableroSub?: Subscription;

    private readonly destroy$ = new Subject<void>();

    constructor(
        private _maritimoService: MaritimoService,
        private _bodegasService: BodegasService,
        private _virtualGateService: VirtualGateService,
        private _gnlState: GnlStateService,
        private _contenedoresService: ContenedoresService,
        private _tableros: TablerosPestanasService,
        private _torreService: DashboardService,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit(): void {
        this.resolverDatosKpi();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (
            (changes['widgetConfig'] && !changes['widgetConfig'].firstChange) ||
            (changes['datosVivos'] && this.datosVivos)
        ) {
            this.resolverDatosKpi();
        }
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    private resolverDatosKpi(): void {
        // 1. Si recibió datos por modo Enfoque o desde una pestaña aún no migrada
        if (this.datosVivos && this.datosVivos.valor !== undefined) {
            this.datosAutonomosSQL = this.datosVivos;
            this.cargandoKpi = false;
            this.cdr.detectChanges();
            return;
        }

        if (!this.widgetConfig) return;

        const codigoWidget = (this.widgetConfig.type || this.widgetConfig.codigoWidget || '').trim().toUpperCase();
        const puerto = (this.widgetConfig.puerto || 'BUENAVENTURA').trim().toUpperCase();

        if (!codigoWidget) {
            this.cargandoKpi = false;
            return;
        }

        this.cargandoKpi = true;

        // 1b. Pestañas Granel, Carga suelta, Capacidad y Noticias (PTT_GRA_, PTT_SUE_, PTT_CAP_, PTT_NOT_):
        //     el KPI viene armado en el tablero de su pestaña y se actualiza solo (refresco y aviso por socket)
        if (TablerosPestanasService.moduloDe(codigoWidget)) {
            this.kpiTableroSub?.unsubscribe();
            this.kpiTableroSub = this._tableros.kpi(codigoWidget, puerto)
                .pipe(takeUntil(this.destroy$)).subscribe((kpiData: any) => {
                    this.datosAutonomosSQL = kpiData || { valor: 0, subtitulo: 'Sin datos todavía' };
                    this.cargandoKpi = false;
                    this.cdr.detectChanges();
                });
            // Vista ampliada (Fase 3): la TRM trae su serie de 30 días bajo demanda
            if (this.isEnfoque && codigoWidget === 'PTT_NOT_KPI_TRM') {
                this._tableros.trm(puerto, 30).pipe(takeUntil(this.destroy$)).subscribe({
                    next: (s) => {
                        this.extraEnfoque = s.valores.length ? { serie: { '30 días': { labels: s.labels, valores: s.valores } }, fuente: s.fuente } : null;
                        this.cdr.detectChanges();
                    },
                    error: () => undefined
                });
            }
            return;
        }

        // 2. Consumo autónomo para KPIs Marítimos
        if (codigoWidget.startsWith('PTT_MAE_KPI_')) {
            this._maritimoService.obtenerDatosWidgetMaritimo(puerto, codigoWidget)
                .pipe(takeUntil(this.destroy$)).subscribe({
                    next: (kpiData: any) => {
                        if (kpiData) this.datosAutonomosSQL = kpiData;
                        this.cargandoKpi = false;
                        this.cdr.detectChanges();
                    },
                    error: () => this.marcarError()
                });
            return;
        }

        // 3. Consumo autónomo para KPIs de Bodegas
        if (codigoWidget.startsWith('PTT_BOD_') || codigoWidget.includes('_BOD_')) {
            this._bodegasService.obtenerDatosWidgetBodegas(puerto, codigoWidget)
                .pipe(takeUntil(this.destroy$)).subscribe({
                    next: (kpiData: any) => {
                        if (kpiData) this.datosAutonomosSQL = kpiData;
                        this.cargandoKpi = false;
                        this.cdr.detectChanges();
                    },
                    error: () => this.marcarError()
                });
            return;
        }

        // 4. Consumo autónomo para KPIs de Virtual Gate
        if (codigoWidget.startsWith('PTT_GATE_KPI_')) {
            this._virtualGateService.obtenerDatosWidgetGate(codigoWidget, puerto)
                .pipe(takeUntil(this.destroy$)).subscribe({
                    next: (kpiData: any) => {
                        if (kpiData) this.datosAutonomosSQL = kpiData;
                        this.cargandoKpi = false;
                        this.cdr.detectChanges();
                    },
                    error: () => this.marcarError()
                });
            return;
        }

        // 5. Consumo autónomo para KPIs de Contenedores
        if (codigoWidget.startsWith('PTT_CONT_KPI_')) {
            this._contenedoresService.obtenerDatosWidgetContenedores(codigoWidget, puerto)
                .pipe(takeUntil(this.destroy$)).subscribe({
                    next: (res: any) => {
                        const infoBase = this.obtenerTitulosContenedores(codigoWidget);
                        this.datosAutonomosSQL = { ...infoBase, ...res };
                        this.cargandoKpi = false;
                        this.cdr.detectChanges();
                    },
                    error: () => this.marcarError()
                });
            return;
        }

        // 6. Consumo autónomo para KPIs de GNL (Socket Reactivo)
        if (codigoWidget.startsWith('PTT_GNL_KPI_') || codigoWidget.includes('_GNL_')) {

            // Prevención de fugas de memoria y recálculos innecesarios
            if (this.gnlSubscrito) {
                this.cargandoKpi = false;
                return;
            }
            this.gnlSubscrito = true;

            this._gnlState.telemetriaFiltrada$
                .pipe(takeUntil(this.destroy$))
                .subscribe((telemetria: any) => {
                    const t = telemetria || {};
                    const esConsolidado = t.esConsolidado;
                    const brazoLabel = esConsolidado ? 'SISTEMA CONSOLIDADO' : `BRAZO ${t.brazo_id || 'GENERAL'}`;

                    // CÁLCULO DE ENERGÍA DINÁMICO
                    const flujoParaEnergia = Number(t.caudal_m3h ?? t.flujo_m3h ?? t.flujo_m3 ?? 0);
                    const energiaCalculada = flujoParaEnergia > 0 ? ((flujoParaEnergia * 22.4) / 3600).toFixed(4) : 0;

                    // DICCIONARIO CALIBRADO EXACTAMENTE CON EL JSON SCADA
                    const mapaGnlKpis: { [key: string]: any } = {
                        'PTT_GNL_KPI_FLUJO': {
                            titulo: 'CAUDAL DE FLUJO',
                            valor: t.caudal_m3h ?? t.flujo_m3h ?? t.flujo_m3 ?? 0,
                            unidad: 'm³/h',
                            subtitulo: brazoLabel,
                            colorBorde: 'borde-cyan'
                        },
                        'PTT_GNL_KPI_PRESION': {
                            titulo: 'PRESIÓN',
                            valor: t.presion ?? 0,
                            unidad: 'psi',
                            subtitulo: brazoLabel,
                            colorBorde: 'borde-naranja'
                        },
                        'PTT_GNL_KPI_TEMP': {
                            titulo: 'TEMPERATURA',
                            valor: t.temp_ducto ?? 0,
                            unidad: '°C',
                            subtitulo: brazoLabel,
                            colorBorde: 'borde-rojo'
                        },
                        'PTT_GNL_KPI_BOG': {
                            titulo: 'BOG',
                            valor: t.bog ?? 0,
                            unidad: 'kg/h',
                            subtitulo: 'Gas evaporado / Boil-off',
                            colorBorde: 'borde-purple',
                            icono: 'feather icon-wind'
                        },
                        'PTT_GNL_KPI_DESCARGA': {
                            titulo: 'DESCARGA DE BUQUE',
                            valor: t.descarga_buque ?? 0,
                            unidad: 'm³/h',
                            subtitulo: 'Telemetría de entrada',
                            colorBorde: 'borde-blue',
                            icono: 'feather icon-anchor'
                        },
                        'PTT_GNL_KPI_INYECCION': {
                            titulo: 'INYECCIÓN A RED',
                            valor: t.inyeccion ?? 0,
                            unidad: 'm³/h',
                            subtitulo: 'Flujo de salida a red',
                            colorBorde: 'borde-green',
                            icono: 'feather icon-log-out'
                        },
                        'PTT_GNL_KPI_TNQ_OCUP': {
                            titulo: 'OCUPACIÓN DE PLANTA',
                            valor: t.volumen_almacenado ?? 0,
                            unidad: '%',
                            subtitulo: 'Porcentaje de llenado de tanques',
                            colorBorde: 'borde-amarillo',
                            icono: 'feather icon-database'
                        },
                        'PTT_GNL_KPI_VOLUMEN': {
                            titulo: 'ENERGÍA TRANSFERIDA',
                            valor: energiaCalculada,
                            unidad: 'MMBTU',
                            subtitulo: 'Energía del último segundo',
                            colorBorde: 'borde-indigo',
                            icono: 'feather icon-zap'
                        },
                        'PTT_GNL_KPI_CALIDAD': {
                            titulo: 'PODER CALORÍFICO',
                            valor: t.poder_calorifico ?? 0,
                            unidad: 'BTU/ft³',
                            subtitulo: 'Calidad de la mezcla GNL',
                            colorBorde: 'borde-teal',
                            icono: 'feather icon-thermometer'
                        },
                        // Agregados 2026-10-17: estaban en el registro pero caían en "Código no reconocido"
                        'PTT_GNL_KPI_CALORIFICO': {
                            titulo: 'PODER CALORÍFICO',
                            valor: t.poder_calorifico ?? 0,
                            unidad: 'BTU/ft³',
                            subtitulo: brazoLabel,
                            colorBorde: 'borde-teal',
                            icono: 'feather icon-thermometer'
                        },
                        'PTT_GNL_KPI_ALERTAS': {
                            titulo: 'ALARMAS ACTIVAS',
                            valor: Array.isArray(t.alertas) ? t.alertas.length : (t.alarma_activa ? 1 : 0),
                            unidad: '',
                            subtitulo: esConsolidado
                                ? `${Array.isArray(t.alertas) ? t.alertas.length : 0} de ${t.cantidadBrazosActivos || 0} brazos en alarma`
                                : t.alarma_activa ? 'Alarma en el último pulso' : 'Sin alarma en el último pulso',
                            colorBorde: t.alarma_activa ? 'borde-rojo' : 'borde-green',
                            icono: 'feather icon-bell'
                        },
                        'PTT_GNL_KPI_ODO_MMBTU': {
                            titulo: 'ENERGÍA ACUMULADA',
                            valor: this.acumularEnergiaGnl(Number(energiaCalculada) || 0, t.timestamp).toFixed(2),
                            unidad: 'MMBTU',
                            subtitulo: 'Desde que se abrió el tablero',
                            colorBorde: 'borde-indigo',
                            icono: 'feather icon-zap'
                        }
                    };

                    // Vista ampliada (2026-10-24): el mismo valor por brazo, con la lectura que ya está en memoria
                    const campoPorBrazo: { [k: string]: string[] } = {
                        PTT_GNL_KPI_FLUJO: ['caudal_m3h', 'flujo_m3h', 'flujo_m3'], PTT_GNL_KPI_PRESION: ['presion_psi', 'presion'],
                        PTT_GNL_KPI_TEMP: ['temp_ducto', 'temperatura'], PTT_GNL_KPI_BOG: ['bog', 'bog_m3h'],
                        PTT_GNL_KPI_DESCARGA: ['descarga_buque'], PTT_GNL_KPI_INYECCION: ['inyeccion'],
                        PTT_GNL_KPI_TNQ_OCUP: ['volumen_almacenado'], PTT_GNL_KPI_CALIDAD: ['poder_calorifico'], PTT_GNL_KPI_CALORIFICO: ['poder_calorifico']
                    };
                    const brazos: any[] = Array.isArray(t.brazosDetalle) ? t.brazosDetalle : [];
                    const campos = campoPorBrazo[codigoWidget];
                    const desgloseBrazos = campos && brazos.length
                        ? brazos.map((b: any) => ({
                            etiqueta: `Brazo ${b.brazo_id || b.codigo_segmento || '?'}`,
                            valor: Number(campos.map((c) => b[c]).find((v) => v !== undefined && v !== null) ?? 0),
                            semaforo: b.alarma_activa ? 'rojo' : undefined
                        }))
                        : codigoWidget === 'PTT_GNL_KPI_ALERTAS' && brazos.length
                            ? brazos.filter((b: any) => b.alarma_activa).map((b: any) => ({ etiqueta: `Brazo ${b.brazo_id || b.codigo_segmento} · ${b.event_type || 'alarma'}`, valor: 1, semaforo: 'rojo' }))
                            : null;

                    if (mapaGnlKpis[codigoWidget]) {
                        const kpi = desgloseBrazos ? { ...mapaGnlKpis[codigoWidget], desglose: desgloseBrazos } : mapaGnlKpis[codigoWidget];
                        // Datos de demo: se rotulan para que no se presenten como telemetría real
                        this.datosAutonomosSQL = t.simulado
                            ? { ...kpi, subtitulo: `${kpi.subtitulo} · SIMULADO` }
                            : kpi;
                    } else {
                        // Fallback si el código no está mapeado
                        this.datosAutonomosSQL = {
                            valor: 0,
                            titulo: 'Métrica GNL',
                            subtitulo: 'Código no reconocido',
                            colorBorde: 'borde-secundario'
                        };
                    }
                    this.cargandoKpi = false;
                    this.cdr.detectChanges();
                });
            return;
        }

        // Si el código no matchea con nada, marcamos error
        this.marcarError();
    }

    private marcarError(): void {
        this.datosAutonomosSQL = { valor: 0, subtitulo: 'Sin conexión de datos' };
        this.cargandoKpi = false;
        this.cdr.detectChanges();
    }

    // DICCIONARIO VISUAL PARA LOS KPIs DE CONTENEDORES
    /** Totalizador simple de energía GNL por instancia de tarjeta (un pulso por timestamp). */
    private energiaAcumuladaGnl = 0;
    private ultimoPulsoGnl: string | null = null;
    private acumularEnergiaGnl(energiaPulso: number, timestamp?: string): number {
        if (timestamp && timestamp !== this.ultimoPulsoGnl) {
            this.ultimoPulsoGnl = timestamp;
            this.energiaAcumuladaGnl += energiaPulso;
        }
        return this.energiaAcumuladaGnl;
    }

    private obtenerTitulosContenedores(codigo: string): any {
        switch (codigo) {
            case 'PTT_CONT_KPI_CARGADOS':
                return { titulo: 'CARGADOS PENDIENTES', icono: 'feather icon-box', colorBorde: 'borde-cyan' };
            case 'PTT_CONT_KPI_VACIOS':
                return { titulo: 'VACÍOS POR DEVOLVER', icono: 'feather icon-refresh-cw', colorBorde: 'borde-naranja' };
            case 'PTT_CONT_KPI_REEFER':
                return { titulo: 'REEFER ACTIVOS', icono: 'feather icon-thermometer', colorBorde: 'borde-teal' };
            case 'PTT_CONT_KPI_FREETIME':
                return { titulo: 'FREE TIME VENCIDO', icono: 'feather icon-alert-triangle', colorBorde: 'borde-blue' };
            default:
                return { titulo: 'Métrica Clave', icono: 'feather icon-activity', colorBorde: 'borde-primary' };
        }
    }

    get data(): any {
        if (!this.widgetConfig) return {};

        const configBase = this.widgetConfig.data || this.widgetConfig || {};
        const fuenteViva = { ...(this.datosAutonomosSQL || this.datosVivos || {}), ...(this.extraEnfoque || {}) };

        return {
            ...configBase,
            ...fuenteViva,
            titulo: fuenteViva.titulo || configBase.titulo || 'Métrica Clave',
            valor:
                fuenteViva.valor !== undefined && fuenteViva.valor !== null
                    ? fuenteViva.valor
                    : configBase.valor || 0,
            subtitulo: fuenteViva.subtitulo || configBase.subtitulo || '',
            colorBorde: fuenteViva.colorBorde || configBase.colorBorde || configBase.color || 'info',
            icono: fuenteViva.icono || configBase.icono || 'feather icon-activity'
        };
    }

    get valorCompletoMuted(): string | null {
        const origen = this.datosAutonomosSQL || this.widgetConfig?.data || this.widgetConfig || {};

        if (origen.valorCompleto) {
            return String(origen.valorCompleto);
        }

        const valorBruto = origen.valor ?? origen.value ?? '';
        if (valorBruto === null || valorBruto === undefined || valorBruto === '') return null;

        const texto = String(valorBruto).trim();
        if (texto.includes('%')) return null;

        const match = texto.match(/^([+-]?[\d.,]+)\s*([a-zA-Z/]+)?$/);
        if (!match) return null;

        const num = parseFloat(match[1].replace(/\./g, '').replace(',', '.'));
        if (isNaN(num) || Math.abs(num) < 1000) {
            return null;
        }

        const unidad = match[2] || origen.unidad || '';
        const numeroFormateado = num.toLocaleString('es-CO', {
            minimumFractionDigits: num % 1 !== 0 ? 1 : 0,
            maximumFractionDigits: 1
        });

        return unidad ? `${numeroFormateado} ${unidad}` : numeroFormateado;
    }

    get isLoading(): boolean {
        return !this.widgetConfig || (this.cargandoKpi && !this.datosAutonomosSQL && !this.datosVivos);
    }

    maximizarDesdeShell(): void {
        if (this.isEnfoque) {
            this._torreService.cerrarModoEnfoque();
        } else {
            // El modal es otra instancia: lleva el puerto y, si el valor vino hidratado por el dashboard, esos datos
            const vivos = this.datosVivos?.valor !== undefined ? this.datosVivos : undefined;
            this._torreService.abrirModoEnfoque(
                this.widgetConfig?.type || this.widgetConfig?.codigoWidget || 'PTT_MAE_KPI_CAMIONES',
                { ...this.data, puerto: this.widgetConfig?.puerto, datosVivos: vivos }
            );
        }
    }

    // ---------------------------------------------------------------- KPI ampliado

    /** Rango elegido de la serie (24h, 7d...). */
    public rangoSerie = '';

    get puertoEnfoque(): string {
        return (this.widgetConfig?.puerto || this.widgetConfig?.data?.puerto || '').toString().toUpperCase();
    }

    get rangosSerie(): string[] {
        const serie = this.data?.serie;
        if (!serie || typeof serie !== 'object') return [];
        const rangos = Object.keys(serie).filter((k) => Array.isArray(serie[k]?.valores) && serie[k].valores.length);
        if (rangos.length && !rangos.includes(this.rangoSerie)) this.rangoSerie = rangos[0];
        return rangos;
    }

    get serieActual(): { labels: string[]; valores: Array<number | null> } {
        return this.data?.serie?.[this.rangoSerie] || { labels: [], valores: [] };
    }

    /** Misma referencia mientras no cambien los valores (la gráfica solo se redibuja si cambian sus inputs). */
    private _serieCache: { valores: any; series: SerieGrafica[] } | null = null;
    get serieGrafica(): SerieGrafica[] {
        const valores = this.serieActual.valores;
        if (this._serieCache?.valores !== valores) {
            this._serieCache = { valores, series: [{ label: this.data?.titulo || 'Valor', data: valores, relleno: true }] };
        }
        return this._serieCache.series;
    }

    get desglose(): Array<{ etiqueta: string; valor: number; unidad?: string; semaforo?: string }> {
        const d = this.data?.desglose;
        return Array.isArray(d) ? d.filter((x: any) => x && x.etiqueta !== undefined) : [];
    }

    anchoDesglose(valor: number): number {
        const max = Math.max(...this.desglose.map((d) => Math.abs(Number(d.valor) || 0)), 0);
        return max > 0 ? Math.round((Math.abs(Number(valor) || 0) / max) * 100) : 0;
    }

    get esSimulado(): boolean {
        const d = this.data || {};
        return !!(d.simulado || d.origen?.simulado || /SIMULADO/i.test(String(d.subtitulo || '')));
    }

    exportarDesglose(): void {
        exportarCsv(this.data?.titulo || 'kpi', [{ campo: 'etiqueta', titulo: 'Concepto' }, { campo: 'valor', titulo: 'Valor' }], this.desglose);
    }
}
