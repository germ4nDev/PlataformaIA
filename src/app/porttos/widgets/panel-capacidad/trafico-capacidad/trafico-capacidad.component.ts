/* eslint-disable @typescript-eslint/no-explicit-any */
/*
    Author: German Valencia
    Smart Widget PTT_CAP_CHRT_TRAFICO · 🚛 Tráfico de entrada y salida
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
    selector: 'app-trafico-capacidad',
    standalone: true,
    imports: [CommonModule, DecimalPipe, DatePipe, WidgetShellComponent, EstadoWidgetTclComponent, GraficaTclComponent],
    templateUrl: './trafico-capacidad.component.html',
    styleUrls: ['./trafico-capacidad.component.scss']
})
export class TraficoCapacidadComponent extends WidgetTableroBase<TableroCapacidad> {
    @ViewChild(GraficaTclComponent) grafica?: GraficaTclComponent;

    readonly modulo: ModuloTablero = 'capacidad';
    readonly tituloDefecto = '🚛 Tráfico de entrada y salida';
    override readonly subtituloDefecto = 'Camiones por hora, por categoría';
    override readonly iconoDefecto = 'feather icon-repeat';
    public labels: string[] = [];
    public series: SerieGrafica[] = [];
    public readonly mensajeVacio = 'Sin tráfico reportado por los nodos.';

    constructor(tableros: TablerosPestanasService, torre: DashboardService, cdr: ChangeDetectorRef) {
        super(tableros, torre, cdr);
    }

    protected alRecibir(d: TableroCapacidad | null): void {
        this.labels = d?.trafico.labels || [];
        const hay = (d?.trafico.ingresos || []).some((v) => v > 0) || (d?.trafico.salidas || []).some((v) => v > 0);
        this.series = hay ? [
            { label: 'Entradas', data: d!.trafico.ingresos, color: '#2f96b4' },
            { label: 'Salidas', data: d!.trafico.salidas, color: '#51a351' }
        ] : [];
    }

    protected override alCambiarTamano(): void {
        this.grafica?.redibujar();
    }

}
