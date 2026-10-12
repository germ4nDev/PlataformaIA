/* eslint-disable @typescript-eslint/no-explicit-any */
/*
    Author: German Valencia
    Component: PORTTOS Smart Widget - GNL Temp Sparkline Widget (Consumo Autónomo SCADA CSV)
*/
import {
    Component,
    OnInit,
    OnDestroy,
    ViewChild,
    ElementRef,
    AfterViewInit,
    Input,
    OnChanges,
    SimpleChanges,
    ChangeDetectorRef
} from '@angular/core';
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
    @Input() mostrarTabla: boolean = false;

    // Respaldo para hidratar el historial cuando se abre en el modal de Modo Enfoque
    @Input() datosVivos: any;

    @ViewChild('sparklineCanvas') sparklineCanvas!: ElementRef<HTMLCanvasElement>;

    public chart!: Chart;
    public tempActual: number = 32.1; // Media de temperature en scada_pipeline.csv
    public segmentoActivo: string = 'TODOS';
    public estadoCompresor: number = 1;
    public tieneTelemetria: boolean = false;

    private readonly MAX_POINTS = 30;
    private historialTemperaturas: number[] = [];
    private bufferInicializadoConDatosReales = false;
    private vistaLista = false;
    private readonly destroy$ = new Subject<void>();

    constructor(
        private _gnlState: GnlStateService,
        private _torreService: DashboardService,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit(): void {
        // 1. Si se abre desde el modal de Modo Enfoque, restauramos el historial exacto
        if (this.datosVivos) {
            this.hidratarDesdeEnfoque(this.datosVivos);
        }

        // 2. Escuchamos cambios de segmento/brazo en el Header de GNL para reiniciar la línea base
        this._gnlState.brazoSeleccionado$
            .pipe(takeUntil(this.destroy$))
            .subscribe((nuevoBrazo: string) => {
                if (nuevoBrazo && this.segmentoActivo !== nuevoBrazo) {
                    this.segmentoActivo = nuevoBrazo;
                    this.bufferInicializadoConDatosReales = false;
                    this.cdr.detectChanges();
                }
            });

        // 3. Suscripción autónoma al flujo reactivo de GnlStateService (scada_pipeline.csv)
        this._gnlState.telemetriaFiltrada$
            .pipe(takeUntil(this.destroy$))
            .subscribe((pulso: ITelemetriaGNL | null) => {
                if (pulso) {
                    this.procesarTelemetria(pulso);
                }
            });
    }

    ngAfterViewInit(): void {
        this.vistaLista = true;
        this.crearSparkline();
        this.sincronizarCanvas();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['isEnfoque'] && !changes['isEnfoque'].isFirstChange()) {
            setTimeout(() => {
                this.chart?.resize();
            }, 60);
        }

        if (changes['datosVivos'] && this.datosVivos) {
            this.hidratarDesdeEnfoque(this.datosVivos);
        }
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
        if (this.chart) {
            this.chart.destroy();
        }
    }

    get data(): any {
        return {
            ...(this.widgetConfig?.data || {}),
            titulo:
                this.widgetConfig?.tituloWidget ||
                this.widgetConfig?.data?.titulo ||
                (this.esRegimenCriogenico ? 'Temperatura Criogénica' : 'Temperatura en Ducto'),
            subtitulo:
                this.widgetConfig?.descripcionWidget ||
                this.widgetConfig?.data?.subtitulo ||
                'TENDENCIA TÉRMICA EN TIEMPO REAL',
            tempActual: this.tempActual,
            segmentoActivo: this.segmentoActivo,
            estadoCompresor: this.estadoCompresor,
            historial: [...this.historialTemperaturas]
        };
    }

    get cargando(): boolean {
        return !this.tieneTelemetria;
    }

    /**
     * Distingue automáticamente entre escala criogénica (< 0 °C) y escala de scada_pipeline.csv (25.92 °C - 38.52 °C)
     */
    get esRegimenCriogenico(): boolean {
        return this.tempActual < 0;
    }

    get textoLimiteOperativo(): string {
        return this.esRegimenCriogenico
            ? 'Límite operativo: -150.0 °C'
            : 'Rango normal SCADA: 26.0 °C – 35.5 °C';
    }

    get esTemperaturaCritica(): boolean {
        return this.esRegimenCriogenico ? this.tempActual > -150 : this.tempActual > 35.5;
    }

    get esTemperaturaAdvertencia(): boolean {
        return this.esRegimenCriogenico
            ? this.tempActual > -155 && this.tempActual <= -150
            : this.tempActual > 34.5 && this.tempActual <= 35.5;
    }

    private hidratarDesdeEnfoque(snapshot: any): void {
        if (Array.isArray(snapshot.historial) && snapshot.historial.length > 0) {
            this.historialTemperaturas = snapshot.historial.map((v: any) => Number(v));
            this.tempActual = Number(
                snapshot.tempActual ?? this.historialTemperaturas[this.historialTemperaturas.length - 1]
            );
            this.segmentoActivo = snapshot.segmentoActivo || this.segmentoActivo;
            this.estadoCompresor = Number(snapshot.estadoCompresor ?? 1);
            this.bufferInicializadoConDatosReales = true;
            this.tieneTelemetria = true;
            this.sincronizarCanvas();
            this.cdr.detectChanges();
        } else if (
            snapshot.temp_ducto !== undefined ||
            snapshot.temperature !== undefined ||
            snapshot.temperatura !== undefined ||
            snapshot.temperatura_celsius !== undefined ||
            snapshot.tempActual !== undefined
        ) {
            this.procesarTelemetria(snapshot);
        }
    }

    /**
     * Procesa cada pulso de telemetría homologando temp_ducto y temperature (de scada_pipeline.csv)
     */
    private procesarTelemetria(datosTelemetria: any): void {
        const candidata =
            datosTelemetria.temp_ducto ??
            datosTelemetria.temperature ??
            datosTelemetria.temperatura ??
            datosTelemetria.temperatura_celsius ??
            datosTelemetria.tempActual;

        if (candidata === undefined || candidata === null || isNaN(Number(candidata))) {
            return;
        }

        const nuevaTemp = Number(candidata);
        this.tempActual = nuevaTemp;
        this.segmentoActivo = String(
            datosTelemetria.codigo_segmento ??
            (datosTelemetria.segment_id !== undefined ? `SEG-${datosTelemetria.segment_id}` : this.segmentoActivo)
        );
        this.estadoCompresor = Number(datosTelemetria.compressor_state ?? this.estadoCompresor);
        this.tieneTelemetria = true;

        // Si es la primera lectura real del segmento, nivelamos los 30 puntos base al régimen real
        if (!this.bufferInicializadoConDatosReales || this.historialTemperaturas.length === 0) {
            this.historialTemperaturas = Array(this.MAX_POINTS).fill(nuevaTemp);
            this.bufferInicializadoConDatosReales = true;
        } else {
            this.historialTemperaturas.push(nuevaTemp);
            if (this.historialTemperaturas.length > this.MAX_POINTS) {
                this.historialTemperaturas.shift();
            }
        }

        this.sincronizarCanvas();
        this.cdr.detectChanges();
    }

    private sincronizarCanvas(): void {
        if (!this.vistaLista || !this.chart) return;

        if (this.historialTemperaturas.length === 0) {
            this.historialTemperaturas = Array(this.MAX_POINTS).fill(this.tempActual);
        }

        // Ajustamos dinámicamente los límites del eje Y según el régimen (Criogénico vs SCADA CSV 25-39 °C)
        const yScale = this.chart.options.scales?.['y'] as any;
        if (yScale) {
            if (this.esRegimenCriogenico) {
                yScale.min = -170;
                yScale.max = -145;
            } else {
                yScale.min = 24;
                yScale.max = 40;
            }
        }

        // Cambiamos el color del sparkline si entra en umbral de alerta
        const dataset = this.chart.data.datasets[0] as any;
        dataset.borderColor = this.esTemperaturaCritica
            ? '#ff5b6e'
            : this.esTemperaturaAdvertencia
                ? '#ffb547'
                : '#00e5ff';

        dataset.data = [...this.historialTemperaturas];
        this.chart.update('none');
    }

    private crearSparkline(): void {
        if (!this.sparklineCanvas?.nativeElement) return;
        const ctx = this.sparklineCanvas.nativeElement.getContext('2d');
        if (!ctx) return;

        const gradient = ctx.createLinearGradient(0, 0, 0, 80);
        gradient.addColorStop(0, 'rgba(0, 229, 255, 0.35)');
        gradient.addColorStop(1, 'rgba(0, 229, 255, 0.0)');

        const config: ChartConfiguration = {
            type: 'line',
            data: {
                labels: Array(this.MAX_POINTS).fill(''),
                datasets: [
                    {
                        data: [...this.historialTemperaturas],
                        borderColor: '#00e5ff',
                        backgroundColor: gradient,
                        fill: true,
                        borderWidth: 2,
                        pointRadius: 0,
                        tension: 0.4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: { duration: 0 },
                plugins: { legend: { display: false }, tooltip: { enabled: false } },
                layout: { padding: 0 },
                scales: {
                    x: { display: false },
                    y: {
                        display: false,
                        min: this.esRegimenCriogenico ? -170 : 24,
                        max: this.esRegimenCriogenico ? -145 : 40
                    }
                }
            }
        };

        this.chart = new Chart(ctx, config);
    }

    public maximizarDesdeShell(): void {
        if (this.isEnfoque) {
            this._torreService.cerrarModoEnfoque();
        } else {
            this._torreService.abrirModoEnfoque(
                this.widgetConfig?.type || 'PTT_GNL_CHART_SPK_TEMP',
                this.data
            );
        }
    }
}
