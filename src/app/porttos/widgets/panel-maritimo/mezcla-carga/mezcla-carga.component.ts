/* eslint-disable @typescript-eslint/no-explicit-any */
/*
    Author: German Valencia
    Pattern: PORTTOS Smart Widget - Mezcla por Tipo de Carga (Consumo Autónomo SQL)
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

import { WidgetShellComponent } from 'src/app/theme/shared/components/widget-shell/widget-shell.component';
import { MaritimoService } from 'src/app/theme/shared/service/tablero-control/maritimo.service';
import { DashboardService } from 'src/app/theme/shared/service/tablero-control/dashboard.service';
import { KpiFormatPipe } from 'src/app/theme/shared/pipes/kpi-format.pipe';
import {
    PorttosChartHelper,
    ILeyendaDonaItem
} from 'src/app/theme/shared/_helpers/chart.helper';

import { OrigenMaritimoDirective } from '../../shared/origen-maritimo.directive';

@Component({
    selector: 'app-mezcla-carga',
    standalone: true,
    imports: [OrigenMaritimoDirective, CommonModule, WidgetShellComponent, KpiFormatPipe],
    templateUrl: './mezcla-carga.component.html',
    styleUrls: ['./mezcla-carga.component.scss']
})
export class MezclaCargaComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy {
    @Input() widgetConfig: any;
    @Input() isEnfoque: boolean = false;
    @Input() mostrarTabla: boolean = false;
    @Input() datosVivos: any;

    @ViewChild('doughnutMaritimoCanvas') doughnutMaritimoCanvas!: ElementRef<HTMLCanvasElement>;

    public chart?: Chart;
    public cargando: boolean = true;
    public sinDatos: boolean = false;
    public totalVolumen: number = 0;
    public unidadMedida: string = 'M Ton';
    public badgeHeader: string = 'VOLUMEN';
    public leyendaItems: ILeyendaDonaItem[] = [];

    private labels: string[] = [];
    private valores: number[] = [];
    private vistaLista: boolean = false;
    private metadatosSQL: any = {};
    private readonly destroy$ = new Subject<void>();

    constructor(
        private _maritimoService: MaritimoService,
        private _torreService: DashboardService,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit(): void {
        this.configurarMetadatosPorCodigo();
        this.cargarDatosMaritimos();
    }

    ngAfterViewInit(): void {
        this.vistaLista = true;
        if (!this.cargando && !this.sinDatos) {
            this.renderizarDona();
        }
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['isEnfoque'] && !changes['isEnfoque'].isFirstChange()) {
            setTimeout(() => this.chart?.resize(), 60);
        }

        if (
            (changes['widgetConfig'] && !changes['widgetConfig'].firstChange) ||
            (changes['datosVivos'] && this.datosVivos)
        ) {
            this.configurarMetadatosPorCodigo();
            this.cargarDatosMaritimos();
        }
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
        if (this.chart) {
            this.chart.destroy();
        }
    }

    private configurarMetadatosPorCodigo(): void {
        const codigo = (
            this.widgetConfig?.type ||
            this.widgetConfig?.codigoWidget ||
            ''
        ).toUpperCase();

        if (codigo.includes('PARTICIPACION') || codigo.includes('MERCADO')) {
            this.badgeHeader = 'MERCADO';
            this.unidadMedida = '%';
        } else if (codigo.includes('OPERACION') || codigo.includes('COMERCIO')) {
            this.badgeHeader = 'COMERCIO';
            this.unidadMedida = 'Ton';
        } else {
            this.badgeHeader = 'VOLUMEN';
            this.unidadMedida = 'Ton';
        }
    }

    private cargarDatosMaritimos(): void {
        if (
            this.datosVivos &&
            (this.datosVivos.labels || this.datosVivos.valores || Array.isArray(this.datosVivos))
        ) {
            this.procesarPayload(this.datosVivos);
            return;
        }

        const puerto = (this.widgetConfig?.puerto || 'BUENAVENTURA').trim().toUpperCase();
        const codigoWidget = (
            this.widgetConfig?.type ||
            this.widgetConfig?.codigoWidget ||
            'PTT_MAE_CHRT_MEZCLA_CARGA'
        )
            .trim()
            .toUpperCase();

        this.cargando = true;

        this._maritimoService
            .obtenerDatosWidgetMaritimo(puerto, codigoWidget)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (res: any) => this.procesarPayload(res),
                error: (err) => {
                    console.error('❌ [SmartWidget MezclaCarga] Error consultando mezcla de carga:', err);
                    this.sinDatos = true;
                    this.cargando = false;
                    this.cdr.detectChanges();
                }
            });
    }

    /**
     * Soporta:
     * 1. Objeto { labels, valores } o { labels, datasets: [{ data }] }
     * 2. Filas crudas de SQL Server: [{ tipo_carga / tipoCarga, toneladas / totalToneladas }]
     */
    private procesarPayload(raw: any): void {
        if (!raw) {
            this.sinDatos = true;
            this.cargando = false;
            this.cdr.detectChanges();
            return;
        }

        this.metadatosSQL = Array.isArray(raw) ? {} : raw;

        const etiquetas = raw.labels || raw.categorias || [];
        const series = raw.valores || raw.data || raw.datasets?.[0]?.data || [];

        if (Array.isArray(etiquetas) && etiquetas.length > 0) {
            this.labels = etiquetas.map((l: any) => String(l));
            this.valores = series.map((v: any) => Number(v || 0));
        } else {
            // Homologación si vienen filas crudas desde SQL Server
            const filas: any[] = Array.isArray(raw) ? raw : raw.rows || raw.data || [];
            if (filas.length > 0) {
                const agrupado = new Map<string, number>();
                filas.forEach((f: any) => {
                    const clave = String(
                        f.tipoCarga ||
                        f.tipo_carga ||
                        f.categoria ||
                        f.terminal ||
                        f.tipo_operacion ||
                        'Carga General'
                    ).trim();

                    const valorFila = Number(
                        f.totalToneladas ??
                        f.total_toneladas ??
                        f.toneladas ??
                        f.volumen ??
                        f.valor ??
                        (Number(f.importacion || 0) +
                            Number(f.exportacion || 0) +
                            Number(f.transbordo || 0))
                    );

                    agrupado.set(clave, (agrupado.get(clave) || 0) + (isNaN(valorFila) ? 0 : valorFila));
                });

                this.labels = Array.from(agrupado.keys());
                this.valores = Array.from(agrupado.values()).map((v) => Number(v.toFixed(1)));
            } else {
                this.labels = [];
                this.valores = [];
            }
        }

        const { total, items } = PorttosChartHelper.calcularLeyendaDona(this.labels, this.valores);
        this.totalVolumen = total;
        this.leyendaItems = items;
        this.sinDatos = this.labels.length === 0 || this.totalVolumen === 0;

        this.cargando = false;
        // Primero actualizamos la vista para que el canvas deje de estar [hidden]
        this.cdr.detectChanges();

        if (this.vistaLista && !this.sinDatos) {
            setTimeout(() => this.renderizarDona(), 20);
        }
    }

    private renderizarDona(): void {
        if (!this.vistaLista || this.sinDatos || !this.doughnutMaritimoCanvas?.nativeElement) return;

        this.chart = PorttosChartHelper.renderizarDona(
            this.doughnutMaritimoCanvas,
            this.chart,
            this.labels,
            this.valores,
            this.unidadMedida
        );
    }

    get data(): any {
        return {
            ...(this.widgetConfig?.data || {}),
            ...this.metadatosSQL,
            labels: this.labels,
            valores: this.valores
        };
    }

    public maximizarDesdeShell(): void {
        if (this.isEnfoque) {
            this._torreService.cerrarModoEnfoque();
        } else {
            this._torreService.abrirModoEnfoque(
                this.widgetConfig?.type || 'PTT_MAE_CHRT_MEZCLA_CARGA',
                this.data
            );
        }
    }
}
