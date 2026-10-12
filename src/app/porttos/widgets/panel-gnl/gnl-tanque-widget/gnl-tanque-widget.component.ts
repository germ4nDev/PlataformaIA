/* eslint-disable @typescript-eslint/no-explicit-any */
/*
    Author: German Valencia
    Component: PORTTOS Smart Widget - GNL Tanque Ocupación (Consumo Autónomo SCADA)
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
    selector: 'app-gnl-tanque-widget',
    standalone: true,
    imports: [CommonModule, DecimalPipe, WidgetShellComponent],
    templateUrl: './gnl-tanque-widget.component.html',
    styleUrls: ['./gnl-tanque-widget.component.scss']
})
export class GnlTanqueWidgetComponent implements OnInit, OnChanges, OnDestroy {
    @Input() widgetConfig: any;
    @Input() isEnfoque: boolean = false;
    @Input() mostrarTabla: boolean = false;

    // Respaldo para hidratar el estado cuando se abre en el modal de Modo Enfoque
    @Input() datosVivos: any;

    public readonly capacidadMaximaM3: number = 170000;
    public nivelOcupacion: number = 85.0; // 85% = 144,500 m³ base operativa
    public volumenActualM3: number = 144500;
    public segmentoActivo: string = 'TODOS';
    public estadoValvula: number = 1; // 1: Abierta, 2: Regulación, 0: Cerrada
    public estadoBomba: number = 1;   // 1: Activa, 0: Inactiva
    public tipoEvento: string = 'normal';
    public tieneTelemetria: boolean = false;

    private readonly destroy$ = new Subject<void>();

    constructor(
        private _gnlState: GnlStateService,
        private _torreService: DashboardService,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit(): void {
        // 1. Si se abre desde el modal de Modo Enfoque, hidratamos el nivel exacto
        if (this.datosVivos) {
            this.hidratarEstadoTanque(this.datosVivos);
        }

        // 2. Escuchamos cambios en el filtro de segmento/brazo del Header de GNL
        this._gnlState.brazoSeleccionado$
            .pipe(takeUntil(this.destroy$))
            .subscribe((brazo: string) => {
                if (brazo) {
                    this.segmentoActivo = brazo;
                    this.cdr.detectChanges();
                }
            });

        // 3. Suscripción autónoma al flujo de telemetría de GnlStateService (scada_pipeline.csv)
        this._gnlState.telemetriaFiltrada$
            .pipe(takeUntil(this.destroy$))
            .subscribe((pulso: ITelemetriaGNL | null) => {
                if (pulso) {
                    this.procesarTelemetriaTanque(pulso);
                }
            });
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['datosVivos'] && this.datosVivos) {
            this.hidratarEstadoTanque(this.datosVivos);
        }
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    get data(): any {
        return {
            ...(this.widgetConfig?.data || {}),
            titulo: this.widgetConfig?.tituloWidget || this.widgetConfig?.data?.titulo || 'Ocupación de Planta',
            subtitulo:
                this.widgetConfig?.descripcionWidget ||
                this.widgetConfig?.data?.subtitulo ||
                'GOLAR FREEZE · ALMACENAMIENTO CRIOGÉNICO',
            nivelOcupacion: this.nivelOcupacion,
            volumenActualM3: this.volumenActualM3,
            segmentoActivo: this.segmentoActivo,
            estadoValvula: this.estadoValvula,
            estadoBomba: this.estadoBomba,
            tipoEvento: this.tipoEvento
        };
    }

    get textoValvula(): string {
        if (this.estadoValvula === 1) return 'Válvula Abierta';
        if (this.estadoValvula === 2) return 'Regulación Parcial';
        return 'Válvula Cerrada';
    }

    private hidratarEstadoTanque(snapshot: any): void {
        const nivelExplicito =
            snapshot.nivelOcupacion ??
            snapshot.nivel_tanque ??
            snapshot.ocupacion;

        if (nivelExplicito !== undefined) {
            this.nivelOcupacion = Math.min(100, Math.max(0, Number(nivelExplicito)));
            this.volumenActualM3 =
                snapshot.volumenActualM3 !== undefined
                    ? Number(snapshot.volumenActualM3)
                    : Math.round(this.capacidadMaximaM3 * (this.nivelOcupacion / 100));
            this.segmentoActivo = snapshot.segmentoActivo || this.segmentoActivo;
            this.estadoValvula = Number(snapshot.estadoValvula ?? 1);
            this.estadoBomba = Number(snapshot.estadoBomba ?? 1);
            this.tipoEvento = snapshot.tipoEvento || 'normal';
            this.tieneTelemetria = true;
            this.cdr.detectChanges();
        } else if (snapshot.flujo_m3 !== undefined || snapshot.flow_rate !== undefined) {
            this.procesarTelemetriaTanque(snapshot);
        }
    }

    /**
     * Actualiza el estado del tanque con cada lectura de scada_pipeline.csv
     */
    private procesarTelemetriaTanque(lectura: any): void {
        if (!lectura) return;

        this.segmentoActivo = String(
            lectura.codigo_segmento ??
            (lectura.segment_id !== undefined ? `SEG-${lectura.segment_id}` : this.segmentoActivo)
        );
        this.estadoValvula = Number(lectura.valve_status ?? 1);
        this.estadoBomba = Number(lectura.pump_state ?? 1);
        this.tipoEvento = String(lectura.event_type || 'normal');

        // 1. Si el backend envía nivel_tanque u ocupacion explícita, la usamos directamente
        if (lectura.nivel_tanque !== undefined || lectura.ocupacion !== undefined) {
            this.nivelOcupacion = Math.min(
                100,
                Math.max(0, Number(lectura.nivel_tanque ?? lectura.ocupacion))
            );
            this.volumenActualM3 = Math.round(this.capacidadMaximaM3 * (this.nivelOcupacion / 100));
        } else {
            // 2. Balance dinámico desde flow_rate (m³/h) de scada_pipeline.csv
            const flujoM3h = Number(lectura.flujo_m3 ?? lectura.flow_rate ?? 0);
            if (this.estadoValvula > 0 && flujoM3h > 0) {
                // En caso de fuga ('leak') descuenta levemente; en operación normal suma al inventario
                const factorDireccion = this.tipoEvento === 'leak' ? -1 : 1;
                this.volumenActualM3 = Math.min(
                    this.capacidadMaximaM3,
                    Math.max(0, this.volumenActualM3 + factorDireccion * flujoM3h)
                );
                this.nivelOcupacion = Number(
                    ((this.volumenActualM3 / this.capacidadMaximaM3) * 100).toFixed(2)
                );
            }
        }

        this.tieneTelemetria = true;
        this.cdr.detectChanges();
    }

    public maximizarDesdeShell(): void {
        if (this.isEnfoque) {
            this._torreService.cerrarModoEnfoque();
        } else {
            this._torreService.abrirModoEnfoque(
                this.widgetConfig?.type || 'PTT_GNL_KPI_TNQ_OCUP',
                this.data
            );
        }
    }
}
