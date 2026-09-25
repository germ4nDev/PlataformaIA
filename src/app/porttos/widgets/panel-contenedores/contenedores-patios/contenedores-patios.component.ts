/*
    Author: German Valencia
    Pattern: PORTTOS Generic Widget - Saturación de Patios (Refactorizado con Shell)
*/
import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardService } from 'src/app/theme/shared/service/tablero-control/dashboard.service';

// 🟢 Importamos el Shell maestro
import { WidgetShellComponent } from 'src/app/theme/shared/components/widget-shell/widget-shell.component';

@Component({
    selector: 'app-contenedores-patios',
    standalone: true,
    imports: [CommonModule, WidgetShellComponent], // 🟢 Añadimos WidgetShellComponent
    templateUrl: './contenedores-patios.component.html',
    styleUrls: ['./contenedores-patios.component.scss']
})
export class ContenedoresPatiosComponent implements OnInit {

    // 🟢 NUEVO ESTÁNDAR: Inputs requeridos por el selector dinámico
    @Input() widgetConfig: any;
    @Input() isEnfoque: boolean = false;

    public listadoPatios: any[] = [];

    constructor(private _torreService: DashboardService) { }

    ngOnInit(): void {
        // 🟢 Inicializamos los datos extrayéndolos de widgetConfig
        if (this.widgetConfig?.data) {
            const data = this.widgetConfig.data;
            if (Array.isArray(data)) {
                this.listadoPatios = data;
            } else if (data.saturacionPatios && Array.isArray(data.saturacionPatios)) {
                this.listadoPatios = data.saturacionPatios;
            }
        }
    }

    getColorBarra(porcentaje: number): string {
        if (porcentaje >= 90) return '#ef4444'; // Rojo (Crítico)
        if (porcentaje >= 75) return '#f59e0b'; // Naranja (Alto)
        return '#10b981'; // Verde (Normal - Actualizado a un tono más moderno)
    }

    getEstadoBadge(estado: string): string {
        switch (estado?.toUpperCase()) {
            case 'CRÍTICO': return 'bg-danger text-white border-danger';
            case 'ALTO': return 'bg-warning text-dark border-warning';
            default: return 'bg-success text-white border-success';
        }
    }

    // 🟢 Toggle de enfoque: Abre o cierra el modal
    maximizarDesdeShell() {
        if (this.isEnfoque) {
            this._torreService.cerrarModoEnfoque();
        } else {
            this._torreService.abrirModoEnfoque(this.widgetConfig?.type || 'WDG_PORT_PATIOS', this.widgetConfig?.data);
        }
    }
}
