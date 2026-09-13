import { Component, Input, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { SocketManagerService } from 'src/app/theme/shared/service';
import { DashboardPlataformaService } from '../../../../../theme/shared/service/dashboard-plataforma.service';
import { DashboardService } from 'src/app/theme/shared/service/tablero-control/dashboard.service'; // 🟢 Servicio UI
import { WidgetHeaderComponent } from "src/app/theme/shared/components/widget-header/widget-header.component";

@Component({
    selector: 'app-wdg-usuarios',
    standalone: true,
    imports: [CommonModule, WidgetHeaderComponent],
    templateUrl: './wdg-usuarios.component.html',
    styleUrl: './wdg-usuarios.component.scss'
})
export class WdgUsuariosComponent implements OnInit, OnDestroy {
    @Input() data: any;
    @Input() widgetId: string = '';

    public totalConectados: number = 0;
    public enModoEnfoque: boolean = false; // 🟢 Controla qué vista mostrar

    private socketSub!: Subscription;
    private enfoqueSub!: Subscription; // 🟢 Suscripción al modal

    constructor(
        private _socketManager: SocketManagerService,
        private _dashboardService: DashboardPlataformaService,
        private _torreService: DashboardService, // 🟢 Inyectamos el controlador del modal
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit() {
        this.cargarDataReal();

        this.socketSub = this._socketManager.usuariosActualizados$.subscribe(() => {
            this.cargarDataReal();
        });

        // 🟢 Escuchamos si el usuario expandió este widget específico
        this.enfoqueSub = this._torreService.widgetEnfoque$.subscribe(widget => {
            this.enModoEnfoque = (widget !== null && widget.type === this.widgetId);
            this.cdr.detectChanges(); // Forzamos el renderizado del HTML
        });
    }

    cargarDataReal() {
        this._dashboardService.getUsuariosConectados().subscribe({
            next: (res: any) => {
                this.totalConectados = res || 0;
            },
            error: (err) => console.error('Error al cargar usuarios conectados:', err)
        });
    }

    ngOnDestroy() {
        if (this.socketSub) this.socketSub.unsubscribe();
        if (this.enfoqueSub) this.enfoqueSub.unsubscribe(); // 🟢 Limpiamos memoria
    }
}
