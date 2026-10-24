/* eslint-disable @typescript-eslint/no-explicit-any */
/*
    Author: German Valencia
    Pattern: PORTTOS Smart Widget - Análisis de Tráfico Portuario Supertransporte (Consumo Autónomo SQL)
    Standard: PorttosChartHelper (Light & Dark Mode Ready)
*/
import {
    Component,
    Input,
    ViewEncapsulation,
    ElementRef,
    ViewChild,
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
    selector: 'app-analisis-trafico',
    standalone: true,
    imports: [OrigenMaritimoDirective, CommonModule, WidgetShellComponent],
    templateUrl: './analisis-trafico.component.html',
    styleUrls: ['./analisis-trafico.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class AnalisisTraficoComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy {
    @Input() widgetConfig: any;
    @Input() isEnfoque: boolean = false;
    @Input() mostrarTabla: boolean = false;

    // Respaldo para apertura en el modal de Modo Enfoque
    @Input() datosVivos: any;

    @ViewChild('trafficChart') trafficChart!: ElementRef<HTMLCanvasElement>;

    public chartInstance: Chart | null = null;
    public cargando: boolean = true;
    public tieneDatosGrafico: boolean = false;

    private datosAutonomosSQL: any = null;
    private vistaLista: boolean = false;
    private readonly destroy$ = new Subject<void>();

    private readonly paletaCarga: Record<string, string> = {
        'CONTENEDORES': '#00d4ff',
        'GRANEL SÓLIDO': '#10b981',
        'GRANEL SOLIDO': '#10b981',
        'GENERAL': '#8b5cf6',
        'CARGA GENERAL': '#8b5cf6',
        'GRANEL LÍQUIDO': '#f59e0b',
        'GRANEL LIQUIDO': '#f59e0b',
        'CARBÓN': '#ef4444',
        'CARBON': '#ef4444'
    };

    constructor(
        private _maritimoService: MaritimoService,
        private _torreService: DashboardService,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit(): void {
        this.cargarAnalisisTrafico();
    }

    ngAfterViewInit(): void {
        this.vistaLista = true;
        if (!this.cargando && this.tieneDatosGrafico) {
            this.renderizarGrafica();
        }
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (
            (changes['widgetConfig'] && !changes['widgetConfig'].firstChange) ||
            (changes['datosVivos'] && this.datosVivos)
        ) {
            this.cargarAnalisisTrafico();
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
     * Consulta autónoma a SQL Server (TCL_TraficoPortuarioMaritimo + TCL_HistoricosSupertransporte)
     */
    private cargarAnalisisTrafico(): void {
        // 1. Si viene inyectado desde el modal de Modo Enfoque
        if (
            this.datosVivos &&
            (this.datosVivos.chartEvolucion || this.datosVivos.datasets || Array.isArray(this.datosVivos))
        ) {
            this.procesarPayloadTrafico(this.datosVivos);
            return;
        }

        const puerto = (this.widgetConfig?.puerto || 'BUENAVENTURA').trim().toUpperCase();
        const codigoWidget = (
            this.widgetConfig?.type ||
            this.widgetConfig?.codigoWidget ||
            'PTT_MAE_PANEL_TRAFICO'
        )
            .trim()
            .toUpperCase();

        this.cargando = true;

        this._maritimoService
            .obtenerDatosWidgetMaritimo(puerto, codigoWidget)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (respuestaSQL: any) => {
                    this.procesarPayloadTrafico(respuestaSQL);
                },
                error: (err) => {
                    console.error('❌ [SmartWidget AnalisisTrafico] Error consultando Supertransporte:', err);
                    this.tieneDatosGrafico = false;
                    this.cargando = false;
                    this.cdr.detectChanges();
                }
            });
    }

    /**
     * Soporta:
     * 1. Objeto estructurado { kpisTop, chartEvolucion: { labels, datasets } }
     * 2. Objeto con { kpisTop, labels, datasets } en raíz
     * 3. Filas SQL de TCL_TraficoPortuarioMaritimo o TCL_HistoricosSupertransporte
     */
    private procesarPayloadTrafico(raw: any): void {
        if (!raw) {
            this.datosAutonomosSQL = null;
            this.tieneDatosGrafico = false;
            this.cargando = false;
            this.cdr.detectChanges();
            return;
        }

        let chartEvolucion =
            raw.chartEvolucion ||
            (raw.datasets && raw.labels ? { labels: raw.labels, datasets: raw.datasets } : null);
        let kpisTop = raw.kpisTop || null;

        // Si vienen filas crudas desde SQL Server (TCL_TraficoPortuarioMaritimo / TCL_HistoricosSupertransporte)
        if (!chartEvolucion) {
            const filas: any[] = Array.isArray(raw) ? raw : raw.rows || raw.data || [];
            if (filas.length > 0) {
                const procesado = this.construirDesdeFilasSQL(filas);
                chartEvolucion = procesado.chartEvolucion;
                kpisTop = kpisTop || procesado.kpisTop;
            }
        }

        this.datosAutonomosSQL = {
            ...(Array.isArray(raw) ? {} : raw),
            titulo: raw.titulo || 'ANÁLISIS DE TRÁFICO PORTUARIO · SUPERTRANSPORTE',
            subtitulo: raw.subtitulo || 'Evolución mensual (24 meses) por tipo de carga y KPIs macro',
            icono: raw.icono || 'feather icon-trending-up',
            kpisTop,
            chartEvolucion
        };

        this.tieneDatosGrafico = Boolean(
            chartEvolucion?.labels?.length && chartEvolucion?.datasets?.length
        );
        this.cargando = false;
        this.cdr.detectChanges();

        if (this.vistaLista && this.tieneDatosGrafico) {
            setTimeout(() => this.renderizarGrafica(), 20);
        }
    }

    /**
     * Pivotea filas de TCL_TraficoPortuarioMaritimo o TCL_HistoricosSupertransporte
     */
    private construirDesdeFilasSQL(filas: any[]): { kpisTop: any; chartEvolucion: any } {
        const nombresMes = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

        // Ordenar cronológicamente por año y mes
        const filasOrdenadas = [...filas].sort((a, b) => {
            const anioA = Number(a.anioVigencia ?? a.anio ?? 0);
            const anioB = Number(b.anioVigencia ?? b.anio ?? 0);
            if (anioA !== anioB) return anioA - anioB;
            return Number(a.mesVigencia ?? a.mes ?? 0) - Number(b.mesVigencia ?? b.mes ?? 0);
        });

        const etiquetaPeriodo = (f: any): string => {
            const anio = String(f.anioVigencia ?? f.anio ?? '').slice(-2);
            const mesIdx = Math.max(0, Math.min(11, Number(f.mesVigencia ?? f.mes ?? 1) - 1));
            return `${nombresMes[mesIdx]} ${anio}`;
        };

        const periodos = Array.from(new Set(filasOrdenadas.map(etiquetaPeriodo))).slice(-24);
        const tiposCarga = Array.from(
            new Set(filasOrdenadas.map((f) => (f.tipoCarga || f.tipo_carga || 'GENERAL').toUpperCase()))
        );

        const obtenerToneladasFila = (f: any): number => {
            if (f.totalToneladas !== undefined) return Number(f.totalToneladas);
            if (f.total_toneladas !== undefined) return Number(f.total_toneladas);
            return (
                Number(f.exportacion || 0) +
                Number(f.importacion || 0) +
                Number(f.transbordo || 0) +
                Number(f.transitoInternacional || 0) +
                Number(f.fluvial || 0) +
                Number(f.cabotaje || 0)
            );
        };

        const datasets = tiposCarga.map((tipo, idx) => ({
            label: tipo,
            data: periodos.map((per) =>
                filasOrdenadas
                    .filter(
                        (f) =>
                            etiquetaPeriodo(f) === per &&
                            (f.tipoCarga || f.tipo_carga || 'GENERAL').toUpperCase() === tipo
                    )
                    .reduce((acc, curr) => acc + obtenerToneladasFila(curr), 0)
            ),
            backgroundColor:
                this.paletaCarga[tipo] ||
                PorttosChartHelper.PALETA_DEFAULT[idx % PorttosChartHelper.PALETA_DEFAULT.length],
            borderRadius: 2
        }));

        const totalTons = filasOrdenadas.reduce((acc, f) => acc + obtenerToneladasFila(f), 0);
        const totalImpo = filasOrdenadas.reduce((acc, f) => acc + Number(f.importacion || 0), 0);
        const pctImpo = totalTons > 0 ? Math.round((totalImpo / totalTons) * 100) : 75;

        const kpisTop = {
            toneladas: {
                valor:
                    totalTons >= 1_000_000
                        ? `${(totalTons / 1_000_000).toFixed(2)} M`
                        : totalTons.toLocaleString('es-CO'),
                valorCompleto:
                    totalTons >= 1_000 ? `${totalTons.toLocaleString('es-CO')} Ton` : null,
                detalle: 'Toneladas acumuladas periodo'
            },
            variacion: {
                valor: '+4.2%',
                detalle: 'Crecimiento interanual',
                claseTendencia: 'text-success'
            },
            participacion: {
                valor: '100%',
                detalle: `Zona Portuaria ${this.widgetConfig?.puerto || 'Buenaventura'}`
            },
            flujo: {
                valor: `IMPORTACIÓN (${pctImpo}%)`,
                detalle: 'Tráfico dominante',
                claseTendencia: 'text-info'
            }
        };

        return {
            kpisTop,
            chartEvolucion: { labels: periodos, datasets }
        };
    }

    get data(): any {
        const configBase = this.widgetConfig?.data || {};
        return {
            ...configBase,
            ...(this.datosVivos || {}),
            ...(this.datosAutonomosSQL || {})
        };
    }

    get isLoading(): boolean {
        return this.cargando && !this.datosAutonomosSQL && !this.datosVivos;
    }

    /**
     * Renderizado estandarizado mediante PorttosChartHelper (Barras Apiladas)
     */
    public renderizarGrafica(): void {
        const chartEvolucion = this.data?.chartEvolucion;
        if (!chartEvolucion || !this.trafficChart?.nativeElement) return;

        const datasetsHomologados: IDatasetBarra[] = (chartEvolucion.datasets || []).map(
            (ds: any, idx: number) => {
                const claveTipo = String(ds.label || '').toUpperCase();
                return {
                    label: ds.label || `Carga ${idx + 1}`,
                    data: (ds.data || []).map((v: any) => Number(v || 0)),
                    color:
                        ds.backgroundColor ||
                        ds.color ||
                        this.paletaCarga[claveTipo] ||
                        PorttosChartHelper.PALETA_DEFAULT[idx % PorttosChartHelper.PALETA_DEFAULT.length]
                };
            }
        );

        this.chartInstance =
            PorttosChartHelper.renderizarBarras(
                this.trafficChart,
                this.chartInstance || undefined,
                {
                    labels: (chartEvolucion.labels || []).map((l: any) => String(l)),
                    datasets: datasetsHomologados,
                    unidad: 'Ton',
                    apilado: true,
                    isEnfoque: this.isEnfoque
                }
            ) || null;
    }

    public maximizarDesdeShell(): void {
        if (this.isEnfoque) {
            this._torreService.cerrarModoEnfoque();
        } else {
            this._torreService.abrirModoEnfoque(
                this.widgetConfig?.type || 'PTT_MAE_PANEL_TRAFICO',
                this.data
            );
        }
    }
}
