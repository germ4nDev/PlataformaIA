import { ChangeDetectorRef, Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { DashboardService } from 'src/app/theme/shared/service/tablero-control/dashboard.service';
import { WidgetHeaderComponent } from '../widget-header/widget-header.component';

@Component({
    selector: 'app-kpi-shell',
    standalone: true,
    imports: [CommonModule, WidgetHeaderComponent],
    templateUrl: './kpi-shell.component.html',
    styleUrl: './kpi-shell.component.scss'
})
export class KpiShellComponent implements OnInit, OnDestroy {

    @Input() titulo: string = 'INDICADOR';
    @Input() icono: string = 'feather icon-pie-chart';
    @Input() valor: number | string = 0;
    @Input() colorHex: string = '#6c757d';

    // 🟢 Nueva variable para controlar el estado de carga
    @Input() cargando: boolean = true;

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
