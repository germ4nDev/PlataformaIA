import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgChartsModule, BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartType } from 'chart.js';
import { DashboardPlataformaService } from 'src/app/theme/shared/service/dashboard-plataforma.service';

// 🟢 Importamos el contenedor maestro universal
import { WidgetShellComponent } from 'src/app/theme/shared/components/widget-shell/widget-shell.component';

@Component({
    selector: 'app-wdg-tickets-sbar',
    standalone: true,
    imports: [CommonModule, NgChartsModule, WidgetShellComponent], // 🟢 Agregamos el Shell
    templateUrl: './wdg-tickets-sbar.component.html',
    styleUrl: './wdg-tickets-sbar.component.scss'
})
export class WdgTicketsSbarComponent implements OnInit {
    @ViewChild(BaseChartDirective) chart?: BaseChartDirective;

    // 🟢 Fallback de seguridad
    @Input() widgetId: string = 'WDG_PLAT_TICKETS_SBAR';
    @Input() data: any;

    public barChartType: 'bar' = 'bar';

    public barChartData: ChartConfiguration<'bar'>['data'] = {
        labels: [],
        datasets: [
            { label: 'Resueltos', data: [], backgroundColor: '#10b981', borderRadius: 4 },
            { label: 'En Progreso', data: [], backgroundColor: '#f59e0b', borderRadius: 4 },
            { label: 'Abiertos', data: [], backgroundColor: '#ef4444', borderRadius: 4 }
        ]
    };

    public barChartOptions: ChartConfiguration<'bar'>['options'] = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            x: {
                stacked: true,
                grid: { display: false },
                // 🟢 Ajustamos el color del texto al tema claro
                ticks: { color: '#64748b', font: { size: 11 } }
            },
            y: {
                stacked: true,
                border: { display: false },
                // 🟢 Ajustamos las líneas de fondo (grilla) a un gris muy sutil
                grid: { color: 'rgba(0,0,0,0.05)' },
                ticks: { color: '#64748b' }
            }
        },
        plugins: {
            // 🟢 Ajustamos el texto de la leyenda al tema claro
            legend: { position: 'top', align: 'end', labels: { color: '#64748b', usePointStyle: true, boxWidth: 8 } },
            tooltip: { mode: 'index', intersect: false }
        }
    };

    constructor(private _dashboardService: DashboardPlataformaService) { }

    ngOnInit(): void {
        this.cargarDatos();
    }

    cargarDatos(): void {
        this._dashboardService.getChartEstadoTickets().subscribe({
            next: (data: any) => {
                if (data) {
                    this.barChartData.labels = data.labels;
                    this.barChartData.datasets[0].data = data.resueltos;
                    this.barChartData.datasets[1].data = data.enProgreso;
                    this.barChartData.datasets[2].data = data.abiertos;

                    this.chart?.update();
                }
            },
            error: (err: any) => console.error('Error al cargar gráfica de tickets:', err)
        });
    }
}
