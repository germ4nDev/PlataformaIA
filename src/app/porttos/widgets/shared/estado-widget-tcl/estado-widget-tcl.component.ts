/*
    Author: German Valencia
    Componente de presentación: estado de un widget (cargando, error o sin datos). Si no aplica, no pinta nada.
*/
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-estado-widget-tcl',
    standalone: true,
    imports: [CommonModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './estado-widget-tcl.component.html',
    styleUrls: ['./estado-widget-tcl.component.scss']
})
export class EstadoWidgetTclComponent {
    @Input() cargando = false;
    @Input() error: string | null = null;
    @Input() vacio = false;
    @Input() mensajeCarga = 'Cargando...';
    @Input() mensajeVacio = 'Sin datos por ahora.';
    @Input() icono = 'feather icon-inbox';

    /** true si el widget debe mostrar su contenido. */
    get listo(): boolean {
        return !this.cargando && !this.error && !this.vacio;
    }
}
