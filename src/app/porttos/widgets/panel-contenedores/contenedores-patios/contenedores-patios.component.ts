/* eslint-disable @typescript-eslint/no-explicit-any */
/*
    Author: German Valencia
    Pattern: PORTTOS Smart Widget - Saturación de Patios y Depots (Consumo Autónomo SQL)
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
import { ContenedoresService } from 'src/app/theme/shared/service/tablero-control/contenedores.service';
import { WidgetShellComponent } from 'src/app/theme/shared/components/widget-shell/widget-shell.component';

export interface IPatioSaturacion {
    id?: string | number;
    nombre: string;
    porcentaje: number;
    estado: 'CRÍTICO' | 'ALTO' | 'NORMAL' | string;
    capacidadTeus?: number;
}

@Component({
    selector: 'app-contenedores-patios',
    standalone: true,
    imports: [CommonModule, WidgetShellComponent],
    templateUrl: './contenedores-patios.component.html',
    styleUrls: ['./contenedores-patios.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class ContenedoresPatiosComponent implements OnInit, OnChanges, OnDestroy {
    @Input() widgetConfig: any;
    @Input() isEnfoque: boolean = false;
    @Input() mostrarTabla: boolean = false;

    // Respaldo cuando se abre en el modal de Modo Enfoque
    @Input() datosVivos: any;

    public cargandoPatios: boolean = true;
    public listaPatios: IPatioSaturacion[] = [];

    private metadatosSQL: any = {};
    private readonly destroy$ = new Subject<void>();

    constructor(
        private _contenedoresService: ContenedoresService,
        private _torreService: DashboardService,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit(): void {
        this.cargarSaturacionPatios();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (
            (changes['widgetConfig'] && !changes['widgetConfig'].firstChange) ||
            (changes['datosVivos'] && this.datosVivos)
        ) {
            this.cargarSaturacionPatios();
        }
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    /**
     * Consulta autónoma a ContenedoresService (T_Maestro_NodosLogisticos / saturacionPatios)
     */
    private cargarSaturacionPatios(): void {
        // 1. Si viene precargado desde el modal de Modo Enfoque
        if (
            this.datosVivos &&
            (Array.isArray(this.datosVivos) ||
                Array.isArray(this.datosVivos.saturacionPatios) ||
                Array.isArray(this.datosVivos.patios))
        ) {
            this.procesarPayloadPatios(this.datosVivos);
            return;
        }

        const puerto = (this.widgetConfig?.puerto || 'BUENAVENTURA').trim().toUpperCase();
        const codigoWidget = (
            this.widgetConfig?.type ||
            this.widgetConfig?.codigoWidget ||
            'PTT_CONT_PANEL_PATIOS'
        )
            .trim()
            .toUpperCase();

        this.cargandoPatios = true;

        this._contenedoresService
            .obtenerDatosWidgetContenedores(codigoWidget, puerto) // Corregido 2026-10-17: antes (puerto, codigo) → tomaba el puerto guardado, no el del filtro
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (respuestaSQL: any) => {
                    this.procesarPayloadPatios(respuestaSQL);
                },
                error: (err) => {
                    console.error('❌ [SmartWidget ContenedoresPatios] Error consultando ocupación de patios:', err);
                    this.listaPatios = [];
                    this.cargandoPatios = false;
                    this.cdr.detectChanges();
                }
            });
    }

    /**
     * Soporta:
     * 1. Arreglo directo [{ nombre, porcentaje, estado }]
     * 2. Objeto con { saturacionPatios: [...] } o { patios: [...] }
     * 3. Filas de dbo.T_Maestro_NodosLogisticos (nombre_nodo, ocupacion_actual_pct, capacidad_teus, estado_operativo)
     */
    private procesarPayloadPatios(raw: any): void {
        if (!raw) {
            this.listaPatios = [];
            this.cargandoPatios = false;
            this.cdr.detectChanges();
            return;
        }

        this.metadatosSQL = Array.isArray(raw) ? {} : raw;

        const filasCrudas: any[] = Array.isArray(raw)
            ? raw
            : raw.saturacionPatios || raw.patios || raw.rows || raw.data || [];

        this.listaPatios = filasCrudas.map((p: any, idx: number) => {
            const nombre =
                p.nombre ||
                p.nombre_nodo ||
                p.nombreNodo ||
                p.patio ||
                `Patio #${idx + 1}`;

            const porcentaje = Math.min(
                100,
                Math.max(
                    0,
                    Math.round(
                        Number(
                            p.porcentaje ??
                            p.ocupacion_actual_pct ??
                            p.ocupacion ??
                            p.porcentajeOcupacion ??
                            0
                        )
                    )
                )
            );

            const estado = this.resolverEstadoSemantico(p.estado || p.estado_operativo, porcentaje);

            return {
                id: p.id_nodo ?? p.id ?? idx,
                nombre,
                porcentaje,
                estado,
                capacidadTeus: p.capacidad_teus ? Number(p.capacidad_teus) : undefined
            };
        });

        this.cargandoPatios = false;
        this.cdr.detectChanges();
    }

    private resolverEstadoSemantico(estadoRaw: string | undefined, porcentaje: number): string {
        if (estadoRaw) {
            const up = estadoRaw.toUpperCase().trim();
            if (up.includes('CRÍTIC') || up.includes('CRITIC') || up.includes('SATURAD')) return 'CRÍTICO';
            if (up.includes('ALTO') || up.includes('ALERTA')) return 'ALTO';
            if (up.includes('NORMAL') || up.includes('OK') || up.includes('ÓPTIM')) return 'NORMAL';
        }
        if (porcentaje >= 90) return 'CRÍTICO';
        if (porcentaje >= 75) return 'ALTO';
        return 'NORMAL';
    }

    get listadoPatios(): IPatioSaturacion[] {
        return this.listaPatios;
    }

    get configData(): any {
        const base = this.widgetConfig?.data || {};
        const safeBase = Array.isArray(base) ? {} : base;
        return {
            ...safeBase,
            ...this.metadatosSQL,
            saturacionPatios: this.listaPatios
        };
    }

    get isLoading(): boolean {
        return this.cargandoPatios && this.listaPatios.length === 0;
    }

    getColorBarra(porcentaje: number): string {
        if (porcentaje >= 90) return '#ef4444'; // Rojo (Crítico)
        if (porcentaje >= 75) return '#f59e0b'; // Naranja (Alto)
        return '#10b981'; // Verde (Normal)
    }

    getEstadoBadge(estado: string): string {
        switch (estado?.toUpperCase()) {
            case 'CRÍTICO':
            case 'CRITICO':
                return 'bg-danger text-white border-danger';
            case 'ALTO':
                return 'bg-warning text-dark border-warning';
            default:
                return 'bg-success text-white border-success';
        }
    }

    trackByPatio(index: number, item: IPatioSaturacion): string | number {
        return item.id ?? `${item.nombre}-${index}`;
    }

    maximizarDesdeShell(): void {
        if (this.isEnfoque) {
            this._torreService.cerrarModoEnfoque();
        } else {
            this._torreService.abrirModoEnfoque(
                this.widgetConfig?.type || 'PTT_CONT_PANEL_PATIOS',
                this.configData
            );
        }
    }
}
