import { Component, Input, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { DashboardPlataformaService } from '../../../../../theme/shared/service/dashboard-plataforma.service';
import { WidgetShellComponent } from 'src/app/theme/shared/components/widget-shell/widget-shell.component';

@Component({
    selector: 'app-wdg-kpi-suscriptores',
    standalone: true,
    imports: [CommonModule, WidgetShellComponent],
    templateUrl: './wdg-kpi-suscriptores.component.html',
    styleUrls: ['./wdg-kpi-suscriptores.component.scss']
})
export class WdgKpiSuscriptoresComponent implements OnInit, OnDestroy {

    @Input() widgetConfig: any;
    @Input() isEnfoque: boolean = false;

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
                this.total = res?.totalSuscriptores || 0;
                this.isLoading = false;
                this.cdr.detectChanges();
            },
            error: (err) => {
                console.error('Error KPI Suscriptores:', err);
                this.isLoading = false;
                this.cdr.detectChanges();
            }
        });
    }

    maximizarDesdeShell() {
        if (typeof (this._dashboardService as any).abrirModoEnfoque === 'function') {
            (this._dashboardService as any).abrirModoEnfoque(this.widgetConfig?.type || 'WDG_PLAT_KPI_SUSCRIPTORES', { total: this.total });
        }
    }

    ngOnDestroy() {
        if (this.dataSub) this.dataSub.unsubscribe();
    }
}
