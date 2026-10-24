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

import { OrigenMaritimoDirective } from '../../shared/origen-maritimo.directive';

@Component({
    selector: 'app-eta-chart',
    standalone: true,
    imports: [OrigenMaritimoDirective, CommonModule, WidgetShellComponent],
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
