/*
    Author: German Valencia
    Component: Mapa Logístico Dashboard (pestaña TLC_MAPA_001) · Layout Manager común (PestanaGridsterBase)
    El layout del mapa no depende del puerto: al cambiarlo se actualiza en sitio, sin destruir el mapa (destruirlo
    causaba un parpadeo antes del vuelo de cámara). El mapa hace su propia transición.
*/
import { ChangeDetectorRef, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GridsterComponent, GridsterConfig, GridsterItemComponent, GridType } from 'angular-gridster2';
import { LayoutMetadataEngineService } from 'src/app/theme/shared/service/layout-metadata-engine.service';
import { LocalStorageService } from 'src/app/theme/shared/service';
import { PestanaGridsterBase } from '../pestana-gridster/pestana-gridster.base';

@Component({
    selector: 'app-mapa-dashboard',
    standalone: true,
    imports: [CommonModule, GridsterComponent, GridsterItemComponent],
    templateUrl: '../pestana-gridster/pestana-gridster.component.html',
    styleUrls: ['../pestana-gridster/pestana-gridster.component.scss']
})
export class MapaDashboardComponent extends PestanaGridsterBase {
    readonly pestanaActiva = 'TLC_MAPA_001';
    readonly nombrePestana = 'Mapa Logístico';
    override readonly iconoVacio = 'feather icon-map';

    constructor(
        layoutEngine: LayoutMetadataEngineService,
        localStorageService: LocalStorageService,
        cdr: ChangeDetectorRef
    ) {
        super(layoutEngine, localStorageService, cdr);
    }

    protected override titulosDelCatalogo(): boolean {
        return false;
    }

    protected override prefijoId(): string {
        return 'wdg-mapa';
    }

    /**
     * El mapa ocupa el alto disponible de la pestaña sin scroll: la cuadrícula se ajusta al contenedor (Fit),
     * sin fila vacía de reserva y con el mismo margen abajo que a los lados.
     */
    protected override opcionesGridster(): Partial<GridsterConfig> {
        return { gridType: GridType.Fit, addEmptyRowsCount: 0, outerMarginBottom: 12, keepFixedHeightInMobile: false };
    }

    /**
     * Cambio de puerto sin reconstruir el tablero: cada widget conserva su instancia y recibe el puerto nuevo
     * por su input widgetConfig (ngComponentOutlet llama a ngOnChanges). Se muta el item para que gridster y
     * el trackBy conserven la misma tarjeta. Si aún no hay tablero, la base lo arma.
     */
    protected override alCambiarPuerto(): boolean {
        if (!this.dashboard.length) return false;
        const puerto = this.puertoNormalizado;
        this.dashboard.forEach((w) => {
            w.componenteInputs = { widgetConfig: { ...(w.componenteInputs?.widgetConfig || {}), puerto } };
        });
        const layoutActual = this.dashboard.map(({ componenteTarget, componenteInputs, ...resto }) => resto);
        this.localStorageService.guardarLayoutPestanaEnSesion(`${this.pestanaActiva}_${puerto}`, layoutActual);
        this.cdr.detectChanges();
        return true;
    }
}
