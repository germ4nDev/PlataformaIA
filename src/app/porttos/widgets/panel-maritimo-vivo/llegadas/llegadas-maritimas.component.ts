/*
    Author: German Valencia
    Pattern: PORTTOS Smart Widget - Llegadas (avisos DIMAR cruzados con AIS)
    Código: PTT_MAE_VIVO_LLEGADAS
*/
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { WidgetShellComponent } from 'src/app/theme/shared/components/widget-shell/widget-shell.component';
import { AvisoLlegada, Llegadas } from 'src/app/theme/shared/service/tablero-control/maritimo-vivo.service';
import { WidgetMaritimoVivoBase } from '../shared/widget-maritimo-vivo.base';
import { CLASE_SITUACION, formatoRelativo } from '../shared/maritimo-vivo.util';

@Component({
    selector: 'app-llegadas-maritimas',
    standalone: true,
    imports: [CommonModule, WidgetShellComponent],
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

    public claseSituacion(aviso: AvisoLlegada): string {
        return CLASE_SITUACION[aviso.situacion] || 'badge-secondary';
    }

    public trackAviso(_i: number, aviso: AvisoLlegada): string {
        return aviso.idAviso;
    }
}
