/* eslint-disable @typescript-eslint/no-explicit-any */
/*
    Author: German Valencia
    Pattern: PORTTOS Smart Widget - Retiros y Priorización de Contenedores
    Standard: PorttosChartHelper (Light & Dark Mode Ready)
*/
/* eslint-disable @typescript-eslint/no-explicit-any */
/*
    Author: German Valencia
    Pattern: PORTTOS Smart Widget - Retiros y Priorización de Contenedores
    Standard: PorttosChartHelper (Light & Dark Mode Ready)
*/
import {
    Component,
    Input,
    OnInit,
    AfterViewInit,
    OnChanges,
    OnDestroy,
    SimpleChanges,
    ViewChild,
    ElementRef,
    ChangeDetectorRef
} from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { Chart } from 'chart.js';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { WidgetShellComponent } from 'src/app/theme/shared/components/widget-shell/widget-shell.component';
import { ContenedoresService } from 'src/app/theme/shared/service/tablero-control/contenedores.service';
import { DashboardService } from 'src/app/theme/shared/service/tablero-control/dashboard.service';
import {
    PorttosChartHelper,
    IDatasetBarra
} from 'src/app/theme/shared/_helpers/chart.helper';

@Component({
    selector: 'app-chart-stacked-bar-cont',
    standalone: true,
    imports: [CommonModule, DecimalPipe, WidgetShellComponent],
    templateUrl: './chart-stacked-bar-cont.component.html',
    styleUrls: ['./chart-stacked-bar-cont.component.scss']
})
export class ChartStackedBarContComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy {
    @Input() widgetConfig: any;
    @Input() isEnfoque: boolean = false;
    @Input() mostrarTabla: boolean = false;
    @Input() datosVivos: any;

    @ViewChild('stackedBarContCanvas') stackedBarContCanvas!: ElementRef<HTMLCanvasElement>;

    public chart?: Chart;
    public cargando: boolean = true;
    public sinDatos: boolean = false;

    private labels: string[] = [];
    private datasets: IDatasetBarra[] = [];
    private vistaLista: boolean = false;
    private metadatosSQL: any = {};
    private readonly destroy$ = new Subject<void>();

    constructor(
        private _contenedoresService: ContenedoresService,
        private _torreService: DashboardService,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit(): void {
        this.cargarRetirosPriorizacion();
    }

    ngAfterViewInit(): void {
        this.vistaLista = true;
        this.renderizarGrafica(); // 🟢 Nombrado correctamente
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['isEnfoque'] && !changes['isEnfoque'].firstChange) {
            setTimeout(() => this.chart?.resize(), 60);
        }

        if (
            (changes['widgetConfig'] && !changes['widgetConfig'].firstChange) ||
            (changes['datosVivos'] && this.datosVivos)
        ) {
            this.cargarRetirosPriorizacion();
        }
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
        if (this.chart) {
            this.chart.destroy();
        }
    }

    private cargarRetirosPriorizacion(): void {
        if (this.datosVivos && (this.datosVivos.labels || this.datosVivos.categorias)) {
            this.procesarPayload(this.datosVivos);
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
            .obtenerDatosWidgetContenedores(codigoWidget, puerto)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (res: any) => this.procesarPayload(res),
                error: (err) => {
                    console.error('❌ [SmartWidget ChartStackedBarCont] Error:', err);
                    this.sinDatos = true;
                    this.cargando = false;
                    this.cdr.detectChanges();
                }
            });
    }

    private procesarPayload(raw: any): void {
        if (!raw) {
            this.sinDatos = true;
            this.cargando = false;
            this.cdr.detectChanges();
            return;
        }

        this.metadatosSQL = Array.isArray(raw) ? {} : raw;
        const nodo = raw.retirosPriorizacion || raw;

        this.labels = (nodo.labels || nodo.categorias || []).map((l: any) => String(l));

        if (Array.isArray(nodo.datasets) && nodo.datasets.length > 0) {
            this.datasets = nodo.datasets.map((ds: any, idx: number) => ({
                label: ds.label || `Serie ${idx + 1}`,
                data: (ds.data || []).map((v: any) => Number(v || 0)),
                color: ds.backgroundColor || ds.color || PorttosChartHelper.PALETA_DEFAULT[idx % PorttosChartHelper.PALETA_DEFAULT.length]
            }));
        } else if (Array.isArray(nodo.series) && nodo.series.length > 0) {
            this.datasets = nodo.series.map((s: any, idx: number) => ({
                label: s.name || s.label || `Serie ${idx + 1}`,
                data: (s.data || []).map((v: any) => Number(v || 0)),
                color: s.color || PorttosChartHelper.PALETA_DEFAULT[idx % PorttosChartHelper.PALETA_DEFAULT.length]
            }));
        } else {
            this.datasets = [];
        }

        const sumaTotal = this.datasets.reduce(
            (acc, ds) => acc + ds.data.reduce((s, v) => s + v, 0),
            0
        );

        this.sinDatos = this.labels.length === 0 || sumaTotal === 0;
        this.cargando = false;
        this.renderizarGrafica(); // 🟢 Llamado correctamente
        this.cdr.detectChanges();
    }

    private renderizarGrafica(): void {
        // 1. Corrección: Usamos stackedBarContCanvas (que es el nombre correcto del ViewChild)
        if (!this.vistaLista || this.sinDatos || !this.stackedBarContCanvas?.nativeElement) return;

        // Forzamos el ID de stack en los datasets (esto ayuda a que se apilen visualmente en un solo bloque)
        const datasetsApilados = this.datasets.map(ds => ({
            ...ds,
            stack: 'stack_retiros'
        }));

        this.chart = PorttosChartHelper.renderizarBarras(
            this.stackedBarContCanvas,
            this.chart,
            {
                labels: this.labels,
                datasets: datasetsApilados,
                unidad: ' Cont.',
                isEnfoque: this.isEnfoque
            }
        );

        // 2. 🟢 Corrección del tipado estricto de Chart.js usando "as any"
        if (this.chart && this.chart.options && this.chart.options.scales) {

            // Apilamos el eje X
            if (this.chart.options.scales['x']) {
                (this.chart.options.scales['x'] as any).stacked = true;
            }

            // Apilamos el eje Y
            if (this.chart.options.scales['y']) {
                (this.chart.options.scales['y'] as any).stacked = true;
            }

            // Actualizamos la instancia de Chart.js
            this.chart.update();
        }
    }

    get data(): any {
        return {
            ...(this.widgetConfig?.data || {}),
            ...this.metadatosSQL,
            labels: this.labels,
            datasets: this.datasets
        };
    }

    public maximizarDesdeShell(): void {
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
