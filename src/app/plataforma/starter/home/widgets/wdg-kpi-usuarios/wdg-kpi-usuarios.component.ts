import { Component, Input, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { DashboardPlataformaService } from '../../../../../theme/shared/service/dashboard-plataforma.service';
import { SocketManagerService } from 'src/app/theme/shared/service';
import { WidgetShellComponent } from 'src/app/theme/shared/components/widget-shell/widget-shell.component';

@Component({
    selector: 'app-wdg-kpi-usuarios',
    standalone: true,
    imports: [CommonModule, WidgetShellComponent],
    templateUrl: './wdg-kpi-usuarios.component.html',
    styleUrls: ['./wdg-kpi-usuarios.component.scss']
})
export class WdgKpiUsuariosComponent implements OnInit, OnDestroy {

    // 🟢 NUEVO ESTÁNDAR: Recibimos la config completa y el estado de enfoque
    @Input() widgetConfig: any;
    @Input() isEnfoque: boolean = false;

    public isLoading: boolean = true;
    public total: number = 0;
    private dataSub!: Subscription;
    private socketSub!: Subscription; // Mantenemos tu suscripción de sockets preparada

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

    // 🟢 Función para comunicar el enfoque
    maximizarDesdeShell() {
        if (typeof (this._dashboardService as any).abrirModoEnfoque === 'function') {
            (this._dashboardService as any).abrirModoEnfoque(this.widgetConfig?.type || 'WDG_PLAT_KPI_USUARIOS', { total: this.total });
        }
    }

    ngOnDestroy() {
        if (this.dataSub) this.dataSub.unsubscribe();
        if (this.socketSub) this.socketSub.unsubscribe();
    }
}
