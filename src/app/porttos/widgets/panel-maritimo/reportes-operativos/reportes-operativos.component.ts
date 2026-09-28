/*
    Author: German Valencia
    Pattern: PORTTOS Generic Widget - Reportes Operativos (Refactorizado con Shell)
*/
import { Component, Input, OnInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardService } from 'src/app/theme/shared/service/tablero-control/dashboard.service';

// 🟢 Importamos el Shell maestro
import { WidgetShellComponent } from 'src/app/theme/shared/components/widget-shell/widget-shell.component';

@Component({
    selector: 'app-reportes-operativos',
    standalone: true,
    imports: [CommonModule, WidgetShellComponent], // 🟢 Añadimos WidgetShellComponent
    templateUrl: './reportes-operativos.component.html',
    styleUrls: ['./reportes-operativos.component.scss'], // Corregido a styleUrls
    encapsulation: ViewEncapsulation.None
})
export class ReportesOperativosComponent implements OnInit {

    // 🟢 NUEVO ESTÁNDAR: Inputs requeridos por el selector dinámico
    @Input() widgetConfig: any;
    @Input() isEnfoque: boolean = false;
    @Input() mostrarTabla: boolean = false;

    public data: any = {};

    constructor(private _torreService: DashboardService) { }

    ngOnInit(): void {
        // 🟢 Inicializamos los datos extrayéndolos de widgetConfig
        if (this.widgetConfig?.data) {
            this.data = this.widgetConfig.data;
        }
    }

    // 🟢 Toggle de enfoque: Abre o cierra el modal
    maximizarDesdeShell() {
        if (this.isEnfoque) {
            this._torreService.cerrarModoEnfoque();
        } else {
            this._torreService.abrirModoEnfoque(this.widgetConfig?.type || 'WDG_PORT_REPORTES', this.data);
        }
    }
}
