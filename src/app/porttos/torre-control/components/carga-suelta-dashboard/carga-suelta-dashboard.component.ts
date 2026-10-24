/*
    Author: German Valencia
    Component: Carga suelta y vehículos Dashboard (pestaña TLC_SUELTA_001) · Layout Manager común (PestanaGridsterBase)
    Los widgets se registran en widget-registry.ts y traen sus datos solos (TablerosPestanasService).
*/
import { ChangeDetectorRef, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GridsterComponent, GridsterItemComponent } from 'angular-gridster2';
import { LayoutMetadataEngineService } from 'src/app/theme/shared/service/layout-metadata-engine.service';
import { LocalStorageService } from 'src/app/theme/shared/service';
import { PestanaGridsterBase } from '../pestana-gridster/pestana-gridster.base';

@Component({
    selector: 'app-carga-suelta-dashboard',
    standalone: true,
    imports: [CommonModule, GridsterComponent, GridsterItemComponent],
    templateUrl: '../pestana-gridster/pestana-gridster.component.html',
    styleUrls: ['../pestana-gridster/pestana-gridster.component.scss']
})
export class CargaSueltaDashboardComponent extends PestanaGridsterBase {
    readonly pestanaActiva = 'TLC_SUELTA_001';
    readonly nombrePestana = 'Carga suelta y vehículos';
    override readonly iconoVacio = 'feather icon-truck';

    constructor(layoutEngine: LayoutMetadataEngineService, localStorageService: LocalStorageService, cdr: ChangeDetectorRef) {
        super(layoutEngine, localStorageService, cdr);
    }
}
