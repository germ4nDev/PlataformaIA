/*
    Author: German Valencia
    Pattern: PORTTOS Orchestrator Component - Multi-Tenant (QPLUS Unified)
    Refactor: Integración de Motor de Layouts Dinámico (Fábricas)
*/
import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { GridsterConfig, GridsterItem, GridType, GridsterComponent, GridsterItemComponent } from 'angular-gridster2';

import { Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter } from 'rxjs/operators';

import { DashboardService } from 'src/app/theme/shared/service/tablero-control/dashboard.service';
import { TableroStateService } from '../../theme/shared/service/tablero-control/tablero-state.service';
import { FiltroTableroService } from 'src/app/theme/shared/service/tablero-control/filtro-tablero.service';
import { PTLWidgetsMaestroService } from 'src/app/theme/shared/service/ptlwidgets-maestro.service';
import { MaritimoService } from 'src/app/theme/shared/service/tablero-control/maritimo.service';
import { VirtualGateService } from 'src/app/theme/shared/service/tablero-control/virtual-gate.service';
import { ContenedoresService } from 'src/app/theme/shared/service/tablero-control/contenedores.service';
import { LocalStorageService } from 'src/app/theme/shared/service';
import { PtlpestanasService } from 'src/app/theme/shared/service/ptlpestanas.service';

import { TcHeaderComponent } from "../widgets/tc-header/tc-header.component";
import { WidgetSelectorTclComponent } from "../widgets/widget-selector-tcl/widget-selector-tcl.component";
import { WidgetLobbyTclComponent } from "../widgets/widget-lobby-tcl/widget-lobby-tcl.component";
import { PestanaLobbyTclComponent } from '../widgets/pestana-lobby-tcl/pestana-lobby-tcl.component';
import { Widget } from 'src/app/theme/shared/_helpers/models/tablero-control/widget.model';
import { LayoutTclService } from 'src/app/theme/shared/service/tablero-control/layout-tcl.service';

import { construirLayoutEstatico, construirLayoutMaritimo } from '../../theme/shared/_config/tab-layouts.config';

@Component({
    selector: 'app-torre-control',
    standalone: true,
    imports: [CommonModule, TranslateModule, TcHeaderComponent, GridsterComponent, GridsterItemComponent, WidgetSelectorTclComponent, WidgetLobbyTclComponent, PestanaLobbyTclComponent],
    templateUrl: './torre-control.component.html',
    styleUrls: ['./torre-control.component.scss']
})
export class TorreControlComponent implements OnInit, OnDestroy {
    public options!: GridsterConfig;
    public dashboard: Array<GridsterItem & { type: string, data: any }> = [];

    public cargando: boolean = true;
    public tableroBloqueado: boolean = true;
    public widgetEnfoque: { type: string, data: any } | null = null;
    public hayCambiosSinGuardar: boolean = false;

    public lsWidgets: Widget[] = [];
    public lsLayout: any[] = [];
    public widgetsParaElLobby: any[] = [];
    public lsPestanas: any[] = [];

    public pestanaActiva: string = '';
    public puertoSeleccionado: string = 'BUENAVENTURA';
    public usuarioId: string = '';
    public mostrarLobby: boolean = false;
    public isLoading = false;
    public pestanasVisibles: any[] = [];
    public mostrarLobbyPestanas: boolean = false;

    private readonly APP_PORTTOS_ID = '3eb98a9f-cc5d-417d-95ea-a2b8abc3b5fa';

    public listaDePuertos: any[] = [
        { id: 'BUENAVENTURA', nombre: 'Buenaventura (SPRBUN / TCBUEN)' },
        { id: 'CARTAGENA', nombre: 'Cartagena (SPRC / CONTECAR)' },
        { id: 'BARRANQUILLA', nombre: 'Barranquilla (SPRB)' },
        { id: 'SANTAMARTA', nombre: 'Santa Marta (SPRB)' }
    ];

    private subs: Subscription = new Subscription();

    constructor(
        private _stateService: TableroStateService,
        private _torreService: DashboardService,
        private _maritimoService: MaritimoService,
        private _virtualGateService: VirtualGateService,
        private _contenedoresService: ContenedoresService,
        private _filtroService: FiltroTableroService,
        private _widgetsService: PTLWidgetsMaestroService,
        private _localStoragoService: LocalStorageService,
        private _layoutService: LayoutTclService,
        private _pestanasService: PtlpestanasService,
        private cdr: ChangeDetectorRef
    ) { }

    async ngOnInit() {
        this.iniciarConfiguracionGridster();

        this.lsLayout = this._layoutService.getLayoutActuales();
        const current = this._localStoragoService.getCurrentUserLocalStorage();
        this.usuarioId = current?.usuario?.codigoUsuario || 'SISTEMA_DEFAULT';

        const navSetttings = this._localStoragoService.getNavSettingsLocalStorage();
        const codigoSuite = navSetttings.suite?.codigoSuite || 'a815687f-b9b6-4404-83dd-9a4074224320';
        const codigoAplicacion = navSetttings.aplicacion?.codigoAplicacion || this.APP_PORTTOS_ID;

        this._pestanasService.obtenerPestanasDelContexto(codigoSuite, codigoAplicacion).subscribe(async (res: any) => {
            if (res.success && res.data && res.data.length > 0) {
                this.lsPestanas = res.data;

                // const preferencias = await this._localStoragoService.getTableroLocalStorage() || {};
                // const pestaActivasUsuario = preferencias.pestanasVisibles || [];

                // if (pestaActivasUsuario.length > 0) {
                //     this.pestanasVisibles = this.lsPestanas.filter(p => pestaActivasUsuario.includes(p.codigoPestana));
                // } else {
                //     this.pestanasVisibles = this.lsPestanas.filter((p, index) => index < 3);
                // }

                // const pestanaGuardada = preferencias.pestana;
                const preferencias = await this._localStoragoService.getTableroLocalStorage() || {};
                const pestaActivasUsuario = preferencias.pestanasVisibles || [];

                if (pestaActivasUsuario.length > 0) {
                    // 🟢 FIX: Mapear respetando el orden guardado en el LocalStorage
                    this.pestanasVisibles = pestaActivasUsuario
                        .map((codigo: string) => this.lsPestanas.find(p => p.codigoPestana === codigo))
                        .filter((p: any) => p !== undefined);
                } else {
                    this.pestanasVisibles = this.lsPestanas.filter((p, index) => index < 3);
                }

                const pestanaGuardada = preferencias.pestana;
                const existePestana = this.pestanasVisibles.find(p => p.codigoPestana === pestanaGuardada);
                this.pestanaActiva = existePestana ? pestanaGuardada : this.pestanasVisibles[0].codigoPestana;

                this.cargarCatalogoWidgetsYRenderizar();
            }
        });

        this.subs.add(
            this._filtroService.ciudad$.pipe(
                distinctUntilChanged(),
                debounceTime(300),
                filter(puerto => !!puerto)
            ).subscribe(async (puerto: any) => {
                const puertoStr = typeof puerto === 'string' ? puerto : (puerto.id_puerto || puerto.id || 'BUENAVENTURA');
                this.puertoSeleccionado = puertoStr;
                this.renderizarLayoutDesdeCache(this.pestanaActiva);
            })
        );

        this.subs.add(this._torreService.widgetFocus$.subscribe(widget => {
            this.widgetEnfoque = widget;
            this.cdr.detectChanges();
        }));
    }

    ngOnDestroy() {
        this.subs.unsubscribe();
    }

    obtenerIconoPestana(codigoPestana: string): string {
        const diccionarioIconos: { [key: string]: string } = {
            'TLC_MARITIMO_001': 'fas fa-ship text-info',
            'TLC_VIRTUAL_GATE_001': 'fas fa-truck text-warning',
            'TLC_CONTENEDORES_001': 'fas fa-box text-success',
            'TLC_MAPA_001': 'fas fa-map-marked-alt text-danger',
            'TLC_NOTICIAS_001': 'fas fa-newspaper text-primary'
        };
        return diccionarioIconos[codigoPestana] || 'fas fa-th-large text-secondary';
    }

    cargarCatalogoWidgetsYRenderizar() {
        this.lsWidgets = this._widgetsService.getWidgetsActuales() || [];
        this.cambiarPestana(this.pestanaActiva);
    }

    iniciarConfiguracionGridster() {
        this.options = {
            gridType: GridType.ScrollVertical,
            margin: 16, outerMargin: false,
            minCols: 12, maxCols: 12, minRows: 1, maxRows: 100, fixedRowHeight: 160,
            pushItems: false, swap: false, compactType: 'none',
            defaultItemCols: 4, defaultItemRows: 3, displayGrid: 'onDrag&Resize',
            draggable: { enabled: !this.tableroBloqueado },
            resizable: { enabled: !this.tableroBloqueado }, outerMarginRight: 0,
            mobileBreakpoint: 960, keepFixedHeightInMobile: true,
            itemResizeCallback: () => { this.hayCambiosSinGuardar = true; },
            itemChangeCallback: () => { this.hayCambiosSinGuardar = true; }
        };
    }

    obtenerLayoutBase(pestana: string): any[] {
        let layoutUsuario: any[] = [];

        if (layoutUsuario.length === 0) {
            const widgetsInicialesBd = this.lsWidgets.filter((w: any) =>
                w.codigoPestana === pestana && (w.inicial === true || w.inicial === 'true' || w.inicial === 1)
            );

            layoutUsuario = widgetsInicialesBd.map((w: any, index: number) => ({
                type: w.codigoWidget || w.codigo_widget,
                codigoWidget: w.codigoWidget || w.codigo_widget,
                cols: w.defaultCols || w.cols_defecto || 4,
                rows: w.defaultRows || w.rows_defecto || 3,
                x: w.pos_x !== undefined ? w.pos_x : 0, // 👈 ASEGURAMOS LEER pos_x
                y: w.pos_y !== undefined ? w.pos_y : 0, // 👈 ASEGURAMOS LEER pos_y
                visible: true,
                pestana: pestana,
                version: w.layoutVersion || 1
            }));
        }

        return layoutUsuario.map(layoutItem => {
            const widgetConfig = this.lsWidgets.find(w => (w as any).codigoWidget === layoutItem.type);
            return { ...widgetConfig, ...layoutItem };
        });
    }

    async cambiarPestana(nuevaPestana: string) {
        this.sincronizarDashboardAMaestro();

        if (this.hayCambiosSinGuardar) {
            this.guardarConfiguracionTablero();
        }

        this.pestanaActiva = nuevaPestana;
        this._localStoragoService.setPestanaLocalStorage(nuevaPestana, this.usuarioId);

        const estadoActual = await this._localStoragoService.getTableroLocalStorage() || {};
        estadoActual.pestana = nuevaPestana;

        if (typeof (this._localStoragoService as any).setTableroLocalStorage === 'function') {
            (this._localStoragoService as any).setTableroLocalStorage(estadoActual);
        } else {
            localStorage.setItem('tableroState', JSON.stringify(estadoActual));
        }

        this.filtrarWidgetsParaLobby(nuevaPestana);

        this.renderizarLayoutDesdeCache(nuevaPestana);
    }

    sincronizarDashboardAMaestro() {
        if (!this.dashboard || this.dashboard.length === 0) return;

        this.dashboard.forEach(widgetEnPantalla => {
            const index = this.lsLayout.findIndex(l => l.type === widgetEnPantalla.type);
            if (index !== -1) {
                this.lsLayout[index] = { ...this.lsLayout[index], ...widgetEnPantalla };
            } else {
                this.lsLayout.push({ ...widgetEnPantalla });
            }
        });
    }

    renderizarLayoutDesdeCache(codigoDashboard: string) {
        this.cargando = true;
        this.dashboard = [];
        this.options.gridType = codigoDashboard.includes('MAPA') ? GridType.Fit : GridType.ScrollVertical;

        if (this.options.api && this.options.api.optionsChanged) this.options.api.optionsChanged();
        this.cdr.detectChanges();

        if (codigoDashboard.includes('MARITIMO')) {
            this.sincronizarTorreMaritima(this.puertoSeleccionado);
        } else if (codigoDashboard.includes('VIRTUAL_GATE')) {
            this.sincronizarVirtualGate(this.puertoSeleccionado);
        } else if (codigoDashboard.includes('CONTENEDORES')) {
            this.sincronizarContenedores(this.puertoSeleccionado);
        } else if (codigoDashboard.includes('MAPA')) {
            const layoutBase = this.obtenerLayoutBase(codigoDashboard);
            this.dashboard = [...layoutBase];
            this._stateService.inyectarDatosVivos(this.puertoSeleccionado, this.dashboard);
            this.finalizarRenderizado();
        } else {
            this.dashboard = this.obtenerLayoutBase(codigoDashboard);
            this.finalizarRenderizado();
        }
    }

    sincronizarTorreMaritima(puerto: string) {
        this._maritimoService.obtenerResumenOperativo(puerto).subscribe({
            next: (res: any) => {
                if (res && res.success && res.data) {
                    const terminales = res.data.WDG_TERMINALES || [];
                    const layoutBase = this.obtenerLayoutBase(this.pestanaActiva);

                    let layoutArmado = construirLayoutMaritimo(layoutBase, terminales);

                    const kpisDataOficial = [
                        {
                            titulo: 'CAMIONES EN OPERACION',
                            valor: res.data.camionesPuerto || '937',
                            subtitulo: 'ZONA URBANA BUENAVENTURA',
                            colorBorde: 'borde-cyan'
                        },
                        {
                            titulo: 'CONTENEDORES DÍA',
                            valor: res.data.contenedoresDia || '2.200',
                            subtitulo: 'FCL 2.200 · LCL 0 · Reefer 0',
                            colorBorde: 'borde-amarillo'
                        },
                        {
                            titulo: 'GRANEL - TONS DÍA',
                            valor: res.data.granelTons || '1.8K',
                            subtitulo: 'Agrícola 35.2K · Mineral 0 · Líquido 17.6K',
                            colorBorde: 'borde-naranja'
                        },
                        {
                            titulo: 'CARGA SUELTA - TM',
                            valor: res.data.cargaSuelta || '293',
                            subtitulo: 'Break-bulk 293 · Project 0 · Paletizada 0',
                            colorBorde: 'borde-green'
                        },
                        {
                            titulo: 'VEHÍCULOS RO-RO',
                            valor: res.data.vehiculosRoro || '147',
                            subtitulo: 'Imp 147 · Exp 0 · PDI 95% ocupado',
                            colorBorde: 'borde-teal'
                        },
                        {
                            titulo: 'SATURACIÓN BODEGAS',
                            valor: res.data.saturacionBodegas || '72%',
                            subtitulo: '8 bodegas · 2 críticas · ruteo activo',
                            colorBorde: 'borde-purple'
                        }
                    ];

                    const kpisEnFilaCero = layoutArmado
                        .filter((w: any) => w.y === 0 || (w.type || '').toUpperCase().includes('KPI'))
                        .sort((a, b) => (a.x || 0) - (b.x || 0));

                    kpisEnFilaCero.forEach((kpiItem, index) => {
                        if (kpisDataOficial[index]) {
                            kpiItem.data = { ...(kpiItem.data || {}), ...kpisDataOficial[index] };
                        }
                    });

                    this.dashboard = layoutArmado.map((widget: any) => {
                        if (widget.y === 0 || (widget.type || '').toUpperCase().includes('KPI')) {
                            return widget; // Ya los hidratamos limpiamente arriba
                        }

                        let widgetData = { ...(widget.data || {}) };
                        const tipoStr = widget.type || '';
                        const tipoLimpio = tipoStr.trim().toUpperCase().replace('WDG_PORT_', '');
                        if (res.data[tipoLimpio] || res.data[`WDG_${tipoLimpio}`]) {
                            widgetData = { ...widgetData, ...(res.data[tipoLimpio] || res.data[`WDG_${tipoLimpio}`]) };
                        }

                        return { ...widget, data: widgetData };
                    });

                    this.finalizarRenderizado();
                }
            },
            error: (err) => {
                console.error("❌ Error API Marítimo:", err);
                this.finalizarRenderizado();
            }
        });
    }

    sincronizarVirtualGate(puerto: string) {
        this._virtualGateService.obtenerColaGate().subscribe({
            next: (res: any) => {
                if (res && res.data) {
                    const layoutBase = this.obtenerLayoutBase(this.pestanaActiva);
                    const layoutArmado = construirLayoutEstatico(layoutBase);

                    this.dashboard = layoutArmado.map((widget: any) => {
                        let widgetData = { ...widget.data, resumen: res.data.resumen, citas: res.data.citas };

                        if (widget.type && widget.type.startsWith('WDG_PORT_KPI_')) {
                            switch (widget.type) {
                                case 'WDG_PORT_KPI_GATE_OP': widgetData = { titulo: 'CAMIONES EN PUERTO', valor: res.data.resumen.totalCamiones || 0, subtitulo: 'ZONA URBANA BUENAVENTURA', color: '#4dabf7', colorBorde: 'borde-cyan' }; break;
                                case 'WDG_PORT_KPI_GATE_CONT': widgetData = { titulo: 'CONTENEDORES DÍA', valor: res.data.resumen.totalContenedores || '2.847', subtitulo: 'FCL 1.900 · LCL 500 · Reefer 447', color: '#22b8cf', colorBorde: 'borde-amarillo' }; break;
                                case 'WDG_PORT_KPI_GATE_GRANEL': widgetData = { titulo: 'GRANEL - TONS DÍA', valor: '38.4K', subtitulo: 'Agrícola 20K · Mineral 18.4K', color: '#fd7e14', colorBorde: 'borde-rojo' }; break;
                                case 'WDG_PORT_KPI_GATE_SUELTA': widgetData = { titulo: 'CARGA SUELTA - TM', valor: '4.820', subtitulo: 'Break-bulk 3.000 · Paletizada 1.820', color: '#fcc419', colorBorde: 'borde-green' }; break;
                                case 'WDG_PORT_KPI_GATE_RORO': widgetData = { titulo: 'VEHÍCULOS RO-RO', valor: '1.142', subtitulo: 'Imp 800 · Exp 342 · PDI 85%', color: '#20c997', colorBorde: 'borde-fucsia' }; break;
                                case 'WDG_PORT_KPI_GATE_BODEGAS': widgetData = { titulo: 'SATURACIÓN BODEGAS', valor: '72%', subtitulo: '5 bodegas · 1 crítica · ruteo activo', color: '#cc5de8', colorBorde: 'borde-purple' }; break;
                                case 'WDG_PORT_KPI_SUB_CONT': widgetData = { titulo: 'SUB - CONTENEDORES', valor: res.data.resumen.subContenedores || 42, subtitulo: 'Retiros y devoluciones', color: '#868e96', colorBorde: 'borde-naranja' }; break;
                                case 'WDG_PORT_KPI_SUB_GRANEL': widgetData = { titulo: 'SUB - GRANEL', valor: 28, subtitulo: 'Flujo hacia silos', color: '#868e96', colorBorde: 'borde-indigo' }; break;
                                case 'WDG_PORT_KPI_SUB_SUELTA': widgetData = { titulo: 'SUB - CARGA SUELTA', valor: 11, subtitulo: 'Operación en bodega', color: '#868e96', colorBorde: 'borde-purple' }; break;
                                case 'WDG_PORT_KPI_SUB_NINERAS': widgetData = { titulo: 'SUB - NIÑERAS', valor: 6, subtitulo: 'Trasiego a patios', color: '#868e96', colorBorde: 'borde-cyan' }; break;
                            }
                        }
                        return { ...widget, data: widgetData };
                    });
                }
                this.finalizarRenderizado();
            },
            error: (err) => {
                console.error("❌ Error API Virtual Gate:", err);
                this.finalizarRenderizado();
            }
        });
    }

    sincronizarContenedores(puerto: string) {
        this._contenedoresService.obtenerDashboardContenedores().subscribe({
            next: (res: any) => {
                if (res && res.data) {
                    const layoutBase = this.obtenerLayoutBase(this.pestanaActiva);
                    const layoutArmado = construirLayoutEstatico(layoutBase);

                    this.dashboard = layoutArmado.map((widget: any) => {
                        let widgetData = { ...widget.data };
                        switch (widget.type) {
                            case 'WDG_PORT_KPI_CONT_CARGADOS': widgetData = { titulo: 'CARGADOS PENDIENTES', valor: res.data.kpis?.cargadosPendientes?.valor, subtitulo: res.data.kpis?.cargadosPendientes?.subtitulo, color: res.data.kpis?.cargadosPendientes?.color, colorBorde: 'borde-cyan' }; break;
                            case 'WDG_PORT_KPI_CONT_VACIOS': widgetData = { titulo: 'VACÍOS POR DEVOLVER', valor: res.data.kpis?.vaciosDevolver?.valor, subtitulo: res.data.kpis?.vaciosDevolver?.subtitulo, color: res.data.kpis?.vaciosDevolver?.color, colorBorde: 'borde-naranja' }; break;
                            case 'WDG_PORT_KPI_CONT_REEFER': widgetData = { titulo: 'REEFER ACTIVOS', valor: res.data.kpis?.reeferActivos?.valor, subtitulo: res.data.kpis?.reeferActivos?.subtitulo, color: res.data.kpis?.reeferActivos?.color, colorBorde: 'borde-teal' }; break;
                            case 'WDG_PORT_KPI_CONT_FREETIME': widgetData = { titulo: 'FREE TIME VENCIDO', valor: res.data.kpis?.freeTimeVencido?.valor, subtitulo: res.data.kpis?.freeTimeVencido?.subtitulo, color: res.data.kpis?.freeTimeVencido?.color, colorBorde: 'borde-blue' }; break;
                            case 'WDG_PORT_CONT_RETIROS': widgetData = res.data.retirosPriorizacion; break;
                            case 'WDG_PORT_CONT_NAVIERA': widgetData = res.data.vaciosNaviera; break;
                            case 'WDG_PORT_CONT_PATIOS': widgetData = res.data.saturacionPatios; break;
                            case 'WDG_PORT_CONT_FREETIME_CHART': widgetData = res.data.freeTimeDistribucion; break;
                            case 'WDG_PORT_CONT_TABLA': widgetData = res.data.movimientos; break;
                        }
                        return { ...widget, data: widgetData };
                    });
                }
                this.finalizarRenderizado();
            },
            error: (err) => {
                console.error("❌ Error API Contenedores:", err);
                this.finalizarRenderizado();
            }
        });
    }

    private _hidratarWidgetsConDatos(layoutOriginal: any[], dataReal: any): any[] {
        return layoutOriginal.map(widget => {
            const tipoStr = widget.type || '';
            const tipoLimpio = tipoStr.trim().toUpperCase().replace('WDG_PORT_', '');

            if (dataReal[tipoLimpio] || dataReal[`WDG_${tipoLimpio}`]) {
                return {
                    ...widget,
                    data: {
                        ...(widget.data || {}),
                        ...(dataReal[tipoLimpio] || dataReal[`WDG_${tipoLimpio}`])
                    }
                };
            }
            return widget;
        });
    }

    private finalizarRenderizado() {
        this.cargando = false;
        this.isLoading = false;
        if (this.options.api && this.options.api.optionsChanged) this.options.api.optionsChanged();
        this.cdr.detectChanges();
    }

    async cargarDatosDelPuerto(nuevoPuerto: any) {
        const puertoLimpio = nuevoPuerto?.target?.value || nuevoPuerto?.id || nuevoPuerto;
        this.puertoSeleccionado = puertoLimpio;

        if (this.options.api && this.options.api.optionsChanged) {
            this.options.draggable!.enabled = false;
            this.options.resizable!.enabled = false;
        }
        this.renderizarLayoutDesdeCache(this.pestanaActiva);
    }

    toggleBloqueoTablero() {
        this.tableroBloqueado = !this.tableroBloqueado;
        if (this.options.draggable && this.options.resizable) {
            this.options.draggable.enabled = !this.tableroBloqueado;
            this.options.resizable.enabled = !this.tableroBloqueado;
            this.options.api?.optionsChanged?.();
        }
        if (this.tableroBloqueado && this.hayCambiosSinGuardar) {
            this.guardarConfiguracionTablero();
        }
    }

    guardarConfiguracionTablero() {
        const usuarioPrueba = this.usuarioId || 'SISTEMA_DEFAULT';
        const widgetsAguardar = this.dashboard.filter(w => w.type !== 'BORRAR_ME' && !w.type.includes('FANTASMA'));
        // logica de guardado...
    }

    cerrarModalEnfoque() {
        this.widgetEnfoque = null;
        this._torreService.cerrarModoEnfoque();
    }

    inyectarNuevoWidgetAlTablero(widgetCatalogo: any) {
        this.dashboard.push({
            codigoWidget: `WDG_CUSTOM_${new Date().getTime()}`, type: widgetCatalogo.codigoWidget,
            cols: widgetCatalogo.defaultCols || 4, rows: widgetCatalogo.defaultRows || 3, x: 0, y: 0, data: null
        });
        if (this.options.api && this.options.api.optionsChanged) this.options.api.optionsChanged();

        this.renderizarLayoutDesdeCache(this.pestanaActiva);
        this.hayCambiosSinGuardar = true;
    }

    actualizarWidgetDesdeLobby(evento: { codigoWidget: string, seleccionado: boolean }) {
        const { codigoWidget, seleccionado } = evento;
        const indexLayout = this.lsLayout.findIndex(l => l.type === codigoWidget || l.codigoWidget === codigoWidget);

        if (indexLayout !== -1) {
            this.lsLayout[indexLayout].visible = seleccionado;
            if (seleccionado) {
                if (this.lsLayout[indexLayout].x === undefined || (this.lsLayout[indexLayout].x === 0 && this.lsLayout[indexLayout].y === 0)) {
                    this.asignarPosicionLibre(this.lsLayout[indexLayout]);
                }
            }
        } else if (seleccionado) {
            const widgetMaster = this.lsWidgets.find((w: any) => (w.codigoWidget || w.codigo_widget) === codigoWidget) as any;
            if (widgetMaster) {
                const nuevoItem = {
                    type: widgetMaster.codigoWidget || widgetMaster.codigo_widget,
                    cols: widgetMaster.defaultCols || widgetMaster.cols_defecto || 4,
                    rows: widgetMaster.defaultRows || widgetMaster.rows_defecto || 3,
                    x: 0, y: 0,
                    pestana: this.pestanaActiva,
                    visible: true,
                    data: { tipo: widgetMaster.tipo || widgetMaster.categoria },
                    version: widgetMaster.layoutVersion || 1
                };
                this.asignarPosicionLibre(nuevoItem);
                this.lsLayout.push(nuevoItem);
            }
        }

        // Renderizamos con las nuevas visibilidades
        this.renderizarLayoutDesdeCache(this.pestanaActiva);
        this.hayCambiosSinGuardar = true;
    }

    asignarPosicionLibre(item: any) {
        if (this.options && this.options.api && typeof (this.options.api as any).getNextPossiblePosition === 'function') {
            const posLibre = (this.options.api as any).getNextPossiblePosition(item);
            if (posLibre) {
                item.x = posLibre.x;
                item.y = posLibre.y;
                return;
            }
        }
        const totalItems = this.dashboard.length;
        item.x = (totalItems * 4) % 12;
        item.y = Math.floor((totalItems * 4) / 12) * 3;
    }

    trackByWidget(index: number, widget: any): string {
        // Primero busca idClon (para terminales repetidos), si no, usa el código normal
        return widget.idClon || widget.codigoWidget || widget.type;
    }

    abrirLobbyModal() {
        this.filtrarWidgetsParaLobby(this.pestanaActiva);
        this.mostrarLobby = true;
        this.cdr.detectChanges();
    }

    filtrarWidgetsParaLobby(nuevaPestana: string) {
        this.widgetsParaElLobby = (this.lsWidgets || []).filter((w: any) => {
            const estadoValido = w.estadoWidget === true || w.estadoWidget === 'true' || w.estadoWidget === 1;
            if (!estadoValido) return false;
            return w.codigoPestana === nuevaPestana;
        });
    }

    abrirLobbyPestanas() {
        this.mostrarLobbyPestanas = true;
        this.cdr.detectChanges();
    }

    obtenerCodigosVisibles(): string[] {
        return this.pestanasVisibles.map(p => p.codigoPestana);
    }

    guardarPreferenciasPestanas(codigosSeleccionados: string[]) {
        // 🟢 FIX: Iteramos sobre los códigos ordenados y buscamos su objeto,
        // garantizando que pestanasVisibles adquiera exactamente este nuevo orden.
        this.pestanasVisibles = codigosSeleccionados
            .map(codigo => this.lsPestanas.find(p => p.codigoPestana === codigo))
            .filter(p => p !== undefined); // Filtro de seguridad por si acaso

        if (this.pestanasVisibles.length > 0) {
            if (!codigosSeleccionados.includes(this.pestanaActiva)) {
                this.cambiarPestana(this.pestanasVisibles[0].codigoPestana);
            }
        } else {
            this.pestanaActiva = '';
            this.dashboard = [];
        }

        this.cdr.detectChanges();
        this.persistirEstadoPestanas();
    }

    async persistirEstadoPestanas() {
        const estadoActual = await this._localStoragoService.getTableroLocalStorage() || {};
        estadoActual.pestanasVisibles = this.obtenerCodigosVisibles();

        if (typeof (this._localStoragoService as any).setTableroLocalStorage === 'function') {
            (this._localStoragoService as any).setTableroLocalStorage(estadoActual);
        } else {
            localStorage.setItem('tableroState', JSON.stringify(estadoActual));
        }
    }
}
