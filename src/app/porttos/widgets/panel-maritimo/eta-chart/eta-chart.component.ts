/*
    Author: German Valencia
    Pattern: PORTTOS Generic Widget - Reporte ETA vs ATA (Refactorizado)
*/
import { Component, Input, OnInit, OnChanges, SimpleChanges, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgChartsModule, BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';
import { DashboardService } from 'src/app/theme/shared/service/tablero-control/dashboard.service';
import { WidgetShellComponent } from 'src/app/theme/shared/components/widget-shell/widget-shell.component';

@Component({
    selector: 'app-eta-chart',
    standalone: true,
    imports: [CommonModule, NgChartsModule, WidgetShellComponent],
    templateUrl: './eta-chart.component.html',
    styleUrls: ['./eta-chart.component.scss']
})
export class EtaChartComponent implements OnInit, OnChanges {

    @Input() widgetConfig: any;
    @Input() isEnfoque: boolean = false;
    @Input() mostrarTabla: boolean = false;

    // 🚀 Referencia al canvas para forzar actualización
    @ViewChild(BaseChartDirective) chart: BaseChartDirective | undefined;

    private _data: any;
    public cargando: boolean = true;
    public isLoading: boolean = false;

    @Input() set data(value: any) {
        this._data = value;
        if (value && value.labels) {
            this.cargando = false;
            this.barChartData = {
                labels: value.labels,
                datasets: value.datasets
            };
            // Si el chart ya existe, lo actualizamos al recibir nueva data
            if (this.chart) {
                this.chart.update();
            }
        }
    }

    get data(): any { return this._data; }

    constructor(private _torreService: DashboardService) { }

    ngOnInit() {
        if (this.widgetConfig?.data && !this._data) {
            this.data = this.widgetConfig.data;
        }
    }

    // 🟢 Escuchamos cambios para forzar el re-render del Chart al maximizar
    ngOnChanges(changes: SimpleChanges): void {
        if (changes['isEnfoque'] && !changes['isEnfoque'].firstChange) {
            // Un pequeño delay para que Angular dibuje el div gigante antes de pedirle al chart que se ajuste
            setTimeout(() => {
                if (this.chart) {
                    this.chart.render();
                }
            }, 100);
        }
    }

    maximizarDesdeShell() {
        // Tu misma lógica (El servicio se encarga de inyectar isEnfoque)
        if (this.isEnfoque) {
            this._torreService.cerrarModoEnfoque();
        } else {
            this._torreService.abrirModoEnfoque(this.widgetConfig?.type || 'WDG_PORT_ETA_ATA', this.data);
        }
    }

    // --- CONFIGURACIÓN DE CHART.JS ---
    public barChartOptions: ChartConfiguration['options'] = {
        responsive: true,
        maintainAspectRatio: false, // 🚀 Clave para que se estire al maximizar
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
