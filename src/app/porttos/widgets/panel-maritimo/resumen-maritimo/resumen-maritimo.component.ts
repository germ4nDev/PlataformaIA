/*
    Author: German Valencia
    Pattern: PORTTOS Generic Widget - Resumen Semanal Marítimo (Refactorizado con Shell)
*/
import { Component, Input, OnInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardService } from 'src/app/theme/shared/service/tablero-control/dashboard.service';

// 🟢 Importamos el Shell maestro
import { WidgetShellComponent } from 'src/app/theme/shared/components/widget-shell/widget-shell.component';

@Component({
    selector: 'app-resumen-maritimo',
    standalone: true,
    imports: [CommonModule, WidgetShellComponent], // 🟢 Añadimos WidgetShellComponent
    templateUrl: './resumen-maritimo.component.html',
    styleUrls: ['./resumen-maritimo.component.scss'], // Corregido a styleUrls
    encapsulation: ViewEncapsulation.None
})
export class ResumenMaritimoComponent implements OnInit {

    // 🟢 NUEVO ESTÁNDAR: Inputs requeridos por el selector dinámico
    @Input() widgetConfig: any;
    @Input() isEnfoque: boolean = false;
    @Input() mostrarTabla: boolean = false;

    public data: any = {};

    constructor(private _torreService: DashboardService) { }

    ngOnInit(): void {
        // 🟢 Inicializamos extrayendo del objeto central
        if (this.widgetConfig?.data) {
            this.data = this.widgetConfig.data;
        }
    }

    // 🟢 Toggle de enfoque: Abre o cierra el modal
    maximizarDesdeShell() {
        if (this.isEnfoque) {
            this._torreService.cerrarModoEnfoque();
        } else {
            this._torreService.abrirModoEnfoque(this.widgetConfig?.type || 'WDG_PORT_RESUMEN_MARITIMO_ALT', this.data);
        }
    }
}
