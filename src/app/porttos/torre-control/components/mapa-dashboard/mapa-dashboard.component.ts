import { Component, Input, OnInit, OnChanges, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GridsterConfig, GridsterItem, GridType, GridsterComponent, GridsterItemComponent } from 'angular-gridster2';

import { LayoutMetadataEngineService } from 'src/app/theme/shared/service/layout-metadata-engine.service';
import { WIDGET_MAP } from '../../widget-registry';
import { TableroStateService } from 'src/app/theme/shared/service/tablero-control/tablero-state.service';

@Component({
    selector: 'app-mapa-dashboard',
    standalone: true,
    imports: [CommonModule, GridsterComponent, GridsterItemComponent],
    templateUrl: './mapa-dashboard.component.html',
    styleUrls: ['./mapa-dashboard.component.scss']
})
export class MapaDashboardComponent implements OnInit, OnChanges {
    @Input() puerto!: string;
    @Input() usuarioId!: string;
    @Input() lsWidgets!: any[];

    public options!: GridsterConfig;
    public dashboard: Array<GridsterItem & { type: string, data: any }> = [];

    constructor(
        private layoutEngine: LayoutMetadataEngineService,
        private _stateService: TableroStateService,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit() {
        this.iniciarGridster();
        this.cargarDatos();
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['puerto'] && !changes['puerto'].isFirstChange()) {
            this.cargarDatos();
        }
    }

    async cargarDatos() {
        this.dashboard = await this.layoutEngine.obtenerLayoutBase('TLC_MAPA_001', this.usuarioId, this.lsWidgets);

        // Inyecta datos en vivo usando tu TableroStateService original
        this._stateService.inyectarDatosVivos(this.puerto, this.dashboard);

        this.cdr.detectChanges();
    }

    obtenerComponentePara(codigoWidget: string) {
        return WIDGET_MAP[codigoWidget] ? WIDGET_MAP[codigoWidget].componente : null;
    }

    iniciarGridster() {
        this.options = {
            gridType: GridType.Fit, // 🟢 Configuración especial para el Mapa
            margin: 16, minCols: 12, maxCols: 12,
            draggable: { enabled: false }, resizable: { enabled: false }
        };
    }

    trackByWidget(i: number, w: any) { return w.idClon || w.type; }
}
