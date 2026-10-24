/* eslint-disable @typescript-eslint/no-explicit-any */
/*
    Author: German Valencia
    Pattern: PORTTOS Smart Widget - Gráfica Dona Contenedores (Navieras / Tipología)
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
    ILeyendaDonaItem
} from 'src/app/theme/shared/_helpers/chart.helper';

@Component({
    selector: 'app-chart-doughnut-cont',
    standalone: true,
    imports: [CommonModule, DecimalPipe, WidgetShellComponent],
    templateUrl: './chart-doughnut-cont.component.html',
    styleUrls: ['./chart-doughnut-cont.component.scss']
})
export class ChartDoughnutContComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy {
    @Input() widgetConfig: any;
    @Input() isEnfoque: boolean = false;
    @Input() mostrarTabla: boolean = false;
    @Input() datosVivos: any;

    @ViewChild('doughnutContCanvas') doughnutContCanvas!: ElementRef<HTMLCanvasElement>;

    public chart?: Chart;
    public cargando: boolean = true;
    public sinDatos: boolean = false;
    public totalUnidades: number = 0;
    public leyendaItems: ILeyendaDonaItem[] = [];

    private labels: string[] = [];
    private valores: number[] = [];
    private vistaLista: boolean = false;
    private metadatosSQL: any = {};
    private readonly destroy$ = new Subject<void>();

    constructor(
        private _contenedoresService: ContenedoresService,
        private _torreService: DashboardService,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit(): void {
        this.cargarDatosContenedores();
    }

    ngAfterViewInit(): void {
        this.vistaLista = true;
        this.renderizarDona();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['isEnfoque'] && !changes['isEnfoque'].firstChange) {
            setTimeout(() => this.chart?.resize(), 60);
        }

        if (
            (changes['widgetConfig'] && !changes['widgetConfig'].firstChange) ||
            (changes['datosVivos'] && this.datosVivos)
        ) {
            this.cargarDatosContenedores();
        }
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
        if (this.chart) {
            this.chart.destroy();
        }
    }

    private cargarDatosContenedores(): void {
        if (this.datosVivos && (this.datosVivos.labels || this.datosVivos.valores)) {
            this.procesarPayload(this.datosVivos);
            return;
        }

        const puerto = (this.widgetConfig?.puerto || 'BUENAVENTURA').trim().toUpperCase();
        // 🟢 Corregido al código exacto manejado en ContenedoresService ('PTT_CONT_CHRT_NAVIERA')
        const codigoWidget = (
            this.widgetConfig?.type ||
            this.widgetConfig?.codigoWidget ||
            'PTT_CONT_CHRT_NAVIERA'
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
                    console.error('❌ [SmartWidget ChartDoughnutContenedores] Error:', err);
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
        const nodo = raw.vaciosNaviera || raw;

        this.labels = (nodo.labels || nodo.categorias || []).map((l: any) => String(l));
        // Corregido 2026-10-17: vaciosNaviera trae series: [{ name, data: [...] }]; antes se convertían
        // los objetos a número (NaN) y la dona de navieras salía rota.
        const series = nodo.series;
        const valoresCrudos = nodo.valores || nodo.data
            || (Array.isArray(series) && series.length && typeof series[0] === 'object' ? series[0].data : series)
            || nodo.datasets?.[0]?.data || [];
        this.valores = (valoresCrudos || []).map((v: any) => Number(v || 0));

        const { total, items } = PorttosChartHelper.calcularLeyendaDona(this.labels, this.valores);
        this.totalUnidades = total;
        this.leyendaItems = items;
        this.sinDatos = this.labels.length === 0 || this.totalUnidades === 0;

        this.cargando = false;
        this.renderizarDona();
        this.cdr.detectChanges();
    }

    private renderizarDona(): void {
        if (!this.vistaLista || this.sinDatos || !this.doughnutContCanvas?.nativeElement) return;

        this.chart = PorttosChartHelper.renderizarDona(
            this.doughnutContCanvas,
            this.chart,
            this.labels,
            this.valores,
            this.unidadTexto
        );
    }

    /** Unidad que declara el API (contenedores); antes se rotulaba 'TEUs' aunque se contaran movimientos. */
    get unidadTexto(): string {
        return this.metadatosSQL?.unidad || 'Contenedores';
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
                this.widgetConfig?.type || 'PTT_CONT_CHRT_NAVIERA',
                this.data
            );
        }
    }
}
