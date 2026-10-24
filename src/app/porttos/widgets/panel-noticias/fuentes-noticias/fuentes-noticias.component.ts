/* eslint-disable @typescript-eslint/no-explicit-any */
/*
    Author: German Valencia
    Smart Widget PTT_NOT_FUENTES · 🔗 Fuentes oficiales y gremiales
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


@Component({
    selector: 'app-fuentes-noticias',
    standalone: true,
    imports: [CommonModule, DecimalPipe, DatePipe, WidgetShellComponent, EstadoWidgetTclComponent],
    templateUrl: './fuentes-noticias.component.html',
    styleUrls: ['./fuentes-noticias.component.scss']
})
export class FuentesNoticiasComponent extends WidgetTableroBase<TableroNoticias> {
    readonly modulo: ModuloTablero = 'noticias';
    readonly tituloDefecto = '🔗 Fuentes oficiales y gremiales';
    override readonly subtituloDefecto = 'Consulta directa';
    override readonly iconoDefecto = 'feather icon-link';
    public fuentes: Array<{ grupo: string; nombre: string; enlaces: Array<{ nombre: string; descripcion: string | null; url: string }> }> = [];
    public readonly mensajeVacio = 'Sin fuentes configuradas (TCL_FuentesInformacion).';

    constructor(tableros: TablerosPestanasService, torre: DashboardService, cdr: ChangeDetectorRef) {
        super(tableros, torre, cdr);
    }

    protected alRecibir(d: TableroNoticias | null): void {
        this.fuentes = d?.fuentes || [];
    }

}
