/*
    Author: German Valencia
    Pattern: PORTTOS Generic Widget - Barras Apiladas (Refactorizado con Shell)
*/
import { Component, Input, OnInit, OnChanges, SimpleChanges, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgChartsModule } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';
import { DashboardService } from 'src/app/theme/shared/service/tablero-control/dashboard.service';

// 🟢 Importamos el Shell maestro
import { WidgetShellComponent } from 'src/app/theme/shared/components/widget-shell/widget-shell.component';

@Component({
    selector: 'app-chart-stacked-bar',
    standalone: true,
    imports: [CommonModule, NgChartsModule, WidgetShellComponent], // 🟢 Añadimos WidgetShellComponent
    templateUrl: './chart-stacked-bar.component.html',
    styleUrls: ['./chart-stacked-bar.component.scss'], // Corregido a styleUrls
    encapsulation: ViewEncapsulation.None
})
export class ChartStackedBarComponent implements OnInit, OnChanges {

    // 🟢 NUEVO ESTÁNDAR
    @Input() widgetConfig: any;
    @Input() isEnfoque: boolean = false;
    @Input() mostrarTabla: boolean = false;

    public data: any = {};
    public cargando: boolean = true;
    public barChartData!: ChartData<'bar'>;

    public barChartOptions: ChartConfiguration['options'] = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            x: {
                stacked: true, // Habilitar apilamiento en X
                ticks: { color: '#94a3b8' },
                grid: { display: false },
                border: { display: false }
            },
            y: {
                stacked: true, // Habilitar apilamiento en Y
                beginAtZero: true,
                ticks: { color: '#94a3b8' },
                grid: { color: 'rgba(255,255,255,0.05)' },
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

    constructor(private _torreService: DashboardService) { }

    ngOnInit(): void {
        if (this.widgetConfig?.data) {
            this.procesarData(this.widgetConfig.data);
        }
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['widgetConfig'] && !changes['widgetConfig'].firstChange) {
            this.procesarData(this.widgetConfig?.data);
        } else if (changes['data'] && !changes['data'].firstChange) {
            // Soporte legacy por si se inyecta la data directamente
            this.procesarData(changes['data'].currentValue);
        }
    }

    private procesarData(value: any) {
        if (!value) return;
        this.data = value;

        // Verificamos si la data general (el objeto resumen) ya llegó desde la API
        if (value.resumen || value.citasPorHora) {
            this.cargando = false;

            const citasData = value.resumen?.citasPorHora || value.citasPorHora;
            const colors = ['#0ea5e9', '#8b5cf6', '#14b8a6']; // Azul, Morado, Verde

            if (citasData && citasData.series && citasData.categorias) {
                // 🟢 PLAN A: El backend mandó la data correctamente
                this.barChartData = {
                    labels: [...citasData.categorias],
                    datasets: citasData.series.map((serie: any, index: number) => ({
                        label: serie.name,
                        data: [...serie.data],
                        backgroundColor: colors[index % colors.length],
                        stack: 'Stack 0',
                        borderRadius: 2
                    }))
                };
            } else {
                // 🟢 PLAN B (Fallback): Falta el nodo, usamos Mock de proyecciones
                console.warn('⚠️ Falta el nodo citasPorHora en Node.js, usando Mock de proyecciones.');

                const mockCategorias = ['18h', '19h', '20h', '21h', '22h', '23h', '0h', '1h', '2h', '3h', '4h', '5h'];
                const mockSeries = [
                    { name: 'SPRBUN', data: [25, 45, 60, 80, 55, 40, 45, 65, 55, 45, 30, 25] },
                    { name: 'TCBUEN', data: [15, 30, 40, 50, 45, 30, 30, 35, 35, 25, 20, 15] },
                    { name: 'Aguadulce', data: [15, 20, 35, 45, 30, 20, 25, 25, 20, 15, 10, 10] }
                ];

                this.barChartData = {
                    labels: mockCategorias,
                    datasets: mockSeries.map((serie: any, index: number) => ({
                        label: serie.name,
                        data: serie.data,
                        backgroundColor: colors[index % colors.length],
                        stack: 'Stack 0',
                        borderRadius: 2
                    }))
                };
            }
        }
    }

    maximizarDesdeShell() {
        if (this.isEnfoque) {
            this._torreService.cerrarModoEnfoque();
        } else {
            this._torreService.abrirModoEnfoque(this.widgetConfig?.type || 'WDG_PORT_CITAS_12H', this.data);
        }
    }
}
