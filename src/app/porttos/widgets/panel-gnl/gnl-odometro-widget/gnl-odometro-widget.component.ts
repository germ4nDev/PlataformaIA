import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { Subscription } from 'rxjs';
import { SocketManagerService } from 'src/app/theme/shared/service';
import { WidgetShellComponent } from 'src/app/theme/shared/components/widget-shell/widget-shell.component';
import { DashboardService } from 'src/app/theme/shared/service/tablero-control/dashboard.service';

@Component({
    selector: 'app-gnl-odometro-widget',
    standalone: true,
    imports: [CommonModule, DecimalPipe, WidgetShellComponent],
    templateUrl: './gnl-odometro-widget.component.html',
    styleUrls: ['./gnl-odometro-widget.component.scss']
})
export class GnlOdometroWidgetComponent implements OnInit, OnDestroy {
    @Input() widgetConfig: any;
    @Input() isEnfoque: boolean = false;
    @Input() mostrarTabla: boolean = false;
    public energiaTotal: number = 1425.50; // Valor base simulado
    private sub: Subscription = new Subscription();

    private _data: any;
    get data(): any { return this._data; }
    constructor(private socketManager: SocketManagerService, private _torreService: DashboardService) { }

    ngOnInit() {
        this.isEnfoque = this.widgetConfig?.isEnfoque || false;
        this.sub = this.socketManager.telemetriaGNLActualizada$.subscribe((data: any) => {
            // Fórmula rápida: Convierte m3/h a MMBTU en el ciclo del socket
            this.energiaTotal += (data.flujo_m3 * 22.4 / 3600);
        });
    }

    ngOnDestroy() {
        if (this.sub) this.sub.unsubscribe();
    }

    maximizarDesdeShell() {
        // Tu misma lógica (El servicio se encarga de inyectar isEnfoque)
        if (this.isEnfoque) {
            this._torreService.cerrarModoEnfoque();
        } else {
            this._torreService.abrirModoEnfoque(this.widgetConfig?.type || 'WDG_PORT_ETA_ATA', this.data);
        }
    }

}
