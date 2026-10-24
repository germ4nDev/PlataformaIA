/* eslint-disable @typescript-eslint/no-explicit-any */
/*
    Author: German Valencia
    Smart Widget PTT_NOT_CLIMA_PUERTOS · 🌦 Clima de los puertos
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
    selector: 'app-clima-puertos',
    standalone: true,
    imports: [CommonModule, DecimalPipe, DatePipe, WidgetShellComponent, EstadoWidgetTclComponent],
    templateUrl: './clima-puertos.component.html',
    styleUrls: ['./clima-puertos.component.scss']
})
export class ClimaPuertosComponent extends WidgetTableroBase<TableroNoticias> {
    readonly modulo: ModuloTablero = 'noticias';
    readonly tituloDefecto = '🌦 Clima de los puertos';
    override readonly subtituloDefecto = 'Open-Meteo · actualizado cada 15 min';
    override readonly iconoDefecto = 'feather icon-cloud';
    public clima: any[] = [];
    public readonly mensajeVacio = 'Sin datos de clima (Open-Meteo no respondió).';
    porPuerto = (_: number, c: any) => c.puerto;

    constructor(tableros: TablerosPestanasService, torre: DashboardService, cdr: ChangeDetectorRef) {
        super(tableros, torre, cdr);
    }

    protected alRecibir(d: TableroNoticias | null): void {
        this.clima = d?.clima || [];
    }

}
