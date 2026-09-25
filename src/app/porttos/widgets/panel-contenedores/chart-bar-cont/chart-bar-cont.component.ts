/*
    Author: German Valencia
    Pattern: PORTTOS Generic Widget - Grouped Bar Chart Contenedores (Refactorizado con Shell)
*/
import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgChartsModule } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';
import { DashboardService } from 'src/app/theme/shared/service/tablero-control/dashboard.service';

// 🟢 Importamos el Shell maestro
import { WidgetShellComponent } from 'src/app/theme/shared/components/widget-shell/widget-shell.component';

@Component({
    selector: 'app-chart-bar-cont',
    standalone: true,
    imports: [CommonModule, NgChartsModule, WidgetShellComponent], // 🟢 Agregamos WidgetShellComponent
    templateUrl: './chart-bar-cont.component.html',
    styleUrls: ['./chart-bar-cont.component.scss']
})
export class ChartBarContComponent implements OnInit {

    // 🟢 NUEVO ESTÁNDAR: Recibimos la config completa del selector
    @Input() widgetConfig: any;
    @Input() isEnfoque: boolean = false;

    private _data: any;
    public cargando: boolean = true;

    // Mantenemos tu lógica del setter para la data, pero adaptada para leer de widgetConfig
    @Input() set data(value: any) {
        this._data = value;

        if (value) {
            this.cargando = false;

            if (value.series && value.categorias) {
                const colors = value.colores || ['#a855f7', '#10b981'];

                this.barChartData = {
                    labels: value.categorias,
                    datasets: value.series.map((serie: any, index: number) => ({
                        label: serie.name || `Serie ${index + 1}`,
                        data: serie.data,
                        backgroundColor: colors[index % colors.length],
                        borderRadius: 4
                    }))
                };
            } else {
                // Fallback (Mock) visual si la API no manda la data completa
                console.warn('⚠️ Faltan series/categorias en Contenedores, usando Mock.');
                this.barChartData = {
                    labels: ['Maersk', 'MSC', 'CMA CGM', 'Hapag', 'Evergreen', 'ONE', 'COSCO'],
                    datasets: [
                        { label: 'Por devolver', data: [140, 118, 98, 82, 55, 48, 40], backgroundColor: '#a855f7', borderRadius: 4 },
                        { label: 'Cap. patios', data: [80, 90, 110, 120, 150, 140, 160], backgroundColor: '#10b981', borderRadius: 4 }
                    ]
                };
            }
        }
    }

    get data(): any { return this._data; }

    constructor(private _torreService: DashboardService) { }

    ngOnInit() {
        // 🟢 Si la data viene anidada en widgetConfig, la procesamos
        if (this.widgetConfig?.data && !this._data) {
            this.data = this.widgetConfig.data;
        }
    }

    // 🟢 Método de Toggle para abrir/cerrar el modal desde el Shell
    maximizarDesdeShell() {
        if (this.isEnfoque) {
            this._torreService.cerrarModoEnfoque();
        } else {
            this._torreService.abrirModoEnfoque(this.widgetConfig?.type || 'WDG_PORT_BAR_CONT', this.data);
        }
    }

    // Configuración de Chart.js para barras VERTICALES AGRUPADAS
    public barChartOptions: ChartConfiguration['options'] = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            x: {
                stacked: false,
                ticks: { color: '#94a3b8' },
                grid: { display: false },
                border: { display: false }
            },
            y: {
                stacked: false,
                ticks: { color: '#94a3b8' },
                grid: {
                    color: 'rgba(255,255,255,0.05)',
                    display: true
                },
                border: { display: false }
            }
        },
        plugins: {
            legend: {
                position: 'top',
                align: 'end',
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
