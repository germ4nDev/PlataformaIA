/*
    Author: German Valencia
    Pattern: PORTTOS Generic Widget - Curva de Productividad (Refactorizado con Shell)
*/
import { Component, Input, ViewChild, ElementRef, AfterViewInit, OnChanges, SimpleChanges, ViewEncapsulation, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, registerables } from 'chart.js';
import { DashboardService } from 'src/app/theme/shared/service/tablero-control/dashboard.service';

// 🟢 Importamos el Shell maestro
import { WidgetShellComponent } from 'src/app/theme/shared/components/widget-shell/widget-shell.component';

Chart.register(...registerables);

@Component({
    selector: 'app-productividad-chart',
    standalone: true,
    imports: [CommonModule, WidgetShellComponent], // 🟢 Añadimos WidgetShellComponent
    templateUrl: './productividad-chart.component.html',
    styleUrls: ['./productividad-chart.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class ProductividadChartComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy {

    // 🟢 NUEVO ESTÁNDAR: Inputs requeridos por el selector dinámico
    @Input() widgetConfig: any;
    @Input() isEnfoque: boolean = false;
    @Input() mostrarTabla: boolean = false;

    public _data: any = {};
    public cargando: boolean = true;
    public legendItems: any[] = []; // Leyenda HTML personalizada
    public chartInstance: any;

    @ViewChild('productivityCanvas') productivityCanvas!: ElementRef;

    constructor(private _torreService: DashboardService) { }

    ngOnInit(): void {
        // 🟢 Inicializamos extrayendo del objeto central
        if (this.widgetConfig?.data) {
            this._data = this.widgetConfig.data;
            this.legendItems = this._data.legendItems || [
                { label: 'Planeado', borderColor: '#3b82f6' },
                { label: 'Ejecutado', borderColor: '#10b981' }
            ];
            this.cargando = false;
        }
    }

    ngAfterViewInit() {
        this.renderizarGrafica();
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['widgetConfig'] && !changes['widgetConfig'].firstChange) {
            this._data = this.widgetConfig?.data;
            this.cargando = false;
            this.renderizarGrafica();
        }
    }

    ngOnDestroy() {
        if (this.chartInstance) {
            this.chartInstance.destroy();
        }
    }

    renderizarGrafica() {
        if (!this.productivityCanvas || !this.productivityCanvas.nativeElement || this.cargando) return;

        if (this.chartInstance) {
            this.chartInstance.destroy();
        }

        // Lógica de renderizado de Chart.js (Ajusta los datos reales que uses en tu backend)
        const ctx = this.productivityCanvas.nativeElement.getContext('2d');

        this.chartInstance = new Chart(ctx, {
            type: 'line',
            data: this._data.chartData || {
                labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00'],
                datasets: [
                    { data: [25, 28, 30, 24, 26, 29], borderColor: '#10b981', tension: 0.4 },
                    { data: [22, 25, 32, 28, 25, 27], borderColor: '#3b82f6', tension: 0.4, borderDash: [5, 5] }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } }, // Ocultamos la de Chart.js porque usamos la custom
                scales: {
                    x: { grid: { display: false }, ticks: { color: '#94a3b8' }, border: { display: false } },
                    y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8' }, border: { display: false } }
                }
            }
        });
    }

    // 🟢 Toggle de enfoque: Abre o cierra el modal
    maximizarDesdeShell() {
        if (this.isEnfoque) {
            this._torreService.cerrarModoEnfoque();
        } else {
            this._torreService.abrirModoEnfoque(this.widgetConfig?.type || 'WDG_PORT_PRODUCTIVIDAD', this._data);
        }
    }
}
