import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgChartsModule, BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';
import { DashboardPlataformaService } from 'src/app/theme/shared/service/dashboard-plataforma.service';

// 🟢 Importamos el contenedor maestro universal
import { WidgetShellComponent } from 'src/app/theme/shared/components/widget-shell/widget-shell.component';

@Component({
    selector: 'app-wdg-tickets-sbar',
    standalone: true,
    imports: [CommonModule, NgChartsModule, WidgetShellComponent],
    templateUrl: './wdg-tickets-sbar.component.html',
    styleUrls: ['./wdg-tickets-sbar.component.scss']
})
export class WdgTicketsSbarComponent implements OnInit {
    @ViewChild(BaseChartDirective) chart?: BaseChartDirective;

    // 🟢 NUEVO ESTÁNDAR: Recibimos la config completa del selector
    @Input() widgetConfig: any;
    @Input() isEnfoque: boolean = false;

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
                // 🟢 Ajustamos el color del texto para el tema oscuro
                ticks: { color: '#94a3b8', font: { size: 11 } }
            },
            y: {
                stacked: true,
                border: { display: false },
                // 🟢 Líneas de fondo ajustadas a modo oscuro
                grid: { color: 'rgba(255,255,255,0.05)' },
                ticks: { color: '#94a3b8' }
            }
        },
        plugins: {
            // 🟢 Ajustamos el texto de la leyenda al tema oscuro
            legend: { position: 'top', align: 'end', labels: { color: '#e2e8f0', usePointStyle: true, boxWidth: 8 } },
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

    // 🟢 Función para comunicar el enfoque al padre
    maximizarDesdeShell() {
        if (typeof (this._dashboardService as any).abrirModoEnfoque === 'function') {
            (this._dashboardService as any).abrirModoEnfoque(
                this.widgetConfig?.type || 'WDG_PLAT_TICKETS_SBAR',
                this.barChartData
            );
        }
    }
}
