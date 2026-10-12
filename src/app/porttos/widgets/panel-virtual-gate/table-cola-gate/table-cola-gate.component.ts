/* eslint-disable @typescript-eslint/no-explicit-any */
/*
    Author: German Valencia
    Pattern: PORTTOS Smart Widget - Cola de Camiones en Vivo (Consumo Autónomo SQL)
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
import { VirtualGateService } from 'src/app/theme/shared/service/tablero-control/virtual-gate.service';
import { WidgetShellComponent } from 'src/app/theme/shared/components/widget-shell/widget-shell.component';

export interface ICitaColaGate {
    id_cita: string;
    placa: string;
    transportador: string;
    tipo_carga: string;
    operacion: string;
    terminal: string;
    fecha_hora_cita: string;
    ubicacion: string;
    estado: string;
    tiempo_espera_minutos?: number;
}

@Component({
    selector: 'app-table-cola-gate',
    standalone: true,
    imports: [CommonModule, WidgetShellComponent],
    templateUrl: './table-cola-gate.component.html',
    styleUrls: ['./table-cola-gate.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class TableColaGateComponent implements OnInit, OnChanges, OnDestroy {
    @Input() widgetConfig: any;
    @Input() isEnfoque: boolean = false;
    @Input() mostrarTabla: boolean = false;

    // Respaldo cuando se abre en el modal de Modo Enfoque
    @Input() datosVivos: any;

    public cargandoTabla: boolean = true;
    public listaCitas: ICitaColaGate[] = [];

    private datosAutonomosSQL: any = null;
    private readonly destroy$ = new Subject<void>();

    constructor(
        private _virtualGateService: VirtualGateService,
        private _torreService: DashboardService,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit(): void {
        this.cargarColaCamiones();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (
            (changes['widgetConfig'] && !changes['widgetConfig'].firstChange) ||
            (changes['datosVivos'] && this.datosVivos)
        ) {
            this.cargarColaCamiones();
        }
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    /**
     * Consulta autónoma a VirtualGateService (TCL_CitasGate) filtrada por puerto
     */
    private cargarColaCamiones(): void {
        // 1. Si viene precargado desde el modal de Modo Enfoque
        if (
            this.datosVivos &&
            (Array.isArray(this.datosVivos.citas) || Array.isArray(this.datosVivos))
        ) {
            this.procesarPayloadCola(this.datosVivos);
            return;
        }

        const puerto = (this.widgetConfig?.puerto || 'BUENAVENTURA').trim().toUpperCase();
        const codigoWidget = (this.widgetConfig?.type || this.widgetConfig?.codigoWidget || 'PTT_GATE_TAB_COLA')
            .trim()
            .toUpperCase();

        this.cargandoTabla = true;

        this._virtualGateService
            .obtenerDatosWidgetGate(puerto, codigoWidget)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (respuestaSQL: any) => {
                    this.procesarPayloadCola(respuestaSQL);
                },
                error: (err) => {
                    console.error('❌ [SmartWidget TableColaGate] Error consultando cola de camiones:', err);
                    this.listaCitas = [];
                    this.cargandoTabla = false;
                    this.cdr.detectChanges();
                }
            });
    }

    /**
     * Homologa filas provenientes de:
     * - dbo.TCL_CitasGate (id_cita, placa, transportador, tipo_carga, operacion, terminal, fecha_hora_cita, ubicacion, estado, tiempo_espera_minutos)
     * - dbo.TCL_MovimientoTerrestre (codigoMovimiento, placaCamion, empresaTransporte, estadoMovimiento, fechaCitaGate)
     * - dbo.TCL_RegistroCamiones (codigoRegistro, placaVehiculo, tipoCarga, codigoTerminal, estadoRegistro)
     */
    private procesarPayloadCola(raw: any): void {
        if (!raw) {
            this.listaCitas = [];
            this.datosAutonomosSQL = { citas: [] };
            this.cargandoTabla = false;
            this.cdr.detectChanges();
            return;
        }

        const filasCrudas: any[] = Array.isArray(raw)
            ? raw
            : raw.citas || raw.rows || raw.data || [];

        this.listaCitas = filasCrudas.map((c: any, idx: number) => ({
            id_cita: String(c.id_cita || c.codigoMovimiento || c.codigoRegistro || `cita-${idx}`),
            placa: c.placa || c.placaCamion || c.placaVehiculo || '—',
            transportador: c.transportador || c.empresaTransporte || 'Transportador',
            tipo_carga: c.tipo_carga || c.tipoCarga || 'Contenedor',
            operacion: c.operacion || c.subtipo_operacion || 'Ingreso / Retiro',
            terminal: c.terminal || c.codigoTerminal || c.id_terminal || 'SPRBUN',
            fecha_hora_cita: c.fecha_hora_cita || c.fechaCitaGate || c.fechaIngresoEtapa || '--:--',
            ubicacion: c.ubicacion || 'Pre-gate',
            estado: c.estado || c.estadoMovimiento || c.estadoRegistro || 'En cola',
            tiempo_espera_minutos:
                c.tiempo_espera_minutos !== undefined ? Number(c.tiempo_espera_minutos) : undefined
        }));

        this.datosAutonomosSQL = {
            ...(Array.isArray(raw) ? {} : raw),
            titulo: raw.titulo || '🚛 Cola de Camiones · Todos los Tipos de Carga',
            subtitulo: raw.subtitulo || 'Monitoreo de enturnamiento, ubicación y ventana horaria',
            icono: raw.icono || 'feather icon-truck',
            citas: this.listaCitas
        };

        this.cargandoTabla = false;
        this.cdr.detectChanges();
    }

    get data(): any {
        return {
            ...(this.widgetConfig?.data || {}),
            ...(this.datosVivos || {}),
            ...(this.datosAutonomosSQL || {}),
            citas: this.listaCitas
        };
    }

    get citas(): ICitaColaGate[] {
        return this.listaCitas;
    }

    get isLoading(): boolean {
        return this.cargandoTabla && !this.datosAutonomosSQL && !this.datosVivos;
    }

    /**
     * Clasificador semántico compatible con todos los estados de TCL_CitasGate
     */
    getEstadoClase(estado: string): string {
        const est = (estado || '').toUpperCase().trim();

        if (est.includes('VALIDAD') || est.includes('CITA OK') || est.includes('AUTORIZAD')) {
            return 'estado-success';
        }
        if (est.includes('OPERACI') || est.includes('TURNO') || est.includes('PLANTA') || est.includes('PUERTO')) {
            return 'estado-primary';
        }
        if (est.includes('COLA') || est.includes('PRE-GATE') || est.includes('DOC') || est.includes('ESPERA') || est.includes('VENCID')) {
            return 'estado-warning';
        }
        if (est.includes('RETENID') || est.includes('SIN CITA') || est.includes('RECHAZ') || est.includes('CRÍTIC')) {
            return 'estado-danger';
        }
        if (est.includes('RUTA') || est.includes('TRÁNSITO') || est.includes('TRANSITO')) {
            return 'estado-purple';
        }
        return 'estado-secondary';
    }

    trackByCita(index: number, item: ICitaColaGate): string {
        return item.id_cita || `${item.placa}-${index}`;
    }

    maximizarDesdeShell(): void {
        if (this.isEnfoque) {
            this._torreService.cerrarModoEnfoque();
        } else {
            this._torreService.abrirModoEnfoque(
                this.widgetConfig?.type || 'PTT_GATE_TAB_COLA',
                this.data
            );
        }
    }
}
