/* eslint-disable @typescript-eslint/no-explicit-any */
/*
    Author: German Valencia
    Smart Widget PTT_SUE_PANEL_PATIOS · 🚗 Patios de vehículos
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
    selector: 'app-patios-vehiculos',
    standalone: true,
    imports: [CommonModule, DecimalPipe, DatePipe, WidgetShellComponent, EstadoWidgetTclComponent, BarrasSaturacionTclComponent],
    templateUrl: './patios-vehiculos.component.html',
    styleUrls: ['./patios-vehiculos.component.scss']
})
export class PatiosVehiculosComponent extends WidgetTableroBase<TableroCargaSuelta> {
    readonly modulo: ModuloTablero = 'carga-suelta';
    readonly tituloDefecto = '🚗 Patios de vehículos';
    override readonly subtituloDefecto = 'Saturación de patios PDI y exportación';
    override readonly iconoDefecto = 'feather icon-grid';
    public items: ItemSaturacion[] = [];
    public readonly mensajeVacio = 'No hay patios de vehículos en el catálogo de capacidad de este puerto.';

    constructor(tableros: TablerosPestanasService, torre: DashboardService, cdr: ChangeDetectorRef) {
        super(tableros, torre, cdr);
    }

    protected alRecibir(d: TableroCargaSuelta | null): void {
        this.items = (d?.patios || []).map((p) => ({
            nombre: p.nombre, porcentaje: p.porcentaje, semaforo: p.semaforo,
            detalle: `${p.unidades.toLocaleString('es-CO')} de ${p.capacidad.toLocaleString('es-CO')} vehículos${p.marcas.length ? ' · ' + p.marcas.slice(0, 3).join(', ') : ''}`
        }));
    }

}
