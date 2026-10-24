/*
    Author: German Valencia
    Component: Noticias Dashboard (pestaña TLC_NOTICIAS) · Layout Manager común (PestanaGridsterBase)
    Los widgets se registran en widget-registry.ts y traen sus datos solos (TablerosPestanasService).
*/
import { ChangeDetectorRef, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GridsterComponent, GridsterItemComponent } from 'angular-gridster2';
import { LayoutMetadataEngineService } from 'src/app/theme/shared/service/layout-metadata-engine.service';
import { LocalStorageService } from 'src/app/theme/shared/service';
import { PestanaGridsterBase } from '../pestana-gridster/pestana-gridster.base';

@Component({
    selector: 'app-noticias-dashboard',
    standalone: true,
    imports: [CommonModule, GridsterComponent, GridsterItemComponent],
    templateUrl: '../pestana-gridster/pestana-gridster.component.html',
    styleUrls: ['../pestana-gridster/pestana-gridster.component.scss']
})
export class NoticiasDashboardComponent extends PestanaGridsterBase {
    readonly pestanaActiva = 'TLC_NOTICIAS';
    readonly nombrePestana = 'Noticias';
    override readonly iconoVacio = 'feather icon-file-text';

    constructor(layoutEngine: LayoutMetadataEngineService, localStorageService: LocalStorageService, cdr: ChangeDetectorRef) {
        super(layoutEngine, localStorageService, cdr);
    }
}
