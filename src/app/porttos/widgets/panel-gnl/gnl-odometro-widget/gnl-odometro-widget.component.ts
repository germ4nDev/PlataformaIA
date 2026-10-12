/* eslint-disable @typescript-eslint/no-explicit-any */
/*
    Author: German Valencia
    Component: PORTTOS Smart Widget - GNL Odómetro Totalizador MMBTU (Consumo Autónomo SCADA)
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
    selector: 'app-gnl-odometro-widget',
    standalone: true,
    imports: [CommonModule, DecimalPipe, WidgetShellComponent],
    templateUrl: './gnl-odometro-widget.component.html',
    styleUrls: ['./gnl-odometro-widget.component.scss']
})
export class GnlOdometroWidgetComponent implements OnInit, OnChanges, OnDestroy {
    @Input() widgetConfig: any;
    @Input() isEnfoque: boolean = false;
    @Input() mostrarTabla: boolean = false;

    // Respaldo para hidratar el acumulado al abrir el modal de Modo Enfoque
    @Input() datosVivos: any;

    public energiaTotal: number = 1425.50; // Base operativa inicial del turno
    public tasaInstantanea: number = 0;
    public caudalActual: number = 0;
    public segmentoActivo: string = 'TODOS';
    public tieneTelemetria: boolean = false;

    private readonly destroy$ = new Subject<void>();

    constructor(
        private _gnlState: GnlStateService,
        private _torreService: DashboardService,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit(): void {
        // 1. Si se abre en el modal de Modo Enfoque, restauramos el acumulado exacto sin perder la cuenta
        if (this.datosVivos) {
            this.hidratarEstado(this.datosVivos);
        }

        // 2. Escuchamos cambios en el filtro de brazo/segmento desde el Header de GNL
        this._gnlState.brazoSeleccionado$
            .pipe(takeUntil(this.destroy$))
            .subscribe((brazo: string) => {
                if (brazo) {
                    this.segmentoActivo = brazo;
                    this.cdr.detectChanges();
                }
            });

        // 3. Suscripción autónoma a los pulsos de telemetría (scada_pipeline.csv / WebSocket)
        this._gnlState.telemetriaFiltrada$
            .pipe(takeUntil(this.destroy$))
            .subscribe((pulso: ITelemetriaGNL | null) => {
                if (pulso) {
                    this.procesarPulsoEnergia(pulso);
                }
            });
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['datosVivos'] && this.datosVivos) {
            this.hidratarEstado(this.datosVivos);
        }
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    get cargando(): boolean {
        return !this.tieneTelemetria;
    }

    get data(): any {
        return {
            ...(this.widgetConfig?.data || {}),
            titulo: this.widgetConfig?.tituloWidget || this.widgetConfig?.data?.titulo || 'Energía Transferida',
            subtitulo:
                this.widgetConfig?.descripcionWidget ||
                this.widgetConfig?.data?.subtitulo ||
                'TOTALIZADOR EN MMBTU',
            energiaTotal: this.energiaTotal,
            tasaInstantanea: this.tasaInstantanea,
            caudalActual: this.caudalActual,
            segmentoActivo: this.segmentoActivo
        };
    }

    /**
     * Restaura el acumulado cuando se abre en Modo Enfoque o recibe un snapshot directo
     */
    private hidratarEstado(snapshot: any): void {
        if (snapshot.energiaTotal !== undefined) {
            this.energiaTotal = Number(snapshot.energiaTotal);
            this.tasaInstantanea = Number(snapshot.tasaInstantanea || 0);
            this.caudalActual = Number(snapshot.caudalActual || 0);
            this.segmentoActivo = snapshot.segmentoActivo || 'TODOS';
            this.tieneTelemetria = true;
            this.cdr.detectChanges();
        } else if (
            snapshot.flujo_m3 !== undefined ||
            snapshot.flow_rate !== undefined ||
            snapshot.energy_consumption !== undefined
        ) {
            this.procesarPulsoEnergia(snapshot);
        }
    }

    /**
     * Calcula e incrementa los MMBTU en cada pulso de scada_pipeline.csv
     */
    private procesarPulsoEnergia(lectura: any): void {
        if (!lectura) return;

        const flujo = Number(lectura.flujo_m3 ?? lectura.flow_rate ?? 0);
        const energiaCsv = Number(lectura.energy_consumption ?? 0);

        this.caudalActual = flujo;
        this.tasaInstantanea = energiaCsv > 0 ? energiaCsv : Number((flujo * 22.4).toFixed(2));
        this.segmentoActivo = String(
            lectura.codigo_segmento ??
            (lectura.segment_id !== undefined ? `SEG-${lectura.segment_id}` : this.segmentoActivo)
        );

        // Fórmula de incremento por pulso: prioriza conversión de caudal (m3/h * 22.4 / 3600)
        // o fracción de energy_consumption del CSV si el caudal viene en 0
        const deltaMMBTU =
            flujo > 0
                ? (flujo * 22.4) / 3600
                : energiaCsv > 0
                    ? energiaCsv / 3600
                    : 0;

        this.energiaTotal += deltaMMBTU;
        this.tieneTelemetria = true;
        this.cdr.detectChanges();
    }

    public maximizarDesdeShell(): void {
        if (this.isEnfoque) {
            this._torreService.cerrarModoEnfoque();
        } else {
            this._torreService.abrirModoEnfoque(
                this.widgetConfig?.type || 'PTT_GNL_KPI_ODO_MMBTU',
                this.data
            );
        }
    }
}
