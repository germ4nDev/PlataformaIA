/* eslint-disable @typescript-eslint/no-explicit-any */
/*
    Author: German Valencia
    Component: GNL Dashboard (pestaña TLC_GNL_001) · Layout Manager común (PestanaGridsterBase)
    Telemetría desacoplada en GnlStateService: se une a la sala GNL del puerto, delega cada pulso del socket al estado
    y pinta los KPI PTT_GNL_KPI_* con la telemetría filtrada por brazo.
*/
import { ChangeDetectorRef, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GridsterComponent, GridsterItemComponent } from 'angular-gridster2';
import { takeUntil } from 'rxjs/operators';
import { LayoutMetadataEngineService } from 'src/app/theme/shared/service/layout-metadata-engine.service';
import { LocalStorageService } from 'src/app/theme/shared/service';
import { SocketService } from 'src/app/theme/shared/service/sockets.service';
import { SocketManagerService } from 'src/app/theme/shared/service/socket-manager.service';
import { GnlStateService } from 'src/app/theme/shared/service/tablero-control/gnl-state.service';
import { PestanaGridsterBase, WidgetEnCuadricula } from '../pestana-gridster/pestana-gridster.base';

@Component({
    selector: 'app-gnl-dashboard',
    standalone: true,
    imports: [CommonModule, GridsterComponent, GridsterItemComponent],
    templateUrl: '../pestana-gridster/pestana-gridster.component.html',
    styleUrls: ['../pestana-gridster/pestana-gridster.component.scss']
})
export class GnlDashboardComponent extends PestanaGridsterBase {
    readonly pestanaActiva = 'TLC_GNL_001';
    readonly nombrePestana = 'GNL';
    override readonly iconoVacio = 'feather icon-droplet';

    /** Filtro de brazo de descarga (selector de GNL). */
    public brazoSeleccionado = 'TODOS';
    public listaBrazosOrdenados: string[] = [];

    constructor(
        layoutEngine: LayoutMetadataEngineService,
        localStorageService: LocalStorageService,
        cdr: ChangeDetectorRef,
        private socketManager: SocketManagerService,
        private socketService: SocketService,
        private _gnlState: GnlStateService
    ) {
        super(layoutEngine, localStorageService, cdr);
    }

    // ---------------------------------------------------------------- ganchos

    protected override titulosDelCatalogo(): boolean {
        return false;
    }

    protected override prefijoId(): string {
        return 'wdg-gnl';
    }

    protected override alIniciar(): void {
        this.suscribirEstadoBrazos();
        this.suscribirTelemetriaKPIs();
        this.iniciarEmisionTelemetria();
        this.encenderTelemetria();
    }

    protected override alCambiarPuerto(): void {
        this.brazoSeleccionado = 'TODOS';
        this._gnlState.reiniciarEstadoPuerto(this.puerto);
        this.iniciarEmisionTelemetria();
    }

    protected override alDestruir(): void {
        this.socketService.salirSalaGnl();
    }

    /** Cada KPI recibe su posición (de izquierda a derecha) y arranca en '0' hasta el primer pulso. */
    protected override armarDashboard(layout: any[], puerto: string): WidgetEnCuadricula[] {
        const idsKpisOrdenados = [...layout]
            .filter((w: any) => (w.type || w.codigoWidget || '').toUpperCase().includes('KPI'))
            .sort((a: any, b: any) => (a.x || 0) - (b.x || 0))
            .map((w: any, idx: number) => w.idClon || w.id || `kpi-${idx}-${w.x}-${w.y}`);

        return layout.map((w: any, index: number) => {
            const item = this.armarWidget(w, index, puerto);
            const kpiPos = idsKpisOrdenados.indexOf(w.idClon || w.id || `kpi-${index}-${w.x}-${w.y}`);
            item.componenteInputs!.widgetConfig = {
                ...item.componenteInputs!.widgetConfig,
                kpiIndex: kpiPos >= 0 ? kpiPos : index,
                valor: item.type.includes('KPI') ? '0' : undefined
            };
            return item;
        });
    }

    // ---------------------------------------------------------------- telemetría

    /** Pide al API que inicie la transmisión SCADA del puerto. */
    private iniciarEmisionTelemetria(): void {
        this.socketService.unirseSalaGnl(this.puertoNormalizado);
    }

    /** Escucha el socket del manager y delega el cálculo a GnlStateService. */
    private encenderTelemetria(): void {
        this.socketManager.telemetriaGNLActualizada$
            .pipe(takeUntil(this.destroy$))
            .subscribe((payload: any) => this._gnlState.procesarPulsoSocket(payload, this.puerto));
    }

    /** Telemetría filtrada → valor de cada KPI superior. */
    private suscribirTelemetriaKPIs(): void {
        this._gnlState.telemetriaFiltrada$
            .pipe(takeUntil(this.destroy$))
            .subscribe((telemetria: any) => {
                if (!telemetria || !this.dashboard.length) return;
                let cambiosAplicados = false;

                this.dashboard = this.dashboard.map((widget) => {
                    const tipo = widget.type.toUpperCase();
                    if (!tipo.startsWith('PTT_GNL_KPI')) return widget;

                    const nuevoValor = GnlDashboardComponent.valorKpi(tipo, telemetria);
                    const config = widget.componenteInputs?.widgetConfig || {};
                    if (config.valor === nuevoValor) return widget;

                    cambiosAplicados = true;
                    return { ...widget, componenteInputs: { widgetConfig: { ...config, valor: nuevoValor } } };
                });

                if (cambiosAplicados) this.cdr.detectChanges();
            });
    }

    private static valorKpi(tipo: string, t: any): string | number {
        switch (tipo) {
            case 'PTT_GNL_KPI_CALIDAD':
            case 'PTT_GNL_KPI_CALORIFICO':
                return t.poder_calorifico !== undefined ? t.poder_calorifico : '0';
            case 'PTT_GNL_KPI_DESCARGA':
            case 'PTT_GNL_KPI_INYECCION':
                return t.descarga_buque !== undefined ? t.descarga_buque : '0';
            case 'PTT_GNL_KPI_ODO_MMBTU': {
                // Energía transferida calculada con el caudal
                const flujo = Number(t.caudal_m3h ?? t.flujo_m3h ?? 0);
                return flujo > 0 ? ((flujo * 22.4) / 3600).toFixed(4) : '0';
            }
            case 'PTT_GNL_KPI_BOG':
                return t.bog_m3h ?? t.bog ?? '0';
            case 'PTT_GNL_KPI_VOLUMEN':
            case 'PTT_GNL_KPI_TNQ_OCUP':
                return t.volumen_almacenado !== undefined ? `${t.volumen_almacenado}%` : '0%';
            case 'PTT_GNL_KPI_METRICA':
                return t.indice_wobbe ?? t.metano_pct ?? '0';
            case 'PTT_GNL_KPI_FLUJO':
                return t.caudal_m3h ?? t.flujo ?? '0';
            case 'PTT_GNL_KPI_PRESION':
                return t.presion_psi ?? t.presion ?? '0';
            case 'PTT_GNL_KPI_TEMP':
                return t.temp_ducto ?? t.temperatura ?? '0';
            case 'PTT_GNL_KPI_ALERTAS':
                return t.alarma_activa ? 'ALERTA SCADA' : 'OPERACIÓN NORMAL';
            default:
                return '0';
        }
    }

    // ---------------------------------------------------------------- filtro de brazos

    private suscribirEstadoBrazos(): void {
        this._gnlState.brazosActivos$
            .pipe(takeUntil(this.destroy$))
            .subscribe((brazos) => {
                if (brazos.length !== this.listaBrazosOrdenados.length) {
                    this.listaBrazosOrdenados = brazos;
                    this.cdr.detectChanges();
                }
            });
    }

    get brazosOrdenados(): string[] {
        return this.listaBrazosOrdenados;
    }

    public cambiarFiltroGNL(brazo: string): void {
        this.brazoSeleccionado = brazo;
        this._gnlState.seleccionarBrazo(brazo);
    }
}
