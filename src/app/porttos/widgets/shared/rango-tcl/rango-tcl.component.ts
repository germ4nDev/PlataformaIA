import { TranslateModule } from '@ngx-translate/core';
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
    imports: [TranslateModule, CommonModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './rango-tcl.component.html',
    styleUrl: './rango-tcl.component.scss'
})
export class RangoTclComponent {
    @Input() opciones: OpcionRango<any>[] = RANGOS_HORAS;
    @Input() valor: any;
    @Input() deshabilitado = false;
    @Output() cambio = new EventEmitter<any>();
}
