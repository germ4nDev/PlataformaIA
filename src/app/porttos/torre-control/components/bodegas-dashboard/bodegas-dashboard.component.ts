/*
    Author: German Valencia
    Component: Bodegas Dashboard (pestaña TLC_BODEGAS_001) · Layout Manager común (PestanaGridsterBase)
    Al cambiar de puerto limpia la caché de BodegasService; los widgets traen sus datos solos.
*/
import { ChangeDetectorRef, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GridsterComponent, GridsterItemComponent } from 'angular-gridster2';
import { LayoutMetadataEngineService } from 'src/app/theme/shared/service/layout-metadata-engine.service';
import { LocalStorageService } from 'src/app/theme/shared/service';
import { BodegasService } from 'src/app/theme/shared/service/tablero-control/bodegas.service';
import { PestanaGridsterBase } from '../pestana-gridster/pestana-gridster.base';

@Component({
    selector: 'app-bodegas-dashboard',
    standalone: true,
    imports: [CommonModule, GridsterComponent, GridsterItemComponent],
    templateUrl: '../pestana-gridster/pestana-gridster.component.html',
    styleUrls: ['../pestana-gridster/pestana-gridster.component.scss']
})
export class BodegasDashboardComponent extends PestanaGridsterBase {
    readonly pestanaActiva = 'TLC_BODEGAS_001';
    readonly nombrePestana = 'Bodegas y Silos';
    override readonly iconoVacio = 'feather icon-package';

    constructor(
        layoutEngine: LayoutMetadataEngineService,
        localStorageService: LocalStorageService,
        cdr: ChangeDetectorRef,
        private _bodegasService: BodegasService
    ) {
        super(layoutEngine, localStorageService, cdr);
    }

    protected override prefijoId(): string {
        return 'wdg-bod';
    }

    protected override alCambiarPuerto(): void {
        this._bodegasService.limpiarCachePuerto();
    }
}
