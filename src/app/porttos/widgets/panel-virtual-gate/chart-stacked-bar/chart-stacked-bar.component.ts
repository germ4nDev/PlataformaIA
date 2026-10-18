// /* eslint-disable @typescript-eslint/no-explicit-any */
// import { Component, Input, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { Subject } from 'rxjs';
// import { takeUntil } from 'rxjs/operators';
// import { VirtualGateService } from 'src/app/theme/shared/service/tablero-control/virtual-gate.service';
// import { DashboardService } from 'src/app/theme/shared/service/tablero-control/dashboard.service';
// import { WidgetShellComponent } from 'src/app/theme/shared/components/widget-shell/widget-shell.component';

// // Nota: Asegúrate de importar el componente de tu gráfica (Ng2Charts o ApexCharts)
// // según la librería que estés usando actualmente en tu proyecto original.
// // Ejemplo: import { NgChartsModule } from 'ng2-charts';

// @Component({
//     selector: 'app-chart-stacked-bar',
//     standalone: true,
//     imports: [CommonModule /* , NgChartsModule */, WidgetShellComponent], // Agrega tu módulo de gráficos si es standalone
//     templateUrl: './chart-stacked-bar.component.html',
//     styleUrls: ['./chart-stacked-bar.component.scss']
// })
// export class ChartStackedBarComponent implements OnInit, OnDestroy {
//     @Input() widgetConfig: any;
//     public chartData: any = { labels: [], datasets: [] };
//     public cargando: boolean = true;
//     private readonly destroy$ = new Subject<void>();

//     constructor(
//         private _virtualGateService: VirtualGateService,
//         private _torreService: DashboardService,
//         private cdr: ChangeDetectorRef
//     ) { }

//     ngOnInit(): void {
//         const puerto = (this.widgetConfig?.puerto || 'BUENAVENTURA').trim().toUpperCase();
//         const codigo = (this.widgetConfig?.type || 'PTT_GATE_CHRT_CITAS').trim().toUpperCase();

//         // 1. El widget le pide sus datos al servicio utilizando el código configurado
//         this._virtualGateService
//             .obtenerDatosWidgetGate(codigo, puerto)
//             .pipe(takeUntil(this.destroy$))
//             .subscribe({
//                 next: (data: any) => {
//                     if (data) {
//                         // 2. Extraemos la información sin importar cómo la llame la librería de gráficos
//                         console.log('********data que recibe la grafica', data);

//                         this.chartData = {
//                             labels: data.labels || data.categories || [],
//                             datasets: data.datasets || data.series || []
//                         };
//                         console.log('********chartData la grafica', this.chartData);
//                     }
//                     this.cargando = false;
//                     this.cdr.detectChanges();
//                 },
//                 error: () => {
//                     this.chartData = { labels: [], datasets: [] };
//                     this.cargando = false;
//                     this.cdr.detectChanges();
//                 }
//             });
//     }

//     ngOnDestroy(): void {
//         this.destroy$.next();
//         this.destroy$.complete();
//     }

//     maximizarDesdeShell(): void {
//         this._torreService.abrirModoEnfoque(
//             this.widgetConfig?.type || 'PTT_GATE_CHRT_CITAS',
//             this.chartData
//         );
//     }
// }
/* eslint-disable @typescript-eslint/no-explicit-any */
/*
    Author: German Valencia
    Pattern: PORTTOS Smart Widget - Citas Próximas 12 Horas (Consumo Autónomo Virtual Gate)
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
import { VirtualGateService } from 'src/app/theme/shared/service/tablero-control/virtual-gate.service';
import { WidgetShellComponent } from 'src/app/theme/shared/components/widget-shell/widget-shell.component';
import {
    PorttosChartHelper,
    IDatasetBarra
} from 'src/app/theme/shared/_helpers/chart.helper';

@Component({
    selector: 'app-chart-stacked-bar',
    standalone: true,
    imports: [CommonModule, WidgetShellComponent],
    templateUrl: './chart-stacked-bar.component.html',
    styleUrls: ['./chart-stacked-bar.component.scss']
})
export class ChartStackedBarComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy {
    @Input() widgetConfig: any;
    @Input() isEnfoque: boolean = false;
    @Input() datosVivos: any;

    @ViewChild('stackedBarCanvas') stackedBarCanvas!: ElementRef<HTMLCanvasElement>;

    public chartInstance?: Chart;
    public cargando: boolean = true;

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
        this.cargarDatosCitas12h();
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
            this.cargarDatosCitas12h();
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

    private cargarDatosCitas12h(): void {
        if (this.datosVivos && (this.datosVivos.datasets || Array.isArray(this.datosVivos))) {
            this.aplicarDatosAlGrafico(this.datosVivos);
            return;
        }

        const puerto = (this.widgetConfig?.puerto || 'BUENAVENTURA').trim().toUpperCase();
        const codigoWidget = (
            this.widgetConfig?.type ||
            this.widgetConfig?.codigoWidget ||
            'PTT_GATE_CHRT_CITAS'
        )
            .trim()
            .toUpperCase();

        this.cargando = true;

        this._virtualGateService
            .obtenerDatosWidgetGate(codigoWidget, puerto)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (respuesta: any) => {
                    this.aplicarDatosAlGrafico(respuesta);
                },
                error: (err) => {
                    console.error('❌ [SmartWidget ChartStackedBar] Error cargando citas 12h:', err);
                    this.labels = [];
                    this.datasets = [];
                    this.cargando = false;
                    this.cdr.detectChanges();
                }
            });
    }

    private aplicarDatosAlGrafico(raw: any): void {
        if (!raw) {
            this.labels = [];
            this.datasets = [];
            this.cargando = false;
            this.cdr.detectChanges();
            return;
        }

        this.metadatosSQL = Array.isArray(raw) ? {} : raw;

        const rawLabels = raw.labels || raw.categories || [];
        const rawDatasets = raw.datasets || raw.series || [];

        if (rawDatasets.length > 0) {
            this.labels = rawLabels.map((l: any) => String(l));
            this.datasets = rawDatasets.map((ds: any, idx: number) => {
                const dataNum = (ds.data || []).map((v: any) => Number(v || 0));
                return {
                    label: ds.label || ds.name || `Terminal ${idx + 1}`,
                    data: dataNum,
                    color:
                        ds.backgroundColor ||
                        ds.color ||
                        PorttosChartHelper.PALETA_DEFAULT[idx % PorttosChartHelper.PALETA_DEFAULT.length]
                };
            });
        } else {
            this.labels = [];
            this.datasets = [];
        }

        this.cargando = false;
        this.cdr.detectChanges();

        if (this.vistaLista && this.tieneDatos) {
            setTimeout(() => this.renderizarGrafica(), 20);
        }
    }

    private renderizarGrafica(): void {
        if (!this.vistaLista || !this.tieneDatos || !this.stackedBarCanvas?.nativeElement) return;

        this.chartInstance = PorttosChartHelper.renderizarBarras(
            this.stackedBarCanvas,
            this.chartInstance,
            {
                labels: this.labels,
                datasets: this.datasets,
                unidad: ' citas',
                mostrarLeyenda: true,
                isEnfoque: this.isEnfoque,
                apilado: true
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
                this.widgetConfig?.type || 'PTT_GATE_CHRT_CITAS',
                this.data
            );
        }
    }
}
