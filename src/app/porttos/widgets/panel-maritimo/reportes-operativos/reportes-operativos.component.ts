/* eslint-disable @typescript-eslint/no-explicit-any */
/*
    Author: German Valencia
    Pattern: PORTTOS Smart Widget - Reportes Operativos (Consumo Autónomo SQL)
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

export interface IReporteOperativoItem {
    id_reporte?: number | string;
    puerto?: string;
    titulo: string;
    descripcion: string;
    fecha_evento: string;
    tipo_color: string;
    icono?: string;
}

import { OrigenMaritimoDirective } from '../../shared/origen-maritimo.directive';

@Component({
    selector: 'app-reportes-operativos',
    standalone: true,
    imports: [OrigenMaritimoDirective, CommonModule, WidgetShellComponent],
    templateUrl: './reportes-operativos.component.html',
    styleUrls: ['./reportes-operativos.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class ReportesOperativosComponent implements OnInit, OnChanges, OnDestroy {
    @Input() widgetConfig: any;
    @Input() isEnfoque: boolean = false;
    @Input() mostrarTabla: boolean = false;

    // Respaldo cuando se abre en el modal de Modo Enfoque
    @Input() datosVivos: any;

    public cargandoReportes: boolean = true;
    private datosAutonomosSQL: any = null;
    private readonly destroy$ = new Subject<void>();

    constructor(
        private _maritimoService: MaritimoService,
        private _torreService: DashboardService,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit(): void {
        this.cargarReportesOperativos();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (
            (changes['widgetConfig'] && !changes['widgetConfig'].firstChange) ||
            (changes['datosVivos'] && this.datosVivos)
        ) {
            this.cargarReportesOperativos();
        }
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    /**
     * Consulta autónoma a SQL Server (TCL_ReportesOperativos) filtrada por puerto
     */
    private cargarReportesOperativos(): void {
        // 1. Si viene precargado desde el modal de Modo Enfoque
        if (this.datosVivos && (Array.isArray(this.datosVivos.reportes) || Array.isArray(this.datosVivos))) {
            this.datosAutonomosSQL = this.normalizarReportes(this.datosVivos);
            this.cargandoReportes = false;
            this.cdr.detectChanges();
            return;
        }

        const puerto = (this.widgetConfig?.puerto || 'BUENAVENTURA').trim().toUpperCase();
        const codigoWidget = (this.widgetConfig?.type || this.widgetConfig?.codigoWidget || 'PTT_MAE_PANEL_ALERTAS')
            .trim()
            .toUpperCase();

        this.cargandoReportes = true;

        this._maritimoService
            .obtenerDatosWidgetMaritimo(puerto, codigoWidget)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (respuestaSQL: any) => {
                    this.datosAutonomosSQL = this.normalizarReportes(respuestaSQL);
                    this.cargandoReportes = false;
                    this.cdr.detectChanges();
                },
                error: (err) => {
                    console.error('❌ [SmartWidget ReportesOperativos] Error consultando novedades:', err);
                    this.datosAutonomosSQL = { reportes: [] };
                    this.cargandoReportes = false;
                    this.cdr.detectChanges();
                }
            });
    }

    /**
     * Homologa registros provenientes de:
     * - Objeto estructurado { reportes: [...] }
     * - Filas directas de dbo.TCL_ReportesOperativos (id_reporte, puerto, titulo, fecha_evento, descripcion, tipo_color, icono)
     */
    private normalizarReportes(raw: any): any {
        if (!raw) return { reportes: [] };

        const listaCruda: any[] = Array.isArray(raw)
            ? raw
            : raw.reportes || raw.rows || raw.data || [];

        const reportesNormalizados: IReporteOperativoItem[] = listaCruda.map((r: any, idx: number) => ({
            id_reporte: r.id_reporte ?? r.id ?? idx,
            puerto: r.puerto || '',
            titulo: r.titulo || 'Novedad Operativa',
            descripcion: r.descripcion || r.detalle || 'Sin descripción adicional',
            fecha_evento: r.fecha_evento || r.fecha_registro || r.fecha || 'Hoy',
            tipo_color: this.normalizarColorSeveridad(r.tipo_color || r.severidad),
            icono: r.icono || '📄'
        }));

        return {
            ...(Array.isArray(raw) ? {} : raw),
            titulo: raw.titulo || 'REPORTES OPERATIVOS',
            subtitulo: raw.subtitulo || 'Registro de novedades y boletines oficiales',
            icono: raw.icono || 'feather icon-file-text',
            reportes: reportesNormalizados
        };
    }

    private normalizarColorSeveridad(colorRaw?: string): string {
        const c = (colorRaw || '').toLowerCase().trim();
        if (['success', 'warning', 'danger', 'info', 'primary', 'secondary'].includes(c)) {
            return c;
        }
        if (c.includes('roj') || c.includes('crit') || c.includes('alert')) return 'danger';
        if (c.includes('amarill') || c.includes('prev') || c.includes('demor')) return 'warning';
        if (c.includes('verd') || c.includes('ok') || c.includes('norm')) return 'success';
        return 'info';
    }

    get data(): any {
        const configBase = this.widgetConfig?.data || {};
        return {
            ...configBase,
            ...(this.datosVivos || {}),
            ...(this.datosAutonomosSQL || {})
        };
    }

    get reportes(): IReporteOperativoItem[] {
        return this.data?.reportes || [];
    }

    get isLoading(): boolean {
        return this.cargandoReportes && !this.datosAutonomosSQL && !this.datosVivos;
    }

    trackByReporte(index: number, item: IReporteOperativoItem): string | number {
        return item.id_reporte ?? `${item.titulo}-${index}`;
    }

    maximizarDesdeShell(): void {
        if (this.isEnfoque) {
            this._torreService.cerrarModoEnfoque();
        } else {
            this._torreService.abrirModoEnfoque(
                this.widgetConfig?.type || 'PTT_MAE_PANEL_ALERTAS',
                this.data
            );
        }
    }
}
