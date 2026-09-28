/*
    Author: German Valencia
    Pattern: PORTTOS Generic Widget - Tipo de Operación (Refactorizado con Shell)
*/
import { Component, Input, ViewChild, ElementRef, AfterViewInit, OnChanges, SimpleChanges, ViewEncapsulation, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, registerables } from 'chart.js';
import { DashboardService } from 'src/app/theme/shared/service/tablero-control/dashboard.service';

// 🟢 Importamos el Shell maestro
import { WidgetShellComponent } from 'src/app/theme/shared/components/widget-shell/widget-shell.component';

Chart.register(...registerables);

@Component({
    selector: 'app-tipo-operacion',
    standalone: true,
    imports: [CommonModule, WidgetShellComponent], // 🟢 Añadimos WidgetShellComponent
    templateUrl: './tipo-operacion.component.html',
    styleUrls: ['./tipo-operacion.component.scss'], // Corregido a styleUrls
    encapsulation: ViewEncapsulation.None
})
export class TipoOperacionComponent implements OnInit, AfterViewInit, OnChanges {

    // 🟢 NUEVO ESTÁNDAR: Inputs requeridos por el selector dinámico
    @Input() widgetConfig: any;
    @Input() isEnfoque: boolean = false;
    @Input() mostrarTabla: boolean = false;

    public data: any = {};

    @ViewChild('opsChart') opsChart!: ElementRef;
    public chartInstance: any;

    constructor(private _torreService: DashboardService) { }

    ngOnInit(): void {
        // 🟢 Inicializamos extrayendo del objeto central
        if (this.widgetConfig?.data) {
            this.data = this.widgetConfig.data;
        }
    }

    ngAfterViewInit() {
        this.renderizar();
    }

    ngOnChanges(changes: SimpleChanges) {
        // 🟢 Reaccionamos a los cambios del widgetConfig o inyección directa
        if (changes['widgetConfig'] && !changes['widgetConfig'].firstChange) {
            this.data = this.widgetConfig?.data;
            this.renderizar();
        } else if (changes['data'] && !changes['data'].firstChange) {
            this.renderizar();
        }
    }

    renderizar() {
        if (!this.opsChart || !this.opsChart.nativeElement) return;
        if (this.chartInstance) this.chartInstance.destroy();

        const labels = this.data?.labels || ['Importación', 'Exportación', 'Transbordo', 'Cabotaje'];
        const valores = this.data?.valores || [45, 30, 15, 10];

        this.chartInstance = new Chart(this.opsChart.nativeElement, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: valores,
                    // Tonos Cyan, Azul, Púrpura consistentes con el diseño original
                    backgroundColor: ['#06b6d4', '#3b82f6', '#8b5cf6', '#a78bfa'],
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
                        position: 'bottom',
                        labels: {
                            color: '#94a3b8', // 🟢 Gris sutil para modo oscuro
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
            this._torreService.abrirModoEnfoque(this.widgetConfig?.type || 'WDG_PORT_TIPO_OPERACION', this.data);
        }
    }
}
