/*
    Author: German Valencia
    Component: TerminalCardComponent
    Pattern: PORTTOS Generic Widget - Terminal Card (Refactorizado con Shell)
*/
import { Component, Input, OnInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardService } from 'src/app/theme/shared/service/tablero-control/dashboard.service';

// 🟢 Importamos el Shell maestro
import { WidgetShellComponent } from 'src/app/theme/shared/components/widget-shell/widget-shell.component';

@Component({
    selector: 'app-terminal-card',
    standalone: true,
    imports: [CommonModule, WidgetShellComponent], // 🟢 Añadimos WidgetShellComponent
    templateUrl: './terminal-card.component.html',
    styleUrls: ['./terminal-card.component.scss'], // Corregido a styleUrls
    encapsulation: ViewEncapsulation.None
})
export class TerminalCardComponent implements OnInit {

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

    // 🟢 Helper para pintar dinámicamente el badge de estado
    getEstadoClase(estado: string): string {
        const est = (estado || '').toLowerCase();
        if (est.includes('operativo') || est.includes('normal')) return 'badge-success';
        if (est.includes('alerta') || est.includes('demora')) return 'badge-warning';
        if (est.includes('crítico') || est.includes('cerrado')) return 'badge-danger';
        return 'badge-info';
    }

    // 🟢 Toggle de enfoque: Abre o cierra el modal
    maximizarDesdeShell() {
        if (this.isEnfoque) {
            this._torreService.cerrarModoEnfoque();
        } else {
            this._torreService.abrirModoEnfoque(this.widgetConfig?.type || 'WDG_PORT_TERMINAL', this.data);
        }
    }
}
