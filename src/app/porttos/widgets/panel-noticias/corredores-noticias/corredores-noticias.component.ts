/* eslint-disable @typescript-eslint/no-explicit-any */
/*
    Author: German Valencia
    Smart Widget PTT_NOT_CORREDORES · 🛣 Estado de los corredores
    Toma su parte del tablero de la pestaña (TablerosPestanasService, compartido y en vivo) y la pinta con los
    componentes comunes de widgets.
*/
import { ChangeDetectorRef, Component } from '@angular/core';
import { CommonModule, DecimalPipe, DatePipe } from '@angular/common';
import { WidgetShellComponent } from 'src/app/theme/shared/components/widget-shell/widget-shell.component';
import { DashboardService } from 'src/app/theme/shared/service/tablero-control/dashboard.service';
import { ModuloTablero, TablerosPestanasService, TableroNoticias } from 'src/app/theme/shared/service/tablero-control/tableros-pestanas.service';
import { WidgetTableroBase } from '../../shared/widget-tablero.base';
import { EstadoWidgetTclComponent } from '../../shared/estado-widget-tcl/estado-widget-tcl.component';
import { BarrasSaturacionTclComponent, ItemSaturacion } from '../../shared/barras-saturacion-tcl/barras-saturacion-tcl.component';
import { ColumnaTabla, TablaTclComponent } from '../../shared/tabla-tcl/tabla-tcl.component';

@Component({
    selector: 'app-corredores-noticias',
    standalone: true,
    imports: [CommonModule, DecimalPipe, DatePipe, WidgetShellComponent, EstadoWidgetTclComponent, BarrasSaturacionTclComponent, TablaTclComponent],
    templateUrl: './corredores-noticias.component.html',
    styleUrls: ['./corredores-noticias.component.scss']
})
export class CorredoresNoticiasComponent extends WidgetTableroBase<TableroNoticias> {
    readonly modulo: ModuloTablero = 'noticias';
    readonly tituloDefecto = '🛣 Estado de los corredores';
    override readonly subtituloDefecto = 'Eventos viales del día en el corredor del puerto';
    override readonly iconoDefecto = 'feather icon-map';
    public items: ItemSaturacion[] = [];
    public readonly mensajeVacio = 'Sin eventos viales activos en los corredores del puerto.';

    constructor(tableros: TablerosPestanasService, torre: DashboardService, cdr: ChangeDetectorRef) {
        super(tableros, torre, cdr);
    }

    // Vista ampliada (2026-10-25): todos los eventos del día por corredor
    public readonly columnasEventos: ColumnaTabla[] = [
        { campo: 'corredor', titulo: 'Corredor', tipo: 'principal' },
        { campo: 'tipo', titulo: 'Evento', tipo: 'estado' },
        { campo: 'sector', titulo: 'Sector' },
        { campo: 'severidad', titulo: 'Severidad' },
        { campo: 'desde', titulo: 'Desde', tipo: 'hora' },
        { campo: 'descripcion', titulo: 'Descripción' }
    ];
    public eventos: any[] = [];

    protected alRecibir(d: TableroNoticias | null): void {
        this.eventos = (d?.corredores || []).flatMap((c) => (c.lista || []).map((e, i) => ({ ...e, id: e.codigo || `${c.corredor}-${i}`, corredor: c.corredor })));
        this.items = (d?.corredores || []).map((c) => ({
            nombre: c.corredor, porcentaje: null, semaforo: c.semaforo, valorTexto: c.estado,
            detalle: `${c.eventos} evento${c.eventos === 1 ? '' : 's'}${c.detalle ? ' · ' + c.detalle : ''}`
        }));
    }

}
