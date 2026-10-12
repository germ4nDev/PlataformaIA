/* eslint-disable @typescript-eslint/no-explicit-any */
/*
    Author: German Valencia
    Pattern: PORTTOS Smart Widget - GNL Gauge Presión y Temperatura (Consumo Autónomo SCADA)
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
import { DashboardService } from 'src/app/theme/shared/service/tablero-control/dashboard.service';
import { GnlStateService, ITelemetriaGNL } from 'src/app/theme/shared/service/tablero-control/gnl-state.service';

@Component({
    selector: 'app-gnl-gauge-widget',
    standalone: true,
    imports: [CommonModule, DecimalPipe, WidgetShellComponent],
    templateUrl: './gnl-gauge-widget.component.html',
    styleUrls: ['./gnl-gauge-widget.component.scss']
})
export class GnlGaugeWidgetComponent implements OnInit, OnChanges, OnDestroy {
    @Input() widgetConfig: any;
    @Input() isEnfoque: boolean = false;
    @Input() mostrarTabla: boolean = false;

    // Respaldo para hidratación inmediata al abrir el modal de Modo Enfoque
    @Input() datosVivos: any;

    public presionActual: number = 0;
    public temperaturaActual: number = 0;
    public alarmaActiva: boolean = false;
    public tipoEvento: string = 'normal';
    public segmentoActivo: string = 'TODOS';
    public presionMaxima: number = 120;
    public tieneTelemetria: boolean = false;

    private readonly destroy$ = new Subject<void>();

    constructor(
        private _gnlState: GnlStateService,
        private _torreService: DashboardService,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit(): void {
        // 1. Si viene precargado desde el modal de Modo Enfoque, aplicamos el snapshot inicial
        if (this.datosVivos) {
            this.aplicarLecturaTelemetria(this.datosVivos);
        }

        // 2. Suscripción autónoma al flujo reactivo de GnlStateService (scada_pipeline.csv)
        this._gnlState.telemetriaFiltrada$
            .pipe(takeUntil(this.destroy$))
            .subscribe((pulso: ITelemetriaGNL | null) => {
                if (pulso) {
                    this.aplicarLecturaTelemetria(pulso);
                }
            });
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['datosVivos'] && this.datosVivos) {
            this.aplicarLecturaTelemetria(this.datosVivos);
        }
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    /**
     * Homologa lecturas provenientes de GnlStateService, del socket o directamente de scada_pipeline.csv
     */
    private aplicarLecturaTelemetria(lectura: any): void {
        if (!lectura) return;

        // Soporta estado hidratado desde Modo Enfoque o trama viva SCADA
        const presion =
            lectura.presionActual ??
            lectura.presion_psi ??
            lectura.pressure;

        if (presion === undefined && lectura.temperaturaActual === undefined) return;

        this.presionActual = Number(presion ?? 0);
        this.temperaturaActual = Number(
            lectura.temperaturaActual ??
            lectura.temperatura_celsius ??
            lectura.temp_ducto ??
            lectura.temperature ??
            0
        );

        this.segmentoActivo = String(
            lectura.segmentoActivo ??
            lectura.codigo_segmento ??
            (lectura.segment_id !== undefined ? `SEG-${lectura.segment_id}` : 'TODOS')
        );

        this.tipoEvento = String(lectura.event_type || lectura.tipoEvento || 'normal');

        const alarmaExplicita = Boolean(
            lectura.alarmaActiva ||
            lectura.alarma_activa ||
            Number(lectura.alarm_triggered) === 1
        );

        this.alarmaActiva = alarmaExplicita || this.presionActual >= 100;
        this.tieneTelemetria = true;
        this.cdr.detectChanges();
    }

    get cargando(): boolean {
        return !this.tieneTelemetria;
    }

    get data(): any {
        return {
            ...(this.widgetConfig?.data || {}),
            titulo: this.widgetConfig?.tituloWidget || this.widgetConfig?.data?.titulo || 'Presión de Descarga',
            subtitulo:
                this.widgetConfig?.descripcionWidget ||
                this.widgetConfig?.data?.subtitulo ||
                'Telemetría de Brazo / Segmento SCADA',
            presionActual: this.presionActual,
            temperaturaActual: this.temperaturaActual,
            alarmaActiva: this.alarmaActiva,
            tipoEvento: this.tipoEvento,
            segmentoActivo: this.segmentoActivo
        };
    }

    /**
     * Convierte el rango 0..120 PSI al ángulo -90°..+90° de la aguja semicircular
     */
    get calcularAnguloAguja(): number {
        let porcentaje = this.presionActual / this.presionMaxima;
        if (porcentaje > 1) porcentaje = 1;
        if (porcentaje < 0) porcentaje = 0;
        return porcentaje * 180 - 90;
    }

    /**
     * Evalúa correctamente el color de la temperatura tanto en escala criogénica (< 0 °C)
     * como en la escala positiva de scada_pipeline.csv (25.92 °C - 38.52 °C)
     */
    get claseTemperatura(): string {
        if (this.temperaturaActual < 0) {
            if (this.temperaturaActual > -150) return 'text-danger';
            if (this.temperaturaActual > -155) return 'text-warning';
            return 'text-info';
        }
        // Rango positivo de scada_pipeline.csv (Media: 32.1 °C, P90: 34.67 °C, P95: 35.35 °C)
        if (this.temperaturaActual >= 35.5) return 'text-danger';
        if (this.temperaturaActual >= 34.5) return 'text-warning';
        return 'text-info';
    }

    public maximizarDesdeShell(): void {
        if (this.isEnfoque) {
            this._torreService.cerrarModoEnfoque();
        } else {
            this._torreService.abrirModoEnfoque(
                this.widgetConfig?.type || 'PTT_GNL_GAUGE_PRESION',
                this.data
            );
        }
    }
}
