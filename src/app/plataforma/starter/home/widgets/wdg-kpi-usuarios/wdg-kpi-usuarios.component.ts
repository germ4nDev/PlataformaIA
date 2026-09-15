import { Component, Input, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { DashboardPlataformaService } from '../../../../../theme/shared/service/dashboard-plataforma.service';
import { SocketManagerService } from 'src/app/theme/shared/service';

// 🟢 Importamos el nuevo contenedor universal
import { WidgetShellComponent } from 'src/app/theme/shared/components/widget-shell/widget-shell.component';

@Component({
    selector: 'app-wdg-kpi-usuarios',
    standalone: true,
    imports: [CommonModule, WidgetShellComponent], // 🟢 Actualizamos el import
    templateUrl: './wdg-kpi-usuarios.component.html'
})
export class WdgKpiUsuariosComponent implements OnInit, OnDestroy {
    @Input() data: any;

    // 🟢 Agregamos un fallback de seguridad
    @Input() widgetId: string = 'WDG_PLAT_KPI_USUARIOS';

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
        this.cargarDatos();
    }

    cargarDatos() {
        this.isLoading = true;

        this.dataSub = this._dashboardService.getKpiTotales().subscribe({
            next: (res: any) => {
                this.total = res?.totalUsuarios || 0;
                this.isLoading = false;
                this.cdr.detectChanges();
            },
            error: (err) => {
                console.error('Error KPI Usuarios:', err);
                this.isLoading = false;
                this.cdr.detectChanges();
            }
        });
    }

    ngOnDestroy() {
        if (this.dataSub) this.dataSub.unsubscribe();
        if (this.socketSub) this.socketSub.unsubscribe();
    }
}
