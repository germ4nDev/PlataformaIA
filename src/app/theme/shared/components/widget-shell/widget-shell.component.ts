import { Component, Input, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { DashboardService } from 'src/app/theme/shared/service/tablero-control/dashboard.service';

// 🟢 Importamos tu Header unificado
import { WidgetHeaderComponent } from '../widget-header/widget-header.component';

@Component({
    selector: 'app-widget-shell',
    standalone: true,
    imports: [CommonModule, WidgetHeaderComponent], // 🟢 Lo inyectamos aquí
    templateUrl: './widget-shell.component.html',
    styleUrl: './widget-shell.component.scss'
})
export class WidgetShellComponent implements OnInit, OnDestroy {
    @Input() titulo: string = '';
    @Input() subtitulo: string = '';
    @Input() icono: string = '';
    @Input() variante: 'normal' | 'kpi' = 'normal'; // 🟢 Nuevo Input
    @Input() mostrarLinea: boolean = true;
    @Input() colorBordeTop: string = '';

    @Input() widgetId: string = '';
    @Input() data: any = null;

    public enModoEnfoque: boolean = false;
    private enfoqueSub!: Subscription;

    constructor(
        private _torreService: DashboardService,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit() {
        this.enfoqueSub = this._torreService.widgetEnfoque$.subscribe(widget => {
            this.enModoEnfoque = (widget !== null && widget.type === this.widgetId);
            this.cdr.detectChanges();
        });
    }

    ngOnDestroy() {
        if (this.enfoqueSub) this.enfoqueSub.unsubscribe();
    }
}
