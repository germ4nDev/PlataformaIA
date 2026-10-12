// /* eslint-disable @typescript-eslint/no-explicit-any */
// /*
//     Author: German Valencia
//     Pattern: PORTTOS Smart Widget - Curva de Productividad por Terminal (Consumo Autónomo SQL)
// */
// import {
//     Component,
//     Input,
//     ViewChild,
//     ElementRef,
//     OnInit,
//     AfterViewInit,
//     OnChanges,
//     SimpleChanges,
//     ViewEncapsulation,
//     OnDestroy,
//     ChangeDetectorRef
// } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { Chart, registerables } from 'chart.js';
// import { Subject } from 'rxjs';
// import { takeUntil } from 'rxjs/operators';

// import { DashboardService } from 'src/app/theme/shared/service/tablero-control/dashboard.service';
// import { MaritimoService } from 'src/app/theme/shared/service/tablero-control/maritimo.service';
// import { WidgetShellComponent } from 'src/app/theme/shared/components/widget-shell/widget-shell.component';

// Chart.register(...registerables);

// @Component({
//     selector: 'app-productividad-chart',
//     standalone: true,
//     imports: [CommonModule, WidgetShellComponent],
//     templateUrl: './productividad-chart.component.html',
//     styleUrls: ['./productividad-chart.component.scss'],
//     encapsulation: ViewEncapsulation.None
// })
// export class ProductividadChartComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy {
//     @Input() widgetConfig: any;
//     @Input() isEnfoque: boolean = false;
//     @Input() mostrarTabla: boolean = false;

//     // Respaldo cuando se abre en el modal de Modo Enfoque
//     @Input() datosVivos: any;

//     @ViewChild('productivityCanvas') productivityCanvas!: ElementRef<HTMLCanvasElement>;

//     public legendItems: Array<{ label: string; borderColor: string }> = [];
//     public chartInstance: Chart | null = null;
//     public cargando: boolean = true;
//     public tieneDatos: boolean = false;

//     private chartDataNormalizada: { labels: string[]; datasets: any[] } = { labels: [], datasets: [] };
//     private metadatosSQL: any = {};
//     private vistaLista: boolean = false;
//     private readonly destroy$ = new Subject<void>();

//     private readonly paletaTerminales: Record<string, string> = {
//         'SPRBUN': '#00d4ff',
//         'TCBUEN': '#a78bfa',
//         'AGUADULCE': '#00c896',
//         'SPIA': '#00c896',
//         'COMPAS': '#ffb547',
//         'GRUPO PORTUARIO': '#f472b6',
//         'GRUPOPORT': '#f472b6'
//     };

//     private readonly coloresRespaldo = ['#00d4ff', '#10b981', '#a78bfa', '#ffb547', '#f472b6', '#38bdf8'];

//     constructor(
//         private _maritimoService: MaritimoService,
//         private _torreService: DashboardService,
//         private cdr: ChangeDetectorRef
//     ) { }

//     ngOnInit(): void {
//         this.cargarProductividadTerminales();
//     }

//     ngAfterViewInit(): void {
//         this.vistaLista = true;
//         if (!this.cargando && this.tieneDatos) {
//             this.renderizarGrafica();
//         }
//     }

//     ngOnChanges(changes: SimpleChanges): void {
//         if (
//             (changes['widgetConfig'] && !changes['widgetConfig'].firstChange) ||
//             (changes['datosVivos'] && this.datosVivos)
//         ) {
//             this.cargarProductividadTerminales();
//         }

//         if (changes['isEnfoque'] && !changes['isEnfoque'].firstChange) {
//             setTimeout(() => {
//                 this.chartInstance?.resize();
//             }, 80);
//         }
//     }

//     ngOnDestroy(): void {
//         this.destroy$.next();
//         this.destroy$.complete();
//         if (this.chartInstance) {
//             this.chartInstance.destroy();
//         }
//     }

//     /**
//      * Consulta autónoma a SQL Server (TCL_ProductividadTerminales) filtrada por puerto
//      */
//     private cargarProductividadTerminales(): void {
//         // 1. Si viene precargado desde el modal de Modo Enfoque
//         if (
//             this.datosVivos &&
//             (this.datosVivos.chartData || this.datosVivos.datasets || Array.isArray(this.datosVivos))
//         ) {
//             this.procesarPayloadProductividad(this.datosVivos);
//             return;
//         }

//         const puerto = (this.widgetConfig?.puerto || 'BUENAVENTURA').trim().toUpperCase();
//         const codigoWidget = (this.widgetConfig?.type || this.widgetConfig?.codigoWidget || 'PTT_MAE_CHRT_PROD')
//             .trim()
//             .toUpperCase();

//         this.cargando = true;

//         this._maritimoService
//             .obtenerDatosWidgetMaritimo(puerto, codigoWidget)
//             .pipe(takeUntil(this.destroy$))
//             .subscribe({
//                 next: (respuestaSQL: any) => {
//                     this.procesarPayloadProductividad(respuestaSQL);
//                 },
//                 error: (err) => {
//                     console.error('❌ [SmartWidget ProductividadChart] Error consultando movs/h:', err);
//                     this.tieneDatos = false;
//                     this.cargando = false;
//                     this.cdr.detectChanges();
//                 }
//             });
//     }

//     /**
//      * Soporta 3 formatos:
//      * 1. { chartData: { labels, datasets }, legendItems }
//      * 2. { labels, datasets } directo
//      * 3. Filas SQL de TCL_ProductividadTerminales: [{ terminal, hora_etiqueta, movimientos_hora }]
//      */
//     private procesarPayloadProductividad(raw: any): void {
//         if (!raw) {
//             this.chartDataNormalizada = { labels: [], datasets: [] };
//             this.legendItems = [];
//             this.tieneDatos = false;
//             this.cargando = false;
//             this.cdr.detectChanges();
//             return;
//         }

//         this.metadatosSQL = Array.isArray(raw) ? {} : raw;
//         const bloqueGrafico = raw.chartData || raw;

//         if (bloqueGrafico.datasets && Array.isArray(bloqueGrafico.datasets) && bloqueGrafico.labels) {
//             const datasetsConEstilo = bloqueGrafico.datasets.map((ds: any, idx: number) => {
//                 const nombre = (ds.label || `Serie ${idx + 1}`).toUpperCase();
//                 const color =
//                     ds.borderColor ||
//                     ds.backgroundColor ||
//                     this.paletaTerminales[nombre] ||
//                     this.coloresRespaldo[idx % this.coloresRespaldo.length];

//                 return {
//                     ...ds,
//                     label: ds.label || `Serie ${idx + 1}`,
//                     borderColor: color,
//                     backgroundColor: ds.backgroundColor || `${color}1A`,
//                     tension: ds.tension ?? 0.35,
//                     pointRadius: ds.pointRadius ?? 3,
//                     borderWidth: ds.borderWidth ?? 2
//                 };
//             });

//             this.chartDataNormalizada = {
//                 labels: [...bloqueGrafico.labels],
//                 datasets: datasetsConEstilo
//             };

//             this.legendItems =
//                 raw.legendItems ||
//                 datasetsConEstilo.map((ds: any) => ({
//                     label: ds.label,
//                     borderColor: ds.borderColor
//                 }));
//         } else {
//             // Pivot automático de filas SQL desde TCL_ProductividadTerminales
//             const filas: any[] = Array.isArray(raw) ? raw : raw.rows || raw.data || [];
//             this.pivotearFilasProductividadSQL(filas);
//         }

//         this.tieneDatos =
//             this.chartDataNormalizada.labels.length > 0 &&
//             this.chartDataNormalizada.datasets.length > 0;
//         this.cargando = false;
//         this.cdr.detectChanges();

//         if (this.vistaLista && this.tieneDatos) {
//             setTimeout(() => this.renderizarGrafica(), 20);
//         }
//     }

//     private pivotearFilasProductividadSQL(filas: any[]): void {
//         if (!filas || filas.length === 0) {
//             this.chartDataNormalizada = { labels: [], datasets: [] };
//             this.legendItems = [];
//             return;
//         }

//         const horas = Array.from(new Set(filas.map((f: any) => f.hora_etiqueta || f.hora || '00h')));
//         const terminales = Array.from(new Set(filas.map((f: any) => f.terminal || f.id_terminal || 'Terminal')));

//         const datasets = terminales.map((term: string, idx: number) => {
//             const clave = term.toUpperCase();
//             const color = this.paletaTerminales[clave] || this.coloresRespaldo[idx % this.coloresRespaldo.length];

//             const serie = horas.map((h: string) => {
//                 const registro = filas.find(
//                     (f: any) => (f.terminal || f.id_terminal) === term && (f.hora_etiqueta || f.hora) === h
//                 );
//                 return registro ? Number(registro.movimientos_hora ?? registro.movimientos ?? 0) : 0;
//             });

//             return {
//                 label: term,
//                 data: serie,
//                 borderColor: color,
//                 backgroundColor: `${color}1A`,
//                 tension: 0.35,
//                 pointRadius: 3,
//                 borderWidth: 2,
//                 fill: idx === 0
//             };
//         });

//         this.chartDataNormalizada = { labels: horas, datasets };
//         this.legendItems = datasets.map((ds) => ({
//             label: ds.label,
//             borderColor: ds.borderColor
//         }));
//     }

//     public renderizarGrafica(): void {
//         if (!this.productivityCanvas || !this.productivityCanvas.nativeElement || !this.tieneDatos) return;

//         if (this.chartInstance) {
//             this.chartInstance.destroy();
//         }

//         const ctx = this.productivityCanvas.nativeElement.getContext('2d');
//         if (!ctx) return;

//         this.chartInstance = new Chart(ctx, {
//             type: 'line',
//             data: this.chartDataNormalizada,
//             options: {
//                 responsive: true,
//                 maintainAspectRatio: false,
//                 plugins: {
//                     legend: { display: false }
//                 },
//                 scales: {
//                     x: {
//                         grid: { display: false },
//                         ticks: { color: '#94a3b8' },
//                         border: { display: false }
//                     },
//                     y: {
//                         grid: { color: 'rgba(255,255,255,0.05)' },
//                         ticks: { color: '#94a3b8' },
//                         border: { display: false }
//                     }
//                 }
//             }
//         });
//     }

//     get data(): any {
//         return {
//             ...(this.widgetConfig?.data || {}),
//             ...this.metadatosSQL,
//             chartData: this.chartDataNormalizada,
//             legendItems: this.legendItems
//         };
//     }

//     public maximizarDesdeShell(): void {
//         if (this.isEnfoque) {
//             this._torreService.cerrarModoEnfoque();
//         } else {
//             this._torreService.abrirModoEnfoque(
//                 this.widgetConfig?.type || 'PTT_MAE_CHRT_PROD',
//                 this.data
//             );
//         }
//     }
// }
/* eslint-disable @typescript-eslint/no-explicit-any */
/*
    Author: German Valencia
    Pattern: PORTTOS Smart Widget - Curva de Productividad por Terminal (Consumo Autónomo SQL)
    Standard: PorttosChartHelper (Light & Dark Mode Ready)
*/
import {
    Component,
    Input,
    ViewChild,
    ElementRef,
    OnInit,
    AfterViewInit,
    OnChanges,
    SimpleChanges,
    ViewEncapsulation,
    OnDestroy,
    ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart } from 'chart.js';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { DashboardService } from 'src/app/theme/shared/service/tablero-control/dashboard.service';
import { MaritimoService } from 'src/app/theme/shared/service/tablero-control/maritimo.service';
import { WidgetShellComponent } from 'src/app/theme/shared/components/widget-shell/widget-shell.component';
import { PorttosChartHelper } from 'src/app/theme/shared/_helpers/chart.helper';

@Component({
    selector: 'app-productividad-chart',
    standalone: true,
    imports: [CommonModule, WidgetShellComponent],
    templateUrl: './productividad-chart.component.html',
    styleUrls: ['./productividad-chart.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class ProductividadChartComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy {
    @Input() widgetConfig: any;
    @Input() isEnfoque: boolean = false;
    @Input() mostrarTabla: boolean = false;

    // Respaldo cuando se abre en el modal de Modo Enfoque
    @Input() datosVivos: any;

    @ViewChild('productivityCanvas') productivityCanvas!: ElementRef<HTMLCanvasElement>;

    public legendItems: Array<{ label: string; borderColor: string }> = [];
    public chartInstance?: Chart;
    public cargando: boolean = true;
    public tieneDatos: boolean = false;

    private chartDataNormalizada: { labels: string[]; datasets: any[] } = { labels: [], datasets: [] };
    private metadatosSQL: any = {};
    private vistaLista: boolean = false;
    private readonly destroy$ = new Subject<void>();

    private readonly paletaTerminales: Record<string, string> = {
        'SPRBUN': '#00d4ff',
        'TCBUEN': '#8b5cf6',
        'AGUADULCE': '#10b981',
        'SPIA': '#10b981',
        'COMPAS': '#f59e0b',
        'GRUPO PORTUARIO': '#ec4899',
        'GRUPOPORT': '#ec4899'
    };

    constructor(
        private _maritimoService: MaritimoService,
        private _torreService: DashboardService,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit(): void {
        this.cargarProductividadTerminales();
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
            this.cargarProductividadTerminales();
        }

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
     * Consulta autónoma a SQL Server (TCL_ProductividadTerminales) filtrada por puerto
     */
    private cargarProductividadTerminales(): void {
        // 1. Si viene precargado desde el modal de Modo Enfoque
        if (
            this.datosVivos &&
            (this.datosVivos.chartData || this.datosVivos.datasets || Array.isArray(this.datosVivos))
        ) {
            this.procesarPayloadProductividad(this.datosVivos);
            return;
        }

        const puerto = (this.widgetConfig?.puerto || 'BUENAVENTURA').trim().toUpperCase();
        const codigoWidget = (
            this.widgetConfig?.type ||
            this.widgetConfig?.codigoWidget ||
            'PTT_MAE_CHRT_PROD'
        )
            .trim()
            .toUpperCase();

        this.cargando = true;

        this._maritimoService
            .obtenerDatosWidgetMaritimo(puerto, codigoWidget)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (respuestaSQL: any) => {
                    this.procesarPayloadProductividad(respuestaSQL);
                },
                error: (err) => {
                    console.error('❌ [SmartWidget ProductividadChart] Error consultando movs/h:', err);
                    this.tieneDatos = false;
                    this.cargando = false;
                    this.cdr.detectChanges();
                }
            });
    }

    /**
     * Soporta 3 formatos:
     * 1. { chartData: { labels, datasets }, legendItems }
     * 2. { labels, datasets } directo
     * 3. Filas SQL de TCL_ProductividadTerminales: [{ terminal, hora_etiqueta, movimientos_hora }]
     */
    private procesarPayloadProductividad(raw: any): void {
        if (!raw) {
            this.chartDataNormalizada = { labels: [], datasets: [] };
            this.legendItems = [];
            this.tieneDatos = false;
            this.cargando = false;
            this.cdr.detectChanges();
            return;
        }

        this.metadatosSQL = Array.isArray(raw) ? {} : raw;
        const bloqueGrafico = raw.chartData || raw;

        if (bloqueGrafico.datasets && Array.isArray(bloqueGrafico.datasets) && bloqueGrafico.labels) {
            const datasetsConEstilo = bloqueGrafico.datasets.map((ds: any, idx: number) => {
                const nombre = String(ds.label || `Serie ${idx + 1}`).toUpperCase();
                const color =
                    ds.borderColor ||
                    ds.color ||
                    this.paletaTerminales[nombre] ||
                    PorttosChartHelper.PALETA_DEFAULT[idx % PorttosChartHelper.PALETA_DEFAULT.length];

                return {
                    ...ds,
                    label: ds.label || `Serie ${idx + 1}`,
                    data: (ds.data || []).map((v: any) => Number(v || 0)),
                    borderColor: color,
                    color,
                    relleno: Boolean(ds.fill ?? (idx === 0))
                };
            });

            this.chartDataNormalizada = {
                labels: bloqueGrafico.labels.map((l: any) => String(l)),
                datasets: datasetsConEstilo
            };

            this.legendItems =
                raw.legendItems ||
                datasetsConEstilo.map((ds: any) => ({
                    label: ds.label,
                    borderColor: ds.borderColor
                }));
        } else {
            // Pivot automático de filas SQL desde TCL_ProductividadTerminales
            const filas: any[] = Array.isArray(raw) ? raw : raw.rows || raw.data || [];
            this.pivotearFilasProductividadSQL(filas);
        }

        this.tieneDatos =
            this.chartDataNormalizada.labels.length > 0 &&
            this.chartDataNormalizada.datasets.length > 0;
        this.cargando = false;
        this.cdr.detectChanges();

        if (this.vistaLista && this.tieneDatos) {
            setTimeout(() => this.renderizarGrafica(), 20);
        }
    }

    private pivotearFilasProductividadSQL(filas: any[]): void {
        if (!filas || filas.length === 0) {
            this.chartDataNormalizada = { labels: [], datasets: [] };
            this.legendItems = [];
            return;
        }

        const horas = Array.from(new Set(filas.map((f: any) => String(f.hora_etiqueta || f.hora || '00h'))));
        const terminales = Array.from(
            new Set(filas.map((f: any) => String(f.terminal || f.id_terminal || 'Terminal')))
        );

        const datasets = terminales.map((term: string, idx: number) => {
            const clave = term.toUpperCase();
            const color =
                this.paletaTerminales[clave] ||
                PorttosChartHelper.PALETA_DEFAULT[idx % PorttosChartHelper.PALETA_DEFAULT.length];

            const serie = horas.map((h: string) => {
                const registro = filas.find(
                    (f: any) =>
                        String(f.terminal || f.id_terminal) === term &&
                        String(f.hora_etiqueta || f.hora) === h
                );
                return registro ? Number(registro.movimientos_hora ?? registro.movimientos ?? 0) : 0;
            });

            return {
                label: term,
                data: serie,
                borderColor: color,
                color,
                relleno: idx === 0
            };
        });

        this.chartDataNormalizada = { labels: horas, datasets };
        this.legendItems = datasets.map((ds) => ({
            label: ds.label,
            borderColor: ds.borderColor
        }));
    }

    /**
     * Renderizado estandarizado con PorttosChartHelper.renderizarLinea
     */
    public renderizarGrafica(): void {
        if (!this.vistaLista || !this.tieneDatos || !this.productivityCanvas?.nativeElement) return;

        this.chartInstance = PorttosChartHelper.renderizarLinea(
            this.productivityCanvas,
            this.chartInstance,
            {
                labels: this.chartDataNormalizada.labels,
                datasets: this.chartDataNormalizada.datasets.map((ds: any, idx: number) => ({
                    label: ds.label || `Terminal ${idx + 1}`,
                    data: (ds.data || []).map((v: any) => Number(v || 0)),
                    color: ds.color || ds.borderColor,
                    relleno: Boolean(ds.relleno ?? ds.fill ?? (idx === 0))
                })),
                unidad: 'Mov/h',
                isEnfoque: this.isEnfoque
            }
        );
    }

    get data(): any {
        return {
            ...(this.widgetConfig?.data || {}),
            ...this.metadatosSQL,
            chartData: this.chartDataNormalizada,
            legendItems: this.legendItems
        };
    }

    public maximizarDesdeShell(): void {
        if (this.isEnfoque) {
            this._torreService.cerrarModoEnfoque();
        } else {
            this._torreService.abrirModoEnfoque(
                this.widgetConfig?.type || 'PTT_MAE_CHRT_PROD',
                this.data
            );
        }
    }
}
