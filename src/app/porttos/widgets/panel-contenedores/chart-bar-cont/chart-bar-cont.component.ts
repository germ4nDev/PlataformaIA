/* eslint-disable @typescript-eslint/no-explicit-any */
/*
    Author: German Valencia
    Pattern: PORTTOS Smart Widget - Balance Operativo de Contenedores
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
import { ContenedoresService } from 'src/app/theme/shared/service/tablero-control/contenedores.service';
import { DashboardService } from 'src/app/theme/shared/service/tablero-control/dashboard.service';
import {
    PorttosChartHelper,
    IDatasetBarra
} from 'src/app/theme/shared/_helpers/chart.helper';

@Component({
    selector: 'app-chart-bar-contenedores',
    standalone: true,
    imports: [CommonModule, DecimalPipe, WidgetShellComponent],
    templateUrl: './chart-bar-cont.component.html',
    styleUrls: ['./chart-bar-cont.component.scss']
})
export class ChartBarContComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy {
    @Input() widgetConfig: any;
    @Input() isEnfoque: boolean = false;
    @Input() mostrarTabla: boolean = false;
    @Input() datosVivos: any;

    @ViewChild('barContCanvas') barContCanvas!: ElementRef<HTMLCanvasElement>;

    public chart?: Chart;
    public cargando: boolean = true;
    public sinDatos: boolean = false;

    private labels: string[] = [];
    private datasets: IDatasetBarra[] = [];
    private vistaLista: boolean = false;
    private metadatosSQL: any = {};
    private readonly destroy$ = new Subject<void>();

    constructor(
        private _contenedoresService: ContenedoresService,
        private _torreService: DashboardService,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit(): void {
        this.cargarBarrasContenedores();
    }

    ngAfterViewInit(): void {
        this.vistaLista = true;
        this.renderizarGrafica();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['isEnfoque'] && !changes['isEnfoque'].firstChange) {
            setTimeout(() => this.chart?.resize(), 60);
        }

        if (
            (changes['widgetConfig'] && !changes['widgetConfig'].firstChange) ||
            (changes['datosVivos'] && this.datosVivos)
        ) {
            this.cargarBarrasContenedores();
        }
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
        if (this.chart) {
            this.chart.destroy();
        }
    }

    private cargarBarrasContenedores(): void {
        if (this.datosVivos && (this.datosVivos.labels || this.datosVivos.categorias)) {
            this.procesarPayload(this.datosVivos);
            return;
        }

        const puerto = (this.widgetConfig?.puerto || 'BUENAVENTURA').trim().toUpperCase();
        const codigoWidget = (
            this.widgetConfig?.type ||
            this.widgetConfig?.codigoWidget ||
            'PTT_CONT_CHRT_FLUJO'
        )
            .trim()
            .toUpperCase();

        this.cargando = true;

        this._contenedoresService
            .obtenerDatosWidgetContenedores(codigoWidget, puerto)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (res: any) => {
                    console.log('📊 [ChartBarContComponent] Datos recibidos del servicio:', res);
                    this.procesarPayload(res);
                },
                error: (err) => {
                    console.error('❌ [SmartWidget ChartBarContenedores] Error:', err);
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

        // 🟢 SOPORTE DIRECTO PARA 'categorias' y 'series' (como se ve en tu consola)
        const nodo = raw.vaciosNaviera || raw.retirosPriorizacion || raw;

        if (Array.isArray(nodo.categorias) && Array.isArray(nodo.series)) {
            this.labels = nodo.categorias.map((l: any) => String(l));
            this.datasets = nodo.series.map((s: any, idx: number) => ({
                label: s.name || s.label || `Serie ${idx + 1}`,
                data: (s.data || []).map((v: any) => Number(v || 0)),
                color: s.color || PorttosChartHelper.PALETA_DEFAULT[idx % PorttosChartHelper.PALETA_DEFAULT.length]
            }));
        } else if (Array.isArray(nodo.labels) && Array.isArray(nodo.datasets)) {
            this.labels = nodo.labels.map((l: any) => String(l));
            this.datasets = nodo.datasets.map((ds: any, idx: number) => ({
                label: ds.label || `Serie ${idx + 1}`,
                data: (ds.data || []).map((v: any) => Number(v || 0)),
                color: ds.backgroundColor || ds.color || PorttosChartHelper.PALETA_DEFAULT[idx % PorttosChartHelper.PALETA_DEFAULT.length]
            }));
        } else {
            // Fallback por si llegan movimientos sueltos
            // Corregido 2026-10-17: PTT_CONT_CHRT_FLUJO recibe la lista directa de movimientos
            const movimientos = Array.isArray(raw) ? raw : (Array.isArray(raw.movimientos) ? raw.movimientos : []);
            if (movimientos.length > 0) {
                const conteoPorTipo = new Map<string, number>();
                movimientos.forEach((m: any) => {
                    const tipo = String(m.tipo || m.operacion || m.estado || 'GENERAL').trim();
                    conteoPorTipo.set(tipo, (conteoPorTipo.get(tipo) || 0) + 1);
                });
                this.labels = Array.from(conteoPorTipo.keys());
                this.datasets = [{ label: 'Movimientos', data: Array.from(conteoPorTipo.values()), color: '#00d4ff' }];
            } else {
                this.labels = [];
                this.datasets = [];
            }
        }

        const sumaTotal = this.datasets.reduce(
            (acc, ds) => acc + ds.data.reduce((s, v) => s + v, 0),
            0
        );

        this.sinDatos = this.labels.length === 0 || sumaTotal === 0;
        this.cargando = false;
        this.renderizarGrafica();
        this.cdr.detectChanges();
    }

    private renderizarGrafica(): void {
        if (!this.vistaLista || this.sinDatos || !this.barContCanvas?.nativeElement) return;

        this.chart = PorttosChartHelper.renderizarBarras(
            this.barContCanvas,
            this.chart,
            {
                labels: this.labels,
                datasets: this.datasets,
                unidad: 'Cont.',
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
                this.widgetConfig?.type || 'PTT_CONT_CHRT_FLUJO',
                this.data
            );
        }
    }
}
