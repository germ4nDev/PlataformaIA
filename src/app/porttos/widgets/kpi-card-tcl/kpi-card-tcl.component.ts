/* eslint-disable @typescript-eslint/no-explicit-any */
/*
    Author: German Valencia
    Pattern: PORTTOS Generic Widget - KPI Card Inteligente (Refactorizado con KpiShell)
*/
import { Component, Input, OnInit, OnChanges, SimpleChanges, ChangeDetectorRef, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardService } from 'src/app/theme/shared/service/tablero-control/dashboard.service';
import { FiltroTableroService } from 'src/app/theme/shared/service/tablero-control/filtro-tablero.service';
import { KpiCardModel } from 'src/app/theme/shared/_helpers/models/tablero-control/kpi-card.model';

// 🟢 Importamos el nuevo Shell especializado para KPIs
import { KpiShellComponent } from 'src/app/theme/shared/components/kpi-shell/kpi-shell.component';
import { KpiFormatPipe } from '../../../theme/shared/pipes/kpi-format.pipe';

@Component({
    selector: 'app-kpi-card-tcl',
    standalone: true,
    imports: [CommonModule, KpiShellComponent, KpiFormatPipe],
    templateUrl: './kpi-card-tcl.component.html',
    styleUrl: './kpi-card-tcl.component.scss'
})
export class KpiCardTclComponent implements OnInit, OnChanges {
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
        this.isLoading = false;
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
