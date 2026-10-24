/* eslint-disable @typescript-eslint/no-explicit-any */
/*
    Author: German Valencia
    Smart Widget PTT_GRA_CHRT_HISTORICO · 🗓 Histórico mensual de granel
    Toma su parte del tablero de la pestaña (TablerosPestanasService, compartido y en vivo) y la pinta con los
    componentes comunes de widgets y PorttosChartHelper.
*/
import { ChangeDetectorRef, Component, ViewChild } from '@angular/core';
import { CommonModule, DecimalPipe, DatePipe } from '@angular/common';
import { WidgetShellComponent } from 'src/app/theme/shared/components/widget-shell/widget-shell.component';
import { DashboardService } from 'src/app/theme/shared/service/tablero-control/dashboard.service';
import { ModuloTablero, TablerosPestanasService, TableroGranel } from 'src/app/theme/shared/service/tablero-control/tableros-pestanas.service';
import { WidgetTableroBase } from '../../shared/widget-tablero.base';
import { EstadoWidgetTclComponent } from '../../shared/estado-widget-tcl/estado-widget-tcl.component';
import { GraficaTclComponent, SerieGrafica } from '../../shared/grafica-tcl/grafica-tcl.component';

@Component({
    selector: 'app-historico-granel',
    standalone: true,
    imports: [CommonModule, DecimalPipe, DatePipe, WidgetShellComponent, EstadoWidgetTclComponent, GraficaTclComponent],
    templateUrl: './historico-granel.component.html',
    styleUrls: ['./historico-granel.component.scss']
})
export class HistoricoGranelComponent extends WidgetTableroBase<TableroGranel> {
    @ViewChild(GraficaTclComponent) grafica?: GraficaTclComponent;

    readonly modulo: ModuloTablero = 'granel';
    readonly tituloDefecto = '🗓 Histórico mensual de granel';
    override readonly subtituloDefecto = 'Supertransporte · toneladas por mes';
    override readonly iconoDefecto = 'feather icon-bar-chart-2';
    public labels: string[] = [];
    public series: SerieGrafica[] = [];
    public readonly mensajeVacio = 'Sin histórico de Supertransporte cargado para este puerto (ingesta de históricos).';
    private readonly colores = ['#51a351', '#2f96b4', '#6b7280'];

    constructor(tableros: TablerosPestanasService, torre: DashboardService, cdr: ChangeDetectorRef) {
        super(tableros, torre, cdr);
    }

    protected alRecibir(d: TableroGranel | null): void {
        this.labels = d?.historico.labels || [];
        this.series = Object.entries(d?.historico.series || {}).map(([label, data], i) => ({ label, data, color: this.colores[i % this.colores.length] }));
    }

    protected override alCambiarTamano(): void {
        this.grafica?.redibujar();
    }

}
