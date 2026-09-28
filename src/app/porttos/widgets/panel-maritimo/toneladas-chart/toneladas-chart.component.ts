/*
    Author: German Valencia
    Pattern: PORTTOS Generic Widget - Toneladas Movidas Hoy (Refactorizado con Shell)
*/
import { Component, Input, OnChanges, SimpleChanges, ViewEncapsulation, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgChartsModule } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';
import { DashboardService } from 'src/app/theme/shared/service/tablero-control/dashboard.service';

// 🟢 Importamos el Shell maestro
import { WidgetShellComponent } from 'src/app/theme/shared/components/widget-shell/widget-shell.component';

@Component({
    selector: 'app-toneladas-chart',
    standalone: true,
    imports: [CommonModule, NgChartsModule, WidgetShellComponent], // 🟢 Añadimos WidgetShellComponent
    templateUrl: './toneladas-chart.component.html',
    styleUrls: ['./toneladas-chart.component.scss'], // Corregido a styleUrls
    encapsulation: ViewEncapsulation.None
})
export class ToneladasChartComponent implements OnInit, OnChanges {

    // 🟢 NUEVO ESTÁNDAR
    @Input() widgetConfig: any;
    @Input() isEnfoque: boolean = false;
    @Input() mostrarTabla: boolean = false;

    public data: any = {};
    public barChartData!: ChartData<'bar'>;

    // Opciones estandarizadas para modo oscuro (ya las tenías perfectas)
    public barChartOptions: ChartConfiguration['options'] = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            x: { stacked: true, ticks: { color: '#94a3b8' }, grid: { display: false }, border: { display: false } },
            y: {
                stacked: true,
                ticks: { color: '#94a3b8', callback: function (value) { return value.toLocaleString('en-US'); } },
                grid: { color: 'rgba(255,255,255,0.05)' },
                border: { display: false }
            }
        },
        plugins: {
            legend: { position: 'top', labels: { color: '#94a3b8', font: { size: 10 }, usePointStyle: true, pointStyle: 'circle' } }
        }
    };

    constructor(private _torreService: DashboardService) { }

    ngOnInit(): void {
        if (this.widgetConfig?.data) {
            this.procesarData(this.widgetConfig.data);
        }
    }

    ngOnChanges(changes: SimpleChanges) {
        // 🟢 Reaccionamos al nuevo estándar o a una inyección directa
        if (changes['widgetConfig'] && !changes['widgetConfig'].firstChange) {
            this.procesarData(this.widgetConfig?.data);
        } else if (changes['data'] && !changes['data'].firstChange) {
            this.procesarData(changes['data'].currentValue);
        }
    }

    private procesarData(newData: any) {
        if (!newData) return;
        this.data = newData;

        if (this.data.labels && this.data.datasets) {
            // Asignamos la data forzando una nueva referencia para que ng2-charts reaccione
            this.barChartData = {
                labels: [...this.data.labels],
                datasets: [...this.data.datasets]
            };
        }
    }

    // 🟢 Toggle de enfoque: Abre o cierra el modal
    maximizarDesdeShell() {
        if (this.isEnfoque) {
            this._torreService.cerrarModoEnfoque();
        } else {
            this._torreService.abrirModoEnfoque(this.widgetConfig?.type || 'WDG_PORT_TONELADAS', this.data);
        }
    }
}
