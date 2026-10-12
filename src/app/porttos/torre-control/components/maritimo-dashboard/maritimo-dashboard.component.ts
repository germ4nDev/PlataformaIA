// /*
//     Author: German Valencia
//     Component: Marítimo Dashboard (Refactorizado: Caché Lazy + Suscripción Reactiva)
// */
// import { Component, Input, OnInit, OnChanges, SimpleChanges, ChangeDetectorRef } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { GridsterConfig, GridsterItem, GridType, GridsterComponent, GridsterItemComponent } from 'angular-gridster2';

// import { LayoutMetadataEngineService } from 'src/app/theme/shared/service/layout-metadata-engine.service';
// import { MaritimoService } from 'src/app/theme/shared/service/tablero-control/maritimo.service';
// import { WIDGET_MAP } from '../../widget-registry';
// import { LocalStorageService } from 'src/app/theme/shared/service';
// import { DashboardService } from 'src/app/theme/shared/service/tablero-control/dashboard.service';

// @Component({
//     selector: 'app-maritimo-dashboard',
//     standalone: true,
//     imports: [CommonModule, GridsterComponent, GridsterItemComponent],
//     templateUrl: './maritimo-dashboard.component.html',
//     styleUrls: ['./maritimo-dashboard.component.scss']
// })
// export class MaritimoDashboardComponent implements OnInit, OnChanges {
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

//     public pestanaActiva: string = 'TLC_MARITIMO_001';
//     public options!: GridsterConfig;

//     // 🟢 ESTADO UNIFICADO: Carcasa + Componente + Datos
//     public dashboard: Array<GridsterItem & { type: string, componenteTarget?: any, componenteInputs?: any }> = [];

//     public cargando: boolean = true;
//     public hayCambiosSinGuardar: boolean = false;
//     private peticionEnVuelo: boolean = false;

//     constructor(
//         private layoutEngine: LayoutMetadataEngineService,
//         private _maritimoService: MaritimoService,
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
//             console.log("⚡ [Marítimo] Renderizando carcasa desde RAM local");
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
//                 console.log("📡 [Marítimo] Inyectando datos vivos a los componentes");
//                 // Inyectamos mutando solo la propiedad de inputs. Gridster NO repinta.
//                 this.dashboard.forEach((w: any) => {
//                     const idUnico = w.idClon || w.id || w.type;
//                     w.componenteInputs = {
//                         ...w.componenteInputs,
//                         datosVivos: datosPestana[idUnico] || datosPestana[w.type] || datosPestana
//                     };
//                 });
//                 this.cdr.detectChanges();
//             } else {
//                 // Si la memoria global está vacía (primer inicio), llamamos a la API
//                 const requiereConstruirLayout = this.dashboard.length === 0;
//                 this.cargarDatosDesdeAPI(requiereConstruirLayout);
//             }
//         });
//     }

//     ngOnChanges(changes: SimpleChanges) {
//         if (changes['puerto'] && !changes['puerto'].isFirstChange()) {
//             console.log("🚢 [Marítimo] Puerto cambiado, reconstruyendo cascada dinámica...");
//             this.cargando = true;
//             this.dashboard = []; // Limpiamos pantalla
//             this.cargarDatosDesdeAPI(true); // Obligamos a reconstruir la carcasa
//         }
//     }

//     // ==========================================
//     // 3. LA LLAMADA A LA API (Única fuente de peticiones)
//     // ==========================================
//     cargarDatosDesdeAPI(construirCarcasa: boolean) {
//         if (this.peticionEnVuelo) return;
//         this.peticionEnVuelo = true;

//         this._maritimoService.obtenerResumenOperativo(this.puerto).subscribe({
//             next: async (res: any) => {
//                 if (res && res.success && res.data) {

//                     // 1. Filtrar Terminales para el puerto actual
//                     const todosLosTerminales = res.data.WDG_TERMINALES || [];
//                     const puertoUpper = (this.puerto || 'BUENAVENTURA').toUpperCase();
//                     const terminalesFiltrados = todosLosTerminales.filter((t: any) =>
//                         (t.id_puerto || '').toUpperCase() === puertoUpper || (t.ciudad || '').toUpperCase() === puertoUpper
//                     );

//                     let layoutPuro = this.dashboard;

//                     // 2. Si no había layout, construimos la Cascada Dinámica
//                     if (construirCarcasa) {
//                         console.log("🌐 [Marítimo] Generando layout y cascada desde Base de Datos...");
//                         layoutPuro = await this.layoutEngine.obtenerLayoutBase(this.pestanaActiva, this.usuarioId, this.lsWidgets, terminalesFiltrados);

//                         // Guardamos la matemática pura en RAM para la próxima vez
//                         this._localStoragoService.guardarLayoutPestanaEnSesion(this.pestanaActiva, layoutPuro);

//                         this.dashboard = layoutPuro.map((w: any) => ({
//                             ...w,
//                             componenteTarget: this.obtenerComponentePara(w.type),
//                             componenteInputs: { widgetConfig: w, datosVivos: null }
//                         }));
//                     }

//                     // 3. Armar Diccionario de Datos
//                     let diccionarioDatos: any = {
//                         'PTT_MAE_TAB_MOTONAVES': res.data.TABLE_REPORTE_MOTONAVES || res.data.WDG_TABLE_REPORTE_MOTONAVES,
//                         'PTT_MAE_CHRT_ETA_ATA': res.data.CHART_ETA_ATA || res.data.WDG_CHART_ETA_ATA,
//                         'PTT_MAE_CHRT_TONELADAS': res.data.CHART_TONELADAS || res.data.WDG_CHART_TONELADAS,
//                         'PTT_MAE_PANEL_CANAL': res.data.CONDICIONES_CANAL || res.data.WDG_CONDICIONES_CANAL,
//                         'PTT_MAE_PANEL_RESUMEN': res.data.RESUMEN_SEMANAL || res.data.WDG_RESUMEN_SEMANAL,
//                         'PTT_MAE_CHRT_PROD': res.data.CHART_PRODUCTIVIDAD || res.data.WDG_CHART_PRODUCTIVIDAD,
//                         'PTT_MAE_PANEL_ALERTAS': res.data.REPORTES_OPERATIVOS || res.data.WDG_REPORTES_OPERATIVOS,
//                         'PTT_MAE_MATRIZ_CARGA': res.data.MATRIZ_TERMINAL_CARGA || res.data.WDG_MATRIZ_TERMINAL_CARGA
//                     };

//                     // Mapeo Dinámico de KPIs según orden
//                     const kpisDataOficial = [
//                         { titulo: 'CAMIONES EN OPERACION', valor: res.data.camionesPuerto || '937', subtitulo: 'ZONA URBANA BUENAVENTURA', colorBorde: 'borde-cyan' },
//                         { titulo: 'CONTENEDORES DÍA', valor: res.data.contenedoresDia || '2.200', subtitulo: 'FCL 2.200 · LCL 0 · Reefer 0', colorBorde: 'borde-amarillo' },
//                         { titulo: 'GRANEL - TONS DÍA', valor: res.data.granelTons || '1.8K', subtitulo: 'Agrícola 35.2K · Mineral 0 · Líquido 17.6K', colorBorde: 'borde-naranja' },
//                         { titulo: 'CARGA SUELTA - TM', valor: res.data.cargaSuelta || '293', subtitulo: 'Break-bulk 293 · Project 0 · Paletizada 0', colorBorde: 'borde-green' },
//                         { titulo: 'VEHÍCULOS RO-RO', valor: res.data.vehiculosRoro || '147', subtitulo: 'Imp 147 · Exp 0 · PDI 95% ocupado', colorBorde: 'borde-teal' },
//                         { titulo: 'SATURACIÓN BODEGAS', valor: res.data.saturacionBodegas || '72%', subtitulo: '8 bodegas · 2 críticas · ruteo activo', colorBorde: 'borde-purple' }
//                     ];

//                     const kpisEnTablero = layoutPuro.filter((w: any) => (w.type || w.codigoWidget || '').toUpperCase().includes('KPI'));
//                     kpisEnTablero.forEach((kpiItem: any, index: number) => {
//                         if (kpisDataOficial[index]) diccionarioDatos[kpiItem.idClon || kpiItem.type] = kpisDataOficial[index];
//                     });

//                     // Mapeo Dinámico de Terminales (Cascada)
//                     terminalesFiltrados.forEach((terminal: any, index: number) => {
//                         diccionarioDatos[`TERM_SLOT_${index}`] = terminal;
//                     });

//                     // 4. Entregamos el diccionario al Gobernador Central
//                     this._torreService.setDatosPestana(this.pestanaActiva, diccionarioDatos);
//                 }

//                 this.cargando = false;
//                 this.peticionEnVuelo = false;
//                 this.cdr.detectChanges();
//             },
//             error: (err) => {
//                 console.error("❌ Error API Marítimo:", err);
//                 this.cargando = false;
//                 this.peticionEnVuelo = false;
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
//             pushDirections: { north: true, east: true, south: true, west: true },
//             resizable: { enabled: !this.tableroBloqueado },
//             mobileBreakpoint: 960, keepFixedHeightInMobile: true,

//             // 🛑 CERO GUARDADO AUTOMÁTICO AL MOVER. Solo marcamos que hay cambios.
//             itemResizeCallback: () => { this.hayCambiosSinGuardar = true; },
//             itemChangeCallback: () => { this.hayCambiosSinGuardar = true; }
//         };
//     }

//     trackByWidget(i: number, w: any) { return w.id || w.idClon || w.type; }
// }
/*
    Author: German Valencia
    Component: Marítimo Dashboard (Layout Manager Puro - Arquitectura Smart Widgets)
*/
import { Component, Input, OnInit, OnChanges, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GridsterConfig, GridsterItem, GridType, GridsterComponent, GridsterItemComponent } from 'angular-gridster2';
import { firstValueFrom } from 'rxjs';

import { LayoutMetadataEngineService } from 'src/app/theme/shared/service/layout-metadata-engine.service';
import { MaritimoService } from 'src/app/theme/shared/service/tablero-control/maritimo.service';
import { WIDGET_MAP } from '../../widget-registry';
import { LocalStorageService } from 'src/app/theme/shared/service';

@Component({
    selector: 'app-maritimo-dashboard',
    standalone: true,
    imports: [CommonModule, GridsterComponent, GridsterItemComponent],
    templateUrl: './maritimo-dashboard.component.html',
    styleUrls: ['./maritimo-dashboard.component.scss']
})
export class MaritimoDashboardComponent implements OnInit, OnChanges {
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

    public readonly pestanaActiva: string = 'TLC_MARITIMO_001';
    public options!: GridsterConfig;

    // Estado exclusivo de Layout (Coordenadas + Componente Target + Configuración Estable)
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
        private _maritimoService: MaritimoService,
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

        // 1. Si cambió el puerto seleccionado en el Header, limpiamos caché del servicio y rearmamos grilla
        if (changes['puerto'] && !changes['puerto'].isFirstChange() && catalogoListo) {
            this._maritimoService.limpiarCachePuerto();
            this.inicializarLayoutPorPuerto(true);
        }

        // 2. Si el catálogo maestro lsWidgets acaba de llegar desde el componente Padre
        if (changes['lsWidgets'] && catalogoListo && this.dashboard.length === 0) {
            this.inicializarLayoutPorPuerto();
        }
    }

    /**
     * Construye o recupera de sesión únicamente la estructura geométrica (Gridster).
     * Los datos operativos los consulta cada Smart Widget de forma autónoma.
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
                // Obtenemos la lista ligera de terminales del puerto para que el motor cree los TERM_SLOT_N
                const terminalesDelPuerto = await firstValueFrom(
                    this._maritimoService.obtenerTerminalesPorPuerto(puertoNormalizado)
                );

                layoutGuardado = await this.layoutEngine.obtenerLayoutBase(
                    this.pestanaActiva,
                    this.usuarioId,
                    this.lsWidgets,
                    terminalesDelPuerto
                );

                this._localStorageService.guardarLayoutPestanaEnSesion(cacheKey, layoutGuardado);
            }

            // Montamos las carcasas con una referencia inmutable en componenteInputs
            this.dashboard = (layoutGuardado || []).map((w: any, index: number) => {
                const codigoTipo = (w.type || w.codigoWidget || '').trim().toUpperCase();
                const idUnico = w.idClon || w.id || `wdg-mar-${index}-${w.x}-${w.y}`;

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
            console.error('❌ [Marítimo Layout Manager] Error construyendo el layout:', error);
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
        return w.idClon || w.id || w.type || index.toString();
    }
}
