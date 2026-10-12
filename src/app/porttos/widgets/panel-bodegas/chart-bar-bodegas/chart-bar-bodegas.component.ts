/* eslint-disable @typescript-eslint/no-explicit-any */
/*
    Author: German Valencia
    Pattern: PORTTOS Smart Widget - Gráfica de Barras Flujo de Bodegas (Consumo Autónomo SQL)
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
import { CommonModule, DecimalPipe } from '@angular/common';
import { Chart } from 'chart.js';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { WidgetShellComponent } from 'src/app/theme/shared/components/widget-shell/widget-shell.component';
import { BodegasService } from 'src/app/theme/shared/service/tablero-control/bodegas.service';
import { DashboardService } from 'src/app/theme/shared/service/tablero-control/dashboard.service';
import { PorttosChartHelper } from 'src/app/theme/shared/_helpers/chart.helper';

@Component({
    selector: 'app-chart-bar-bodegas',
    standalone: true,
    imports: [CommonModule, DecimalPipe, WidgetShellComponent],
    templateUrl: './chart-bar-bodegas.component.html',
    styleUrls: ['./chart-bar-bodegas.component.scss']
})
export class ChartBarBodegasComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy {
    @Input() widgetConfig: any;
    @Input() isEnfoque: boolean = false;
    @Input() mostrarTabla: boolean = false;
    @Input() datosVivos: any;

    @ViewChild('barBodegasCanvas') barBodegasCanvas!: ElementRef<HTMLCanvasElement>;

    public chart?: Chart;
    public cargando: boolean = true;
    public sinDatos: boolean = false;
    public totalEntradasTon: number = 0;
    public totalSalidasTon: number = 0;

    private labels: string[] = [];
    private serieEntradas: number[] = [];
    private serieSalidas: number[] = [];
    private vistaLista: boolean = false;
    private metadatosSQL: any = {};
    private readonly destroy$ = new Subject<void>();

    constructor(
        private _bodegasService: BodegasService,
        private _torreService: DashboardService,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit(): void {
        this.cargarFlujoBodegas();
    }

    ngAfterViewInit(): void {
        this.vistaLista = true;
        this.renderizarGrafica();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['isEnfoque'] && !changes['isEnfoque'].isFirstChange()) {
            setTimeout(() => this.chart?.resize(), 60);
        }

        if (
            (changes['widgetConfig'] && !changes['widgetConfig'].firstChange) ||
            (changes['datosVivos'] && this.datosVivos)
        ) {
            this.cargarFlujoBodegas();
        }
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
        if (this.chart) {
            this.chart.destroy();
        }
    }

    private cargarFlujoBodegas(): void {
        if (this.datosVivos && (this.datosVivos.labels || this.datosVivos.categorias)) {
            this.procesarPayloadFlujo(this.datosVivos);
            return;
        }

        const puerto = (this.widgetConfig?.puerto || 'BUENAVENTURA').trim().toUpperCase();
        const codigoWidget = (
            this.widgetConfig?.type ||
            this.widgetConfig?.codigoWidget ||
            'PTT_BOD_CHRT_FLUJO'
        )
            .trim()
            .toUpperCase();

        this.cargando = true;

        this._bodegasService
            .obtenerDatosWidgetBodegas(puerto, codigoWidget)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (respuestaSQL: any) => {
                    this.procesarPayloadFlujo(respuestaSQL);
                },
                error: (err) => {
                    console.error('❌ [SmartWidget ChartBarBodegas] Error consultando flujo:', err);
                    this.sinDatos = true;
                    this.cargando = false;
                    this.cdr.detectChanges();
                }
            });
    }

    private procesarPayloadFlujo(raw: any): void {
        if (!raw) {
            this.sinDatos = true;
            this.cargando = false;
            this.cdr.detectChanges();
            return;
        }

        this.metadatosSQL = Array.isArray(raw) ? {} : raw;

        const categorias = raw.categorias || raw.labels || [];
        const entradas = raw.entradas || raw.ingresos || raw.datasets?.[0]?.data || [];
        const salidas = raw.salidas || raw.despachos || raw.datasets?.[1]?.data || [];

        if (Array.isArray(categorias) && categorias.length > 0) {
            this.labels = categorias.map((c: any) => String(c));
            this.serieEntradas = entradas.map((v: any) => Number(v || 0));
            this.serieSalidas = salidas.map((v: any) => Number(v || 0));
            this.sinDatos = false;
        } else if (Array.isArray(raw) && raw.length > 0) {
            const mapa = new Map<string, { entrada: number; salida: number }>();
            raw.forEach((m: any) => {
                const clave = m.nombre_bodega || m.codigo_bodega || 'General';
                const actual = mapa.get(clave) || { entrada: 0, salida: 0 };
                const ton = Number(m.toneladas || 0);
                const op = String(m.tipo_operacion || '').toUpperCase();

                if (op.includes('INGRESO') || op.includes('DESCARG') || op.includes('ENTRADA')) {
                    actual.entrada += ton;
                } else {
                    actual.salida += ton;
                }
                mapa.set(clave, actual);
            });

            this.labels = Array.from(mapa.keys());
            this.serieEntradas = Array.from(mapa.values()).map((v) => Number(v.entrada.toFixed(1)));
            this.serieSalidas = Array.from(mapa.values()).map((v) => Number(v.salida.toFixed(1)));
            this.sinDatos = this.labels.length === 0;
        } else {
            this.labels = [];
            this.serieEntradas = [];
            this.serieSalidas = [];
            this.sinDatos = true;
        }

        this.totalEntradasTon = this.serieEntradas.reduce((a, b) => a + b, 0);
        this.totalSalidasTon = this.serieSalidas.reduce((a, b) => a + b, 0);

        this.cargando = false;
        this.renderizarGrafica();
        this.cdr.detectChanges();
    }

    private renderizarGrafica(): void {
        if (!this.vistaLista || this.sinDatos || this.labels.length === 0) return;

        this.chart = PorttosChartHelper.renderizarBarras(
            this.barBodegasCanvas,
            this.chart,
            {
                labels: this.labels,
                unidad: 'Ton',
                isEnfoque: this.isEnfoque,
                datasets: [
                    {
                        label: 'Ingreso (Descargue Buque)',
                        data: this.serieEntradas,
                        color: '#00d4ff'
                    },
                    {
                        label: 'Salida (Despacho Camión)',
                        data: this.serieSalidas,
                        color: '#10b981'
                    }
                ]
            }
        );
    }

    get data(): any {
        return {
            ...(this.widgetConfig?.data || {}),
            ...this.metadatosSQL,
            labels: this.labels,
            entradas: this.serieEntradas,
            salidas: this.serieSalidas
        };
    }

    public maximizarDesdeShell(): void {
        if (this.isEnfoque) {
            this._torreService.cerrarModoEnfoque();
        } else {
            this._torreService.abrirModoEnfoque(
                this.widgetConfig?.type || 'PTT_BOD_CHRT_FLUJO',
                this.data
            );
        }
    }
}
