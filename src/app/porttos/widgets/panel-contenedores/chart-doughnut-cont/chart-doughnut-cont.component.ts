/*
    Author: German Valencia
    Pattern: PORTTOS Generic Widget - Doughnut Chart Contenedores (Refactorizado con Shell)
*/
import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgChartsModule } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';
import { DashboardService } from 'src/app/theme/shared/service/tablero-control/dashboard.service';

// 🟢 Importamos el Shell maestro
import { WidgetShellComponent } from 'src/app/theme/shared/components/widget-shell/widget-shell.component';

@Component({
    selector: 'app-chart-doughnut-cont',
    standalone: true,
    imports: [CommonModule, NgChartsModule, WidgetShellComponent], // 🟢 Agregamos WidgetShellComponent
    templateUrl: './chart-doughnut-cont.component.html',
    styleUrls: ['./chart-doughnut-cont.component.scss']
})
export class ChartDoughnutContComponent implements OnInit {

    // 🟢 NUEVO ESTÁNDAR: Recibimos la config completa del selector
    @Input() widgetConfig: any;
    @Input() isEnfoque: boolean = false;

    private _data: any;
    public cargando: boolean = true;

    @Input() set data(value: any) {
        this._data = value;

        if (value) {
            this.cargando = false;

            if (value.series && value.labels) {
                this.doughnutChartData = {
                    labels: value.labels,
                    datasets: [{
                        data: value.series,
                        backgroundColor: value.colores || ['#22c55e', '#f59e0b', '#ef4444', '#3b82f6'],
                        borderWidth: 0,
                        hoverOffset: 4
                    }]
                };
            } else {
                // Fallback (Mock) si la API no manda la data completa
                console.warn('⚠️ Faltan series/labels en Contenedores, usando Mock.');
                this.doughnutChartData = {
                    labels: ['En Free Time', 'En Riesgo', 'Vencidos'],
                    datasets: [{
                        data: [60, 25, 15],
                        backgroundColor: ['#22c55e', '#f59e0b', '#ef4444'],
                        borderWidth: 0,
                        hoverOffset: 4
                    }]
                };
            }
        }
    }

    get data(): any { return this._data; }

    constructor(private _torreService: DashboardService) { }

    ngOnInit() {
        // 🟢 Aseguramos la carga de datos si vienen anidados en la configuración
        if (this.widgetConfig?.data && !this._data) {
            this.data = this.widgetConfig.data;
        }
    }

    // 🟢 Método de Toggle para abrir/cerrar el modal desde el Shell
    maximizarDesdeShell() {
        if (this.isEnfoque) {
            this._torreService.cerrarModoEnfoque();
        } else {
            this._torreService.abrirModoEnfoque(this.widgetConfig?.type || 'WDG_PORT_DOUGHNUT_CONT', this.data);
        }
    }

    // Opciones de configuración de Chart.js
    public doughnutChartOptions: ChartConfiguration<'doughnut'>['options'] = {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '70%',
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

    public doughnutChartData!: ChartData<'doughnut'>;
}
