// /* eslint-disable @typescript-eslint/no-explicit-any */
// /*
//     Author: German Valencia
//     Pattern: PORTTOS Smart Widget - Devolución de Vacíos por Naviera (Consumo Autónomo SQL)
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
//     selector: 'app-chart-bar-cont',
//     standalone: true,
//     imports: [CommonModule, NgChartsModule, WidgetShellComponent],
//     templateUrl: './chart-bar-cont.component.html',
//     styleUrls: ['./chart-bar-cont.component.scss']
// })
// export class ChartBarContComponent implements OnInit, OnChanges, OnDestroy {
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

//     private readonly paletaSeries = ['#a855f7', '#10b981', '#00d4ff', '#ffb547'];

//     public barChartOptions: ChartConfiguration['options'] = {
//         responsive: true,
//         maintainAspectRatio: false,
//         scales: {
//             x: {
//                 stacked: false,
//                 ticks: { color: '#94a3b8' },
//                 grid: { display: false },
//                 border: { display: false }
//             },
//             y: {
//                 stacked: false,
//                 beginAtZero: true,
//                 ticks: { color: '#94a3b8', precision: 0 },
//                 grid: {
//                     color: 'rgba(255,255,255,0.05)',
//                     display: true
//                 },
//                 border: { display: false }
//             }
//         },
//         plugins: {
//             legend: {
//                 position: 'top',
//                 align: 'end',
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
//         this.cargarVaciosPorNaviera();
//     }

//     ngOnChanges(changes: SimpleChanges): void {
//         if (
//             (changes['widgetConfig'] && !changes['widgetConfig'].firstChange) ||
//             (changes['datosVivos'] && this.datosVivos)
//         ) {
//             this.cargarVaciosPorNaviera();
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
//      * Consulta autónoma a ContenedoresService (TCL_MovimientosContenedor / TCL_UnidadCarga)
//      */
//     private cargarVaciosPorNaviera(): void {
//         // 1. Si viene precargado desde el modal de Modo Enfoque
//         if (
//             this.datosVivos &&
//             (this.datosVivos.series ||
//                 this.datosVivos.datasets ||
//                 this.datosVivos.valores ||
//                 this.datosVivos.vaciosNaviera ||
//                 Array.isArray(this.datosVivos.movimientos))
//         ) {
//             this.procesarPayloadNavieras(this.datosVivos);
//             return;
//         }

//         const puerto = (this.widgetConfig?.puerto || 'BUENAVENTURA').trim().toUpperCase();
//         const codigoWidget = (
//             this.widgetConfig?.type ||
//             this.widgetConfig?.codigoWidget ||
//             'PTT_CONT_CHRT_NAVIERA'
//         )
//             .trim()
//             .toUpperCase();

//         this.cargando = true;

//         this._contenedoresService
//             .obtenerDatosWidgetContenedores(puerto, codigoWidget)
//             .pipe(takeUntil(this.destroy$))
//             .subscribe({
//                 next: (respuestaSQL: any) => {
//                     this.procesarPayloadNavieras(respuestaSQL);
//                 },
//                 error: (err) => {
//                     console.error('❌ [SmartWidget ChartBarCont] Error consultando vacíos por naviera:', err);
//                     this.barChartData = { labels: [], datasets: [] };
//                     this.tieneDatos = false;
//                     this.cargando = false;
//                     this.cdr.detectChanges();
//                 }
//             });
//     }

//     /**
//      * Soporta 4 estructuras:
//      * 1. { categorias: [...], series: [{ name, data }], colores?: [...] }
//      * 2. Chart.js estándar: { labels: [...], datasets: [...] }
//      * 3. Serie simple { labels: [...], valores: [...] }
//      * 4. Filas SQL de dbo.TCL_MovimientosContenedor (naviera, tipo, operacion)
//      */
//     private procesarPayloadNavieras(raw: any): void {
//         if (!raw) {
//             this.barChartData = { labels: [], datasets: [] };
//             this.tieneDatos = false;
//             this.cargando = false;
//             this.cdr.detectChanges();
//             return;
//         }

//         const origen = raw.vaciosNaviera || raw;
//         this.metadatosSQL = Array.isArray(raw) ? {} : raw;
//         const colors = origen.colores || this.paletaSeries;

//         if (Array.isArray(origen.categorias) && Array.isArray(origen.series)) {
//             this.barChartData = {
//                 labels: [...origen.categorias],
//                 datasets: origen.series.map((serie: any, index: number) => ({
//                     label: serie.name || serie.label || `Serie ${index + 1}`,
//                     data: [...(serie.data || [])],
//                     backgroundColor: serie.color || colors[index % colors.length],
//                     borderRadius: 4
//                 }))
//             };
//         } else if (Array.isArray(origen.labels) && Array.isArray(origen.datasets)) {
//             this.barChartData = {
//                 labels: [...origen.labels],
//                 datasets: origen.datasets.map((ds: any, index: number) => ({
//                     borderRadius: 4,
//                     backgroundColor: ds.backgroundColor || colors[index % colors.length],
//                     ...ds
//                 }))
//             };
//         } else if (Array.isArray(origen.labels) && Array.isArray(origen.valores)) {
//             const porDevolver = origen.valores.map((v: any) => Number(v || 0));
//             const capPatios = Array.isArray(origen.capacidad)
//                 ? origen.capacidad.map((c: any) => Number(c || 0))
//                 : porDevolver.map((v: number) => Math.max(Math.round(v * 1.25), 10));

//             this.barChartData = {
//                 labels: [...origen.labels],
//                 datasets: [
//                     {
//                         label: 'Por devolver',
//                         data: porDevolver,
//                         backgroundColor: colors[0],
//                         borderRadius: 4
//                     },
//                     {
//                         label: 'Cap. patios',
//                         data: capPatios,
//                         backgroundColor: colors[1],
//                         borderRadius: 4
//                     }
//                 ]
//             };
//         } else {
//             const movimientos: any[] = Array.isArray(origen)
//                 ? origen
//                 : origen.movimientos || origen.rows || [];
//             this.barChartData = this.agruparPorNavieraDesdeSQL(movimientos);
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

//     private agruparPorNavieraDesdeSQL(movimientos: any[]): ChartData<'bar'> {
//         if (!movimientos || movimientos.length === 0) {
//             return { labels: [], datasets: [] };
//         }

//         const conteoNaviera = new Map<string, number>();
//         movimientos.forEach((m) => {
//             const nav = (m.naviera || m.linea_naviera || 'OTROS').trim();
//             conteoNaviera.set(nav, (conteoNaviera.get(nav) || 0) + 1);
//         });

//         const ordenados = Array.from(conteoNaviera.entries()).sort((a, b) => b[1] - a[1]);
//         const labels = ordenados.map(([nav]) => nav);
//         const porDevolver = ordenados.map(([, cant]) => cant);
//         const capPatios = porDevolver.map((v) => Math.max(Math.round(v * 1.3), 5));

//         return {
//             labels,
//             datasets: [
//                 {
//                     label: 'Por devolver',
//                     data: porDevolver,
//                     backgroundColor: '#a855f7',
//                     borderRadius: 4
//                 },
//                 {
//                     label: 'Cap. patios',
//                     data: capPatios,
//                     backgroundColor: '#10b981',
//                     borderRadius: 4
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
//                 this.widgetConfig?.type || 'PTT_CONT_CHRT_NAVIERA',
//                 this.data
//             );
//         }
//     }
// }
/* eslint-disable @typescript-eslint/no-explicit-any */
/*
    Author: German Valencia
    Pattern: PORTTOS Smart Widget - Gráfica de Barras de Contenedores
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
    selector: 'app-chart-bar-contenedores',
    standalone: true,
    imports: [CommonModule, DecimalPipe, WidgetShellComponent],
    templateUrl: './chart-bar-cont.component.html',
    styleUrls: ['./chart-bar-cont.component.scss']
})
export class ChartBarContComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy {
    @Input() widgetConfig: any;
    @Input() isEnfoque: boolean = false;
    @Input() mostrarTabla: boolean = false;
    @Input() datosVivos: any;

    @ViewChild('barContCanvas') barContCanvas!: ElementRef<HTMLCanvasElement>;

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
        this.cargarBarrasContenedores();
    }

    ngAfterViewInit(): void {
        this.vistaLista = true;
        this.renderizarGrafica();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['isEnfoque'] && !changes['isEnfoque'].isFirstChange()) {
            setTimeout(() => this.chart?.resize(), 60);
        }

        if (
            (changes['widgetConfig'] && !changes['widgetConfig'].firstChange) ||
            (changes['datosVivos'] && this.datosVivos)
        ) {
            this.cargarBarrasContenedores();
        }
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
        if (this.chart) {
            this.chart.destroy();
        }
    }

    private cargarBarrasContenedores(): void {
        if (this.datosVivos && (this.datosVivos.labels || this.datosVivos.categorias)) {
            this.procesarPayload(this.datosVivos);
            return;
        }

        const puerto = (this.widgetConfig?.puerto || 'BUENAVENTURA').trim().toUpperCase();
        const codigoWidget = (
            this.widgetConfig?.type ||
            this.widgetConfig?.codigoWidget ||
            'PTT_CONT_CHRT_FLUJO'
        )
            .trim()
            .toUpperCase();

        this.cargando = true;

        this._contenedoresService
            .obtenerDatosWidgetContenedores(puerto, codigoWidget)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (res: any) => this.procesarPayload(res),
                error: (err) => {
                    console.error('❌ [SmartWidget ChartBarContenedores] Error:', err);
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
        this.labels = (raw.labels || raw.categorias || []).map((l: any) => String(l));

        if (Array.isArray(raw.datasets) && raw.datasets.length > 0) {
            this.datasets = raw.datasets.map((ds: any, idx: number) => ({
                label: ds.label || `Serie ${idx + 1}`,
                data: (ds.data || []).map((v: any) => Number(v || 0)),
                color: ds.backgroundColor || ds.color || PorttosChartHelper.PALETA_DEFAULT[idx]
            }));
        } else if (Array.isArray(raw.entradas) || Array.isArray(raw.salidas)) {
            this.datasets = [
                {
                    label: 'Gate-In / Descargue',
                    data: (raw.entradas || []).map((v: any) => Number(v || 0)),
                    color: '#00d4ff'
                },
                {
                    label: 'Gate-Out / Embarque',
                    data: (raw.salidas || []).map((v: any) => Number(v || 0)),
                    color: '#10b981'
                }
            ];
        } else if (Array.isArray(raw.valores)) {
            this.datasets = [
                {
                    label: raw.titulo || 'Unidades',
                    data: raw.valores.map((v: any) => Number(v || 0)),
                    color: '#00d4ff'
                }
            ];
        } else {
            this.datasets = [];
        }

        const sumaTotal = this.datasets.reduce(
            (acc, ds) => acc + ds.data.reduce((s, v) => s + v, 0),
            0
        );

        this.sinDatos = this.labels.length === 0 || sumaTotal === 0;
        this.cargando = false;
        this.renderizarGrafica();
        this.cdr.detectChanges();
    }

    private renderizarGrafica(): void {
        if (!this.vistaLista || this.sinDatos) return;

        this.chart = PorttosChartHelper.renderizarBarras(
            this.barContCanvas,
            this.chart,
            {
                labels: this.labels,
                datasets: this.datasets,
                unidad: 'Cont.',
                isEnfoque: this.isEnfoque
            }
        );
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
                this.widgetConfig?.type || 'PTT_CONT_CHRT_FLUJO',
                this.data
            );
        }
    }
}
