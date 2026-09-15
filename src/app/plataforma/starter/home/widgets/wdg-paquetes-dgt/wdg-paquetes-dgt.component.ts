import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgChartsModule, BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartType } from 'chart.js';
import { DashboardPlataformaService } from 'src/app/theme/shared/service/dashboard-plataforma.service';

// 🟢 Importamos el contenedor maestro universal
import { WidgetShellComponent } from 'src/app/theme/shared/components/widget-shell/widget-shell.component';

@Component({
    selector: 'app-wdg-paquetes-dgt',
    standalone: true,
    imports: [CommonModule, NgChartsModule, WidgetShellComponent], // 🟢 Agregamos el Shell
    templateUrl: './wdg-paquetes-dgt.component.html',
    styleUrl: './wdg-paquetes-dgt.component.scss'
})
export class WdgPaquetesDgtComponent implements OnInit {
    @ViewChild(BaseChartDirective) chart?: BaseChartDirective;

    // 🟢 Fallback de seguridad
    @Input() widgetId: string = 'WDG_PLAT_PAQUETES_DGT';
    @Input() data: any;

    public doughnutChartType: 'doughnut' = 'doughnut';

    public doughnutChartData: ChartConfiguration<'doughnut'>['data'] = {
        labels: [],
        datasets: [{
            data: [],
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
            // 🟢 Ajustamos el color de la leyenda a oscuro (#64748b) para contrastar con el fondo blanco
            legend: { position: 'bottom', labels: { color: '#64748b', padding: 20, usePointStyle: true } },
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
                    this.chart?.update();
                }
            },
            error: (err) => console.error('Error al cargar gráfica de paquetes:', err)
        });
    }
}
