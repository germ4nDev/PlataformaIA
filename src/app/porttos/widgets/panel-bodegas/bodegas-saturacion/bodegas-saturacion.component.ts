/* eslint-disable @typescript-eslint/no-explicit-any */
/*
    Author: German Valencia
    Pattern: PORTTOS Smart Widget - Panel de Saturación de Bodegas y Silos (Consumo Autónomo SQL)
*/
import {
    Component,
    Input,
    OnInit,
    OnChanges,
    OnDestroy,
    SimpleChanges,
    ChangeDetectorRef
} from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { WidgetShellComponent } from 'src/app/theme/shared/components/widget-shell/widget-shell.component';
import { BodegasService } from 'src/app/theme/shared/service/tablero-control/bodegas.service';
import { DashboardService } from 'src/app/theme/shared/service/tablero-control/dashboard.service';

export interface IBodegaItem {
    id_bodega: string | number;
    codigo_bodega: string;
    nombre_bodega: string;
    tipo_almacenamiento: string;
    tipo_carga_principal: string;
    capacidad_maxima_ton: number;
    inventario_actual_ton: number;
    ocupacion_pct: number;
    temperatura_c?: number | null;
    humedad_relativa_pct?: number | null;
    estado_operativo: string;
    colorBarra: string;
    claseBadge: string;
}

@Component({
    selector: 'app-bodegas-saturacion',
    standalone: true,
    imports: [CommonModule, DecimalPipe, WidgetShellComponent],
    templateUrl: './bodegas-saturacion.component.html',
    styleUrls: ['./bodegas-saturacion.component.scss']
})
export class BodegasSaturacionComponent implements OnInit, OnChanges, OnDestroy {
    @Input() widgetConfig: any;
    @Input() isEnfoque: boolean = false;
    @Input() mostrarTabla: boolean = false;

    // Respaldo cuando el widget se abre en el modal de Modo Enfoque
    @Input() datosVivos: any;

    public cargando: boolean = true;
    public listaBodegas: IBodegaItem[] = [];

    private metadatosSQL: any = {};
    private readonly destroy$ = new Subject<void>();

    constructor(
        private _bodegasService: BodegasService,
        private _torreService: DashboardService,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit(): void {
        this.cargarSaturacionBodegas();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (
            (changes['widgetConfig'] && !changes['widgetConfig'].firstChange) ||
            (changes['datosVivos'] && this.datosVivos)
        ) {
            this.cargarSaturacionBodegas();
        }
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    /**
     * Consulta autónoma a BodegasService (dbo.TCL_MaestroBodegas)
     */
    private cargarSaturacionBodegas(): void {
        // 1. Si viene precargado desde el modal de Modo Enfoque
        if (
            this.datosVivos &&
            (Array.isArray(this.datosVivos) || Array.isArray(this.datosVivos.bodegas))
        ) {
            this.procesarPayloadBodegas(this.datosVivos);
            return;
        }

        const puerto = (this.widgetConfig?.puerto || 'BUENAVENTURA').trim().toUpperCase();
        const codigoWidget = (
            this.widgetConfig?.type ||
            this.widgetConfig?.codigoWidget ||
            'PTT_BOD_PANEL_SATURACION'
        )
            .trim()
            .toUpperCase();

        this.cargando = true;

        this._bodegasService
            .obtenerDatosWidgetBodegas(puerto, codigoWidget)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (respuestaSQL: any) => {
                    this.procesarPayloadBodegas(respuestaSQL);
                },
                error: (err) => {
                    console.error('❌ [SmartWidget BodegasSaturacion] Error consultando bodegas:', err);
                    this.listaBodegas = [];
                    this.cargando = false;
                    this.cdr.detectChanges();
                }
            });
    }

    /**
     * Homologa las filas de dbo.TCL_MaestroBodegas o de T_Maestro_NodosLogisticos
     */
    private procesarPayloadBodegas(raw: any): void {
        if (!raw) {
            this.listaBodegas = [];
            this.cargando = false;
            this.cdr.detectChanges();
            return;
        }

        this.metadatosSQL = Array.isArray(raw) ? {} : raw;

        const filasCrudas: any[] = Array.isArray(raw)
            ? raw
            : raw.bodegas || raw.saturacionBodegas || raw.nodos || [];

        this.listaBodegas = filasCrudas.map((b: any, index: number) => {
            const capacidad = Number(b.capacidad_maxima_ton ?? b.capacidad ?? 10000);
            const inventario = Number(b.inventario_actual_ton ?? b.inventario ?? 0);

            const pctCalculado =
                b.ocupacion_pct !== undefined
                    ? Number(b.ocupacion_pct)
                    : b.porcentaje !== undefined
                        ? Number(b.porcentaje)
                        : capacidad > 0
                            ? Number(((inventario / capacidad) * 100).toFixed(1))
                            : 0;

            const ocupacion = Math.min(100, Math.max(0, pctCalculado));
            const semaforo = this.evaluarSemaforoOcupacion(ocupacion, b.estado_operativo);

            return {
                id_bodega: b.id_bodega ?? b.id ?? index,
                codigo_bodega: b.codigo_bodega || `BOD-0${index + 1}`,
                nombre_bodega: b.nombre_bodega || b.nombre_nodo || b.nombre || `Bodega ${index + 1}`,
                tipo_almacenamiento: (b.tipo_almacenamiento || b.tipo || 'CUBIERTA').toUpperCase(),
                tipo_carga_principal: b.tipo_carga_principal || b.producto || 'Carga General',
                capacidad_maxima_ton: capacidad,
                inventario_actual_ton: inventario,
                ocupacion_pct: ocupacion,
                temperatura_c: b.temperatura_c !== undefined ? Number(b.temperatura_c) : null,
                humedad_relativa_pct:
                    b.humedad_relativa_pct !== undefined ? Number(b.humedad_relativa_pct) : null,
                estado_operativo: semaforo.etiqueta,
                colorBarra: semaforo.colorHex,
                claseBadge: semaforo.claseBadge
            };
        });

        this.cargando = false;
        this.cdr.detectChanges();
    }

    private evaluarSemaforoOcupacion(
        porcentaje: number,
        estadoExplicito?: string
    ): { etiqueta: string; colorHex: string; claseBadge: string } {
        const est = (estadoExplicito || '').toUpperCase();

        if (porcentaje >= 90 || est.includes('CRÍTIC') || est.includes('CRITIC')) {
            return {
                etiqueta: 'CRÍTICO',
                colorHex: '#ef4444',
                claseBadge: 'bg-danger text-white border-danger'
            };
        }
        if (porcentaje >= 75 || est.includes('ALTO') || est.includes('ALERTA')) {
            return {
                etiqueta: 'ALTO',
                colorHex: '#f59e0b',
                claseBadge: 'bg-warning text-dark border-warning'
            };
        }
        return {
            etiqueta: 'NORMAL',
            colorHex: '#10b981',
            claseBadge: 'bg-success text-white border-success'
        };
    }

    get data(): any {
        return {
            ...(this.widgetConfig?.data || {}),
            ...this.metadatosSQL,
            bodegas: this.listaBodegas
        };
    }

    get totalBodegasCriticas(): number {
        return this.listaBodegas.filter((b) => b.ocupacion_pct >= 90).length;
    }

    public trackByBodega(index: number, item: IBodegaItem): string | number {
        return item.id_bodega ?? item.codigo_bodega ?? index;
    }

    public maximizarDesdeShell(): void {
        if (this.isEnfoque) {
            this._torreService.cerrarModoEnfoque();
        } else {
            this._torreService.abrirModoEnfoque(
                this.widgetConfig?.type || 'PTT_BOD_PANEL_SATURACION',
                this.data
            );
        }
    }
}
