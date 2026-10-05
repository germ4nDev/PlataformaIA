import { Component, OnInit, OnDestroy, Input, SimpleChanges } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common'; // Agregamos CommonModule
import { Subscription } from 'rxjs';
import { SocketManagerService } from 'src/app/theme/shared/service';
import { WidgetShellComponent } from 'src/app/theme/shared/components/widget-shell/widget-shell.component';
import { DashboardService } from 'src/app/theme/shared/service/tablero-control/dashboard.service';

@Component({
    selector: 'app-gnl-gauge-widget',
    standalone: true,
    imports: [CommonModule, DecimalPipe, WidgetShellComponent], // Importamos el Shell
    templateUrl: './gnl-gauge-widget.component.html',
    styleUrls: ['./gnl-gauge-widget.component.scss']
})
export class GnlGaugeWidgetComponent implements OnInit, OnDestroy {
    @Input() widgetConfig: any;
    @Input() isEnfoque: boolean = false;
    @Input() mostrarTabla: boolean = false;

    public presionActual: number = 0;
    public temperaturaActual: number = -162;
    public alarmaActiva: boolean = false;
    public presionMaxima: number = 120;
    public cargando: boolean = true;
    public isLoading: boolean = false;
    private _data: any;
    private telemetriaSub: Subscription = new Subscription();

    constructor(
        private socketManager: SocketManagerService,
        private _torreService: DashboardService
    ) { }

    ngOnInit(): void {
        // Si viene del modo enfoque, lo marcamos para no anidar shells
        this.telemetriaSub = this.socketManager.telemetriaGNLActualizada$.subscribe((data: any) => {
            this.cargando = false;
            this.presionActual = data.presion_psi;
            this.temperaturaActual = data.temperatura_celsius;
            this.alarmaActiva = data.alarma_activa || this.presionActual > 100;
        });
    }

    ngOnDestroy(): void {
        if (this.telemetriaSub) {
            this.telemetriaSub.unsubscribe();
        }
    }

    get calcularAnguloAguja(): number {
        let porcentaje = this.presionActual / this.presionMaxima;
        if (porcentaje > 1) porcentaje = 1;
        if (porcentaje < 0) porcentaje = 0;
        return (porcentaje * 180) - 90;
    }

    get data(): any { return this._data; }

    maximizarDesdeShell() {
        if (this.isEnfoque) {
            this._torreService.cerrarModoEnfoque();
        } else {
            this._torreService.abrirModoEnfoque(this.widgetConfig?.type || 'PTT_GNL_GAUGE_PRESION', this.data);
        }
    }
}
