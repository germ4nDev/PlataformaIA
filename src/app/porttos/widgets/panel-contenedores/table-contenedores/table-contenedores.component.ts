/*
    Author: German Valencia
    Pattern: PORTTOS Generic Widget - Tabla Contenedores (Refactorizado con Shell)
*/
import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardService } from 'src/app/theme/shared/service/tablero-control/dashboard.service';

// 🟢 Importamos el Shell maestro
import { WidgetShellComponent } from 'src/app/theme/shared/components/widget-shell/widget-shell.component';

@Component({
    selector: 'app-table-contenedores',
    standalone: true,
    imports: [CommonModule, WidgetShellComponent], // 🟢 Añadimos WidgetShellComponent
    templateUrl: './table-contenedores.component.html',
    styleUrls: ['./table-contenedores.component.scss']
})
export class TableContenedoresComponent implements OnInit {

    // 🟢 NUEVO ESTÁNDAR: Inputs requeridos por el selector dinámico
    @Input() widgetConfig: any;
    @Input() isEnfoque: boolean = false;

    public movimientos: any[] = [];

    constructor(private _torreService: DashboardService) { }

    ngOnInit(): void {
        // 🟢 Inicializamos los datos extrayéndolos de widgetConfig
        if (this.widgetConfig?.data) {
            const data = this.widgetConfig.data;
            if (Array.isArray(data)) {
                this.movimientos = data;
            } else if (data.movimientos && Array.isArray(data.movimientos)) {
                this.movimientos = data.movimientos;
            }
        }
    }

    // 🟢 Actualizamos las clases para que encajen mejor con el modo oscuro
    getEstadoClase(estado: string): string {
        if (!estado) return 'bg-secondary bg-opacity-25 text-light border border-secondary';

        const est = estado.toLowerCase();

        // Verde: Operaciones en orden
        if (est.includes('programado')) {
            return 'bg-success text-white border-success';
        }
        // Rojo: Problemas o alertas
        else if (est.includes('demora') || est.includes('lleno')) {
            return 'bg-danger text-white border-danger';
        }
        // Azul claro: Tránsitos y esperas
        else if (est.includes('ruta') || est.includes('esperando')) {
            return 'bg-info text-dark border-info';
        }

        return 'bg-secondary bg-opacity-25 text-light border border-secondary';
    }

    // 🟢 Toggle de enfoque: Abre o cierra el modal
    maximizarDesdeShell() {
        if (this.isEnfoque) {
            this._torreService.cerrarModoEnfoque();
        } else {
            this._torreService.abrirModoEnfoque(this.widgetConfig?.type || 'WDG_PORT_TABLE_CONT', this.widgetConfig?.data);
        }
    }
}
