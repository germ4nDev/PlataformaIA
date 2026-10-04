/*
    Author: German Valencia
    Pattern: PORTTOS Orchestrator Component - Multi-Tenant (QPLUS Unified)
    Refactor: 100% Metadata-Driven Layouts, Cascada Dinámica e Intérprete Universal
*/
import { Component, OnInit, OnDestroy, ChangeDetectorRef, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { GridsterConfig, GridsterItem, GridType, GridsterComponent, GridsterItemComponent } from 'angular-gridster2';
import { Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter } from 'rxjs/operators';
import { v4 as uuidv4 } from 'uuid';

import { DashboardService } from 'src/app/theme/shared/service/tablero-control/dashboard.service';
import { TableroStateService } from '../../theme/shared/service/tablero-control/tablero-state.service';
import { FiltroTableroService } from 'src/app/theme/shared/service/tablero-control/filtro-tablero.service';
import { PTLWidgetsMaestroService } from 'src/app/theme/shared/service/ptlwidgets-maestro.service';
import { MaritimoService } from 'src/app/theme/shared/service/tablero-control/maritimo.service';
import { VirtualGateService } from 'src/app/theme/shared/service/tablero-control/virtual-gate.service';
import { ContenedoresService } from 'src/app/theme/shared/service/tablero-control/contenedores.service';
import { LocalStorageService, SwalAlertService } from 'src/app/theme/shared/service';
import { PtlpestanasService } from 'src/app/theme/shared/service/ptlpestanas.service';
import { LayoutService } from 'src/app/theme/shared/service/layout.service';

import { TcHeaderComponent } from "../widgets/tc-header/tc-header.component";
import { WidgetSelectorTclComponent } from "../widgets/widget-selector-tcl/widget-selector-tcl.component";
import { WidgetLobbyTclComponent } from "../widgets/widget-lobby-tcl/widget-lobby-tcl.component";
import { PestanaLobbyTclComponent } from '../widgets/pestana-lobby-tcl/pestana-lobby-tcl.component';

import { Widget } from 'src/app/theme/shared/_helpers/models/tablero-control/widget.model';
import { PTLLayoutModel } from 'src/app/theme/shared/_helpers/models/PTLLayout.model';
import { PTLLayoutPestanaModel } from 'src/app/theme/shared/_helpers/models/PTLLayoutPestana.model';

// 🟢 IMPORTAMOS EL DICCIONARIO EXTERNO MAESTRO
import { WIDGET_MAP } from './widget-registry'; // <-- 🚨 Asegúrate de colocar la ruta correcta

@Component({
    selector: 'app-torre-control',
    standalone: true,
    imports: [
        CommonModule,
        TranslateModule,
        TcHeaderComponent,
        GridsterComponent,
        GridsterItemComponent,
        WidgetSelectorTclComponent,
        WidgetLobbyTclComponent,
        PestanaLobbyTclComponent
    ],
    templateUrl: './torre-control.component.html',
    styleUrls: ['./torre-control.component.scss']
})
export class TorreControlComponent implements OnInit, OnDestroy {
    @Output() toggleBloqueo = new EventEmitter<void>();

    public options!: GridsterConfig;
    public dashboard: Array<GridsterItem & { type: string, data: any, dataTerminal?: any }> = [];
    public isLoading: boolean = false;
    public isOptionBloqueo: boolean = false;
    public isBloqueado: boolean = false;
    public cargando: boolean = true;
    public tableroBloqueado: boolean = true;
    public widgetEnfoque: { type: string, data: any } | null = null;
    public hayCambiosSinGuardar: boolean = false;

    public menuConfigAbierto: boolean = false;
    public lsWidgets: Widget[] = [];
    public lsLayout: any[] = [];
    public widgetsParaElLobby: any[] = [];
    public lsPestanas: any[] = [];
    public pestanasVisibles: any[] = [];

    public pestanaActiva: string = '';
    public puertoSeleccionado: string = 'BUENAVENTURA';
    public usuarioId: string = '';
    public mostrarLobby: boolean = false;
    public mostrarLobbyPestanas: boolean = false;

    private readonly APP_PORTTOS_ID = '3eb98a9f-cc5d-417d-95ea-a2b8abc3b5fa';
    private subs: Subscription = new Subscription();

    constructor(
        private _stateService: TableroStateService,
        private _torreService: DashboardService,
        private translate: TranslateService,
        private _maritimoService: MaritimoService,
        private _virtualGateService: VirtualGateService,
        private _contenedoresService: ContenedoresService,
        private _filtroService: FiltroTableroService,
        private _widgetsService: PTLWidgetsMaestroService,
        private _localStoragoService: LocalStorageService,
        private _layoutService: LayoutService,
        private _pestanasService: PtlpestanasService,
        private _swalAlertService: SwalAlertService,
        private cdr: ChangeDetectorRef
    ) { }

    async ngOnInit() {
        this.iniciarConfiguracionGridster();

        const current = this._localStoragoService.getCurrentUserLocalStorage();
        const navSetttings = this._localStoragoService.getNavSettingsLocalStorage();

        this.lsLayout = navSetttings.layout || [];
        this.usuarioId = current?.usuario?.codigoUsuario || 'SISTEMA_DEFAULT';

        const codigoSuite = navSetttings.suite?.codigoSuite || 'a815687f-b9b6-4404-83dd-9a4074224320';
        const codigoAplicacion = navSetttings.aplicacion?.codigoAplicacion || this.APP_PORTTOS_ID;

        this._pestanasService.obtenerPestanasDelContexto(codigoSuite, codigoAplicacion).subscribe(async (resMaster: any) => {
            if (resMaster.success && resMaster.data && resMaster.data.length > 0) {
                this.lsPestanas = resMaster.data;
                const preferencias = this._localStoragoService.getNavSettingsLocalStorage();
                const current = this._localStoragoService.getCurrentUserLocalStorage();

                this._layoutService.obtenerPreferenciasPestanas(this.usuarioId).subscribe((resPrefs: any) => {

                    if (resPrefs.ok && resPrefs.data && resPrefs.data.length > 0) {
                        const preferenciasUnicas = resPrefs.data.filter((pref: any, index: number, self: any[]) =>
                            index === self.findIndex((p) => p.codigoPestana === pref.codigoPestana)
                        );
                        const pestanasOrdenadasBD = preferenciasUnicas.sort((a: any, b: any) => a.posicion - b.posicion);
                        this.pestanasVisibles = pestanasOrdenadasBD
                            .map((pref: any) => this.lsPestanas.find(p => p.codigoPestana === pref.codigoPestana))
                            .filter((p: any) => p !== undefined);

                    } else {
                        this.pestanasVisibles = this.lsPestanas.slice(0, 3);
                    }

                    preferencias.pestanas = this.pestanasVisibles;
                    this._localStoragoService.setNavSettingsLocalStorage(preferencias);

                    const pestanaGuardada = current?.pestanaActiva || this.pestanasVisibles[0]?.codigoPestana;
                    const existePestana = this.pestanasVisibles.find(p => p.codigoPestana === pestanaGuardada);
                    this.pestanaActiva = existePestana ? pestanaGuardada : this.pestanasVisibles[0].codigoPestana;

                    current.pestanaActiva = this.pestanaActiva;
                    this._localStoragoService.setCurrentUserLocalStorage(current);

                    this.cargarCatalogoWidgetsYRenderizar();
                });
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

    // 🟢 EL INTÉRPRETE VINCULADO AL MAPA EXTERNO
    // (Úsalo en tu HTML con: *ngComponentOutlet="obtenerComponentePara(widget.type)")
    obtenerComponentePara(codigoWidget: string): any {
        const registro = WIDGET_MAP[codigoWidget];
        return registro ? registro.componente : null;
    }

    obtenerIconoPestana(codigoPestana: string): string {
        const diccionarioIconos: { [key: string]: string } = {
            'TLC_MARITIMO_001': 'fas fa-ship text-info',
            'TLC_VIRTUAL_GATE_001': 'fas fa-truck text-warning',
            'TLC_CONTENEDORES_001': 'fas fa-box text-success',
            'TLC_MAPA_001': 'fas fa-map-marked-alt text-danger',
            'TLC_NOTICIAS_001': 'fas fa-newspaper text-primary',
            'TLC_GNL_001': 'fas fa-fire-alt text-danger' // 🟢 Icono para SCADA/GNL
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
            pushItems: true, swap: false, compactType: 'none',
            defaultItemCols: 4, defaultItemRows: 3, displayGrid: 'onDrag&Resize',
            draggable: { enabled: !this.tableroBloqueado },
            pushDirections: { north: true, east: true, south: true, west: true },
            resizable: { enabled: !this.tableroBloqueado }, outerMarginRight: 0,
            mobileBreakpoint: 960, keepFixedHeightInMobile: true,

            itemResizeCallback: (item, itemComponent) => {
                if (this.cargando) return;
                this.hayCambiosSinGuardar = true;
                this.sincronizarMovimientoEnCache();
            },
            itemChangeCallback: (item, itemComponent) => {
                if (this.cargando) return;
                this.hayCambiosSinGuardar = true;
                this.sincronizarMovimientoEnCache();
            }
        };
    }

    // ==========================================
    // CONTROL DE CACHÉ Y AISLAMIENTO
    // ==========================================
    sincronizarMovimientoEnCache() {
        if (!this.dashboard || this.cargando) return;

        const preferencias = this._localStoragoService.getNavSettingsLocalStorage() || {};
        let layoutGuardado = preferencias.layout || [];

        layoutGuardado = layoutGuardado.filter((w: any) =>
            w.pestana !== this.pestanaActiva &&
            w.type !== 'WDG_FANTASMA' &&
            w.codigoWidget !== 'WDG_FANTASMA'
        );

        const dashboardActualizado = this.dashboard
            .filter(w => w.type !== 'WDG_FANTASMA' && !(w.type || '').includes('FANTASMA'))
            .map(w => ({ ...w, pestana: this.pestanaActiva }));

        preferencias.layout = [...layoutGuardado, ...dashboardActualizado];
        this._localStoragoService.setNavSettingsLocalStorage(preferencias);
    }

    toggleMenuConfig() {
        this.menuConfigAbierto = !this.menuConfigAbierto;
        this.cdr.detectChanges();
    }

    restaurarTableroDefault() {
        this._swalAlertService.getAlertQuestionRequest(
            this.translate.instant('PORTTOS.REINICIARTABLERO'),
            this.translate.instant('PORTTOS.REINBICIASUBTITULO'),
            this.translate.instant('PLATAFORMA.RESET'),
            this.translate.instant('PLATAFORMA.CANCEL')
        ).subscribe(result => {
            if (result) {
                this.menuConfigAbierto = false;
                this.cargando = true;
                const usuario = this.usuarioId || 'SISTEMA_DEFAULT';

                const prefs = this._localStoragoService.getNavSettingsLocalStorage() || {};
                if (prefs.layout) {
                    prefs.layout = prefs.layout.filter((w: any) => w.pestana !== this.pestanaActiva);
                    this._localStoragoService.setNavSettingsLocalStorage(prefs);
                }

                this.dashboard = [];
                this.hayCambiosSinGuardar = false;

                this._layoutService.eliminarLayoutPestana(usuario, this.pestanaActiva).subscribe({
                    next: () => {
                        console.log('✅ Tablero eliminado en BD. Restaurando plantilla...');
                        this.renderizarLayoutDesdeCache(this.pestanaActiva);
                    },
                    error: (err) => {
                        console.error('❌ Error eliminando en BD:', err);
                        this.cargando = false;
                        this.renderizarLayoutDesdeCache(this.pestanaActiva);
                    }
                });
            } else {
                this.menuConfigAbierto = false;
            }
        });
    }

    // ==========================================
    // EL INTÉRPRETE UNIVERSAL (QPLUS METADATA ENGINE)
    // ==========================================
    construirLayoutUniversal(
        widgetsDisponibles: any[],
        metadatosBackend: any,
        entidadesDinamicas: any[] = []
    ): any[] {
        if (!metadatosBackend || !metadatosBackend.configuracion) return [];

        const layoutFinal: any[] = [];
        const config = metadatosBackend.configuracion;

        // ESTRATEGIA 1: ESTÁTICO ANALÍTICO
        if (metadatosBackend.estrategia === 'ESTATICO_ANALITICO' || metadatosBackend.estrategia === 'FLUJO_PROCESO' || metadatosBackend.estrategia === 'ESTATICO_ANALITICO_GNL') {
            config.widgetsEstaticos.forEach((widgetBD: any) => {
                const widgetBase = widgetsDisponibles.find(w => (w.type || w.codigoWidget) === widgetBD.codigoWidget);
                if (widgetBase) {
                    layoutFinal.push({
                        ...widgetBase,
                        codigoWidget: widgetBD.codigoWidget,
                        type: widgetBD.codigoWidget,
                        x: widgetBD.x,
                        y: widgetBD.y,
                        cols: widgetBD.cols,
                        rows: widgetBD.rows
                    });
                }
            });
            return layoutFinal;
        }

        // ESTRATEGIA 2: CASCADA DINÁMICA
        if (metadatosBackend.estrategia === 'CASCADA_DINAMICA' && config.zonaDinamica) {
            const zona = config.zonaDinamica;
            let currentY = zona.inicioY;

            config.widgetsEstaticos
                .filter((w: any) => w.anclaje === 'ABSOLUTO')
                .forEach((widgetBD: any) => {
                    const widgetBase = widgetsDisponibles.find(w => (w.type || w.codigoWidget) === widgetBD.codigoWidget);
                    if (widgetBase) {
                        layoutFinal.push({
                            ...widgetBase,
                            codigoWidget: widgetBD.codigoWidget,
                            type: widgetBD.codigoWidget,
                            x: widgetBD.x,
                            y: widgetBD.y,
                            cols: widgetBD.cols,
                            rows: widgetBD.rows
                        });
                    }
                });

            if (entidadesDinamicas.length > 0) {
                const moldeBase = widgetsDisponibles.find(w => (w.type || w.codigoWidget) === zona.codigoMolde);

                if (moldeBase) {
                    let colX = zona.inicioX;

                    entidadesDinamicas.forEach((entidad, index) => {
                        if (index > 0 && index % zona.maxItemsPorFila === 0) {
                            colX = zona.inicioX;
                            currentY += zona.rowsPorItem;
                        }

                        layoutFinal.push({
                            ...moldeBase,
                            codigoWidget: zona.codigoMolde,
                            type: zona.codigoMolde,
                            idClon: `TERM_SLOT_${index}`,
                            dataTerminal: entidad,
                            x: colX,
                            y: currentY,
                            cols: zona.colsPorItem,
                            rows: zona.rowsPorItem
                        });

                        colX += zona.colsPorItem;
                    });
                    currentY += zona.rowsPorItem;
                }
            }

            config.widgetsEstaticos
                .filter((w: any) => w.anclaje === 'RELATIVO' || w.anclaje === 'RELATIVO_DINAMICO')
                .forEach((widgetBD: any) => {
                    const widgetBase = widgetsDisponibles.find(w => (w.type || w.codigoWidget) === widgetBD.codigoWidget);
                    if (widgetBase) {
                        layoutFinal.push({
                            ...widgetBase,
                            codigoWidget: widgetBD.codigoWidget,
                            type: widgetBD.codigoWidget,
                            x: widgetBD.x,
                            y: currentY + (widgetBD.offsetY || 0),
                            cols: widgetBD.cols,
                            rows: widgetBD.rows
                        });
                    }
                });

            return layoutFinal;
        }

        return layoutFinal;
    }

    // ==========================================
    // OBTENCIÓN CENTRALIZADA DE LAYOUT BASE
    // ==========================================
    async obtenerLayoutBase(pestana: string, entidadesDinamicas: any[] = []): Promise<any[]> {
        this.pestanaActiva = pestana;
        let layoutArmado: any[] = [];
        const usuario = this.usuarioId || 'SISTEMA_DEFAULT';

        try {
            const prefsCache = this._localStoragoService.getNavSettingsLocalStorage();
            if (prefsCache && prefsCache.layout && prefsCache.layout.length > 0) {
                const layoutCache = prefsCache.layout.filter((w: any) => w.pestana === pestana);
                if (layoutCache.length > 0) {
                    this.lsLayout = [...layoutCache];
                    return layoutCache;
                }
            }

            const layoutDesdeBD: PTLLayoutModel[] = await this._layoutService
                .cargarRegistrosUsuarioPestana(usuario, pestana)
                .toPromise() || [];

            if (layoutDesdeBD.length > 0) {
                layoutArmado = layoutDesdeBD.map(itemDB => {
                    const esTerminalClon = itemDB.codigoWidget?.startsWith('TERM_SLOT_');
                    const codigoBusqueda = esTerminalClon ? 'PTT_MAE_WGT_TERMINAL' : itemDB.codigoWidget;
                    const widgetMaster = this.lsWidgets.find(w => (w as any).codigoWidget === codigoBusqueda) || {};

                    let configData = null;
                    if (itemDB.config) {
                        try { configData = typeof itemDB.config === 'string' ? JSON.parse(itemDB.config) : itemDB.config; } catch (e) { }
                    }

                    return {
                        ...widgetMaster,
                        type: codigoBusqueda,
                        codigoWidget: codigoBusqueda,
                        idClon: esTerminalClon ? itemDB.codigoWidget : undefined,
                        cols: itemDB.cols,
                        rows: itemDB.rows,
                        x: itemDB.posicion_x,
                        y: itemDB.posicion_y,
                        visible: true,
                        pestana: pestana,
                        data: configData || (widgetMaster ? (widgetMaster as any).data : null)
                    };
                });
            } else {
                console.log(`[Motor Metadata-Driven] Solicitando plantilla maestra para: ${pestana}`);
                const metadatosBackend = await this._layoutService.getPlantillaMaestra(pestana).toPromise();

                if (metadatosBackend) {
                    layoutArmado = this.construirLayoutUniversal(this.lsWidgets, metadatosBackend, entidadesDinamicas);
                }
            }

            const layoutLimpio = layoutArmado.filter(w => w !== undefined && w.type !== undefined);
            const layoutSinDuplicados = layoutLimpio.filter((widget, index, self) =>
                index === self.findIndex((w) => (w.idClon || w.type) === (widget.idClon || widget.type))
            );

            layoutSinDuplicados.forEach(widget => {
                const esKPI = (widget.type || widget.codigoWidget || '').toUpperCase().includes('KPI');
                if (esKPI) {
                    widget.cols = 2;
                    widget.rows = 2;
                }
            });

            this.lsLayout = [...layoutSinDuplicados];

            const preferencias = this._localStoragoService.getNavSettingsLocalStorage() || {};
            const layoutsOtrasPestanas = (preferencias.layout || []).filter((w: any) => w.pestana !== pestana);
            preferencias.layout = [...layoutsOtrasPestanas, ...this.lsLayout];
            this._localStoragoService.setNavSettingsLocalStorage(preferencias);

            return layoutSinDuplicados;

        } catch (error) {
            console.error("Error obteniendo layout base:", error);
            return [];
        }
    }

    async cambiarPestana(nuevaPestana: string) {
        if (this.hayCambiosSinGuardar) {
            this.guardarConfiguracionTablero();
        }

        this.pestanaActiva = nuevaPestana;
        const current = this._localStoragoService.getCurrentUserLocalStorage();
        current.pestanaActiva = nuevaPestana;
        this._localStoragoService.setCurrentUserLocalStorage(current);

        this.filtrarWidgetsParaLobby(nuevaPestana);
        await this.renderizarLayoutDesdeCache(nuevaPestana);
    }

    // ==========================================
    // RENDERIZADO Y SINCRONIZACIÓN
    // ==========================================
    async renderizarLayoutDesdeCache(codigoDashboard: string) {
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
            const layoutBase = await this.obtenerLayoutBase(codigoDashboard);
            this.dashboard = [...layoutBase];
            this._stateService.inyectarDatosVivos(this.puertoSeleccionado, this.dashboard);
            this.finalizarRenderizado();
        } else if (codigoDashboard.includes('GNL')) {
            this.sincronizarGNL(this.puertoSeleccionado);
        } else {
            // 🟢 Lógica limpia y universal para pestañas como GNL que no requieren "hidratación" por defecto
            this.dashboard = await this.obtenerLayoutBase(codigoDashboard);
            this.finalizarRenderizado();
        }
    }

    sincronizarTorreMaritima(puerto: string) {
        this._maritimoService.obtenerResumenOperativo(puerto).subscribe({
            next: async (res: any) => {
                if (res && res.success && res.data) {
                    const todosLosTerminales = res.data.WDG_TERMINALES || [];
                    const puertoUpper = (puerto || 'BUENAVENTURA').toUpperCase();
                    const terminalesFiltrados = todosLosTerminales.filter((t: any) =>
                        (t.id_puerto || '').toUpperCase() === puertoUpper ||
                        (t.ciudad || '').toUpperCase() === puertoUpper
                    );

                    let layoutArmado = await this.obtenerLayoutBase(this.pestanaActiva, terminalesFiltrados);

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
            next: async (res: any) => {
                if (res && res.data) {
                    let layoutArmado = await this.obtenerLayoutBase(this.pestanaActiva);

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
            next: async (res: any) => {
                if (res && res.data) {
                    let layoutArmado = await this.obtenerLayoutBase(this.pestanaActiva);

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
                }
                this.finalizarRenderizado();
            },
            error: (err) => {
                console.error("❌ Error API Contenedores:", err);
                this.finalizarRenderizado();
            }
        });
    }

    async sincronizarGNL(puerto: string) {
        // 1. Obtenemos el layout base de GNL (Caché o BD)
        let layoutArmado = await this.obtenerLayoutBase(this.pestanaActiva);

        // 2. Simulamos la data oficial de los KPIs (Pronto vendrá del backend)
        const kpisDataOficialGNL = [
            { titulo: 'VOLUMEN ALMACENADO', valor: '142.5K', subtitulo: '85% Ocupación · 2 Tanques', colorBorde: 'borde-cyan' },
            { titulo: 'DESCARGA DE BUQUE', valor: '38.2K', subtitulo: 'Golar Freeze · Brazos 1 y 2', colorBorde: 'borde-green' },
            { titulo: 'INYECCIÓN A RED', valor: '45.5K', subtitulo: '91% Nominación Diaria (50K)', colorBorde: 'borde-amarillo' },
            { titulo: 'BOG (EVAPORACIÓN)', valor: '215 m³', subtitulo: 'Antorcha Flare: INACTIVA', colorBorde: 'borde-naranja' },
            { titulo: 'PODER CALORÍFICO', valor: '1,032', subtitulo: 'BTU/scf · Metano 92.5%', colorBorde: 'borde-teal' },
            { titulo: 'ALERTAS SCADA', valor: '0', subtitulo: 'Sistemas operando normal', colorBorde: 'borde-purple' }
        ];

        // 3. Filtramos los KPIs en el layout actual y los ordenamos por posición X
        const kpisEnTablero = layoutArmado
            .filter((w: any) => (w.type || '').toUpperCase().includes('KPI') || (w.codigoWidget || '').toUpperCase().includes('KPI'))
            .sort((a, b) => (a.x || 0) - (b.x || 0));

        // 4. Inyectamos la data
        kpisEnTablero.forEach((kpiItem, index) => {
            if (kpisDataOficialGNL[index]) {
                kpiItem.data = { ...(kpiItem.data || {}), ...kpisDataOficialGNL[index] };
            }
        });

        // 5. Finalizamos actualizando el dashboard
        this.dashboard = layoutArmado;
        this.finalizarRenderizado();
    }

    private finalizarRenderizado() {
        this.cargando = false;
        this.isLoading = false;
        if (this.options.api && this.options.api.optionsChanged) this.options.api.optionsChanged();
        this.cdr.detectChanges();
    }

    // ==========================================
    // BLOQUEOS Y PERSISTENCIA UI
    // ==========================================
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
        if (!this.dashboard || this.dashboard.length === 0) return;

        this.sincronizarMovimientoEnCache();

        const usuario = this.usuarioId || 'SISTEMA_DEFAULT';
        const widgetsAguardar = this.dashboard.filter(w => w.type !== 'BORRAR_ME' && !(w.type || '').includes('FANTASMA'));

        const layoutPayload: PTLLayoutModel[] = widgetsAguardar.map(itemGridster => {
            const itemLayout = new PTLLayoutModel();

            itemLayout.codigoLayout = uuidv4();
            itemLayout.codigoUsuario = usuario;
            itemLayout.codigoPestana = this.pestanaActiva;
            itemLayout.codigoWidget = (itemGridster as any).idClon || itemGridster.type;
            itemLayout.posicion_x = itemGridster.x;
            itemLayout.posicion_y = itemGridster.y;
            itemLayout.cols = itemGridster.cols;
            itemLayout.rows = itemGridster.rows;

            itemLayout.config = itemGridster.data ? JSON.stringify(itemGridster.data) : null;
            itemLayout.codigoUsuarioCreacion = usuario;
            itemLayout.fechaCreacion = new Date().toISOString();

            return itemLayout;
        });

        this._layoutService.postCrearLayout(layoutPayload).subscribe({
            next: (res: any) => {
                console.log('✅ Layout guardado exitosamente en BD');
                this.hayCambiosSinGuardar = false;
            },
            error: (err: any) => {
                console.error('❌ ERROR REAL DE PERSISTENCIA EN BD:', err?.error || err);
            }
        });
    }

    // ==========================================
    // INTERACCIÓN CON EL LOBBY DE WIDGETS
    // ==========================================
    actualizarWidgetDesdeLobby(evento: { codigoWidget: string, seleccionado: boolean }) {
        const { codigoWidget, seleccionado } = evento;

        if (seleccionado) {
            const existeEnPantalla = this.dashboard.find(w => w.type === codigoWidget || (w as any).codigoWidget === codigoWidget);
            if (!existeEnPantalla) {
                const widgetMaster = this.lsWidgets.find((w: any) => (w.codigoWidget || w.codigo_widget) === codigoWidget) as any;
                if (widgetMaster) {
                    const nuevoItem: any = {
                        ...widgetMaster,
                        type: widgetMaster.codigoWidget || widgetMaster.codigo_widget,
                        codigoWidget: widgetMaster.codigoWidget || widgetMaster.codigo_widget,
                        cols: widgetMaster.defaultCols || widgetMaster.cols_defecto || 4,
                        rows: widgetMaster.defaultRows || widgetMaster.rows_defecto || 3,
                        x: 0, y: 0,
                        data: { tipo: widgetMaster.tipo || widgetMaster.categoria }
                    };
                    this.asignarPosicionLibre(nuevoItem);
                    this.dashboard.push(nuevoItem);
                }
            }
        } else {
            const index = this.dashboard.findIndex(w => w.type === codigoWidget || (w as any).codigoWidget === codigoWidget);
            if (index !== -1) {
                this.dashboard.splice(index, 1);
            }
        }

        if (this.options.api && this.options.api.optionsChanged) this.options.api.optionsChanged();
        this.cdr.detectChanges();

        this.sincronizarMovimientoEnCache();
        this.hayCambiosSinGuardar = true;
    }

    guardarPreferenciasWidgets(activos: any[]) {
        this.guardarConfiguracionTablero();
        this.mostrarLobby = false;
        this.cdr.detectChanges();
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

    // ==========================================
    // UTILIDADES Y MODALES
    // ==========================================
    trackByWidget(index: number, widget: any): string {
        return widget.idClon || widget.codigoWidget || widget.type;
    }

    abrirLobbyModal() {
        this.filtrarWidgetsParaLobby(this.pestanaActiva);
        this.lsLayout = this.dashboard.map(widgetGridster => {
            return {
                ...widgetGridster,
                codigoWidget: widgetGridster.type || (widgetGridster as any).codigoWidget
            };
        });
        this.mostrarLobby = true;
        this.cdr.detectChanges();
    }

    filtrarWidgetsParaLobby(nuevaPestana: string) {
        this.widgetsParaElLobby = (this.lsWidgets || []).filter((w: any) => {
            const estadoValido = w.estadoWidget === true || w.estadoWidget === 'true' || w.estadoWidget === 1;
            return estadoValido && w.codigoPestana === nuevaPestana;
        });
    }

    abrirLobbyPestanas() {
        this.mostrarLobbyPestanas = true;
        this.cdr.detectChanges();
    }

    obtenerCodigosVisibles(): string[] {
        return this.pestanasVisibles.map(p => {
            return typeof p === 'string' ? p : p.codigoPestana;
        }).filter(codigo => codigo !== undefined);
    }

    guardarPreferenciasPestanas(codigosSeleccionados: any[]) {
        this.pestanasVisibles = codigosSeleccionados
            .map(codigo => {
                const codStr = typeof codigo === 'string' ? codigo : codigo.codigoPestana;
                return this.lsPestanas.find(p => p.codigoPestana === codStr);
            })
            .filter(p => p !== undefined);

        if (this.pestanasVisibles.length > 0) {
            if (!this.pestanasVisibles.find(p => p.codigoPestana === this.pestanaActiva)) {
                this.cambiarPestana(this.pestanasVisibles[0].codigoPestana);
            }
        } else {
            this.pestanaActiva = '';
            this.dashboard = [];
        }

        this.cdr.detectChanges();
        this.persistirEstadoPestanas();
    }

    // ==========================================
    // ACTUALIZACIÓN REACTIVA DE PESTAÑAS (CHECK AL INSTANTE)
    // ==========================================
    actualizarPestanaDesdeLobby(evento: { codigoPestana: string, seleccionado: boolean }) {
        const { codigoPestana, seleccionado } = evento;

        if (seleccionado) {
            const pestanaMaestra = this.lsPestanas.find(p => p.codigoPestana === codigoPestana);
            if (pestanaMaestra && !this.pestanasVisibles.find(p => p.codigoPestana === codigoPestana)) {
                this.pestanasVisibles.push(pestanaMaestra);
            }
        } else {
            this.pestanasVisibles = this.pestanasVisibles.filter(p => p.codigoPestana !== codigoPestana);
        }

        if (this.pestanasVisibles.length > 0) {
            if (!this.pestanasVisibles.find(p => p.codigoPestana === this.pestanaActiva)) {
                this.cambiarPestana(this.pestanasVisibles[0].codigoPestana);
            }
        } else {
            this.pestanaActiva = '';
            this.dashboard = [];
        }

        this.cdr.detectChanges();
        this.persistirEstadoPestanas();
    }

    cerrarModalEnfoque() {
        this.widgetEnfoque = null;
        this._torreService.cerrarModoEnfoque();
    }

    // async persistirEstadoPestanas() {
    //     const estadoActual = await this._localStoragoService.getNavSettingsLocalStorage() || {};
    //     estadoActual.pestanas = this.pestanasVisibles;
    //     this._localStoragoService.setNavSettingsLocalStorage(estadoActual);

    //     const usuario = this.usuarioId || 'SISTEMA_DEFAULT';

    //     const payloadPestanas = this.pestanasVisibles.map((pestana, index) => {
    //         return {
    //             codigoUsuario: usuario,
    //             codigoPestana: pestana.codigoPestana,
    //             posicion: index
    //         };
    //     });

    //     this._layoutService.postGuardarPestanasUsuario(this.pestanasVisibles).subscribe({
    //         next: (res: any) => console.log('✅ Preferencias de pestañas guardadas en BD', res),
    //         error: (err: any) => console.error('❌ Error persistiendo pestañas en BD', err)
    //     });
    // }
    async persistirEstadoPestanas() {
        const estadoActual = await this._localStoragoService.getNavSettingsLocalStorage() || {};
        estadoActual.pestanas = this.pestanasVisibles;
        this._localStoragoService.setNavSettingsLocalStorage(estadoActual);

        const usuario = this.usuarioId || 'SISTEMA_DEFAULT';

        // para evitar que el DTO de Node.js rechace la petición con un error 400.
        const payloadPestanas = this.pestanasVisibles.map((pestana, index) => {
            return {
                codigoUsuario: usuario,
                codigoPestana: typeof pestana === 'string' ? pestana : pestana.codigoPestana,
                posicion: index,
                codigoTipo: pestana.codigoTipo,
                estadoPestana: true,
                codigoUsuarioCreacion: usuario,
                fechaCreacion: new Date().toISOString()
            };
        });

        console.log('📤 Payload de pestañas a enviar:', payloadPestanas);

        this._layoutService.postGuardarPestanasUsuario(payloadPestanas).subscribe({
            next: (res: any) => console.log('✅ Preferencias de pestañas guardadas en BD', res),
            error: (err: any) => console.error('❌ Error persistiendo pestañas en BD', err)
        });
    }
}
