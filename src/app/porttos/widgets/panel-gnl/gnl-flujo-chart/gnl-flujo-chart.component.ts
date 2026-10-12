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

Chart.register(...registerables);

@Component({
    selector: 'app-gnl-flujo-chart',
    standalone: true,
    imports: [CommonModule, DecimalPipe, WidgetShellComponent],
    templateUrl: './gnl-flujo-chart.component.html',
    styleUrls: ['./gnl-flujo-chart.component.scss']
})
export class GnlFlujoChartComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy {
    @Input() widgetConfig: any;
    @Input() isEnfoque: boolean = false;
    @Input() mostrarTabla: boolean = false;

    // Respaldo para hidratar el historial cuando se abre en el modal de Modo Enfoque
    @Input() datosVivos: any;

    @ViewChild('flowCanvas') flowCanvas!: ElementRef<HTMLCanvasElement>;

    public chart!: Chart;
    public energiaTotal: number = 0;
    public ultimoBrazo: string = 'TODOS';
    public tieneTelemetria: boolean = false;

    private readonly MAX_DATA_POINTS = 50;
    private historialLabels: string[] = [];
    private historialValores: number[] = [];
    private vistaLista: boolean = false;
    private readonly destroy$ = new Subject<void>();

    constructor(
        private _gnlState: GnlStateService,
        private _torreService: DashboardService,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit(): void {
        // 1. Si se abre en el modal de Modo Enfoque, restauramos la serie acumulada
        if (this.datosVivos) {
            this.hidratarDesdeEnfoque(this.datosVivos);
        }

        // 2. Escuchamos cambios en el filtro de segmento/brazo (SEG-1..SEG-50 o TODOS)
        this._gnlState.brazoSeleccionado$
            .pipe(takeUntil(this.destroy$))
            .subscribe((nuevoBrazo: string) => {
                if (nuevoBrazo && this.ultimoBrazo !== nuevoBrazo) {
                    this.ultimoBrazo = nuevoBrazo;
                    this.limpiarLienzo();
                }
            });

        // 3. Suscripción autónoma al flujo de telemetría de scada_pipeline.csv
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
        this.crearGraficoVacio();

        // Si ya había lecturas en el buffer (por BehaviorSubject o Modo Enfoque), las dibujamos de inmediato
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
        if (this.chart) {
            this.chart.destroy();
        }
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

    /**
     * Procesa cada pulso de telemetría (soporta tanto flujo_m3 como flow_rate de scada_pipeline.csv)
     */
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
        this.tieneTelemetria = true;

        const flujo = Number(datosTelemetria.flujo_m3 ?? datosTelemetria.flow_rate ?? 0);
        const timestamp = datosTelemetria.timestamp || new Date().toISOString();

        this.actualizarGraficoEnVivo(flujo, timestamp);

        // Si el CSV trae energy_consumption lo usamos; de lo contrario calculamos por caudal
        const deltaEnergia =
            datosTelemetria.energy_consumption !== undefined
                ? Number(datosTelemetria.energy_consumption) / 60
                : (flujo * 22.4) / 3600;

        this.energiaTotal += deltaEnergia;
        this.cdr.detectChanges();
    }

    private limpiarLienzo(): void {
        this.energiaTotal = 0;
        this.historialLabels = [];
        this.historialValores = [];

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

        const altoGradiente = this.isEnfoque ? 1000 : 400;
        const gradient = ctx.createLinearGradient(0, 0, 0, altoGradiente);
        gradient.addColorStop(0, 'rgba(0, 127, 255, 0.7)');
        gradient.addColorStop(1, 'rgba(0, 127, 255, 0.1)');

        const grosorLinea = this.isEnfoque ? 5 : 3;
        const tamanoFuente = this.isEnfoque ? 14 : 10;
        const espaciadoTexto = this.isEnfoque ? 16 : 10;

        const config: ChartConfiguration = {
            type: 'line',
            data: {
                labels: [],
                datasets: [
                    {
                        label: 'Flujo m³/h',
                        data: [],
                        borderColor: '#007FFF',
                        backgroundColor: gradient,
                        borderWidth: grosorLinea,
                        pointRadius: 0,
                        fill: true,
                        tension: 0.4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: { duration: 0 },
                plugins: { legend: { display: false } },
                layout: { padding: { left: -10, right: 0, top: 20, bottom: 0 } },
                scales: {
                    x: { display: false },
                    y: {
                        position: 'left',
                        border: { display: false },
                        grid: { color: 'rgba(161, 165, 183, 0.1)', tickLength: 0 },
                        ticks: { color: '#a1a5b7', font: { size: tamanoFuente }, padding: espaciadoTexto },
                        min: 0,
                        suggestedMax: 10 // Calibrado para flow_rate de scada_pipeline.csv (1.01 - 7.53)
                    }
                }
            }
        };

        this.chart = new Chart(ctx, config);
    }

    private actualizarGraficoEnVivo(nuevoValor: number, timestamp: string): void {
        const parsedDate = new Date(timestamp);
        const etiquetaHora = !isNaN(parsedDate.getTime())
            ? parsedDate.toLocaleTimeString()
            : String(timestamp);

        this.historialLabels.push(etiquetaHora);
        this.historialValores.push(nuevoValor);

        if (this.historialLabels.length > this.MAX_DATA_POINTS) {
            this.historialLabels.shift();
            this.historialValores.shift();
        }

        if (this.vistaLista && this.chart) {
            this.chart.data.labels = [...this.historialLabels];
            this.chart.data.datasets[0].data = [...this.historialValores];
            this.chart.update('none');
        }
    }

    public maximizarDesdeShell(): void {
        if (this.isEnfoque) {
            this._torreService.cerrarModoEnfoque();
        } else {
            this._torreService.abrirModoEnfoque(
                this.widgetConfig?.type || 'PTT_GNL_LINECHART_FLUJO',
                this.data
            );
        }
    }
}
