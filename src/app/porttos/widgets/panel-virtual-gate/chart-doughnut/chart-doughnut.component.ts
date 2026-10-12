// /* eslint-disable @typescript-eslint/no-explicit-any */
// /*
//     Author: German Valencia
//     Pattern: PORTTOS Smart Widget - Distribución 10km (Consumo Autónomo SQL)
// */
// import {
//     Component,
//     Input,
//     OnInit,
//     OnChanges,
//     OnDestroy,
//     SimpleChanges,
//     ViewEncapsulation,
//     ViewChild,
//     ChangeDetectorRef
// } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { NgChartsModule, BaseChartDirective } from 'ng2-charts';
// import { ChartConfiguration, ChartData } from 'chart.js';
// import { Subject } from 'rxjs';
// import { takeUntil } from 'rxjs/operators';

// import { DashboardService } from 'src/app/theme/shared/service/tablero-control/dashboard.service';
// import { VirtualGateService } from 'src/app/theme/shared/service/tablero-control/virtual-gate.service';
// import { WidgetShellComponent } from 'src/app/theme/shared/components/widget-shell/widget-shell.component';

// @Component({
//     selector: 'app-chart-doughnut',
//     standalone: true,
//     imports: [CommonModule, NgChartsModule, WidgetShellComponent],
//     templateUrl: './chart-doughnut.component.html',
//     styleUrls: ['./chart-doughnut.component.scss'],
//     encapsulation: ViewEncapsulation.None
// })
// export class ChartDoughnutComponent implements OnInit, OnChanges, OnDestroy {
//     @ViewChild(BaseChartDirective) chart?: BaseChartDirective;

//     @Input() widgetConfig: any;
//     @Input() isEnfoque: boolean = false;
//     @Input() mostrarTabla: boolean = false;

//     // Respaldo cuando se abre en el modal de Modo Enfoque
//     @Input() datosVivos: any;

//     public doughnutChartData: ChartData<'doughnut'> = { labels: [], datasets: [] };
//     public cargando: boolean = true;
//     public tieneDatos: boolean = false;

//     private metadatosSQL: any = {};
//     private readonly destroy$ = new Subject<void>();
//     private readonly paletaZonas = ['#00d4ff', '#00c896', '#a78bfa', '#ffb547', '#ff5b6e', '#38bdf8'];

//     public doughnutChartOptions: ChartConfiguration<'doughnut'>['options'] = {
//         responsive: true,
//         maintainAspectRatio: false,
//         cutout: '68%',
//         plugins: {
//             legend: {
//                 position: 'bottom',
//                 labels: {
//                     color: '#94a3b8',
//                     font: { size: 11 },
//                     usePointStyle: true,
//                     pointStyle: 'circle',
//                     boxWidth: 8,
//                     padding: 14
//                 }
//             },
//             tooltip: {
//                 callbacks: {
//                     label: (ctx) => ` ${ctx.label}: ${ctx.raw} camiones`
//                 }
//             }
//         }
//     };

//     constructor(
//         private _virtualGateService: VirtualGateService,
//         private _torreService: DashboardService,
//         private cdr: ChangeDetectorRef
//     ) { }

//     ngOnInit(): void {
//         this.cargarDistribucion10Km();
//     }

//     ngOnChanges(changes: SimpleChanges): void {
//         if (
//             (changes['widgetConfig'] && !changes['widgetConfig'].firstChange) ||
//             (changes['datosVivos'] && this.datosVivos)
//         ) {
//             this.cargarDistribucion10Km();
//         }

//         if (changes['isEnfoque'] && !changes['isEnfoque'].firstChange) {
//             setTimeout(() => {
//                 this.chart?.render();
//             }, 80);
//         }
//     }

//     ngOnDestroy(): void {
//         this.destroy$.next();
//         this.destroy$.complete();
//     }

//     /**
//      * Consulta autónoma a VirtualGateService (TCL_CitasGate / TCL_CamionesOperaciones)
//      */
//     private cargarDistribucion10Km(): void {
//         // 1. Si viene precargado desde el modal de Modo Enfoque
//         if (
//             this.datosVivos &&
//             (this.datosVivos.datasets ||
//                 this.datosVivos.series ||
//                 this.datosVivos.valores ||
//                 this.datosVivos.distribucionCamiones ||
//                 Array.isArray(this.datosVivos.citas))
//         ) {
//             this.procesarPayloadDistribucion(this.datosVivos);
//             return;
//         }

//         const puerto = (this.widgetConfig?.puerto || 'BUENAVENTURA').trim().toUpperCase();
//         const codigoWidget = (this.widgetConfig?.type || this.widgetConfig?.codigoWidget || 'PTT_GATE_CHRT_DIST')
//             .trim()
//             .toUpperCase();

//         this.cargando = true;

//         this._virtualGateService
//             .obtenerDatosWidgetGate(puerto, codigoWidget)
//             .pipe(takeUntil(this.destroy$))
//             .subscribe({
//                 next: (respuestaSQL: any) => {
//                     this.procesarPayloadDistribucion(respuestaSQL);
//                 },
//                 error: (err) => {
//                     console.error('❌ [SmartWidget ChartDoughnut] Error consultando distribución 10 km:', err);
//                     this.doughnutChartData = { labels: [], datasets: [] };
//                     this.tieneDatos = false;
//                     this.cargando = false;
//                     this.cdr.detectChanges();
//                 }
//             });
//     }

//     /**
//      * Soporta 3 estructuras:
//      * 1. Chart.js directo: { labels: [...], datasets: [{ data: [...] }] }
//      * 2. Serie simple: { labels: [...], valores/series: [...] } (o dentro de distribucionCamiones)
//      * 3. Filas SQL directas de dbo.TCL_CitasGate (agrupando por columna 'ubicacion')
//      */
//     private procesarPayloadDistribucion(raw: any): void {
//         if (!raw) {
//             this.doughnutChartData = { labels: [], datasets: [] };
//             this.tieneDatos = false;
//             this.cargando = false;
//             this.cdr.detectChanges();
//             return;
//         }

//         const origen = raw.distribucionCamiones || raw.resumen?.distribucionCamiones || raw;
//         this.metadatosSQL = Array.isArray(raw) ? {} : raw;

//         let labels: string[] = [];
//         let valores: number[] = [];

//         if (Array.isArray(origen.labels) && Array.isArray(origen.datasets) && origen.datasets[0]) {
//             labels = [...origen.labels];
//             valores = (origen.datasets[0].data || []).map((v: any) => Number(v || 0));
//         } else if (Array.isArray(origen.labels) && Array.isArray(origen.series || origen.valores)) {
//             labels = [...origen.labels];
//             valores = (origen.series || origen.valores).map((v: any) => Number(v || 0));
//         } else {
//             // Agrupación directa de filas de TCL_CitasGate por 'ubicacion'
//             const citas: any[] = Array.isArray(origen) ? origen : origen.citas || origen.rows || [];
//             const conteo = new Map<string, number>();

//             citas.forEach((c: any) => {
//                 const zona = (c.ubicacion || c.estado_camion || 'En tránsito').trim();
//                 conteo.set(zona, (conteo.get(zona) || 0) + 1);
//             });

//             const ordenados = Array.from(conteo.entries()).sort((a, b) => b[1] - a[1]);
//             labels = ordenados.map(([z]) => z);
//             valores = ordenados.map(([, cant]) => cant);
//         }

//         this.doughnutChartData = {
//             labels,
//             datasets: [
//                 {
//                     data: valores,
//                     backgroundColor: labels.map((_, i) => this.paletaZonas[i % this.paletaZonas.length]),
//                     borderWidth: 0,
//                     hoverOffset: 4
//                 }
//             ]
//         };

//         this.tieneDatos = labels.length > 0 && valores.some((v) => v > 0);
//         this.cargando = false;
//         this.cdr.detectChanges();

//         setTimeout(() => {
//             this.chart?.update();
//         }, 50);
//     }

//     get data(): any {
//         return {
//             ...(this.widgetConfig?.data || {}),
//             ...this.metadatosSQL,
//             labels: this.doughnutChartData?.labels || [],
//             datasets: this.doughnutChartData?.datasets || []
//         };
//     }

//     maximizarDesdeShell(): void {
//         if (this.isEnfoque) {
//             this._torreService.cerrarModoEnfoque();
//         } else {
//             this._torreService.abrirModoEnfoque(
//                 this.widgetConfig?.type || 'PTT_GATE_CHRT_DIST',
//                 this.data
//             );
//         }
//     }
// }
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
        if (changes['isEnfoque'] && !changes['isEnfoque'].isFirstChange()) {
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
        const codigoWidget = (
            this.widgetConfig?.type ||
            this.widgetConfig?.codigoWidget ||
            'PTT_GATE_CHRT_10KM'
        )
            .trim()
            .toUpperCase();

        this.cargando = true;

        this._virtualGateService
            .obtenerDatosWidgetGate(puerto, codigoWidget)
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
        if (!this.vistaLista || this.sinDatos) return;

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
                this.widgetConfig?.type || 'PTT_GATE_CHRT_10KM',
                this.data
            );
        }
    }
}
