/*
    Author: German Valencia
    Pattern: PORTTOS Generic Widget - Mezcla de Carga (Refactorizado con Shell)
*/
import { Component, Input, ViewChild, ElementRef, AfterViewInit, OnChanges, SimpleChanges, ViewEncapsulation, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, registerables } from 'chart.js';
import { DashboardService } from 'src/app/theme/shared/service/tablero-control/dashboard.service';
import { LocalStorageService, ThemeService } from 'src/app/theme/shared/service';
import { Subscription } from 'rxjs';

// 🟢 Importamos el Shell maestro
import { WidgetShellComponent } from 'src/app/theme/shared/components/widget-shell/widget-shell.component';

Chart.register(...registerables);

@Component({
    selector: 'app-mezcla-carga',
    standalone: true,
    imports: [CommonModule, WidgetShellComponent], // 🟢 Añadimos WidgetShellComponent
    templateUrl: './mezcla-carga.component.html',
    styleUrls: ['./mezcla-carga.component.scss'], // Corregido a styleUrls
    encapsulation: ViewEncapsulation.None
})
export class MezclaCargaComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy {

    // 🟢 NUEVO ESTÁNDAR: Inputs requeridos por el selector dinámico
    @Input() widgetConfig: any;
    @Input() isEnfoque: boolean = false;
    @Input() mostrarTabla: boolean = false;

    public data: any;
    @ViewChild('barChart') barChart!: ElementRef;

    private themeSub: Subscription = new Subscription();
    public chartInstance: any;
    public themeSettings: any;

    constructor(
        private _torreService: DashboardService,
        private _localStorageService: LocalStorageService,
        private _themeService: ThemeService
    ) { }

    ngOnInit(): void {
        // 🟢 Extraemos la data desde la configuración dinámica
        if (this.widgetConfig?.data) {
            this.data = this.widgetConfig.data;
        }

        this.themeSettings = this._localStorageService.getThemeSettings();

        // Suscripción centralizada al cambio de tema
        this.themeSub = this._themeService.isDarkTheme$.subscribe(() => {
            this.themeSettings = this._localStorageService.getThemeSettings(); // Actualizamos variables
            this.renderizarGrafica();
        });
    }

    ngAfterViewInit() {
        this.renderizarGrafica();
    }

    ngOnChanges(changes: SimpleChanges) {
        // 🟢 Reaccionamos a la data inyectada desde el widgetConfig
        if (changes['widgetConfig'] && !changes['widgetConfig'].firstChange) {
            this.data = this.widgetConfig?.data;
            this.renderizarGrafica();
        } else if (changes['data'] && !changes['data'].firstChange) {
            this.renderizarGrafica();
        }
    }

    ngOnDestroy(): void {
        if (this.themeSub) {
            this.themeSub.unsubscribe();
        }
        if (this.chartInstance) {
            this.chartInstance.destroy();
        }
    }

    renderizarGrafica() {
        if (!this.barChart || !this.barChart.nativeElement) return;

        if (this.chartInstance) {
            this.chartInstance.destroy();
        }

        let colorTexto = '#ffffff';
        let colorSubtitulo = '#a0a0a0';
        let colorGrid = 'rgba(255,255,255,0.1)';

        if (this.themeSettings?.isDarkTheme) {
            colorTexto = '#b4b4b4';
            colorSubtitulo = '#9c9c9c';
            colorGrid = 'rgba(255,255,255,0.05)'; // 🟢 Ajustado a un color más sutil
        } else {
            colorTexto = '#212529';
            colorSubtitulo = '#464e57';
            colorGrid = '#e6e6e6';
        }

        const labels = this.data?.labels || ['Contenedores', 'Granel sólido', 'General/vehíc.', 'Granel líquido', 'Carbón'];
        const valores = this.data?.valores || [13.5, 5.8, 1.8, 0.8, 0.6];
        const colores = ['#3b82f6', '#10b981', '#fab131', '#06b6d4', '#8c6e5c'];

        this.chartInstance = new Chart(this.barChart.nativeElement, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    data: valores,
                    backgroundColor: colores,
                    borderWidth: 0,
                    borderRadius: 2,
                    barThickness: 24 // 🟢 Un poco más finas para estilizar
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: (context) => ` ${context.raw} Mt`
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { color: colorGrid },
                        border: { display: false }, // 🟢 Oculta la línea del eje
                        ticks: {
                            color: colorSubtitulo,
                            font: { size: 10 },
                            callback: (value) => value + ' Mt'
                        }
                    },
                    y: {
                        grid: { display: false },
                        border: { display: false }, // 🟢 Oculta la línea del eje
                        ticks: {
                            color: colorTexto,
                            font: { size: 11, weight: 'bold' }
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
            this._torreService.abrirModoEnfoque(this.widgetConfig?.type || 'WDG_PORT_MEZCLA_CARGA', this.data);
        }
    }
}
