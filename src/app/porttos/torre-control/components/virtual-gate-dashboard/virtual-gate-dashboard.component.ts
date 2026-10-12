// /*
//     Author: German Valencia
//     Component: Virtual Gate Dashboard (Refactorizado: Bucle Infinito Destruido)
// */
// import { Component, Input, OnInit, OnChanges, SimpleChanges, ChangeDetectorRef } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { GridsterConfig, GridsterItem, GridType, GridsterComponent, GridsterItemComponent } from 'angular-gridster2';

// import { LayoutMetadataEngineService } from 'src/app/theme/shared/service/layout-metadata-engine.service';
// import { VirtualGateService } from 'src/app/theme/shared/service/tablero-control/virtual-gate.service';
// import { WIDGET_MAP } from '../../widget-registry';
// import { LocalStorageService } from 'src/app/theme/shared/service';
// import { DashboardService } from 'src/app/theme/shared/service/tablero-control/dashboard.service';
// import { WidgetSelectorTclComponent } from 'src/app/porttos/widgets/widget-selector-tcl/widget-selector-tcl.component';

// @Component({
//     selector: 'app-virtual-gate-dashboard',
//     standalone: true,
//     imports: [CommonModule, GridsterComponent, GridsterItemComponent, WidgetSelectorTclComponent],
//     templateUrl: './virtual-gate-dashboard.component.html',
//     styleUrls: ['./virtual-gate-dashboard.component.scss']
// })
// export class VirtualGateDashboardComponent implements OnInit, OnChanges {
//     @Input() puerto!: string;
//     @Input() usuarioId!: string;
//     @Input() lsWidgets!: any[];

//     private _tableroBloqueado = true;
//     @Input()
//     set tableroBloqueado(bloqueado: boolean) {
//         this._tableroBloqueado = bloqueado;
//         if (this.options && this.options.api) {
//             this.options.draggable = { enabled: !bloqueado };
//             this.options.resizable = { enabled: !bloqueado };
//             this.options.api.optionsChanged!();
//         }
//     }
//     get tableroBloqueado(): boolean { return this._tableroBloqueado; }

//     public pestanaActiva: string = 'TLC_VIRTUAL_GATE_001';
//     public options!: GridsterConfig;

//     // 🟢 ESTADO UNIFICADO: Carcasa + Componente + Datos
//     public dashboard: Array<GridsterItem & { type: string, componenteTarget?: any, componenteInputs?: any }> = [];

//     public cargando: boolean = true;
//     public hayCambiosSinGuardar: boolean = false;
//     private peticionEnVuelo: boolean = false;

//     constructor(
//         private layoutEngine: LayoutMetadataEngineService,
//         private _virtualGateService: VirtualGateService,
//         private _localStoragoService: LocalStorageService,
//         private _torreService: DashboardService,
//         private cdr: ChangeDetectorRef
//     ) { }

//     async ngOnInit() {
//         this.iniciarGridster();

//         // 1. Buscamos la carcasa en la memoria
//         let layoutGuardado = this._localStoragoService.getLayoutPestana(this.pestanaActiva);

//         if (layoutGuardado && layoutGuardado.length > 0) {
//             console.log("⚡ [Virtual Gate] Renderizando carcasa vacía desde RAM local");
//             this.dashboard = layoutGuardado.map((w: any) => ({
//                 ...w,
//                 componenteTarget: this.obtenerComponentePara(w['type'] || w['codigoWidget']),
//                 componenteInputs: { widgetConfig: w, datosVivos: null }
//             }));
//             this.cargando = false;
//             this.cdr.detectChanges();

//             // Y luego de pintar la carcasa vacía, llamamos a la API para llenarla
//             await this.cargarDatosYLayout(false);
//         } else {
//             console.log("⚠️ [Virtual Gate] No hay RAM. Forzando construcción completa.");
//             // Si la RAM está vacía, pedimos que construya TODO y llame a la API
//             await this.cargarDatosYLayout(true);
//         }
//     }

//     ngOnChanges(changes: SimpleChanges) {
//         if (changes['puerto'] && !changes['puerto'].isFirstChange()) {
//             console.log("🚛 [Virtual Gate] Puerto cambiado, limpiando pantalla y actualizando...");
//             this.cargando = true;
//             this.dashboard = []; // Borramos todo para forzar el reinicio visual
//             this.cargarDatosYLayout(true);
//         }
//     }

//     // ==========================================
//     // 3. LA LLAMADA A LA API (ÚNICO FLUJO SEGURO)
//     // ==========================================
//     async cargarDatosYLayout(construirCarcasa: boolean) {
//         if (this.peticionEnVuelo) return;
//         this.peticionEnVuelo = true;

//         this._virtualGateService.obtenerColaGate().subscribe({
//             next: async (res: any) => {

//                 if (res && res.ok) {
//                     console.log('resultado layout virtualgete raw', res.msg);
//                     console.log('dashboard raw', this.dashboard);
//                     console.log('construirCarcasa', construirCarcasa);

//                     let layoutPuro = this.dashboard;

//                     // 1. 🌐 CONSTRUCCIÓN FORZADA (Si el caché estaba vacío o si cambió el puerto)
//                     if (construirCarcasa) {
//                         console.log("🌐 [Virtual Gate] Extrayendo Layout de BD...", res);
//                         layoutPuro = await this.layoutEngine.obtenerLayoutBase(this.pestanaActiva, this.usuarioId, this.lsWidgets);

//                         // Filtro salvavidas: Eliminamos basuras
//                         layoutPuro = layoutPuro.filter((w: any) => w.type || w.codigoWidget);

//                         layoutPuro = layoutPuro.map((w: any, index: number) => {
//                             if (!w.id && !w.idClon) w.id = `widget-auto-${index}-${w.x}-${w.y}`;
//                             return w;
//                         });

//                         // 🟢 GUARDAMOS EN SESSION STORAGE INMEDIATAMENTE
//                         this._localStoragoService.guardarLayoutPestanaEnSesion(this.pestanaActiva, layoutPuro);

//                         this.dashboard = layoutPuro.map((w: any) => ({
//                             ...w,
//                             componenteTarget: this.obtenerComponentePara(w['type'] || w['codigoWidget']),
//                             componenteInputs: { widgetConfig: w, datosVivos: null }
//                         }));
//                     }

//                     // 2. 📊 ARMADO DEL DICCIONARIO DE DATOS VIVOS
//                     const datosGlobales = {
//                         resumen: res.data.resumen,
//                         citas: res.data.citas,
//                         ...res.data
//                     };

//                     console.log('datosGlobales', datosGlobales);
//                     const kpisDataOficial: Record<string, any> = {
//                         'PTT_GATE_KPI_OP': { titulo: 'CAMIONES EN PUERTO', valor: res.data.resumen?.totalCamiones || 0, subtitulo: 'ZONA URBANA BUENAVENTURA', color: '#4dabf7', colorBorde: 'borde-cyan' },
//                         'PTT_GATE_KPI_CONT': { titulo: 'CONTENEDORES DÍA', valor: res.data.resumen?.totalContenedores || '2.847', subtitulo: 'FCL 1.900 · LCL 500 · Reefer 447', color: '#22b8cf', colorBorde: 'borde-amarillo' },
//                         'PTT_GATE_KPI_GRANEL': { titulo: 'GRANEL - TONS DÍA', valor: '38.4K', subtitulo: 'Agrícola 20K · Mineral 18.4K', color: '#fd7e14', colorBorde: 'borde-rojo' },
//                         'PTT_GATE_KPI_SUELTA': { titulo: 'CARGA SUELTA - TM', valor: '4.820', subtitulo: 'Break-bulk 3.000 · Paletizada 1.820', color: '#fcc419', colorBorde: 'borde-green' },
//                         'PTT_GATE_KPI_RORO': { titulo: 'VEHÍCULOS RO-RO', valor: '1.142', subtitulo: 'Imp 800 · Exp 342 · PDI 85%', color: '#20c997', colorBorde: 'borde-fucsia' },
//                         'PTT_GATE_KPI_BODEGAS': { titulo: 'SATURACIÓN BODEGAS', valor: '72%', subtitulo: '5 bodegas · 1 crítica · ruteo activo', color: '#cc5de8', colorBorde: 'borde-purple' },
//                         'PTT_GATE_KPI_SUB_CONT': { titulo: 'SUB - CONTENEDORES', valor: res.data.resumen?.subContenedores || 42, subtitulo: 'Retiros y devoluciones', color: '#868e96', colorBorde: 'borde-naranja' },
//                         'PTT_GATE_KPI_SUB_GRANEL': { titulo: 'SUB - GRANEL', valor: 28, subtitulo: 'Flujo hacia silos', color: '#868e96', colorBorde: 'borde-indigo' },
//                         'PTT_GATE_KPI_SUB_SUELTA': { titulo: 'SUB - CARGA SUELTA', valor: 11, subtitulo: 'Operación en bodega', color: '#868e96', colorBorde: 'borde-purple' },
//                         'PTT_GATE_KPI_SUB_NINERAS': { titulo: 'SUB - NIÑERAS', valor: 6, subtitulo: 'Trasiego a patios', color: '#868e96', colorBorde: 'borde-cyan' }
//                     };

//                     // 3. 🛡️ MAPEO DE DATOS AL DASHBOARD (SIN PASAR POR EL GOBERNADOR)
//                     this.dashboard = this.dashboard.map(w => {
//                         const configOriginal = w.componenteInputs.widgetConfig;
//                         const key = configOriginal['idClon'] || configOriginal['id'] || configOriginal['type'] || configOriginal['codigoWidget'];
//                         const tipo = configOriginal['type'] || configOriginal['codigoWidget'];

//                         let dataParaElWidget = datosGlobales;

//                         if (tipo && tipo.includes('KPI') && kpisDataOficial[tipo]) {
//                             dataParaElWidget = { ...datosGlobales, ...kpisDataOficial[tipo] };
//                         }

//                         // Creamos una nueva referencia de los inputs para forzar a Angular a pintar
//                         return {
//                             ...w,
//                             componenteInputs: {
//                                 ...w.componenteInputs,
//                                 datosVivos: dataParaElWidget
//                             }
//                         };
//                     });

//                     console.log('dashboard', this.dashboard);

//                 }

//                 // 4. 🚀 FINALIZAR
//                 this.cargando = false;
//                 this.peticionEnVuelo = false;
//                 this.cdr.detectChanges();
//             },
//             error: (err) => {
//                 console.error("❌ Error API Virtual Gate:", err);
//                 this.cargando = false;
//                 this.peticionEnVuelo = false;
//                 this.cdr.detectChanges();
//             }
//         });
//     }

//     obtenerComponentePara(codigoWidget: string) {
//         return WIDGET_MAP[codigoWidget] ? WIDGET_MAP[codigoWidget].componente : null;
//     }

//     iniciarGridster() {
//         this.options = {
//             gridType: GridType.ScrollVertical,
//             margin: 12, outerMargin: true, outerMarginBottom: 24, addEmptyRowsCount: 1,
//             minCols: 12, maxCols: 12, minRows: 1, maxRows: 1000, fixedRowHeight: 160,
//             pushItems: true, swap: false, compactType: 'none',
//             defaultItemCols: 4, defaultItemRows: 3, displayGrid: 'onDrag&Resize',
//             draggable: { enabled: !this.tableroBloqueado },
//             pushDirections: { north: false, east: false, south: true, west: false },
//             resizable: { enabled: !this.tableroBloqueado },
//             mobileBreakpoint: 960, keepFixedHeightInMobile: true,

//             itemResizeCallback: () => { this.hayCambiosSinGuardar = true; },
//             itemChangeCallback: () => { this.hayCambiosSinGuardar = true; }
//         };
//     }

//     trackByWidget(i: number, w: any) {
//         // TrackBy con el objeto original para no confundir a Gridster
//         const origen = w.componenteInputs?.widgetConfig || w;
//         return origen['idClon'] || origen['id'] || origen['type'];
//     }
// }
/*
    Author: German Valencia
    Component: Virtual Gate Dashboard (Layout Manager Puro - Arquitectura Smart Widgets)
*/
import { Component, Input, OnInit, OnChanges, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GridsterConfig, GridsterItem, GridType, GridsterComponent, GridsterItemComponent } from 'angular-gridster2';

import { LayoutMetadataEngineService } from 'src/app/theme/shared/service/layout-metadata-engine.service';
import { VirtualGateService } from 'src/app/theme/shared/service/tablero-control/virtual-gate.service';
import { WIDGET_MAP } from '../../widget-registry';
import { LocalStorageService } from 'src/app/theme/shared/service';
import { WidgetSelectorTclComponent } from 'src/app/porttos/widgets/widget-selector-tcl/widget-selector-tcl.component';

@Component({
    selector: 'app-virtual-gate-dashboard',
    standalone: true,
    imports: [CommonModule, GridsterComponent, GridsterItemComponent, WidgetSelectorTclComponent],
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
    public options!: GridsterConfig;

    // Estado exclusivo de Layout (Carcasa + Componente Target + Config Inmutable)
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
        if (this.lsWidgets && this.lsWidgets.length > 0) {
            this.inicializarLayoutPorPuerto();
        }
    }

    ngOnChanges(changes: SimpleChanges): void {
        const catalogoListo = this.lsWidgets && this.lsWidgets.length > 0;

        // 1. Si cambia el puerto seleccionado en el Header, invalidamos caché reactiva y reconstruimos layout
        if (changes['puerto'] && !changes['puerto'].isFirstChange() && catalogoListo) {
            this._virtualGateService.limpiarCachePuerto();
            this.inicializarLayoutPorPuerto(true);
        }

        // 2. Si el catálogo maestro lsWidgets llega por primera vez desde el Padre
        if (changes['lsWidgets'] && catalogoListo && this.dashboard.length === 0) {
            this.inicializarLayoutPorPuerto();
        }
    }

    /**
     * Construye o recupera de sesión únicamente el layout geométrico de Gridster.
     * Cada Smart Widget de Virtual Gate consulta sus datos de forma autónoma.
     */
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
        return WIDGET_MAP[codigoWidget] ? WIDGET_MAP[codigoWidget].componente : null;
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
            pushDirections: { north: false, east: false, south: true, west: false },
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
