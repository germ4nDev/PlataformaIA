import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { DashboardService } from 'src/app/theme/shared/service/tablero-control/dashboard.service';

@Component({
    selector: 'app-widget-header',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './widget-header.component.html',
    styleUrl: './widget-header.component.scss'
})
export class WidgetHeaderComponent implements OnInit, OnDestroy {
    @Input() titulo: string = 'TÍTULO WIDGET';
    @Input() subtitulo: string = '';
    @Input() icono: string = '';
    @Input() widgetId: string = '';
    @Input() data: any = null;

    // 🟢 Nuevos Inputs para control de diseño
    @Input() variante: 'normal' | 'kpi' = 'normal';
    @Input() mostrarEnfoque: boolean = true;

    public enModoEnfoque: boolean = false;
    private enfoqueSub!: Subscription;

    constructor(private _dashboardService: DashboardService) { }

    ngOnInit() {
        this.enfoqueSub = this._dashboardService.widgetEnfoque$.subscribe(widgetActivo => {
            this.enModoEnfoque = (widgetActivo !== null && widgetActivo.type === this.widgetId);
        });
    }

    toggleEnfoque() {
        if (this.enModoEnfoque) {
            this._dashboardService.cerrarModoEnfoque();
        } else {
            this._dashboardService.abrirModoEnfoque(this.widgetId, this.data);
        }
    }

    ngOnDestroy() {
        if (this.enfoqueSub) this.enfoqueSub.unsubscribe();
    }
}
