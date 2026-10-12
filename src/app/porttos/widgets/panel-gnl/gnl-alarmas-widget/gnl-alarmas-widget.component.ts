/* eslint-disable @typescript-eslint/no-explicit-any */
/*
    Author: German Valencia
    Component: PORTTOS Smart Widget - GNL Bitácora de Alarmas SCADA (Consumo Autónomo CSV / Socket)
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
import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { WidgetShellComponent } from 'src/app/theme/shared/components/widget-shell/widget-shell.component';
import { DashboardService } from 'src/app/theme/shared/service/tablero-control/dashboard.service';
import { GnlStateService, ITelemetriaGNL } from 'src/app/theme/shared/service/tablero-control/gnl-state.service';

export interface AlarmaEvento {
    id: string;
    tiempo: Date;
    segmento: string;
    eventoScada: string;
    mensaje: string;
    tipo: 'peligro' | 'advertencia' | 'info';
    valor: number;
    caudal?: number;
}

@Component({
    selector: 'app-gnl-alarmas-widget',
    standalone: true,
    imports: [CommonModule, DatePipe, DecimalPipe, WidgetShellComponent],
    templateUrl: './gnl-alarmas-widget.component.html',
    styleUrls: ['./gnl-alarmas-widget.component.scss']
})
export class GnlAlarmasWidgetComponent implements OnInit, OnChanges, OnDestroy {
    @Input() widgetConfig: any;
    @Input() isEnfoque: boolean = false;
    @Input() mostrarTabla: boolean = false;

    // Respaldo para hidratar la bitácora cuando se abre en el modal de Modo Enfoque
    @Input() datosVivos: any;

    public eventos: AlarmaEvento[] = [];
    public filtroSegmento: string = 'TODOS';
    public tieneTelemetria: boolean = false;

    private readonly MAX_EVENTOS = 15;
    // Memoria de última firma por segmento para no duplicar el mismo pulso pero permitir alertas de distintos brazos
    private ultimaFirmaPorSegmento = new Map<string, string>();
    private readonly destroy$ = new Subject<void>();

    constructor(
        private _gnlState: GnlStateService,
        private _torreService: DashboardService,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit(): void {
        // 1. Si se abre en el modal de Modo Enfoque, restauramos la bitácora existente
        if (this.datosVivos) {
            this.hidratarDesdeEnfoque(this.datosVivos);
        }

        // 2. Escuchamos el filtro de brazo/segmento activo en el Header de GNL
        this._gnlState.brazoSeleccionado$
            .pipe(takeUntil(this.destroy$))
            .subscribe((brazo: string) => {
                if (brazo) {
                    this.filtroSegmento = brazo;
                    this.cdr.detectChanges();
                }
            });

        // 3. Suscripción autónoma al flujo de telemetría SCADA (scada_pipeline.csv)
        this._gnlState.telemetriaFiltrada$
            .pipe(takeUntil(this.destroy$))
            .subscribe((pulso: ITelemetriaGNL | null) => {
                if (pulso) {
                    this.evaluarTelemetriaScada(pulso);
                }
            });
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['datosVivos'] && this.datosVivos) {
            this.hidratarDesdeEnfoque(this.datosVivos);
        }
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    get data(): any {
        return {
            ...(this.widgetConfig?.data || {}),
            titulo: this.widgetConfig?.tituloWidget || this.widgetConfig?.data?.titulo || 'Bitácora de Eventos',
            subtitulo:
                this.widgetConfig?.descripcionWidget ||
                this.widgetConfig?.data?.subtitulo ||
                'REGISTRO DE ALERTAS SCADA',
            eventos: [...this.eventos],
            filtroSegmento: this.filtroSegmento
        };
    }

    get cargando(): boolean {
        return !this.tieneTelemetria && this.eventos.length === 0;
    }

    get eventosFiltrados(): AlarmaEvento[] {
        if (!this.filtroSegmento || this.filtroSegmento === 'TODOS') {
            return this.eventos;
        }
        return this.eventos.filter(
            (e) => e.segmento === this.filtroSegmento || e.segmento === 'TODOS'
        );
    }

    get totalPeligro(): number {
        return this.eventosFiltrados.filter((e) => e.tipo === 'peligro').length;
    }

    /**
     * Restaura la lista de eventos cuando el widget se abre en Modo Enfoque
     */
    private hidratarDesdeEnfoque(snapshot: any): void {
        if (Array.isArray(snapshot.eventos) && snapshot.eventos.length > 0) {
            this.eventos = snapshot.eventos.map((e: any) => ({
                ...e,
                tiempo: e.tiempo instanceof Date ? e.tiempo : new Date(e.tiempo)
            }));
            this.tieneTelemetria = true;
            this.cdr.detectChanges();
        } else if (
            snapshot.presion_psi !== undefined ||
            snapshot.pressure !== undefined ||
            snapshot.alarm_triggered !== undefined
        ) {
            this.evaluarTelemetriaScada(snapshot);
        }
    }

    /**
     * Evalúa todas las condiciones de scada_pipeline.csv:
     * - alarm_triggered (0 | 1)
     * - event_type ('normal' | 'blockage' | 'surge' | 'leak' | 'degradation')
     * - Umbrales de presión (Alta >= 100 PSI, Precaución 85-100 PSI, Caída por fuga <= 65 PSI)
     */
    private evaluarTelemetriaScada(lectura: any): void {
        if (!lectura) return;
        this.tieneTelemetria = true;

        const presion = Number(lectura.presion_psi ?? lectura.pressure ?? 0);
        const caudal = Number(lectura.flujo_m3 ?? lectura.flow_rate ?? 0);
        const alarmaCsv = Number(lectura.alarm_triggered ?? 0) === 1 || Boolean(lectura.alarma_activa);
        const eventType = String(lectura.event_type || 'normal').toLowerCase().trim();
        const segmento = String(
            lectura.codigo_segmento ??
            (lectura.segment_id !== undefined ? `SEG-${lectura.segment_id}` : 'TODOS')
        );
        const timestampRaw = lectura.timestamp || new Date().toISOString();

        let tipo: 'peligro' | 'advertencia' | 'info' | null = null;
        let mensaje = '';

        // 1. Clasificación por tipo de anomalía de scada_pipeline.csv + umbrales físicos
        if (eventType === 'leak') {
            tipo = 'peligro';
            mensaje = `[${segmento}] Fuga detectada en línea (caída a ${presion.toFixed(1)} PSI)`;
        } else if (eventType === 'blockage') {
            tipo = 'peligro';
            mensaje = `[${segmento}] Bloqueo en ducto (flujo reducido a ${caudal.toFixed(2)} m³/h)`;
        } else if (eventType === 'surge' || presion >= 100) {
            tipo = 'peligro';
            mensaje = `[${segmento}] Sobrepresión crítica (Surge) en tubería`;
        } else if (eventType === 'degradation') {
            tipo = alarmaCsv ? 'peligro' : 'advertencia';
            mensaje = `[${segmento}] Degradación operativa en equipo de bombeo`;
        } else if (alarmaCsv) {
            tipo = 'peligro';
            mensaje = `[${segmento}] Alarma operativa activada en telemetría SCADA`;
        } else if (presion >= 85) {
            tipo = 'advertencia';
            mensaje = `[${segmento}] Presión en zona de precaución (≥ 85 PSI)`;
        } else if (presion > 0 && presion <= 62) {
            tipo = 'advertencia';
            mensaje = `[${segmento}] Baja presión en línea de transferencia`;
        }

        // Si el segmento vuelve a estado normal, liberamos su firma para futuras incidencias
        if (!tipo) {
            this.ultimaFirmaPorSegmento.set(segmento, 'estable');
            this.cdr.detectChanges();
            return;
        }

        const firmaActual = `${tipo}-${eventType}`;
        const firmaPrevia = this.ultimaFirmaPorSegmento.get(segmento);

        // Evitamos duplicar el mismo evento consecutivo en el mismo segmento
        if (firmaPrevia === firmaActual) {
            return;
        }

        this.ultimaFirmaPorSegmento.set(segmento, firmaActual);

        const fechaParseada = new Date(timestampRaw);
        const tiempoValido = !isNaN(fechaParseada.getTime()) ? fechaParseada : new Date();

        const nuevoEvento: AlarmaEvento = {
            id: `${segmento}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            tiempo: tiempoValido,
            segmento,
            eventoScada: eventType.toUpperCase(),
            mensaje,
            tipo,
            valor: presion,
            caudal
        };

        this.eventos = [nuevoEvento, ...this.eventos].slice(0, this.MAX_EVENTOS);
        this.cdr.detectChanges();
    }

    public trackByEvento(index: number, item: AlarmaEvento): string {
        return item.id || index.toString();
    }

    public maximizarDesdeShell(): void {
        if (this.isEnfoque) {
            this._torreService.cerrarModoEnfoque();
        } else {
            this._torreService.abrirModoEnfoque(
                this.widgetConfig?.type || 'PTT_GNL_CHART_ALM_EVENT',
                this.data
            );
        }
    }
}
