/* eslint-disable @typescript-eslint/no-explicit-any */
/*
    Author: German Valencia
    Smart Widget PTT_SUE_CHRT_HISTORICO · 🗓 Histórico mensual de carga general
    Toma su parte del tablero de la pestaña (TablerosPestanasService, compartido y en vivo) y la pinta con los
    componentes comunes de widgets y PorttosChartHelper.
*/
import { ChangeDetectorRef, Component, ViewChild } from '@angular/core';
import { CommonModule, DecimalPipe, DatePipe } from '@angular/common';
import { WidgetShellComponent } from 'src/app/theme/shared/components/widget-shell/widget-shell.component';
import { DashboardService } from 'src/app/theme/shared/service/tablero-control/dashboard.service';
import { ModuloTablero, TablerosPestanasService, TableroCargaSuelta } from 'src/app/theme/shared/service/tablero-control/tableros-pestanas.service';
import { WidgetTableroBase } from '../../shared/widget-tablero.base';
import { EstadoWidgetTclComponent } from '../../shared/estado-widget-tcl/estado-widget-tcl.component';
import { GraficaTclComponent, SerieGrafica } from '../../shared/grafica-tcl/grafica-tcl.component';

@Component({
    selector: 'app-historico-suelta',
    standalone: true,
    imports: [CommonModule, DecimalPipe, DatePipe, WidgetShellComponent, EstadoWidgetTclComponent, GraficaTclComponent],
    templateUrl: './historico-suelta.component.html',
    styleUrls: ['./historico-suelta.component.scss']
})
export class HistoricoSueltaComponent extends WidgetTableroBase<TableroCargaSuelta> {
    @ViewChild(GraficaTclComponent) grafica?: GraficaTclComponent;

    readonly modulo: ModuloTablero = 'carga-suelta';
    readonly tituloDefecto = '🗓 Histórico mensual de carga general';
    override readonly subtituloDefecto = 'Supertransporte · toneladas por mes';
    override readonly iconoDefecto = 'feather icon-bar-chart-2';
    public labels: string[] = [];
    public series: SerieGrafica[] = [];
    public readonly mensajeVacio = 'Sin histórico de Supertransporte cargado para este puerto (ingesta de históricos).';

    constructor(
        tableros: TablerosPestanasService,
        torre: DashboardService,
        cdr: ChangeDetectorRef
    ) {
        super(tableros, torre, cdr);
    }

    protected alRecibir(d: TableroCargaSuelta | null): void {
        this.labels = d?.historico.labels || [];
        this.series = Object.entries(d?.historico.series || {}).map(([label, data]) => ({ label, data, color: '#f89406' }));
    }

    protected override alCambiarTamano(): void {
        this.grafica?.redibujar();
    }

}
