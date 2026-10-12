/* eslint-disable @typescript-eslint/no-explicit-any */
/*
    Author: German Valencia
    Pattern: PORTTOS Smart Widget - Estado de Citas y Espera Virtual (Consumo Autónomo SQL)
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

export interface IBarraEstadoCita {
    label: string;
    value: number;
    percent: number;
    colorClass: string;
}

@Component({
    selector: 'app-gate-estado-citas',
    standalone: true,
    imports: [CommonModule, WidgetShellComponent],
    templateUrl: './gate-estado-citas.component.html',
    styleUrls: ['./gate-estado-citas.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class GateEstadoCitasComponent implements OnInit, OnChanges, OnDestroy {
    @Input() widgetConfig: any;
    @Input() isEnfoque: boolean = false;
    @Input() mostrarTabla: boolean = false;

    // Respaldo cuando se abre en el modal de Modo Enfoque
    @Input() datosVivos: any;

    public cargandoEstado: boolean = true;
    public listaBarras: IBarraEstadoCita[] = [];

    private datosAutonomosSQL: any = null;
    private readonly destroy$ = new Subject<void>();

    constructor(
        private _virtualGateService: VirtualGateService,
        private _torreService: DashboardService,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit(): void {
        this.cargarEstadoCitas();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (
            (changes['widgetConfig'] && !changes['widgetConfig'].firstChange) ||
            (changes['datosVivos'] && this.datosVivos)
        ) {
            this.cargarEstadoCitas();
        }
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    /**
     * Consulta autónoma a VirtualGateService (TCL_CitasGate) filtrada por puerto
     */
    private cargarEstadoCitas(): void {
        // 1. Si viene precargado desde el modal de Modo Enfoque
        if (
            this.datosVivos &&
            (Array.isArray(this.datosVivos.barrasProgreso) ||
                this.datosVivos.activas !== undefined ||
                Array.isArray(this.datosVivos.citas))
        ) {
            this.procesarPayloadEstado(this.datosVivos);
            return;
        }

        const puerto = (this.widgetConfig?.puerto || 'BUENAVENTURA').trim().toUpperCase();
        const codigoWidget = (this.widgetConfig?.type || this.widgetConfig?.codigoWidget || 'PTT_GATE_PANEL_ESTADO')
            .trim()
            .toUpperCase();

        this.cargandoEstado = true;

        this._virtualGateService
            .obtenerDatosWidgetGate(puerto, codigoWidget)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (respuestaSQL: any) => {
                    this.procesarPayloadEstado(respuestaSQL);
                },
                error: (err) => {
                    console.error('❌ [SmartWidget GateEstadoCitas] Error consultando estado de citas:', err);
                    this.listaBarras = [];
                    this.cargandoEstado = false;
                    this.cdr.detectChanges();
                }
            });
    }

    /**
     * Homologa:
     * 1. Arreglo pre-armado de barras [{ label, value, percent, colorClass }]
     * 2. Conteos agregados { activas, enCola, vencidas, sinCita }
     * 3. Filas crudas de dbo.TCL_CitasGate (estado, terminal, tiempo_espera_minutos)
     */
    private procesarPayloadEstado(raw: any): void {
        if (!raw) {
            this.listaBarras = [];
            this.datosAutonomosSQL = { resumen: {} };
            this.cargandoEstado = false;
            this.cdr.detectChanges();
            return;
        }

        const citas: any[] = Array.isArray(raw.citas)
            ? raw.citas
            : Array.isArray(raw) && raw[0]?.placa
                ? raw
                : [];

        // A. Construcción de las Barras de Progreso con referencia estable
        if (Array.isArray(raw.barrasProgreso) && raw.barrasProgreso.length > 0) {
            this.listaBarras = raw.barrasProgreso;
        } else if (Array.isArray(raw.citas) && raw.citas[0]?.label && raw.citas[0]?.percent !== undefined) {
            this.listaBarras = raw.citas;
        } else {
            const confirmadas =
                raw.confirmadas ??
                raw.activas ??
                citas.filter((c) => /cita ok|en turno|confirmad|autorizad/i.test(c.estado || '')).length;

            const enEspera =
                raw.enEspera ??
                raw.enCola ??
                citas.filter((c) => /cola|espera|pre-?gate|tr[aá]nsito/i.test(c.estado || '')).length;

            const reagendadas =
                raw.reagendadas ??
                raw.vencidas ??
                citas.filter((c) => /vencid|reagend|demor/i.test(c.estado || '')).length;

            const canceladas =
                raw.canceladas ??
                raw.sinCita ??
                citas.filter((c) => /sin cita|cancel|retenid|rechaz/i.test(c.estado || '')).length;

            const total = Math.max(confirmadas + enEspera + reagendadas + canceladas, 1);

            this.listaBarras = [
                {
                    label: 'En ventana (OK)',
                    value: confirmadas,
                    percent: Math.round((confirmadas / total) * 100),
                    colorClass: 'bg-success'
                },
                {
                    label: 'En cola virtual',
                    value: enEspera,
                    percent: Math.round((enEspera / total) * 100),
                    colorClass: 'bg-info'
                },
                {
                    label: 'Vencidas / Reagend.',
                    value: reagendadas,
                    percent: Math.round((reagendadas / total) * 100),
                    colorClass: 'bg-warning'
                },
                {
                    label: 'Sin cita / Retenidos',
                    value: canceladas,
                    percent: Math.round((canceladas / total) * 100),
                    colorClass: 'bg-danger'
                }
            ];
        }

        // B. Cálculo del Tiempo Medio de Espera por Terminal (desde tiempo_espera_minutos de TCL_CitasGate)
        const calcularPromedioTerminal = (patron: RegExp, fallback: number): number => {
            if (Array.isArray(raw.tiemposTerminal)) {
                const encontrado = raw.tiemposTerminal.find((t: any) => patron.test(t.terminal || ''));
                if (encontrado && encontrado.minutos !== undefined) return Number(encontrado.minutos);
            }
            const filtradas = citas.filter((c) => patron.test(c.terminal || ''));
            if (filtradas.length === 0) return fallback;
            const suma = filtradas.reduce((acc, curr) => acc + Number(curr.tiempo_espera_minutos || 0), 0);
            return Math.round(suma / filtradas.length);
        };

        const resumenBase = raw.resumen || {};
        const resumenNormalizado = {
            ...resumenBase,
            tiempoMedioSPRBUN:
                resumenBase.tiempoMedioSPRBUN ?? calcularPromedioTerminal(/sprbun/i, 12),
            tiempoMedioTCBUEN:
                resumenBase.tiempoMedioTCBUEN ?? calcularPromedioTerminal(/tcbuen/i, 28),
            tiempoMedioAGUADULCE:
                resumenBase.tiempoMedioAGUADULCE ?? calcularPromedioTerminal(/aguadulce|spia/i, 9)
        };

        this.datosAutonomosSQL = {
            ...(Array.isArray(raw) ? {} : raw),
            titulo: raw.titulo || 'ESTADO DE CITAS',
            subtitulo: raw.subtitulo || 'Gestión de turnos y accesos por ventana',
            icono: raw.icono || 'feather icon-calendar',
            barrasProgreso: this.listaBarras,
            resumen: resumenNormalizado
        };

        this.cargandoEstado = false;
        this.cdr.detectChanges();
    }

    get data(): any {
        return {
            ...(this.widgetConfig?.data || {}),
            ...(this.datosVivos || {}),
            ...(this.datosAutonomosSQL || {})
        };
    }

    get barrasProgreso(): IBarraEstadoCita[] {
        return this.listaBarras;
    }

    get isLoading(): boolean {
        return this.cargandoEstado && !this.datosAutonomosSQL && !this.datosVivos;
    }

    trackByBarra(index: number, item: IBarraEstadoCita): string {
        return item.label || index.toString();
    }

    maximizarDesdeShell(): void {
        if (this.isEnfoque) {
            this._torreService.cerrarModoEnfoque();
        } else {
            this._torreService.abrirModoEnfoque(
                this.widgetConfig?.type || 'PTT_GATE_PANEL_ESTADO',
                this.data
            );
        }
    }
}
