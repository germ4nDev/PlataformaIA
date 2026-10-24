/* eslint-disable @typescript-eslint/no-explicit-any */
/*
    Author: German Valencia
    Component: PORTTOS Smart Widget - GNL Tacómetro (Consumo Autónomo SCADA / WebSocket)
*/
import { Component, Input, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { GnlStateService } from 'src/app/theme/shared/service/tablero-control/gnl-state.service';
import { WidgetShellComponent } from 'src/app/theme/shared/components/widget-shell/widget-shell.component';
import { DashboardService } from 'src/app/theme/shared/service/tablero-control/dashboard.service';

@Component({
    selector: 'app-gnl-gauge-widget',
    standalone: true,
    imports: [CommonModule, WidgetShellComponent],
    templateUrl: './gnl-gauge-widget.component.html',
    styleUrls: ['./gnl-gauge-widget.component.scss']
})
export class GnlGaugeWidgetComponent implements OnInit, OnDestroy {
    @Input() widgetConfig: any;
    @Input() isEnfoque: boolean = false;

    public presionActual: number = 0;
    public temperaturaActual: number = 0;

    // Constantes matemáticas para el SVG
    public longitudTotalArco: number = 110;
    public arcoDashArray: string = '0, 999';
    public anguloAguja: number = -90;
    public ultimoBrazo: string = 'TODOS LOS BRAZOS';

    public cargando: boolean = true;

    // 🟢 VARIABLE PARA EL SEMÁFORO REAL (Sincronizada con la bitácora)
    public alarmaActiva: boolean = false;

    private readonly destroy$ = new Subject<void>();

    /** Origen del dato (telemetría simulada o real) para la vista ampliada. */
    public get origen$() {
        return this._gnlState.origen$;
    }

    constructor(
        private _gnlState: GnlStateService,
        private _torreService: DashboardService,
        private cdr: ChangeDetectorRef
    ) { }

    // 🟢 CEREBRO DEL SEMÁFORO: Retorna el código de color exacto
    get colorEstado(): string {
        // 1. ROJO (Peligro o Alarma SCADA activada)
        if (this.alarmaActiva || this.presionActual >= 75) {
            return '#ff4757';
        }
        // 2. AMARILLO / NARANJA (Advertencia)
        if (this.presionActual >= 72 && this.presionActual < 75) {
            return '#ff9800';
        }
        // 3. AZUL MENTA / CRIOGÉNICO (Estable)
        return '#00d4ff';
    }

    ngOnInit(): void {
        // 🟢 1. ESCUCHAMOS EL CAMBIO DE BRAZO PARA REINICIAR EL TACÓMETRO
        this._gnlState.brazoSeleccionado$
            .pipe(takeUntil(this.destroy$))
            .subscribe((nuevoBrazo: string) => {
                if (nuevoBrazo && this.ultimoBrazo !== nuevoBrazo) {
                    this.ultimoBrazo = nuevoBrazo;
                    this.limpiarTacometro();
                }
            });

        // 2. Escuchamos la telemetría
        this._gnlState.telemetriaFiltrada$
            .pipe(takeUntil(this.destroy$))
            .subscribe((telemetria: any) => {
                if (telemetria) {
                    this.presionActual = Number(telemetria.presion_psi ?? telemetria.presion ?? this.presionActual);
                    this.temperaturaActual = Number(telemetria.temp_ducto ?? telemetria.temperatura ?? this.temperaturaActual);

                    // Corregido 2026-10-17: el backend envía alarma_activa (alarm_triggered / alarmas_activas_count no existen)
                    this.alarmaActiva = telemetria.alarma_activa === true || telemetria.alarm_triggered === 1 || telemetria.alarmas_activas_count > 0;
                    this.ultimoBrazo = telemetria.esConsolidado ? 'TODOS' : (telemetria.codigo_segmento || 'GENERAL');

                    this.anguloAguja = this.calcularAnguloGauge(this.presionActual);

                    this.cargando = false;
                    this.cdr.detectChanges();
                }
            });
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    /**
     * Calcula el ángulo de la aguja y la longitud del trazo de progreso del SVG
     * Asumiendo un rango visual operativo de 0 a 100 PSI (Ajustable)
     */
    private calcularAnguloGauge(valor: number): number {
        const min = 0;
        const max = 100; // Si la presión sube más de 100 en tu sistema, aumenta este valor (ej. 150)

        // Evitamos que el valor se salga del rango visual del dibujo (Clamp)
        const clamped = Math.min(Math.max(valor, min), max);
        const porcentaje = (clamped - min) / (max - min);

        // 🟢 CÁLCULO DEL RELLENO AZUL (Stroke Dasharray)
        // Pintamos 'porcionPintada' (sobre los 110px del arco) y dejamos '999px' invisibles
        // para que jamás se repita el patrón.
        const porcionPintada = this.longitudTotalArco * porcentaje;
        this.arcoDashArray = `${porcionPintada}, 999`;

        // 🟢 CÁLCULO DE LA AGUJA
        // Rota desde -90° (extremo izquierdo) hasta +90° (extremo derecho)
        return -90 + (porcentaje * 180);
    }

    private limpiarTacometro(): void {
        // 🟢 REGRESAMOS TODO A CERO
        this.presionActual = 0;
        this.temperaturaActual = 0;
        this.alarmaActiva = false;

        // Devolvemos la aguja al extremo izquierdo y borramos la línea de color
        this.anguloAguja = -90;
        this.arcoDashArray = '0, 999';

        this.cargando = true;
        this.cdr.detectChanges();
    }

    /** Corregido 2026-10-22: el botón ampliar no hacía nada. El tacómetro se reconecta solo a la telemetría. */
    maximizarDesdeShell(): void {
        if (this.isEnfoque) {
            this._torreService.cerrarModoEnfoque();
        } else {
            this._torreService.abrirModoEnfoque(this.widgetConfig?.type || 'PTT_GNL_GAUGE_PRESION', { ...(this.widgetConfig || {}) });
        }
    }
}
