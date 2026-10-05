import { Component, Input, OnInit, OnChanges, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GridsterConfig, GridsterItem, GridType, GridsterComponent, GridsterItemComponent } from 'angular-gridster2';

import { LayoutMetadataEngineService } from 'src/app/theme/shared/service/layout-metadata-engine.service';
import { MaritimoService } from 'src/app/theme/shared/service/tablero-control/maritimo.service';
import { WIDGET_MAP } from '../../widget-registry';

@Component({
    selector: 'app-maritimo-dashboard',
    standalone: true,
    imports: [CommonModule, GridsterComponent, GridsterItemComponent],
    templateUrl: './maritimo-dashboard.component.html',
    styleUrls: ['./maritimo-dashboard.component.scss']
})
export class MaritimoDashboardComponent implements OnInit, OnChanges {
    @Input() puerto!: string;
    @Input() usuarioId!: string;
    @Input() lsWidgets!: any[];

    public options!: GridsterConfig;
    public dashboard: Array<GridsterItem & { type: string, data: any, dataTerminal?: any }> = [];

    constructor(
        private layoutEngine: LayoutMetadataEngineService,
        private _maritimoService: MaritimoService,
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
        this._maritimoService.obtenerResumenOperativo(this.puerto).subscribe({
            next: async (res: any) => {
                if (res && res.success && res.data) {
                    const todosLosTerminales = res.data.WDG_TERMINALES || [];
                    const puertoUpper = (this.puerto || 'BUENAVENTURA').toUpperCase();
                    const terminalesFiltrados = todosLosTerminales.filter((t: any) =>
                        (t.id_puerto || '').toUpperCase() === puertoUpper || (t.ciudad || '').toUpperCase() === puertoUpper
                    );

                    let layoutArmado = await this.layoutEngine.obtenerLayoutBase('TLC_MARITIMO_001', this.usuarioId, this.lsWidgets, terminalesFiltrados);

                    const kpisDataOficial = [
                        { titulo: 'CAMIONES EN OPERACION', valor: res.data.camionesPuerto || '937', subtitulo: 'ZONA URBANA BUENAVENTURA', colorBorde: 'borde-cyan' },
                        { titulo: 'CONTENEDORES DÍA', valor: res.data.contenedoresDia || '2.200', subtitulo: 'FCL 2.200 · LCL 0 · Reefer 0', colorBorde: 'borde-amarillo' },
                        { titulo: 'GRANEL - TONS DÍA', valor: res.data.granelTons || '1.8K', subtitulo: 'Agrícola 35.2K · Mineral 0 · Líquido 17.6K', colorBorde: 'borde-naranja' },
                        { titulo: 'CARGA SUELTA - TM', valor: res.data.cargaSuelta || '293', subtitulo: 'Break-bulk 293 · Project 0 · Paletizada 0', colorBorde: 'borde-green' },
                        { titulo: 'VEHÍCULOS RO-RO', valor: res.data.vehiculosRoro || '147', subtitulo: 'Imp 147 · Exp 0 · PDI 95% ocupado', colorBorde: 'borde-teal' },
                        { titulo: 'SATURACIÓN BODEGAS', valor: res.data.saturacionBodegas || '72%', subtitulo: '8 bodegas · 2 críticas · ruteo activo', colorBorde: 'borde-purple' }
                    ];

                    const kpisEnTablero = layoutArmado.filter((w: any) => (w.type || '').toUpperCase().includes('KPI') || (w.codigoWidget || '').toUpperCase().includes('KPI'));

                    kpisEnTablero.forEach((kpiItem, index) => {
                        if (kpisDataOficial[index]) {
                            kpiItem.data = { ...(kpiItem.data || {}), ...kpisDataOficial[index] };
                        }
                    });

                    this.dashboard = layoutArmado.map((widget: any) => {
                        if ((widget.type || '').toUpperCase().includes('KPI') || (widget.codigoWidget || '').toUpperCase().includes('KPI')) {
                            return widget;
                        }

                        if (widget.idClon && widget.idClon.startsWith('TERM_SLOT_')) {
                            const slotIndex = parseInt(widget.idClon.replace('TERM_SLOT_', ''), 10);
                            if (!isNaN(slotIndex) && terminalesFiltrados[slotIndex]) {
                                return { ...widget, dataTerminal: terminalesFiltrados[slotIndex] };
                            }
                        }

                        let widgetData = { ...(widget.data || {}) };
                        const codigoWidget = (widget.type || widget.codigoWidget || '').trim().toUpperCase();

                        switch (codigoWidget) {
                            case 'PTT_MAE_TAB_MOTONAVES': widgetData = { ...widgetData, ...(res.data.TABLE_REPORTE_MOTONAVES || res.data.WDG_TABLE_REPORTE_MOTONAVES) }; break;
                            case 'PTT_MAE_CHRT_ETA_ATA': widgetData = { ...widgetData, ...(res.data.CHART_ETA_ATA || res.data.WDG_CHART_ETA_ATA) }; break;
                            case 'PTT_MAE_CHRT_TONELADAS': widgetData = { ...widgetData, ...(res.data.CHART_TONELADAS || res.data.WDG_CHART_TONELADAS) }; break;
                            case 'PTT_MAE_PANEL_CANAL': widgetData = { ...widgetData, ...(res.data.CONDICIONES_CANAL || res.data.WDG_CONDICIONES_CANAL) }; break;
                            case 'PTT_MAE_PANEL_RESUMEN': widgetData = { ...widgetData, ...(res.data.RESUMEN_SEMANAL || res.data.WDG_RESUMEN_SEMANAL) }; break;
                            case 'PTT_MAE_CHRT_PROD': widgetData = { ...widgetData, ...(res.data.CHART_PRODUCTIVIDAD || res.data.WDG_CHART_PRODUCTIVIDAD) }; break;
                            case 'PTT_MAE_PANEL_ALERTAS': widgetData = { ...widgetData, ...(res.data.REPORTES_OPERATIVOS || res.data.WDG_REPORTES_OPERATIVOS) }; break;
                        }

                        return { ...widget, data: widgetData };
                    });

                    this.cdr.detectChanges();
                }
            },
            error: (err) => console.error("❌ Error API Marítimo:", err)
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
