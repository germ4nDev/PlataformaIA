import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { SocketManagerService } from 'src/app/theme/shared/service';
import { DashboardPlataformaService } from 'src/app/theme/shared/service/dashboard-plataforma.service';
import { WidgetHeaderComponent } from "src/app/theme/shared/components/widget-header/widget-header.component";

@Component({
    selector: 'app-wdg-tickets',
    standalone: true,
    imports: [CommonModule, WidgetHeaderComponent],
    templateUrl: './wdg-tickets.component.html',
    styleUrl: './wdg-tickets.component.scss'
})
export class WdgTicketsComponent implements OnInit, OnDestroy {
    @Input() data: any;
    @Input() widgetId: string = '';

    public ticketsAbiertos: number = 0;
    public ticketsEnProceso: number = 0;
    public ticketsResueltos: number = 0;

    private socketSub!: Subscription;

    constructor(
        private _socketManager: SocketManagerService,
        private _dashboardService: DashboardPlataformaService
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
            },
            error: (err) => console.error('Error al cargar resumen de tickets:', err)
        });
    }

    ngOnDestroy() {
        if (this.socketSub) this.socketSub.unsubscribe();
    }
}
