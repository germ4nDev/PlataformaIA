import { Component, Input, OnInit, OnChanges, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GridsterConfig, GridsterItem, GridType, GridsterComponent, GridsterItemComponent } from 'angular-gridster2';

import { LayoutMetadataEngineService } from 'src/app/theme/shared/service/layout-metadata-engine.service';
import { VirtualGateService } from 'src/app/theme/shared/service/tablero-control/virtual-gate.service';
import { WIDGET_MAP } from '../../widget-registry';

@Component({
    selector: 'app-virtual-gate-dashboard',
    standalone: true,
    imports: [CommonModule, GridsterComponent, GridsterItemComponent],
    templateUrl: './virtual-gate-dashboard.component.html',
    styleUrls: ['./virtual-gate-dashboard.component.scss']
})
export class VirtualGateDashboardComponent implements OnInit, OnChanges {
    @Input() puerto!: string;
    @Input() usuarioId!: string;
    @Input() lsWidgets!: any[];

    public options!: GridsterConfig;
    public dashboard: Array<GridsterItem & { type: string, data: any }> = [];

    constructor(
        private layoutEngine: LayoutMetadataEngineService,
        private _virtualGateService: VirtualGateService,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit() {
        this.iniciarGridster();
        this.cargarDatos();
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['puerto'] && !changes['puerto'].isFirstChange()) {
            this.cargarDatos();
        }
    }

    cargarDatos() {
        this._virtualGateService.obtenerColaGate().subscribe({
            next: async (res: any) => {
                if (res && res.data) {
                    let layoutArmado = await this.layoutEngine.obtenerLayoutBase('TLC_VIRTUAL_GATE_001', this.usuarioId, this.lsWidgets);

                    this.dashboard = layoutArmado.map((widget: any) => {
                        let widgetData = { ...widget.data, resumen: res.data.resumen, citas: res.data.citas };

                        if (widget.type && widget.type.includes('KPI')) {
                            switch (widget.type) {
                                case 'PTT_GATE_KPI_OP': widgetData = { titulo: 'CAMIONES EN PUERTO', valor: res.data.resumen.totalCamiones || 0, subtitulo: 'ZONA URBANA BUENAVENTURA', color: '#4dabf7', colorBorde: 'borde-cyan' }; break;
                                case 'PTT_GATE_KPI_CONT': widgetData = { titulo: 'CONTENEDORES DÍA', valor: res.data.resumen.totalContenedores || '2.847', subtitulo: 'FCL 1.900 · LCL 500 · Reefer 447', color: '#22b8cf', colorBorde: 'borde-amarillo' }; break;
                                case 'PTT_GATE_KPI_GRANEL': widgetData = { titulo: 'GRANEL - TONS DÍA', valor: '38.4K', subtitulo: 'Agrícola 20K · Mineral 18.4K', color: '#fd7e14', colorBorde: 'borde-rojo' }; break;
                                case 'PTT_GATE_KPI_SUELTA': widgetData = { titulo: 'CARGA SUELTA - TM', valor: '4.820', subtitulo: 'Break-bulk 3.000 · Paletizada 1.820', color: '#fcc419', colorBorde: 'borde-green' }; break;
                                case 'PTT_GATE_KPI_RORO': widgetData = { titulo: 'VEHÍCULOS RO-RO', valor: '1.142', subtitulo: 'Imp 800 · Exp 342 · PDI 85%', color: '#20c997', colorBorde: 'borde-fucsia' }; break;
                                case 'PTT_GATE_KPI_BODEGAS': widgetData = { titulo: 'SATURACIÓN BODEGAS', valor: '72%', subtitulo: '5 bodegas · 1 crítica · ruteo activo', color: '#cc5de8', colorBorde: 'borde-purple' }; break;
                                case 'PTT_GATE_KPI_SUB_CONT': widgetData = { titulo: 'SUB - CONTENEDORES', valor: res.data.resumen.subContenedores || 42, subtitulo: 'Retiros y devoluciones', color: '#868e96', colorBorde: 'borde-naranja' }; break;
                                case 'PTT_GATE_KPI_SUB_GRANEL': widgetData = { titulo: 'SUB - GRANEL', valor: 28, subtitulo: 'Flujo hacia silos', color: '#868e96', colorBorde: 'borde-indigo' }; break;
                                case 'PTT_GATE_KPI_SUB_SUELTA': widgetData = { titulo: 'SUB - CARGA SUELTA', valor: 11, subtitulo: 'Operación en bodega', color: '#868e96', colorBorde: 'borde-purple' }; break;
                                case 'PTT_GATE_KPI_SUB_NINERAS': widgetData = { titulo: 'SUB - NIÑERAS', valor: 6, subtitulo: 'Trasiego a patios', color: '#868e96', colorBorde: 'borde-cyan' }; break;
                            }
                        }
                        return { ...widget, data: widgetData };
                    });
                    this.cdr.detectChanges();
                }
            },
            error: (err) => console.error("❌ Error API Virtual Gate:", err)
        });
    }

    obtenerComponentePara(codigoWidget: string) {
        return WIDGET_MAP[codigoWidget] ? WIDGET_MAP[codigoWidget].componente : null;
    }

    iniciarGridster() {
        this.options = {
            gridType: GridType.ScrollVertical,
            margin: 16, minCols: 12, maxCols: 12,
            draggable: { enabled: false }, resizable: { enabled: false }
        };
    }

    trackByWidget(i: number, w: any) { return w.idClon || w.type; }
}
