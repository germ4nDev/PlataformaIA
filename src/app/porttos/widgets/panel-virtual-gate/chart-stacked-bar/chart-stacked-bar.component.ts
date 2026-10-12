// /* eslint-disable @typescript-eslint/no-explicit-any */
// /*
//     Author: German Valencia
//     Pattern: PORTTOS Smart Widget - Citas Próximas 12 Horas por Terminal (Consumo Autónomo SQL)
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
//     selector: 'app-chart-stacked-bar',
//     standalone: true,
//     imports: [CommonModule, NgChartsModule, WidgetShellComponent],
//     templateUrl: './chart-stacked-bar.component.html',
//     styleUrls: ['./chart-stacked-bar.component.scss'],
//     encapsulation: ViewEncapsulation.None
// })
// export class ChartStackedBarComponent implements OnInit, OnChanges, OnDestroy {
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

//     private readonly paletaTerminales: Record<string, string> = {
//         'SPRBUN': '#00d4ff',
//         'TCBUEN': '#a78bfa',
//         'AGUADULCE': '#00c896',
//         'SPIA': '#00c896',
//         'COMPAS': '#ffb547',
//         'BODEGA': '#f472b6',
//         'ZONA FRANCA': '#38bdf8'
//     };

//     private readonly coloresBase = ['#0ea5e9', '#8b5cf6', '#14b8a6', '#ffb547', '#f472b6'];

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
//         private _virtualGateService: VirtualGateService,
//         private _torreService: DashboardService,
//         private cdr: ChangeDetectorRef
//     ) { }

//     ngOnInit(): void {
//         this.cargarCitasProximas12H();
//     }

//     ngOnChanges(changes: SimpleChanges): void {
//         if (
//             (changes['widgetConfig'] && !changes['widgetConfig'].firstChange) ||
//             (changes['datosVivos'] && this.datosVivos)
//         ) {
//             this.cargarCitasProximas12H();
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
//      * Consulta autónoma a VirtualGateService (TCL_CitasGate) filtrada por puerto
//      */
//     private cargarCitasProximas12H(): void {
//         // 1. Si viene precargado desde el modal de Modo Enfoque
//         if (
//             this.datosVivos &&
//             (this.datosVivos.datasets ||
//                 this.datosVivos.series ||
//                 this.datosVivos.citasPorHora ||
//                 Array.isArray(this.datosVivos.citas))
//         ) {
//             this.procesarPayloadCitas12H(this.datosVivos);
//             return;
//         }

//         const puerto = (this.widgetConfig?.puerto || 'BUENAVENTURA').trim().toUpperCase();
//         const codigoWidget = (this.widgetConfig?.type || this.widgetConfig?.codigoWidget || 'PTT_GATE_CHRT_CITAS')
//             .trim()
//             .toUpperCase();

//         this.cargando = true;

//         this._virtualGateService
//             .obtenerDatosWidgetGate(puerto, codigoWidget)
//             .pipe(takeUntil(this.destroy$))
//             .subscribe({
//                 next: (respuestaSQL: any) => {
//                     this.procesarPayloadCitas12H(respuestaSQL);
//                 },
//                 error: (err) => {
//                     console.error('❌ [SmartWidget ChartStackedBar] Error consultando citas 12h:', err);
//                     this.barChartData = { labels: [], datasets: [] };
//                     this.tieneDatos = false;
//                     this.cargando = false;
//                     this.cdr.detectChanges();
//                 }
//             });
//     }

//     /**
//      * Soporta 3 estructuras:
//      * 1. Chart.js directo: { labels: [...], datasets: [...] }
//      * 2. Estructura { categorias: [...], series: [{ name, data }] }
//      * 3. Filas SQL directas de dbo.TCL_CitasGate (fecha_hora_cita, terminal)
//      */
//     private procesarPayloadCitas12H(raw: any): void {
//         if (!raw) {
//             this.barChartData = { labels: [], datasets: [] };
//             this.tieneDatos = false;
//             this.cargando = false;
//             this.cdr.detectChanges();
//             return;
//         }

//         const origen = raw.citasPorHora || raw.resumen?.citasPorHora || raw;
//         this.metadatosSQL = Array.isArray(raw) ? {} : raw;

//         if (Array.isArray(origen.labels) && Array.isArray(origen.datasets)) {
//             this.barChartData = {
//                 labels: [...origen.labels],
//                 datasets: origen.datasets.map((ds: any, idx: number) => {
//                     const key = (ds.label || '').toUpperCase();
//                     return {
//                         stack: 'Stack 0',
//                         borderRadius: 3,
//                         backgroundColor:
//                             ds.backgroundColor ||
//                             this.paletaTerminales[key] ||
//                             this.coloresBase[idx % this.coloresBase.length],
//                         ...ds
//                     };
//                 })
//             };
//         } else if (Array.isArray(origen.categorias) && Array.isArray(origen.series)) {
//             this.barChartData = {
//                 labels: [...origen.categorias],
//                 datasets: origen.series.map((serie: any, idx: number) => {
//                     const key = (serie.name || '').toUpperCase();
//                     return {
//                         label: serie.name || `Terminal ${idx + 1}`,
//                         data: [...(serie.data || [])],
//                         backgroundColor:
//                             this.paletaTerminales[key] ||
//                             this.coloresBase[idx % this.coloresBase.length],
//                         stack: 'Stack 0',
//                         borderRadius: 3
//                     };
//                 })
//             };
//         } else {
//             // Pivot automático de filas de dbo.TCL_CitasGate (fecha_hora_cita x terminal)
//             const citas: any[] = Array.isArray(origen) ? origen : origen.citas || origen.rows || [];
//             this.barChartData = this.pivotearCitasSQL(citas);
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

//     private pivotearCitasSQL(citas: any[]): ChartData<'bar'> {
//         if (!citas || citas.length === 0) {
//             return { labels: [], datasets: [] };
//         }

//         const extraerHora = (rawHora: string): string => {
//             if (!rawHora) return '14:00';
//             const match = String(rawHora).match(/(\d{1,2}):\d{2}/);
//             return match ? `${match[1].padStart(2, '0')}:00` : String(rawHora);
//         };

//         const horas = Array.from(new Set(citas.map((c) => extraerHora(c.fecha_hora_cita)))).sort();
//         const terminales = Array.from(
//             new Set(citas.map((c) => (c.terminal || 'SPRBUN').trim().toUpperCase()))
//         );

//         const datasets = terminales.map((term, idx) => ({
//             label: term,
//             data: horas.map(
//                 (h) =>
//                     citas.filter(
//                         (c) =>
//                             extraerHora(c.fecha_hora_cita) === h &&
//                             (c.terminal || 'SPRBUN').trim().toUpperCase() === term
//                     ).length
//             ),
//             backgroundColor:
//                 this.paletaTerminales[term] || this.coloresBase[idx % this.coloresBase.length],
//             stack: 'Stack 0',
//             borderRadius: 3
//         }));

//         return { labels: horas, datasets };
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
//                 this.widgetConfig?.type || 'PTT_GATE_CHRT_CITAS',
//                 this.data
//             );
//         }
//     }
// }
/* eslint-disable @typescript-eslint/no-explicit-any */
/*
    Author: German Valencia
    Pattern: PORTTOS Smart Widget - Citas Próximas 12 Horas (Barras Apiladas)
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
    IDatasetBarra
} from 'src/app/theme/shared/_helpers/chart.helper';

@Component({
    selector: 'app-chart-stacked-bar',
    standalone: true,
    imports: [CommonModule, DecimalPipe, WidgetShellComponent],
    templateUrl: './chart-stacked-bar.component.html',
    styleUrls: ['./chart-stacked-bar.component.scss']
})
export class ChartStackedBarComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy {
    @Input() widgetConfig: any;
    @Input() isEnfoque: boolean = false;
    @Input() mostrarTabla: boolean = false;
    @Input() datosVivos: any;

    @ViewChild('stackedBarCanvas') stackedBarCanvas!: ElementRef<HTMLCanvasElement>;

    public chart?: Chart;
    public cargando: boolean = true;
    public sinDatos: boolean = false;
    public totalCitas12h: number = 0;

    private labels: string[] = [];
    private datasets: IDatasetBarra[] = [];
    private vistaLista: boolean = false;
    private metadatosSQL: any = {};
    private readonly destroy$ = new Subject<void>();

    constructor(
        private _virtualGateService: VirtualGateService,
        private _torreService: DashboardService,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit(): void {
        this.cargarCitas12h();
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
            this.cargarCitas12h();
        }
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
        if (this.chart) {
            this.chart.destroy();
        }
    }

    private cargarCitas12h(): void {
        if (this.datosVivos && (this.datosVivos.labels || this.datosVivos.datasets)) {
            this.procesarPayload(this.datosVivos);
            return;
        }

        const puerto = (this.widgetConfig?.puerto || 'BUENAVENTURA').trim().toUpperCase();
        const codigoWidget = (
            this.widgetConfig?.type ||
            this.widgetConfig?.codigoWidget ||
            'PTT_GATE_CHRT_12H'
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
                    console.error('❌ [SmartWidget ChartStackedBar] Error consultando citas 12h:', err);
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
        const nodo = raw.citasProximas12h || raw;

        this.labels = (nodo.labels || nodo.franjas || []).map((l: any) => String(l));

        if (Array.isArray(nodo.datasets) && nodo.datasets.length > 0) {
            this.datasets = nodo.datasets.map((ds: any, idx: number) => ({
                label: ds.label || `Terminal ${idx + 1}`,
                data: (ds.data || []).map((v: any) => Number(v || 0)),
                color: ds.backgroundColor || ds.color || PorttosChartHelper.PALETA_DEFAULT[idx]
            }));
        } else if (Array.isArray(nodo.valores) && nodo.valores.length > 0) {
            this.datasets = [
                {
                    label: 'Citas Programadas',
                    data: nodo.valores.map((v: any) => Number(v || 0)),
                    color: '#00d4ff'
                }
            ];
        } else {
            this.datasets = [];
        }

        this.totalCitas12h = this.datasets.reduce(
            (acc, ds) => acc + ds.data.reduce((sum, val) => sum + val, 0),
            0
        );

        this.sinDatos = this.labels.length === 0 || this.totalCitas12h === 0;
        this.cargando = false;
        this.renderizarGrafica();
        this.cdr.detectChanges();
    }

    private renderizarGrafica(): void {
        if (!this.vistaLista || this.sinDatos) return;

        this.chart = PorttosChartHelper.renderizarBarras(
            this.stackedBarCanvas,
            this.chart,
            {
                labels: this.labels,
                datasets: this.datasets,
                unidad: 'Citas',
                apilado: true,
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
                this.widgetConfig?.type || 'PTT_GATE_CHRT_12H',
                this.data
            );
        }
    }
}
