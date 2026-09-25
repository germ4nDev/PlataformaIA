import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgChartsModule, BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';
import { DashboardPlataformaService } from 'src/app/theme/shared/service/dashboard-plataforma.service';

// 🟢 Importamos el contenedor maestro universal
import { WidgetShellComponent } from 'src/app/theme/shared/components/widget-shell/widget-shell.component';

@Component({
    selector: 'app-wdg-paquetes-dgt',
    standalone: true,
    imports: [CommonModule, NgChartsModule, WidgetShellComponent],
    templateUrl: './wdg-paquetes-dgt.component.html',
    styleUrls: ['./wdg-paquetes-dgt.component.scss'] // Corregido a styleUrls
})
export class WdgPaquetesDgtComponent implements OnInit {
    @ViewChild(BaseChartDirective) chart?: BaseChartDirective;

    // 🟢 NUEVO ESTÁNDAR: Recibimos la config completa del selector
    @Input() widgetConfig: any;
    @Input() isEnfoque: boolean = false;

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
            // 🟢 Ajustado el color a #94a3b8 para que se vea bien en el modo oscuro del Shell
            legend: { position: 'bottom', labels: { color: '#94a3b8', padding: 20, usePointStyle: true } },
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

    // 🟢 Función para comunicar el enfoque
    maximizarDesdeShell() {
        if (typeof (this._dashboardService as any).abrirModoEnfoque === 'function') {
            (this._dashboardService as any).abrirModoEnfoque(
                this.widgetConfig?.type || 'WDG_PLAT_PAQUETES_DGT',
                this.doughnutChartData
            );
        }
    }
}
