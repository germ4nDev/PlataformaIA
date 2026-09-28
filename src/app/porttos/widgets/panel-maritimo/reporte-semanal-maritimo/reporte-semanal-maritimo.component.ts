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
    selector: 'app-reporte-semanal-maritimo',
    standalone: true,
    imports: [CommonModule, WidgetShellComponent], // 🟢 Añadimos WidgetShellComponent
    templateUrl: './reporte-semanal-maritimo.component.html',
    styleUrls: ['./reporte-semanal-maritimo.component.scss'], // Corregido a styleUrls
    encapsulation: ViewEncapsulation.None
})
export class ReporteSemanalMaritimoComponent implements OnInit {

    // 🟢 NUEVO ESTÁNDAR: Inputs requeridos por el selector dinámico
    @Input() widgetConfig: any;
    @Input() isEnfoque: boolean = false;
    @Input() mostrarTabla: boolean = false;

    public data: any = {};
    public metricas: any[] = [];

    constructor(private _torreService: DashboardService) { }

    ngOnInit(): void {
        // 🟢 Inicializamos los datos extrayéndolos de widgetConfig de forma centralizada
        if (this.widgetConfig?.data) {
            this.data = this.widgetConfig.data;
            this.metricas = this.data.metricas || [];
        }
    }

    // 🟢 Toggle de enfoque: Abre o cierra el modal
    maximizarDesdeShell() {
        if (this.isEnfoque) {
            this._torreService.cerrarModoEnfoque();
        } else {
            this._torreService.abrirModoEnfoque(this.widgetConfig?.type || 'WDG_PORT_RESUMEN_SEMANAL', this.data);
        }
    }
}
