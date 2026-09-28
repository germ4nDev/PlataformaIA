/*
    Author: German Valencia
    Pattern: PORTTOS Generic Widget - Gate Alertas (Refactorizado con Shell)
*/
import { Component, Input, OnInit, OnChanges, SimpleChanges, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardService } from 'src/app/theme/shared/service/tablero-control/dashboard.service';

// 🟢 Importamos el Shell maestro
import { WidgetShellComponent } from 'src/app/theme/shared/components/widget-shell/widget-shell.component';

@Component({
    selector: 'app-gate-alertas',
    standalone: true,
    imports: [CommonModule, WidgetShellComponent], // 🟢 Añadimos WidgetShellComponent
    templateUrl: './gate-alertas.component.html',
    styleUrls: ['./gate-alertas.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class GateAlertasComponent implements OnInit, OnChanges {

    // 🟢 NUEVO ESTÁNDAR
    @Input() widgetConfig: any;
    @Input() isEnfoque: boolean = false;
    @Input() mostrarTabla: boolean = false;

    public data: any = {};
    public alertas: any[] = [];

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

        // Si el backend nos inyecta alertas dinámicas, las usamos.
        // Si no, cargamos el mock visual por defecto.
        if (this.data.alertas && this.data.alertas.length > 0) {
            this.alertas = this.data.alertas;
        } else {
            this.alertas = [
                {
                    tipo: 'danger',
                    icono: '🛑',
                    titulo: 'Cola crítica gate TCBUEN',
                    descripcion: '22 camiones esperando - ETA m/v EVERGREEN HARMONY +2h'
                },
                {
                    tipo: 'warning',
                    icono: '⚠️',
                    titulo: 'Camión LMR-013 retenido',
                    descripcion: 'SICE no validado - Naviera MSC - acción manual'
                },
                {
                    tipo: 'info',
                    icono: 'ℹ️',
                    titulo: 'Patio NORTE TCBUEN al 94%',
                    descripcion: 'Reasignando devoluciones MAERSK a BUEN-LOG'
                }
            ];
        }
    }

    maximizarDesdeShell() {
        if (this.isEnfoque) {
            this._torreService.cerrarModoEnfoque();
        } else {
            this._torreService.abrirModoEnfoque(this.widgetConfig?.type || 'WDG_PORT_GATE_ALERTAS', this.data);
        }
    }
}
