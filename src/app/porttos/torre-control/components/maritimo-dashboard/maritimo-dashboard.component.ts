/* eslint-disable @typescript-eslint/no-explicit-any */
/*
    Author: German Valencia
    Component: Marítimo Dashboard (pestaña TLC_MARITIMO_001) · Layout Manager común (PestanaGridsterBase)
    Cascada dinámica de terminales: antes de armar consulta las terminales del puerto y, si el layout de sesión no
    tiene sus tarjetas (TERM_SLOT_n), pide el layout base con ellas. Cada slot se resuelve con la tarjeta de terminal
    y recibe su terminal. Al terminar, hidrata los widgets no autónomos con el resumen operativo (datosVivos).
*/
import { ChangeDetectorRef, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GridsterComponent, GridsterConfig, GridsterItemComponent } from 'angular-gridster2';
import { firstValueFrom } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { LayoutMetadataEngineService } from 'src/app/theme/shared/service/layout-metadata-engine.service';
import { LocalStorageService } from 'src/app/theme/shared/service';
import { MaritimoService } from 'src/app/theme/shared/service/tablero-control/maritimo.service';
import { WIDGET_MAP } from '../../widget-registry';
import { PestanaGridsterBase, WidgetEnCuadricula } from '../pestana-gridster/pestana-gridster.base';

const CODIGO_TERMINAL = 'PTT_MAE_WGT_TERMINAL';
const esCodigoTerminal = (codigo: string): boolean =>
    codigo.startsWith('TERM_SLOT_') || codigo === CODIGO_TERMINAL || codigo === 'WDG_PORT_TERMINAL_INDIVIDUAL';

@Component({
    selector: 'app-maritimo-dashboard',
    standalone: true,
    imports: [CommonModule, GridsterComponent, GridsterItemComponent],
    templateUrl: '../pestana-gridster/pestana-gridster.component.html',
    styleUrls: ['../pestana-gridster/pestana-gridster.component.scss']
})
export class MaritimoDashboardComponent extends PestanaGridsterBase {
    readonly pestanaActiva = 'TLC_MARITIMO_001';
    readonly nombrePestana = 'Marítimo';
    override readonly iconoVacio = 'feather icon-anchor';

    private terminalesDelPuerto: any[] = [];

    constructor(
        layoutEngine: LayoutMetadataEngineService,
        localStorageService: LocalStorageService,
        cdr: ChangeDetectorRef,
        private _maritimoService: MaritimoService
    ) {
        super(layoutEngine, localStorageService, cdr);
    }

    // ---------------------------------------------------------------- ganchos

    protected override prefijoId(): string {
        return 'wdg-mar';
    }

    protected override opcionesGridster(): Partial<GridsterConfig> {
        return { compactType: 'compactUp', pushDirections: { north: true, east: true, south: true, west: false } };
    }

    protected override alCambiarPuerto(): void {
        this._maritimoService.limpiarCachePuerto();
    }

    protected override async antesDeArmar(puerto: string): Promise<void> {
        try {
            const res = await firstValueFrom(this._maritimoService.obtenerTerminalesPorPuerto(puerto));
            this.terminalesDelPuerto = Array.isArray(res) ? res : [];
        } catch (error) {
            console.warn('⚠️ [Marítimo] Error obteniendo terminales por puerto:', error);
            this.terminalesDelPuerto = [];
        }
    }

    /** También se pide el base si el puerto tiene terminales y el layout de sesión no trae sus tarjetas. */
    protected override necesitaLayoutBase(layout: any[] | null): boolean {
        if (super.necesitaLayoutBase(layout)) return true;
        const tieneSlots = layout!.some((w: any) => esCodigoTerminal(String(w.idClon || w.type || w.codigoWidget || '').toUpperCase()));
        return this.terminalesDelPuerto.length > 0 && !tieneSlots;
    }

    /** El layout base de Marítimo recibe las terminales para crear un slot por cada una. */
    protected override async obtenerLayoutBaseTab(): Promise<any[]> {
        const layout = await this.layoutEngine.obtenerLayoutBase(this.pestanaActiva, this.usuarioId, this.lsWidgets, this.terminalesDelPuerto);
        return layout || [];
    }

    override obtenerComponentePara(codigoWidget: string): any {
        const codigo = (codigoWidget || '').trim().toUpperCase();
        if (esCodigoTerminal(codigo)) {
            return WIDGET_MAP[CODIGO_TERMINAL]?.componente || WIDGET_MAP['WDG_PORT_TERMINAL_INDIVIDUAL']?.componente || null;
        }
        return WIDGET_MAP[codigo]?.componente ?? null;
    }

    protected override armarDashboard(layout: any[], puerto: string): WidgetEnCuadricula[] {
        let contadorTerminal = 0;
        return layout.map((w: any, index: number) => {
            const rawCodigo = (w.type || w.codigoWidget || '').trim().toUpperCase();
            const idClonUpper = String(w.idClon || '').trim().toUpperCase();
            const esSlotTerminal = idClonUpper.startsWith('TERM_SLOT_') || esCodigoTerminal(rawCodigo);
            const codigo = rawCodigo.startsWith('TERM_SLOT_') ? CODIGO_TERMINAL : rawCodigo;
            const id = w.idClon || w.id || (esSlotTerminal ? `TERM_SLOT_${contadorTerminal}` : `${this.prefijoId()}-${index}-${w.x}-${w.y}`);

            let terminal = w.dataTerminal || w.data?.terminal || null;
            let slotIdx = -1;
            if (esSlotTerminal) {
                const match = (idClonUpper || rawCodigo).match(/TERM_SLOT_(\d+)/);
                slotIdx = match ? parseInt(match[1], 10) : contadorTerminal;
                contadorTerminal++;
                if (!terminal && this.terminalesDelPuerto[slotIdx]) terminal = this.terminalesDelPuerto[slotIdx];
            }

            const idClon = esSlotTerminal ? (w.idClon || `TERM_SLOT_${slotIdx}`) : w.idClon;
            return {
                ...w,
                id,
                idClon,
                type: codigo,
                dataTerminal: terminal,
                componenteTarget: this.obtenerComponentePara(codigo),
                componenteInputs: {
                    widgetConfig: {
                        ...w, id, idClon, type: codigo, codigoWidget: codigo,
                        puerto,
                        pestana: this.pestanaActiva,
                        terminalIndex: slotIdx >= 0 ? slotIdx : undefined,
                        dataTerminal: terminal,
                        data: terminal ? { ...(w.data || {}), ...terminal } : w.data
                    },
                    datosVivos: null // lo llena la hidratación
                }
            };
        });
    }

    protected override despuesDeArmar(puerto: string): void {
        this.hidratarWidgetsNoAutonomos(puerto);
    }

    // ---------------------------------------------------------------- hidratación

    /** Resumen operativo del puerto → datosVivos de gráficas/KPIs/tablas y dataTerminal de cada slot. */
    private hidratarWidgetsNoAutonomos(puerto: string): void {
        const servicio: any = this._maritimoService;
        const metodo = servicio.obtenerResumenOperativo || servicio.obtenerTerminalesPorPuerto || servicio.obtenerDatosTerminalSlot;
        if (!metodo) return;

        metodo.call(servicio, puerto)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (res: any) => {
                    const datos = res?.data || res || {};
                    if (!datos || !this.dashboard) return;
                    let cambiosAplicados = false;

                    this.dashboard = this.dashboard.map((widget) => {
                        const tipo = widget.type.toUpperCase();
                        const inputs: any = {
                            ...widget.componenteInputs,
                            widgetConfig: { ...(widget.componenteInputs?.widgetConfig || {}) }
                        };

                        if (tipo === CODIGO_TERMINAL || tipo.startsWith('TERM_SLOT_')) {
                            const panel = datos['PTT_MAE_PANEL_TERMINALES'];
                            const idx = inputs.widgetConfig.terminalIndex;
                            if (Array.isArray(panel) && idx !== undefined && panel[idx]) {
                                inputs.widgetConfig.dataTerminal = panel[idx];
                                inputs.widgetConfig.data = { ...(inputs.widgetConfig.data || {}), ...panel[idx] };
                            }
                        } else {
                            // Por el código exacto o sin el prefijo PTT_MAE_
                            const encontrado = datos[tipo] !== undefined ? datos[tipo] : datos[tipo.replace('PTT_MAE_', '')];
                            if (encontrado !== undefined && encontrado !== null) inputs.datosVivos = encontrado;
                        }

                        const cambio =
                            JSON.stringify(widget.componenteInputs?.['datosVivos']) !== JSON.stringify(inputs.datosVivos) ||
                            JSON.stringify(widget.componenteInputs?.widgetConfig?.dataTerminal) !== JSON.stringify(inputs.widgetConfig.dataTerminal);
                        if (!cambio) return widget;
                        cambiosAplicados = true;
                        return { ...widget, componenteInputs: inputs };
                    });

                    if (cambiosAplicados) this.cdr.detectChanges();
                },
                error: (err: any) => console.error('❌ Error hidratando widgets marítimos:', err)
            });
    }
}
