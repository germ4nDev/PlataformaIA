/* eslint-disable @typescript-eslint/no-explicit-any */
/*
    Author: German Valencia
    Smart Widget PTT_GRA_TAB_EQUIPOS · 🏗 Equipos de descarga
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
import { TablaTclComponent, ColumnaTabla } from '../../shared/tabla-tcl/tabla-tcl.component';

@Component({
    selector: 'app-equipos-granel',
    standalone: true,
    imports: [CommonModule, DecimalPipe, DatePipe, WidgetShellComponent, EstadoWidgetTclComponent, TablaTclComponent],
    templateUrl: './equipos-granel.component.html',
    styleUrls: ['./equipos-granel.component.scss']
})
export class EquiposGranelComponent extends WidgetTableroBase<TableroGranel> {
    readonly modulo: ModuloTablero = 'granel';
    readonly tituloDefecto = '🏗 Equipos de descarga';
    override readonly subtituloDefecto = 'Aspiradores, grúas, cintas y volquetas';
    override readonly iconoDefecto = 'feather icon-settings';
    public filas: any[] = [];
    public readonly mensajeVacio = 'Sin equipos de granel registrados.';
    public readonly columnas: ColumnaTabla[] = [
        { campo: 'codigo', titulo: 'Equipo', tipo: 'principal' },
        { campo: 'descripcion', titulo: 'Tipo' },
        { campo: 'motonave', titulo: 'Motonave asignada' },
        { campo: 'producto', titulo: 'Producto' },
        { campo: 'rendimientoTmh', titulo: 'Rendimiento', tipo: 'numero', unidad: 't/h' },
        { campo: 'estado', titulo: 'Estado', tipo: 'estado' }
    ];
    /** Columnas que solo se ven en la vista ampliada (datos que ya llegan del tablero). */
    public readonly columnasAmpliadas: ColumnaTabla[] = [
        { campo: 'tipo', titulo: 'Código de tipo' },
        { campo: 'terminal', titulo: 'Terminal' },
        { campo: 'capacidadTmh', titulo: 'Nominal', tipo: 'numero', unidad: 't/h' },
        { campo: 'rendimientoPct', titulo: '% del nominal', tipo: 'numero', unidad: '%' }
    ];
    get operando(): number { return this.filas.filter((f) => f.estado === 'OPERANDO').length; }

    constructor(tableros: TablerosPestanasService, torre: DashboardService, cdr: ChangeDetectorRef) {
        super(tableros, torre, cdr);
    }

    protected alRecibir(d: TableroGranel | null): void {
        this.filas = (d?.equipos || []).map((e) => ({
            ...e, id: e.codigo,
            rendimientoPct: e.rendimientoTmh !== null && e.capacidadTmh ? Math.round((e.rendimientoTmh / e.capacidadTmh) * 100) : null
        }));
    }

}
