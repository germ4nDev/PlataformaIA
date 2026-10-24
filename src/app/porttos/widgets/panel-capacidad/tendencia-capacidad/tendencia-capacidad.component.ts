/* eslint-disable @typescript-eslint/no-explicit-any */
/*
    Author: German Valencia
    Smart Widget PTT_CAP_CHRT_TENDENCIA · 📈 Ocupación en las últimas 24 h
    Toma su parte del tablero de la pestaña (TablerosPestanasService, compartido y en vivo) y la pinta con los
    componentes comunes de widgets y PorttosChartHelper.
*/
import { ChangeDetectorRef, Component, ViewChild } from '@angular/core';
import { CommonModule, DecimalPipe, DatePipe } from '@angular/common';
import { WidgetShellComponent } from 'src/app/theme/shared/components/widget-shell/widget-shell.component';
import { DashboardService } from 'src/app/theme/shared/service/tablero-control/dashboard.service';
import { ModuloTablero, TablerosPestanasService, TableroCapacidad } from 'src/app/theme/shared/service/tablero-control/tableros-pestanas.service';
import { WidgetTableroBase } from '../../shared/widget-tablero.base';
import { EstadoWidgetTclComponent } from '../../shared/estado-widget-tcl/estado-widget-tcl.component';
import { GraficaTclComponent, SerieGrafica } from '../../shared/grafica-tcl/grafica-tcl.component';

@Component({
    selector: 'app-tendencia-capacidad',
    standalone: true,
    imports: [CommonModule, DecimalPipe, DatePipe, WidgetShellComponent, EstadoWidgetTclComponent, GraficaTclComponent],
    templateUrl: './tendencia-capacidad.component.html',
    styleUrls: ['./tendencia-capacidad.component.scss']
})
export class TendenciaCapacidadComponent extends WidgetTableroBase<TableroCapacidad> {
    @ViewChild(GraficaTclComponent) grafica?: GraficaTclComponent;

    readonly modulo: ModuloTablero = 'capacidad';
    readonly tituloDefecto = '📈 Ocupación en las últimas 24 h';
    override readonly subtituloDefecto = 'Promedio por categoría, hora a hora';
    override readonly iconoDefecto = 'feather icon-trending-up';
    public labels: string[] = [];
    public series: SerieGrafica[] = [];
    public readonly mensajeVacio = 'Sin fotos de ocupación en las últimas 24 horas.';

    constructor(tableros: TablerosPestanasService, torre: DashboardService, cdr: ChangeDetectorRef) {
        super(tableros, torre, cdr);
    }

    protected alRecibir(d: TableroCapacidad | null): void {
        this.labels = d?.tendencia.labels || [];
        this.series = (d?.tendencia.series || []).map((s) => ({ label: s.categoria, data: s.valores }));
    }

    protected override alCambiarTamano(): void {
        this.grafica?.redibujar();
    }

}
