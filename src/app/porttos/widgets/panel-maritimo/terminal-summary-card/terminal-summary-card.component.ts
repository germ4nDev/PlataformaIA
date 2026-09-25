import { Component, Input, ChangeDetectorRef, OnChanges, SimpleChanges, OnInit, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TerminalDocksDetailComponent } from "../terminal-docks-detail/terminal-docks-detail.component";
import { DashboardService } from 'src/app/theme/shared/service/tablero-control/dashboard.service';
import { WidgetShellComponent } from 'src/app/theme/shared/components/widget-shell/widget-shell.component';

export interface MetricaPie {
    label: string;
    valor: string | number;
}

export interface TerminalSLA {
    nombre: string;
    subtitulo: string;
    muelles: string[];
    estado_operativo: string;
    badge_class: string;
    metricas_pie: MetricaPie[];
    observacion_ia?: string;
}

@Component({
    selector: 'app-terminal-summary-card',
    standalone: true,
    imports: [CommonModule, TerminalDocksDetailComponent, WidgetShellComponent],
    templateUrl: './terminal-summary-card.component.html',
    styleUrls: ['./terminal-summary-card.component.scss']
})
export class TerminalSummaryCardComponent implements OnChanges, OnInit {

    @Input() widgetConfig: any;
    @Input() isEnfoque: boolean = false;
    @Input() mostrarTabla: boolean = false;

    public data: any;
    public cargandoIA: boolean = true;
    public estadoError: boolean = false;
    public processedData: any = {};
    public esVistaCompacta: boolean = true;

    constructor(
        private cdr: ChangeDetectorRef,
        private _torreService: DashboardService,
        private el: ElementRef
    ) { }

    ngOnInit(): void {
        if (this.widgetConfig && this.widgetConfig.data) {
            this.data = this.widgetConfig.data;
            this.cargandoIA = false;
        }
    }

    ngAfterViewInit(): void {
        const contenedorModal = this.el.nativeElement.closest('.modal, dialog, .cdk-overlay-pane, .modal-dialog');

        if (contenedorModal) {
            this.esVistaCompacta = false;
            this.mostrarTabla = true;
            this.cdr.detectChanges();
        }
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['widgetConfig'] && changes['widgetConfig'].currentValue) {
            this.data = this.widgetConfig.data;
            this.cargandoIA = false;
            this.cdr.detectChanges();
        }
    }

    public toggleVista(): void {
        this.mostrarTabla = !this.mostrarTabla;
    }

    public maximizarDesdeShell() {
        if (this.isEnfoque) {
            this._torreService.cerrarModoEnfoque(); // O el método que uses en tu servicio para cerrar el modal
        } else {
            this._torreService.abrirModoEnfoque(this.widgetConfig?.type || 'WDG_PORT_TERMINAL_INDIVIDUAL', this.data);
        }
    }
}
