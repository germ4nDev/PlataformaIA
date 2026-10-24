/*
    Author: German Valencia
    Componente de presentación: lista de ocupación con barra y semáforo (verde < 70 % ≤ amarillo < 85 % ≤ rojo).
    La usan bodegas de granel, patios de vehículos e indicadores.
*/
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ItemSaturacion {
    nombre: string;
    detalle?: string | null;
    porcentaje: number | null;
    semaforo: 'verde' | 'amarillo' | 'rojo' | 'gris';
    /** Texto a la derecha (si no, el porcentaje). */
    valorTexto?: string;
}

@Component({
    selector: 'app-barras-saturacion-tcl',
    standalone: true,
    imports: [CommonModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './barras-saturacion-tcl.component.html',
    styleUrls: ['./barras-saturacion-tcl.component.scss']
})
export class BarrasSaturacionTclComponent {
    @Input() items: ItemSaturacion[] = [];
    porNombre = (_: number, i: ItemSaturacion) => i.nombre;
}
