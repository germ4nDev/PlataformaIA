import { Component, Input, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { DashboardPlataformaService } from '../../../../../theme/shared/service/dashboard-plataforma.service';
import { KpiShellComponent } from 'src/app/theme/shared/components/kpi-shell/kpi-shell.component';

@Component({
    selector: 'app-wdg-kpi-paquetes',
    standalone: true,
    imports: [CommonModule, KpiShellComponent],
    templateUrl: './wdg-kpi-paquetes.component.html'
})
export class WdgKpiPaquetesComponent implements OnInit, OnDestroy {
    @Input() data: any;
    @Input() widgetId: string = '';

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
                this.isLoading = false; // 🟢 Apagamos el skeleton
                this.cdr.detectChanges();
            },
            error: (err) => {
                console.error('Error KPI Paquetes:', err);
                this.isLoading = false; // 🟢 Apagamos incluso si hay error
                this.cdr.detectChanges();
            }
        });
    }

    ngOnDestroy() {
        if (this.dataSub) this.dataSub.unsubscribe();
    }
}
