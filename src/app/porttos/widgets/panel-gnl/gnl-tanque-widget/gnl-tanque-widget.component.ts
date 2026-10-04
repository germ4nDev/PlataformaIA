import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SocketManagerService } from 'src/app/theme/shared/service';
import { WidgetShellComponent } from 'src/app/theme/shared/components/widget-shell/widget-shell.component';
import { DashboardService } from 'src/app/theme/shared/service/tablero-control/dashboard.service';

@Component({
    selector: 'app-gnl-tanque-widget',
    standalone: true,
    imports: [CommonModule, WidgetShellComponent],
    templateUrl: './gnl-tanque-widget.component.html',
    styleUrls: ['./gnl-tanque-widget.component.scss']
})
export class GnlTanqueWidgetComponent implements OnInit {
    @Input() widgetConfig: any;
    @Input() isEnfoque: boolean = false;
    @Input() mostrarTabla: boolean = false;
    public nivelOcupacion: number = 85; // Aquí puedes conectar un socket luego

    private _data: any;
    get data(): any { return this._data; }
    constructor(private socketManager: SocketManagerService, private _torreService: DashboardService) { }

    ngOnInit() { }

    maximizarDesdeShell() {
        // Tu misma lógica (El servicio se encarga de inyectar isEnfoque)
        if (this.isEnfoque) {
            this._torreService.cerrarModoEnfoque();
        } else {
            this._torreService.abrirModoEnfoque(this.widgetConfig?.type || 'WDG_PORT_ETA_ATA', this.data);
        }
    }

}
