import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';

// Ajusta esta ruta a tu servicio real
import { DashboardService } from 'src/app/theme/shared/service/tablero-control/dashboard.service';
// Importamos tu Header unificado (Ajusta la ruta si es necesario)
import { WidgetHeaderComponent } from '../widget-header/widget-header.component';

@Component({
    selector: 'app-widget-shell',
    standalone: true,
    imports: [CommonModule, WidgetHeaderComponent],
    templateUrl: './widget-shell.component.html',
    styleUrl: './widget-shell.component.scss'
})
export class WidgetShellComponent implements OnInit, OnDestroy {

    // Inputs visuales
    @Input() titulo: string = '';
    @Input() subtitulo: string = '';
    @Input() icono: string = '';
    @Input() variante: 'normal' | 'kpi' = 'normal';
    @Input() mostrarLinea: boolean = true;
    @Input() colorBordeTop: string = '';

    // Inputs de datos y contexto
    @Input() widgetId: string = '';
    @Input() data: any = null;

    // 🟢 NUEVO: Entradas y salidas para hacer de puente con la Torre de Control
    @Input() isEnfoque: boolean = false;
    @Output() clickEnfoque = new EventEmitter<void>();

    public enModoEnfoque: boolean = false;
    private enfoqueSub!: Subscription;

    constructor(
        private _torreService: DashboardService,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit() {
        this.enfoqueSub = this._torreService.widgetFocus$.subscribe(widget => {
            this.enModoEnfoque = (widget !== null && widget.type === this.widgetId);
            this.cdr.detectChanges();
        });
    }

    ngOnDestroy() {
        if (this.enfoqueSub) this.enfoqueSub.unsubscribe();
    }
}
