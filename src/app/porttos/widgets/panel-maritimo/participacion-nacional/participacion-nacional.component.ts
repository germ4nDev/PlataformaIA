/*
    Author: German Valencia
    Pattern: PORTTOS Generic Widget - Participación Nacional (Refactorizado con Shell)
*/
import { Component, Input, ViewChild, ElementRef, AfterViewInit, OnChanges, SimpleChanges, ViewEncapsulation, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, registerables } from 'chart.js';
import { DashboardService } from 'src/app/theme/shared/service/tablero-control/dashboard.service';

// 🟢 Importamos el Shell maestro
import { WidgetShellComponent } from 'src/app/theme/shared/components/widget-shell/widget-shell.component';

Chart.register(...registerables);

@Component({
    selector: 'app-participacion-nacional',
    standalone: true,
    imports: [CommonModule, WidgetShellComponent], // 🟢 Añadimos WidgetShellComponent
    templateUrl: './participacion-nacional.component.html',
    styleUrls: ['./participacion-nacional.component.scss'], // Corregido a styleUrls
    encapsulation: ViewEncapsulation.None
})
export class ParticipacionNacionalComponent implements OnInit, AfterViewInit, OnChanges {

    // 🟢 NUEVO ESTÁNDAR: Inputs requeridos por el selector dinámico
    @Input() widgetConfig: any;
    @Input() isEnfoque: boolean = false;
    @Input() mostrarTabla: boolean = false;

    public data: any;

    @ViewChild('donutChart') donutChart!: ElementRef;
    public chartInstance: any;

    constructor(private _torreService: DashboardService) { }

    ngOnInit(): void {
        // 🟢 Inicializamos la data desde widgetConfig
        if (this.widgetConfig?.data) {
            this.data = this.widgetConfig.data;
        }
    }

    ngAfterViewInit() {
        this.renderizarGrafica();
    }

    ngOnChanges(changes: SimpleChanges) {
        // 🟢 Reaccionamos a la data inyectada desde el widgetConfig o directamente
        if (changes['widgetConfig'] && !changes['widgetConfig'].firstChange) {
            this.data = this.widgetConfig?.data;
            this.renderizarGrafica();
        } else if (changes['data'] && !changes['data'].firstChange) {
            this.renderizarGrafica();
        }
    }

    renderizarGrafica() {
        if (!this.donutChart || !this.donutChart.nativeElement) return;

        if (this.chartInstance) {
            this.chartInstance.destroy();
        }

        const labels = this.data?.labels || ['TCBUEN', 'SPRBUN', 'AGUADULCE', 'COMPAS', 'OTROS'];
        const valores = this.data?.valores || [35, 30, 20, 10, 5];

        this.chartInstance = new Chart(this.donutChart.nativeElement, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: valores,
                    backgroundColor: ['#3b82f6', '#0ea5e9', '#f59e0b', '#ef4444', '#10b981'],
                    borderWidth: 0,
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '45%',
                plugins: {
                    legend: {
                        display: true,
                        position: 'bottom',
                        labels: {
                            color: '#94a3b8', // Color más sutil para texto en modo oscuro
                            usePointStyle: true,
                            pointStyle: 'rect',
                            padding: 20,
                            font: {
                                size: 10,
                                weight: 'bold'
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => ` ${context.label}: ${context.raw}%`
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
            this._torreService.abrirModoEnfoque(this.widgetConfig?.type || 'WDG_PORT_PARTICIPACION', this.data);
        }
    }
}
