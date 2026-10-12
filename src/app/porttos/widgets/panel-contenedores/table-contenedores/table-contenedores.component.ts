/* eslint-disable @typescript-eslint/no-explicit-any */
/*
    Author: German Valencia
    Pattern: PORTTOS Smart Widget - Tabla Movimientos de Contenedores (Consumo Autónomo SQL)
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

export interface IMovimientoContenedor {
    id_movimiento: string | number;
    contenedor: string;
    tipo: string;
    naviera: string;
    operacion: string;
    ruta: string;
    cliente: string;
    freeTime: string;
    free_time?: string;
    estado: string;
}

@Component({
    selector: 'app-table-contenedores',
    standalone: true,
    imports: [CommonModule, WidgetShellComponent],
    templateUrl: './table-contenedores.component.html',
    styleUrls: ['./table-contenedores.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class TableContenedoresComponent implements OnInit, OnChanges, OnDestroy {
    @Input() widgetConfig: any;
    @Input() isEnfoque: boolean = false;
    @Input() mostrarTabla: boolean = false;

    // Respaldo cuando se abre en el modal de Modo Enfoque
    @Input() datosVivos: any;

    public cargandoMovimientos: boolean = true;
    public listaMovimientos: IMovimientoContenedor[] = [];

    private metadatosSQL: any = {};
    private readonly destroy$ = new Subject<void>();

    constructor(
        private _contenedoresService: ContenedoresService,
        private _torreService: DashboardService,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit(): void {
        this.cargarMovimientosContenedores();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (
            (changes['widgetConfig'] && !changes['widgetConfig'].firstChange) ||
            (changes['datosVivos'] && this.datosVivos)
        ) {
            this.cargarMovimientosContenedores();
        }
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    /**
     * Consulta autónoma a ContenedoresService (TCL_MovimientosContenedor / TCL_UnidadCarga)
     */
    private cargarMovimientosContenedores(): void {
        // 1. Si viene precargado desde el modal de Modo Enfoque
        if (
            this.datosVivos &&
            (Array.isArray(this.datosVivos) || Array.isArray(this.datosVivos.movimientos))
        ) {
            this.procesarPayloadMovimientos(this.datosVivos);
            return;
        }

        const puerto = (this.widgetConfig?.puerto || 'BUENAVENTURA').trim().toUpperCase();
        const codigoWidget = (
            this.widgetConfig?.type ||
            this.widgetConfig?.codigoWidget ||
            'PTT_CONT_TAB_MOVIMIENTOS'
        )
            .trim()
            .toUpperCase();

        this.cargandoMovimientos = true;

        this._contenedoresService
            .obtenerDatosWidgetContenedores(puerto, codigoWidget)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (respuestaSQL: any) => {
                    this.procesarPayloadMovimientos(respuestaSQL);
                },
                error: (err) => {
                    console.error('❌ [SmartWidget TableContenedores] Error consultando movimientos:', err);
                    this.listaMovimientos = [];
                    this.cargandoMovimientos = false;
                    this.cdr.detectChanges();
                }
            });
    }

    /**
     * Homologa registros provenientes de:
     * - dbo.TCL_MovimientosContenedor (id_movimiento, contenedor, tipo, naviera, operacion, ruta, cliente, free_time, estado)
     * - dbo.TCL_UnidadCarga (codigoUnidad, tipoContenedor, naviera, condicionCarga, diasFreeTime)
     */
    private procesarPayloadMovimientos(raw: any): void {
        if (!raw) {
            this.listaMovimientos = [];
            this.cargandoMovimientos = false;
            this.cdr.detectChanges();
            return;
        }

        this.metadatosSQL = Array.isArray(raw) ? {} : raw;

        const filasCrudas: any[] = Array.isArray(raw)
            ? raw
            : raw.movimientos || raw.rows || raw.data || [];

        this.listaMovimientos = filasCrudas.map((m: any, idx: number) => {
            const rutaCruda = m.ruta || m.origen_destino || '-';
            const rutaFormateada = String(rutaCruda).replace(/\?/g, '→');

            const freeTimeValor =
                m.freeTime ??
                m.free_time ??
                (m.diasFreeTime !== undefined ? `${m.diasFreeTime} días` : '—');

            return {
                id_movimiento: m.id_movimiento ?? m.id ?? idx,
                contenedor: m.contenedor || m.codigoUnidad || m.numero_contenedor || '—',
                tipo: m.tipo || m.tipoContenedor || '40\' HC',
                naviera: m.naviera || m.linea_naviera || '—',
                operacion: m.operacion || m.condicionCarga || 'Retiro cargado',
                ruta: rutaFormateada,
                cliente: m.cliente || m.importador || '—',
                freeTime: String(freeTimeValor),
                free_time: String(freeTimeValor),
                estado: m.estado || m.estado_operativo || 'Programado'
            };
        });

        this.cargandoMovimientos = false;
        this.cdr.detectChanges();
    }

    get movimientos(): IMovimientoContenedor[] {
        return this.listaMovimientos;
    }

    get configData(): any {
        const base = this.widgetConfig?.data || {};
        const safeBase = Array.isArray(base) ? {} : base;
        return {
            ...safeBase,
            ...this.metadatosSQL,
            movimientos: this.listaMovimientos
        };
    }

    get isLoading(): boolean {
        return this.cargandoMovimientos && this.listaMovimientos.length === 0;
    }

    /**
     * Clasificador semántico para modo oscuro compatible con TCL_MovimientosContenedor
     */
    getEstadoClase(estado: string): string {
        if (!estado) return 'bg-secondary bg-opacity-25 text-light border border-secondary';

        const est = estado.toLowerCase().trim();

        // Verde: Operaciones confirmadas o programadas
        if (est.includes('programado') || est.includes('ok') || est.includes('autorizado') || est.includes('entregado')) {
            return 'bg-success text-white border-success';
        }
        // Rojo: Demoras, bloqueos, vencimientos o saturación de patio
        if (est.includes('demora') || est.includes('lleno') || est.includes('vencid') || est.includes('retenid') || est.includes('crític')) {
            return 'bg-danger text-white border-danger';
        }
        // Ámbar: Esperas de cita o alertas preventivas
        if (est.includes('esperando') || est.includes('pendiente') || est.includes('alerta')) {
            return 'bg-warning text-dark border-warning';
        }
        // Cyan/Info: Unidades en tránsito o en ruta
        if (est.includes('ruta') || est.includes('tránsito') || est.includes('transito') || est.includes('turno')) {
            return 'bg-info text-dark border-info';
        }

        return 'bg-secondary bg-opacity-25 text-light border border-secondary';
    }

    esFreeTimeCritico(ft: string): boolean {
        const txt = (ft || '').toLowerCase();
        return txt.includes('vencid') || txt.includes('mora') || txt === '1 día' || txt === '0 días';
    }

    trackByMovimiento(index: number, item: IMovimientoContenedor): string | number {
        return item.id_movimiento ?? `${item.contenedor}-${index}`;
    }

    maximizarDesdeShell(): void {
        if (this.isEnfoque) {
            this._torreService.cerrarModoEnfoque();
        } else {
            this._torreService.abrirModoEnfoque(
                this.widgetConfig?.type || 'PTT_CONT_TAB_MOVIMIENTOS',
                this.configData
            );
        }
    }
}
