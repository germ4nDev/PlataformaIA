// // /*
// //     Author: German Valencia
// //     Component: Mapa Dashboard (Refactorizado como Gerente de Estado)
// // */
// // import { Component, Input, OnInit, OnChanges, SimpleChanges, ChangeDetectorRef } from '@angular/core';
// // import { CommonModule } from '@angular/common';
// // import { GridsterConfig, GridsterItem, GridType, GridsterComponent, GridsterItemComponent } from 'angular-gridster2';

// // import { LayoutMetadataEngineService } from 'src/app/theme/shared/service/layout-metadata-engine.service';
// // import { WIDGET_MAP } from '../../widget-registry';
// // import { TableroStateService } from 'src/app/theme/shared/service/tablero-control/tablero-state.service';
// // import { LocalStorageService } from 'src/app/theme/shared/service';
// // import { DashboardService } from 'src/app/theme/shared/service/tablero-control/dashboard.service';

// // @Component({
// //     selector: 'app-mapa-dashboard',
// //     standalone: true,
// //     imports: [CommonModule, GridsterComponent, GridsterItemComponent],
// //     templateUrl: './mapa-dashboard.component.html',
// //     styleUrls: ['./mapa-dashboard.component.scss']
// // })
// // export class MapaDashboardComponent implements OnInit, OnChanges {
// //     @Input() puerto!: string;
// //     @Input() usuarioId!: string;
// //     @Input() lsWidgets!: any[];

// //     private _tableroBloqueado = true;
// //     @Input()
// //     set tableroBloqueado(bloqueado: boolean) {
// //         this._tableroBloqueado = bloqueado;
// //         if (this.options && this.options.api) {
// //             this.options.draggable = { enabled: !bloqueado };
// //             this.options.resizable = { enabled: !bloqueado };
// //             this.options.api.optionsChanged!();
// //         }
// //     }
// //     get tableroBloqueado(): boolean {
// //         return this._tableroBloqueado;
// //     }

// //     pestanaActiva: string = 'TLC-MAPA-001';
// //     public options!: GridsterConfig;

// //     // 🟢 LAS VARIABLES DEL ESTADO
// //     public dashboard: Array<GridsterItem & { type: string, data: any }> = []; // La Biblia
// //     public datosVivosDePestana: any = {}; // El diccionario reactivo

// //     public cargando: boolean = true;
// //     public hayCambiosSinGuardar: boolean = false;

// //     constructor(
// //         private layoutEngine: LayoutMetadataEngineService,
// //         private _stateService: TableroStateService,
// //         private _localStoragoService: LocalStorageService,
// //         private _torreService: DashboardService,
// //         private cdr: ChangeDetectorRef
// //     ) { }

// //     ngOnInit() {
// //         this.iniciarGridster();

// //         // 🟢 NOS SUSCRIBIMOS AL GOBERNADOR
// //         this._torreService.state$.subscribe(estadoGlobal => {
// //             if (estadoGlobal.layouts['MAPA']) {
// //                 this.dashboard = estadoGlobal.layouts['MAPA'];
// //                 this.datosVivosDePestana = estadoGlobal.datosVivos['MAPA'] || {};

// //                 this.cargando = false;
// //                 this.cdr.detectChanges();
// //             } else if (this.lsWidgets && this.lsWidgets.length > 0) {
// //                 this.cargarDatos();
// //             }
// //         });
// //     }

// //     ngOnChanges(changes: SimpleChanges) {
// //         if (changes['puerto'] && !changes['puerto'].isFirstChange()) {
// //             this.cargarDatos();
// //         }
// //         if (changes['lsWidgets'] && changes['lsWidgets'].currentValue?.length > 0 && this.dashboard.length === 0) {
// //             this.cargarDatos();
// //         }
// //     }

// //     async cargarDatos() {
// //         // 1. Obtenemos el layout puro
// //         let layoutPuro = await this.layoutEngine.obtenerLayoutBase('TLC_MAPA_001', this.usuarioId, this.lsWidgets);

// //         // 2. Extraemos los datos vivos.
// //         // Como 'TableroStateService' mutaba el layout, extraemos esa data a un diccionario
// //         const diccionarioDatos: any = {};

// //         // Asumimos que tu TableroStateService retorna los datos de alguna manera,
// //         // o si sigue inyectando directamente, creamos el diccionario a partir de eso:
// //         await this._stateService.inyectarDatosVivos(this.puerto, layoutPuro);

// //         layoutPuro.forEach((widget: any, index: number) => {
// //             if (!widget.id && !widget.idClon) widget.id = `widget-auto-${index}-${widget.x}-${widget.y}`;
// //             const idUnico = widget.idClon || widget.id;

// //             // Extraemos la data que inyectó el TableroStateService
// //             if (widget.data) {
// //                 diccionarioDatos[idUnico] = { ...widget.data };
// //                 diccionarioDatos[widget.type] = { ...widget.data };
// //             }
// //         });

// //         // 3. 🚨 LE AVISAMOS AL GOBERNADOR
// //         this._torreService.actualizarLayoutPestana('MAPA', layoutPuro);
// //         this._torreService.actualizarDatosPestana('MAPA', diccionarioDatos);

// //         setTimeout(() => {
// //             if (this.options?.api?.resize) this.options.api.resize();
// //         }, 50);
// //     }

// //     obtenerComponentePara(codigoWidget: string) {
// //         return WIDGET_MAP[codigoWidget] ? WIDGET_MAP[codigoWidget].componente : null;
// //     }

// //     iniciarGridster() {
// //         this.options = {
// //             gridType: GridType.ScrollVertical,
// //             margin: 12, addEmptyRowsCount: 1,
// //             outerMargin: true, outerMarginBottom: 24,
// //             minCols: 12, maxCols: 12, minRows: 1, maxRows: 1000, fixedRowHeight: 160,
// //             pushItems: true, swap: false, compactType: 'none',
// //             defaultItemCols: 4, defaultItemRows: 3, displayGrid: 'onDrag&Resize',
// //             draggable: { enabled: !this.tableroBloqueado },
// //             pushDirections: { north: false, east: false, south: true, west: false },
// //             resizable: { enabled: !this.tableroBloqueado },
// //             mobileBreakpoint: 960, keepFixedHeightInMobile: true,

// //             itemResizeCallback: (item, itemComponent) => {
// //                 if (this.cargando) return;
// //                 this.hayCambiosSinGuardar = true;
// //                 // this.sincronizarMovimientoEnCache();
// //             },
// //             itemChangeCallback: (item, itemComponent) => {
// //                 if (this.cargando) return;
// //                 this.hayCambiosSinGuardar = true;
// //                 // this.sincronizarMovimientoEnCache();
// //             }
// //         };
// //     }

// //     sincronizarMovimientoEnCache() {
// //         if (!this.dashboard || this.cargando) return;

// //         const preferencias = this._localStoragoService.getNavSettingsLocalStorage() || {};
// //         let layoutGuardado = preferencias.layout || [];

// //         layoutGuardado = layoutGuardado.filter((w: any) =>
// //             w.pestana !== this.pestanaActiva &&
// //             w.type !== 'WDG_FANTASMA' &&
// //             w.codigoWidget !== 'WDG_FANTASMA'
// //         );

// //         const dashboardActualizado = this.dashboard
// //             .filter(w => w.type !== 'WDG_FANTASMA' && !(w.type || '').includes('FANTASMA'))
// //             .map(w => ({ ...w, pestana: this.pestanaActiva }));

// //         preferencias.layout = [...layoutGuardado, ...dashboardActualizado];
// //         this._localStoragoService.setNavSettingsLocalStorage(preferencias);
// //     }

// //     trackByWidget(i: number, w: any) { return w.idClon || w.type; }
// // }
// /*
//     Author: German Valencia
//     Component: Mapa Dashboard (Refactorizado: Caché Lazy + Suscripción Reactiva)
// */
// import { Component, Input, OnInit, OnChanges, SimpleChanges, ChangeDetectorRef } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { GridsterConfig, GridsterItem, GridType, GridsterComponent, GridsterItemComponent } from 'angular-gridster2';

// import { LayoutMetadataEngineService } from 'src/app/theme/shared/service/layout-metadata-engine.service';
// import { WIDGET_MAP } from '../../widget-registry';
// import { TableroStateService } from 'src/app/theme/shared/service/tablero-control/tablero-state.service';
// import { LocalStorageService } from 'src/app/theme/shared/service';
// import { DashboardService } from 'src/app/theme/shared/service/tablero-control/dashboard.service';

// @Component({
//     selector: 'app-mapa-dashboard',
//     standalone: true,
//     imports: [CommonModule, GridsterComponent, GridsterItemComponent],
//     templateUrl: './mapa-dashboard.component.html',
//     styleUrls: ['./mapa-dashboard.component.scss']
// })
// export class MapaDashboardComponent implements OnInit, OnChanges {
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

//     // 🟢 Aseguramos que el código de la pestaña sea el correcto
//     public pestanaActiva: string = 'TLC_MAPA_001';
//     public options!: GridsterConfig;

//     // 🟢 ESTADO UNIFICADO: Carcasa + Componente + Datos
//     public dashboard: Array<GridsterItem & { type: string, componenteTarget?: any, componenteInputs?: any }> = [];

//     public cargando: boolean = true;
//     public hayCambiosSinGuardar: boolean = false;
//     private peticionEnVuelo: boolean = false;

//     constructor(
//         private layoutEngine: LayoutMetadataEngineService,
//         private _stateService: TableroStateService,
//         private _localStoragoService: LocalStorageService,
//         private _torreService: DashboardService,
//         private cdr: ChangeDetectorRef
//     ) { }

//     async ngOnInit() {
//         this.iniciarGridster();

//         // ==========================================
//         // 1. RENDERIZADO INMEDIATO DE LA CARCASA
//         // ==========================================
//         let layoutGuardado = this._localStoragoService.getLayoutPestana(this.pestanaActiva);

//         if (layoutGuardado && layoutGuardado.length > 0) {
//             console.log("⚡ [Mapa] Renderizando carcasa desde RAM local");
//             this.dashboard = layoutGuardado.map((w: any) => ({
//                 ...w,
//                 componenteTarget: this.obtenerComponentePara(w.type),
//                 componenteInputs: { widgetConfig: w, datosVivos: null }
//             }));
//             this.cargando = false;
//             this.cdr.detectChanges();
//         }

//         // ==========================================
//         // 2. RECEPCIÓN REACTIVA DE DATOS VIVOS
//         // ==========================================
//         this._torreService.datosVivos$.subscribe((estadoGlobal: any) => {
//             const datosPestana = estadoGlobal[this.pestanaActiva];

//             if (datosPestana) {
//                 console.log("📡 [Mapa] Inyectando datos vivos a los componentes");
//                 this.dashboard.forEach((w: any) => {
//                     const idUnico = w.idClon || w.id || w.type;
//                     w.componenteInputs = {
//                         ...w.componenteInputs,
//                         datosVivos: datosPestana[idUnico] || datosPestana[w.type] || datosPestana
//                     };
//                 });
//                 this.cdr.detectChanges();
//             } else {
//                 // Si la memoria global está vacía, construimos el mapa
//                 const requiereConstruirLayout = this.dashboard.length === 0;
//                 this.cargarDatosDesdeAPI(requiereConstruirLayout);
//             }
//         });
//     }

//     ngOnChanges(changes: SimpleChanges) {
//         if (changes['puerto'] && !changes['puerto'].isFirstChange()) {
//             console.log("🗺️ [Mapa] Puerto cambiado, actualizando coordenadas...");
//             this.cargando = true;
//             this.dashboard = [];
//             this.cargarDatosDesdeAPI(true);
//         }
//     }

//     // ==========================================
//     // 3. LA LLAMADA A LA API O SERVICIOS DEL MAPA
//     // ==========================================
//     async cargarDatosDesdeAPI(construirCarcasa: boolean) {
//         if (this.peticionEnVuelo) return;
//         this.peticionEnVuelo = true;

//         try {
//             let layoutPuro = this.dashboard.map(w => w.componenteInputs?.widgetConfig || w);

//             // 1. Si no hay layout en RAM, lo traemos de la Base de Datos
//             if (construirCarcasa) {
//                 console.log("🌐 [Mapa] Generando layout desde Base de Datos...");
//                 layoutPuro = await this.layoutEngine.obtenerLayoutBase(this.pestanaActiva, this.usuarioId, this.lsWidgets);

//                 this._localStoragoService.guardarLayoutPestanaEnSesion(this.pestanaActiva, layoutPuro);

//                 this.dashboard = layoutPuro.map((w: any) => ({
//                     ...w,
//                     componenteTarget: this.obtenerComponentePara(w.type),
//                     componenteInputs: { widgetConfig: w, datosVivos: null }
//                 }));
//             }

//             // 2. Extraemos los datos vivos. Para el Mapa usabas inyectarDatosVivos de TableroStateService
//             await this._stateService.inyectarDatosVivos(this.puerto, layoutPuro);

//             let diccionarioDatos: any = {};

//             // Recorremos el layout ya hidratado por TableroStateService para sacar la data
//             layoutPuro.forEach((widget: any) => {
//                 const idUnico = widget.idClon || widget.id || widget.type;
//                 if (widget.data) {
//                     diccionarioDatos[idUnico] = { ...widget.data };
//                     diccionarioDatos[widget.type] = { ...widget.data };
//                 }
//             });

//             // 3. Entregamos el diccionario al Gobernador Central
//             this._torreService.setDatosPestana(this.pestanaActiva, diccionarioDatos);

//         } catch (error) {
//             console.error("❌ Error API Mapa:", error);
//         } finally {
//             this.cargando = false;
//             this.peticionEnVuelo = false;
//             this.cdr.detectChanges();
//         }
//     }

//     obtenerComponentePara(codigoWidget: string) {
//         return WIDGET_MAP[codigoWidget] ? WIDGET_MAP[codigoWidget].componente : null;
//     }

//     iniciarGridster() {
//         this.options = {
//             gridType: GridType.ScrollVertical,
//             margin: 12, addEmptyRowsCount: 1,
//             outerMargin: true, outerMarginBottom: 24,
//             minCols: 12, maxCols: 12, minRows: 1, maxRows: 1000, fixedRowHeight: 160,
//             pushItems: true, swap: false, compactType: 'none',
//             defaultItemCols: 4, defaultItemRows: 3, displayGrid: 'onDrag&Resize',
//             draggable: { enabled: !this.tableroBloqueado },
//             pushDirections: { north: false, east: false, south: true, west: false },
//             resizable: { enabled: !this.tableroBloqueado },
//             mobileBreakpoint: 960, keepFixedHeightInMobile: true,

//             // 🛑 CERO GUARDADO AUTOMÁTICO AL MOVER.
//             itemResizeCallback: () => { this.hayCambiosSinGuardar = true; },
//             itemChangeCallback: () => { this.hayCambiosSinGuardar = true; }
//         };
//     }

//     trackByWidget(i: number, w: any) { return w.idClon || w.type; }
// }
/*
    Author: German Valencia
    Component: Mapa Logístico Dashboard (Layout Manager Puro - Arquitectura Smart Widgets)
*/
import { Component, Input, OnInit, OnChanges, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GridsterConfig, GridsterItem, GridType, GridsterComponent, GridsterItemComponent } from 'angular-gridster2';

import { LayoutMetadataEngineService } from 'src/app/theme/shared/service/layout-metadata-engine.service';
import { WIDGET_MAP } from '../../widget-registry';
import { LocalStorageService } from 'src/app/theme/shared/service';

@Component({
    selector: 'app-mapa-dashboard',
    standalone: true,
    imports: [CommonModule, GridsterComponent, GridsterItemComponent],
    templateUrl: './mapa-dashboard.component.html',
    styleUrls: ['./mapa-dashboard.component.scss']
})
export class MapaDashboardComponent implements OnInit, OnChanges {
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

    public readonly pestanaActiva: string = 'TLC_MAPA_001';
    public options!: GridsterConfig;

    // Estado exclusivo de Layout (Coordenadas + Componente Target + Config Inmutable)
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

        // 1. Si cambia el puerto en el Header, reconstruimos el layout y propagamos el nuevo puerto a los widgets
        if (changes['puerto'] && !changes['puerto'].isFirstChange() && catalogoListo) {
            this.inicializarLayoutPorPuerto(true);
        }

        // 2. Si el catálogo maestro lsWidgets llega por primera vez desde el Padre
        if (changes['lsWidgets'] && catalogoListo && this.dashboard.length === 0) {
            this.inicializarLayoutPorPuerto();
        }
    }

    /**
     * Construye o recupera de sesión únicamente la estructura geométrica (Gridster).
     * Cada Smart Widget del Mapa Logístico consulta sus nodos, geocercas o rutas de forma autónoma.
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
                const idUnico = w.idClon || w.id || `wdg-mapa-${index}-${w.x}-${w.y}`;

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
                            puerto: puertoNormalizado,
                            pestana: this.pestanaActiva
                        }
                    }
                };
            });
        } catch (error) {
            console.error('❌ [Mapa Layout Manager] Error construyendo el layout:', error);
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
            addEmptyRowsCount: 1,
            outerMargin: true,
            outerMarginBottom: 24,
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
