/*
    Author: German Valencia
    Component: Contenedores Dashboard (pestaña TLC_CONTENEDORES_001) · Layout Manager común (PestanaGridsterBase)
    Precarga el tablero de ContenedoresService al iniciar y limpia su caché al cambiar de puerto.
*/
import { ChangeDetectorRef, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GridsterComponent, GridsterItemComponent, GridsterConfig } from 'angular-gridster2';
import { LayoutMetadataEngineService } from 'src/app/theme/shared/service/layout-metadata-engine.service';
import { LocalStorageService } from 'src/app/theme/shared/service';
import { ContenedoresService } from 'src/app/theme/shared/service/tablero-control/contenedores.service';
import { PestanaGridsterBase } from '../pestana-gridster/pestana-gridster.base';

@Component({
    selector: 'app-contenedores-dashboard',
    standalone: true,
    imports: [CommonModule, GridsterComponent, GridsterItemComponent],
    templateUrl: '../pestana-gridster/pestana-gridster.component.html',
    styleUrls: ['../pestana-gridster/pestana-gridster.component.scss']
})
export class ContenedoresDashboardComponent extends PestanaGridsterBase {
    readonly pestanaActiva = 'TLC_CONTENEDORES_001';
    readonly nombrePestana = 'Contenedores';
    override readonly iconoVacio = 'feather icon-box';

    constructor(
        layoutEngine: LayoutMetadataEngineService,
        localStorageService: LocalStorageService,
        cdr: ChangeDetectorRef,
        private _contenedoresService: ContenedoresService
    ) {
        super(layoutEngine, localStorageService, cdr);
    }

    protected override titulosDelCatalogo(): boolean {
        return false;
    }

    protected override prefijoId(): string {
        return 'wdg-cont';
    }

    protected override opcionesGridster(): Partial<GridsterConfig> {
        return { outerMarginBottom: 100 };
    }

    protected override alIniciar(): void {
        this._contenedoresService.obtenerDashboardContenedores(this.puerto, true).subscribe();
    }

    protected override alCambiarPuerto(): void {
        this._contenedoresService.limpiarCachePuerto();
    }
}
