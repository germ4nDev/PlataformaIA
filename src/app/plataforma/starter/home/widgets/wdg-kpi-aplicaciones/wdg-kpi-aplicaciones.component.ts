import { Component, Input, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { DashboardPlataformaService } from '../../../../../theme/shared/service/dashboard-plataforma.service';

// 🟢 Importamos el nuevo contenedor universal
import { WidgetShellComponent } from 'src/app/theme/shared/components/widget-shell/widget-shell.component';

@Component({
    selector: 'app-wdg-kpi-aplicaciones',
    standalone: true,
    imports: [CommonModule, WidgetShellComponent], // 🟢 Actualizamos el import
    templateUrl: './wdg-kpi-aplicaciones.component.html'
})
export class WdgKpiAplicacionesComponent implements OnInit, OnDestroy {
    @Input() data: any;

    // 🟢 Agregamos un fallback por si Angular tarda en resolver el Input
    @Input() widgetId: string = 'WDG_PLAT_KPI_APLICACIONES';

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
        this.isLoading = true; // Por si hace refresh

        this.dataSub = this._dashboardService.getKpiTotales().subscribe({
            next: (res: any) => {
                this.total = res?.totalAplicaciones || 0;
                this.isLoading = false; // Apagamos el skeleton
                this.cdr.detectChanges();
            },
            error: (err) => {
                console.error('Error KPI Aplicaciones:', err);
                this.isLoading = false; // Apagamos incluso si hay error
                this.cdr.detectChanges();
            }
        });
    }

    ngOnDestroy() {
        if (this.dataSub) this.dataSub.unsubscribe();
    }
}
