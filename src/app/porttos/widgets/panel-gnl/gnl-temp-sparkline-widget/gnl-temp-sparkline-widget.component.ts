// /* eslint-disable @typescript-eslint/no-explicit-any */
// /*
//     Author: German Valencia
//     Component: PORTTOS Smart Widget - GNL Temp Sparkline Widget (Consumo Autónomo SCADA CSV)
// */
// import {
//     Component,
//     OnInit,
//     OnDestroy,
//     ViewChild,
//     ElementRef,
//     AfterViewInit,
//     Input,
//     OnChanges,
//     SimpleChanges,
//     ChangeDetectorRef
// } from '@angular/core';
// import { CommonModule, DecimalPipe } from '@angular/common';
// import { Chart, ChartConfiguration, registerables } from 'chart.js';
// import { Subject } from 'rxjs';
// import { takeUntil } from 'rxjs/operators';

// import { WidgetShellComponent } from 'src/app/theme/shared/components/widget-shell/widget-shell.component';
// import { DashboardService } from 'src/app/theme/shared/service/tablero-control/dashboard.service';
// import { GnlStateService, ITelemetriaGNL } from 'src/app/theme/shared/service/tablero-control/gnl-state.service';

// Chart.register(...registerables);

// @Component({
//     selector: 'app-gnl-temp-sparkline-widget',
//     standalone: true,
//     imports: [CommonModule, DecimalPipe, WidgetShellComponent],
//     templateUrl: './gnl-temp-sparkline-widget.component.html',
//     styleUrls: ['./gnl-temp-sparkline-widget.component.scss']
// })
// export class GnlTempSparklineWidgetComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy {
//     @Input() widgetConfig: any;
//     @Input() isEnfoque: boolean = false;
//     @Input() mostrarTabla: boolean = false;

//     // Respaldo para hidratar el historial cuando se abre en el modal de Modo Enfoque
//     @Input() datosVivos: any;

//     @ViewChild('sparklineCanvas') sparklineCanvas!: ElementRef<HTMLCanvasElement>;

//     public chart!: Chart;
//     public tempActual: number = 32.1; // Media de temperature en scada_pipeline.csv
//     public segmentoActivo: string = 'TODOS';
//     public estadoCompresor: number = 1;
//     public tieneTelemetria: boolean = false;

//     private readonly MAX_POINTS = 30;
//     private historialTemperaturas: number[] = [];
//     private bufferInicializadoConDatosReales = false;
//     private vistaLista = false;
//     private readonly destroy$ = new Subject<void>();

//     constructor(
//         private _gnlState: GnlStateService,
//         private _torreService: DashboardService,
//         private cdr: ChangeDetectorRef
//     ) { }

//     ngOnInit(): void {
//         // 1. Si se abre desde el modal de Modo Enfoque, restauramos el historial exacto
//         if (this.datosVivos) {
//             this.hidratarDesdeEnfoque(this.datosVivos);
//         }

//         // 2. Escuchamos cambios de segmento/brazo en el Header de GNL para reiniciar la línea base
//         this._gnlState.brazoSeleccionado$
//             .pipe(takeUntil(this.destroy$))
//             .subscribe((nuevoBrazo: string) => {
//                 if (nuevoBrazo && this.segmentoActivo !== nuevoBrazo) {
//                     this.segmentoActivo = nuevoBrazo;
//                     this.bufferInicializadoConDatosReales = false;
//                     this.cdr.detectChanges();
//                 }
//             });

//         // 3. Suscripción autónoma al flujo reactivo de GnlStateService (scada_pipeline.csv)
//         this._gnlState.telemetriaFiltrada$
//             .pipe(takeUntil(this.destroy$))
//             .subscribe((pulso: ITelemetriaGNL | null) => {
//                 if (pulso) {
//                     this.procesarTelemetria(pulso);
//                 }
//             });
//     }

//     ngAfterViewInit(): void {
//         this.vistaLista = true;
//         this.crearSparkline();
//         this.sincronizarCanvas();
//     }

//     ngOnChanges(changes: SimpleChanges): void {
//         if (changes['isEnfoque'] && !changes['isEnfoque'].isFirstChange()) {
//             setTimeout(() => {
//                 this.chart?.resize();
//             }, 60);
//         }

//         if (changes['datosVivos'] && this.datosVivos) {
//             this.hidratarDesdeEnfoque(this.datosVivos);
//         }
//     }

//     ngOnDestroy(): void {
//         this.destroy$.next();
//         this.destroy$.complete();
//         if (this.chart) {
//             this.chart.destroy();
//         }
//     }

//     get data(): any {
//         return {
//             ...(this.widgetConfig?.data || {}),
//             titulo:
//                 this.widgetConfig?.tituloWidget ||
//                 this.widgetConfig?.data?.titulo ||
//                 (this.esRegimenCriogenico ? 'Temperatura Criogénica' : 'Temperatura en Ducto'),
//             subtitulo:
//                 this.widgetConfig?.descripcionWidget ||
//                 this.widgetConfig?.data?.subtitulo ||
//                 'TENDENCIA TÉRMICA EN TIEMPO REAL',
//             tempActual: this.tempActual,
//             segmentoActivo: this.segmentoActivo,
//             estadoCompresor: this.estadoCompresor,
//             historial: [...this.historialTemperaturas]
//         };
//     }

//     get cargando(): boolean {
//         return !this.tieneTelemetria;
//     }

//     /**
//      * Distingue automáticamente entre escala criogénica (< 0 °C) y escala de scada_pipeline.csv (25.92 °C - 38.52 °C)
//      */
//     get esRegimenCriogenico(): boolean {
//         return this.tempActual < 0;
//     }

//     get textoLimiteOperativo(): string {
//         return this.esRegimenCriogenico
//             ? 'Límite operativo: -150.0 °C'
//             : 'Rango normal SCADA: 26.0 °C – 35.5 °C';
//     }

//     get esTemperaturaCritica(): boolean {
//         return this.esRegimenCriogenico ? this.tempActual > -150 : this.tempActual > 35.5;
//     }

//     get esTemperaturaAdvertencia(): boolean {
//         return this.esRegimenCriogenico
//             ? this.tempActual > -155 && this.tempActual <= -150
//             : this.tempActual > 34.5 && this.tempActual <= 35.5;
//     }

//     private hidratarDesdeEnfoque(snapshot: any): void {
//         if (Array.isArray(snapshot.historial) && snapshot.historial.length > 0) {
//             this.historialTemperaturas = snapshot.historial.map((v: any) => Number(v));
//             this.tempActual = Number(
//                 snapshot.tempActual ?? this.historialTemperaturas[this.historialTemperaturas.length - 1]
//             );
//             this.segmentoActivo = snapshot.segmentoActivo || this.segmentoActivo;
//             this.estadoCompresor = Number(snapshot.estadoCompresor ?? 1);
//             this.bufferInicializadoConDatosReales = true;
//             this.tieneTelemetria = true;
//             this.sincronizarCanvas();
//             this.cdr.detectChanges();
//         } else if (
//             snapshot.temp_ducto !== undefined ||
//             snapshot.temperature !== undefined ||
//             snapshot.temperatura !== undefined ||
//             snapshot.temperatura_celsius !== undefined ||
//             snapshot.tempActual !== undefined
//         ) {
//             this.procesarTelemetria(snapshot);
//         }
//     }

//     /**
//      * Procesa cada pulso de telemetría homologando temp_ducto y temperature (de scada_pipeline.csv)
//      */
//     private procesarTelemetria(datosTelemetria: any): void {
//         const candidata =
//             datosTelemetria.temp_ducto ??
//             datosTelemetria.temperature ??
//             datosTelemetria.temperatura ??
//             datosTelemetria.temperatura_celsius ??
//             datosTelemetria.tempActual;

//         if (candidata === undefined || candidata === null || isNaN(Number(candidata))) {
//             return;
//         }

//         const nuevaTemp = Number(candidata);
//         this.tempActual = nuevaTemp;
//         this.segmentoActivo = String(
//             datosTelemetria.codigo_segmento ??
//             (datosTelemetria.segment_id !== undefined ? `SEG-${datosTelemetria.segment_id}` : this.segmentoActivo)
//         );
//         this.estadoCompresor = Number(datosTelemetria.compressor_state ?? this.estadoCompresor);
//         this.tieneTelemetria = true;

//         // Si es la primera lectura real del segmento, nivelamos los 30 puntos base al régimen real
//         if (!this.bufferInicializadoConDatosReales || this.historialTemperaturas.length === 0) {
//             this.historialTemperaturas = Array(this.MAX_POINTS).fill(nuevaTemp);
//             this.bufferInicializadoConDatosReales = true;
//         } else {
//             this.historialTemperaturas.push(nuevaTemp);
//             if (this.historialTemperaturas.length > this.MAX_POINTS) {
//                 this.historialTemperaturas.shift();
//             }
//         }

//         this.sincronizarCanvas();
//         this.cdr.detectChanges();
//     }

//     private sincronizarCanvas(): void {
//         if (!this.vistaLista || !this.chart) return;

//         if (this.historialTemperaturas.length === 0) {
//             this.historialTemperaturas = Array(this.MAX_POINTS).fill(this.tempActual);
//         }

//         // Ajustamos dinámicamente los límites del eje Y según el régimen (Criogénico vs SCADA CSV 25-39 °C)
//         const yScale = this.chart.options.scales?.['y'] as any;
//         if (yScale) {
//             if (this.esRegimenCriogenico) {
//                 yScale.min = -170;
//                 yScale.max = -145;
//             } else {
//                 yScale.min = 24;
//                 yScale.max = 40;
//             }
//         }

//         // Cambiamos el color del sparkline si entra en umbral de alerta
//         const dataset = this.chart.data.datasets[0] as any;
//         dataset.borderColor = this.esTemperaturaCritica
//             ? '#ff5b6e'
//             : this.esTemperaturaAdvertencia
//                 ? '#ffb547'
//                 : '#00e5ff';

//         dataset.data = [...this.historialTemperaturas];
//         this.chart.update('none');
//     }

//     private crearSparkline(): void {
//         if (!this.sparklineCanvas?.nativeElement) return;
//         const ctx = this.sparklineCanvas.nativeElement.getContext('2d');
//         if (!ctx) return;

//         const gradient = ctx.createLinearGradient(0, 0, 0, 80);
//         gradient.addColorStop(0, 'rgba(0, 229, 255, 0.35)');
//         gradient.addColorStop(1, 'rgba(0, 229, 255, 0.0)');

//         const config: ChartConfiguration = {
//             type: 'line',
//             data: {
//                 labels: Array(this.MAX_POINTS).fill(''),
//                 datasets: [
//                     {
//                         data: [...this.historialTemperaturas],
//                         borderColor: '#00e5ff',
//                         backgroundColor: gradient,
//                         fill: true,
//                         borderWidth: 2,
//                         pointRadius: 0,
//                         tension: 0.4
//                     }
//                 ]
//             },
//             options: {
//                 responsive: true,
//                 maintainAspectRatio: false,
//                 animation: { duration: 0 },
//                 plugins: { legend: { display: false }, tooltip: { enabled: false } },
//                 layout: { padding: 0 },
//                 scales: {
//                     x: { display: false },
//                     y: {
//                         display: false,
//                         min: this.esRegimenCriogenico ? -170 : 24,
//                         max: this.esRegimenCriogenico ? -145 : 40
//                     }
//                 }
//             }
//         };

//         this.chart = new Chart(ctx, config);
//     }

//     public maximizarDesdeShell(): void {
//         if (this.isEnfoque) {
//             this._torreService.cerrarModoEnfoque();
//         } else {
//             this._torreService.abrirModoEnfoque(
//                 this.widgetConfig?.type || 'PTT_GNL_CHART_SPK_TEMP',
//                 this.data
//             );
//         }
//     }
// }
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
        else this._torreService.abrirModoEnfoque(this.widgetConfig?.type || 'PTT_GNL_CHRT_SPK_TEMP', this.widgetConfig);
    }
}
