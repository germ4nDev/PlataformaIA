import { Component, Input, Output, EventEmitter, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-widget-enfoque-shell',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './widget-enfoque-shell.component.html',
    styleUrls: ['./widget-enfoque-shell.component.scss']
})
export class WidgetEnfoqueShellComponent {
    @Input() titulo: string = 'Panel Detallado';
    @Input() subtitulo: string = 'ANÁLISIS DETALLADO';
    @Input() icono: string = 'fas fa-chart-line text-info';
    @Input() headerExtrasTemplate?: TemplateRef<any>;

    @Output() cerrar = new EventEmitter<void>();

    onCerrarClick() {
        this.cerrar.emit();
    }
}
