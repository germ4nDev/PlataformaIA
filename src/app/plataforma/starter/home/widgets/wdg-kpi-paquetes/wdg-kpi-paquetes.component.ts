import { Component, Input, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { DashboardPlataformaService } from '../../../../../theme/shared/service/dashboard-plataforma.service';

// 🟢 Importamos el nuevo contenedor universal
import { WidgetShellComponent } from 'src/app/theme/shared/components/widget-shell/widget-shell.component';

@Component({
    selector: 'app-wdg-kpi-paquetes',
    standalone: true,
    imports: [CommonModule, WidgetShellComponent], // 🟢 Actualizamos el import
    templateUrl: './wdg-kpi-paquetes.component.html'
})
export class WdgKpiPaquetesComponent implements OnInit, OnDestroy {
    @Input() data: any;

    // 🟢 Agregamos un fallback de seguridad
    @Input() widgetId: string = 'WDG_PLAT_KPI_PAQUETES';

    public isLoading: boolean = true;
    public total: number = 0;
    private dataSub!: Subscription;

    constructor(
        private _dashboardService: DashboardPlataformaService,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit() {
        this.cargarDatos();
    }

    cargarDatos() {
        this.isLoading = true;

        this.dataSub = this._dashboardService.getKpiTotales().subscribe({
            next: (res: any) => {
                this.total = res?.totalPaquetes || 0;
                this.isLoading = false;
                this.cdr.detectChanges();
            },
            error: (err) => {
                console.error('Error KPI Paquetes:', err);
                this.isLoading = false;
                this.cdr.detectChanges();
            }
        });
    }

    ngOnDestroy() {
        if (this.dataSub) this.dataSub.unsubscribe();
    }
}
