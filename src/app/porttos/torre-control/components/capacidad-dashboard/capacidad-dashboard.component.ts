/*
    Author: German Valencia
    Component: Capacidad Dashboard (pestaña TLC_CAPACIDAD_001) · Layout Manager común (PestanaGridsterBase)
    Los widgets se registran en widget-registry.ts y traen sus datos solos (TablerosPestanasService).
*/
import { ChangeDetectorRef, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GridsterComponent, GridsterItemComponent } from 'angular-gridster2';
import { LayoutMetadataEngineService } from 'src/app/theme/shared/service/layout-metadata-engine.service';
import { LocalStorageService } from 'src/app/theme/shared/service';
import { PestanaGridsterBase } from '../pestana-gridster/pestana-gridster.base';

@Component({
    selector: 'app-capacidad-dashboard',
    standalone: true,
    imports: [CommonModule, GridsterComponent, GridsterItemComponent],
    templateUrl: '../pestana-gridster/pestana-gridster.component.html',
    styleUrls: ['../pestana-gridster/pestana-gridster.component.scss']
})
export class CapacidadDashboardComponent extends PestanaGridsterBase {
    readonly pestanaActiva = 'TLC_CAPACIDAD_001';
    readonly nombrePestana = 'Capacidad';
    override readonly iconoVacio = 'feather icon-grid';

    constructor(layoutEngine: LayoutMetadataEngineService, localStorageService: LocalStorageService, cdr: ChangeDetectorRef) {
        super(layoutEngine, localStorageService, cdr);
    }
}
