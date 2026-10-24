/* eslint-disable @typescript-eslint/no-explicit-any */
/*
    Author: German Valencia
    Pattern: PORTTOS Smart Widget - Implicaciones Operativas para la Torre de Control (Consumo Autónomo SQL)
*/
import {
    Component,
    Input,
    OnInit,
    OnChanges,
    OnDestroy,
    SimpleChanges,
    ViewEncapsulation,
    ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { DashboardService } from 'src/app/theme/shared/service/tablero-control/dashboard.service';
import { MaritimoService } from 'src/app/theme/shared/service/tablero-control/maritimo.service';
import { WidgetShellComponent } from 'src/app/theme/shared/components/widget-shell/widget-shell.component';

export interface IInsightOperativo {
    id?: string | number;
    titulo: string;
    descripcion: string;
    color: string;
}

import { OrigenMaritimoDirective } from '../../shared/origen-maritimo.directive';

@Component({
    selector: 'app-implicaciones-operativas',
    standalone: true,
    imports: [OrigenMaritimoDirective, CommonModule, WidgetShellComponent],
    templateUrl: './implicaciones-operativas.component.html',
    styleUrls: ['./implicaciones-operativas.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class ImplicacionesOperativasComponent implements OnInit, OnChanges, OnDestroy {
    @Input() widgetConfig: any;
    @Input() isEnfoque: boolean = false;
    @Input() mostrarTabla: boolean = false;

    // Respaldo cuando se abre en el modal de Modo Enfoque
    @Input() datosVivos: any;

    public cargandoImplicaciones: boolean = true;
    private datosAutonomosSQL: any = null;
    private readonly destroy$ = new Subject<void>();

    private readonly mapaColoresHex: Record<string, string> = {
        'info': '#00d4ff',
        'cyan': '#00d4ff',
        'primary': '#3b82f6',
        'success': '#00c896',
        'green': '#00c896',
        'warning': '#ffb547',
        'orange': '#ffb547',
        'danger': '#ff5b6e',
        'red': '#ff5b6e',
        'purple': '#a78bfa'
    };

    private readonly paletaSecuencial = ['#00d4ff', '#00c896', '#a78bfa', '#ffb547', '#ff5b6e'];

    constructor(
        private _maritimoService: MaritimoService,
        private _torreService: DashboardService,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit(): void {
        this.cargarImplicacionesOperativas();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (
            (changes['widgetConfig'] && !changes['widgetConfig'].firstChange) ||
            (changes['datosVivos'] && this.datosVivos)
        ) {
            this.cargarImplicacionesOperativas();
        }
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    /**
     * Consulta autónoma a SQL Server filtrada por puerto activo
     */
    private cargarImplicacionesOperativas(): void {
        // 1. Si viene precargado desde el modal de Modo Enfoque
        if (
            this.datosVivos &&
            (Array.isArray(this.datosVivos.insights) ||
                Array.isArray(this.datosVivos.implicaciones) ||
                Array.isArray(this.datosVivos))
        ) {
            this.datosAutonomosSQL = this.normalizarImplicaciones(this.datosVivos);
            this.cargandoImplicaciones = false;
            this.cdr.detectChanges();
            return;
        }

        const puerto = (this.widgetConfig?.puerto || 'BUENAVENTURA').trim().toUpperCase();
        const codigoWidget = (
            this.widgetConfig?.type ||
            this.widgetConfig?.codigoWidget ||
            'PTT_MAE_PANEL_IMPLICACIONES'
        )
            .trim()
            .toUpperCase();

        this.cargandoImplicaciones = true;

        this._maritimoService
            .obtenerDatosWidgetMaritimo(puerto, codigoWidget)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (respuestaSQL: any) => {
                    this.datosAutonomosSQL = this.normalizarImplicaciones(respuestaSQL);
                    this.cargandoImplicaciones = false;
                    this.cdr.detectChanges();
                },
                error: (err) => {
                    console.error('❌ [SmartWidget ImplicacionesOperativas] Error consultando implicaciones:', err);
                    this.datosAutonomosSQL = { insights: [] };
                    this.cargandoImplicaciones = false;
                    this.cdr.detectChanges();
                }
            });
    }

    /**
     * Homologa cualquier variante de estructura proveniente del Backend / SQL Server:
     * - { insights: [{ titulo, descripcion, color }] }
     * - { implicaciones: [...] } o { items: [...] }
     * - Arreglo directo de filas SQL
     */
    private normalizarImplicaciones(raw: any): any {
        if (!raw) return { insights: [] };

        const listaCruda: any[] = Array.isArray(raw)
            ? raw
            : raw.insights || raw.implicaciones || raw.items || raw.rows || raw.data || [];

        const insightsNormalizados: IInsightOperativo[] = listaCruda.map((item: any, idx: number) => ({
            id: item.id ?? item.id_implicacion ?? idx,
            titulo: item.titulo || item.foco || item.categoria || `Implicación Operativa #${idx + 1}`,
            descripcion: item.descripcion || item.detalle || item.impacto || '',
            color: this.resolverColorHex(item.color || item.tipo_color || item.severidad, idx)
        }));

        return {
            ...(Array.isArray(raw) ? {} : raw),
            titulo: raw.titulo || '🎯 IMPLICACIONES OPERATIVAS PARA LA TORRE DE CONTROL',
            subtitulo: raw.subtitulo || 'Reglas de priorización y alertas derivadas de la estructura de carga',
            icono: raw.icono || 'feather icon-alert-circle',
            insights: insightsNormalizados
        };
    }

    private resolverColorHex(colorRaw: string | undefined, idx: number): string {
        if (!colorRaw) {
            return this.paletaSecuencial[idx % this.paletaSecuencial.length];
        }
        const limpio = colorRaw.trim().toLowerCase();
        if (limpio.startsWith('#') || limpio.startsWith('rgb')) {
            return colorRaw;
        }
        return this.mapaColoresHex[limpio] || this.paletaSecuencial[idx % this.paletaSecuencial.length];
    }

    get data(): any {
        const configBase = this.widgetConfig?.data || {};
        return {
            ...configBase,
            ...(this.datosVivos || {}),
            ...(this.datosAutonomosSQL || {})
        };
    }

    get insights(): IInsightOperativo[] {
        return this.data?.insights || [];
    }

    get isLoading(): boolean {
        return this.cargandoImplicaciones && !this.datosAutonomosSQL && !this.datosVivos;
    }

    trackByInsight(index: number, item: IInsightOperativo): string | number {
        return item.id ?? `${item.titulo}-${index}`;
    }

    maximizarDesdeShell(): void {
        if (this.isEnfoque) {
            this._torreService.cerrarModoEnfoque();
        } else {
            this._torreService.abrirModoEnfoque(
                this.widgetConfig?.type || 'PTT_MAE_PANEL_IMPLICACIONES',
                this.data
            );
        }
    }
}
