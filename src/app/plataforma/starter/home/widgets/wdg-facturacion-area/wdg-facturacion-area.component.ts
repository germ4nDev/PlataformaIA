import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgChartsModule, BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartType } from 'chart.js';
import { DashboardPlataformaService } from 'src/app/theme/shared/service/dashboard-plataforma.service';
import { WidgetShellComponent } from 'src/app/theme/shared/components/widget-shell/widget-shell.component';

@Component({
    selector: 'app-wdg-facturacion-area',
    standalone: true,
    imports: [CommonModule, NgChartsModule, WidgetShellComponent],
    templateUrl: './wdg-facturacion-area.component.html',
    styleUrl: './wdg-facturacion-area.component.scss'
})
export class WdgFacturacionAreaComponent implements OnInit {
    @ViewChild(BaseChartDirective) chart?: BaseChartDirective;

    // 🟢 Le damos un valor por defecto por si Angular tarda en pasar el Input
    @Input() widgetId: string = 'WDG_PLAT_FACTURACION_AREA';
    @Input() data: any;

    public lineChartType: 'line' = 'line';

    public lineChartData: ChartConfiguration<'line'>['data'] = {
        labels: [],
        datasets: [
            {
                label: 'Licencias Anuales',
                data: [],
                borderColor: '#3b82f6', backgroundColor: 'rgba(59, 130, 246, 0.3)',
                fill: true, tension: 0.4, pointRadius: 0, pointHoverRadius: 6
            },
            {
                label: 'Renovaciones Sem./Trim.',
                data: [],
                borderColor: '#8b5cf6', backgroundColor: 'rgba(139, 92, 246, 0.3)',
                fill: true, tension: 0.4, pointRadius: 0, pointHoverRadius: 6
            },
            {
                label: 'Suscripciones Mensuales',
                data: [],
                borderColor: '#ec4899', backgroundColor: 'rgba(236, 72, 153, 0.3)',
                fill: true, tension: 0.4, pointRadius: 0, pointHoverRadius: 6
            }
        ]
    };

    public lineChartOptions: ChartConfiguration<'line'>['options'] = {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        scales: {
            x: {
                grid: { display: false },
                ticks: { color: '#94a3b8' }
            },
            y: {
                stacked: true,
                border: { display: false },
                grid: { color: 'rgba(255,255,255,0.05)' },
                ticks: {
                    color: '#94a3b8',
                    callback: (value) => `$${value}k`
                }
            }
        },
        plugins: {
            legend: { position: 'top', align: 'end', labels: { color: '#e2e8f0', usePointStyle: true, boxWidth: 8 } },
            tooltip: {
                callbacks: {
                    label: (context) => ` ${context.dataset.label}: $${context.parsed.y}k`
                }
            }
        }
    };

    constructor(private _dashboardService: DashboardPlataformaService) { }

    ngOnInit(): void {
        this.cargarDatos();
    }

    cargarDatos(): void {
        this._dashboardService.getChartFacturacionMRR().subscribe({
            next: (data: any) => {
                if (data) {
                    this.lineChartData.labels = data.labels;
                    this.lineChartData.datasets[0].data = data.anuales;
                    this.lineChartData.datasets[1].data = data.intermedios;
                    this.lineChartData.datasets[2].data = data.mensuales;
                    this.chart?.update();
                }
            },
            error: (err: any) => console.error('Error al cargar gráfica de facturación MRR:', err)
        });
    }
}
