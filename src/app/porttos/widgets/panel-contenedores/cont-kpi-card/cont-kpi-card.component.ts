/*
    Author: German Valencia
    Pattern: PORTTOS Generic Widget - KPI Card (Refactorizado con Shell)
*/
import { Component, Input, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardService } from 'src/app/theme/shared/service/tablero-control/dashboard.service';
import { FiltroTableroService } from 'src/app/theme/shared/service/tablero-control/filtro-tablero.service';

// 🟢 Importamos el Shell maestro
import { WidgetShellComponent } from 'src/app/theme/shared/components/widget-shell/widget-shell.component';

@Component({
    selector: 'app-cont-kpi-card',
    standalone: true,
    imports: [CommonModule, WidgetShellComponent], // 🟢 Añadimos WidgetShellComponent
    templateUrl: './cont-kpi-card.component.html',
    styleUrls: ['./cont-kpi-card.component.scss'] // 🟢 Corregido a styleUrls
})
export class ContKpiCardComponent implements OnInit {

    // 🟢 NUEVO ESTÁNDAR: Inputs requeridos por el selector dinámico
    @Input() widgetConfig: any;
    @Input() isEnfoque: boolean = false;

    public titulo: string = 'KPI';
    public valor: string | number = '0';
    public subtitulo: string = '';
    public colorBorde: string = '';

    constructor(
        private cdr: ChangeDetectorRef,
        private filtroService: FiltroTableroService,
        private _torreService: DashboardService
    ) { }

    ngOnInit(): void {
        // 🟢 Extraemos la data inyectada desde la configuración del selector
        if (this.widgetConfig?.data) {
            this.titulo = this.widgetConfig.data.titulo || this.titulo;
            this.valor = this.widgetConfig.data.valor || this.valor;
            this.subtitulo = this.widgetConfig.data.subtitulo || this.subtitulo;
            this.colorBorde = this.widgetConfig.data.colorBorde || '';
        }

        this.filtroService.ciudad$.subscribe((ciudad) => {
            if (ciudad) {
                // this.actualizarDatos(ciudad);
            }
        });
    }

    // 🟢 Toggle de enfoque: Abre o cierra el modal
    maximizarDesdeShell() {
        if (this.isEnfoque) {
            this._torreService.cerrarModoEnfoque();
        } else {
            this._torreService.abrirModoEnfoque(this.widgetConfig?.type || 'WDG_PORT_KPI', this.widgetConfig?.data);
        }
    }
}
