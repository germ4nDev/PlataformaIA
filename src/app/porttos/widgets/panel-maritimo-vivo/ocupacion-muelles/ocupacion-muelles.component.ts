/*
    Author: German Valencia
    Pattern: PORTTOS Smart Widget - Ocupación de muelles en vivo
    Código: PTT_MAE_VIVO_MUELLES
*/
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { WidgetShellComponent } from 'src/app/theme/shared/components/widget-shell/widget-shell.component';
import { ColumnaTabla, TablaTclComponent } from '../../shared/tabla-tcl/tabla-tcl.component';
import { EstadoMuelles, MuelleOcupacion, OcupacionMuelles } from 'src/app/theme/shared/service/tablero-control/maritimo-vivo.service';
import { WidgetMaritimoVivoBase } from '../shared/widget-maritimo-vivo.base';
import { formatoDuracion } from '../shared/maritimo-vivo.util';

@Component({
    selector: 'app-ocupacion-muelles',
    standalone: true,
    imports: [CommonModule, WidgetShellComponent, TablaTclComponent],
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

    // ---------------------------------------------------------------- vista ampliada (2026-10-24)
    public readonly columnasMuelles: ColumnaTabla[] = [
        { campo: 'terminal', titulo: 'Terminal' },
        { campo: 'muelle', titulo: 'Muelle', tipo: 'principal' },
        { campo: 'especialidad', titulo: 'Especialidad' },
        { campo: 'caladoMetros', titulo: 'Calado', tipo: 'numero', decimales: 1, unidad: 'm' },
        { campo: 'estado', titulo: 'Estado', tipo: 'estado' },
        { campo: 'naves', titulo: 'Nave(s)', tipo: 'lista' },
        { campo: 'horasAtracada', titulo: 'Atracada', tipo: 'numero', decimales: 1, unidad: 'h' },
        { campo: 'fuente', titulo: 'Fuente' },
        { campo: 'verificacion', titulo: 'Verificación' },
        { campo: 'proximo', titulo: 'Próximo atraque' },
        { campo: 'proximoEnHoras', titulo: 'En', tipo: 'numero', decimales: 1, unidad: 'h' }
    ];
    public filasMuelles: any[] = [];

    /** En la vista ampliada cruza la ocupación con el estado de muelles (fuente, verificación y próximo atraque). */
    protected override alActualizar(): void {
        if (!this.isEnfoque || !this.datos) return;
        const ocupacion = this.datos;
        this.core.estadoMuelles(this.puerto).subscribe({
            next: (estado) => this.armarFilas(ocupacion, estado),
            error: () => this.armarFilas(ocupacion, null)
        });
    }

    private armarFilas(o: OcupacionMuelles, estado: EstadoMuelles | null): void {
        const extra = new Map((estado?.features || []).map((f) => [`${f.properties.idTerminal}|${f.properties.codigoMuelle}`, f.properties]));
        const filas: any[] = [];
        for (const t of o.terminales) {
            for (const m of t.muelles) {
                const e = extra.get(`${m.idTerminal}|${m.codigoMuelle}`);
                const minutos = Math.max(0, ...m.naves.map((n) => n.minutos || 0));
                filas.push({
                    id: `${t.idTerminal}-${m.codigoMuelle}`, terminal: t.nombre, muelle: m.codigoMuelle, especialidad: m.especialidad,
                    caladoMetros: m.caladoMetros, estado: m.enMantenimiento ? 'MANTENIMIENTO' : m.ocupado ? 'OCUPADO' : e?.estado === 'RESERVADO' ? 'RESERVADO' : 'LIBRE',
                    naves: m.naves.map((n) => n.nombre || n.mmsi), horasAtracada: m.ocupado && minutos ? minutos / 60 : null,
                    fuente: e?.fuente || null, verificacion: e?.verificacionTexto || null,
                    proximo: e?.proximoMotonave || null, proximoEnHoras: e?.proximoEnMinutos != null ? e.proximoEnMinutos / 60 : null
                });
            }
            t.navesSinMuelle.forEach((n, i) => filas.push({
                id: `${t.idTerminal}-sin-${i}`, terminal: t.nombre, muelle: '—', estado: 'SIN MUELLE', naves: [n.nombre || n.mmsi],
                horasAtracada: n.minutos ? n.minutos / 60 : null
            }));
        }
        o.navesSinTerminal.forEach((n, i) => filas.push({
            id: `sin-terminal-${i}`, terminal: 'Fuera de terminales', muelle: '—', estado: 'SIN TERMINAL', naves: [n.nombre || n.mmsi],
            horasAtracada: n.minutos ? n.minutos / 60 : null
        }));
        this.filasMuelles = filas;
        this.cdr.markForCheck();
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
