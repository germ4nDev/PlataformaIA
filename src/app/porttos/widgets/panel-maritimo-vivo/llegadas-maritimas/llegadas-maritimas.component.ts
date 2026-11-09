import { TranslateModule } from '@ngx-translate/core';
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
    imports: [TranslateModule, CommonModule, WidgetShellComponent, TablaTclComponent],
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
        { campo: 'motonave', titulo: 'PORTTOS.VESSEL_TABLE.MOTONAVE', tipo: 'principal' },
        { campo: 'eta', titulo: 'ETA', tipo: 'fecha' },
        { campo: 'horasParaEta', titulo: 'PORTTOS.LLEGADAS_MARITIMAS.PARA_ETA', tipo: 'numero', decimales: 1, unidad: 'h' },
        { campo: 'situacion', titulo: 'PORTTOS.LLEGADAS_MARITIMAS.SITUACION', tipo: 'estado' },
        { campo: 'tipoNave', titulo: 'PORTTOS.TABLE_CONTENEDORES.TIPO' },
        { campo: 'omi', titulo: 'OMI' },
        { campo: 'mmsi', titulo: 'MMSI' },
        { campo: 'bandera', titulo: 'PORTTOS.LLEGADAS_MARITIMAS.BANDERA' },
        { campo: 'eslora', titulo: 'PORTTOS.LLEGADAS_MARITIMAS.ESLORA', tipo: 'numero', unidad: 'm' },
        { campo: 'calado', titulo: 'PORTTOS.TERMINAL_DOCKS_DETAIL.CALADO', tipo: 'numero', decimales: 1, unidad: 'm' },
        { campo: 'agencia', titulo: 'PORTTOS.LLEGADAS_MARITIMAS.AGENCIA' },
        { campo: 'instalacion', titulo: 'PORTTOS.LLEGADAS_MARITIMAS.INSTALACION' },
        { campo: 'estadoAis', titulo: 'PORTTOS.LLEGADAS_MARITIMAS.ESTADO_AIS' },
        { campo: 'velocidad', titulo: 'PORTTOS.LLEGADAS_MARITIMAS.VELOCIDAD', tipo: 'numero', decimales: 1, unidad: 'kn' },
        { campo: 'minutosDesdeAis', titulo: 'PORTTOS.LLEGADAS_MARITIMAS.AIS_HACE', tipo: 'numero', unidad: 'min' }
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
