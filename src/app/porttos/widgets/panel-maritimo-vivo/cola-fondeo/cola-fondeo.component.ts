/*
    Author: German Valencia
    Pattern: PORTTOS Smart Widget - Cola de fondeo en vivo
    Código: PTT_MAE_VIVO_COLA_FONDEO
    Umbrales configurables en widgetConfig: umbralAlertaMin (720 = 12 h), umbralCriticoMin (1440 = 24 h).
*/
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { WidgetShellComponent } from 'src/app/theme/shared/components/widget-shell/widget-shell.component';
import { NaveFondeada, ResumenMaritimo } from 'src/app/theme/shared/service/tablero-control/maritimo-vivo.service';
import { WidgetMaritimoVivoBase } from '../shared/widget-maritimo-vivo.base';
import { formatoDuracion, semaforo, Semaforo, UMBRALES_FONDEO } from '../shared/maritimo-vivo.util';

@Component({
    selector: 'app-cola-fondeo',
    standalone: true,
    imports: [CommonModule, WidgetShellComponent],
    templateUrl: './cola-fondeo.component.html',
    styleUrls: ['../shared/maritimo-vivo.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ColaFondeoComponent extends WidgetMaritimoVivoBase<ResumenMaritimo> {
    protected readonly codigo = 'PTT_MAE_VIVO_COLA_FONDEO';
    public readonly duracion = formatoDuracion;

    protected consultar(puerto: string): Observable<ResumenMaritimo> {
        return this.core.resumen(puerto, 50);
    }

    private get umbrales() {
        return {
            alertaMin: Number(this.widgetConfig?.umbralAlertaMin) || UMBRALES_FONDEO.alertaMin,
            criticoMin: Number(this.widgetConfig?.umbralCriticoMin) || UMBRALES_FONDEO.criticoMin
        };
    }

    public nivel(nave: NaveFondeada): Semaforo {
        return semaforo(nave.minutos, this.umbrales);
    }

    /** Ancho de la barra relativo a la nave que más lleva esperando */
    public ancho(nave: NaveFondeada): number {
        const max = this.datos?.fondeo.minutosMaximo || 0;
        return max > 0 && nave.minutos ? Math.max(4, Math.round((nave.minutos / max) * 100)) : 4;
    }

    public enAlerta(): number {
        return (this.datos?.fondeo.cola || []).filter((n) => this.nivel(n) !== 'ok').length;
    }

    public trackMmsi(_i: number, nave: NaveFondeada): string {
        return nave.mmsi;
    }
}
