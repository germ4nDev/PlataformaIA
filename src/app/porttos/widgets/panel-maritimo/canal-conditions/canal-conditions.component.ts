/*
    Author: German Valencia
    Pattern: PORTTOS Generic Widget - Condiciones del Canal (Refactorizado con Shell)
*/
import { Component, Input, OnInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardService } from 'src/app/theme/shared/service/tablero-control/dashboard.service';
import { CanalModel } from 'src/app/theme/shared/_helpers/models/tablero-control/canal.model';

// 🟢 Importamos el Shell maestro
import { WidgetShellComponent } from 'src/app/theme/shared/components/widget-shell/widget-shell.component';

@Component({
    selector: 'app-canal-conditions',
    standalone: true,
    imports: [CommonModule, WidgetShellComponent], // 🟢 Añadimos WidgetShellComponent
    templateUrl: './canal-conditions.component.html',
    styleUrls: ['./canal-conditions.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class CanalConditionsComponent implements OnInit {

    // 🟢 NUEVO ESTÁNDAR: Inputs requeridos por el selector dinámico
    @Input() widgetConfig: any;
    @Input() isEnfoque: boolean = false;

    public data: any = {}; // Usamos any o Partial<CanalModel> para manejar la data inyectada

    constructor(private _torreService: DashboardService) { }

    ngOnInit(): void {
        // 🟢 Inicializamos los datos extrayéndolos de widgetConfig
        if (this.widgetConfig?.data) {
            this.data = this.widgetConfig.data;
        }
    }

    // 🟢 Toggle de enfoque: Abre o cierra el modal de forma estandarizada
    maximizarDesdeShell() {
        if (this.isEnfoque) {
            this._torreService.cerrarModoEnfoque();
        } else {
            this._torreService.abrirModoEnfoque(this.widgetConfig?.type || 'WDG_PORT_CANAL', this.data);
        }
    }
}
