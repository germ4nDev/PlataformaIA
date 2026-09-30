/*
    Author: German Valencia
    Pattern: PORTTOS Generic Widget - Vessel Table (Refactorizado con Shell)
*/
import { Component, Input, HostBinding, OnInit, OnChanges, SimpleChanges, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardService } from 'src/app/theme/shared/service/tablero-control/dashboard.service';
import { VesselTableModel } from 'src/app/theme/shared/_helpers/models/tablero-control/vessel-table.model';

// 🟢 Importamos el Shell maestro
import { WidgetShellComponent } from 'src/app/theme/shared/components/widget-shell/widget-shell.component';

@Component({
    selector: 'app-vessel-table',
    standalone: true,
    imports: [CommonModule, WidgetShellComponent], // 🟢 Añadimos WidgetShellComponent
    templateUrl: './vessel-table.component.html',
    styleUrls: ['./vessel-table.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class VesselTableComponent implements OnInit, OnChanges {

    // 🟢 NUEVO ESTÁNDAR
    @Input() widgetConfig: any;
    @Input() isEnfoque: boolean = false;
    @Input() mostrarTabla: boolean = false;

    public data: Partial<VesselTableModel> = {};

    // Mantenemos la lógica de expansión de columnas adaptada al widgetConfig
    @HostBinding('class') get hostClass() {
        return `col-span-${this.widgetConfig?.colspan || 2}`;
    }

    constructor(private _torreService: DashboardService) { }

    ngOnInit(): void {
        if (this.widgetConfig?.data) {
            this.data = this.widgetConfig.data;
        }
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['widgetConfig'] && !changes['widgetConfig'].firstChange) {
            this.data = this.widgetConfig?.data || {};
        }
    }

    // 🟢 Toggle de enfoque: Abre o cierra el modal
    maximizarDesdeShell() {
        if (this.isEnfoque) {
            this._torreService.cerrarModoEnfoque();
        } else {
            this._torreService.abrirModoEnfoque(this.widgetConfig?.type || 'WDG_PORT_VESSEL_TABLE', this.data);
        }
    }
}
