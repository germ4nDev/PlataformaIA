/* eslint-disable @typescript-eslint/no-explicit-any */
/*
    Author: German Valencia
    Pattern: PORTTOS Smart Widget - Toneladas Movidas Hoy (Consumo Autónomo SQL)
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
    ViewEncapsulation,
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
    selector: 'app-toneladas-chart',
    standalone: true,
    imports: [OrigenMaritimoDirective, CommonModule, WidgetShellComponent],
    templateUrl: './toneladas-chart.component.html',
    styleUrls: ['./toneladas-chart.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class ToneladasChartComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy {
    @ViewChild('toneladasCanvas') toneladasCanvas!: ElementRef<HTMLCanvasElement>;

    @Input() widgetConfig: any;
    @Input() isEnfoque: boolean = false;
    @Input() mostrarTabla: boolean = false;

    // Respaldo para apertura en modal de Modo Enfoque
    @Input() datosVivos: any;

    public chartInstance?: Chart;
    public cargando: boolean = true;

    private labels: string[] = [];
    private datasets: IDatasetBarra[] = [];
    private metadatosSQL: any = {};
    private vistaLista: boolean = false;
    private readonly destroy$ = new Subject<void>();

    private readonly paletaCarga: Record<string, string> = {
        'CONTENEDORES': '#00d4ff',
        'GRANEL AGRÍCOLA': '#10b981',
        'GRANEL AGRICOLA': '#10b981',
        'GRANEL SÓLIDO': '#10b981',
        'GRANEL SOLIDO': '#10b981',
        'GRANEL MINERAL': '#f59e0b',
        'GRANEL LÍQUIDO': '#8b5cf6',
        'GRANEL LIQUIDO': '#8b5cf6',
        'CARGA SUELTA': '#ec4899',
        'CARGA GENERAL': '#ec4899',
        'VEHÍCULOS': '#3b82f6',
        'VEHICULOS': '#3b82f6'
    };

    constructor(
        private _maritimoService: MaritimoService,
        private _torreService: DashboardService,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit(): void {
        this.cargarDatosToneladas();
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
            this.cargarDatosToneladas();
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
     * Consulta autónoma a SQL Server (TCL_HistoricoProductividad) filtrada por puerto
     */
    private cargarDatosToneladas(): void {
        // 1. Si recibe datos precargados al abrir el modal de Modo Enfoque
        if (this.datosVivos && (this.datosVivos.datasets || Array.isArray(this.datosVivos))) {
            this.aplicarDatosAlGrafico(this.datosVivos);
            return;
        }

        const puerto = (this.widgetConfig?.puerto || 'BUENAVENTURA').trim().toUpperCase();
        const codigoWidget = (
            this.widgetConfig?.type ||
            this.widgetConfig?.codigoWidget ||
            'PTT_MAE_CHRT_TONELADAS'
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
                    console.error('❌ [SmartWidget ToneladasChart] Error consultando volumen diario:', err);
                    this.labels = [];
                    this.datasets = [];
                    this.cargando = false;
                    this.cdr.detectChanges();
                }
            });
    }

    /**
     * Soporta estructura Chart.js directa { labels, datasets } o filas relacionales
     * de TCL_HistoricoProductividad (id_terminal, tipo_carga, toneladas_movilizadas)
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

        if (raw.datasets && Array.isArray(raw.datasets) && raw.labels) {
            this.labels = raw.labels.map((l: any) => String(l));
            this.datasets = raw.datasets.map((ds: any, idx: number) => {
                const claveColor = String(ds.label || '').toUpperCase();
                return {
                    label: ds.label || `Carga ${idx + 1}`,
                    data: (ds.data || []).map((v: any) => Number(v || 0)),
                    color:
                        ds.backgroundColor ||
                        ds.color ||
                        this.paletaCarga[claveColor] ||
                        PorttosChartHelper.PALETA_DEFAULT[idx % PorttosChartHelper.PALETA_DEFAULT.length]
                };
            });
        } else {
            // Pivot automático si vienen filas SQL desde TCL_HistoricoProductividad
            const filas: any[] = Array.isArray(raw) ? raw : raw.rows || raw.data || [];
            const pivoteado = this.pivotearFilasSQL(filas);
            this.labels = pivoteado.labels;
            this.datasets = pivoteado.datasets;
        }

        this.cargando = false;
        this.cdr.detectChanges();

        if (this.vistaLista && this.tieneDatos) {
            setTimeout(() => this.renderizarGrafica(), 20);
        }
    }

    private pivotearFilasSQL(filas: any[]): { labels: string[]; datasets: IDatasetBarra[] } {
        if (!filas || filas.length === 0) {
            return { labels: [], datasets: [] };
        }

        const terminales = Array.from(
            new Set(filas.map((f: any) => String(f.id_terminal || f.terminal || f.puerto || 'Terminal')))
        );
        const tiposCarga = Array.from(
            new Set(filas.map((f: any) => String(f.tipo_carga || 'General')))
        );

        const datasets: IDatasetBarra[] = tiposCarga.map((tipo: string, idx: number) => {
            const claveColor = tipo.toUpperCase();
            return {
                label: tipo,
                data: terminales.map((term: string) => {
                    return filas
                        .filter(
                            (f: any) =>
                                String(f.id_terminal || f.terminal || f.puerto || 'Terminal') === term &&
                                String(f.tipo_carga || 'General') === tipo
                        )
                        .reduce(
                            (acc: number, curr: any) =>
                                acc + Number(curr.toneladas_movilizadas ?? curr.toneladas ?? 0),
                            0
                        );
                }),
                color:
                    this.paletaCarga[claveColor] ||
                    PorttosChartHelper.PALETA_DEFAULT[idx % PorttosChartHelper.PALETA_DEFAULT.length]
            };
        });

        return { labels: terminales, datasets };
    }

    private renderizarGrafica(): void {
        if (!this.vistaLista || !this.tieneDatos || !this.toneladasCanvas?.nativeElement) return;

        this.chartInstance = PorttosChartHelper.renderizarBarras(
            this.toneladasCanvas,
            this.chartInstance,
            {
                labels: this.labels,
                datasets: this.datasets,
                unidad: 'Ton',
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

    get isLoading(): boolean {
        return this.cargando;
    }

    get tieneDatos(): boolean {
        return (
            this.labels.length > 0 &&
            this.datasets.some((ds) => ds.data && ds.data.some((v) => v > 0))
        );
    }

    public maximizarDesdeShell(): void {
        if (this.isEnfoque) {
            this._torreService.cerrarModoEnfoque();
        } else {
            this._torreService.abrirModoEnfoque(
                this.widgetConfig?.type || 'PTT_MAE_CHRT_TONELADAS',
                this.data
            );
        }
    }
}
