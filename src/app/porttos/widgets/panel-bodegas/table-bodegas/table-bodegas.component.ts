/* eslint-disable @typescript-eslint/no-explicit-any */
/*
    Author: German Valencia
    Pattern: PORTTOS Smart Widget - Tabla de Movimientos y Lotes en Bodegas (Consumo Autónomo SQL)
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
import { CommonModule, DecimalPipe } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { WidgetShellComponent } from 'src/app/theme/shared/components/widget-shell/widget-shell.component';
import { BodegasService } from 'src/app/theme/shared/service/tablero-control/bodegas.service';
import { DashboardService } from 'src/app/theme/shared/service/tablero-control/dashboard.service';

export interface IMovimientoBodega {
    id_movimiento_bodega: string | number;
    nombre_bodega: string;
    lote_bl: string;
    producto: string;
    tipo_operacion: string;
    toneladas: number;
    cliente: string;
    dias_almacenaje: number;
    estado: string;
}

@Component({
    selector: 'app-table-bodegas',
    standalone: true,
    imports: [CommonModule, DecimalPipe, WidgetShellComponent],
    templateUrl: './table-bodegas.component.html',
    styleUrls: ['./table-bodegas.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class TableBodegasComponent implements OnInit, OnChanges, OnDestroy {
    @Input() widgetConfig: any;
    @Input() isEnfoque: boolean = false;
    @Input() mostrarTabla: boolean = false;
    @Input() datosVivos: any;

    public cargando: boolean = true;
    public listaMovimientos: IMovimientoBodega[] = [];

    private metadatosSQL: any = {};
    private readonly destroy$ = new Subject<void>();

    constructor(
        private _bodegasService: BodegasService,
        private _torreService: DashboardService,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit(): void {
        this.cargarMovimientosBodega();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (
            (changes['widgetConfig'] && !changes['widgetConfig'].firstChange) ||
            (changes['datosVivos'] && this.datosVivos)
        ) {
            this.cargarMovimientosBodega();
        }
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    private cargarMovimientosBodega(): void {
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
            'PTT_BOD_TAB_MOVIMIENTOS'
        )
            .trim()
            .toUpperCase();

        this.cargando = true;

        this._bodegasService
            .obtenerDatosWidgetBodegas(puerto, codigoWidget)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (respuestaSQL: any) => {
                    this.procesarPayloadMovimientos(respuestaSQL);
                },
                error: (err) => {
                    console.error('❌ [SmartWidget TableBodegas] Error consultando movimientos:', err);
                    this.listaMovimientos = [];
                    this.cargando = false;
                    this.cdr.detectChanges();
                }
            });
    }

    private procesarPayloadMovimientos(raw: any): void {
        if (!raw) {
            this.listaMovimientos = [];
            this.cargando = false;
            this.cdr.detectChanges();
            return;
        }

        this.metadatosSQL = Array.isArray(raw) ? {} : raw;

        const filasCrudas: any[] = Array.isArray(raw)
            ? raw
            : raw.movimientos || raw.movimientosBodega || raw.rows || [];

        this.listaMovimientos = filasCrudas.map((m: any, idx: number) => ({
            id_movimiento_bodega: m.id_movimiento_bodega ?? m.id ?? idx,
            nombre_bodega: m.nombre_bodega || m.bodega || `Bodega ${(idx % 4) + 1}`,
            lote_bl: m.lote_bl || m.bl || m.codigo_lote || `BL-${1040 + idx}`,
            producto: m.producto || m.tipo_carga || 'Granel Sólido',
            tipo_operacion: m.tipo_operacion || m.operacion || 'INGRESO BUQUE',
            toneladas: Number(m.toneladas ?? m.peso_ton ?? 0),
            cliente: m.cliente || m.importador || '—',
            dias_almacenaje: Number(m.dias_almacenaje ?? m.dias ?? 1),
            estado: m.estado || 'Almacenado'
        }));

        this.cargando = false;
        this.cdr.detectChanges();
    }

    get movimientos(): IMovimientoBodega[] {
        return this.listaMovimientos;
    }

    get configData(): any {
        return {
            ...(this.widgetConfig?.data || {}),
            ...this.metadatosSQL,
            movimientos: this.listaMovimientos
        };
    }

    public getEstadoClase(estado: string): string {
        const est = (estado || '').toLowerCase().trim();

        if (est.includes('almacenado') || est.includes('despachado') || est.includes('ok')) {
            return 'bg-success text-white border-success';
        }
        if (est.includes('retenid') || est.includes('mora') || est.includes('crític') || est.includes('alerta')) {
            return 'bg-danger text-white border-danger';
        }
        if (est.includes('pendiente') || est.includes('inspecc')) {
            return 'bg-warning text-dark border-warning';
        }
        if (est.includes('descarg') || est.includes('despacho') || est.includes('tránsito')) {
            return 'bg-info text-dark border-info';
        }
        return 'bg-secondary bg-opacity-25 text-light border border-secondary';
    }

    public trackByMovimiento(index: number, item: IMovimientoBodega): string | number {
        return item.id_movimiento_bodega ?? `${item.lote_bl}-${index}`;
    }

    public maximizarDesdeShell(): void {
        if (this.isEnfoque) {
            this._torreService.cerrarModoEnfoque();
        } else {
            this._torreService.abrirModoEnfoque(
                this.widgetConfig?.type || 'PTT_BOD_TAB_MOVIMIENTOS',
                this.configData
            );
        }
    }
}
