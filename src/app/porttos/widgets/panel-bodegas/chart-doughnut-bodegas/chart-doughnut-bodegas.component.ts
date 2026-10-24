/* eslint-disable @typescript-eslint/no-explicit-any */
/*
    Author: German Valencia
    Pattern: PORTTOS Smart Widget - Gráfica Dona Distribución por Tipo de Carga en Bodegas
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
import { BodegasService } from 'src/app/theme/shared/service/tablero-control/bodegas.service';
import { DashboardService } from 'src/app/theme/shared/service/tablero-control/dashboard.service';
import {
    PorttosChartHelper,
    ILeyendaDonaItem
} from 'src/app/theme/shared/_helpers/chart.helper';

@Component({
    selector: 'app-chart-doughnut-bodegas',
    standalone: true,
    imports: [CommonModule, DecimalPipe, WidgetShellComponent],
    templateUrl: './chart-doughnut-bodegas.component.html',
    styleUrls: ['./chart-doughnut-bodegas.component.scss']
})
export class ChartDoughnutBodegasComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy {
    @Input() widgetConfig: any;
    @Input() isEnfoque: boolean = false;
    @Input() mostrarTabla: boolean = false;
    @Input() datosVivos: any;

    @ViewChild('doughnutBodegasCanvas') doughnutBodegasCanvas!: ElementRef<HTMLCanvasElement>;

    public chart?: Chart;
    public cargando: boolean = true;
    public sinDatos: boolean = false;
    public totalInventarioTon: number = 0;
    public leyendaItems: ILeyendaDonaItem[] = [];

    private labels: string[] = [];
    private valores: number[] = [];
    private vistaLista: boolean = false;
    private metadatosSQL: any = {};
    private readonly destroy$ = new Subject<void>();

    constructor(
        private _bodegasService: BodegasService,
        private _torreService: DashboardService,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit(): void {
        this.cargarDistribucionCarga();
    }

    ngAfterViewInit(): void {
        this.vistaLista = true;
        this.renderizarDona();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['isEnfoque'] && !changes['isEnfoque'].isFirstChange()) {
            setTimeout(() => this.chart?.resize(), 60);
        }

        if (
            (changes['widgetConfig'] && !changes['widgetConfig'].firstChange) ||
            (changes['datosVivos'] && this.datosVivos)
        ) {
            this.cargarDistribucionCarga();
        }
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
        if (this.chart) {
            this.chart.destroy();
        }
    }

    private cargarDistribucionCarga(): void {
        if (this.datosVivos && (this.datosVivos.labels || this.datosVivos.valores)) {
            this.procesarPayloadDistribucion(this.datosVivos);
            return;
        }

        const puerto = (this.widgetConfig?.puerto || 'BUENAVENTURA').trim().toUpperCase();
        const codigoWidget = (
            this.widgetConfig?.type ||
            this.widgetConfig?.codigoWidget ||
            'PTT_BOD_CHRT_CARGA'
        )
            .trim()
            .toUpperCase();

        this.cargando = true;

        this._bodegasService
            .obtenerDatosWidgetBodegas(puerto, codigoWidget)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (respuestaSQL: any) => {
                    this.procesarPayloadDistribucion(respuestaSQL);
                },
                error: (err) => {
                    console.error('❌ [SmartWidget ChartDoughnutBodegas] Error:', err);
                    this.sinDatos = true;
                    this.cargando = false;
                    this.cdr.detectChanges();
                }
            });
    }

    private procesarPayloadDistribucion(raw: any): void {
        if (!raw) {
            this.sinDatos = true;
            this.cargando = false;
            this.cdr.detectChanges();
            return;
        }

        this.metadatosSQL = Array.isArray(raw) ? {} : raw;

        const etiquetas = raw.labels || raw.categorias || [];
        const series = raw.valores || raw.data || raw.datasets?.[0]?.data || [];

        if (Array.isArray(etiquetas) && etiquetas.length > 0) {
            this.labels = etiquetas.map((e: any) => String(e));
            this.valores = series.map((v: any) => Number(v || 0));
        } else if (Array.isArray(raw) && raw.length > 0) {
            const agrupado = new Map<string, number>();
            raw.forEach((b: any) => {
                const tipo = b.tipo_carga_principal || b.producto || 'Carga General';
                const ton = Number(b.inventario_actual_ton ?? b.toneladas ?? 0);
                agrupado.set(tipo, (agrupado.get(tipo) || 0) + ton);
            });
            this.labels = Array.from(agrupado.keys());
            this.valores = Array.from(agrupado.values());
        } else {
            this.labels = [];
            this.valores = [];
        }

        // Uso del Helper Centralizado para calcular totales, colores y porcentajes
        const { total, items } = PorttosChartHelper.calcularLeyendaDona(this.labels, this.valores);
        this.totalInventarioTon = total;
        this.leyendaItems = items;
        this.sinDatos = this.labels.length === 0 || this.totalInventarioTon === 0;

        this.cargando = false;
        this.renderizarDona();
        this.cdr.detectChanges();
    }

    private renderizarDona(): void {
        if (!this.vistaLista || this.sinDatos) return;

        this.chart = PorttosChartHelper.renderizarDona(
            this.doughnutBodegasCanvas,
            this.chart,
            this.labels,
            this.valores,
            'Ton'
        );
    }

    get data(): any {
        return {
            ...(this.widgetConfig?.data || {}),
            ...this.metadatosSQL,
            labels: this.labels,
            valores: this.valores
        };
    }

    public maximizarDesdeShell(): void {
        if (this.isEnfoque) {
            this._torreService.cerrarModoEnfoque();
        } else {
            this._torreService.abrirModoEnfoque(
                this.widgetConfig?.type || 'PTT_BOD_CHRT_CARGA',
                this.data
            );
        }
    }
}
