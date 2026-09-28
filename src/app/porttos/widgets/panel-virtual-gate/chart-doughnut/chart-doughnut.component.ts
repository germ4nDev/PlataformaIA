/*
    Author: German Valencia
    Pattern: PORTTOS Generic Widget - Distribución 10km (Refactorizado con Shell)
*/
import { Component, Input, OnInit, OnChanges, SimpleChanges, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgChartsModule } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';
import { DashboardService } from 'src/app/theme/shared/service/tablero-control/dashboard.service';

// 🟢 Importamos el Shell maestro
import { WidgetShellComponent } from 'src/app/theme/shared/components/widget-shell/widget-shell.component';

@Component({
    selector: 'app-chart-doughnut',
    standalone: true,
    imports: [CommonModule, NgChartsModule, WidgetShellComponent], // 🟢 Añadimos WidgetShellComponent
    templateUrl: './chart-doughnut.component.html',
    styleUrls: ['./chart-doughnut.component.scss'], // Corregido a styleUrls
    encapsulation: ViewEncapsulation.None
})
export class ChartDoughnutComponent implements OnInit, OnChanges {

    // 🟢 NUEVO ESTÁNDAR
    @Input() widgetConfig: any;
    @Input() isEnfoque: boolean = false;
    @Input() mostrarTabla: boolean = false;

    public data: any = {};
    public cargando: boolean = true;
    public doughnutChartData!: ChartData<'doughnut'>;

    public doughnutChartOptions: ChartConfiguration<'doughnut'>['options'] = {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '70%', // Grosor de la dona
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    color: '#94a3b8',
                    font: { size: 11 },
                    usePointStyle: true,
                    pointStyle: 'circle',
                    boxWidth: 8
                }
            }
        }
    };

    constructor(private _torreService: DashboardService) { }

    ngOnInit(): void {
        if (this.widgetConfig?.data) {
            this.procesarData(this.widgetConfig.data);
        }
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['widgetConfig'] && !changes['widgetConfig'].firstChange) {
            this.procesarData(this.widgetConfig?.data);
        } else if (changes['data'] && !changes['data'].firstChange) {
            this.procesarData(changes['data'].currentValue);
        }
    }

    private procesarData(value: any) {
        if (!value) return;
        this.data = value;

        // Verificamos si la data general (o el nodo resumen) ya llegó
        if (value.resumen || value.distribucionCamiones) {
            this.cargando = false;

            // Intentamos leer la data real del backend
            const distData = value.resumen?.distribucionCamiones || value.distribucionCamiones;

            if (distData && distData.series && distData.labels) {
                // 🟢 PLAN A: El backend mandó la data correctamente
                this.doughnutChartData = {
                    labels: [...distData.labels],
                    datasets: [{
                        data: [...distData.series],
                        backgroundColor: ['#0ea5e9', '#8b5cf6', '#14b8a6', '#f59e0b', '#64748b'],
                        borderWidth: 0,
                        hoverOffset: 4
                    }]
                };
            } else {
                // 🟢 PLAN B (Fallback): Falta el nodo en Node.js, usando Mock
                console.warn('⚠️ Falta el nodo distribucionCamiones en Node.js, usando Mock.');
                this.doughnutChartData = {
                    labels: ['Pre-gate A', 'Pre-gate B', 'Pre-gate C', 'Vía alterna', 'En tránsito'],
                    datasets: [{
                        data: [35, 20, 15, 10, 20], // Data simulada
                        backgroundColor: ['#0ea5e9', '#8b5cf6', '#14b8a6', '#f59e0b', '#64748b'],
                        borderWidth: 0,
                        hoverOffset: 4
                    }]
                };
            }
        }
    }

    maximizarDesdeShell() {
        if (this.isEnfoque) {
            this._torreService.cerrarModoEnfoque();
        } else {
            this._torreService.abrirModoEnfoque(this.widgetConfig?.type || 'WDG_PORT_DISTRIBUCION_10KM', this.data);
        }
    }
}
