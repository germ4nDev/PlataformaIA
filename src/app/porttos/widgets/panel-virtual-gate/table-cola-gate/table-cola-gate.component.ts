/*
    Author: German Valencia
    Pattern: PORTTOS Generic Widget - Cola Gate (Refactorizado con Shell)
*/
import { Component, Input, OnInit, OnChanges, SimpleChanges, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardService } from 'src/app/theme/shared/service/tablero-control/dashboard.service';

// 🟢 Importamos el Shell maestro
import { WidgetShellComponent } from 'src/app/theme/shared/components/widget-shell/widget-shell.component';

@Component({
    selector: 'app-table-cola-gate',
    standalone: true,
    imports: [CommonModule, WidgetShellComponent], // 🟢 Añadimos WidgetShellComponent
    templateUrl: './table-cola-gate.component.html',
    styleUrls: ['./table-cola-gate.component.scss'], // Corregido a styleUrls
    encapsulation: ViewEncapsulation.None
})
export class TableColaGateComponent implements OnInit, OnChanges {

    // 🟢 NUEVO ESTÁNDAR
    @Input() widgetConfig: any;
    @Input() isEnfoque: boolean = false;
    @Input() mostrarTabla: boolean = false;

    public data: any = {};

    constructor(private _torreService: DashboardService) { }

    ngOnInit(): void {
        this.procesarData();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['widgetConfig']) {
            this.procesarData();
        }
    }

    private procesarData() {
        this.data = this.widgetConfig?.data || {};
    }

    // 🟢 Helper para pintar dinámicamente los badges de estado desde SCSS
    getEstadoClase(estado: string): string {
        const est = (estado || '').toUpperCase();
        switch (est) {
            case 'VALIDADO': return 'estado-success';
            case 'EN OPERACIÓN': return 'estado-primary';
            case 'DOC. FALTANTE': return 'estado-warning';
            case 'RETENIDO': return 'estado-danger';
            case 'EN RUTA': return 'estado-purple';
            default: return 'estado-secondary';
        }
    }

    maximizarDesdeShell() {
        if (this.isEnfoque) {
            this._torreService.cerrarModoEnfoque();
        } else {
            this._torreService.abrirModoEnfoque(this.widgetConfig?.type || 'WDG_PORT_COLA_GATE', this.data);
        }
    }
}
