// /* eslint-disable @typescript-eslint/no-explicit-any */
// /*
//     Author: German Valencia
//     Pattern: PORTTOS Smart Widget - Tipo de Operación Portuaria (Consumo Autónomo SQL)
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
//     selector: 'app-tipo-operacion',
//     standalone: true,
//     imports: [CommonModule, WidgetShellComponent],
//     templateUrl: './tipo-operacion.component.html',
//     styleUrls: ['./tipo-operacion.component.scss'],
//     encapsulation: ViewEncapsulation.None
// })
// export class TipoOperacionComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy {
//     @Input() widgetConfig: any;
//     @Input() isEnfoque: boolean = false;
//     @Input() mostrarTabla: boolean = false;

//     // Respaldo cuando se abre en el modal de Modo Enfoque
//     @Input() datosVivos: any;

//     @ViewChild('opsChart') opsChart!: ElementRef<HTMLCanvasElement>;
//     public chartInstance: Chart | null = null;
//     public cargando: boolean = true;
//     public tieneDatos: boolean = false;

//     private labelsNormalizados: string[] = [];
//     private valoresNormalizados: number[] = [];
//     private coloresNormalizados: string[] = [];
//     private metadatosSQL: any = {};
//     private vistaLista: boolean = false;
//     private readonly destroy$ = new Subject<void>();

//     private readonly paletaOperacion: Record<string, string> = {
//         'IMPORTACIÓN': '#00d4ff',
//         'IMPORTACION': '#00d4ff',
//         'EXPORTACIÓN': '#00c896',
//         'EXPORTACION': '#00c896',
//         'TRANSBORDO': '#a78bfa',
//         'CABOTAJE': '#ffb547',
//         'TRÁNSITO INT.': '#38bdf8',
//         'FLUVIAL': '#10b981',
//         'MOV. A BORDO': '#f472b6',
//         'TRANSITORIA': '#94a3b8'
//     };

//     private readonly coloresBase = ['#06b6d4', '#10b981', '#8b5cf6', '#ffb547', '#3b82f6', '#f472b6'];

//     constructor(
//         private _maritimoService: MaritimoService,
//         private _torreService: DashboardService,
//         private cdr: ChangeDetectorRef
//     ) { }

//     ngOnInit(): void {
//         this.cargarTipoOperacion();
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
//             this.cargarTipoOperacion();
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
//      * Consulta autónoma a SQL Server (TCL_TraficoPortuarioMaritimo)
//      */
//     private cargarTipoOperacion(): void {
//         // 1. Si viene precargado desde el modal de Modo Enfoque
//         if (
//             this.datosVivos &&
//             (this.datosVivos.valores || this.datosVivos.datasets || Array.isArray(this.datosVivos))
//         ) {
//             this.procesarPayloadOperacion(this.datosVivos);
//             return;
//         }

//         const puerto = (this.widgetConfig?.puerto || 'BUENAVENTURA').trim().toUpperCase();
//         const codigoWidget = (this.widgetConfig?.type || this.widgetConfig?.codigoWidget || 'PTT_MAE_CHRT_TIPO_OP')
//             .trim()
//             .toUpperCase();

//         this.cargando = true;

//         this._maritimoService
//             .obtenerDatosWidgetMaritimo(puerto, codigoWidget)
//             .pipe(takeUntil(this.destroy$))
//             .subscribe({
//                 next: (respuestaSQL: any) => {
//                     this.procesarPayloadOperacion(respuestaSQL);
//                 },
//                 error: (err) => {
//                     console.error('❌ [SmartWidget TipoOperacion] Error consultando flujos:', err);
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
//      * 3. Filas o consolidado SQL de TCL_TraficoPortuarioMaritimo (importacion, exportacion, transbordo, cabotaje...)
//      */
//     private procesarPayloadOperacion(raw: any): void {
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
//             this.valoresNormalizados = this.convertirAPorcentajes(raw.valores.map((v: any) => Number(v || 0)));
//             this.coloresNormalizados = this.resolverColores(this.labelsNormalizados, raw.colores);
//         } else if (Array.isArray(raw.labels) && Array.isArray(raw.datasets) && raw.datasets[0]) {
//             this.labelsNormalizados = [...raw.labels];
//             this.valoresNormalizados = this.convertirAPorcentajes(
//                 (raw.datasets[0].data || []).map((v: any) => Number(v || 0))
//             );
//             this.coloresNormalizados = this.resolverColores(
//                 this.labelsNormalizados,
//                 raw.datasets[0].backgroundColor
//             );
//         } else {
//             // Agregación directa de las columnas de flujo de TCL_TraficoPortuarioMaritimo
//             const filas: any[] = Array.isArray(raw) ? raw : raw.rows || raw.data || [raw];
//             this.calcularFlujosDesdeSQL(filas);
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

//     /**
//      * Suma las columnas de flujo comercio exterior/interior de dbo.TCL_TraficoPortuarioMaritimo
//      */
//     private calcularFlujosDesdeSQL(filas: any[]): void {
//         const definicionFlujos = [
//             { col: 'importacion', label: 'Importación' },
//             { col: 'exportacion', label: 'Exportación' },
//             { col: 'transbordo', label: 'Transbordo' },
//             { col: 'cabotaje', label: 'Cabotaje' },
//             { col: 'transitoInternacional', label: 'Tránsito Int.' },
//             { col: 'fluvial', label: 'Fluvial' },
//             { col: 'movilizacionesABordo', label: 'Mov. a Bordo' },
//             { col: 'transitoria', label: 'Transitoria' }
//         ];

//         const acumulados: Array<{ label: string; total: number }> = definicionFlujos.map((def) => ({
//             label: def.label,
//             total: filas.reduce((acc, f) => acc + Number(f?.[def.col] || 0), 0)
//         }));

//         const activos = acumulados
//             .filter((item) => item.total > 0)
//             .sort((a, b) => b.total - a.total);

//         this.labelsNormalizados = activos.map((a) => a.label);
//         this.valoresNormalizados = this.convertirAPorcentajes(activos.map((a) => a.total));
//         this.coloresNormalizados = this.resolverColores(this.labelsNormalizados);
//     }

//     private convertirAPorcentajes(valores: number[]): number[] {
//         const suma = valores.reduce((a, b) => a + b, 0);
//         if (suma <= 0) return valores;
//         // Si ya vienen en porcentaje (~100), los respetamos; si vienen en toneladas, calculamos el %
//         if (suma > 105) {
//             return valores.map((v) => Number(((v / suma) * 100).toFixed(1)));
//         }
//         return valores.map((v) => Number(v.toFixed(1)));
//     }

//     private resolverColores(labels: string[], coloresCustom?: string[]): string[] {
//         if (Array.isArray(coloresCustom) && coloresCustom.length >= labels.length) {
//             return coloresCustom;
//         }
//         return labels.map((lbl, idx) => {
//             const key = lbl.toUpperCase();
//             return this.paletaOperacion[key] || this.coloresBase[idx % this.coloresBase.length];
//         });
//     }

//     public renderizar(): void {
//         if (!this.opsChart?.nativeElement || !this.tieneDatos) return;

//         if (this.chartInstance) {
//             this.chartInstance.destroy();
//         }

//         this.chartInstance = new Chart(this.opsChart.nativeElement, {
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
//                 this.widgetConfig?.type || 'PTT_MAE_CHRT_TIPO_OP',
//                 this.data
//             );
//         }
//     }
// }
/* eslint-disable @typescript-eslint/no-explicit-any */
/*
    Author: German Valencia
    Pattern: PORTTOS Smart Widget - Tipo de Operación Portuaria (Consumo Autónomo SQL)
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
    selector: 'app-tipo-operacion',
    standalone: true,
    imports: [CommonModule, WidgetShellComponent],
    templateUrl: './tipo-operacion.component.html',
    styleUrls: ['./tipo-operacion.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class TipoOperacionComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy {
    @Input() widgetConfig: any;
    @Input() isEnfoque: boolean = false;
    @Input() mostrarTabla: boolean = false;

    // Respaldo cuando se abre en el modal de Modo Enfoque
    @Input() datosVivos: any;

    @ViewChild('opsChart') opsChart!: ElementRef<HTMLCanvasElement>;

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

    private readonly paletaOperacion: Record<string, string> = {
        'IMPORTACIÓN': '#00d4ff',
        'IMPORTACION': '#00d4ff',
        'EXPORTACIÓN': '#10b981',
        'EXPORTACION': '#10b981',
        'TRANSBORDO': '#8b5cf6',
        'CABOTAJE': '#f59e0b',
        'TRÁNSITO INT.': '#3b82f6',
        'FLUVIAL': '#14b8a6',
        'MOV. A BORDO': '#ec4899',
        'TRANSITORIA': '#64748b'
    };

    constructor(
        private _maritimoService: MaritimoService,
        private _torreService: DashboardService,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit(): void {
        this.cargarTipoOperacion();
    }

    ngAfterViewInit(): void {
        this.vistaLista = true;
        if (!this.cargando && this.tieneDatos) {
            this.renderizar();
        }
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (
            (changes['widgetConfig'] && !changes['widgetConfig'].firstChange) ||
            (changes['datosVivos'] && this.datosVivos)
        ) {
            this.cargarTipoOperacion();
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
     * Consulta autónoma a SQL Server (TCL_TraficoPortuarioMaritimo)
     */
    private cargarTipoOperacion(): void {
        // 1. Si viene precargado desde el modal de Modo Enfoque
        if (
            this.datosVivos &&
            (this.datosVivos.valores || this.datosVivos.datasets || Array.isArray(this.datosVivos))
        ) {
            this.procesarPayloadOperacion(this.datosVivos);
            return;
        }

        const puerto = (this.widgetConfig?.puerto || 'BUENAVENTURA').trim().toUpperCase();
        const codigoWidget = (
            this.widgetConfig?.type ||
            this.widgetConfig?.codigoWidget ||
            'PTT_MAE_CHRT_TIPO_OP'
        )
            .trim()
            .toUpperCase();

        this.cargando = true;

        this._maritimoService
            .obtenerDatosWidgetMaritimo(puerto, codigoWidget)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (respuestaSQL: any) => {
                    this.procesarPayloadOperacion(respuestaSQL);
                },
                error: (err) => {
                    console.error('❌ [SmartWidget TipoOperacion] Error consultando flujos:', err);
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
     * 3. Filas o consolidado SQL de TCL_TraficoPortuarioMaritimo (importacion, exportacion, transbordo, cabotaje...)
     */
    private procesarPayloadOperacion(raw: any): void {
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
            this.valoresNormalizados = this.convertirAPorcentajes(raw.valores.map((v: any) => Number(v || 0)));
            this.coloresNormalizados = this.resolverColores(this.labelsNormalizados, raw.colores);
        } else if (Array.isArray(raw.labels) && Array.isArray(raw.datasets) && raw.datasets[0]) {
            this.labelsNormalizados = [...raw.labels];
            this.valoresNormalizados = this.convertirAPorcentajes(
                (raw.datasets[0].data || []).map((v: any) => Number(v || 0))
            );
            this.coloresNormalizados = this.resolverColores(
                this.labelsNormalizados,
                raw.datasets[0].backgroundColor
            );
        } else {
            // Agregación directa de las columnas de flujo de TCL_TraficoPortuarioMaritimo
            const filas: any[] = Array.isArray(raw) ? raw : raw.rows || raw.data || [raw];
            this.calcularFlujosDesdeSQL(filas);
        }

        const { total, items } = PorttosChartHelper.calcularLeyendaDona(
            this.labelsNormalizados,
            this.valoresNormalizados,
            this.coloresNormalizados
        );

        this.leyendaItems = items;
        this.tieneDatos = this.labelsNormalizados.length > 0 && total > 0;
        this.cargando = false;

        this.cdr.detectChanges();

        if (this.vistaLista && this.tieneDatos) {
            setTimeout(() => this.renderizar(), 20);
        }
    }

    /**
     * Suma las columnas de flujo comercio exterior/interior de dbo.TCL_TraficoPortuarioMaritimo
     */
    private calcularFlujosDesdeSQL(filas: any[]): void {
        const definicionFlujos = [
            { col: 'importacion', label: 'Importación' },
            { col: 'exportacion', label: 'Exportación' },
            { col: 'transbordo', label: 'Transbordo' },
            { col: 'cabotaje', label: 'Cabotaje' },
            { col: 'transitoInternacional', label: 'Tránsito Int.' },
            { col: 'fluvial', label: 'Fluvial' },
            { col: 'movilizacionesABordo', label: 'Mov. a Bordo' },
            { col: 'transitoria', label: 'Transitoria' }
        ];

        const acumulados: Array<{ label: string; total: number }> = definicionFlujos.map((def) => ({
            label: def.label,
            total: filas.reduce((acc, f) => acc + Number(f?.[def.col] || 0), 0)
        }));

        const activos = acumulados
            .filter((item) => item.total > 0)
            .sort((a, b) => b.total - a.total);

        this.labelsNormalizados = activos.map((a) => a.label);
        this.valoresNormalizados = this.convertirAPorcentajes(activos.map((a) => a.total));
        this.coloresNormalizados = this.resolverColores(this.labelsNormalizados);
    }

    private convertirAPorcentajes(valores: number[]): number[] {
        const suma = valores.reduce((a, b) => a + b, 0);
        if (suma <= 0) return valores;
        // Si ya vienen en porcentaje (~100), los respetamos; si vienen en toneladas, calculamos el %
        if (suma > 105) {
            return valores.map((v) => Number(((v / suma) * 100).toFixed(1)));
        }
        return valores.map((v) => Number(v.toFixed(1)));
    }

    private resolverColores(labels: string[], coloresCustom?: string[]): string[] {
        if (Array.isArray(coloresCustom) && coloresCustom.length >= labels.length) {
            return coloresCustom;
        }
        return labels.map((lbl, idx) => {
            const key = String(lbl || '').toUpperCase();
            return (
                this.paletaOperacion[key] ||
                PorttosChartHelper.PALETA_DEFAULT[idx % PorttosChartHelper.PALETA_DEFAULT.length]
            );
        });
    }

    public renderizar(): void {
        if (!this.vistaLista || !this.tieneDatos || !this.opsChart?.nativeElement) return;

        this.chartInstance = PorttosChartHelper.renderizarDona(
            this.opsChart,
            this.chartInstance,
            this.labelsNormalizados,
            this.valoresNormalizados,
            '%',
            this.coloresNormalizados
        );
    }

    /**
     * Obtiene el flujo dominante para mostrarlo en el centro de la dona
     */
    get flujoDominante(): ILeyendaDonaItem | null {
        if (!this.leyendaItems || this.leyendaItems.length === 0) return null;
        return this.leyendaItems.reduce((prev, curr) =>
            curr.porcentaje > prev.porcentaje ? curr : prev
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
                this.widgetConfig?.type || 'PTT_MAE_CHRT_TIPO_OP',
                this.data
            );
        }
    }
}
