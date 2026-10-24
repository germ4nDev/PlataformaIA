/* eslint-disable @typescript-eslint/no-explicit-any */
/*
    Author: German Valencia
    Component: Virtual Gate Dashboard (pestaña TLC_VIRTUAL_GATE_001) · Layout Manager común (PestanaGridsterBase)
    Precarga la cola del gate al iniciar y al cambiar de puerto. Los KPI PTT_GATE_KPI_* sin registro propio usan
    la tarjeta de PTT_GATE_KPI_OP (KpiCardTclComponent).
*/
import { ChangeDetectorRef, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GridsterComponent, GridsterItemComponent, GridsterConfig } from 'angular-gridster2';
import { LayoutMetadataEngineService } from 'src/app/theme/shared/service/layout-metadata-engine.service';
import { LocalStorageService } from 'src/app/theme/shared/service';
import { VirtualGateService } from 'src/app/theme/shared/service/tablero-control/virtual-gate.service';
import { WIDGET_MAP } from '../../widget-registry';
import { PestanaGridsterBase } from '../pestana-gridster/pestana-gridster.base';

@Component({
    selector: 'app-virtual-gate-dashboard',
    standalone: true,
    imports: [CommonModule, GridsterComponent, GridsterItemComponent],
    templateUrl: '../pestana-gridster/pestana-gridster.component.html',
    styleUrls: ['../pestana-gridster/pestana-gridster.component.scss']
})
export class VirtualGateDashboardComponent extends PestanaGridsterBase {
    readonly pestanaActiva = 'TLC_VIRTUAL_GATE_001';
    readonly nombrePestana = 'Virtual Gate';
    override readonly iconoVacio = 'feather icon-log-in';

    constructor(
        layoutEngine: LayoutMetadataEngineService,
        localStorageService: LocalStorageService,
        cdr: ChangeDetectorRef,
        private _virtualGateService: VirtualGateService
    ) {
        super(layoutEngine, localStorageService, cdr);
    }

    protected override titulosDelCatalogo(): boolean {
        return false;
    }

    protected override prefijoId(): string {
        return 'wdg-gate';
    }

    protected override opcionesGridster(): Partial<GridsterConfig> {
        return { pushDirections: { north: true, east: true, south: true, west: true } };
    }

    protected override alIniciar(): void {
        this._virtualGateService.obtenerColaGate(this.puerto, true).subscribe();
    }

    protected override alCambiarPuerto(): void {
        this._virtualGateService.limpiarCachePuerto();
        this._virtualGateService.obtenerColaGate(this.puerto, true).subscribe();
    }

    override obtenerComponentePara(codigoWidget: string): any {
        const codigo = (codigoWidget || '').trim().toUpperCase();
        if (!codigo) return null;
        if (WIDGET_MAP[codigo]) return WIDGET_MAP[codigo].componente;
        // Puente a KpiCardTclComponent para los KPI del gate sin registro propio
        if (codigo.startsWith('PTT_GATE_KPI_')) return WIDGET_MAP['PTT_GATE_KPI_OP']?.componente ?? null;
        return null;
    }
}
