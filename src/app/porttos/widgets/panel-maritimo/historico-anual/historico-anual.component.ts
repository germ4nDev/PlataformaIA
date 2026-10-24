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

import { OrigenMaritimoDirective } from '../../shared/origen-maritimo.directive';

@Component({
    selector: 'app-historico-anual',
    standalone: true,
    imports: [OrigenMaritimoDirective, CommonModule, WidgetShellComponent],
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
