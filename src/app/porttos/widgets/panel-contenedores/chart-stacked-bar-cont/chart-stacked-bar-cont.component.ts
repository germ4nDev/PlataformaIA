/*
    Author: German Valencia
    Pattern: PORTTOS Generic Widget - Stacked Bar Chart (Refactorizado con Shell)
*/
import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgChartsModule } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';
import { DashboardService } from 'src/app/theme/shared/service/tablero-control/dashboard.service';

// 🟢 Importamos el Shell maestro
import { WidgetShellComponent } from 'src/app/theme/shared/components/widget-shell/widget-shell.component';

@Component({
    selector: 'app-chart-stacked-bar-cont',
    standalone: true,
    imports: [CommonModule, NgChartsModule, WidgetShellComponent], // 🟢 Añadimos WidgetShellComponent
    templateUrl: './chart-stacked-bar-cont.component.html',
    styleUrls: ['./chart-stacked-bar-cont.component.scss']
})
export class ChartStackedBarContComponent implements OnInit {

    // 🟢 NUEVO ESTÁNDAR: Inputs requeridos por el selector dinámico
    @Input() widgetConfig: any;
    @Input() isEnfoque: boolean = false;

    private _data: any;
    public cargando: boolean = true;

    @Input() set data(value: any) {
        this._data = value;

        if (value) {
            this.cargando = false;

            if (value.series && value.categorias) {
                const colors = value.colores || ['#3b82f6', '#22d3ee', '#f59e0b', '#ef4444'];

                this.barChartData = {
                    labels: value.categorias,
                    datasets: value.series.map((serie: any, index: number) => ({
                        label: serie.name || `Serie ${index + 1}`,
                        data: serie.data,
                        backgroundColor: colors[index % colors.length],
                        stack: 'Stack 0',
                        borderRadius: 2
                    }))
                };
            } else {
                console.warn('⚠️ Faltan series/categorias en Contenedores, usando Mock.');
                this.barChartData = {
                    labels: ['Patio A', 'Patio B', 'Patio C'],
                    datasets: [
                        { label: 'Por devolver', data: [40, 30, 20], backgroundColor: '#3b82f6', stack: 'Stack 0', borderRadius: 2 },
                        { label: 'Capacidad', data: [60, 70, 80], backgroundColor: '#22d3ee', stack: 'Stack 0', borderRadius: 2 }
                    ]
                };
            }
        }
    }

    get data(): any { return this._data; }

    constructor(private _torreService: DashboardService) { }

    ngOnInit() {
        // 🟢 Cargamos la data si viene inyectada dentro de la configuración
        if (this.widgetConfig?.data && !this._data) {
            this.data = this.widgetConfig.data;
        }
    }

    // 🟢 Toggle de enfoque: Abre o cierra el modal
    maximizarDesdeShell() {
        if (this.isEnfoque) {
            this._torreService.cerrarModoEnfoque();
        } else {
            this._torreService.abrirModoEnfoque(this.widgetConfig?.type || 'WDG_PORT_STACKED_BAR_CONT', this.data);
        }
    }

    public barChartOptions: ChartConfiguration['options'] = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            x: {
                stacked: true,
                ticks: { color: '#94a3b8' },
                grid: { display: false },
                border: { display: false }
            },
            y: {
                stacked: true,
                beginAtZero: true,
                ticks: { color: '#94a3b8' },
                grid: { color: 'rgba(255,255,255,0.05)' },
                border: { display: false }
            }
        },
        plugins: {
            legend: {
                position: 'top',
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

    public barChartData!: ChartData<'bar'>;
}
