/*
    Author: German Valencia
    Pattern: PORTTOS Generic Widget - Estado de Citas (Refactorizado con Shell)
*/
import { Component, Input, OnInit, OnChanges, SimpleChanges, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardService } from 'src/app/theme/shared/service/tablero-control/dashboard.service';

// 🟢 Importamos el Shell maestro
import { WidgetShellComponent } from 'src/app/theme/shared/components/widget-shell/widget-shell.component';

@Component({
    selector: 'app-gate-estado-citas',
    standalone: true,
    imports: [CommonModule, WidgetShellComponent], // 🟢 Añadimos WidgetShellComponent
    templateUrl: './gate-estado-citas.component.html',
    styleUrls: ['./gate-estado-citas.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class GateEstadoCitasComponent implements OnInit, OnChanges {

    // 🟢 NUEVO ESTÁNDAR
    @Input() widgetConfig: any;
    @Input() isEnfoque: boolean = false;
    @Input() mostrarTabla: boolean = false;

    public data: any = {};
    public barrasProgreso: any[] = [];

    constructor(private _torreService: DashboardService) { }

    ngOnInit(): void {
        this.procesarData(this.widgetConfig?.data);
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['widgetConfig'] && !changes['widgetConfig'].firstChange) {
            this.procesarData(this.widgetConfig?.data);
        } else if (changes['data'] && !changes['data'].firstChange) {
            this.procesarData(changes['data'].currentValue);
        }
    }

    private procesarData(newData: any) {
        this.data = newData || {};

        // 🟢 Si el backend nos inyecta el array de citas, lo usamos.
        // Si no, cargamos el mock visual por defecto que tenías en tu HTML.
        if (this.data.citas && this.data.citas.length > 0) {
            this.barrasProgreso = this.data.citas;
        } else {
            this.barrasProgreso = [
                { label: 'Confirmadas', value: 312, percent: 68, colorClass: 'bg-success' },
                { label: 'En espera', value: 98, percent: 22, colorClass: 'bg-info' },
                { label: 'Reagendadas', value: 34, percent: 8, colorClass: 'bg-warning' },
                { label: 'Canceladas', value: 14, percent: 3, colorClass: 'bg-danger' }
            ];
        }
    }

    maximizarDesdeShell() {
        if (this.isEnfoque) {
            this._torreService.cerrarModoEnfoque();
        } else {
            this._torreService.abrirModoEnfoque(this.widgetConfig?.type || 'WDG_PORT_ESTADO_CITAS', this.data);
        }
    }
}
