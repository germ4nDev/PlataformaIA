/*
    Author: German Valencia
    Pattern: PORTTOS Generic Widget - Reporte ETA vs ATA (Refactorizado con Shell)
*/
import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgChartsModule } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';
import { IWidget } from 'src/app/theme/shared/interfaces/torre-control/widget.interface';
import { DashboardService } from 'src/app/theme/shared/service/tablero-control/dashboard.service';

// 🟢 Importamos el Shell maestro
import { WidgetShellComponent } from 'src/app/theme/shared/components/widget-shell/widget-shell.component';

@Component({
    selector: 'app-eta-chart',
    standalone: true,
    imports: [CommonModule, NgChartsModule, WidgetShellComponent], // 🟢 Añadimos WidgetShellComponent
    templateUrl: './eta-chart.component.html',
    styleUrls: ['./eta-chart.component.scss']
})
export class EtaChartComponent implements OnInit {

    // 🟢 NUEVO ESTÁNDAR: Inputs requeridos por el selector dinámico
    @Input() widgetConfig: any;
    @Input() isEnfoque: boolean = false;
    @Input() mostrarTabla: boolean = false;

    private _data: any;
    public cargando: boolean = true;

    // Mantenemos tu lógica reactiva del setter
    @Input() set data(value: any) {
        this._data = value;
        if (value && value.labels) {
            this.cargando = false;
            this.barChartData = {
                labels: value.labels,
                datasets: value.datasets
            };
        }
    }

    get data(): any { return this._data; }

    constructor(private _torreService: DashboardService) { }

    ngOnInit() {
        // 🟢 Aseguramos la carga si la data viene dentro de widgetConfig
        if (this.widgetConfig?.data && !this._data) {
            this.data = this.widgetConfig.data;
        }
    }

    // 🟢 Toggle de enfoque: Abre o cierra el modal
    maximizarDesdeShell() {
        if (this.isEnfoque) {
            this._torreService.cerrarModoEnfoque();
        } else {
            this._torreService.abrirModoEnfoque(this.widgetConfig?.type || 'WDG_PORT_ETA_ATA', this.data);
        }
    }

    // Configuración visual
    public barChartOptions: ChartConfiguration['options'] = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    color: '#94a3b8',
                    stepSize: 0.5,
                    callback: (value) => value + 'h'
                },
                grid: { color: 'rgba(255,255,255,0.05)' },
                border: { display: false }
            },
            x: {
                ticks: { color: '#94a3b8' },
                grid: { display: false },
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
