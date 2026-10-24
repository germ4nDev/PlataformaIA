/* eslint-disable @typescript-eslint/no-explicit-any */
/*
    Author: German Valencia
    Smart Widget PTT_SUE_TAB_PROYECTO · 🏗 Project cargo
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
    selector: 'app-proyecto-suelta',
    standalone: true,
    imports: [CommonModule, DecimalPipe, DatePipe, WidgetShellComponent, EstadoWidgetTclComponent, TablaTclComponent],
    templateUrl: './proyecto-suelta.component.html',
    styleUrls: ['./proyecto-suelta.component.scss']
})
export class ProyectoSueltaComponent extends WidgetTableroBase<TableroCargaSuelta> {
    readonly modulo: ModuloTablero = 'carga-suelta';
    readonly tituloDefecto = '🏗 Project cargo';
    override readonly subtituloDefecto = 'Bultos de gran tamaño y peso';
    override readonly iconoDefecto = 'feather icon-truck';
    public filas: any[] = [];
    public readonly mensajeVacio = 'Sin project cargo activo.';
    public readonly columnas: ColumnaTabla[] = [
        { campo: 'folio', titulo: 'Folio', tipo: 'principal' },
        { campo: 'producto', titulo: 'Equipo / carga' },
        { campo: 'cliente', titulo: 'Cliente' },
        { campo: 'tm', titulo: 'Peso', tipo: 'numero', unidad: 't' },
        { campo: 'sentido', titulo: 'Operación', tipo: 'estado' },
        { campo: 'equipoRequerido', titulo: 'Equipo requerido' },
        { campo: 'permiso', titulo: 'Permiso vial', tipo: 'estado' },
        { campo: 'estado', titulo: 'Estado', tipo: 'estado' }
    ];
    /** Columnas que solo se ven en la vista ampliada (datos que ya llegan del tablero). */
    public readonly columnasAmpliadas: ColumnaTabla[] = [
        { campo: 'dimensiones', titulo: 'Dimensiones' },
        { campo: 'pesoUnitarioTm', titulo: 'Peso unitario', tipo: 'numero', decimales: 2, unidad: 't' },
        { campo: 'bultos', titulo: 'Bultos', tipo: 'numero' },
        { campo: 'ubicacion', titulo: 'Ubicación' },
        { campo: 'motonave', titulo: 'Motonave' },
        { campo: 'naviera', titulo: 'Naviera' },
        { campo: 'fechaProgramada', titulo: 'Programado', tipo: 'fecha' },
        { campo: 'simulado', titulo: 'Simulado', tipo: 'si-no' }
    ];
    get pendientes(): number { return this.filas.filter((f) => f.permiso === 'PENDIENTE').length; }

    constructor(tableros: TablerosPestanasService, torre: DashboardService, cdr: ChangeDetectorRef) {
        super(tableros, torre, cdr);
    }

    protected alRecibir(d: TableroCargaSuelta | null): void {
        this.filas = (d?.proyecto || []).map((f) => ({
            ...f, id: f.folio, permiso: !f.requierePermiso ? 'NO REQUIERE' : f.permisoAprobado ? 'APROBADO' : 'PENDIENTE'
        }));
    }

}
