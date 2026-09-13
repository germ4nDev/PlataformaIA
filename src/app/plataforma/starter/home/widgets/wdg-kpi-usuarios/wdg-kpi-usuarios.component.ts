import { Component, Input, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { DashboardPlataformaService } from '../../../../../theme/shared/service/dashboard-plataforma.service';
import { SocketManagerService } from 'src/app/theme/shared/service';
import { KpiShellComponent } from 'src/app/theme/shared/components/kpi-shell/kpi-shell.component';

@Component({
    selector: 'app-wdg-kpi-usuarios',
    standalone: true,
    imports: [CommonModule, KpiShellComponent],
    templateUrl: './wdg-kpi-usuarios.component.html'
})
export class WdgKpiUsuariosComponent implements OnInit, OnDestroy {
    @Input() data: any;
    @Input() widgetId: string = '';

    public isLoading: boolean = true;
    public total: number = 0;
    private dataSub!: Subscription;
    private socketSub!: Subscription;

    constructor(
        private _dashboardService: DashboardPlataformaService,
        private _socketManager: SocketManagerService,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit() {
        this.isLoading = true;
        this.cargarDatos();

        // Escucha en tiempo real si tienes el socket configurado
        this.dataSub = this._dashboardService.getKpiTotales().subscribe({
            next: (res: any) => {
                console.log('datos de los kpi', res);

                this.total = res?.totalUsuarios || 0;
                this.isLoading = false; // 🟢 Apagamos el skeleton
                this.cdr.detectChanges();
            },
            error: (err) => {
                console.error('Error KPI Usuarios:', err);
                this.isLoading = false; // 🟢 Apagamos incluso si hay error
                this.cdr.detectChanges();
            }
        });
    }

    cargarDatos() {
        this.dataSub = this._dashboardService.getKpiTotales().subscribe({
            next: (res: any) => {
                this.total = res?.totalUsuarios || 0;
                this.cdr.detectChanges();
            },
            error: (err) => console.error('Error KPI Usuarios:', err)
        });
    }

    ngOnDestroy() {
        if (this.dataSub) this.dataSub.unsubscribe();
        if (this.socketSub) this.socketSub.unsubscribe();
    }
}
