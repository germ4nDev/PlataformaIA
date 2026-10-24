/*
    Author: German Valencia
    Componente de presentación: panel "Reproducir" del mapa logístico (últimas 6, 12 o 24 h).
    Solo pinta y avisa: el contenedor (mapa) trae el recorrido, lleva el reloj y mueve las capas.
*/
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EventoRecorrido, RecorridoMapa } from 'src/app/theme/shared/service/tablero-control/recorrido-mapa.service';
import { VELOCIDADES_RECORRIDO, VENTANAS_RECORRIDO, fechaDelSegundo } from '../mapa-recorrido';

@Component({
    selector: 'app-recorrido-panel',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './recorrido-panel.component.html',
    styleUrls: ['./recorrido-panel.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class RecorridoPanelComponent {
    @Input() recorrido: RecorridoMapa | null = null;
    @Input() cargando = false;
    @Input() error: string | null = null;
    @Input() isDark = false;
    @Input() horas = 24;
    @Input() segundo = 0;
    @Input() reproduciendo = false;
    @Input() velocidad = 300;

    @Output() cambiarHoras = new EventEmitter<number>();
    @Output() alternar = new EventEmitter<void>();
    @Output() cambiarVelocidad = new EventEmitter<number>();
    @Output() buscar = new EventEmitter<number>();
    @Output() verEvento = new EventEmitter<EventoRecorrido>();
    @Output() cerrar = new EventEmitter<void>();
    @Output() salir = new EventEmitter<void>();

    readonly ventanas = VENTANAS_RECORRIDO;
    readonly velocidades = VELOCIDADES_RECORRIDO;

    get duracion(): number {
        return this.recorrido?.duracionSeg || 0;
    }

    get vacio(): boolean {
        return !!this.recorrido && !this.recorrido.objetos.length && !this.recorrido.eventos.length;
    }

    get fecha(): Date | null {
        return this.recorrido ? fechaDelSegundo(this.recorrido, this.segundo) : null;
    }

    /** Día en español y hora de Colombia (la app no registra el locale 'es' de Angular). */
    get dia(): string {
        const f = this.fecha;
        return f ? f.toLocaleDateString('es-CO', { timeZone: 'America/Bogota', weekday: 'short', day: 'numeric', month: 'short' }) : '';
    }

    /** Posición (%) de un segundo en la barra de tiempo. */
    pos(seg: number): number {
        return this.duracion ? Math.min(100, Math.max(0, (seg / this.duracion) * 100)) : 0;
    }

    /** Hora (Colombia) de un evento. */
    hora(seg: number): Date | null {
        return this.recorrido ? fechaDelSegundo(this.recorrido, seg) : null;
    }

    saltar(minutos: number): void {
        this.buscar.emit(Math.min(this.duracion, Math.max(0, this.segundo + minutos * 60)));
    }

    alMover(valor: string): void {
        this.buscar.emit(Number(valor));
    }

    trackEvento(_: number, e: EventoRecorrido): string {
        return `${e.seg}-${e.titulo}`;
    }
}
