/* eslint-disable @typescript-eslint/no-explicit-any */
/*
    Author: German Valencia
    Smart Widget PTT_SUE_PANEL_INDICADORES · ⚙ Indicadores de operación especial
    Toma su parte del tablero de la pestaña (TablerosPestanasService, compartido y en vivo) y la pinta con los
    componentes comunes de widgets.
*/
import { ChangeDetectorRef, Component } from '@angular/core';
import { CommonModule, DecimalPipe, DatePipe } from '@angular/common';
import { WidgetShellComponent } from 'src/app/theme/shared/components/widget-shell/widget-shell.component';
import { DashboardService } from 'src/app/theme/shared/service/tablero-control/dashboard.service';
import { ModuloTablero, TablerosPestanasService, TableroCargaSuelta } from 'src/app/theme/shared/service/tablero-control/tableros-pestanas.service';
import { WidgetTableroBase } from '../../shared/widget-tablero.base';
import { EstadoWidgetTclComponent } from '../../shared/estado-widget-tcl/estado-widget-tcl.component';
import { BarrasSaturacionTclComponent, ItemSaturacion } from '../../shared/barras-saturacion-tcl/barras-saturacion-tcl.component';

@Component({
    selector: 'app-indicadores-suelta',
    standalone: true,
    imports: [CommonModule, DecimalPipe, DatePipe, WidgetShellComponent, EstadoWidgetTclComponent, BarrasSaturacionTclComponent],
    templateUrl: './indicadores-suelta.component.html',
    styleUrls: ['./indicadores-suelta.component.scss']
})
export class IndicadoresSueltaComponent extends WidgetTableroBase<TableroCargaSuelta> {
    readonly modulo: ModuloTablero = 'carga-suelta';
    readonly tituloDefecto = '⚙ Indicadores de operación especial';
    override readonly subtituloDefecto = 'Ro-Ro, patios, break-bulk y project cargo';
    override readonly iconoDefecto = 'feather icon-sliders';
    public items: ItemSaturacion[] = [];
    public readonly mensajeVacio = 'Sin indicadores todavía.';

    constructor(tableros: TablerosPestanasService, torre: DashboardService, cdr: ChangeDetectorRef) {
        super(tableros, torre, cdr);
    }

    protected alRecibir(d: TableroCargaSuelta | null): void {
        this.items = (d?.indicadores || []).map((i) => ({
            nombre: i.nombre, porcentaje: null, semaforo: i.semaforo, detalle: i.detalle,
            valorTexto: i.valor === null ? '—' : `${i.valor.toLocaleString('es-CO')} ${i.unidad}`
        }));
    }

}
