/* eslint-disable @typescript-eslint/no-explicit-any */
/*
    Author: German Valencia
    Smart Widget PTT_SUE_CHRT_MARCAS · 📊 Vehículos por marca
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
    selector: 'app-marcas-vehiculos',
    standalone: true,
    imports: [CommonModule, DecimalPipe, DatePipe, WidgetShellComponent, EstadoWidgetTclComponent, GraficaTclComponent],
    templateUrl: './marcas-vehiculos.component.html',
    styleUrls: ['./marcas-vehiculos.component.scss']
})
export class MarcasVehiculosComponent extends WidgetTableroBase<TableroCargaSuelta> {
    @ViewChild(GraficaTclComponent) grafica?: GraficaTclComponent;

    readonly modulo: ModuloTablero = 'carga-suelta';
    readonly tituloDefecto = '📊 Vehículos por marca';
    override readonly subtituloDefecto = 'Stock en patios';
    override readonly iconoDefecto = 'feather icon-bar-chart';
    public labels: string[] = [];
    public series: SerieGrafica[] = [];
    public readonly mensajeVacio = 'Sin vehículos en patio.';

    constructor(tableros: TablerosPestanasService, torre: DashboardService, cdr: ChangeDetectorRef) {
        super(tableros, torre, cdr);
    }

    protected alRecibir(d: TableroCargaSuelta | null): void {
        this.labels = d?.marcas.labels || [];
        this.series = [{ label: 'Unidades', data: d?.marcas.valores || [], color: '#2f96b4' }];
    }

    protected override alCambiarTamano(): void {
        this.grafica?.redibujar();
    }

}
