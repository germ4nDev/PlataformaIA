// import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit, Input } from '@angular/core';
// import { CommonModule, DecimalPipe } from '@angular/common';
// import { Subscription } from 'rxjs';
// import { Chart, ChartConfiguration, registerables } from 'chart.js';
// import { SocketManagerService } from 'src/app/theme/shared/service';

// Chart.register(...registerables);

// @Component({
//     selector: 'app-gnl-flujo-chart',
//     standalone: true,
//     imports: [CommonModule, DecimalPipe],
//     templateUrl: './gnl-flujo-chart.component.html',
//     styleUrls: ['./gnl-flujo-chart.component.scss']
// })
// export class GnlFlujoChartComponent implements OnInit, AfterViewInit, OnDestroy {
//     @ViewChild('flowCanvas') flowCanvas!: ElementRef;
//     @Input() widgetConfig: any;
//     @Input() isEnfoque: boolean = false;
//     @Input() mostrarTabla: boolean = false;

//     public chart!: Chart;
//     public energiaTotal: number = 0;

//     // Límite de puntos para el efecto SCADA en tiempo real (Cinta de correr)
//     private MAX_DATA_POINTS = 50;
//     private telemetriaSub: Subscription = new Subscription();

//     constructor(private _socketManager: SocketManagerService) { }

//     ngOnInit(): void {
//         // 1. Aquí llamarías a tu GnlHttpService para pre-cargar la gráfica con la data
//         // consolidada de SQL Server (El Cold Path que hicimos en el backend).
//         // this.gnlService.obtenerHistorialFlujo('CARTAGENA').subscribe(data => this.initChart(data));
//     }

//     ngAfterViewInit(): void {
//         this.crearGraficoVacio();

//         // 2. Nos suscribimos al Hot Path (El mismo socket del tacómetro)
//         this.telemetriaSub = this._socketManager.telemetriaGNLActualizada$.subscribe((data: any) => {
//             this.actualizarGraficoEnVivo(data.flujo_m3, data.timestamp);

//             // Cálculo en vivo: 1 m3 de GNL = ~22.4 MMBTU de energía
//             this.energiaTotal += (data.flujo_m3 * 22.4 / 3600);
//         });
//     }

//     ngOnDestroy(): void {
//         if (this.telemetriaSub) this.telemetriaSub.unsubscribe();
//         if (this.chart) this.chart.destroy();
//     }

//     private crearGraficoVacio() {
//         const ctx = this.flowCanvas.nativeElement.getContext('2d');

//         // Gradiente SCADA azul brillante (Criogénico)
//         let gradient = ctx.createLinearGradient(0, 0, 0, 400);
//         gradient.addColorStop(0, 'rgba(0, 229, 255, 0.4)');
//         gradient.addColorStop(1, 'rgba(0, 229, 255, 0.0)');

//         const config: ChartConfiguration = {
//             type: 'line',
//             data: {
//                 labels: [], // Tiempo (Eje X)
//                 datasets: [{
//                     label: 'Flujo M3/h',
//                     data: [], // Valores (Eje Y)
//                     borderColor: '#00e5ff',
//                     backgroundColor: gradient,
//                     borderWidth: 2,
//                     pointRadius: 0, // Sin puntos, solo una línea fluida
//                     fill: true,
//                     tension: 0.4 // Curvas suaves tipo onda
//                 }]
//             },
//             options: {
//                 responsive: true,
//                 maintainAspectRatio: false,
//                 animation: { duration: 0 }, // Vital: Desactivamos la animación inicial pesada para el tiempo real
//                 plugins: { legend: { display: false } },
//                 scales: {
//                     x: { display: false }, // Ocultamos el texto del eje X
//                     y: {
//                         grid: { color: '#2b2b40' },
//                         ticks: { color: '#a1a5b7' },
//                         min: 0,
//                         suggestedMax: 10 // Ajusta esto según el flujo máximo en tu CSV
//                     }
//                 }
//             }
//         };

//         this.chart = new Chart(ctx, config);
//     }

//     private actualizarGraficoEnVivo(nuevoValor: number, timestamp: string) {
//         if (!this.chart) return;

//         const data = this.chart.data;

//         // Agregamos el nuevo punto de telemetría
//         data.labels?.push(new Date(timestamp).toLocaleTimeString());
//         data.datasets[0].data.push(nuevoValor);

//         // Efecto "Cinta de correr": si superamos los puntos max, borramos el más viejo
//         if (data.labels!.length > this.MAX_DATA_POINTS) {
//             data.labels?.shift();
//             data.datasets[0].data.shift();
//         }

//         // Actualizamos la gráfica sin la animación nativa de rebote
//         this.chart.update('none');
//     }
// }
import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit, Input } from '@angular/core';
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
        this.isEnfoque = this.widgetConfig?.isEnfoque || false;
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

    ngOnDestroy(): void {
        if (this.telemetriaSub) this.telemetriaSub.unsubscribe();
        if (this.chart) this.chart.destroy();
    }

    private crearGraficoVacio() {
        const ctx = this.flowCanvas.nativeElement.getContext('2d');

        // 🌟 FIX: Ajustamos la profundidad física del gradiente según la vista
        const altoGradiente = this.isEnfoque ? 1000 : 400;
        let gradient = ctx.createLinearGradient(0, 0, 0, altoGradiente);

        // 🎨 Incrementamos agresivamente la intensidad del relleno (Azul puro RGB: 0, 127, 255)
        // 70% de opacidad arriba para un impacto visual sólido
        gradient.addColorStop(0, 'rgba(0, 127, 255, 0.7)');
        // 20% de opacidad abajo (antes 5%) para que jamás desaparezca en el fondo
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
        // Tu misma lógica (El servicio se encarga de inyectar isEnfoque)
        if (this.isEnfoque) {
            this._torreService.cerrarModoEnfoque();
        } else {
            this._torreService.abrirModoEnfoque(this.widgetConfig?.type || 'WDG_PORT_ETA_ATA', this.data);
        }
    }
}
