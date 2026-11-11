import { TranslateModule } from '@ngx-translate/core';
/* eslint-disable @typescript-eslint/no-explicit-any */
/*
    Author: German Valencia
    Smart Widget PTT_SUE_TAB_RORO · 🚢 Buques Ro-Ro
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
    selector: 'app-roro-suelta',
    standalone: true,
    imports: [TranslateModule, CommonModule, DecimalPipe, DatePipe, WidgetShellComponent, EstadoWidgetTclComponent, TablaTclComponent],
    templateUrl: './roro-suelta.component.html',
    styleUrls: ['./roro-suelta.component.scss']
})
export class RoroSueltaComponent extends WidgetTableroBase<TableroCargaSuelta> {
    readonly modulo: ModuloTablero = 'carga-suelta';
    readonly tituloDefecto = '🚢 Buques Ro-Ro';
    override readonly subtituloDefecto = 'Descargando y próximos';
    override readonly iconoDefecto = 'feather icon-anchor';
    public filas: any[] = [];
    public readonly mensajeVacio = 'Sin buques Ro-Ro en operación ni programados.';
    public readonly columnas: ColumnaTabla[] = [
        { campo: 'motonave', titulo: 'PORTTOS.WIDGETS.VESSEL', tipo: 'principal' },
        { campo: 'naviera', titulo: 'PORTTOS.WIDGETS.SHIPPING_LINE' },
        { campo: 'total', titulo: 'PORTTOS.WIDGETS.PANEL_CARGA_SUELTA.RORO_SUELTA.VEHICLES', tipo: 'numero' },
        { campo: 'avancePct', titulo: 'PORTTOS.WIDGETS.PROGRESS', tipo: 'avance', ancho: '110px' },
        { campo: 'eta', titulo: 'ETA', tipo: 'fecha' },
        { campo: 'estado', titulo: 'COMMON.STATUS', tipo: 'estado' }
    ];
    /** Columnas que solo se ven en la vista ampliada (datos que ya llegan del tablero). */
    public readonly columnasAmpliadas: ColumnaTabla[] = [
        { campo: 'terminal', titulo: 'PORTTOS.TERMINAL' },
        { campo: 'muelle', titulo: 'COMMON.BERTH' },
        { campo: 'producto', titulo: 'PORTTOS.WIDGETS.PRODUCT' },
        { campo: 'operadas', titulo: 'PORTTOS.WIDGETS.HANDLED', tipo: 'numero' },
        { campo: 'simulado', titulo: 'COMMON.SIMULATED_2', tipo: 'si-no' }
    ];

    constructor(tableros: TablerosPestanasService, torre: DashboardService, cdr: ChangeDetectorRef) {
        super(tableros, torre, cdr);
    }

    protected alRecibir(d: TableroCargaSuelta | null): void {
        this.filas = (d?.roro || []).map((r, i) => ({ ...r, id: `${r.motonave}-${i}` }));
    }

}
