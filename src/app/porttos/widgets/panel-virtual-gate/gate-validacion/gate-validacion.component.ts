/* eslint-disable @typescript-eslint/no-explicit-any */
/*
    Author: German Valencia
    Pattern: PORTTOS Smart Widget - Pre-Gate Validación (Consumo Autónomo SQL)
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

export interface IResumenValidacionGate {
    totalFlujo: number;
    validados: number;
    enCola: number;
    retenidos: number;
}

@Component({
    selector: 'app-gate-validacion',
    standalone: true,
    imports: [CommonModule, WidgetShellComponent],
    templateUrl: './gate-validacion.component.html',
    styleUrls: ['./gate-validacion.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class GateValidacionComponent implements OnInit, OnChanges, OnDestroy {
    @Input() widgetConfig: any;
    @Input() isEnfoque: boolean = false;
    @Input() mostrarTabla: boolean = false;

    // Respaldo cuando se abre en el modal de Modo Enfoque
    @Input() datosVivos: any;

    public cargandoValidacion: boolean = true;
    private datosAutonomosSQL: any = null;
    private readonly destroy$ = new Subject<void>();

    constructor(
        private _virtualGateService: VirtualGateService,
        private _torreService: DashboardService,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit(): void {
        this.cargarValidacionPregate();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (
            (changes['widgetConfig'] && !changes['widgetConfig'].firstChange) ||
            (changes['datosVivos'] && this.datosVivos)
        ) {
            this.cargarValidacionPregate();
        }
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    /**
     * Consulta autónoma a VirtualGateService (TCL_CitasGate + TCL_RegistroCamiones)
     */
    private cargarValidacionPregate(): void {
        // 1. Si viene precargado desde el modal de Modo Enfoque
        if (
            this.datosVivos &&
            (this.datosVivos.resumen ||
                this.datosVivos.validados !== undefined ||
                Array.isArray(this.datosVivos.citas))
        ) {
            this.datosAutonomosSQL = this.normalizarValidacion(this.datosVivos);
            this.cargandoValidacion = false;
            this.cdr.detectChanges();
            return;
        }

        const puerto = (this.widgetConfig?.puerto || 'BUENAVENTURA').trim().toUpperCase();
        const codigoWidget = (this.widgetConfig?.type || this.widgetConfig?.codigoWidget || 'PTT_GATE_PANEL_VAL')
            .trim()
            .toUpperCase();

        this.cargandoValidacion = true;

        this._virtualGateService
            .obtenerDatosWidgetGate(puerto, codigoWidget)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (respuestaSQL: any) => {
                    this.datosAutonomosSQL = this.normalizarValidacion(respuestaSQL);
                    this.cargandoValidacion = false;
                    this.cdr.detectChanges();
                },
                error: (err) => {
                    console.error('❌ [SmartWidget GateValidacion] Error consultando Pre-Gate:', err);
                    this.datosAutonomosSQL = {
                        resumen: { totalFlujo: 0, validados: 0, enCola: 0, retenidos: 0 }
                    };
                    this.cargandoValidacion = false;
                    this.cdr.detectChanges();
                }
            });
    }

    /**
     * Soporta:
     * 1. Objeto directo { validados, enCola, retenidos }
     * 2. Objeto anidado { resumen: { validados, enCola, retenidos } }
     * 3. Arreglo de filas SQL desde dbo.TCL_CitasGate (estado) o dbo.TCL_RegistroCamiones (estadoRegistro)
     */
    private normalizarValidacion(raw: any): any {
        if (!raw) {
            return { resumen: { totalFlujo: 0, validados: 0, enCola: 0, retenidos: 0 } };
        }

        const fuenteResumen = raw.resumen || raw;
        const citas: any[] = Array.isArray(raw) ? raw : raw.citas || raw.rows || [];

        let validados = Number(fuenteResumen.validados ?? fuenteResumen.citasOk ?? NaN);
        let enCola = Number(fuenteResumen.enCola ?? fuenteResumen.colaVirtual ?? NaN);
        let retenidos = Number(fuenteResumen.retenidos ?? fuenteResumen.sinCita ?? NaN);

        // Si alguno no viene pre-calculado, lo calculamos desde las filas de TCL_CitasGate / TCL_RegistroCamiones
        if (isNaN(validados) || isNaN(enCola) || isNaN(retenidos)) {
            validados = citas.filter((c) =>
                /cita ok|en turno|autorizado|validad|activo/i.test(c.estado || c.estadoRegistro || '')
            ).length;
            enCola = citas.filter((c) =>
                /cola|pre-?gate|espera|tr[aá]nsito/i.test(c.estado || c.estadoRegistro || '')
            ).length;
            retenidos = citas.filter((c) =>
                /sin cita|retenid|vencid|rechaz|bloque/i.test(c.estado || c.estadoRegistro || '')
            ).length;
        }

        const totalFlujo = Number(
            fuenteResumen.totalPregate ??
            fuenteResumen.totalFlujo ??
            (validados + enCola + retenidos)
        );

        const resumenNormalizado: IResumenValidacionGate = {
            totalFlujo,
            validados: validados || 0,
            enCola: enCola || 0,
            retenidos: retenidos || 0
        };

        return {
            ...(Array.isArray(raw) ? {} : raw),
            titulo: raw.titulo || '🛡 Pre-Gate · Validación',
            subtitulo: raw.subtitulo || 'Control de enturnamiento y validación documental',
            icono: raw.icono || 'feather icon-check-square',
            resumen: resumenNormalizado
        };
    }

    get data(): any {
        return {
            ...(this.widgetConfig?.data || {}),
            ...(this.datosVivos || {}),
            ...(this.datosAutonomosSQL || {})
        };
    }

    get resumen(): IResumenValidacionGate {
        return (
            this.data?.resumen || {
                totalFlujo: 0,
                validados: 0,
                enCola: 0,
                retenidos: 0
            }
        );
    }

    get isLoading(): boolean {
        return this.cargandoValidacion && !this.datosAutonomosSQL && !this.datosVivos;
    }

    maximizarDesdeShell(): void {
        if (this.isEnfoque) {
            this._torreService.cerrarModoEnfoque();
        } else {
            this._torreService.abrirModoEnfoque(
                this.widgetConfig?.type || 'PTT_GATE_PANEL_VAL',
                this.data
            );
        }
    }
}
