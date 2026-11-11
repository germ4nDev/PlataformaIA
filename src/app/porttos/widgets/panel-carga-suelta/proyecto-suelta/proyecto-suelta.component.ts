import { TranslateModule } from '@ngx-translate/core';
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
    imports: [TranslateModule, CommonModule, DecimalPipe, DatePipe, WidgetShellComponent, EstadoWidgetTclComponent, TablaTclComponent],
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
        { campo: 'folio', titulo: 'PORTTOS.WIDGETS.PANEL_CARGA_SUELTA.FOLIO', tipo: 'principal' },
        { campo: 'producto', titulo: 'PORTTOS.WIDGETS.PANEL_CARGA_SUELTA.PROYECTO_SUELTA.EQUIPMENT_CARGO' },
        { campo: 'cliente', titulo: 'PORTTOS.WIDGETS.CUSTOMER' },
        { campo: 'tm', titulo: 'PORTTOS.WIDGETS.PANEL_CARGA_SUELTA.PROYECTO_SUELTA.WEIGHT', tipo: 'numero', unidad: 't' },
        { campo: 'sentido', titulo: 'PORTTOS.WIDGETS.OPERATION', tipo: 'estado' },
        { campo: 'equipoRequerido', titulo: 'PORTTOS.WIDGETS.PANEL_CARGA_SUELTA.REQUIRED_EQUIPMENT' },
        { campo: 'permiso', titulo: 'PORTTOS.WIDGETS.PANEL_CARGA_SUELTA.PROYECTO_SUELTA.ROAD_PERMIT', tipo: 'estado' },
        { campo: 'estado', titulo: 'COMMON.STATUS', tipo: 'estado' }
    ];
    /** Columnas que solo se ven en la vista ampliada (datos que ya llegan del tablero). */
    public readonly columnasAmpliadas: ColumnaTabla[] = [
        { campo: 'dimensiones', titulo: 'PORTTOS.WIDGETS.PANEL_CARGA_SUELTA.DIMENSIONS' },
        { campo: 'pesoUnitarioTm', titulo: 'PORTTOS.WIDGETS.PANEL_CARGA_SUELTA.UNIT_WEIGHT', tipo: 'numero', decimales: 2, unidad: 't' },
        { campo: 'bultos', titulo: 'PORTTOS.WIDGETS.PANEL_CARGA_SUELTA.PACKAGES', tipo: 'numero' },
        { campo: 'ubicacion', titulo: 'PORTTOS.LOCATION' },
        { campo: 'motonave', titulo: 'PORTTOS.WIDGETS.VESSEL' },
        { campo: 'naviera', titulo: 'PORTTOS.WIDGETS.SHIPPING_LINE' },
        { campo: 'fechaProgramada', titulo: 'PORTTOS.WIDGETS.PANEL_CARGA_SUELTA.SCHEDULED', tipo: 'fecha' },
        { campo: 'simulado', titulo: 'COMMON.SIMULATED_2', tipo: 'si-no' }
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
