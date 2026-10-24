/*
    Author: German Valencia
    Pattern: PORTTOS Smart Widget - Llegadas (avisos DIMAR cruzados con AIS)
    Código: PTT_MAE_VIVO_LLEGADAS
*/
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { WidgetShellComponent } from 'src/app/theme/shared/components/widget-shell/widget-shell.component';
import { ColumnaTabla, TablaTclComponent } from '../../shared/tabla-tcl/tabla-tcl.component';
import { AvisoLlegada, Llegadas } from 'src/app/theme/shared/service/tablero-control/maritimo-vivo.service';
import { WidgetMaritimoVivoBase } from '../shared/widget-maritimo-vivo.base';
import { CLASE_SITUACION, formatoRelativo } from '../shared/maritimo-vivo.util';

@Component({
    selector: 'app-llegadas-maritimas',
    standalone: true,
    imports: [CommonModule, WidgetShellComponent, TablaTclComponent],
    templateUrl: './llegadas-maritimas.component.html',
    styleUrls: ['../shared/maritimo-vivo.scss', './llegadas-maritimas.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class LlegadasMaritimasComponent extends WidgetMaritimoVivoBase<Llegadas> {
    protected readonly codigo = 'PTT_MAE_VIVO_LLEGADAS';
    protected override intervaloMs = 120_000; // los avisos de DIMAR cambian despacio
    public readonly relativo = formatoRelativo;

    protected consultar(puerto: string): Observable<Llegadas> {
        return this.core.llegadas(puerto, Number(this.widgetConfig?.horas) || 72);
    }

    // ---------------------------------------------------------------- vista ampliada (2026-10-24)
    public readonly columnasLlegadas: ColumnaTabla[] = [
        { campo: 'motonave', titulo: 'Motonave', tipo: 'principal' },
        { campo: 'eta', titulo: 'ETA', tipo: 'fecha' },
        { campo: 'horasParaEta', titulo: 'Para ETA', tipo: 'numero', decimales: 1, unidad: 'h' },
        { campo: 'situacion', titulo: 'Situación', tipo: 'estado' },
        { campo: 'tipoNave', titulo: 'Tipo' },
        { campo: 'omi', titulo: 'OMI' },
        { campo: 'mmsi', titulo: 'MMSI' },
        { campo: 'bandera', titulo: 'Bandera' },
        { campo: 'eslora', titulo: 'Eslora', tipo: 'numero', unidad: 'm' },
        { campo: 'calado', titulo: 'Calado', tipo: 'numero', decimales: 1, unidad: 'm' },
        { campo: 'agencia', titulo: 'Agencia' },
        { campo: 'instalacion', titulo: 'Instalación' },
        { campo: 'estadoAis', titulo: 'Estado AIS' },
        { campo: 'velocidad', titulo: 'Velocidad', tipo: 'numero', decimales: 1, unidad: 'kn' },
        { campo: 'minutosDesdeAis', titulo: 'AIS hace', tipo: 'numero', unidad: 'min' }
    ];
    public filasLlegadas: any[] = [];

    protected override alActualizar(): void {
        this.filasLlegadas = (this.datos?.naves || []).map((n) => ({
            ...n, id: n.idAviso, horasParaEta: n.minutosParaEta != null ? n.minutosParaEta / 60 : null
        }));
    }

    public claseSituacion(aviso: AvisoLlegada): string {
        return CLASE_SITUACION[aviso.situacion] || 'badge-secondary';
    }

    public trackAviso(_i: number, aviso: AvisoLlegada): string {
        return aviso.idAviso;
    }
}
