/* eslint-disable @typescript-eslint/no-explicit-any */
/*
    Author: German Valencia
    Smart Widget PTT_SUE_CHRT_COMPOSICION · 📦 Composición de la carga suelta
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
    selector: 'app-composicion-suelta',
    standalone: true,
    imports: [CommonModule, DecimalPipe, DatePipe, WidgetShellComponent, EstadoWidgetTclComponent, GraficaTclComponent],
    templateUrl: './composicion-suelta.component.html',
    styleUrls: ['./composicion-suelta.component.scss']
})
export class ComposicionSueltaComponent extends WidgetTableroBase<TableroCargaSuelta> {
    @ViewChild(GraficaTclComponent) grafica?: GraficaTclComponent;

    readonly modulo: ModuloTablero = 'carga-suelta';
    readonly tituloDefecto = '📦 Composición de la carga suelta';
    override readonly subtituloDefecto = 'Toneladas por producto';
    override readonly iconoDefecto = 'feather icon-pie-chart';
    public labels: string[] = [];
    public valores: number[] = [];
    public readonly mensajeVacio = 'Sin carga suelta activa.';

    constructor(tableros: TablerosPestanasService, torre: DashboardService, cdr: ChangeDetectorRef) {
        super(tableros, torre, cdr);
    }

    protected alRecibir(d: TableroCargaSuelta | null): void {
        this.labels = d?.composicion.labels || [];
        this.valores = d?.composicion.valores || [];
    }

    protected override alCambiarTamano(): void {
        this.grafica?.redibujar();
    }

}
