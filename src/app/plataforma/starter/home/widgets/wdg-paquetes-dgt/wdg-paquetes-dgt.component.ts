import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgChartsModule, BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartType } from 'chart.js';
import { DashboardPlataformaService } from 'src/app/theme/shared/service/dashboard-plataforma.service';

@Component({
    selector: 'app-wdg-paquetes-dgt',
    standalone: true,
    imports: [CommonModule, NgChartsModule],
    templateUrl: './wdg-paquetes-dgt.component.html',
    styleUrl: './wdg-paquetes-dgt.component.scss'
})
export class WdgPaquetesDgtComponent implements OnInit {
    @ViewChild(BaseChartDirective) chart?: BaseChartDirective;
    @Input() widgetId: any;
    @Input() data: any;

    // 🟢 Asegúrate de tener esta línea declarada:
    public doughnutChartType: 'doughnut' = 'doughnut';


    // Inicializamos vacío, se llenará con la base de datos
    public doughnutChartData: ChartConfiguration<'doughnut'>['data'] = {
        labels: [],
        datasets: [{
            data: [],
            // Agregamos más colores por si tienes muchos paquetes
            backgroundColor: ['#0ea5e9', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#6366f1'],
            borderWidth: 0,
            hoverOffset: 6
        }]
    };

    public doughnutChartOptions: ChartConfiguration<'doughnut'>['options'] = {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '75%',
        plugins: {
            legend: { position: 'bottom', labels: { color: '#e2e8f0', padding: 20, usePointStyle: true } },
            tooltip: { mode: 'index', intersect: false }
        }
    };

    constructor(private _dashboardService: DashboardPlataformaService) { }

    ngOnInit(): void {
        this.cargarDatos();
    }

    cargarDatos(): void {
        this._dashboardService.getChartDistribucionPaquetes().subscribe({
            next: (data: any) => {
                if (data) {
                    this.doughnutChartData.labels = data.labels;
                    this.doughnutChartData.datasets[0].data = data.values;

                    // 🟢 Obligamos a Chart.js a redibujar el canvas con los nuevos datos
                    this.chart?.update();
                }
            },
            error: (err) => console.error('Error al cargar gráfica de paquetes:', err)
        });
    }
}
