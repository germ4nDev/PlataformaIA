import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-widget-shell',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './widget-shell.component.html',
    styleUrls: ['./widget-shell.component.scss']
})
export class WidgetShellComponent {
    // Textos principales
    @Input() titulo: string = '';
    @Input() subtitulo: string = '';
    @Input() icono: string = '';

    // Si el widget ya está abierto en el modal grande (para ocultar botón maximizar)
    @Input() isEnfoque: boolean = false;

    // Emisor para avisarle al padre que queremos maximizar
    @Output() clickEnfoque = new EventEmitter<void>();

    maximizarWidget() {
        this.clickEnfoque.emit();
    }
}
