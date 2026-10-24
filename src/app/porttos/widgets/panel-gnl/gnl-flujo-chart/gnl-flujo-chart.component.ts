/* eslint-disable @typescript-eslint/no-explicit-any */
/*
    Author: German Valencia
    Component: PORTTOS Smart Widget - GNL Flujo Chart (Consumo Autónomo SCADA CSV / WebSocket)
*/
import {
    Component,
    OnInit,
    OnChanges,
    SimpleChanges,
    OnDestroy,
    ViewChild,
    ElementRef,
    AfterViewInit,
    Input,
    ChangeDetectorRef
} from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { WidgetShellComponent } from 'src/app/theme/shared/components/widget-shell/widget-shell.component';
import { DashboardService } from 'src/app/theme/shared/service/tablero-control/dashboard.service';
import { GnlStateService, ITelemetriaGNL } from 'src/app/theme/shared/service/tablero-control/gnl-state.service';
import { GnlHistorialService, HistorialGnl } from 'src/app/theme/shared/service/tablero-control/gnl-historial.service';
import { GraficaTclComponent, SerieGrafica } from '../../shared/grafica-tcl/grafica-tcl.component';
import { RangoTclComponent } from '../../shared/rango-tcl/rango-tcl.component';
import { ColumnaTabla, TablaTclComponent } from '../../shared/tabla-tcl/tabla-tcl.component';

Chart.register(...registerables);

@Component({
    selector: 'app-gnl-flujo-chart',
    standalone: true,
    imports: [CommonModule, DecimalPipe, WidgetShellComponent, GraficaTclComponent, RangoTclComponent, TablaTclComponent],
    templateUrl: './gnl-flujo-chart.component.html',
    styleUrls: ['./gnl-flujo-chart.component.scss']
})
export class GnlFlujoChartComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy {
    @Input() widgetConfig: any;
    @Input() isEnfoque: boolean = false;
    @Input() mostrarTabla: boolean = false;
    @Input() datosVivos: any;

    @ViewChild('flowCanvas') flowCanvas!: ElementRef<HTMLCanvasElement>;

    public chart!: Chart;
    public energiaTotal: number = 0;

    // 🟢 ESTA ES LA VARIABLE QUE SE MUESTRA EN EL HTML COMO "TODOS" O "BRAZO-X"
    public ultimoBrazo: string = 'TODOS';
    public tieneTelemetria: boolean = false;

    private readonly MAX_DATA_POINTS = 60; // 🟢 Buffer ágil
    private historialLabels: string[] = [];
    private historialValores: number[] = [];
    private vistaLista: boolean = false;
    private readonly destroy$ = new Subject<void>();

    public ultimoFlujoConocido: number = 0;
    private tickerInterval: any;

    /** Origen del dato (telemetría simulada o real) para la vista ampliada. */
    public get origen$() {
        return this._gnlState.origen$;
    }

    // ---------------------------------------------------------------- vista ampliada (Fase 3)
    /** Historial consolidado (cada 5 min en TCL_OperacionesFlujoGNL) agrupado por hora. */
    public horas: 24 | 72 | 168 = 24;
    public historial: HistorialGnl | null = null;
    public cargandoHistorial = false;
    public notaHistorial: string | null = null;
    public seriesHistorial: SerieGrafica[] = [];
    public filasBrazos: any[] = [];
    public resumenHistorial: { volumen: number; energia: number; presion: number | null; alarmas: number } | null = null;
    public readonly columnasBrazos: ColumnaTabla[] = [
        { campo: 'brazo', titulo: 'Brazo', tipo: 'principal' },
        { campo: 'volumenM3', titulo: 'Volumen', tipo: 'numero', decimales: 1, unidad: 'm³' },
        { campo: 'energiaMmbtu', titulo: 'Energía', tipo: 'numero', decimales: 1, unidad: 'MMBTU' },
        { campo: 'participacion', titulo: 'Participación', tipo: 'avance' },
        { campo: 'horasConFlujo', titulo: 'Horas con flujo', tipo: 'numero', decimales: 0 }
    ];

    constructor(
        private _gnlHistorial: GnlHistorialService,
        private _gnlState: GnlStateService,
        private _torreService: DashboardService,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit(): void {
        if (this.datosVivos) {
            this.hidratarDesdeEnfoque(this.datosVivos);
        }

        // Suscripción a cambios forzados de brazo desde el servicio maestro
        this._gnlState.brazoSeleccionado$
            .pipe(takeUntil(this.destroy$))
            .subscribe((nuevoBrazo: string) => {
                if (nuevoBrazo && this.ultimoBrazo !== nuevoBrazo) {
                    this.ultimoBrazo = nuevoBrazo;
                    this.limpiarLienzo();
                }
            });

        // Suscripción al flujo constante de telemetría
        this._gnlState.telemetriaFiltrada$
            .pipe(takeUntil(this.destroy$))
            .subscribe((pulso: ITelemetriaGNL | null) => {
                if (pulso) {
                    this.procesarTelemetria(pulso);
                }
            });

        // 🟢 PRENDEMOS EL MOTOR GRÁFICO
        this.iniciarMotorGrafico();

        if (this.isEnfoque) this.cargarHistorial();
    }

    cambiarHoras(h: 24 | 72 | 168): void {
        this.horas = h;
        this.cargarHistorial();
    }

    /** Historial por hora del puerto: volumen (apilado por brazo), energía, presión y alarmas. */
    private cargarHistorial(): void {
        const puerto = this.widgetConfig?.puerto || this.widgetConfig?.data?.puerto || 'BUENAVENTURA';
        this.cargandoHistorial = true;
        this._gnlHistorial.historial(puerto, this.horas)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (h) => {
                    this.historial = h;
                    this.armarHistorial(h);
                    this.cargandoHistorial = false;
                    this.cdr.detectChanges();
                },
                error: (e: any) => {
                    this.historial = null;
                    this.seriesHistorial = [];
                    this.filasBrazos = [];
                    this.resumenHistorial = null;
                    this.notaHistorial = e?.error?.msg || 'No se pudo consultar el historial de GNL';
                    this.cargandoHistorial = false;
                    this.cdr.detectChanges();
                }
            });
    }

    private armarHistorial(h: HistorialGnl): void {
        const suma = (xs: Array<number | null>) => xs.reduce<number>((a, v) => a + (Number(v) || 0), 0);
        const brazos = h.porBrazo || [];
        this.seriesHistorial = brazos.length > 1
            ? brazos.map((b) => ({ label: b.brazo, data: b.volumenM3 }))
            : [{ label: 'Volumen', data: h.volumenM3 || [] }];

        const volumen = suma(h.volumenM3 || []);
        const presiones = (h.presionPsi || []).filter((v): v is number => v !== null && v !== undefined);
        this.resumenHistorial = {
            volumen,
            energia: suma(h.energiaMmbtu || []),
            presion: presiones.length ? presiones.reduce((a, v) => a + v, 0) / presiones.length : null,
            alarmas: suma(h.alarmas || [])
        };
        this.filasBrazos = brazos.map((b) => ({
            id: b.brazo,
            brazo: b.brazo,
            volumenM3: b.total,
            energiaMmbtu: b.total * 22.4, // misma regla del consolidado (MMBTU_POR_M3)
            participacion: volumen > 0 ? Math.round((b.total / volumen) * 1000) / 10 : 0,
            horasConFlujo: (b.volumenM3 || []).filter((v) => Number(v) > 0).length
        }));
        this.notaHistorial = h.filas
            ? null
            : 'Sin consolidados en el periodo. El historial se arma con los consolidados de 5 minutos desde que se activó; la gráfica en vivo de arriba sigue mostrando el SCADA.';
    }

    ngAfterViewInit(): void {
        this.vistaLista = true;
        this.crearGraficoVacio();

        if (this.historialValores.length > 0 && this.chart) {
            this.chart.data.labels = [...this.historialLabels];
            this.chart.data.datasets[0].data = [...this.historialValores];
            this.chart.update('none');
        }
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['isEnfoque'] && !changes['isEnfoque'].isFirstChange()) {
            setTimeout(() => {
                this.chart?.resize();
            }, 60);
        }

        if (changes['datosVivos'] && this.datosVivos) {
            if (Array.isArray(this.datosVivos.historialValores)) {
                this.hidratarDesdeEnfoque(this.datosVivos);
            } else if (this.datosVivos.flujo_m3 !== undefined || this.datosVivos.flow_rate !== undefined) {
                this.procesarTelemetria(this.datosVivos);
            }
        }
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();

        // 🟢 APAGAMOS EL MOTOR AL CERRAR EL WIDGET
        if (this.tickerInterval) {
            clearInterval(this.tickerInterval);
        }

        if (this.chart) this.chart.destroy();
    }

    get data(): any {
        return {
            ...(this.widgetConfig?.data || {}),
            titulo: this.widgetConfig?.tituloWidget || this.widgetConfig?.data?.titulo || 'Histórico de Flujo (m³/h)',
            subtitulo:
                this.widgetConfig?.descripcionWidget ||
                this.widgetConfig?.data?.subtitulo ||
                'Caudal de GNL en tiempo real (SCADA)',
            historialLabels: [...this.historialLabels],
            historialValores: [...this.historialValores],
            energiaTotal: this.energiaTotal,
            ultimoBrazo: this.ultimoBrazo
        };
    }

    get cargando(): boolean {
        return !this.tieneTelemetria;
    }

    private hidratarDesdeEnfoque(snapshot: any): void {
        if (Array.isArray(snapshot.historialLabels) && Array.isArray(snapshot.historialValores)) {
            this.historialLabels = [...snapshot.historialLabels];
            this.historialValores = [...snapshot.historialValores];
            this.energiaTotal = Number(snapshot.energiaTotal || 0);
            this.ultimoBrazo = snapshot.ultimoBrazo || 'TODOS';
            this.tieneTelemetria = this.historialValores.length > 0;

            if (this.vistaLista && this.chart) {
                this.chart.data.labels = [...this.historialLabels];
                this.chart.data.datasets[0].data = [...this.historialValores];
                this.chart.update('none');
            }
            this.cdr.detectChanges();
        } else if (snapshot.flujo_m3 !== undefined || snapshot.flow_rate !== undefined) {
            this.procesarTelemetria(snapshot);
        }
    }

    private iniciarMotorGrafico(): void {
        this.tickerInterval = setInterval(() => {
            // Solo avanza si ya llegó el primer dato del brazo actual
            if (!this.tieneTelemetria) return;

            this.avanzarGrafico();
        }, 2000); // 2000ms = 2 segundos. Con MAX_DATA_POINTS=60, ves 2 minutos de historia.
    }

    private procesarTelemetria(datosTelemetria: any): void {
        if (!datosTelemetria) return;

        const brazoActual = String(
            datosTelemetria.codigo_segmento ??
            (datosTelemetria.segment_id !== undefined ? `SEG-${datosTelemetria.segment_id}` : 'TODOS')
        );

        if (this.ultimoBrazo !== brazoActual && this.ultimoBrazo !== '') {
            this.limpiarLienzo();
        }

        this.ultimoBrazo = brazoActual;

        // 🟢 Actualizamos el valor maestro, el Motor Gráfico se encargará de dibujarlo
        const flujo = Number(datosTelemetria.flujo_total_m3 ?? datosTelemetria.flujo_m3 ?? datosTelemetria.flow_rate ?? 0);
        this.ultimoFlujoConocido = Number(flujo.toFixed(2));

        // Pre-llenado instantáneo cuando llega el PRIMER pulso de un brazo
        if (!this.tieneTelemetria) {
            const fechaActual = new Date();
            for (let i = this.MAX_DATA_POINTS; i > 0; i--) {
                const tiempoAtras = new Date(fechaActual.getTime() - (i * 2000));
                this.historialLabels.push(tiempoAtras.toLocaleTimeString());
                this.historialValores.push(this.ultimoFlujoConocido);
            }
            this.tieneTelemetria = true;
        }

        // Cálculos de energía
        if (datosTelemetria.energy_consumption !== undefined && datosTelemetria.esConsolidado) {
            this.energiaTotal = Number(datosTelemetria.energy_consumption);
        } else if (datosTelemetria.energia !== undefined) {
            this.energiaTotal = Number(datosTelemetria.energia);
        } else {
            this.energiaTotal = (flujo * 22.4) / 3600;
        }

        this.cdr.detectChanges();
    }

    private avanzarGrafico(): void {
        // Tomamos la hora exacta de este segundo
        const etiquetaHora = new Date().toLocaleTimeString();

        // Inyectamos la hora y el último valor conocido
        this.historialLabels.push(etiquetaHora);
        this.historialValores.push(this.ultimoFlujoConocido);

        // Desplazamos la cola para mantener el tamaño del array
        if (this.historialLabels.length > this.MAX_DATA_POINTS) {
            this.historialLabels.shift();
            this.historialValores.shift();
        }

        if (this.vistaLista && this.chart) {
            this.chart.data.labels = [...this.historialLabels];
            this.chart.data.datasets[0].data = [...this.historialValores];

            // 🟢 AUTO-ZOOM
            if (this.historialValores.length > 1 && this.chart.options.scales && this.chart.options.scales['y']) {
                const minData = Math.min(...this.historialValores);
                const maxData = Math.max(...this.historialValores);
                const margen = (maxData - minData) * 0.05;
                this.chart.options.scales['y'].min = minData - (margen === 0 ? 1 : margen);
                this.chart.options.scales['y'].max = maxData + (margen === 0 ? 1 : margen);
            }

            this.chart.update('none');
        }
    }

    private limpiarLienzo(): void {
        this.energiaTotal = 0;
        this.historialLabels = [];
        this.historialValores = [];
        this.tieneTelemetria = false;
        this.ultimoFlujoConocido = 0;

        if (this.chart) {
            this.chart.data.labels = [];
            this.chart.data.datasets[0].data = [];
            this.chart.update('none');
        }
        this.cdr.detectChanges();
    }

    private crearGraficoVacio(): void {
        if (!this.flowCanvas?.nativeElement) return;

        const ctx = this.flowCanvas.nativeElement.getContext('2d');
        if (!ctx) return;

        const grosorLinea = this.isEnfoque ? 4 : 2;
        const tamanoFuente = this.isEnfoque ? 14 : 10;
        const espaciadoTexto = this.isEnfoque ? 16 : 10;

        const config: ChartConfiguration = {
            type: 'line',
            data: {
                labels: [],
                datasets: [
                    {
                        label: 'Flujo',
                        data: [],
                        borderColor: '#00d4ff',
                        borderWidth: grosorLinea,
                        pointRadius: 0,

                        // 🟢 EFECTO HOVER DEL TOOLTIP
                        pointHoverRadius: 5,
                        pointHitRadius: 15,
                        pointHoverBackgroundColor: '#ffffff',
                        pointHoverBorderColor: '#00d4ff',
                        pointHoverBorderWidth: 2,

                        fill: true,
                        tension: 0.1, // 🟢 Serrucho para marcar picos más rectos

                        backgroundColor: (context: any) => {
                            const chart = context.chart;
                            const { ctx, chartArea } = chart;
                            if (!chartArea) return 'rgba(0, 212, 255, 0.2)';

                            const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
                            gradient.addColorStop(0, 'rgba(0, 212, 255, 0.6)');
                            gradient.addColorStop(1, 'rgba(0, 212, 255, 0.01)');
                            return gradient;
                        }
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: { duration: 0 },

                // 🟢 INTERACCIÓN AUTOMÁTICA DEL TOOLTIP
                interaction: {
                    mode: 'index',
                    intersect: false
                },

                plugins: {
                    legend: { display: false },

                    // 🟢 TOOLTIP ELEGANTE
                    tooltip: {
                        enabled: true,
                        backgroundColor: 'rgba(20, 20, 30, 0.9)',
                        titleColor: '#a1a5b7',
                        bodyColor: '#ffffff',
                        bodyFont: { weight: 'bold', size: 14 },
                        borderColor: 'rgba(255, 255, 255, 0.1)',
                        borderWidth: 1,
                        padding: 10,
                        displayColors: false,
                        callbacks: {
                            label: (context) => `Caudal: ${context.parsed.y} m³/h`
                        }
                    }
                },
                layout: { padding: { left: -10, right: 0, top: 20, bottom: 0 } },
                scales: {
                    x: { display: false },
                    y: {
                        position: 'left',
                        border: { display: false },
                        grid: { color: 'rgba(255, 255, 255, 0.05)', tickLength: 0 },
                        ticks: { color: '#a1a5b7', font: { size: tamanoFuente }, padding: espaciadoTexto }
                    }
                }
            }
        };

        this.chart = new Chart(ctx, config);
    }

    private actualizarGraficoEnVivo(nuevoValor: number): void {
        const etiquetaHora = new Date().toLocaleTimeString();
        const ultimaEtiqueta = this.historialLabels.length > 0 ? this.historialLabels[this.historialLabels.length - 1] : '';

        // Si llegan varios pulsos en el MISMO segundo local, actualizamos la punta. Si no, avanza hacia la derecha.
        if (etiquetaHora === ultimaEtiqueta && this.historialValores.length > 0) {
            this.historialValores[this.historialValores.length - 1] = Number(nuevoValor.toFixed(2));
        } else {
            this.historialLabels.push(etiquetaHora);
            this.historialValores.push(Number(nuevoValor.toFixed(2)));
        }

        if (this.historialLabels.length > this.MAX_DATA_POINTS) {
            this.historialLabels.shift();
            this.historialValores.shift();
        }

        if (this.vistaLista && this.chart) {
            this.chart.data.labels = [...this.historialLabels];
            this.chart.data.datasets[0].data = [...this.historialValores];

            if (this.historialValores.length > 1 && this.chart.options.scales && this.chart.options.scales['y']) {
                const minData = Math.min(...this.historialValores);
                const maxData = Math.max(...this.historialValores);
                const margen = (maxData - minData) * 0.05;
                this.chart.options.scales['y'].min = minData - (margen === 0 ? 1 : margen);
                this.chart.options.scales['y'].max = maxData + (margen === 0 ? 1 : margen);
            }

            this.chart.update('none');
        }
    }

    public maximizarDesdeShell(): void {
        if (this.isEnfoque) {
            this._torreService.cerrarModoEnfoque();
        } else {
            // La foto actual va como datosVivos: el modal es otra instancia y antes se abría vacío
            this._torreService.abrirModoEnfoque(
                this.widgetConfig?.type || 'PTT_GNL_LINECHART_FLUJO',
                { ...this.data, puerto: this.widgetConfig?.puerto, datosVivos: this.data }
            );
        }
    }
}
