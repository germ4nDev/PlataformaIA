import { Component, Input, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { SocketManagerService } from 'src/app/theme/shared/service';
import { DashboardPlataformaService } from 'src/app/theme/shared/service/dashboard-plataforma.service';

// 🟢 Importamos el contenedor maestro universal
import { WidgetShellComponent } from 'src/app/theme/shared/components/widget-shell/widget-shell.component';

@Component({
    selector: 'app-wdg-tickets',
    standalone: true,
    imports: [CommonModule, WidgetShellComponent],
    templateUrl: './wdg-tickets.component.html',
    styleUrls: ['./wdg-tickets.component.scss'] // 🟢 Aseguramos el styleUrls
})
export class WdgTicketsComponent implements OnInit, OnDestroy {

    // 🟢 NUEVO ESTÁNDAR: Recibimos la config completa del selector
    @Input() widgetConfig: any;
    @Input() isEnfoque: boolean = false;

    public ticketsAbiertos: number = 0;
    public ticketsEnProceso: number = 0;
    public ticketsResueltos: number = 0;

    private socketSub!: Subscription;

    constructor(
        private _socketManager: SocketManagerService,
        private _dashboardService: DashboardPlataformaService,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit() {
        this.cargarTicketsReales();

        this.socketSub = this._socketManager.ticketsActualizados$.subscribe(() => {
            this.cargarTicketsReales();
        });
    }

    cargarTicketsReales() {
        this._dashboardService.getResumenTickets().subscribe({
            next: (res: any) => {
                this.ticketsAbiertos = res.abiertos || 0;
                this.ticketsEnProceso = res.enProceso || 0;
                this.ticketsResueltos = res.resueltos || 0;
                this.cdr.detectChanges();
            },
            error: (err) => console.error('Error al cargar resumen de tickets:', err)
        });
    }

    // 🟢 NUEVO: Función para comunicar el enfoque
    maximizarDesdeShell() {
        if (typeof (this._dashboardService as any).abrirModoEnfoque === 'function') {
            (this._dashboardService as any).abrirModoEnfoque(
                this.widgetConfig?.type || 'WDG_PLAT_TICKETS',
                {
                    abiertos: this.ticketsAbiertos,
                    enProceso: this.ticketsEnProceso,
                    resueltos: this.ticketsResueltos
                }
            );
        }
    }

    ngOnDestroy() {
        if (this.socketSub) this.socketSub.unsubscribe();
    }
}
