/*
    Author: German Valencia
    Componente de presentación común de la vista ampliada: selector de rango (24 h · 72 h · 7 días, 7 · 30 · 90 días...).
    Mismo aspecto en todos los widgets; emite el valor elegido.
*/
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface OpcionRango<T = number | string> { valor: T; etiqueta: string }

/** Rangos de horas más usados por el detalle bajo demanda. */
export const RANGOS_HORAS: OpcionRango<24 | 72 | 168>[] = [
    { valor: 24, etiqueta: '24 h' }, { valor: 72, etiqueta: '72 h' }, { valor: 168, etiqueta: '7 días' }
];

@Component({
    selector: 'app-rango-tcl',
    standalone: true,
    imports: [CommonModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <div class="rango-tcl" role="group" aria-label="Rango">
            <button type="button" *ngFor="let o of opciones" [class.activo]="o.valor === valor" [disabled]="deshabilitado"
                (click)="o.valor !== valor && cambio.emit(o.valor)">{{ o.etiqueta }}</button>
        </div>
    `,
    styles: [`
        .rango-tcl { display: inline-flex; gap: 2px; padding: 2px; border-radius: 8px; border: 1px solid var(--border-color); }
        button { border: 0; background: transparent; color: var(--text-color); font-size: 0.72rem; padding: 3px 10px; border-radius: 6px; cursor: pointer; }
        button.activo { background: #2f96b4; color: #fff; font-weight: 600; }
        button:disabled { opacity: 0.5; cursor: default; }
    `]
})
export class RangoTclComponent {
    @Input() opciones: OpcionRango<any>[] = RANGOS_HORAS;
    @Input() valor: any;
    @Input() deshabilitado = false;
    @Output() cambio = new EventEmitter<any>();
}
