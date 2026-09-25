/*
    Author: German Valencia
    Pattern: PORTTOS Generic Widget - Análisis de Tráfico (Refactorizado con Shell)
*/
import { Component, Input, ViewEncapsulation, ElementRef, ViewChild, AfterViewInit, OnChanges, SimpleChanges, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardService } from 'src/app/theme/shared/service/tablero-control/dashboard.service';
import Chart from 'chart.js/auto';

// 🟢 Importamos el Shell maestro
import { WidgetShellComponent } from 'src/app/theme/shared/components/widget-shell/widget-shell.component';

@Component({
    selector: 'app-analisis-trafico',
    standalone: true,
    imports: [CommonModule, WidgetShellComponent], // 🟢 Añadimos WidgetShellComponent
    templateUrl: './analisis-trafico.component.html',
    styleUrls: ['./analisis-trafico.component.scss'], // Corregido a styleUrls
    encapsulation: ViewEncapsulation.None
})
export class AnalisisTraficoComponent implements OnInit, AfterViewInit, OnChanges {

    // 🟢 NUEVO ESTÁNDAR: Inputs requeridos por el selector dinámico
    @Input() widgetConfig: any;
    @Input() isEnfoque: boolean = false;
    @Input() mostrarTabla: boolean = false;

    public data: any; // Mantenemos la variable local para facilidad de uso
    public chartInstance: any;

    @ViewChild('trafficChart') trafficChart!: ElementRef;

    constructor(private _torreService: DashboardService) { }

    ngOnInit(): void {
        if (this.widgetConfig?.data) {
            this.data = this.widgetConfig.data;
        }
    }

    ngAfterViewInit() {
        this.renderizarGrafica();
    }

    ngOnChanges(changes: SimpleChanges) {
        // 🟢 Reaccionamos a los cambios del widgetConfig que inyecta el selector
        if (changes['widgetConfig'] && !changes['widgetConfig'].firstChange) {
            this.data = this.widgetConfig?.data;
            this.renderizarGrafica();
        }
    }

    renderizarGrafica() {
        if (!this.data || !this.data.chartEvolucion || !this.trafficChart) return;

        if (this.chartInstance) {
            this.chartInstance.destroy();
        }

        const ctx = this.trafficChart.nativeElement.getContext('2d');

        this.chartInstance = new Chart(ctx, {
            type: 'bar',
            data: this.data.chartEvolucion,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { color: '#94a3b8', usePointStyle: true, boxWidth: 8, font: { size: 11 } }
                    },
                    tooltip: { mode: 'index', intersect: false }
                },
                scales: {
                    x: {
                        stacked: true,
                        grid: { display: false },
                        ticks: { color: '#94a3b8' },
                        border: { display: false }
                    },
                    y: {
                        stacked: true,
                        grid: { color: 'rgba(255, 255, 255, 0.05)' },
                        border: { display: false },
                        ticks: {
                            color: '#94a3b8',
                            callback: function (value) {
                                if (Number(value) >= 1000000) return (Number(value) / 1000000) + 'M';
                                if (Number(value) >= 1000) return (Number(value) / 1000) + 'K';
                                return value;
                            }
                        }
                    }
                }
            }
        });
    }

    // 🟢 Toggle de enfoque: Abre o cierra el modal
    maximizarDesdeShell() {
        if (this.isEnfoque) {
            this._torreService.cerrarModoEnfoque();
        } else {
            this._torreService.abrirModoEnfoque(this.widgetConfig?.type || 'WDG_PORT_ANALISIS_TRAFICO', this.data);
        }
    }
}
