import { Component, Input, ViewChild, ViewEncapsulation, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IWidget } from 'src/app/theme/shared/interfaces/torre-control/widget.interface';
import { DashboardService } from 'src/app/theme/shared/service/tablero-control/dashboard.service';
import { BaseChartDirective, NgChartsModule } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';

@Component({
    selector: 'app-resumen-semanal',
    standalone: true,
    imports: [CommonModule, NgChartsModule],
    templateUrl: './resumen-semanal.component.html',
    styleUrl: './resumen-semanal.component.scss',
    encapsulation: ViewEncapsulation.None
})
export class ResumenSemanalComponent implements IWidget, OnChanges {
    @ViewChild(BaseChartDirective) chart?: BaseChartDirective;

    @Input() data: any;
    @Input() title: string = '';
    @Input() widgetId?: string;
    @Input() isEnfoque: boolean = false;
    @Input() mostrarTabla: boolean = false;

    public listaArribos: any[] = [];
    public barChartOptions: ChartConfiguration['options'] = {
        responsive: true,
        maintainAspectRatio: false
    };
    public barChartData: ChartConfiguration['data'] = { datasets: [], labels: [] };

    constructor(private _torreService: DashboardService) { }

    ngOnChanges(changes: SimpleChanges): void {
        if (this.data && (this.data.arribos || this.data.listado)) {
            this.listaArribos = this.data.arribos || this.data.listado || [];

            // Safe assignment to prevent undefined errors if datasets are missing
            if (this.data.labels && this.data.datasets?.length > 0) {
                this.barChartData = {
                    labels: this.data.labels,
                    datasets: [{
                        data: this.data.datasets[0].data || [],
                        label: 'Arribos',
                        backgroundColor: '#3b82f6'
                    }]
                };
            }
        }
    }

    maximizar(): void {
        if (this.widgetId) {
            this._torreService.abrirModoEnfoque(this.widgetId, this.data);
        }
    }

    public toggleVista(): void {
        this.mostrarTabla = !this.mostrarTabla;

        // Timeout is standard for ng2-charts to ensure the canvas exists in the DOM
        // before attempting to run the update method.
        if (!this.mostrarTabla) {
            setTimeout(() => {
                if (this.chart) {
                    this.chart.update();
                }
            });
        }
    }
}
