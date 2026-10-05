import { Component, Input, OnInit, OnChanges, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GridsterConfig, GridsterItem, GridType, GridsterComponent, GridsterItemComponent } from 'angular-gridster2';

import { LayoutMetadataEngineService } from 'src/app/theme/shared/service/layout-metadata-engine.service';
import { ContenedoresService } from 'src/app/theme/shared/service/tablero-control/contenedores.service';
import { WIDGET_MAP } from '../../widget-registry';

@Component({
    selector: 'app-contenedores-dashboard',
    standalone: true,
    imports: [CommonModule, GridsterComponent, GridsterItemComponent],
    templateUrl: './contenedores-dashboard.component.html',
    styleUrls: ['./contenedores-dashboard.component.scss']
})
export class ContenedoresDashboardComponent implements OnInit, OnChanges {
    @Input() puerto!: string;
    @Input() usuarioId!: string;
    @Input() lsWidgets!: any[];

    public options!: GridsterConfig;
    public dashboard: Array<GridsterItem & { type: string, data: any }> = [];

    constructor(
        private layoutEngine: LayoutMetadataEngineService,
        private _contenedoresService: ContenedoresService,
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
        this._contenedoresService.obtenerDashboardContenedores().subscribe({
            next: async (res: any) => {
                if (res && res.data) {
                    let layoutArmado = await this.layoutEngine.obtenerLayoutBase('TLC_CONTENEDORES_001', this.usuarioId, this.lsWidgets);

                    this.dashboard = layoutArmado.map((widget: any) => {
                        let widgetData = { ...widget.data };

                        if (widget.type && widget.type.includes('KPI')) {
                            switch (widget.type) {
                                case 'PTT_CONT_KPI_CARGADOS': widgetData = { titulo: 'CARGADOS PENDIENTES', valor: res.data.kpis?.cargadosPendientes?.valor, subtitulo: res.data.kpis?.cargadosPendientes?.subtitulo, color: res.data.kpis?.cargadosPendientes?.color, colorBorde: 'borde-cyan' }; break;
                                case 'PTT_CONT_KPI_VACIOS': widgetData = { titulo: 'VACÍOS POR DEVOLVER', valor: res.data.kpis?.vaciosDevolver?.valor, subtitulo: res.data.kpis?.vaciosDevolver?.subtitulo, color: res.data.kpis?.vaciosDevolver?.color, colorBorde: 'borde-naranja' }; break;
                                case 'PTT_CONT_KPI_REEFER': widgetData = { titulo: 'REEFER ACTIVOS', valor: res.data.kpis?.reeferActivos?.valor, subtitulo: res.data.kpis?.reeferActivos?.subtitulo, color: res.data.kpis?.reeferActivos?.color, colorBorde: 'borde-teal' }; break;
                                case 'PTT_CONT_KPI_FREETIME': widgetData = { titulo: 'FREE TIME VENCIDO', valor: res.data.kpis?.freeTimeVencido?.valor, subtitulo: res.data.kpis?.freeTimeVencido?.subtitulo, color: res.data.kpis?.freeTimeVencido?.color, colorBorde: 'borde-blue' }; break;
                            }
                        } else {
                            switch (widget.type) {
                                case 'PTT_CONT_CHRT_RETIROS': widgetData = res.data.retirosPriorizacion; break;
                                case 'PTT_CONT_CHRT_NAVIERA': widgetData = res.data.vaciosNaviera; break;
                                case 'PTT_CONT_PANEL_PATIOS': widgetData = res.data.saturacionPatios; break;
                                case 'PTT_CONT_CHRT_FREETIME': widgetData = res.data.freeTimeDistribucion; break;
                                case 'PTT_CONT_TAB_MOVIMIENTOS': widgetData = res.data.movimientos; break;
                            }
                        }
                        return { ...widget, data: widgetData };
                    });
                    this.cdr.detectChanges();
                }
            },
            error: (err) => console.error("❌ Error API Contenedores:", err)
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
