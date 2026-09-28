/*
    Author: German Valencia
    Pattern: PORTTOS Generic Widget - Pre-Gate Validación (Refactorizado con Shell)
*/
import { Component, Input, OnInit, OnChanges, SimpleChanges, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardService } from 'src/app/theme/shared/service/tablero-control/dashboard.service';

// 🟢 Importamos el Shell maestro
import { WidgetShellComponent } from 'src/app/theme/shared/components/widget-shell/widget-shell.component';

@Component({
    selector: 'app-gate-validacion',
    standalone: true,
    imports: [CommonModule, WidgetShellComponent], // 🟢 Añadimos WidgetShellComponent
    templateUrl: './gate-validacion.component.html',
    styleUrls: ['./gate-validacion.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class GateValidacionComponent implements OnInit, OnChanges {

    // 🟢 NUEVO ESTÁNDAR
    @Input() widgetConfig: any;
    @Input() isEnfoque: boolean = false;
    @Input() mostrarTabla: boolean = false;

    public data: any = {};
    public resumen: any = { validados: 0, enCola: 0, retenidos: 0 };

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
        // Extraemos los indicadores directamente para tener valores seguros en el HTML
        this.resumen = this.data?.resumen || { validados: 0, enCola: 0, retenidos: 0 };
    }

    maximizarDesdeShell() {
        if (this.isEnfoque) {
            this._torreService.cerrarModoEnfoque();
        } else {
            this._torreService.abrirModoEnfoque(this.widgetConfig?.type || 'WDG_PORT_GATE_VALIDACION', this.data);
        }
    }
}
