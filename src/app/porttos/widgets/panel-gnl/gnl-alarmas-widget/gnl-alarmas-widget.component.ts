import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Subscription } from 'rxjs';
import { SocketManagerService } from 'src/app/theme/shared/service';
import { WidgetShellComponent } from 'src/app/theme/shared/components/widget-shell/widget-shell.component';
import { DashboardService } from 'src/app/theme/shared/service/tablero-control/dashboard.service';

interface AlarmaEvento {
    id: string;
    tiempo: Date;
    mensaje: string;
    tipo: 'peligro' | 'advertencia' | 'info';
    valor: number;
}

@Component({
    selector: 'app-gnl-alarmas-widget',
    standalone: true,
    imports: [CommonModule, DatePipe, WidgetShellComponent],
    templateUrl: './gnl-alarmas-widget.component.html',
    styleUrls: ['./gnl-alarmas-widget.component.scss']
})
export class GnlAlarmasWidgetComponent implements OnInit, OnDestroy {
    @Input() widgetConfig: any;
    @Input() isEnfoque: boolean = false;
    @Input() mostrarTabla: boolean = false;
    public eventos: AlarmaEvento[] = [];
    private sub: Subscription = new Subscription();
    private estadoAnterior: 'estable' | 'advertencia' | 'peligro' = 'estable';

    private _data: any;
    get data(): any { return this._data; }
    constructor(private socketManager: SocketManagerService, private _torreService: DashboardService) { }

    ngOnInit() {
        // Carga simulada del Cold Path (Base de datos) al iniciar
        this.eventos = [
            // { id: '1', tiempo: new Date(Date.now() - 3600000), mensaje: 'Inicio de jornada operativa', tipo: 'info', valor: 0 }
        ];

        this.sub = this.socketManager.telemetriaGNLActualizada$.subscribe((data: any) => {
            this.evaluarUmbrales(data.presion_psi, data.timestamp);
        });
    }

    private evaluarUmbrales(presion: number, timestamp: string) {
        let estadoActual: 'estable' | 'advertencia' | 'peligro' = 'estable';

        if (presion >= 100) estadoActual = 'peligro';
        else if (presion >= 85) estadoActual = 'advertencia';

        // Solo registramos el evento si el ESTADO cambia (para no spamear el feed)
        if (estadoActual !== this.estadoAnterior && estadoActual !== 'estable') {
            const nuevoEvento: AlarmaEvento = {
                id: Math.random().toString(36).substring(2, 9),
                tiempo: new Date(timestamp),
                mensaje: estadoActual === 'peligro' ? 'Pico crítico de presión detectado' : 'Presión en zona de precaución',
                tipo: estadoActual,
                valor: presion
            };

            this.eventos.unshift(nuevoEvento); // Agrega al inicio de la lista

            // Mantenemos solo los últimos 10 eventos en memoria
            if (this.eventos.length > 10) this.eventos.pop();
        }
        this.estadoAnterior = estadoActual;
    }

    ngOnDestroy() {
        if (this.sub) this.sub.unsubscribe();
    }

    maximizarDesdeShell() {
        // Tu misma lógica (El servicio se encarga de inyectar isEnfoque)
        if (this.isEnfoque) {
            this._torreService.cerrarModoEnfoque();
        } else {
            this._torreService.abrirModoEnfoque(this.widgetConfig?.type || 'PTT_GNL_CHART_ALM_EVENT', this.data);
        }
    }
}
