import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit, Input, SimpleChanges } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { Subscription } from 'rxjs';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { SocketManagerService } from 'src/app/theme/shared/service';
import { WidgetShellComponent } from 'src/app/theme/shared/components/widget-shell/widget-shell.component';
import { DashboardService } from 'src/app/theme/shared/service/tablero-control/dashboard.service';

Chart.register(...registerables);

@Component({
    selector: 'app-gnl-flujo-chart',
    standalone: true,
    imports: [CommonModule, DecimalPipe, WidgetShellComponent],
    templateUrl: './gnl-flujo-chart.component.html',
    styleUrls: ['./gnl-flujo-chart.component.scss']
})
export class GnlFlujoChartComponent implements OnInit, AfterViewInit, OnDestroy {
    @Input() widgetConfig: any;
    @Input() isEnfoque: boolean = false;
    @Input() mostrarTabla: boolean = false;
    @ViewChild('flowCanvas') flowCanvas!: ElementRef;

    public chart!: Chart;
    public energiaTotal: number = 0;
    public cargando: boolean = true;
    private _data: any;

    private MAX_DATA_POINTS = 50;
    private telemetriaSub: Subscription = new Subscription();

    constructor(
        private socketManager: SocketManagerService,
        private _torreService: DashboardService
    ) { }

    ngOnInit(): void {
    }

    get data(): any { return this._data; }

    ngAfterViewInit(): void {
        this.crearGraficoVacio();

        this.telemetriaSub = this.socketManager.telemetriaGNLActualizada$.subscribe((data: any) => {
            this.cargando = false;
            this.actualizarGraficoEnVivo(data.flujo_m3, data.timestamp);
            this.energiaTotal += (data.flujo_m3 * 22.4 / 3600);
        });
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['isEnfoque'] && !changes['isEnfoque'].isFirstChange()) {
            // Si el gráfico ya existe, podemos disparar un resize para que se adapte al modal grande
            if (this.chart) {
                this.chart.resize();
            }
        }
    }

    ngOnDestroy(): void {
        if (this.telemetriaSub) this.telemetriaSub.unsubscribe();
        if (this.chart) this.chart.destroy();
    }

    private crearGraficoVacio() {
        const ctx = this.flowCanvas.nativeElement.getContext('2d');

        const altoGradiente = this.isEnfoque ? 1000 : 400;
        let gradient = ctx.createLinearGradient(0, 0, 0, altoGradiente);

        gradient.addColorStop(0, 'rgba(0, 127, 255, 0.7)');
        gradient.addColorStop(1, 'rgba(0, 127, 255, 0.2)');

        const grosorLinea = this.isEnfoque ? 6 : 3;
        const tamanoFuente = this.isEnfoque ? 18 : 10;
        const espaciadoTexto = this.isEnfoque ? 20 : 10;

        const config: ChartConfiguration = {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Flujo M3/h',
                    data: [],
                    borderColor: '#007FFF',
                    backgroundColor: gradient,
                    borderWidth: grosorLinea,
                    pointRadius: 0,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: { duration: 0 },
                plugins: {
                    legend: { display: false }
                },
                layout: {
                    padding: { left: -10, right: 0, top: 20, bottom: 0 }
                },
                scales: {
                    x: {
                        display: false
                    },
                    y: {
                        position: 'left',
                        border: {
                            display: false
                        },
                        grid: {
                            color: 'rgba(161, 165, 183, 0.1)',
                            tickLength: 0
                        },
                        ticks: {
                            color: '#a1a5b7',
                            // Inyectamos la fuente y espaciado dinámicos
                            font: { size: tamanoFuente },
                            padding: espaciadoTexto
                        },
                        min: 0,
                        suggestedMax: 10
                    }
                }
            }
        };

        this.chart = new Chart(ctx, config);
    }

    private actualizarGraficoEnVivo(nuevoValor: number, timestamp: string) {
        if (!this.chart) return;
        const data = this.chart.data;

        data.labels?.push(new Date(timestamp).toLocaleTimeString());
        data.datasets[0].data.push(nuevoValor);

        if (data.labels!.length > this.MAX_DATA_POINTS) {
            data.labels?.shift();
            data.datasets[0].data.shift();
        }
        this.chart.update('none');
    }

    maximizarDesdeShell() {
        if (this.isEnfoque) {
            this._torreService.cerrarModoEnfoque();
        } else {
            this._torreService.abrirModoEnfoque(this.widgetConfig?.type || 'PTT_GNL_LINECHART_FLUJO', this.data);
        }
    }
}
