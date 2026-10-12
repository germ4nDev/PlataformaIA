// // /*
// //     Author: German Valencia
// //     Pattern: PORTTOS Generic Widget - Histórico Anual (Refactorizado Dumb Component)
// // */
// // import { Component, Input, ViewChild, ElementRef, AfterViewInit, OnChanges, SimpleChanges, ViewEncapsulation } from '@angular/core';
// // import { CommonModule } from '@angular/common';
// // import { Chart, registerables } from 'chart.js';
// // import { DashboardService } from 'src/app/theme/shared/service/tablero-control/dashboard.service';

// // // 🟢 Importamos el Shell maestro
// // import { WidgetShellComponent } from 'src/app/theme/shared/components/widget-shell/widget-shell.component';

// // Chart.register(...registerables);

// // @Component({
// //     selector: 'app-historico-anual',
// //     standalone: true,
// //     imports: [CommonModule, WidgetShellComponent],
// //     templateUrl: './historico-anual.component.html',
// //     styleUrls: ['./historico-anual.component.scss'],
// //     encapsulation: ViewEncapsulation.None
// // })
// // export class HistoricoAnualComponent implements AfterViewInit, OnChanges {

// //     // 🟢 NUEVO ESTÁNDAR: Inputs requeridos por el selector dinámico
// //     @Input() widgetConfig: any;
// //     @Input() isEnfoque: boolean = false;
// //     @Input() mostrarTabla: boolean = false;

// //     // 🟢 LA NUEVA COMPUERTA: Recibe los datos vivos directamente
// //     @Input() datosVivos: any;

// //     @ViewChild('lineChart') lineChart!: ElementRef;
// //     chartInstance: any;

// //     constructor(
// //         private _torreService: DashboardService
// //     ) { }

// //     // 🟢 EL CEREBRO REACTIVO
// //     get data() {
// //         if (!this.widgetConfig) return {};

// //         const configBase = this.widgetConfig.data || {};

// //         // Priorizamos la data inyectada viva; si no viene, usamos la configuración base
// //         const labels = this.datosVivos?.labels || configBase.labels;
// //         const valores = this.datosVivos?.valores || configBase.valores;

// //         return {
// //             ...configBase,
// //             labels: labels,
// //             valores: valores
// //         };
// //     }

// //     get isLoading(): boolean {
// //         // En este widget asumimos que siempre dibuja, si no hay datos vivos usa el fallback quemado abajo
// //         return !this.widgetConfig && !this.datosVivos;
// //     }

// //     ngAfterViewInit() {
// //         this.renderizar();
// //     }

// //     ngOnChanges(changes: SimpleChanges) {
// //         // 🟢 Reaccionamos si cambian los datos visuales o los datos inyectados
// //         if (changes['widgetConfig'] || changes['datosVivos']) {
// //             if (!changes['widgetConfig']?.firstChange) {
// //                 this.renderizar();
// //             }
// //         }

// //         // Si entra en modo enfoque, redimensionamos después de un tick
// //         if (changes['isEnfoque'] && !changes['isEnfoque'].firstChange) {
// //             setTimeout(() => {
// //                 if (this.chartInstance) {
// //                     this.chartInstance.resize();
// //                 }
// //             }, 50);
// //         }
// //     }

// //     renderizar() {
// //         if (!this.lineChart) return;
// //         if (this.chartInstance) this.chartInstance.destroy();

// //         const ctx = this.lineChart.nativeElement.getContext('2d');
// //         const gradient = ctx.createLinearGradient(0, 0, 0, 300);
// //         gradient.addColorStop(0, 'rgba(6, 182, 212, 0.5)');
// //         gradient.addColorStop(1, 'rgba(6, 182, 212, 0.0)');

// //         // Usamos la data computada; si no hay, usamos valores por defecto
// //         const labels = this.data?.labels || ['2018', '2019', '2020', '2021', '2022', '2023', '2024', '2025'];
// //         const valores = this.data?.valores || [25.5, 20.8, 17.4, 18.0, 19.8, 19.0, 20.7, 23.1];

// //         this.chartInstance = new Chart(ctx, {
// //             type: 'line',
// //             data: {
// //                 labels: labels,
// //                 datasets: [{
// //                     data: valores,
// //                     borderColor: '#06b6d4',
// //                     backgroundColor: gradient,
// //                     borderWidth: 2,
// //                     pointBackgroundColor: '#06b6d4',
// //                     pointRadius: 4,
// //                     fill: true,
// //                     tension: 0.4
// //                 }]
// //             },
// //             options: {
// //                 responsive: true,
// //                 maintainAspectRatio: false,
// //                 plugins: { legend: { display: false } },
// //                 scales: {
// //                     x: {
// //                         grid: { color: 'rgba(255,255,255,0.05)' },
// //                         ticks: { color: '#94a3b8', font: { size: 10 } },
// //                         border: { display: false }
// //                     },
// //                     y: {
// //                         grid: { color: 'rgba(255,255,255,0.05)' },
// //                         ticks: { color: '#94a3b8', font: { size: 10 }, callback: (v) => v + 'Mt' },
// //                         border: { display: false }
// //                     }
// //                 }
// //             }
// //         });
// //     }

// //     // 🟢 Toggle de enfoque: Abre o cierra el modal
// //     maximizarDesdeShell() {
// //         if (this.isEnfoque) {
// //             this._torreService.cerrarModoEnfoque();
// //         } else {
// //             this._torreService.abrirModoEnfoque(this.widgetConfig?.type || 'WDG_PORT_HISTORICO', this.data);
// //         }
// //     }
// // }
// /* eslint-disable @typescript-eslint/no-explicit-any */
// /*
//     Author: German Valencia
//     Pattern: PORTTOS Smart Widget - Histórico Anual Supertransporte (Consumo Autónomo SQL)
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
//     selector: 'app-historico-anual',
//     standalone: true,
//     imports: [CommonModule, WidgetShellComponent],
//     templateUrl: './historico-anual.component.html',
//     styleUrls: ['./historico-anual.component.scss'],
//     encapsulation: ViewEncapsulation.None
// })
// export class HistoricoAnualComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy {
//     @Input() widgetConfig: any;
//     @Input() isEnfoque: boolean = false;
//     @Input() mostrarTabla: boolean = false;

//     // Respaldo cuando se abre en el modal de Modo Enfoque
//     @Input() datosVivos: any;

//     @ViewChild('lineChart') lineChart!: ElementRef<HTMLCanvasElement>;
//     public chartInstance: Chart | null = null;
//     public cargando: boolean = true;
//     public tieneDatos: boolean = false;

//     private labelsNormalizados: string[] = [];
//     private valoresNormalizados: number[] = [];
//     private rangoCalculado: string = '';
//     private metadatosSQL: any = {};
//     private vistaLista: boolean = false;
//     private readonly destroy$ = new Subject<void>();

//     constructor(
//         private _maritimoService: MaritimoService,
//         private _torreService: DashboardService,
//         private cdr: ChangeDetectorRef
//     ) { }

//     ngOnInit(): void {
//         this.cargarHistoricoAnual();
//     }

//     ngAfterViewInit(): void {
//         this.vistaLista = true;
//         if (!this.cargando && this.tieneDatos) {
//             this.renderizar();
//         }
//     }

//     ngOnChanges(changes: SimpleChanges): void {
//         if (
//             (changes['widgetConfig'] && !changes['widgetConfig'].firstChange) ||
//             (changes['datosVivos'] && this.datosVivos)
//         ) {
//             this.cargarHistoricoAnual();
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
//      * Consulta autónoma a SQL Server (TCL_HistoricosSupertransporte / TCL_TraficoPortuarioMaritimo)
//      */
//     private cargarHistoricoAnual(): void {
//         // 1. Si viene precargado desde el modal de Modo Enfoque
//         if (
//             this.datosVivos &&
//             (this.datosVivos.valores || this.datosVivos.datasets || Array.isArray(this.datosVivos))
//         ) {
//             this.procesarPayloadHistorico(this.datosVivos);
//             return;
//         }

//         const puerto = (this.widgetConfig?.puerto || 'BUENAVENTURA').trim().toUpperCase();
//         const codigoWidget = (this.widgetConfig?.type || this.widgetConfig?.codigoWidget || 'PTT_MAE_CHRT_HISTORICO')
//             .trim()
//             .toUpperCase();

//         this.cargando = true;

//         this._maritimoService
//             .obtenerDatosWidgetMaritimo(puerto, codigoWidget)
//             .pipe(takeUntil(this.destroy$))
//             .subscribe({
//                 next: (respuestaSQL: any) => {
//                     this.procesarPayloadHistorico(respuestaSQL);
//                 },
//                 error: (err) => {
//                     console.error('❌ [SmartWidget HistoricoAnual] Error consultando serie anual:', err);
//                     this.tieneDatos = false;
//                     this.cargando = false;
//                     this.cdr.detectChanges();
//                 }
//             });
//     }

//     /**
//      * Soporta 3 estructuras:
//      * 1. { labels: [...], valores: [...] }
//      * 2. Chart.js estándar: { labels: [...], datasets: [{ data: [...] }] }
//      * 3. Filas SQL de TCL_HistoricosSupertransporte (anio, total_toneladas) o TCL_TraficoPortuarioMaritimo (anioVigencia)
//      */
//     private procesarPayloadHistorico(raw: any): void {
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
//             this.labelsNormalizados = raw.labels.map((l: any) => String(l));
//             this.normalizarEscalaMillones(raw.valores.map((v: any) => Number(v || 0)));
//         } else if (Array.isArray(raw.labels) && Array.isArray(raw.datasets) && raw.datasets[0]) {
//             this.labelsNormalizados = raw.labels.map((l: any) => String(l));
//             this.normalizarEscalaMillones((raw.datasets[0].data || []).map((v: any) => Number(v || 0)));
//         } else {
//             // Agregación directa de filas SQL por año (anio / anioVigencia)
//             const filas: any[] = Array.isArray(raw) ? raw : raw.rows || raw.data || [];
//             this.calcularSerieAnualDesdeSQL(filas);
//         }

//         if (this.labelsNormalizados.length > 0) {
//             const primerAnio = this.labelsNormalizados[0];
//             const ultimoAnio = this.labelsNormalizados[this.labelsNormalizados.length - 1];
//             this.rangoCalculado = raw.rango || (primerAnio !== ultimoAnio ? `${primerAnio}-${ultimoAnio}` : primerAnio);
//         }

//         this.tieneDatos =
//             this.labelsNormalizados.length > 0 &&
//             this.valoresNormalizados.some((v) => v > 0);
//         this.cargando = false;
//         this.cdr.detectChanges();

//         if (this.vistaLista && this.tieneDatos) {
//             setTimeout(() => this.renderizar(), 20);
//         }
//     }

//     private calcularSerieAnualDesdeSQL(filas: any[]): void {
//         if (!filas || filas.length === 0) {
//             this.labelsNormalizados = [];
//             this.valoresNormalizados = [];
//             return;
//         }

//         const acumuladoPorAnio = new Map<number, number>();

//         filas.forEach((f: any) => {
//             const anio = Number(f.anio ?? f.anioVigencia ?? 0);
//             if (!anio) return;

//             const volumen =
//                 f.total_toneladas !== undefined
//                     ? Number(f.total_toneladas)
//                     : f.totalToneladas !== undefined
//                         ? Number(f.totalToneladas)
//                         : f.toneladas !== undefined
//                             ? Number(f.toneladas)
//                             : Number(f.exportacion || 0) +
//                             Number(f.importacion || 0) +
//                             Number(f.transbordo || 0) +
//                             Number(f.transitoInternacional || 0) +
//                             Number(f.fluvial || 0) +
//                             Number(f.cabotaje || 0) +
//                             Number(f.movilizacionesABordo || 0) +
//                             Number(f.transitoria || 0);

//             acumuladoPorAnio.set(anio, (acumuladoPorAnio.get(anio) || 0) + volumen);
//         });

//         const entradasOrdenadas = Array.from(acumuladoPorAnio.entries()).sort((a, b) => a[0] - b[0]);
//         this.labelsNormalizados = entradasOrdenadas.map(([anio]) => String(anio));
//         this.normalizarEscalaMillones(entradasOrdenadas.map(([, vol]) => vol));
//     }

//     private normalizarEscalaMillones(valoresCrudos: number[]): void {
//         const maxVal = Math.max(...valoresCrudos, 0);
//         if (maxVal >= 100_000) {
//             this.valoresNormalizados = valoresCrudos.map((v) => Number((v / 1_000_000).toFixed(2)));
//         } else {
//             this.valoresNormalizados = valoresCrudos.map((v) => Number(v.toFixed(2)));
//         }
//     }

//     public renderizar(): void {
//         if (!this.lineChart?.nativeElement || !this.tieneDatos) return;

//         if (this.chartInstance) {
//             this.chartInstance.destroy();
//         }

//         const ctx = this.lineChart.nativeElement.getContext('2d');
//         if (!ctx) return;

//         const gradient = ctx.createLinearGradient(0, 0, 0, 260);
//         gradient.addColorStop(0, 'rgba(6, 182, 212, 0.45)');
//         gradient.addColorStop(1, 'rgba(6, 182, 212, 0.0)');

//         this.chartInstance = new Chart(ctx, {
//             type: 'line',
//             data: {
//                 labels: this.labelsNormalizados,
//                 datasets: [
//                     {
//                         label: 'Millones TM',
//                         data: this.valoresNormalizados,
//                         borderColor: '#06b6d4',
//                         backgroundColor: gradient,
//                         borderWidth: 2.5,
//                         pointBackgroundColor: '#06b6d4',
//                         pointRadius: 4,
//                         fill: true,
//                         tension: 0.35
//                     }
//                 ]
//             },
//             options: {
//                 responsive: true,
//                 maintainAspectRatio: false,
//                 plugins: {
//                     legend: { display: false },
//                     tooltip: {
//                         callbacks: {
//                             label: (context) => ` ${context.raw} Mt`
//                         }
//                     }
//                 },
//                 scales: {
//                     x: {
//                         grid: { color: 'rgba(255,255,255,0.05)' },
//                         ticks: { color: '#94a3b8', font: { size: 10 } },
//                         border: { display: false }
//                     },
//                     y: {
//                         grid: { color: 'rgba(255,255,255,0.05)' },
//                         ticks: {
//                             color: '#94a3b8',
//                             font: { size: 10 },
//                             callback: (v) => `${v} Mt`
//                         },
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
//             rango: this.rangoCalculado || this.metadatosSQL?.rango || '2018-2026',
//             labels: this.labelsNormalizados,
//             valores: this.valoresNormalizados
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
//                 this.widgetConfig?.type || 'PTT_MAE_CHRT_HISTORICO',
//                 this.data
//             );
//         }
//     }
// }
/* eslint-disable @typescript-eslint/no-explicit-any */
/*
    Author: German Valencia
    Pattern: PORTTOS Smart Widget - Tendencia e Histórico Anual Marítimo
    Standard: PorttosChartHelper.renderizarLinea (Light & Dark Mode Ready)
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

import { WidgetShellComponent } from 'src/app/theme/shared/components/widget-shell/widget-shell.component';
import { MaritimoService } from 'src/app/theme/shared/service/tablero-control/maritimo.service';
import { DashboardService } from 'src/app/theme/shared/service/tablero-control/dashboard.service';
import { PorttosChartHelper } from 'src/app/theme/shared/_helpers/chart.helper';

@Component({
    selector: 'app-historico-anual',
    standalone: true,
    imports: [CommonModule, WidgetShellComponent],
    templateUrl: './historico-anual.component.html',
    styleUrls: ['./historico-anual.component.scss']
})
export class HistoricoAnualComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy {
    @Input() widgetConfig: any;
    @Input() isEnfoque: boolean = false;
    @Input() mostrarTabla: boolean = false;
    @Input() datosVivos: any;

    @ViewChild('lineMaritimoCanvas') lineMaritimoCanvas!: ElementRef<HTMLCanvasElement>;

    public chart?: Chart;
    public cargando: boolean = true;
    public sinDatos: boolean = false;
    public badgeHeader: string = 'TENDENCIA';

    private labels: string[] = [];
    private datasets: Array<{ label: string; data: number[]; color?: string; relleno?: boolean }> = [];
    private vistaLista: boolean = false;
    private metadatosSQL: any = {};
    private readonly destroy$ = new Subject<void>();

    constructor(
        private _maritimoService: MaritimoService,
        private _torreService: DashboardService,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit(): void {
        this.cargarSerieHistorica();
    }

    ngAfterViewInit(): void {
        this.vistaLista = true;
        this.renderizarLinea();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['isEnfoque'] && !changes['isEnfoque'].isFirstChange()) {
            setTimeout(() => this.chart?.resize(), 60);
        }

        if (
            (changes['widgetConfig'] && !changes['widgetConfig'].firstChange) ||
            (changes['datosVivos'] && this.datosVivos)
        ) {
            this.cargarSerieHistorica();
        }
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
        if (this.chart) {
            this.chart.destroy();
        }
    }

    private cargarSerieHistorica(): void {
        if (this.datosVivos && (this.datosVivos.labels || this.datosVivos.datasets)) {
            this.procesarPayload(this.datosVivos);
            return;
        }

        const puerto = (this.widgetConfig?.puerto || 'BUENAVENTURA').trim().toUpperCase();
        const codigoWidget = (
            this.widgetConfig?.type ||
            this.widgetConfig?.codigoWidget ||
            'PTT_MAR_CHRT_HISTORICO'
        )
            .trim()
            .toUpperCase();

        this.badgeHeader = codigoWidget.includes('PRODUCTIVIDAD') ? 'RENDIMIENTO' : 'TENDENCIA';
        this.cargando = true;

        this._maritimoService
            .obtenerDatosWidgetMaritimo(puerto, codigoWidget)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (res: any) => this.procesarPayload(res),
                error: (err) => {
                    console.error('❌ [SmartWidget ChartLineMaritimo] Error:', err);
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
        this.labels = (raw.labels || raw.anios || raw.periodos || []).map((l: any) => String(l));

        if (Array.isArray(raw.datasets) && raw.datasets.length > 0) {
            this.datasets = raw.datasets.map((ds: any, idx: number) => ({
                label: ds.label || `Serie ${idx + 1}`,
                data: (ds.data || []).map((v: any) => Number(v || 0)),
                color: ds.borderColor || ds.color || PorttosChartHelper.PALETA_DEFAULT[idx],
                relleno: true
            }));
        } else if (Array.isArray(raw.valores)) {
            this.datasets = [
                {
                    label: raw.titulo || 'Toneladas Movilizadas',
                    data: raw.valores.map((v: any) => Number(v || 0)),
                    color: '#00d4ff',
                    relleno: true
                }
            ];
        } else {
            this.datasets = [];
        }

        const suma = this.datasets.reduce(
            (acc, ds) => acc + ds.data.reduce((s, v) => s + v, 0),
            0
        );
        this.sinDatos = this.labels.length === 0 || suma === 0;
        this.cargando = false;
        this.renderizarLinea();
        this.cdr.detectChanges();
    }

    private renderizarLinea(): void {
        if (!this.vistaLista || this.sinDatos) return;

        this.chart = PorttosChartHelper.renderizarLinea(
            this.lineMaritimoCanvas,
            this.chart,
            {
                labels: this.labels,
                datasets: this.datasets,
                unidad: this.badgeHeader === 'RENDIMIENTO' ? 'Mov/h' : 'M Ton',
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
                this.widgetConfig?.type || 'PTT_MAR_CHRT_HISTORICO',
                this.data
            );
        }
    }
}
