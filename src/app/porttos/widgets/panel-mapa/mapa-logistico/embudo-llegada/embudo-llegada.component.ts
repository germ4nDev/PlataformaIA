/*
    Author: German Valencia
    Componente de presentación: Embudo de llegada de naves (panel del mapa logístico)
    Solo pinta: recibe el embudo del contenedor (mapa) y avisa qué etapa eligió el usuario para resaltarla.
*/
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CodigoEtapaEmbudo, EmbudoLlegada, EtapaEmbudo } from 'src/app/theme/shared/service/tablero-control/maritimo-vivo.service';

@Component({
    selector: 'app-embudo-llegada',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './embudo-llegada.component.html',
    styleUrls: ['./embudo-llegada.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class EmbudoLlegadaComponent {
    @Input() embudo: EmbudoLlegada | null = null;
    @Input() cargando = false;
    @Input() isDark = false;
    @Input() etapaActiva: CodigoEtapaEmbudo | null = null;
    @Output() seleccionar = new EventEmitter<EtapaEmbudo | null>();
    @Output() cerrar = new EventEmitter<void>();

    get maximo(): number {
        return Math.max(1, ...(this.embudo?.etapas || []).map((e) => e.naves));
    }

    /** Ancho de la barra: proporcional a las naves, con un mínimo para que se vea la etapa vacía. */
    ancho(etapa: EtapaEmbudo): number {
        return Math.max(6, Math.round((etapa.naves / this.maximo) * 100));
    }

    elegir(etapa: EtapaEmbudo): void {
        this.seleccionar.emit(this.etapaActiva === etapa.codigo ? null : etapa);
    }

    esCuello(etapa: EtapaEmbudo): boolean {
        return this.embudo?.cuelloDeBotella?.etapa === etapa.codigo;
    }

    /** Línea de detalle de cada etapa. */
    detalle(etapa: EtapaEmbudo): string {
        if (etapa.codigo === 'AVISADA') {
            const d = etapa.detalle;
            if (!d) return '';
            return [`${d.proximas24h} en 24 h`, d.atrasadas ? `${d.atrasadas} atrasada${d.atrasadas === 1 ? '' : 's'}` : '',
                d.sinAis ? `${d.sinAis} sin AIS` : ''].filter(Boolean).join(' · ');
        }
        if (!etapa.naves || etapa.minutosPromedio === null) return '';
        const espera = `espera prom. ${this.horas(etapa.minutosPromedio)}`;
        const habitual = etapa.referenciaP90Min !== null ? ` (habitual ≤ ${this.horas(etapa.referenciaP90Min)})` : '';
        return espera + habitual;
    }

    excede(etapa: EtapaEmbudo): boolean {
        return etapa.referenciaP90Min !== null && etapa.minutosPromedio !== null && etapa.minutosPromedio > etapa.referenciaP90Min;
    }

    horas(minutos: number | null | undefined): string {
        if (minutos === null || minutos === undefined) return '—';
        return minutos >= 90 ? `${(minutos / 60).toFixed(1)} h` : `${Math.round(minutos)} min`;
    }

    trackEtapa(_: number, e: EtapaEmbudo): string {
        return e.codigo;
    }
}
