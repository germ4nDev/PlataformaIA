/*
    Author: German Valencia
    Pattern: PORTTOS Smart Widget - Ocupación de muelles en vivo
    Código: PTT_MAE_VIVO_MUELLES
*/
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { WidgetShellComponent } from 'src/app/theme/shared/components/widget-shell/widget-shell.component';
import { MuelleOcupacion, OcupacionMuelles } from 'src/app/theme/shared/service/tablero-control/maritimo-vivo.service';
import { WidgetMaritimoVivoBase } from '../shared/widget-maritimo-vivo.base';
import { formatoDuracion } from '../shared/maritimo-vivo.util';

@Component({
    selector: 'app-ocupacion-muelles',
    standalone: true,
    imports: [CommonModule, WidgetShellComponent],
    templateUrl: './ocupacion-muelles.component.html',
    styleUrls: ['../shared/maritimo-vivo.scss', './ocupacion-muelles.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class OcupacionMuellesComponent extends WidgetMaritimoVivoBase<OcupacionMuelles> {
    protected readonly codigo = 'PTT_MAE_VIVO_MUELLES';
    public readonly duracion = formatoDuracion;

    protected consultar(puerto: string): Observable<OcupacionMuelles> {
        return this.core.ocupacion(puerto);
    }

    public ocupados(muelles: MuelleOcupacion[]): number {
        return muelles.filter((m) => m.ocupado).length;
    }

    public descripcion(m: MuelleOcupacion): string {
        if (m.enMantenimiento) return `${m.codigoMuelle}: en mantenimiento`;
        if (!m.ocupado) return `${m.codigoMuelle}: disponible${m.caladoMetros ? ` · calado ${m.caladoMetros} m` : ''}`;
        return `${m.codigoMuelle}: ${m.naves.map((n) => `${n.nombre || n.mmsi} (${formatoDuracion(n.minutos)})`).join(', ')}`;
    }
}
