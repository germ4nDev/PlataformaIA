/* eslint-disable @typescript-eslint/no-explicit-any */
/*
    Author: German Valencia
    Smart Widget PTT_GRA_PANEL_BODEGAS · 🌾 Bodegas de granel
    Toma su parte del tablero de la pestaña (TablerosPestanasService, compartido y en vivo) y la pinta con los
    componentes comunes de widgets.
*/
import { ChangeDetectorRef, Component } from '@angular/core';
import { CommonModule, DecimalPipe, DatePipe } from '@angular/common';
import { WidgetShellComponent } from 'src/app/theme/shared/components/widget-shell/widget-shell.component';
import { DashboardService } from 'src/app/theme/shared/service/tablero-control/dashboard.service';
import { ModuloTablero, TablerosPestanasService, TableroGranel } from 'src/app/theme/shared/service/tablero-control/tableros-pestanas.service';
import { WidgetTableroBase } from '../../shared/widget-tablero.base';
import { EstadoWidgetTclComponent } from '../../shared/estado-widget-tcl/estado-widget-tcl.component';
import { BarrasSaturacionTclComponent, ItemSaturacion } from '../../shared/barras-saturacion-tcl/barras-saturacion-tcl.component';

@Component({
    selector: 'app-bodegas-granel',
    standalone: true,
    imports: [CommonModule, DecimalPipe, DatePipe, WidgetShellComponent, EstadoWidgetTclComponent, BarrasSaturacionTclComponent],
    templateUrl: './bodegas-granel.component.html',
    styleUrls: ['./bodegas-granel.component.scss']
})
export class BodegasGranelComponent extends WidgetTableroBase<TableroGranel> {
    readonly modulo: ModuloTablero = 'granel';
    readonly tituloDefecto = '🌾 Bodegas de granel';
    override readonly subtituloDefecto = 'Saturación · verde < 70 % · amarillo · rojo ≥ 85 %';
    override readonly iconoDefecto = 'feather icon-home';
    public items: ItemSaturacion[] = [];
    public readonly mensajeVacio = 'No hay bodegas de granel en el maestro de bodegas de este puerto.';

    constructor(tableros: TablerosPestanasService, torre: DashboardService, cdr: ChangeDetectorRef) {
        super(tableros, torre, cdr);
    }

    protected alRecibir(d: TableroGranel | null): void {
        this.items = (d?.bodegas || []).map((b) => ({
            nombre: b.nombre, porcentaje: b.porcentaje, semaforo: b.semaforo,
            detalle: `${b.producto} · ${Math.round(b.inventario).toLocaleString('es-CO')} de ${Math.round(b.capacidad).toLocaleString('es-CO')} t`
        }));
    }

}
