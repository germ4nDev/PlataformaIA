// /* eslint-disable @typescript-eslint/no-explicit-any */
// /*
//     Author: German Valencia
//     Pattern: PORTTOS Smart Widget - Retiros y Priorización de Contenedores (Consumo Autónomo SQL)
// */
// import {
//     Component,
//     Input,
//     OnInit,
//     OnChanges,
//     OnDestroy,
//     SimpleChanges,
//     ViewChild,
//     ChangeDetectorRef
// } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { NgChartsModule, BaseChartDirective } from 'ng2-charts';
// import { ChartConfiguration, ChartData } from 'chart.js';
// import { Subject } from 'rxjs';
// import { takeUntil } from 'rxjs/operators';

// import { DashboardService } from 'src/app/theme/shared/service/tablero-control/dashboard.service';
// import { ContenedoresService } from 'src/app/theme/shared/service/tablero-control/contenedores.service';
// import { WidgetShellComponent } from 'src/app/theme/shared/components/widget-shell/widget-shell.component';

// @Component({
//     selector: 'app-chart-stacked-bar-cont',
//     standalone: true,
//     imports: [CommonModule, NgChartsModule, WidgetShellComponent],
//     templateUrl: './chart-stacked-bar-cont.component.html',
//     styleUrls: ['./chart-stacked-bar-cont.component.scss']
// })
// export class ChartStackedBarContComponent implements OnInit, OnChanges, OnDestroy {
//     @ViewChild(BaseChartDirective) chart?: BaseChartDirective;

//     @Input() widgetConfig: any;
//     @Input() isEnfoque: boolean = false;
//     @Input() mostrarTabla: boolean = false;

//     // Respaldo cuando se abre en el modal de Modo Enfoque
//     @Input() datosVivos: any;

//     public barChartData: ChartData<'bar'> = { labels: [], datasets: [] };
//     public cargando: boolean = true;
//     public tieneDatos: boolean = false;

//     private metadatosSQL: any = {};
//     private readonly destroy$ = new Subject<void>();

//     private readonly paletaPrioridad = ['#00c896', '#ffb547', '#ff5b6e', '#3b82f6'];

//     public barChartOptions: ChartConfiguration['options'] = {
//         responsive: true,
//         maintainAspectRatio: false,
//         scales: {
//             x: {
//                 stacked: true,
//                 ticks: { color: '#94a3b8' },
//                 grid: { display: false },
//                 border: { display: false }
//             },
//             y: {
//                 stacked: true,
//                 beginAtZero: true,
//                 ticks: { color: '#94a3b8', precision: 0 },
//                 grid: { color: 'rgba(255,255,255,0.05)' },
//                 border: { display: false }
//             }
//         },
//         plugins: {
//             legend: {
//                 position: 'top',
//                 labels: {
//                     color: '#94a3b8',
//                     font: { size: 11 },
//                     usePointStyle: true,
//                     pointStyle: 'circle',
//                     boxWidth: 8
//                 }
//             },
//             tooltip: {
//                 mode: 'index',
//                 intersect: false
//             }
//         }
//     };

//     constructor(
//         private _contenedoresService: ContenedoresService,
//         private _torreService: DashboardService,
//         private cdr: ChangeDetectorRef
//     ) { }

//     ngOnInit(): void {
//         this.cargarRetirosPriorizacion();
//     }

//     ngOnChanges(changes: SimpleChanges): void {
//         if (
//             (changes['widgetConfig'] && !changes['widgetConfig'].firstChange) ||
//             (changes['datosVivos'] && this.datosVivos)
//         ) {
//             this.cargarRetirosPriorizacion();
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
//      * Consulta autónoma a ContenedoresService (TCL_MovimientosContenedor) filtrada por puerto
//      */
//     private cargarRetirosPriorizacion(): void {
//         // 1. Si viene precargado desde el modal de Modo Enfoque
//         if (
//             this.datosVivos &&
//             (this.datosVivos.series ||
//                 this.datosVivos.datasets ||
//                 this.datosVivos.retirosPriorizacion ||
//                 Array.isArray(this.datosVivos.movimientos))
//         ) {
//             this.procesarPayloadRetiros(this.datosVivos);
//             return;
//         }

//         const puerto = (this.widgetConfig?.puerto || 'BUENAVENTURA').trim().toUpperCase();
//         const codigoWidget = (
//             this.widgetConfig?.type ||
//             this.widgetConfig?.codigoWidget ||
//             'PTT_CONT_CHRT_RETIROS'
//         )
//             .trim()
//             .toUpperCase();

//         this.cargando = true;

//         this._contenedoresService
//             .obtenerDatosWidgetContenedores(puerto, codigoWidget)
//             .pipe(takeUntil(this.destroy$))
//             .subscribe({
//                 next: (respuestaSQL: any) => {
//                     this.procesarPayloadRetiros(respuestaSQL);
//                 },
//                 error: (err) => {
//                     console.error('❌ [SmartWidget ChartStackedBarCont] Error consultando retiros:', err);
//                     this.barChartData = { labels: [], datasets: [] };
//                     this.tieneDatos = false;
//                     this.cargando = false;
//                     this.cdr.detectChanges();
//                 }
//             });
//     }

//     /**
//      * Soporta 3 estructuras:
//      * 1. { categorias: [...], series: [{ name, data }], colores?: [...] }
//      * 2. Chart.js estándar: { labels: [...], datasets: [...] }
//      * 3. Filas SQL de dbo.TCL_MovimientosContenedor (free_time, operacion, estado)
//      */
//     private procesarPayloadRetiros(raw: any): void {
//         if (!raw) {
//             this.barChartData = { labels: [], datasets: [] };
//             this.tieneDatos = false;
//             this.cargando = false;
//             this.cdr.detectChanges();
//             return;
//         }

//         const origen = raw.retirosPriorizacion || raw;
//         this.metadatosSQL = Array.isArray(raw) ? {} : raw;
//         const colores = origen.colores || this.paletaPrioridad;

//         if (Array.isArray(origen.categorias) && Array.isArray(origen.series)) {
//             this.barChartData = {
//                 labels: [...origen.categorias],
//                 datasets: origen.series.map((serie: any, index: number) => ({
//                     label: serie.name || serie.label || `Serie ${index + 1}`,
//                     data: [...(serie.data || [])],
//                     backgroundColor: serie.color || colores[index % colores.length],
//                     stack: 'Stack 0',
//                     borderRadius: 3
//                 }))
//             };
//         } else if (Array.isArray(origen.labels) && Array.isArray(origen.datasets)) {
//             this.barChartData = {
//                 labels: [...origen.labels],
//                 datasets: origen.datasets.map((ds: any, index: number) => ({
//                     stack: 'Stack 0',
//                     borderRadius: 3,
//                     backgroundColor: ds.backgroundColor || colores[index % colores.length],
//                     ...ds
//                 }))
//             };
//         } else {
//             const movimientos: any[] = Array.isArray(origen)
//                 ? origen
//                 : origen.movimientos || origen.rows || [];
//             this.barChartData = this.construirProyeccionDesdeSQL(movimientos);
//         }

//         this.tieneDatos = Boolean(
//             this.barChartData?.labels?.length && this.barChartData?.datasets?.length
//         );
//         this.cargando = false;
//         this.cdr.detectChanges();

//         setTimeout(() => {
//             this.chart?.update();
//         }, 50);
//     }

//     /**
//      * Clasifica movimientos de dbo.TCL_MovimientosContenedor según urgencia de Free Time en horizonte de 8 días
//      */
//     private construirProyeccionDesdeSQL(movimientos: any[]): ChartData<'bar'> {
//         if (!movimientos || movimientos.length === 0) {
//             return { labels: [], datasets: [] };
//         }

//         const labels = ['Hoy', 'Mañana', 'Día +2', 'Día +3', 'Día +4', 'Día +5', 'Día +6', 'Día +7'];
//         const normales = new Array(8).fill(0);
//         const prioritarios = new Array(8).fill(0);
//         const urgentes = new Array(8).fill(0);

//         movimientos.forEach((m, idx) => {
//             const bucket = idx % 8;
//             const ft = String(m.free_time || '').toLowerCase();

//             if (ft.includes('vencid') || ft.includes('-')) {
//                 urgentes[bucket] += 1;
//             } else {
//                 const match = ft.match(/(\d+)/);
//                 const dias = match ? parseInt(match[1], 10) : 5;
//                 if (dias <= 3) {
//                     prioritarios[bucket] += 1;
//                 } else {
//                     normales[bucket] += 1;
//                 }
//             }
//         });

//         return {
//             labels,
//             datasets: [
//                 {
//                     label: 'Normal (Free time >3d)',
//                     data: normales,
//                     backgroundColor: '#00c896',
//                     stack: 'Stack 0',
//                     borderRadius: 3
//                 },
//                 {
//                     label: 'Prioritario (1-3d)',
//                     data: prioritarios,
//                     backgroundColor: '#ffb547',
//                     stack: 'Stack 0',
//                     borderRadius: 3
//                 },
//                 {
//                     label: 'Urgente (vencido)',
//                     data: urgentes,
//                     backgroundColor: '#ff5b6e',
//                     stack: 'Stack 0',
//                     borderRadius: 3
//                 }
//             ]
//         };
//     }

//     get data(): any {
//         return {
//             ...(this.widgetConfig?.data || {}),
//             ...this.metadatosSQL,
//             labels: this.barChartData?.labels || [],
//             datasets: this.barChartData?.datasets || []
//         };
//     }

//     maximizarDesdeShell(): void {
//         if (this.isEnfoque) {
//             this._torreService.cerrarModoEnfoque();
//         } else {
//             this._torreService.abrirModoEnfoque(
//                 this.widgetConfig?.type || 'PTT_CONT_CHRT_RETIROS',
//                 this.data
//             );
//         }
//     }
// }
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
