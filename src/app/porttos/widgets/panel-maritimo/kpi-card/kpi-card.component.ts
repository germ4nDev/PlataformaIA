/*
    Author: German Valencia
    Pattern: PORTTOS Generic Widget - KPI Card Inteligente (Refactorizado con Shell)
*/
import { Component, Input, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardService } from 'src/app/theme/shared/service/tablero-control/dashboard.service';
import { FiltroTableroService } from 'src/app/theme/shared/service/tablero-control/filtro-tablero.service';
import { KpiCardModel } from 'src/app/theme/shared/_helpers/models/tablero-control/kpi-card.model';

// 🟢 Importamos el Shell maestro
import { WidgetShellComponent } from 'src/app/theme/shared/components/widget-shell/widget-shell.component';

@Component({
    selector: 'app-kpi-card',
    standalone: true,
    imports: [CommonModule, WidgetShellComponent], // 🟢 Añadimos WidgetShellComponent
    templateUrl: './kpi-card.component.html',
    styleUrls: ['./kpi-card.component.scss']
})
export class KpiCardComponent implements OnInit {

    // 🟢 NUEVO ESTÁNDAR: Inputs requeridos por el selector dinámico
    @Input() widgetConfig: any;
    @Input() isEnfoque: boolean = false;
    @Input() mostrarTabla: boolean = false;

    public data: Partial<KpiCardModel> = {};
    public isLoading: boolean = false;

    constructor(
        private cdr: ChangeDetectorRef,
        private filtroService: FiltroTableroService,
        private _torreService: DashboardService
    ) { }

    ngOnInit(): void {
        // 🟢 Inicializamos extrayendo del objeto central
        if (this.widgetConfig?.data) {
            this.data = this.widgetConfig.data;
        }

        // Suscripción al filtro de ciudad
        this.filtroService.ciudad$.subscribe((ciudad) => {
            if (ciudad) {
                this.actualizarDatos(ciudad);
            }
        });
    }

    private actualizarDatos(ciudad: string): void {
        this.isLoading = true;
        // Aquí iría tu lógica de actualización hacia el backend/adaptador.
        // Al resolver, recuerdas setear this.isLoading = false;
    }

    // 🟢 Toggle de enfoque: Abre o cierra el modal
    maximizarDesdeShell() {
        if (this.isEnfoque) {
            this._torreService.cerrarModoEnfoque();
        } else {
            this._torreService.abrirModoEnfoque(this.widgetConfig?.type || 'WDG_PORT_KPI_MAIN', this.data);
        }
    }
}
