import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardService } from '../../service/tablero-control/dashboard.service';
import { OrigenDato, OrigenDatoTclComponent } from '../origen-dato/origen-dato.component';

@Component({
    selector: 'app-widget-shell',
    standalone: true,
    imports: [CommonModule, OrigenDatoTclComponent],
    templateUrl: './widget-shell.component.html',
    styleUrls: ['./widget-shell.component.scss']
})
export class WidgetShellComponent {
    // Textos principales
    @Input() titulo: string = '';
    @Input() subtitulo: string = '';
    @Input() icono: string = '';
    @Input() tituloFooter?: string = '';
    @Input() isEnfoque: boolean = false;
    /**
     * Vista ampliada como lienzo: la vista del tablero arriba y el [detalle-enfoque] debajo. Sin lienzo (por defecto,
     * como estaba), el detalle reemplaza la vista. Si el widget no proyecta detalle, se ve lo mismo que en el tablero.
     */
    @Input() lienzo: boolean = false;
    /** Origen del dato (contrato `origen` del API): se muestra al pie de la vista ampliada. */
    @Input() origen: OrigenDato | null | undefined = null;

    // Emisor para avisarle al padre que queremos maximizar
    @Output() clickEnfoque = new EventEmitter<void>();

    constructor(private _dashboardService: DashboardService) { }

    maximizarWidget() {
        this.clickEnfoque.emit();
    }
}
