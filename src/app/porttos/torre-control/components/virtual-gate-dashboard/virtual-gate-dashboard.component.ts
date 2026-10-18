/*
    Author: German Valencia
    Component: Virtual Gate Dashboard (Layout Manager Puro - Arquitectura Smart Widgets)
*/
import { Component, Input, OnInit, OnChanges, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GridsterConfig, GridsterItem, GridType, GridsterComponent, GridsterItemComponent } from 'angular-gridster2';

import { LayoutMetadataEngineService } from 'src/app/theme/shared/service/layout-metadata-engine.service';
import { VirtualGateService } from 'src/app/theme/shared/service/tablero-control/virtual-gate.service';
import { LocalStorageService } from 'src/app/theme/shared/service';
import { WIDGET_MAP } from '../../widget-registry';

@Component({
    selector: 'app-virtual-gate-dashboard',
    standalone: true,
    imports: [CommonModule, GridsterComponent, GridsterItemComponent],
    templateUrl: './virtual-gate-dashboard.component.html',
    styleUrls: ['./virtual-gate-dashboard.component.scss']
})
export class VirtualGateDashboardComponent implements OnInit, OnChanges {
    @Input() puerto: string = 'BUENAVENTURA';
    @Input() usuarioId!: string;
    @Input() lsWidgets: any[] = [];

    private _tableroBloqueado = true;
    @Input()
    set tableroBloqueado(bloqueado: boolean) {
        this._tableroBloqueado = bloqueado;
        if (this.options && this.options.api) {
            this.options.draggable = { enabled: !bloqueado };
            this.options.resizable = { enabled: !bloqueado };
            this.options.api.optionsChanged!();
        }
    }
    get tableroBloqueado(): boolean {
        return this._tableroBloqueado;
    }

    public readonly pestanaActiva: string = 'TLC_VIRTUAL_GATE_001';
    public options: GridsterConfig = {};

    public dashboard: Array<GridsterItem & {
        id?: string;
        idClon?: string;
        type: string;
        componenteTarget?: any;
        componenteInputs?: { widgetConfig: any };
    }> = [];

    public cargando: boolean = true;
    public hayCambiosSinGuardar: boolean = false;
    private construyendoLayout: boolean = false;

    constructor(
        private layoutEngine: LayoutMetadataEngineService,
        private _virtualGateService: VirtualGateService,
        private _localStorageService: LocalStorageService,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit(): void {
        this.iniciarGridster();

        this._virtualGateService.obtenerColaGate(this.puerto, true).subscribe();

        if (this.lsWidgets && this.lsWidgets.length > 0) {
            this.inicializarLayoutPorPuerto();
        }
    }

    ngOnChanges(changes: SimpleChanges): void {
        const catalogoListo = this.lsWidgets && this.lsWidgets.length > 0;

        if (changes['puerto'] && !changes['puerto'].isFirstChange() && catalogoListo) {
            this._virtualGateService.limpiarCachePuerto();
            this._virtualGateService.obtenerColaGate(this.puerto, true).subscribe();

            this.inicializarLayoutPorPuerto(true);
        }

        if (changes['lsWidgets'] && catalogoListo && this.dashboard.length === 0) {
            this.inicializarLayoutPorPuerto();
        }
    }

    async inicializarLayoutPorPuerto(forzarReconstruccion: boolean = false): Promise<void> {
        if (this.construyendoLayout) return;
        this.construyendoLayout = true;
        this.cargando = true;

        const puertoNormalizado = (this.puerto || 'BUENAVENTURA').trim().toUpperCase();
        const cacheKey = `${this.pestanaActiva}_${puertoNormalizado}`;

        try {
            let layoutGuardado = !forzarReconstruccion
                ? this._localStorageService.getLayoutPestana(cacheKey)
                : null;

            if (!layoutGuardado || layoutGuardado.length === 0) {
                layoutGuardado = await this.layoutEngine.obtenerLayoutBase(
                    this.pestanaActiva,
                    this.usuarioId,
                    this.lsWidgets
                );

                layoutGuardado = (layoutGuardado || []).filter((w: any) => w.type || w.codigoWidget);
                this._localStorageService.guardarLayoutPestanaEnSesion(cacheKey, layoutGuardado);
            }

            this.dashboard = (layoutGuardado || []).map((w: any, index: number) => {
                const codigoTipo = (w.type || w.codigoWidget || '').trim().toUpperCase();
                const idUnico = w.idClon || w.id || `wdg-gate-${index}-${w.x}-${w.y}`;

                return {
                    ...w,
                    id: idUnico,
                    type: codigoTipo,
                    componenteTarget: this.obtenerComponentePara(codigoTipo),
                    componenteInputs: {
                        widgetConfig: {
                            ...w,
                            id: idUnico,
                            type: codigoTipo,
                            puerto: puertoNormalizado
                        }
                    }
                };
            });
        } catch (error) {
            console.error('❌ [Virtual Gate Layout Manager] Error construyendo el layout:', error);
        } finally {
            this.cargando = false;
            this.construyendoLayout = false;
            this.cdr.detectChanges();

            setTimeout(() => {
                if (this.options?.api?.resize) {
                    this.options.api.resize();
                }
            }, 50);
        }
    }

    obtenerComponentePara(codigoWidget: string): any {
        if (!codigoWidget) return null;

        const key = codigoWidget.trim().toUpperCase();

        if (WIDGET_MAP[key]) {
            return WIDGET_MAP[key].componente;
        }

        if (key.startsWith('PTT_GATE_KPI_')) {
            return WIDGET_MAP['PTT_GATE_KPI_OP'].componente; // Usamos este como puente a la clase KpiCardTclComponent
        }

        return null;
    }

    iniciarGridster(): void {
        this.options = {
            gridType: GridType.ScrollVertical,
            margin: 12,
            outerMargin: true,
            outerMarginBottom: 24,
            addEmptyRowsCount: 1,
            minCols: 12,
            maxCols: 12,
            minRows: 1,
            maxRows: 1000,
            fixedRowHeight: 160,
            pushItems: true,
            swap: false,
            compactType: 'none',
            defaultItemCols: 4,
            defaultItemRows: 3,
            displayGrid: 'onDrag&Resize',
            draggable: { enabled: !this.tableroBloqueado },
            pushDirections: { north: true, east: true, south: true, west: true },
            resizable: { enabled: !this.tableroBloqueado },
            mobileBreakpoint: 960,
            keepFixedHeightInMobile: true,
            itemResizeCallback: () => {
                if (!this.cargando) this.hayCambiosSinGuardar = true;
            },
            itemChangeCallback: () => {
                if (!this.cargando) this.hayCambiosSinGuardar = true;
            }
        };
    }

    trackByWidget(index: number, w: any): string {
        const origen = w.componenteInputs?.widgetConfig || w;
        return origen.idClon || origen.id || origen.type || index.toString();
    }
}
