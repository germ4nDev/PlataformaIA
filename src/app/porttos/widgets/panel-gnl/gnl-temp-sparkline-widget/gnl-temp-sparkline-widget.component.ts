import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit, Input } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { Subscription } from 'rxjs';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { SocketManagerService } from 'src/app/theme/shared/service';
import { WidgetShellComponent } from 'src/app/theme/shared/components/widget-shell/widget-shell.component';
import { DashboardService } from 'src/app/theme/shared/service/tablero-control/dashboard.service';

Chart.register(...registerables);

@Component({
    selector: 'app-gnl-temp-sparkline-widget',
    standalone: true,
    imports: [CommonModule, DecimalPipe, WidgetShellComponent],
    templateUrl: './gnl-temp-sparkline-widget.component.html',
    styleUrls: ['./gnl-temp-sparkline-widget.component.scss']
})
export class GnlTempSparklineWidgetComponent implements OnInit, AfterViewInit, OnDestroy {
    @Input() widgetConfig: any;
    @Input() isEnfoque: boolean = false;
    @Input() mostrarTabla: boolean = false;
    @ViewChild('sparklineCanvas') sparklineCanvas!: ElementRef;

    public chart!: Chart;
    public tempActual: number = -162.5;
    private sub: Subscription = new Subscription();
    private MAX_POINTS = 30;

    private _data: any;
    get data(): any { return this._data; }
    constructor(private socketManager: SocketManagerService, private _torreService: DashboardService) { }

    ngOnInit() { }

    ngAfterViewInit() {
        this.crearSparkline();

        // 1. Pre-llenamos el arreglo con el valor inicial para que la línea exista desde el segundo cero
        if (this.chart) {
            this.chart.data.datasets[0].data = Array(this.MAX_POINTS).fill(this.tempActual);
            this.chart.update();
        }

        this.sub = this.socketManager.telemetriaGNLActualizada$.subscribe((data: any) => {
            // 2. Protección: Intentamos leer temp_ducto, si no existe intentamos 'temperatura'.
            // Si todo falla, mantenemos el valor actual para que no se borre la pantalla.
            const nuevaTemp = data.temp_ducto ?? data.temperatura ?? this.tempActual;

            this.tempActual = nuevaTemp;

            if (this.chart) {
                const d = this.chart.data.datasets[0].data;
                d.push(this.tempActual);

                // Mantenemos el tamaño del historial
                if (d.length > this.MAX_POINTS) d.shift();

                this.chart.update('none');
            }
        });
    }

    private crearSparkline() {
        const ctx = this.sparklineCanvas.nativeElement.getContext('2d');

        const config: ChartConfiguration = {
            type: 'line',
            data: {
                labels: Array(this.MAX_POINTS).fill(''),
                datasets: [{
                    data: [],
                    borderColor: '#00e5ff',
                    borderWidth: 2,
                    pointRadius: 0,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: { duration: 0 },
                plugins: { legend: { display: false }, tooltip: { enabled: false } },
                layout: { padding: 0 },
                scales: {
                    x: { display: false },
                    y: { display: false, min: -170, max: -150 } // Rango estricto de GNL
                }
            }
        };
        this.chart = new Chart(ctx, config);
    }

    ngOnDestroy() {
        if (this.sub) this.sub.unsubscribe();
        if (this.chart) this.chart.destroy();
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
