/* eslint-disable @typescript-eslint/no-explicit-any */
/*
    Author: German Valencia
    Pattern: PORTTOS Smart Widget - Distribución 10 km (Dona Unificada)
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
import { VirtualGateService } from 'src/app/theme/shared/service/tablero-control/virtual-gate.service';
import { DashboardService } from 'src/app/theme/shared/service/tablero-control/dashboard.service';
import {
    PorttosChartHelper,
    ILeyendaDonaItem
} from 'src/app/theme/shared/_helpers/chart.helper';

@Component({
    selector: 'app-chart-doughnut',
    standalone: true,
    imports: [CommonModule, DecimalPipe, WidgetShellComponent],
    templateUrl: './chart-doughnut.component.html',
    styleUrls: ['./chart-doughnut.component.scss']
})
export class ChartDoughnutComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy {
    @Input() widgetConfig: any;
    @Input() isEnfoque: boolean = false;
    @Input() mostrarTabla: boolean = false;
    @Input() datosVivos: any;

    @ViewChild('doughnutGateCanvas') doughnutGateCanvas!: ElementRef<HTMLCanvasElement>;

    public chart?: Chart;
    public cargando: boolean = true;
    public sinDatos: boolean = false;
    public totalCamiones: number = 0;
    public leyendaItems: ILeyendaDonaItem[] = [];

    private labels: string[] = [];
    private valores: number[] = [];
    private vistaLista: boolean = false;
    private metadatosSQL: any = {};
    private readonly destroy$ = new Subject<void>();

    constructor(
        private _virtualGateService: VirtualGateService,
        private _torreService: DashboardService,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit(): void {
        this.cargarDistribucion10km();
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
            this.cargarDistribucion10km();
        }
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
        if (this.chart) {
            this.chart.destroy();
        }
    }

    private cargarDistribucion10km(): void {
        if (this.datosVivos && (this.datosVivos.labels || this.datosVivos.valores)) {
            this.procesarPayload(this.datosVivos);
            return;
        }

        const puerto = (this.widgetConfig?.puerto || 'BUENAVENTURA').trim().toUpperCase();
        // 🟢 Corregido al código exacto del switch en VirtualGateService
        const codigoWidget = (
            this.widgetConfig?.type ||
            this.widgetConfig?.codigoWidget ||
            'PTT_GATE_CHRT_DIST'
        )
            .trim()
            .toUpperCase();

        this.cargando = true;

        this._virtualGateService
            .obtenerDatosWidgetGate(codigoWidget, puerto)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (res: any) => this.procesarPayload(res),
                error: (err) => {
                    console.error('❌ [SmartWidget ChartDoughnut] Error consultando distribución 10 km:', err);
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
        const nodo = raw.distribucion10km || raw;

        this.labels = (nodo.labels || nodo.categorias || []).map((l: any) => String(l));
        this.valores = (nodo.valores || nodo.data || nodo.datasets?.[0]?.data || []).map((v: any) =>
            Number(v || 0)
        );

        const { total, items } = PorttosChartHelper.calcularLeyendaDona(this.labels, this.valores);
        this.totalCamiones = total;
        this.leyendaItems = items;
        this.sinDatos = this.labels.length === 0 || this.totalCamiones === 0;

        this.cargando = false;
        this.renderizarDona();
        this.cdr.detectChanges();
    }

    private renderizarDona(): void {
        if (!this.vistaLista || this.sinDatos || !this.doughnutGateCanvas?.nativeElement) return;

        this.chart = PorttosChartHelper.renderizarDona(
            this.doughnutGateCanvas,
            this.chart,
            this.labels,
            this.valores,
            'Vehículos'
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
                this.widgetConfig?.type || 'PTT_GATE_CHRT_DIST',
                this.data
            );
        }
    }
}
