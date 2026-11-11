import { TranslateModule } from '@ngx-translate/core';
/* eslint-disable @typescript-eslint/no-explicit-any */
/*
    Author: German Valencia
    Pattern: PORTTOS Smart Widget - Vessel Table 72h (Consumo Autónomo SQL)
*/
import {
    Component,
    Input,
    HostBinding,
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
import { VesselTableModel } from 'src/app/theme/shared/_helpers/models/tablero-control/vessel-table.model';
import { WidgetShellComponent } from 'src/app/theme/shared/components/widget-shell/widget-shell.component';

import { OrigenMaritimoDirective } from '../../shared/origen-maritimo.directive';
import { ColumnaTabla, TablaTclComponent } from '../../shared/tabla-tcl/tabla-tcl.component';

/** Vista ampliada (Fase 3): todo el line-up que trae el API, con búsqueda, orden y CSV. */
const COLUMNAS_AMPLIADAS: ColumnaTabla[] = [
    { campo: 'motonave', titulo: 'PORTTOS.WIDGETS.VESSEL', tipo: 'principal' },
    { campo: 'naviera', titulo: 'PORTTOS.WIDGETS.PANEL_MARITIMO.VESSEL_TABLE.LINE_AGENCY' },
    { campo: 'viaje', titulo: 'PORTTOS.WIDGETS.PANEL_MARITIMO.VESSEL_TABLE.VOYAGE' },
    { campo: 'terminal', titulo: 'PORTTOS.TERMINAL' },
    { campo: 'muelle', titulo: 'COMMON.BERTH' },
    { campo: 'eslora', titulo: 'PORTTOS.WIDGETS.LENGTH', tipo: 'numero', decimales: 0, unidad: 'm' },
    { campo: 'eta', titulo: 'ETA' },
    { campo: 'fechaAtraque', titulo: 'PORTTOS.WIDGETS.PANEL_MARITIMO.VESSEL_TABLE.ATA_BERTHING_2' },
    { campo: 'zarpe', titulo: 'PORTTOS.WIDGETS.PANEL_MARITIMO.VESSEL_TABLE.DEPARTURE' },
    { campo: 'carga', titulo: 'PORTTOS.WIDGETS.CARGO' },
    { campo: 'estadoTexto', titulo: 'COMMON.STATUS', tipo: 'estado' },
    { campo: 'atrasada', titulo: 'PORTTOS.WIDGETS.PANEL_MARITIMO.VESSEL_TABLE.ETA_PASSED', tipo: 'si-no', alinear: 'centro' },
    { campo: 'novedades', titulo: 'PORTTOS.WIDGETS.PANEL_MARITIMO.VESSEL_TABLE.UPDATES' }
];

@Component({
    selector: 'app-vessel-table',
    standalone: true,
    imports: [TranslateModule, OrigenMaritimoDirective, CommonModule, WidgetShellComponent, TablaTclComponent],
    templateUrl: './vessel-table.component.html',
    styleUrls: ['./vessel-table.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class VesselTableComponent implements OnInit, OnChanges, OnDestroy {
    @Input() widgetConfig: any;
    @Input() isEnfoque: boolean = false;
    @Input() mostrarTabla: boolean = false;

    // Respaldo cuando se abre desde el modal de Modo Enfoque
    @Input() datosVivos: any;

    public cargandoTabla: boolean = true;
    public readonly columnasAmpliadas = COLUMNAS_AMPLIADAS;
    private datosAutonomosSQL: Partial<VesselTableModel> | null = null;
    private readonly destroy$ = new Subject<void>();

    @HostBinding('class') get hostClass(): string {
        return `col-span-${this.widgetConfig?.colspan || 2}`;
    }

    constructor(
        private _maritimoService: MaritimoService,
        private _torreService: DashboardService,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit(): void {
        this.cargarProgramacionMotonaves();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (
            (changes['widgetConfig'] && !changes['widgetConfig'].firstChange) ||
            (changes['datosVivos'] && this.datosVivos)
        ) {
            this.cargarProgramacionMotonaves();
        }
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    /**
     * Consulta autónoma al servicio Marítimo filtrada por puerto activo
     */
    private cargarProgramacionMotonaves(): void {
        // 1. Si viene inyectado desde el modal de Enfoque, usamos esa data directamente
        if (this.datosVivos && Array.isArray(this.datosVivos.motonaves)) {
            this.datosAutonomosSQL = this.normalizarPayloadMotonaves(this.datosVivos);
            this.cargandoTabla = false;
            this.cdr.detectChanges();
            return;
        }

        const puerto = (this.widgetConfig?.puerto || 'BUENAVENTURA').trim().toUpperCase();
        const codigoWidget = (this.widgetConfig?.type || this.widgetConfig?.codigoWidget || 'PTT_MAE_TAB_MOTONAVES')
            .trim()
            .toUpperCase();

        this.cargandoTabla = true;

        this._maritimoService
            .obtenerDatosWidgetMaritimo(puerto, codigoWidget)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (respuestaSQL: any) => {
                    this.datosAutonomosSQL = this.normalizarPayloadMotonaves(respuestaSQL);
                    this.cargandoTabla = false;
                    this.cdr.detectChanges();
                },
                error: (err) => {
                    console.error('❌ [SmartWidget VesselTable] Error consultando programación 72h:', err);
                    this.datosAutonomosSQL = { motonaves: [] };
                    this.cargandoTabla = false;
                    this.cdr.detectChanges();
                }
            });
    }

    /**
     * Homologa registros provenientes de:
     * - TCL_LineUpMaritimo (lineaAgencia, fechaAtraque, trabajoOperacion, posicion)
     * - vw_TCL_CicloVidaMotonaves / DIMAR (agencia, instalacion_portuaria, ata, dwt, estado_operativo)
     * - TCL_OperacionMaritima (fechaETA, fechaATA, estadoBuque, carga_declarada)
     */
    private normalizarPayloadMotonaves(raw: any): Partial<VesselTableModel> {
        if (!raw) return { motonaves: [] };

        const listaCruda: any[] = Array.isArray(raw)
            ? raw
            : raw.motonaves || raw.rows || raw.data || [];

        const motonavesNormalizadas = listaCruda.map((n: any) => {
            const estadoTexto =
                n.estadoTexto ||
                n.estado_operativo ||
                n.estadoBuque ||
                n.posicion ||
                'Programado';

            return {
                ...n,
                motonave: n.motonave || n.nombreMotonave || '—',
                naviera: n.naviera || n.lineaAgencia || n.agencia || '—',
                terminal: n.terminal || n.instalacion_portuaria || n.codigoTerminal || '—',
                tipo: n.tipo || n.tipo_nave || n.tipo_buque || n.tipoCarga || '',
                eta: n.eta || n.fechaETA || '--',
                fechaAtraque:
                    n.fechaAtraque ||
                    n.ata ||
                    n.fechaATA ||
                    (n.muelle ? `${n.muelle}` : '--'),
                carga:
                    n.carga ||
                    n.trabajoOperacion ||
                    n.carga_declarada ||
                    (n.dwt ? `${Number(n.dwt).toLocaleString('es-CO')} DWT` : '—'),
                estadoTexto,
                estadoClase: n.estadoClase || this.resolverClaseBadge(estadoTexto, n.severidad_badge)
            };
        });

        return {
            ...(Array.isArray(raw) ? {} : raw),
            titulo: raw.titulo || 'REPORTE DE MOTONAVES · 72H',
            subtitulo: raw.subtitulo || 'PORTTOS.WIDGETS.PANEL_MARITIMO.VESSEL_TABLE.ARRIVAL_ANCHORAGE_BERTHING_SCHEDULE',
            icono: raw.icono || 'feather icon-anchor',
            motonaves: motonavesNormalizadas
        };
    }

    private resolverClaseBadge(estadoTexto: string, severidad?: string): string {
        const txt = (estadoTexto || '').toUpperCase();
        const sev = (severidad || '').toLowerCase();

        if (sev === 'success' || txt.includes('DESCARG') || txt.includes('MUELLE') || txt.includes('OPERANDO')) {
            return 'bg-success bg-opacity-25 text-success border-success';
        }
        if (sev === 'warning' || txt.includes('FONDEO') || txt.includes('ATRACANDO') || txt.includes('DEMORA')) {
            return 'bg-warning bg-opacity-25 text-warning border-warning';
        }
        if (sev === 'danger' || txt.includes('SUSPEND') || txt.includes('CRÍTIC') || txt.includes('ALERTA')) {
            return 'bg-danger bg-opacity-25 text-danger border-danger';
        }
        return 'bg-info bg-opacity-25 text-info border-info';
    }

    get data(): Partial<VesselTableModel> {
        const configBase = this.widgetConfig?.data || {};
        return {
            ...configBase,
            ...(this.datosVivos || {}),
            ...(this.datosAutonomosSQL || {})
        };
    }

    get isLoading(): boolean {
        return this.cargandoTabla && !this.datosAutonomosSQL && !this.datosVivos;
    }

    /** Filas de la vista ampliada: id estable para la tabla y sin '--' de relleno. */
    get filasAmpliadas(): any[] {
        return (this.data.motonaves || []).map((n: any, i: number) => ({
            ...n,
            id: this.trackByNave(i, n),
            fechaAtraque: n.fechaAtraque === '--' ? null : n.fechaAtraque,
            eta: n.eta === '--' ? null : n.eta,
            atrasada: n.atrasada === true
        }));
    }

    get totalAtrasadas(): number {
        return (this.data.motonaves || []).filter((n: any) => n.atrasada === true).length;
    }

    trackByNave(index: number, nave: any): string {
        return nave.id_aviso || nave.codigoOperacion || `${nave.motonave}-${nave.eta}-${index}`;
    }

    maximizarDesdeShell(): void {
        if (this.isEnfoque) {
            this._torreService.cerrarModoEnfoque();
        } else {
            this._torreService.abrirModoEnfoque(
                this.widgetConfig?.type || 'PTT_MAE_TAB_MOTONAVES',
                this.data
            );
        }
    }
}
