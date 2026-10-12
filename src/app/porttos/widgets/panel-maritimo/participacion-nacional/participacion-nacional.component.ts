// /* eslint-disable @typescript-eslint/no-explicit-any */
// /*
//     Author: German Valencia
//     Pattern: PORTTOS Smart Widget - Participación por Terminal (Consumo Autónomo SQL)
// */
// import {
//     Component,
//     Input,
//     ViewChild,
//     ElementRef,
//     OnInit,
//     AfterViewInit,
//     OnChanges,
//     OnDestroy,
//     SimpleChanges,
//     ViewEncapsulation,
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
//     selector: 'app-participacion-nacional',
//     standalone: true,
//     imports: [CommonModule, WidgetShellComponent],
//     templateUrl: './participacion-nacional.component.html',
//     styleUrls: ['./participacion-nacional.component.scss'],
//     encapsulation: ViewEncapsulation.None
// })
// export class ParticipacionNacionalComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy {
//     @Input() widgetConfig: any;
//     @Input() isEnfoque: boolean = false;
//     @Input() mostrarTabla: boolean = false;

//     // Respaldo cuando se abre en el modal de Modo Enfoque
//     @Input() datosVivos: any;

//     @ViewChild('donutChart') donutChart!: ElementRef<HTMLCanvasElement>;
//     public chartInstance: Chart | null = null;
//     public cargando: boolean = true;
//     public tieneDatos: boolean = false;

//     private labelsNormalizados: string[] = [];
//     private valoresNormalizados: number[] = [];
//     private coloresNormalizados: string[] = [];
//     private metadatosSQL: any = {};
//     private vistaLista: boolean = false;
//     private readonly destroy$ = new Subject<void>();

//     private readonly paletaTerminales: Record<string, string> = {
//         'SPRBUN': '#00d4ff',
//         'SPIA': '#00c896',
//         'AGUADULCE': '#00c896',
//         'TCBUEN': '#a78bfa',
//         'COMPAS': '#ffb547',
//         'GRUPOPORT': '#ff5b6e',
//         'GRUPO PORTUARIO': '#ff5b6e'
//     };

//     private readonly coloresBase = ['#3b82f6', '#0ea5e9', '#10b981', '#f59e0b', '#a78bfa', '#ef4444'];

//     constructor(
//         private _maritimoService: MaritimoService,
//         private _torreService: DashboardService,
//         private cdr: ChangeDetectorRef
//     ) { }

//     ngOnInit(): void {
//         this.cargarParticipacionTerminales();
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
//             this.cargarParticipacionTerminales();
//         }

//         if (changes['isEnfoque'] && !changes['isEnfoque'].firstChange) {
//             setTimeout(() => {
//                 this.chartInstance?.resize();
//             }, 60);
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
//      * Consulta autónoma a SQL Server (TCL_TraficoPortuarioMaritimo / TCL_HistoricosSupertransporte)
//      */
//     private cargarParticipacionTerminales(): void {
//         // 1. Si viene precargado desde el modal de Modo Enfoque
//         if (
//             this.datosVivos &&
//             (this.datosVivos.valores || this.datosVivos.datasets || Array.isArray(this.datosVivos))
//         ) {
//             this.procesarPayloadParticipacion(this.datosVivos);
//             return;
//         }

//         const puerto = (this.widgetConfig?.puerto || 'BUENAVENTURA').trim().toUpperCase();
//         const codigoWidget = (this.widgetConfig?.type || this.widgetConfig?.codigoWidget || 'PTT_MAE_CHRT_PART_TERM')
//             .trim()
//             .toUpperCase();

//         this.cargando = true;

//         this._maritimoService
//             .obtenerDatosWidgetMaritimo(puerto, codigoWidget)
//             .pipe(takeUntil(this.destroy$))
//             .subscribe({
//                 next: (respuestaSQL: any) => {
//                     this.procesarPayloadParticipacion(respuestaSQL);
//                 },
//                 error: (err) => {
//                     console.error('❌ [SmartWidget ParticipacionNacional] Error consultando participación:', err);
//                     this.tieneDatos = false;
//                     this.cargando = false;
//                     this.cdr.detectChanges();
//                 }
//             });
//     }

//     /**
//      * Soporta 3 estructuras:
//      * 1. { labels: [...], valores: [...] }
//      * 2. Chart.js estándar: { labels: [...], datasets: [{ data: [...], backgroundColor: [...] }] }
//      * 3. Filas SQL de TCL_TraficoPortuarioMaritimo / TCL_HistoricosSupertransporte
//      */
//     private procesarPayloadParticipacion(raw: any): void {
//         if (!raw) {
//             this.labelsNormalizados = [];
//             this.valoresNormalizados = [];
//             this.tieneDatos = false;
//             this.cargando = false;
//             this.cdr.detectChanges();
//             return;
//         }

//         this.metadatosSQL = Array.isArray(raw) ? {} : raw;

//         if (Array.isArray(raw.labels) && Array.isArray(raw.valores)) {
//             this.labelsNormalizados = [...raw.labels];
//             this.valoresNormalizados = raw.valores.map((v: any) => Number(v || 0));
//             this.coloresNormalizados = this.resolverColores(this.labelsNormalizados, raw.colores);
//         } else if (Array.isArray(raw.labels) && Array.isArray(raw.datasets) && raw.datasets[0]) {
//             this.labelsNormalizados = [...raw.labels];
//             this.valoresNormalizados = (raw.datasets[0].data || []).map((v: any) => Number(v || 0));
//             this.coloresNormalizados = this.resolverColores(
//                 this.labelsNormalizados,
//                 raw.datasets[0].backgroundColor
//             );
//         } else {
//             // Agregación directa de filas SQL por sociedadPortuaria / sociedad_portuaria
//             const filas: any[] = Array.isArray(raw) ? raw : raw.rows || raw.data || [];
//             this.calcularParticipacionDesdeSQL(filas);
//         }

//         this.tieneDatos =
//             this.labelsNormalizados.length > 0 &&
//             this.valoresNormalizados.some((v) => v > 0);
//         this.cargando = false;
//         this.cdr.detectChanges();

//         if (this.vistaLista && this.tieneDatos) {
//             setTimeout(() => this.renderizarGrafica(), 20);
//         }
//     }

//     private calcularParticipacionDesdeSQL(filas: any[]): void {
//         if (!filas || filas.length === 0) {
//             this.labelsNormalizados = [];
//             this.valoresNormalizados = [];
//             return;
//         }

//         const acumuladoPorTerminal = new Map<string, number>();

//         filas.forEach((f: any) => {
//             const term = (
//                 f.sociedadPortuaria ||
//                 f.sociedad_portuaria ||
//                 f.id_terminal ||
//                 f.terminal ||
//                 'OTROS'
//             ).trim();

//             const volumen =
//                 f.participacion_pct !== undefined
//                     ? Number(f.participacion_pct)
//                     : f.totalToneladas !== undefined
//                         ? Number(f.totalToneladas)
//                         : f.total_toneladas !== undefined
//                             ? Number(f.total_toneladas)
//                             : Number(f.exportacion || 0) +
//                             Number(f.importacion || 0) +
//                             Number(f.transbordo || 0) +
//                             Number(f.cabotaje || 0);

//             acumuladoPorTerminal.set(term, (acumuladoPorTerminal.get(term) || 0) + volumen);
//         });

//         const totalPuerto = Array.from(acumuladoPorTerminal.values()).reduce((a, b) => a + b, 0);
//         const entradasOrdenadas = Array.from(acumuladoPorTerminal.entries()).sort((a, b) => b[1] - a[1]);

//         this.labelsNormalizados = entradasOrdenadas.map(([nombre]) => nombre);
//         this.valoresNormalizados = entradasOrdenadas.map(([, vol]) =>
//             totalPuerto > 0 ? Number(((vol / totalPuerto) * 100).toFixed(1)) : 0
//         );
//         this.coloresNormalizados = this.resolverColores(this.labelsNormalizados);
//     }

//     private resolverColores(labels: string[], coloresCustom?: string[]): string[] {
//         if (Array.isArray(coloresCustom) && coloresCustom.length >= labels.length) {
//             return coloresCustom;
//         }
//         return labels.map((lbl, idx) => {
//             const key = lbl.toUpperCase();
//             return this.paletaTerminales[key] || this.coloresBase[idx % this.coloresBase.length];
//         });
//     }

//     public renderizarGrafica(): void {
//         if (!this.donutChart?.nativeElement || !this.tieneDatos) return;

//         if (this.chartInstance) {
//             this.chartInstance.destroy();
//         }

//         this.chartInstance = new Chart(this.donutChart.nativeElement, {
//             type: 'doughnut',
//             data: {
//                 labels: this.labelsNormalizados,
//                 datasets: [
//                     {
//                         data: this.valoresNormalizados,
//                         backgroundColor: this.coloresNormalizados,
//                         borderWidth: 0,
//                         hoverOffset: 4
//                     }
//                 ]
//             },
//             options: {
//                 responsive: true,
//                 maintainAspectRatio: false,
//                 cutout: '45%',
//                 plugins: {
//                     legend: {
//                         display: true,
//                         position: 'bottom',
//                         labels: {
//                             color: '#94a3b8',
//                             usePointStyle: true,
//                             pointStyle: 'rect',
//                             padding: 16,
//                             font: {
//                                 size: 10,
//                                 weight: 'bold'
//                             }
//                         }
//                     },
//                     tooltip: {
//                         callbacks: {
//                             label: (context) => ` ${context.label}: ${context.raw}%`
//                         }
//                     }
//                 }
//             }
//         });
//     }

//     get data(): any {
//         return {
//             ...(this.widgetConfig?.data || {}),
//             ...this.metadatosSQL,
//             labels: this.labelsNormalizados,
//             valores: this.valoresNormalizados,
//             colores: this.coloresNormalizados
//         };
//     }

//     get isLoading(): boolean {
//         return this.cargando;
//     }

//     public maximizarDesdeShell(): void {
//         if (this.isEnfoque) {
//             this._torreService.cerrarModoEnfoque();
//         } else {
//             this._torreService.abrirModoEnfoque(
//                 this.widgetConfig?.type || 'PTT_MAE_CHRT_PART_TERM',
//                 this.data
//             );
//         }
//     }
// }
/* eslint-disable @typescript-eslint/no-explicit-any */
/*
    Author: German Valencia
    Pattern: PORTTOS Smart Widget - Participación por Terminal (Consumo Autónomo SQL)
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
    OnDestroy,
    SimpleChanges,
    ViewEncapsulation,
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
    ILeyendaDonaItem
} from 'src/app/theme/shared/_helpers/chart.helper';

@Component({
    selector: 'app-participacion-nacional',
    standalone: true,
    imports: [CommonModule, WidgetShellComponent],
    templateUrl: './participacion-nacional.component.html',
    styleUrls: ['./participacion-nacional.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class ParticipacionNacionalComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy {
    @Input() widgetConfig: any;
    @Input() isEnfoque: boolean = false;
    @Input() mostrarTabla: boolean = false;

    // Respaldo cuando se abre en el modal de Modo Enfoque
    @Input() datosVivos: any;

    @ViewChild('donutChart') donutChart!: ElementRef<HTMLCanvasElement>;

    public chartInstance?: Chart;
    public cargando: boolean = true;
    public tieneDatos: boolean = false;
    public leyendaItems: ILeyendaDonaItem[] = [];

    private labelsNormalizados: string[] = [];
    private valoresNormalizados: number[] = [];
    private coloresNormalizados: string[] = [];
    private metadatosSQL: any = {};
    private vistaLista: boolean = false;
    private readonly destroy$ = new Subject<void>();

    private readonly paletaTerminales: Record<string, string> = {
        'SPRBUN': '#00d4ff',
        'SPIA': '#10b981',
        'AGUADULCE': '#10b981',
        'TCBUEN': '#8b5cf6',
        'COMPAS': '#f59e0b',
        'GRUPOPORT': '#ef4444',
        'GRUPO PORTUARIO': '#ef4444'
    };

    constructor(
        private _maritimoService: MaritimoService,
        private _torreService: DashboardService,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit(): void {
        this.cargarParticipacionTerminales();
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
            this.cargarParticipacionTerminales();
        }

        if (changes['isEnfoque'] && !changes['isEnfoque'].firstChange) {
            setTimeout(() => {
                this.chartInstance?.resize();
            }, 60);
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
     * Consulta autónoma a SQL Server (TCL_TraficoPortuarioMaritimo / TCL_HistoricosSupertransporte)
     */
    private cargarParticipacionTerminales(): void {
        // 1. Si viene precargado desde el modal de Modo Enfoque
        if (
            this.datosVivos &&
            (this.datosVivos.valores || this.datosVivos.datasets || Array.isArray(this.datosVivos))
        ) {
            this.procesarPayloadParticipacion(this.datosVivos);
            return;
        }

        const puerto = (this.widgetConfig?.puerto || 'BUENAVENTURA').trim().toUpperCase();
        const codigoWidget = (
            this.widgetConfig?.type ||
            this.widgetConfig?.codigoWidget ||
            'PTT_MAE_CHRT_PART_TERM'
        )
            .trim()
            .toUpperCase();

        this.cargando = true;

        this._maritimoService
            .obtenerDatosWidgetMaritimo(puerto, codigoWidget)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (respuestaSQL: any) => {
                    this.procesarPayloadParticipacion(respuestaSQL);
                },
                error: (err) => {
                    console.error('❌ [SmartWidget ParticipacionNacional] Error consultando participación:', err);
                    this.tieneDatos = false;
                    this.cargando = false;
                    this.cdr.detectChanges();
                }
            });
    }

    /**
     * Soporta 3 estructuras:
     * 1. { labels: [...], valores: [...] }
     * 2. Chart.js estándar: { labels: [...], datasets: [{ data: [...], backgroundColor: [...] }] }
     * 3. Filas SQL de TCL_TraficoPortuarioMaritimo / TCL_HistoricosSupertransporte
     */
    private procesarPayloadParticipacion(raw: any): void {
        if (!raw) {
            this.labelsNormalizados = [];
            this.valoresNormalizados = [];
            this.leyendaItems = [];
            this.tieneDatos = false;
            this.cargando = false;
            this.cdr.detectChanges();
            return;
        }

        this.metadatosSQL = Array.isArray(raw) ? {} : raw;

        if (Array.isArray(raw.labels) && Array.isArray(raw.valores)) {
            this.labelsNormalizados = [...raw.labels];
            this.valoresNormalizados = raw.valores.map((v: any) => Number(v || 0));
            this.coloresNormalizados = this.resolverColores(this.labelsNormalizados, raw.colores);
        } else if (Array.isArray(raw.labels) && Array.isArray(raw.datasets) && raw.datasets[0]) {
            this.labelsNormalizados = [...raw.labels];
            this.valoresNormalizados = (raw.datasets[0].data || []).map((v: any) => Number(v || 0));
            this.coloresNormalizados = this.resolverColores(
                this.labelsNormalizados,
                raw.datasets[0].backgroundColor
            );
        } else {
            // Agregación directa de filas SQL por sociedadPortuaria / sociedad_portuaria
            const filas: any[] = Array.isArray(raw) ? raw : raw.rows || raw.data || [];
            this.calcularParticipacionDesdeSQL(filas);
        }

        const { total, items } = PorttosChartHelper.calcularLeyendaDona(
            this.labelsNormalizados,
            this.valoresNormalizados,
            this.coloresNormalizados
        );

        this.leyendaItems = items;
        this.tieneDatos = this.labelsNormalizados.length > 0 && total > 0;
        this.cargando = false;

        // Actualizamos la vista antes de medir el canvas
        this.cdr.detectChanges();

        if (this.vistaLista && this.tieneDatos) {
            setTimeout(() => this.renderizarGrafica(), 20);
        }
    }

    private calcularParticipacionDesdeSQL(filas: any[]): void {
        if (!filas || filas.length === 0) {
            this.labelsNormalizados = [];
            this.valoresNormalizados = [];
            this.coloresNormalizados = [];
            return;
        }

        const acumuladoPorTerminal = new Map<string, number>();

        filas.forEach((f: any) => {
            const term = (
                f.sociedadPortuaria ||
                f.sociedad_portuaria ||
                f.id_terminal ||
                f.terminal ||
                'OTROS'
            ).trim();

            const volumen =
                f.participacion_pct !== undefined
                    ? Number(f.participacion_pct)
                    : f.totalToneladas !== undefined
                        ? Number(f.totalToneladas)
                        : f.total_toneladas !== undefined
                            ? Number(f.total_toneladas)
                            : Number(f.exportacion || 0) +
                            Number(f.importacion || 0) +
                            Number(f.transbordo || 0) +
                            Number(f.cabotaje || 0);

            acumuladoPorTerminal.set(term, (acumuladoPorTerminal.get(term) || 0) + volumen);
        });

        const totalPuerto = Array.from(acumuladoPorTerminal.values()).reduce((a, b) => a + b, 0);
        const entradasOrdenadas = Array.from(acumuladoPorTerminal.entries()).sort((a, b) => b[1] - a[1]);

        this.labelsNormalizados = entradasOrdenadas.map(([nombre]) => nombre);
        this.valoresNormalizados = entradasOrdenadas.map(([, vol]) =>
            totalPuerto > 0 ? Number(((vol / totalPuerto) * 100).toFixed(1)) : 0
        );
        this.coloresNormalizados = this.resolverColores(this.labelsNormalizados);
    }

    private resolverColores(labels: string[], coloresCustom?: string[]): string[] {
        if (Array.isArray(coloresCustom) && coloresCustom.length >= labels.length) {
            return coloresCustom;
        }
        return labels.map((lbl, idx) => {
            const key = String(lbl || '').toUpperCase();
            return (
                this.paletaTerminales[key] ||
                PorttosChartHelper.PALETA_DEFAULT[idx % PorttosChartHelper.PALETA_DEFAULT.length]
            );
        });
    }

    public renderizarGrafica(): void {
        if (!this.vistaLista || !this.tieneDatos || !this.donutChart?.nativeElement) return;

        this.chartInstance = PorttosChartHelper.renderizarDona(
            this.donutChart,
            this.chartInstance,
            this.labelsNormalizados,
            this.valoresNormalizados,
            '%',
            this.coloresNormalizados
        );
    }

    get data(): any {
        return {
            ...(this.widgetConfig?.data || {}),
            ...this.metadatosSQL,
            labels: this.labelsNormalizados,
            valores: this.valoresNormalizados,
            colores: this.coloresNormalizados
        };
    }

    get isLoading(): boolean {
        return this.cargando;
    }

    public maximizarDesdeShell(): void {
        if (this.isEnfoque) {
            this._torreService.cerrarModoEnfoque();
        } else {
            this._torreService.abrirModoEnfoque(
                this.widgetConfig?.type || 'PTT_MAE_CHRT_PART_TERM',
                this.data
            );
        }
    }
}
