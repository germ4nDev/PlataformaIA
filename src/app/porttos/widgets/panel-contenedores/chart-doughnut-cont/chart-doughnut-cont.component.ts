// // /* eslint-disable @typescript-eslint/no-explicit-any */
// // /*
// //     Author: German Valencia
// //     Pattern: PORTTOS Smart Widget - Distribución Free Time Contenedores (Consumo Autónomo SQL)
// // */
// // import {
// //     Component,
// //     Input,
// //     OnInit,
// //     OnChanges,
// //     OnDestroy,
// //     SimpleChanges,
// //     ViewChild,
// //     ChangeDetectorRef
// // } from '@angular/core';
// // import { CommonModule } from '@angular/common';
// // import { NgChartsModule, BaseChartDirective } from 'ng2-charts';
// // import { ChartConfiguration, ChartData } from 'chart.js';
// // import { Subject } from 'rxjs';
// // import { takeUntil } from 'rxjs/operators';

// // import { DashboardService } from 'src/app/theme/shared/service/tablero-control/dashboard.service';
// // import { ContenedoresService } from 'src/app/theme/shared/service/tablero-control/contenedores.service';
// // import { WidgetShellComponent } from 'src/app/theme/shared/components/widget-shell/widget-shell.component';

// // @Component({
// //     selector: 'app-chart-doughnut-cont',
// //     standalone: true,
// //     imports: [CommonModule, NgChartsModule, WidgetShellComponent],
// //     templateUrl: './chart-doughnut-cont.component.html',
// //     styleUrls: ['./chart-doughnut-cont.component.scss']
// // })
// // export class ChartDoughnutContComponent implements OnInit, OnChanges, OnDestroy {
// //     @ViewChild(BaseChartDirective) chart?: BaseChartDirective;

// //     @Input() widgetConfig: any;
// //     @Input() isEnfoque: boolean = false;
// //     @Input() mostrarTabla: boolean = false;

// //     // Respaldo cuando se abre en el modal de Modo Enfoque
// //     @Input() datosVivos: any;

// //     public doughnutChartData: ChartData<'doughnut'> = { labels: [], datasets: [] };
// //     public cargando: boolean = true;
// //     public tieneDatos: boolean = false;

// //     private metadatosSQL: any = {};
// //     private readonly destroy$ = new Subject<void>();

// //     // Semáforo corporativo para tramos de Free Time: Holgado (Verde), Medio (Azul/Cyan), Riesgo (Ámbar), Vencido (Rojo)
// //     private readonly paletaFreeTime = ['#10b981', '#00d4ff', '#f59e0b', '#ef4444'];

// //     public doughnutChartOptions: ChartConfiguration<'doughnut'>['options'] = {
// //         responsive: true,
// //         maintainAspectRatio: false,
// //         cutout: '70%',
// //         plugins: {
// //             legend: {
// //                 position: 'bottom',
// //                 labels: {
// //                     color: '#94a3b8',
// //                     font: { size: 11 },
// //                     usePointStyle: true,
// //                     pointStyle: 'circle',
// //                     boxWidth: 8,
// //                     padding: 14
// //                 }
// //             },
// //             tooltip: {
// //                 callbacks: {
// //                     label: (ctx) => ` ${ctx.label}: ${ctx.raw}`
// //                 }
// //             }
// //         }
// //     };

// //     constructor(
// //         private _contenedoresService: ContenedoresService,
// //         private _torreService: DashboardService,
// //         private cdr: ChangeDetectorRef
// //     ) { }

// //     ngOnInit(): void {
// //         this.cargarDistribucionFreeTime();
// //     }

// //     ngOnChanges(changes: SimpleChanges): void {
// //         if (
// //             (changes['widgetConfig'] && !changes['widgetConfig'].firstChange) ||
// //             (changes['datosVivos'] && this.datosVivos)
// //         ) {
// //             this.cargarDistribucionFreeTime();
// //         }

// //         if (changes['isEnfoque'] && !changes['isEnfoque'].firstChange) {
// //             setTimeout(() => {
// //                 this.chart?.render();
// //             }, 80);
// //         }
// //     }

// //     ngOnDestroy(): void {
// //         this.destroy$.next();
// //         this.destroy$.complete();
// //     }

// //     /**
// //      * Consulta autónoma a ContenedoresService (TCL_MovimientosContenedor / TCL_UnidadCarga)
// //      */
// //     private cargarDistribucionFreeTime(): void {
// //         // 1. Si viene precargado desde el modal de Modo Enfoque
// //         if (
// //             this.datosVivos &&
// //             (this.datosVivos.series ||
// //                 this.datosVivos.valores ||
// //                 this.datosVivos.datasets ||
// //                 this.datosVivos.freeTimeDistribucion ||
// //                 Array.isArray(this.datosVivos.movimientos))
// //         ) {
// //             this.procesarPayloadFreeTime(this.datosVivos);
// //             return;
// //         }

// //         const puerto = (this.widgetConfig?.puerto || 'BUENAVENTURA').trim().toUpperCase();
// //         const codigoWidget = (
// //             this.widgetConfig?.type ||
// //             this.widgetConfig?.codigoWidget ||
// //             'PTT_CONT_CHRT_FREETIME'
// //         )
// //             .trim()
// //             .toUpperCase();

// //         this.cargando = true;

// //         this._contenedoresService
// //             .obtenerDatosWidgetContenedores(puerto, codigoWidget)
// //             .pipe(takeUntil(this.destroy$))
// //             .subscribe({
// //                 next: (respuestaSQL: any) => {
// //                     this.procesarPayloadFreeTime(respuestaSQL);
// //                 },
// //                 error: (err) => {
// //                     console.error('❌ [SmartWidget ChartDoughnutCont] Error consultando Free Time:', err);
// //                     this.doughnutChartData = { labels: [], datasets: [] };
// //                     this.tieneDatos = false;
// //                     this.cargando = false;
// //                     this.cdr.detectChanges();
// //                 }
// //             });
// //     }

// //     /**
// //      * Soporta 3 estructuras:
// //      * 1. { labels: [...], series/valores: [...], colores?: [...] }
// //      * 2. Chart.js estándar: { labels: [...], datasets: [{ data: [...] }] }
// //      * 3. Filas SQL de dbo.TCL_MovimientosContenedor (columna 'free_time') o dbo.TCL_UnidadCarga ('diasFreeTime')
// //      */
// //     private procesarPayloadFreeTime(raw: any): void {
// //         if (!raw) {
// //             this.doughnutChartData = { labels: [], datasets: [] };
// //             this.tieneDatos = false;
// //             this.cargando = false;
// //             this.cdr.detectChanges();
// //             return;
// //         }

// //         const origen = raw.freeTimeDistribucion || raw;
// //         this.metadatosSQL = Array.isArray(raw) ? {} : raw;

// //         let labels: string[] = [];
// //         let valores: number[] = [];
// //         const colores: string[] = origen.colores || this.paletaFreeTime;

// //         if (Array.isArray(origen.labels) && Array.isArray(origen.datasets) && origen.datasets[0]) {
// //             labels = [...origen.labels];
// //             valores = (origen.datasets[0].data || []).map((v: any) => Number(v || 0));
// //         } else if (Array.isArray(origen.labels) && Array.isArray(origen.series || origen.valores)) {
// //             labels = [...origen.labels];
// //             valores = (origen.series || origen.valores).map((v: any) => Number(v || 0));
// //         } else {
// //             const movimientos: any[] = Array.isArray(origen)
// //                 ? origen
// //                 : origen.movimientos || origen.rows || [];
// //             const agrupado = this.clasificarTramosDesdeSQL(movimientos);
// //             labels = agrupado.labels;
// //             valores = agrupado.valores;
// //         }

// //         this.doughnutChartData = {
// //             labels,
// //             datasets: [
// //                 {
// //                     data: valores,
// //                     backgroundColor: labels.map((_, idx) => colores[idx % colores.length]),
// //                     borderWidth: 0,
// //                     hoverOffset: 4
// //                 }
// //             ]
// //         };

// //         this.tieneDatos = labels.length > 0 && valores.some((v) => v > 0);
// //         this.cargando = false;
// //         this.cdr.detectChanges();

// //         setTimeout(() => {
// //             this.chart?.update();
// //         }, 50);
// //     }

// //     /**
// //      * Clasifica los registros de TCL_MovimientosContenedor / TCL_UnidadCarga en 4 tramos de Free Time
// //      */
// //     private clasificarTramosDesdeSQL(movimientos: any[]): { labels: string[]; valores: number[] } {
// //         if (!movimientos || movimientos.length === 0) {
// //             return { labels: [], valores: [] };
// //         }

// //         let holgadosMas5 = 0;
// //         let alerta3a5 = 0;
// //         let criticos1a2 = 0;
// //         let vencidos = 0;

// //         movimientos.forEach((m) => {
// //             const ftRaw = String(m.free_time ?? m.diasFreeTime ?? '').toLowerCase();
// //             if (ftRaw.includes('vencid') || ftRaw.includes('mora') || ftRaw.includes('-')) {
// //                 vencidos++;
// //             } else {
// //                 const match = ftRaw.match(/(\d+)/);
// //                 const dias = match ? parseInt(match[1], 10) : 6;
// //                 if (dias <= 0) vencidos++;
// //                 else if (dias <= 2) criticos1a2++;
// //                 else if (dias <= 5) alerta3a5++;
// //                 else holgadosMas5++;
// //             }
// //         });

// //         return {
// //             labels: ['> 5 días libre', '3-5 días', '1-2 días (crítico)', 'Vencido (mora)'],
// //             valores: [holgadosMas5, alerta3a5, criticos1a2, vencidos]
// //         };
// //     }

// //     get data(): any {
// //         return {
// //             ...(this.widgetConfig?.data || {}),
// //             ...this.metadatosSQL,
// //             labels: this.doughnutChartData?.labels || [],
// //             datasets: this.doughnutChartData?.datasets || []
// //         };
// //     }

// //     maximizarDesdeShell(): void {
// //         if (this.isEnfoque) {
// //             this._torreService.cerrarModoEnfoque();
// //         } else {
// //             this._torreService.abrirModoEnfoque(
// //                 this.widgetConfig?.type || 'PTT_CONT_CHRT_FREETIME',
// //                 this.data
// //             );
// //         }
// //     }
// // }
// /* eslint-disable @typescript-eslint/no-explicit-any */
// /*
//     Author: German Valencia
//     Pattern: PORTTOS Smart Widget - Gráfica Dona Contenedores (Navieras / Tipología)
//     Standard: PorttosChartHelper (Light & Dark Mode Ready)
// */
// import {
//     Component,
//     Input,
//     OnInit,
//     AfterViewInit,
//     OnChanges,
//     OnDestroy,
//     SimpleChanges,
//     ViewChild,
//     ElementRef,
//     ChangeDetectorRef
// } from '@angular/core';
// import { CommonModule, DecimalPipe } from '@angular/common';
// import { Chart } from 'chart.js';
// import { Subject } from 'rxjs';
// import { takeUntil } from 'rxjs/operators';

// import { WidgetShellComponent } from 'src/app/theme/shared/components/widget-shell/widget-shell.component';
// import { ContenedoresService } from 'src/app/theme/shared/service/tablero-control/contenedores.service';
// import { DashboardService } from 'src/app/theme/shared/service/tablero-control/dashboard.service';
// import {
//     PorttosChartHelper,
//     ILeyendaDonaItem
// } from 'src/app/theme/shared/_helpers/chart.helper';

// @Component({
//     selector: 'app-chart-doughnut-contenedores',
//     standalone: true,
//     imports: [CommonModule, DecimalPipe, WidgetShellComponent],
//     templateUrl: './chart-doughnut-cont.component.html',
//     styleUrls: ['./chart-doughnut-cont.component.scss']
// })
// export class ChartDoughnutContComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy {
//     @Input() widgetConfig: any;
//     @Input() isEnfoque: boolean = false;
//     @Input() mostrarTabla: boolean = false;
//     @Input() datosVivos: any;

//     @ViewChild('doughnutContCanvas') doughnutContCanvas!: ElementRef<HTMLCanvasElement>;

//     public chart?: Chart;
//     public cargando: boolean = true;
//     public sinDatos: boolean = false;
//     public totalUnidades: number = 0;
//     public leyendaItems: ILeyendaDonaItem[] = [];

//     private labels: string[] = [];
//     private valores: number[] = [];
//     private vistaLista: boolean = false;
//     private metadatosSQL: any = {};
//     private readonly destroy$ = new Subject<void>();

//     constructor(
//         private _contenedoresService: ContenedoresService,
//         private _torreService: DashboardService,
//         private cdr: ChangeDetectorRef
//     ) { }

//     ngOnInit(): void {
//         this.cargarDatosContenedores();
//     }

//     ngAfterViewInit(): void {
//         this.vistaLista = true;
//         this.renderizarDona();
//     }

//     ngOnChanges(changes: SimpleChanges): void {
//         if (changes['isEnfoque'] && !changes['isEnfoque'].isFirstChange()) {
//             setTimeout(() => this.chart?.resize(), 60);
//         }

//         if (
//             (changes['widgetConfig'] && !changes['widgetConfig'].firstChange) ||
//             (changes['datosVivos'] && this.datosVivos)
//         ) {
//             this.cargarDatosContenedores();
//         }
//     }

//     ngOnDestroy(): void {
//         this.destroy$.next();
//         this.destroy$.complete();
//         if (this.chart) {
//             this.chart.destroy();
//         }
//     }

//     private cargarDatosContenedores(): void {
//         if (this.datosVivos && (this.datosVivos.labels || this.datosVivos.valores)) {
//             this.procesarPayload(this.datosVivos);
//             return;
//         }

//         const puerto = (this.widgetConfig?.puerto || 'BUENAVENTURA').trim().toUpperCase();
//         const codigoWidget = (
//             this.widgetConfig?.type ||
//             this.widgetConfig?.codigoWidget ||
//             'PTT_CONT_CHRT_NAVIERAS'
//         )
//             .trim()
//             .toUpperCase();

//         this.cargando = true;

//         this._contenedoresService
//             .obtenerDatosWidgetContenedores(puerto, codigoWidget)
//             .pipe(takeUntil(this.destroy$))
//             .subscribe({
//                 next: (res: any) => this.procesarPayload(res),
//                 error: (err) => {
//                     console.error('❌ [SmartWidget ChartDoughnutContenedores] Error:', err);
//                     this.sinDatos = true;
//                     this.cargando = false;
//                     this.cdr.detectChanges();
//                 }
//             });
//     }

//     private procesarPayload(raw: any): void {
//         if (!raw) {
//             this.sinDatos = true;
//             this.cargando = false;
//             this.cdr.detectChanges();
//             return;
//         }

//         this.metadatosSQL = Array.isArray(raw) ? {} : raw;

//         this.labels = (raw.labels || raw.categorias || []).map((l: any) => String(l));
//         this.valores = (raw.valores || raw.data || raw.datasets?.[0]?.data || []).map((v: any) =>
//             Number(v || 0)
//         );

//         const { total, items } = PorttosChartHelper.calcularLeyendaDona(this.labels, this.valores);
//         this.totalUnidades = total;
//         this.leyendaItems = items;
//         this.sinDatos = this.labels.length === 0 || this.totalUnidades === 0;

//         this.cargando = false;
//         this.renderizarDona();
//         this.cdr.detectChanges();
//     }

//     private renderizarDona(): void {
//         if (!this.vistaLista || this.sinDatos) return;

//         this.chart = PorttosChartHelper.renderizarDona(
//             this.doughnutContCanvas,
//             this.chart,
//             this.labels,
//             this.valores,
//             'TEUs'
//         );
//     }

//     get data(): any {
//         return {
//             ...(this.widgetConfig?.data || {}),
//             ...this.metadatosSQL,
//             labels: this.labels,
//             valores: this.valores
//         };
//     }

//     public maximizarDesdeShell(): void {
//         if (this.isEnfoque) {
//             this._torreService.cerrarModoEnfoque();
//         } else {
//             this._torreService.abrirModoEnfoque(
//                 this.widgetConfig?.type || 'PTT_CONT_CHRT_NAVIERAS',
//                 this.data
//             );
//         }
//     }
// }
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
            'TEUs'
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
                this.widgetConfig?.type || 'PTT_CONT_CHRT_NAVIERA',
                this.data
            );
        }
    }
}
