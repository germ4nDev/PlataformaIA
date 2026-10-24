/* eslint-disable @typescript-eslint/no-explicit-any */
/*
    Author: German Valencia
    Smart Widget PTT_SUE_TAB_BREAKBULK · 📐 Carga suelta activa
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
import { TablaTclComponent, ColumnaTabla } from '../../shared/tabla-tcl/tabla-tcl.component';

@Component({
    selector: 'app-breakbulk-suelta',
    standalone: true,
    imports: [CommonModule, DecimalPipe, DatePipe, WidgetShellComponent, EstadoWidgetTclComponent, TablaTclComponent],
    templateUrl: './breakbulk-suelta.component.html',
    styleUrls: ['./breakbulk-suelta.component.scss']
})
export class BreakbulkSueltaComponent extends WidgetTableroBase<TableroCargaSuelta> {
    readonly modulo: ModuloTablero = 'carga-suelta';
    readonly tituloDefecto = '📐 Carga suelta activa';
    override readonly subtituloDefecto = 'Break-bulk · mercancía no contenerizada';
    override readonly iconoDefecto = 'feather icon-package';
    public filas: any[] = [];
    public readonly mensajeVacio = 'Sin carga suelta activa.';
    public readonly columnas: ColumnaTabla[] = [
        { campo: 'folio', titulo: 'Folio', tipo: 'principal' },
        { campo: 'producto', titulo: 'Producto' },
        { campo: 'cliente', titulo: 'Cliente' },
        { campo: 'motonave', titulo: 'Motonave' },
        { campo: 'bultosTexto', titulo: 'Bultos', alinear: 'der' },
        { campo: 'tm', titulo: 'TM', tipo: 'numero' },
        { campo: 'ubicacion', titulo: 'Ubicación' },
        { campo: 'estado', titulo: 'Estado', tipo: 'estado' }
    ];
    /** Columnas que solo se ven en la vista ampliada (datos que ya llegan del tablero). */
    public readonly columnasAmpliadas: ColumnaTabla[] = [
        { campo: 'naviera', titulo: 'Naviera' },
        { campo: 'terminal', titulo: 'Terminal' },
        { campo: 'sentido', titulo: 'Sentido' },
        { campo: 'pesoUnitarioTm', titulo: 'Peso unitario', tipo: 'numero', decimales: 2, unidad: 't' },
        { campo: 'dimensiones', titulo: 'Dimensiones' },
        { campo: 'equipoRequerido', titulo: 'Equipo requerido' },
        { campo: 'fechaProgramada', titulo: 'Programado', tipo: 'fecha' },
        { campo: 'simulado', titulo: 'Simulado', tipo: 'si-no' }
    ];

    constructor(tableros: TablerosPestanasService, torre: DashboardService, cdr: ChangeDetectorRef) {
        super(tableros, torre, cdr);
    }

    protected alRecibir(d: TableroCargaSuelta | null): void {
        this.filas = (d?.breakBulk || []).map((f) => ({
            ...f, id: f.folio, bultosTexto: f.bultos === null ? '—' : `${f.bultosRecibidos ?? 0}/${f.bultos}`
        }));
    }

}
