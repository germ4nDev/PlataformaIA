/* eslint-disable @typescript-eslint/no-explicit-any */
/*
    Author: German Valencia
    Component: PORTTOS Smart Widget - Temperatura Criogénica (Sparkline Invertido)
*/
import { Component, OnInit, OnChanges, SimpleChanges, OnDestroy, ViewChild, ElementRef, AfterViewInit, Input, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { WidgetShellComponent } from 'src/app/theme/shared/components/widget-shell/widget-shell.component';
import { DashboardService } from 'src/app/theme/shared/service/tablero-control/dashboard.service';
import { GnlStateService, ITelemetriaGNL } from 'src/app/theme/shared/service/tablero-control/gnl-state.service';

Chart.register(...registerables);

@Component({
    selector: 'app-gnl-temp-sparkline-widget',
    standalone: true,
    imports: [CommonModule, DecimalPipe, WidgetShellComponent],
    templateUrl: './gnl-temp-sparkline-widget.component.html',
    styleUrls: ['./gnl-temp-sparkline-widget.component.scss']
})
export class GnlTempSparklineWidgetComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy {
    @Input() widgetConfig: any;
    @Input() isEnfoque: boolean = false;
    @Input() datosVivos: any;

    @ViewChild('tempCanvas') tempCanvas!: ElementRef<HTMLCanvasElement>;

    public chart!: Chart;
    public tempActual: number = 0;
    public limiteOperativo: number = -150.0;
    public cargando: boolean = true;

    private readonly MAX_DATA_POINTS = 60;
    private historialLabels: string[] = [];
    private historialValores: number[] = [];
    private vistaLista: boolean = false;
    private readonly destroy$ = new Subject<void>();
    public ultimoBrazo: string = 'TODOS LOS BRAZOS';

    /** Origen del dato (telemetría simulada o real) para la vista ampliada. */
    public get origen$() {
        return this._gnlState.origen$;
    }

    constructor(
        private _gnlState: GnlStateService,
        private _torreService: DashboardService,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit(): void {
        // 🟢 1. ESCUCHAMOS EL CAMBIO DE BRAZO PARA BORRAR LA PANTALLA
        this._gnlState.brazoSeleccionado$
            .pipe(takeUntil(this.destroy$))
            .subscribe((nuevoBrazo: string) => {
                if (nuevoBrazo && this.ultimoBrazo !== nuevoBrazo) {
                    this.ultimoBrazo = nuevoBrazo;
                    this.limpiarLienzo();
                }
            });

        // 2. Escuchamos la telemetría (Esto ya lo tienes)
        this._gnlState.telemetriaFiltrada$
            .pipe(takeUntil(this.destroy$))
            .subscribe((pulso: ITelemetriaGNL | null) => {
                if (pulso) this.procesarTelemetria(pulso);
            });
    }

    ngAfterViewInit(): void {
        this.vistaLista = true;
        this.crearGraficoVacio();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['isEnfoque'] && !changes['isEnfoque'].firstChange) {
            setTimeout(() => this.chart?.resize(), 60);
        }
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
        if (this.chart) this.chart.destroy();
    }

    private procesarTelemetria(telemetria: any): void {
        const temp = Number(telemetria.temp_ducto ?? telemetria.temperatura ?? telemetria.temperatura_c ?? 0);
        const timestamp = telemetria.timestamp || new Date().toISOString();

        this.tempActual = temp;

        this.ultimoBrazo = telemetria.esConsolidado ? 'TODOS' : (telemetria.codigo_segmento || 'GENERAL');

        // 🟢 MAGIA SCADA: Pre-llenado si el arreglo está vacío
        if (this.historialValores.length === 0 && temp !== 0) {
            const fechaActual = new Date(timestamp);
            for (let i = this.MAX_DATA_POINTS; i > 0; i--) {
                const tiempoAtras = new Date(fechaActual.getTime() - (i * 2000));
                this.historialLabels.push(tiempoAtras.toLocaleTimeString());
                this.historialValores.push(Number(temp.toFixed(2)));
            }
        }

        this.actualizarGraficoEnVivo(temp, timestamp);
        this.cargando = false;
        this.cdr.detectChanges();
    }

    private crearGraficoVacio(): void {
        if (!this.tempCanvas?.nativeElement) return;
        const ctx = this.tempCanvas.nativeElement.getContext('2d');
        if (!ctx) return;

        const config: ChartConfiguration = {
            type: 'line',
            data: {
                labels: [],
                datasets: [
                    {
                        label: 'Temperatura °C',
                        data: [],
                        borderColor: '#00d4ff',
                        borderWidth: 3,
                        pointRadius: 0,

                        // 🟢 TAMAÑO DEL PUNTO AL PASAR EL MOUSE (Fundamental para el Tooltip)
                        pointHoverRadius: 6,
                        pointHitRadius: 15,
                        pointHoverBackgroundColor: '#ffffff',
                        pointHoverBorderColor: '#00d4ff',
                        pointHoverBorderWidth: 2,

                        fill: 'end',
                        tension: 0.2,

                        backgroundColor: (context: any) => {
                            const chart = context.chart;
                            const { ctx, chartArea } = chart;
                            if (!chartArea) return 'rgba(0, 212, 255, 0.1)';

                            const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
                            gradient.addColorStop(0, 'rgba(0, 212, 255, 0.5)');
                            gradient.addColorStop(0.8, 'rgba(0, 212, 255, 0.0)');
                            return gradient;
                        }
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: { duration: 0 },

                // 🟢 ACTIVAMOS LA INTERACCIÓN HORIZONTAL PARA EL MOUSE
                interaction: {
                    mode: 'index',
                    intersect: false
                },

                plugins: {
                    legend: { display: false },

                    // 🟢 CONFIGURACIÓN DEL TOOLTIP
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
                            label: (ctx) => `Temp: ${ctx.parsed.y} °C`
                        }
                    }
                },
                layout: { padding: { left: -10, right: -10, top: 0, bottom: -10 } },
                scales: {
                    x: { display: false },
                    y: { display: false }
                }
            }
        };

        this.chart = new Chart(ctx, config);
    }

    private actualizarGraficoEnVivo(nuevoValor: number, timestamp: string): void {
        const parsedDate = new Date(timestamp);
        const etiquetaHora = !isNaN(parsedDate.getTime()) ? parsedDate.toLocaleTimeString() : String(timestamp);
        const ultimaEtiqueta = this.historialLabels.length > 0 ? this.historialLabels[this.historialLabels.length - 1] : '';

        // Anti-rampa
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

            // 🟢 AUTO-ZOOM (Electrocardiograma)
            if (this.historialValores.length > 1 && this.chart.options.scales && this.chart.options.scales['y']) {
                const minData = Math.min(...this.historialValores);
                const maxData = Math.max(...this.historialValores);
                const margen = Math.abs(maxData - minData) * 0.15;
                const safeMargin = margen === 0 ? 0.5 : margen;

                this.chart.options.scales['y'].min = minData - safeMargin;
                this.chart.options.scales['y'].max = maxData + safeMargin;
            }

            this.chart.update('none');
        }
    }

    private limpiarLienzo(): void {
        this.tempActual = 0;
        this.historialLabels = [];
        this.historialValores = [];
        this.cargando = true; // 🟢 Mostramos el spinner mientras llega el primer pulso del nuevo brazo

        if (this.chart) {
            this.chart.destroy();
        }

        this.crearGraficoVacio();
        this.cdr.detectChanges();
    }

    public maximizarDesdeShell(): void {
        if (this.isEnfoque) this._torreService.cerrarModoEnfoque();
        else this._torreService.abrirModoEnfoque(this.widgetConfig?.type || 'PTT_GNL_CHART_SPK_TEMP', { ...(this.widgetConfig || {}) });
    }
}
