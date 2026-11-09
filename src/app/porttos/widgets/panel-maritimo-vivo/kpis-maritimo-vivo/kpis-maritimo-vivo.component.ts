import { TranslateModule } from '@ngx-translate/core';
/*
    Author: German Valencia
    Pattern: PORTTOS Smart Widget - KPIs marítimos en vivo
    Código: PTT_MAE_VIVO_KPIS
*/
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { forkJoin, Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { WidgetShellComponent } from 'src/app/theme/shared/components/widget-shell/widget-shell.component';
import { ColumnaTabla, TablaTclComponent } from '../../shared/tabla-tcl/tabla-tcl.component';
import {
    EmbudoLlegada, Llegadas, OcupacionMuelles, ResumenMaritimo, TiemposMaritimos
} from 'src/app/theme/shared/service/tablero-control/maritimo-vivo.service';
import { WidgetMaritimoVivoBase } from '../shared/widget-maritimo-vivo.base';
import { CLASE_SEMAFORO, formatoDuracion, semaforo } from '../shared/maritimo-vivo.util';

interface DatosKpis {
    resumen: ResumenMaritimo | null;
    ocupacion: OcupacionMuelles | null;
    llegadas: Llegadas | null;
    tiempos: TiemposMaritimos | null;
    /** Solo en la vista ampliada: embudo de llegada con cuello de botella (/maritimo/:puerto/embudo). */
    embudo: EmbudoLlegada | null;
}

interface Tarjeta {
    titulo: string;
    valor: string;
    detalle: string;
    icono: string;
    clase: string;
}

@Component({
    selector: 'app-kpis-maritimo-vivo',
    standalone: true,
    imports: [TranslateModule, CommonModule, WidgetShellComponent, TablaTclComponent],
    templateUrl: './kpis-maritimo-vivo.component.html',
    styleUrls: ['../shared/maritimo-vivo.scss', './kpis-maritimo-vivo.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class KpisMaritimoVivoComponent extends WidgetMaritimoVivoBase<DatosKpis> {
    protected readonly codigo = 'PTT_MAE_VIVO_KPIS';
    public tarjetas: Tarjeta[] = [];
    public readonly duracion = formatoDuracion;

    // Vista ampliada (2026-10-24)
    public readonly columnasEstados: ColumnaTabla[] = [
        { campo: 'estado', titulo: 'PORTTOS.KPIS_MARITIMO_VIVO.ESTADO_AIS', tipo: 'estado' },
        { campo: 'naves', titulo: 'PORTTOS.KPIS_MARITIMO_VIVO.NAVES', tipo: 'numero' },
        { campo: 'minutosPromedio', titulo: 'PORTTOS.KPIS_MARITIMO_VIVO.TIEMPO_PROMEDIO', tipo: 'numero', unidad: 'min' },
        { campo: 'minutosMaximo', titulo: 'PORTTOS.KPIS_MARITIMO_VIVO.MAXIMO', tipo: 'numero', unidad: 'min' }
    ];
    public readonly columnasCriticas: ColumnaTabla[] = [
        { campo: 'nombre', titulo: 'PORTTOS.COMUN.NAVE', tipo: 'principal' },
        { campo: 'mmsi', titulo: 'MMSI' },
        { campo: 'estado', titulo: 'PORTTOS.COMUN.ESTADO', tipo: 'estado' },
        { campo: 'minutos', titulo: 'PORTTOS.KPIS_MARITIMO_VIVO.TIEMPO_EN_EL_ESTADO', tipo: 'numero', unidad: 'min' },
        { campo: 'idTerminal', titulo: 'PORTTOS.COMUN.TERMINAL' }
    ];
    public filasEstados: any[] = [];
    public filasCriticas: any[] = [];

    /**
     * Cada consulta es independiente: si una falla (p. ej. falta la migración 005 para "tiempos"),
     * su tarjeta muestra "—" y las demás siguen. Antes un solo error apagaba las 5 tarjetas.
     */
    protected consultar(puerto: string): Observable<DatosKpis> {
        const seguro = <T>(o: Observable<T>) => o.pipe(catchError(() => of(null)));
        return forkJoin({
            resumen: seguro(this.core.resumen(puerto)),
            ocupacion: seguro(this.core.ocupacion(puerto)),
            llegadas: seguro(this.core.llegadas(puerto)),
            tiempos: seguro(this.core.tiempos(puerto, 30)),
            embudo: this.isEnfoque ? seguro(this.core.embudo(puerto)) : of(null)
        });
    }

    protected override alActualizar(): void {
        const d = this.datos;
        if (!d) return;
        const sinDato = (titulo: string, icono: string): Tarjeta =>
            ({ titulo, valor: '—', detalle: 'Sin datos disponibles', icono, clase: 'badge-secondary' });
        const tarjetas: Tarjeta[] = [];

        const r = d.resumen;
        tarjetas.push(r ? {
            titulo: 'PORTTOS.KPIS_MARITIMO_VIVO.FONDEADAS_AHORA',
            valor: String(r.fondeo.naves),
            detalle: `Prom. ${formatoDuracion(r.fondeo.minutosPromedio)} · máx. ${formatoDuracion(r.fondeo.minutosMaximo)}`,
            icono: 'feather icon-anchor',
            clase: CLASE_SEMAFORO[semaforo(r.fondeo.minutosMaximo)]
        } : sinDato('Fondeadas ahora', 'feather icon-anchor'));

        const ocup = d.ocupacion?.resumen;
        if (ocup) {
            const operables = ocup.muelles - ocup.enMantenimiento;
            tarjetas.push({
                titulo: 'PORTTOS.KPIS_MARITIMO_VIVO.OCUPACION_DE_MUELLES',
                valor: ocup.porcentajeOcupacion == null ? '—' : `${ocup.porcentajeOcupacion}%`,
                detalle: `${ocup.ocupados}/${operables} ocupados${ocup.enMantenimiento ? ` · ${ocup.enMantenimiento} en mant.` : ''}`,
                icono: 'feather icon-grid',
                clase: (ocup.porcentajeOcupacion ?? 0) >= 90 ? 'badge-danger' : (ocup.porcentajeOcupacion ?? 0) >= 75 ? 'badge-warning' : 'badge-success'
            });
        } else tarjetas.push(sinDato('Ocupación de muelles', 'feather icon-grid'));

        const ll = d.llegadas?.resumen;
        tarjetas.push(ll ? {
            titulo: 'PORTTOS.KPIS_MARITIMO_VIVO.LLEGADAS_24_H',
            valor: String(ll.proximas24h),
            detalle: `${ll.atrasadas} atrasadas · ${ll.sinAis} sin AIS`,
            icono: 'feather icon-navigation',
            clase: ll.atrasadas > 0 ? 'badge-warning' : 'badge-info'
        } : sinDato('Llegadas 24 h', 'feather icon-navigation'));

        const espera = d.tiempos?.fondeo.resumen;
        tarjetas.push(espera ? {
            titulo: 'PORTTOS.KPIS_MARITIMO_VIVO.ESPERA_EN_FONDEO_P90_30',
            valor: formatoDuracion(espera.p90Min),
            detalle: `Mediana ${formatoDuracion(espera.medianaMin)} · ${espera.eventos} atraques`,
            icono: 'feather icon-clock',
            clase: CLASE_SEMAFORO[semaforo(espera.p90Min)]
        } : sinDato('Espera en fondeo (p90 · 30 d)', 'feather icon-clock'));

        tarjetas.push(r ? {
            titulo: 'PORTTOS.KPIS_MARITIMO_VIVO.NAVES_EN_ZONA',
            valor: String(r.totalNaves),
            detalle: `${r.atracadas} atracadas · ${r.enMovimiento} en movimiento`,
            icono: 'feather icon-radio',
            clase: r.criticas > 0 ? 'badge-danger' : 'badge-primary'
        } : sinDato('Naves en zona', 'feather icon-radio'));

        this.tarjetas = tarjetas;
        this.filasEstados = Object.entries(d.resumen?.porEstado || {})
            .map(([estado, m]) => ({ estado, ...m }))
            .sort((a, b) => b.naves - a.naves);
        this.filasCriticas = (d.embudo?.criticas?.lista || []).map((n, i) => ({ ...n, estado: n.estado || n.situacion, mmsi: n.mmsi || `—${i}` }));
    }
}
