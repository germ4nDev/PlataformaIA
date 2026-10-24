/* eslint-disable @typescript-eslint/no-explicit-any */
/*
    Author: German Valencia
    Pattern: PORTTOS Smart Widget - Resumen Semanal / Arribos 7 Días (Consumo Autónomo SQL)
    Standard: PorttosChartHelper (Light & Dark Mode Ready)
*/
import {
    Component,
    Input,
    ViewChild,
    ElementRef,
    ViewEncapsulation,
    OnInit,
    AfterViewInit,
    OnChanges,
    OnDestroy,
    SimpleChanges,
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

import { OrigenMaritimoDirective } from '../../shared/origen-maritimo.directive';

@Component({
    selector: 'app-resumen-semanal',
    standalone: true,
    imports: [OrigenMaritimoDirective, CommonModule, WidgetShellComponent],
    templateUrl: './resumen-semanal.component.html',
    styleUrl: './resumen-semanal.component.scss',
    encapsulation: ViewEncapsulation.None
})
export class ResumenSemanalComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy {
    @ViewChild('resumenSemanalCanvas') resumenSemanalCanvas!: ElementRef<HTMLCanvasElement>;

    @Input() widgetConfig: any;
    @Input() isEnfoque: boolean = false;
    @Input() mostrarTabla: boolean = false;
    @Input() datosVivos: any;

    public chartInstance?: Chart;
    public cargando: boolean = true;
    public listaArribos: any[] = [];

    private labels: string[] = [];
    private datasets: IDatasetBarra[] = [];
    private metadatosSQL: any = {};
    private vistaLista: boolean = false;
    private readonly destroy$ = new Subject<void>();

    constructor(
        private _maritimoService: MaritimoService,
        private _torreService: DashboardService,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit(): void {
        this.cargarResumenSemanal();
    }

    ngAfterViewInit(): void {
        this.vistaLista = true;
        if (!this.cargando && this.tieneDatosGrafico && !this.mostrarTabla) {
            this.renderizarGrafica();
        }
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (
            (changes['widgetConfig'] && !changes['widgetConfig'].firstChange) ||
            (changes['datosVivos'] && this.datosVivos)
        ) {
            this.cargarResumenSemanal();
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

    private cargarResumenSemanal(): void {
        // 1. Si viene precargado desde el modal de Modo Enfoque o desde el padre
        if (
            this.datosVivos &&
            (this.datosVivos.labels ||
                this.datosVivos.datasets ||
                this.datosVivos.arribos ||
                this.datosVivos.listado ||
                Array.isArray(this.datosVivos))
        ) {
            this.procesarPayloadSemanal(this.datosVivos);
            return;
        }

        const puerto = (this.widgetConfig?.puerto || 'BUENAVENTURA').trim().toUpperCase();
        const codigoWidget = (
            this.widgetConfig?.type ||
            this.widgetConfig?.codigoWidget ||
            'WDG_PORT_RESUMEN_SEMANAL'
        )
            .trim()
            .toUpperCase();

        this.cargando = true;

        this._maritimoService
            .obtenerDatosWidgetMaritimo(puerto, codigoWidget)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (respuestaSQL: any) => {
                    this.procesarPayloadSemanal(respuestaSQL);
                },
                error: (err) => {
                    console.error('❌ [SmartWidget ResumenSemanal] Error consultando resumen 7 días:', err);
                    this.labels = [];
                    this.datasets = [];
                    this.listaArribos = [];
                    this.cargando = false;
                    this.cdr.detectChanges();
                }
            });
    }

    private procesarPayloadSemanal(raw: any): void {
        if (!raw) {
            this.labels = [];
            this.datasets = [];
            this.listaArribos = [];
            this.cargando = false;
            this.cdr.detectChanges();
            return;
        }

        this.metadatosSQL = Array.isArray(raw) ? {} : raw;

        // 1. Lista de arribos para la vista de tabla/listado
        if (Array.isArray(raw.arribos) || Array.isArray(raw.listado)) {
            this.listaArribos = raw.arribos || raw.listado || [];
        } else if (Array.isArray(raw)) {
            this.listaArribos = raw;
        } else {
            this.listaArribos = [];
        }

        // 2. Datos para la gráfica de barras (Arribos por día / terminal)
        if (Array.isArray(raw.labels) && Array.isArray(raw.datasets) && raw.datasets.length > 0) {
            this.labels = raw.labels.map((l: any) => String(l));
            this.datasets = raw.datasets.map((ds: any, idx: number) => ({
                label: ds.label || 'Arribos',
                data: (ds.data || []).map((v: any) => Number(v || 0)),
                color: ds.backgroundColor || ds.color || (idx === 0 ? '#00d4ff' : PorttosChartHelper.PALETA_DEFAULT[idx])
            }));
        } else if (Array.isArray(raw.labels) && Array.isArray(raw.valores)) {
            this.labels = raw.labels.map((l: any) => String(l));
            this.datasets = [
                {
                    label: 'Arribos',
                    data: raw.valores.map((v: any) => Number(v || 0)),
                    color: '#00d4ff'
                }
            ];
        } else if (this.listaArribos.length > 0) {
            // Si vienen filas SQL de arribos, agrupamos por fecha/día o terminal
            const conteoPorDia = new Map<string, number>();
            this.listaArribos.forEach((item: any) => {
                const clave = String(
                    item.dia || item.fecha_corta || item.terminal || item.instalacion_portuaria || 'Programado'
                ).trim();
                const cant = Number(item.cantidad ?? item.total_buques ?? 1);
                conteoPorDia.set(clave, (conteoPorDia.get(clave) || 0) + cant);
            });

            this.labels = Array.from(conteoPorDia.keys());
            this.datasets = [
                {
                    label: 'Arribos Programados',
                    data: Array.from(conteoPorDia.values()),
                    color: '#00d4ff'
                }
            ];
        } else {
            this.labels = [];
            this.datasets = [];
        }

        this.cargando = false;
        this.cdr.detectChanges();

        if (this.vistaLista && this.tieneDatosGrafico && !this.mostrarTabla) {
            setTimeout(() => this.renderizarGrafica(), 20);
        }
    }

    private renderizarGrafica(): void {
        if (
            !this.vistaLista ||
            this.mostrarTabla ||
            !this.tieneDatosGrafico ||
            !this.resumenSemanalCanvas?.nativeElement
        ) {
            return;
        }

        this.chartInstance = PorttosChartHelper.renderizarBarras(
            this.resumenSemanalCanvas,
            this.chartInstance,
            {
                labels: this.labels,
                datasets: this.datasets,
                unidad: 'Buques',
                mostrarLeyenda: this.datasets.length > 1,
                isEnfoque: this.isEnfoque
            }
        );
    }

    get data(): any {
        return {
            ...(this.widgetConfig?.data || {}),
            ...(this.datosVivos || {}),
            ...this.metadatosSQL,
            arribos: this.listaArribos,
            labels: this.labels,
            datasets: this.datasets
        };
    }

    get tieneDatosGrafico(): boolean {
        return (
            this.labels.length > 0 &&
            this.datasets.some((ds) => ds.data && ds.data.some((v) => v > 0))
        );
    }

    public toggleVista(): void {
        this.mostrarTabla = !this.mostrarTabla;
        this.cdr.detectChanges();

        if (!this.mostrarTabla && this.tieneDatosGrafico) {
            setTimeout(() => this.renderizarGrafica(), 30);
        }
    }

    public maximizarDesdeShell(): void {
        if (this.isEnfoque) {
            this._torreService.cerrarModoEnfoque();
        } else {
            this._torreService.abrirModoEnfoque(
                this.widgetConfig?.type || 'WDG_PORT_RESUMEN_SEMANAL',
                this.data
            );
        }
    }
}
