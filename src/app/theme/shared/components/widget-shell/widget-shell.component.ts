import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardService } from '../../service/tablero-control/dashboard.service';

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
    @Input() tituloFooter?: string = '';
    @Input() isEnfoque: boolean = false;

    // Emisor para avisarle al padre que queremos maximizar
    @Output() clickEnfoque = new EventEmitter<void>();

    constructor(private _dashboardService: DashboardService) { }

    maximizarWidget() {
        console.log('NNNNNNNNNNNNNNNNNNNNNNNNNNNNNN');
        this.clickEnfoque.emit();
    }
}
