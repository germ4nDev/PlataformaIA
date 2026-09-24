import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { DashboardService } from '../../service/tablero-control/dashboard.service';
// NOTA: Ajusta esta ruta a donde realmente viva tu DashboardService

@Component({
    selector: 'app-widget-header',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './widget-header.component.html',
    styleUrls: ['./widget-header.component.scss']
})
export class WidgetHeaderComponent implements OnInit, OnDestroy {

    // Inputs básicos del componente
    @Input() titulo: string = '';
    @Input() subtitulo: string = '';
    @Input() icono: string = '';
    @Input() widgetId: string = '';
    @Input() data: any = null;

    // Inputs para control de diseño
    @Input() variante: 'normal' | 'kpi' = 'normal';
    @Input() mostrarEnfoque: boolean = true;

    // Input y Output para la Torre de Control
    @Input() isEnfoque: boolean = false;
    @Output() clickEnfoque = new EventEmitter<void>();

    public enModoEnfoque: boolean = false;
    private enfoquesSub!: Subscription;

    constructor(private _dashboardService: DashboardService) { }

    ngOnInit() {
        this.enfoquesSub = this._dashboardService.widgetFocus$.subscribe(widgetActivo => {
            this.enModoEnfoque = (widgetActivo !== null && widgetActivo.type === this.widgetId);
        });
    }

    toggleEnfoque() {
        // 1. Lógica para el Home
        if (this.enModoEnfoque) {
            this._dashboardService.cerrarModoEnfoque();
        } else {
            this._dashboardService.abrirModoEnfoque(this.widgetId, this.data);
        }

        // 2. Lógica para la Torre de Control
        this.clickEnfoque.emit();
    }

    ngOnDestroy() {
        if (this.enfoquesSub) {
            this.enfoquesSub.unsubscribe();
        }
    }
}
