// /* eslint-disable @typescript-eslint/no-explicit-any */
// /*
//     Author: German Valencia
//     Pattern: PORTTOS Smart Widget - Reporte ETA vs ATA (Consumo Autónomo SQL)
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
// import { MaritimoService } from 'src/app/theme/shared/service/tablero-control/maritimo.service';
// import { WidgetShellComponent } from 'src/app/theme/shared/components/widget-shell/widget-shell.component';

// @Component({
//     selector: 'app-eta-chart',
//     standalone: true,
//     imports: [CommonModule, NgChartsModule, WidgetShellComponent],
//     templateUrl: './eta-chart.component.html',
//     styleUrls: ['./eta-chart.component.scss']
// })
// export class EtaChartComponent implements OnInit, OnChanges, OnDestroy {
//     @Input() widgetConfig: any;
//     @Input() isEnfoque: boolean = false;
//     @Input() mostrarTabla: boolean = false;

//     // Respaldo cuando se abre en el modal de Modo Enfoque
//     @Input() datosVivos: any;

//     @ViewChild(BaseChartDirective) chart: BaseChartDirective | undefined;

//     public barChartData: ChartData<'bar'> = { labels: [], datasets: [] };
//     public cargando: boolean = true;
//     private metadatosSQL: any = {};
//     private readonly destroy$ = new Subject<void>();

//     constructor(
//         private _maritimoService: MaritimoService,
//         private _torreService: DashboardService,
//         private cdr: ChangeDetectorRef
//     ) { }

//     ngOnInit(): void {
//         this.cargarDatosEtaAta();
//     }

//     ngOnChanges(changes: SimpleChanges): void {
//         if (
//             (changes['widgetConfig'] && !changes['widgetConfig'].firstChange) ||
//             (changes['datosVivos'] && this.datosVivos)
//         ) {
//             this.cargarDatosEtaAta();
//         }

//         // Redibujar cuando entra o sale del modal de Modo Enfoque
//         if (changes['isEnfoque'] && !changes['isEnfoque'].firstChange) {
//             setTimeout(() => {
//                 this.chart?.render();
//             }, 100);
//         }
//     }

//     ngOnDestroy(): void {
//         this.destroy$.next();
//         this.destroy$.complete();
//     }

//     /**
//      * Consulta autónoma a SQL Server (TCL_Naves_Arribadas / TCL_OperacionMaritima)
//      */
//     private cargarDatosEtaAta(): void {
//         // 1. Si viene precargado desde el modal de Enfoque
//         if (this.datosVivos && (this.datosVivos.datasets || Array.isArray(this.datosVivos))) {
//             this.aplicarDatosAlGrafico(this.datosVivos);
//             return;
//         }

//         const puerto = (this.widgetConfig?.puerto || 'BUENAVENTURA').trim().toUpperCase();
//         const codigoWidget = (this.widgetConfig?.type || this.widgetConfig?.codigoWidget || 'PTT_MAE_CHRT_ETA_ATA')
//             .trim()
//             .toUpperCase();

//         this.cargando = true;

//         this._maritimoService
//             .obtenerDatosWidgetMaritimo(puerto, codigoWidget)
//             .pipe(takeUntil(this.destroy$))
//             .subscribe({
//                 next: (respuestaSQL: any) => {
//                     this.aplicarDatosAlGrafico(respuestaSQL);
//                 },
//                 error: (err) => {
//                     console.error('❌ [SmartWidget EtaChart] Error cargando ETA vs ATA:', err);
//                     this.cargando = false;
//                     this.cdr.detectChanges();
//                 }
//             });
//     }

//     /**
//      * Soporta tanto estructura Chart.js directa { labels, datasets }
//      * como filas SQL de TCL_Naves_Arribadas / TCL_OperacionMaritima
//      */
//     private aplicarDatosAlGrafico(raw: any): void {
//         if (!raw) {
//             this.barChartData = { labels: [], datasets: [] };
//             this.cargando = false;
//             this.cdr.detectChanges();
//             return;
//         }

//         this.metadatosSQL = Array.isArray(raw) ? {} : raw;

//         if (raw.datasets && Array.isArray(raw.datasets)) {
//             this.barChartData = {
//                 labels: raw.labels || [],
//                 datasets: raw.datasets.map((ds: any) => ({
//                     borderRadius: 6,
//                     ...ds
//                 }))
//             };
//         } else {
//             // Homologación directa de filas SQL: [{ terminal, retraso_horas }]
//             const filas: any[] = Array.isArray(raw) ? raw : raw.rows || raw.data || [];
//             const labels = filas.map((f: any) => f.terminal || f.instalacion_portuaria || f.id_terminal || 'Terminal');
//             const valores = filas.map((f: any) => Number(f.retraso_horas ?? f.retraso ?? 0));

//             this.barChartData = {
//                 labels,
//                 datasets: [
//                     {
//                         label: 'Retraso prom. (h)',
//                         data: valores,
//                         backgroundColor: valores.map((v: number) =>
//                             v >= 3.5 ? '#ff5b6e' : v >= 2.0 ? '#ffb547' : '#00d4ff'
//                         ),
//                         borderRadius: 6
//                     }
//                 ]
//             };
//         }

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
//             labels: this.barChartData?.labels || [],
//             datasets: this.barChartData?.datasets || []
//         };
//     }

//     get tieneDatos(): boolean {
//         return (this.barChartData?.labels?.length || 0) > 0;
//     }

//     maximizarDesdeShell(): void {
//         if (this.isEnfoque) {
//             this._torreService.cerrarModoEnfoque();
//         } else {
//             // Enviamos el código real registrado en WIDGET_MAP ('PTT_MAE_CHRT_ETA_ATA') y los datasets actuales
//             this._torreService.abrirModoEnfoque(
//                 this.widgetConfig?.type || 'PTT_MAE_CHRT_ETA_ATA',
//                 this.data
//             );
//         }
//     }

//     public barChartOptions: ChartConfiguration['options'] = {
//         responsive: true,
//         maintainAspectRatio: false,
//         scales: {
//             y: {
//                 beginAtZero: true,
//                 ticks: {
//                     color: '#94a3b8',
//                     stepSize: 0.5,
//                     callback: (value) => value + 'h'
//                 },
//                 grid: { color: 'rgba(255,255,255,0.05)' },
//                 border: { display: false }
//             },
//             x: {
//                 ticks: { color: '#94a3b8' },
//                 grid: { display: false },
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
//             }
//         }
//     };
// }
/* eslint-disable @typescript-eslint/no-explicit-any */
/*
    Author: German Valencia
    Pattern: PORTTOS Smart Widget - Reporte ETA vs ATA (Consumo Autónomo SQL)
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
import { CommonModule } from '@angular/common';
import { Chart } from 'chart.js';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { DashboardService } from 'src/app/theme/shared/service/tablero-control/dashboard.service';
import { MaritimoService } from 'src/app/theme/shared/service/tablero-control/maritimo.service';
import { WidgetShellComponent } from 'src/app/theme/shared/components/widget-shell/widget-shell.component';
import {
    PorttosChartHelper,
    IDatasetBarra
} from 'src/app/theme/shared/_helpers/chart.helper';

@Component({
    selector: 'app-eta-chart',
    standalone: true,
    imports: [CommonModule, WidgetShellComponent],
    templateUrl: './eta-chart.component.html',
    styleUrls: ['./eta-chart.component.scss']
})
export class EtaChartComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy {
    @Input() widgetConfig: any;
    @Input() isEnfoque: boolean = false;
    @Input() mostrarTabla: boolean = false;

    // Respaldo cuando se abre en el modal de Modo Enfoque
    @Input() datosVivos: any;

    @ViewChild('etaChartCanvas') etaChartCanvas!: ElementRef<HTMLCanvasElement>;

    public chartInstance?: Chart;
    public cargando: boolean = true;

    private labels: string[] = [];
    private datasets: IDatasetBarra[] = [];
    private vistaLista: boolean = false;
    private metadatosSQL: any = {};
    private readonly destroy$ = new Subject<void>();

    constructor(
        private _maritimoService: MaritimoService,
        private _torreService: DashboardService,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit(): void {
        this.cargarDatosEtaAta();
    }

    ngAfterViewInit(): void {
        this.vistaLista = true;
        if (!this.cargando && this.tieneDatos) {
            this.renderizarGrafica();
        }
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (
            (changes['widgetConfig'] && !changes['widgetConfig'].firstChange) ||
            (changes['datosVivos'] && this.datosVivos)
        ) {
            this.cargarDatosEtaAta();
        }

        // Redimensionar cuando entra o sale del modal de Modo Enfoque
        if (changes['isEnfoque'] && !changes['isEnfoque'].firstChange) {
            setTimeout(() => {
                this.chartInstance?.resize();
            }, 80);
        }
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
        if (this.chartInstance) {
            this.chartInstance.destroy();
        }
    }

    /**
     * Consulta autónoma a SQL Server (TCL_Naves_Arribadas / TCL_OperacionMaritima)
     */
    private cargarDatosEtaAta(): void {
        // 1. Si viene precargado desde el modal de Enfoque
        if (this.datosVivos && (this.datosVivos.datasets || Array.isArray(this.datosVivos))) {
            this.aplicarDatosAlGrafico(this.datosVivos);
            return;
        }

        const puerto = (this.widgetConfig?.puerto || 'BUENAVENTURA').trim().toUpperCase();
        const codigoWidget = (
            this.widgetConfig?.type ||
            this.widgetConfig?.codigoWidget ||
            'PTT_MAE_CHRT_ETA_ATA'
        )
            .trim()
            .toUpperCase();

        this.cargando = true;

        this._maritimoService
            .obtenerDatosWidgetMaritimo(puerto, codigoWidget)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (respuestaSQL: any) => {
                    this.aplicarDatosAlGrafico(respuestaSQL);
                },
                error: (err) => {
                    console.error('❌ [SmartWidget EtaChart] Error cargando ETA vs ATA:', err);
                    this.labels = [];
                    this.datasets = [];
                    this.cargando = false;
                    this.cdr.detectChanges();
                }
            });
    }

    /**
     * Soporta tanto estructura Chart.js directa { labels, datasets }
     * como filas SQL de TCL_Naves_Arribadas / TCL_OperacionMaritima
     */
    private aplicarDatosAlGrafico(raw: any): void {
        if (!raw) {
            this.labels = [];
            this.datasets = [];
            this.cargando = false;
            this.cdr.detectChanges();
            return;
        }

        this.metadatosSQL = Array.isArray(raw) ? {} : raw;

        if (raw.datasets && Array.isArray(raw.datasets)) {
            this.labels = (raw.labels || []).map((l: any) => String(l));
            this.datasets = raw.datasets.map((ds: any, idx: number) => {
                const dataNum = (ds.data || []).map((v: any) => Number(v || 0));
                return {
                    label: ds.label || 'Retraso prom. (h)',
                    data: dataNum,
                    color:
                        ds.backgroundColor ||
                        ds.color ||
                        (raw.datasets.length === 1
                            ? dataNum.map((v: number) =>
                                v >= 3.5 ? '#ef4444' : v >= 2.0 ? '#f59e0b' : '#00d4ff'
                            )
                            : PorttosChartHelper.PALETA_DEFAULT[idx])
                };
            });
        } else {
            // Homologación directa de filas SQL: [{ terminal, retraso_horas }]
            const filas: any[] = Array.isArray(raw) ? raw : raw.rows || raw.data || [];
            this.labels = filas.map(
                (f: any) => f.terminal || f.instalacion_portuaria || f.id_terminal || 'Terminal'
            );
            const valores = filas.map((f: any) => Number(f.retraso_horas ?? f.retraso ?? 0));

            this.datasets =
                valores.length > 0
                    ? [
                        {
                            label: 'Retraso prom. (h)',
                            data: valores,
                            color: valores.map((v: number) =>
                                v >= 3.5 ? '#ef4444' : v >= 2.0 ? '#f59e0b' : '#00d4ff'
                            )
                        }
                    ]
                    : [];
        }

        this.cargando = false;
        this.cdr.detectChanges();

        if (this.vistaLista && this.tieneDatos) {
            setTimeout(() => this.renderizarGrafica(), 20);
        }
    }

    private renderizarGrafica(): void {
        if (!this.vistaLista || !this.tieneDatos || !this.etaChartCanvas?.nativeElement) return;

        this.chartInstance = PorttosChartHelper.renderizarBarras(
            this.etaChartCanvas,
            this.chartInstance,
            {
                labels: this.labels,
                datasets: this.datasets,
                unidad: 'h',
                mostrarLeyenda: this.datasets.length > 1,
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

    get tieneDatos(): boolean {
        return (
            this.labels.length > 0 &&
            this.datasets.some((ds) => ds.data && ds.data.length > 0)
        );
    }

    public maximizarDesdeShell(): void {
        if (this.isEnfoque) {
            this._torreService.cerrarModoEnfoque();
        } else {
            this._torreService.abrirModoEnfoque(
                this.widgetConfig?.type || 'PTT_MAE_CHRT_ETA_ATA',
                this.data
            );
        }
    }
}
