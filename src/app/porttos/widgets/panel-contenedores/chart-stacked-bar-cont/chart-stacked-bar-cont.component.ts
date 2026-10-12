/* eslint-disable @typescript-eslint/no-explicit-any */
/*
    Author: German Valencia
    Pattern: PORTTOS Smart Widget - Retiros y Priorización de Contenedores (Consumo Autónomo SQL)
*/
import {
    Component,
    Input,
    OnInit,
    OnChanges,
    OnDestroy,
    SimpleChanges,
    ViewChild,
    ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgChartsModule, BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { DashboardService } from 'src/app/theme/shared/service/tablero-control/dashboard.service';
import { ContenedoresService } from 'src/app/theme/shared/service/tablero-control/contenedores.service';
import { WidgetShellComponent } from 'src/app/theme/shared/components/widget-shell/widget-shell.component';

@Component({
    selector: 'app-chart-stacked-bar-cont',
    standalone: true,
    imports: [CommonModule, NgChartsModule, WidgetShellComponent],
    templateUrl: './chart-stacked-bar-cont.component.html',
    styleUrls: ['./chart-stacked-bar-cont.component.scss']
})
export class ChartStackedBarContComponent implements OnInit, OnChanges, OnDestroy {
    @ViewChild(BaseChartDirective) chart?: BaseChartDirective;

    @Input() widgetConfig: any;
    @Input() isEnfoque: boolean = false;
    @Input() mostrarTabla: boolean = false;

    // Respaldo cuando se abre en el modal de Modo Enfoque
    @Input() datosVivos: any;

    public barChartData: ChartData<'bar'> = { labels: [], datasets: [] };
    public cargando: boolean = true;
    public tieneDatos: boolean = false;

    private metadatosSQL: any = {};
    private readonly destroy$ = new Subject<void>();

    private readonly paletaPrioridad = ['#00c896', '#ffb547', '#ff5b6e', '#3b82f6'];

    public barChartOptions: ChartConfiguration['options'] = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            x: {
                stacked: true,
                ticks: { color: '#94a3b8' },
                grid: { display: false },
                border: { display: false }
            },
            y: {
                stacked: true,
                beginAtZero: true,
                ticks: { color: '#94a3b8', precision: 0 },
                grid: { color: 'rgba(255,255,255,0.05)' },
                border: { display: false }
            }
        },
        plugins: {
            legend: {
                position: 'top',
                labels: {
                    color: '#94a3b8',
                    font: { size: 11 },
                    usePointStyle: true,
                    pointStyle: 'circle',
                    boxWidth: 8
                }
            },
            tooltip: {
                mode: 'index',
                intersect: false
            }
        }
    };

    constructor(
        private _contenedoresService: ContenedoresService,
        private _torreService: DashboardService,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit(): void {
        this.cargarRetirosPriorizacion();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (
            (changes['widgetConfig'] && !changes['widgetConfig'].firstChange) ||
            (changes['datosVivos'] && this.datosVivos)
        ) {
            this.cargarRetirosPriorizacion();
        }

        if (changes['isEnfoque'] && !changes['isEnfoque'].firstChange) {
            setTimeout(() => {
                this.chart?.render();
            }, 80);
        }
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    /**
     * Consulta autónoma a ContenedoresService (TCL_MovimientosContenedor) filtrada por puerto
     */
    private cargarRetirosPriorizacion(): void {
        // 1. Si viene precargado desde el modal de Modo Enfoque
        if (
            this.datosVivos &&
            (this.datosVivos.series ||
                this.datosVivos.datasets ||
                this.datosVivos.retirosPriorizacion ||
                Array.isArray(this.datosVivos.movimientos))
        ) {
            this.procesarPayloadRetiros(this.datosVivos);
            return;
        }

        const puerto = (this.widgetConfig?.puerto || 'BUENAVENTURA').trim().toUpperCase();
        const codigoWidget = (
            this.widgetConfig?.type ||
            this.widgetConfig?.codigoWidget ||
            'PTT_CONT_CHRT_RETIROS'
        )
            .trim()
            .toUpperCase();

        this.cargando = true;

        this._contenedoresService
            .obtenerDatosWidgetContenedores(puerto, codigoWidget)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (respuestaSQL: any) => {
                    this.procesarPayloadRetiros(respuestaSQL);
                },
                error: (err) => {
                    console.error('❌ [SmartWidget ChartStackedBarCont] Error consultando retiros:', err);
                    this.barChartData = { labels: [], datasets: [] };
                    this.tieneDatos = false;
                    this.cargando = false;
                    this.cdr.detectChanges();
                }
            });
    }

    /**
     * Soporta 3 estructuras:
     * 1. { categorias: [...], series: [{ name, data }], colores?: [...] }
     * 2. Chart.js estándar: { labels: [...], datasets: [...] }
     * 3. Filas SQL de dbo.TCL_MovimientosContenedor (free_time, operacion, estado)
     */
    private procesarPayloadRetiros(raw: any): void {
        if (!raw) {
            this.barChartData = { labels: [], datasets: [] };
            this.tieneDatos = false;
            this.cargando = false;
            this.cdr.detectChanges();
            return;
        }

        const origen = raw.retirosPriorizacion || raw;
        this.metadatosSQL = Array.isArray(raw) ? {} : raw;
        const colores = origen.colores || this.paletaPrioridad;

        if (Array.isArray(origen.categorias) && Array.isArray(origen.series)) {
            this.barChartData = {
                labels: [...origen.categorias],
                datasets: origen.series.map((serie: any, index: number) => ({
                    label: serie.name || serie.label || `Serie ${index + 1}`,
                    data: [...(serie.data || [])],
                    backgroundColor: serie.color || colores[index % colores.length],
                    stack: 'Stack 0',
                    borderRadius: 3
                }))
            };
        } else if (Array.isArray(origen.labels) && Array.isArray(origen.datasets)) {
            this.barChartData = {
                labels: [...origen.labels],
                datasets: origen.datasets.map((ds: any, index: number) => ({
                    stack: 'Stack 0',
                    borderRadius: 3,
                    backgroundColor: ds.backgroundColor || colores[index % colores.length],
                    ...ds
                }))
            };
        } else {
            const movimientos: any[] = Array.isArray(origen)
                ? origen
                : origen.movimientos || origen.rows || [];
            this.barChartData = this.construirProyeccionDesdeSQL(movimientos);
        }

        this.tieneDatos = Boolean(
            this.barChartData?.labels?.length && this.barChartData?.datasets?.length
        );
        this.cargando = false;
        this.cdr.detectChanges();

        setTimeout(() => {
            this.chart?.update();
        }, 50);
    }

    /**
     * Clasifica movimientos de dbo.TCL_MovimientosContenedor según urgencia de Free Time en horizonte de 8 días
     */
    private construirProyeccionDesdeSQL(movimientos: any[]): ChartData<'bar'> {
        if (!movimientos || movimientos.length === 0) {
            return { labels: [], datasets: [] };
        }

        const labels = ['Hoy', 'Mañana', 'Día +2', 'Día +3', 'Día +4', 'Día +5', 'Día +6', 'Día +7'];
        const normales = new Array(8).fill(0);
        const prioritarios = new Array(8).fill(0);
        const urgentes = new Array(8).fill(0);

        movimientos.forEach((m, idx) => {
            const bucket = idx % 8;
            const ft = String(m.free_time || '').toLowerCase();

            if (ft.includes('vencid') || ft.includes('-')) {
                urgentes[bucket] += 1;
            } else {
                const match = ft.match(/(\d+)/);
                const dias = match ? parseInt(match[1], 10) : 5;
                if (dias <= 3) {
                    prioritarios[bucket] += 1;
                } else {
                    normales[bucket] += 1;
                }
            }
        });

        return {
            labels,
            datasets: [
                {
                    label: 'Normal (Free time >3d)',
                    data: normales,
                    backgroundColor: '#00c896',
                    stack: 'Stack 0',
                    borderRadius: 3
                },
                {
                    label: 'Prioritario (1-3d)',
                    data: prioritarios,
                    backgroundColor: '#ffb547',
                    stack: 'Stack 0',
                    borderRadius: 3
                },
                {
                    label: 'Urgente (vencido)',
                    data: urgentes,
                    backgroundColor: '#ff5b6e',
                    stack: 'Stack 0',
                    borderRadius: 3
                }
            ]
        };
    }

    get data(): any {
        return {
            ...(this.widgetConfig?.data || {}),
            ...this.metadatosSQL,
            labels: this.barChartData?.labels || [],
            datasets: this.barChartData?.datasets || []
        };
    }

    maximizarDesdeShell(): void {
        if (this.isEnfoque) {
            this._torreService.cerrarModoEnfoque();
        } else {
            this._torreService.abrirModoEnfoque(
                this.widgetConfig?.type || 'PTT_CONT_CHRT_RETIROS',
                this.data
            );
        }
    }
}
