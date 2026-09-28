/*
    Author: German Valencia
    Pattern: PORTTOS Generic Widget - KPI Card (Refactorizado con Shell)
*/
import { Component, Input, OnInit, OnChanges, SimpleChanges, ViewEncapsulation, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardService } from 'src/app/theme/shared/service/tablero-control/dashboard.service';

// 🟢 Importamos el Shell maestro
import { WidgetShellComponent } from 'src/app/theme/shared/components/widget-shell/widget-shell.component';
import { KpiShellComponent } from 'src/app/theme/shared/components/kpi-shell/kpi-shell.component';
import { KpiCardModel } from 'src/app/theme/shared/_helpers/models/tablero-control/kpi-card.model';
import { FiltroTableroService } from 'src/app/theme/shared/service/tablero-control/filtro-tablero.service';

@Component({
    selector: 'app-gate-kpi-card',
    standalone: true,
    imports: [CommonModule, WidgetShellComponent, KpiShellComponent],
    templateUrl: './gate-kpi-card.component.html',
    styleUrls: ['./gate-kpi-card.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class GateKpiCardComponent implements OnInit, OnChanges {
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
        this.procesarData();

        // Suscripción al filtro de ciudad
        this.filtroService.ciudad$.subscribe((ciudad) => {
            if (ciudad) {
                this.actualizarDatos(ciudad);
            }
        });
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['widgetConfig'] && !changes['widgetConfig'].firstChange) {
            this.procesarData();
        }
    }

    private procesarData(): void {
        console.log('data del los kpi', this.widgetConfig);

        if (this.widgetConfig?.data) {
            this.data = this.widgetConfig.data;
        }
    }

    private actualizarDatos(ciudad: string): void {
        this.isLoading = true;
        // Lógica de actualización hacia el backend/adaptador.
        // Al resolver: this.isLoading = false;
    }

    // 🟢 Toggle de enfoque: Abre o cierra el modal
    maximizarDesdeShell(): void {
        if (this.isEnfoque) {
            this._torreService.cerrarModoEnfoque();
        } else {
            this._torreService.abrirModoEnfoque(this.widgetConfig?.type || 'WDG_PORT_KPI_MAIN', this.data);
        }
    }
}
