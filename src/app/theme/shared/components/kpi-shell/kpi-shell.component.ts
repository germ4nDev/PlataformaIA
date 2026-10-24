/*
    Author: German Valencia
    Pattern: PORTTOS Core - Shell Específico para Widgets KPI (1x1 / 1x2)
*/
import { Component, Input, Output, EventEmitter, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-kpi-shell',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './kpi-shell.component.html',
    styleUrls: ['./kpi-shell.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class KpiShellComponent {
    @Input() titulo: string = '';
    @Input() subtitulo: string = '';
    @Input() icono: string = 'feather icon-activity';

    // Recibe el color para pintar el borde izquierdo (success, warning, danger, info)
    @Input() colorBorde: string = 'info';
    @Input() isEnfoque: boolean = false;

    // Emite el evento para que el widget padre abra el modal con sus gráficas/tablas detalladas
    @Output() clickEnfoque = new EventEmitter<void>();

    getBordeClase(): string {
        const clase = (this.colorBorde || '').toLowerCase();
        // Si desde el switch mandas solo 'borde-cyan', lo retornamos directo
        return clase.startsWith('borde-') ? clase : `borde-${clase}`;
    }

    maximizarWidget() {
        this.clickEnfoque.emit();
    }
}
