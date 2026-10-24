/* eslint-disable @typescript-eslint/no-explicit-any */
/*
    Author: German Valencia
    Smart Widget PTT_GRA_CHRT_PRODUCTO · 📊 Distribución por producto
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
    selector: 'app-producto-granel',
    standalone: true,
    imports: [CommonModule, DecimalPipe, DatePipe, WidgetShellComponent, EstadoWidgetTclComponent, GraficaTclComponent],
    templateUrl: './producto-granel.component.html',
    styleUrls: ['./producto-granel.component.scss']
})
export class ProductoGranelComponent extends WidgetTableroBase<TableroGranel> {
    @ViewChild(GraficaTclComponent) grafica?: GraficaTclComponent;

    readonly modulo: ModuloTablero = 'granel';
    readonly tituloDefecto = '📊 Distribución por producto';
    override readonly subtituloDefecto = 'Toneladas en operación por producto';
    override readonly iconoDefecto = 'feather icon-pie-chart';
    public labels: string[] = [];
    public valores: number[] = [];
    public readonly mensajeVacio = 'Sin productos en operación.';

    constructor(tableros: TablerosPestanasService, torre: DashboardService, cdr: ChangeDetectorRef) {
        super(tableros, torre, cdr);
    }

    protected alRecibir(d: TableroGranel | null): void {
        this.labels = d?.productos.labels || [];
        this.valores = d?.productos.valores || [];
    }

    protected override alCambiarTamano(): void {
        this.grafica?.redibujar();
    }

}
