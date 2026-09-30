// // /*
// //     Author: German Valencia
// //     Pattern: PORTTOS Orchestrator Component - Multi-Tenant (QPLUS Unified)
// //     Refactor: Integración de Motor de Layouts Dinámico (Fábricas)
// // */
// // import { Component, OnInit, OnDestroy, ChangeDetectorRef, EventEmitter, Output } from '@angular/core';
// // import { CommonModule } from '@angular/common';
// // import { TranslateModule } from '@ngx-translate/core';
// // import { GridsterConfig, GridsterItem, GridType, GridsterComponent, GridsterItemComponent } from 'angular-gridster2';

// // import { Subscription } from 'rxjs';
// // import { debounceTime, distinctUntilChanged, filter } from 'rxjs/operators';

// // import { DashboardService } from 'src/app/theme/shared/service/tablero-control/dashboard.service';
// // import { TableroStateService } from '../../theme/shared/service/tablero-control/tablero-state.service';
// // import { FiltroTableroService } from 'src/app/theme/shared/service/tablero-control/filtro-tablero.service';
// // import { PTLWidgetsMaestroService } from 'src/app/theme/shared/service/ptlwidgets-maestro.service';
// // import { MaritimoService } from 'src/app/theme/shared/service/tablero-control/maritimo.service';
// // import { VirtualGateService } from 'src/app/theme/shared/service/tablero-control/virtual-gate.service';
// // import { ContenedoresService } from 'src/app/theme/shared/service/tablero-control/contenedores.service';
// // import { LocalStorageService } from 'src/app/theme/shared/service';
// // import { PtlpestanasService } from 'src/app/theme/shared/service/ptlpestanas.service';

// // import { TcHeaderComponent } from "../widgets/tc-header/tc-header.component";
// // import { WidgetSelectorTclComponent } from "../widgets/widget-selector-tcl/widget-selector-tcl.component";
// // import { WidgetLobbyTclComponent } from "../widgets/widget-lobby-tcl/widget-lobby-tcl.component";
// // import { PestanaLobbyTclComponent } from '../widgets/pestana-lobby-tcl/pestana-lobby-tcl.component';
// // import { Widget } from 'src/app/theme/shared/_helpers/models/tablero-control/widget.model';
// // import { LayoutService } from 'src/app/theme/shared/service/layout.service';

// // import { construirLayoutEstatico, construirLayoutMaritimo } from '../../theme/shared/_config/tab-layouts.config';
// // import { PTLLayoutModel } from 'src/app/theme/shared/_helpers/models/PTLLayout.model';
// // import { v4 as uuidv4 } from 'uuid';

// // @Component({
// //     selector: 'app-torre-control',
// //     standalone: true,
// //     imports: [CommonModule, TranslateModule, TcHeaderComponent, GridsterComponent, GridsterItemComponent, WidgetSelectorTclComponent, WidgetLobbyTclComponent, PestanaLobbyTclComponent],
// //     templateUrl: './torre-control.component.html',
// //     styleUrls: ['./torre-control.component.scss']
// // })
// // export class TorreControlComponent implements OnInit, OnDestroy {
// //     @Output() toggleBloqueo = new EventEmitter<void>();

// //     public options!: GridsterConfig;
// //     public dashboard: Array<GridsterItem & { type: string, data: any }> = [];
// //     isOptionBloqueo: boolean = false;
// //     isBloqueado: boolean = false;

// //     public cargando: boolean = true;
// //     public tableroBloqueado: boolean = true;
// //     public widgetEnfoque: { type: string, data: any } | null = null;
// //     public hayCambiosSinGuardar: boolean = false;

// //     public lsWidgets: Widget[] = [];
// //     public lsLayout: any[] = [];
// //     public widgetsParaElLobby: any[] = [];
// //     public lsPestanas: any[] = [];
// //     public layout: PTLLayoutModel[] = [];

// //     public pestanaActiva: string = '';
// //     public puertoSeleccionado: string = 'BUENAVENTURA';
// //     public usuarioId: string = '';
// //     public mostrarLobby: boolean = false;
// //     public isLoading = false;
// //     public pestanasVisibles: any[] = [];
// //     public mostrarLobbyPestanas: boolean = false;

// //     private readonly APP_PORTTOS_ID = '3eb98a9f-cc5d-417d-95ea-a2b8abc3b5fa';

// //     public listaDePuertos: any[] = [
// //         { id: 'BUENAVENTURA', nombre: 'Buenaventura (SPRBUN / TCBUEN)' },
// //         { id: 'CARTAGENA', nombre: 'Cartagena (SPRC / CONTECAR)' },
// //         { id: 'BARRANQUILLA', nombre: 'Barranquilla (SPRB)' },
// //         { id: 'SANTAMARTA', nombre: 'Santa Marta (SPRB)' }
// //     ];

// //     private subs: Subscription = new Subscription();

// //     constructor(
// //         private _stateService: TableroStateService,
// //         private _torreService: DashboardService,
// //         private _maritimoService: MaritimoService,
// //         private _virtualGateService: VirtualGateService,
// //         private _contenedoresService: ContenedoresService,
// //         private _filtroService: FiltroTableroService,
// //         private _widgetsService: PTLWidgetsMaestroService,
// //         private _localStoragoService: LocalStorageService,
// //         private _layoutService: LayoutService,
// //         private _pestanasService: PtlpestanasService,
// //         private cdr: ChangeDetectorRef
// //     ) { }

// //     async ngOnInit() {
// //         this.iniciarConfiguracionGridster();

// //         const current = this._localStoragoService.getCurrentUserLocalStorage();
// //         const navSetttings = this._localStoragoService.getNavSettingsLocalStorage();
// //         console.log('navSetttings', navSetttings);
// //         // this.lsLayout = this._layoutService.getLayoutActuales();

// //         this.lsLayout = navSetttings.layout || [];
// //         this.usuarioId = current?.usuario?.codigoUsuario || 'SISTEMA_DEFAULT';

// //         const codigoSuite = navSetttings.suite?.codigoSuite || 'a815687f-b9b6-4404-83dd-9a4074224320';
// //         const codigoAplicacion = navSetttings.aplicacion?.codigoAplicacion || this.APP_PORTTOS_ID;

// //         this._pestanasService.obtenerPestanasDelContexto(codigoSuite, codigoAplicacion).subscribe(async (res: any) => {
// //             if (res.success && res.data && res.data.length > 0) {
// //                 this.lsPestanas = res.data;

// //                 const preferencias = this._localStoragoService.getNavSettingsLocalStorage();
// //                 const pestaActivasUsuario = preferencias.pestanas || [];

// //                 if (pestaActivasUsuario.length > 0) {
// //                     // 🟢 FIX: Mapear respetando el orden guardado en el LocalStorage
// //                     this.pestanasVisibles = pestaActivasUsuario
// //                         .map((codigo: string) => this.lsPestanas.find(p => p.codigoPestana === codigo))
// //                         .filter((p: any) => p !== undefined);
// //                 } else {
// //                     this.pestanasVisibles = this.lsPestanas.filter((p, index) => index < 3);
// //                 }

// //                 preferencias.pestanas = this.pestanasVisibles;
// //                 this._localStoragoService.setNavSettingsLocalStorage(preferencias);

// //                 const pestanaGuardada = preferencias.pestanas;
// //                 const existePestana = this.pestanasVisibles.find(p => p.codigoPestana === pestanaGuardada);
// //                 this.pestanaActiva = existePestana ? pestanaGuardada : this.pestanasVisibles[0].codigoPestana;

// //                 current.pestanaActiva = this.pestanaActiva;
// //                 this._localStoragoService.setCurrentUserLocalStorage(current);

// //                 this.cargarCatalogoWidgetsYRenderizar();
// //             }
// //         });

// //         this.subs.add(
// //             this._filtroService.ciudad$.pipe(
// //                 distinctUntilChanged(),
// //                 debounceTime(300),
// //                 filter(puerto => !!puerto)
// //             ).subscribe(async (puerto: any) => {
// //                 const puertoStr = typeof puerto === 'string' ? puerto : (puerto.id_puerto || puerto.id || 'BUENAVENTURA');
// //                 this.puertoSeleccionado = puertoStr;
// //                 this.renderizarLayoutDesdeCache(this.pestanaActiva);
// //             })
// //         );

// //         this.subs.add(this._torreService.widgetFocus$.subscribe(widget => {
// //             this.widgetEnfoque = widget;
// //             this.cdr.detectChanges();
// //         }));
// //     }

// //     ngOnDestroy() {
// //         this.subs.unsubscribe();
// //     }

// //     obtenerIconoPestana(codigoPestana: string): string {
// //         const diccionarioIconos: { [key: string]: string } = {
// //             'TLC_MARITIMO_001': 'fas fa-ship text-info',
// //             'TLC_VIRTUAL_GATE_001': 'fas fa-truck text-warning',
// //             'TLC_CONTENEDORES_001': 'fas fa-box text-success',
// //             'TLC_MAPA_001': 'fas fa-map-marked-alt text-danger',
// //             'TLC_NOTICIAS_001': 'fas fa-newspaper text-primary'
// //         };
// //         return diccionarioIconos[codigoPestana] || 'fas fa-th-large text-secondary';
// //     }

// //     cargarCatalogoWidgetsYRenderizar() {
// //         this.lsWidgets = this._widgetsService.getWidgetsActuales() || [];
// //         this.cambiarPestana(this.pestanaActiva);
// //     }

// //     iniciarConfiguracionGridster() {
// //         this.options = {
// //             gridType: GridType.ScrollVertical,
// //             margin: 16, outerMargin: false,
// //             minCols: 12, maxCols: 12, minRows: 1, maxRows: 100, fixedRowHeight: 160,
// //             pushItems: false, swap: false, compactType: 'none',
// //             defaultItemCols: 4, defaultItemRows: 3, displayGrid: 'onDrag&Resize',
// //             draggable: { enabled: !this.tableroBloqueado },
// //             resizable: { enabled: !this.tableroBloqueado }, outerMarginRight: 0,
// //             mobileBreakpoint: 960, keepFixedHeightInMobile: true,
// //             itemResizeCallback: () => { this.hayCambiosSinGuardar = true; },
// //             itemChangeCallback: () => { this.hayCambiosSinGuardar = true; }
// //         };
// //     }

// //     // obtenerLayoutBase(pestana: string): any[] {
// //     //     let layoutUsuario: any[] = [];
// //     //     this.pestanaActiva = pestana;
// //     //     if (layoutUsuario.length === 0) {
// //     //         const widgetsInicialesBd = this.lsWidgets.filter((w: any) =>
// //     //             w.codigoPestana === pestana && (w.inicial === true || w.inicial === 'true' || w.inicial === 1)
// //     //         );

// //     //         this.gestionarLayout(widgetsInicialesBd);

// //     //         layoutUsuario = widgetsInicialesBd.map((w: any, index: number) => ({
// //     //             type: w.codigoWidget || w.codigo_widget,
// //     //             codigoWidget: w.codigoWidget || w.codigo_widget,
// //     //             cols: w.defaultCols || w.cols_defecto || 4,
// //     //             rows: w.defaultRows || w.rows_defecto || 3,
// //     //             x: w.pos_x !== undefined ? w.pos_x : 0,
// //     //             y: w.pos_y !== undefined ? w.pos_y : 0,
// //     //             visible: true,
// //     //             pestana: pestana,
// //     //             version: w.layoutVersion || 1
// //     //         }));
// //     //     }

// //     //     return layoutUsuario.map(layoutItem => {
// //     //         const widgetConfig = this.lsWidgets.find(w => (w as any).codigoWidget === layoutItem.type);
// //     //         return { ...widgetConfig, ...layoutItem };
// //     //     });
// //     // }
// //     async obtenerLayoutBase(pestana: string): Promise<any[]> {
// //         this.pestanaActiva = pestana;
// //         let layoutArmado: any[] = [];
// //         const usuario = this.usuarioId || 'SISTEMA_DEFAULT';

// //         try {
// //             // 1. Consultar a la base de datos a través de tu servicio
// //             // Convertimos el Observable a una Promesa con toPromise() o firstValueFrom()
// //             const layoutDesdeBD: PTLLayoutModel[] = await this._layoutService
// //                 .cargarRegistrosUsuarioPestana(usuario, pestana)
// //                 .toPromise() || [];

// //             if (layoutDesdeBD.length > 0) {
// //                 // 🟢 ESCENARIO A: El usuario YA TIENE un layout guardado en la BD
// //                 console.log(`Cargando layout desde Base de Datos para pestaña ${pestana}`);

// //                 layoutArmado = layoutDesdeBD.map(itemDB => {
// //                     // Buscamos la configuración visual maestra de ese widget (icono, nombre, etc.)
// //                     const widgetMaster = this.lsWidgets.find(w => (w as any).codigoWidget === itemDB.codigoWidget);

// //                     // Parseamos la data de configuración del widget si existe
// //                     let configData = null;
// //                     if (itemDB.config) {
// //                         try {
// //                             configData = typeof itemDB.config === 'string' ? JSON.parse(itemDB.config) : itemDB.config;
// //                         } catch (e) {
// //                             console.error('Error parseando config DB', itemDB);
// //                         }
// //                     }

// //                     // Fusionamos la data maestra con las coordenadas exactas de la BD
// //                     return {
// //                         ...widgetMaster,
// //                         type: itemDB.codigoWidget,
// //                         codigoWidget: itemDB.codigoWidget,
// //                         cols: itemDB.cols,
// //                         rows: itemDB.rows,
// //                         x: itemDB.posicion_x,
// //                         y: itemDB.posicion_y,
// //                         visible: true,
// //                         pestana: pestana,
// //                         data: configData || (widgetMaster ? (widgetMaster as any).data : null)
// //                     };
// //                 });

// //             } else {
// //                 // 🟡 ESCENARIO B: No hay layout en BD (Usuario Nuevo).
// //                 // Inyectamos los widgets marcados como "iniciales" en el catálogo maestro.
// //                 console.log(`Sin layout en BD. Cargando configuración por defecto para pestaña ${pestana}`);

// //                 const widgetsInicialesBd = this.lsWidgets.filter((w: any) =>
// //                     w.codigoPestana === pestana && (w.inicial === true || w.inicial === 'true' || w.inicial === 1)
// //                 );

// //                 layoutArmado = widgetsInicialesBd.map((w: any, index: number) => {
// //                     // Les asignamos un ID temporal para Gridster
// //                     const tempId = uuidv4();

// //                     // Calculamos coordenadas automáticas básicas si no tienen (1 fila, n columnas)
// //                     const posX = w.pos_x !== undefined ? w.pos_x : (index * 4) % 12;
// //                     const posY = w.pos_y !== undefined ? w.pos_y : Math.floor((index * 4) / 12) * 3;

// //                     return {
// //                         ...w,
// //                         type: w.codigoWidget || w.codigo_widget,
// //                         codigoWidget: w.codigoWidget || w.codigo_widget,
// //                         cols: w.defaultCols || w.cols_defecto || 4,
// //                         rows: w.defaultRows || w.rows_defecto || 3,
// //                         x: posX,
// //                         y: posY,
// //                         visible: true,
// //                         pestana: pestana,
// //                         version: w.layoutVersion || 1,
// //                         codigoLayout: tempId // ID Temporal antes del primer guardado
// //                     };
// //                 });
// //             }

// //             // Filtramos posibles widgets "huérfanos" (que estaban en la BD pero ya no existen en el catálogo maestro)
// //             return layoutArmado.filter(w => w !== undefined && w.type !== undefined);

// //         } catch (error) {
// //             console.error("Error crítico obteniendo layout base:", error);
// //             return [];
// //         }
// //     }

// //     gestionarLayout(widgetsInicialesBd: any[]) {
// //         let items: PTLLayoutModel[] = [];
// //         widgetsInicialesBd.map(widget => {
// //             const itemLayout: PTLLayoutModel = {
// //                 codigoLayout: uuidv4(),
// //                 codigoPestana: this.pestanaActiva,
// //                 codigoWidget: widget.codigoWidget,
// //                 codigoUsuario: this.usuarioId,
// //                 cols: widget.defaultCols,
// //                 rows: widget.defaultRows,
// //                 posicion_x: widget.pos_x,
// //                 posicion_y: widget.pos_y,
// //                 config: '',
// //                 codigoUsuarioCreacion: this.usuarioId,
// //                 fechaCreacion: new Date().toISOString(),
// //                 codigoUsuarioModificacion: this.usuarioId,
// //                 fechaModificacion: new Date().toISOString()
// //             }
// //             items.push(itemLayout);
// //         })

// //         console.log('items del layout', items);
// //         this.layout = items;
// //         const navSettings = this._localStoragoService.getNavSettingsLocalStorage();
// //         navSettings.layout = widgetsInicialesBd;
// //         this._localStoragoService.setNavSettingsLocalStorage(navSettings);
// //         this._layoutService.postCrearLayout(items).subscribe((dat: any) => {
// //             console.log('una mierda', dat);
// //         });
// //     }

// //     async cambiarPestana(nuevaPestana: string) {
// //         this.sincronizarDashboardAMaestro();

// //         if (this.hayCambiosSinGuardar) {
// //             this.guardarConfiguracionTablero();
// //         }

// //         const widgetsInicialesBd = this.lsWidgets.filter((w: any) =>
// //             w.codigoPestana === nuevaPestana && (w.inicial === true || w.inicial === 'true' || w.inicial === 1)
// //         );

// //         this.pestanaActiva = nuevaPestana;
// //         const current = this._localStoragoService.getCurrentUserLocalStorage();
// //         current.pestanaActiva = nuevaPestana;
// //         this._localStoragoService.setCurrentUserLocalStorage(current);

// //         this.gestionarLayout(widgetsInicialesBd);
// //         this.filtrarWidgetsParaLobby(nuevaPestana);
// //         this.renderizarLayoutDesdeCache(nuevaPestana);
// //     }

// //     sincronizarDashboardAMaestro() {
// //         if (!this.dashboard || this.dashboard.length === 0) return;

// //         this.dashboard.forEach(widgetEnPantalla => {
// //             const index = this.lsLayout.findIndex(l => l.type === widgetEnPantalla.type);
// //             if (index !== -1) {
// //                 this.lsLayout[index] = { ...this.lsLayout[index], ...widgetEnPantalla };
// //             } else {
// //                 this.lsLayout.push({ ...widgetEnPantalla });
// //             }
// //         });
// //     }

// //     renderizarLayoutDesdeCache(codigoDashboard: string) {
// //         this.cargando = true;
// //         this.dashboard = [];
// //         this.options.gridType = codigoDashboard.includes('MAPA') ? GridType.Fit : GridType.ScrollVertical;

// //         if (this.options.api && this.options.api.optionsChanged) this.options.api.optionsChanged();
// //         this.cdr.detectChanges();

// //         if (codigoDashboard.includes('MARITIMO')) {
// //             this.sincronizarTorreMaritima(this.puertoSeleccionado);
// //         } else if (codigoDashboard.includes('VIRTUAL_GATE')) {
// //             this.sincronizarVirtualGate(this.puertoSeleccionado);
// //         } else if (codigoDashboard.includes('CONTENEDORES')) {
// //             this.sincronizarContenedores(this.puertoSeleccionado);
// //         } else if (codigoDashboard.includes('MAPA')) {
// //             const layoutBase = this.obtenerLayoutBase(codigoDashboard);
// //             this.dashboard = [...layoutBase];
// //             this._stateService.inyectarDatosVivos(this.puertoSeleccionado, this.dashboard);
// //             this.finalizarRenderizado();
// //         } else {
// //             this.dashboard = this.obtenerLayoutBase(codigoDashboard);
// //             this.finalizarRenderizado();
// //         }
// //     }

// //     sincronizarTorreMaritima(puerto: string) {
// //         this._maritimoService.obtenerResumenOperativo(puerto).subscribe({
// //             next: (res: any) => {
// //                 if (res && res.success && res.data) {
// //                     const terminales = res.data.WDG_TERMINALES || [];
// //                     const layoutBase = this.obtenerLayoutBase(this.pestanaActiva);

// //                     let layoutArmado = construirLayoutMaritimo(layoutBase, terminales);

// //                     const kpisDataOficial = [
// //                         {
// //                             titulo: 'CAMIONES EN OPERACION',
// //                             valor: res.data.camionesPuerto || '937',
// //                             subtitulo: 'ZONA URBANA BUENAVENTURA',
// //                             colorBorde: 'borde-cyan'
// //                         },
// //                         {
// //                             titulo: 'CONTENEDORES DÍA',
// //                             valor: res.data.contenedoresDia || '2.200',
// //                             subtitulo: 'FCL 2.200 · LCL 0 · Reefer 0',
// //                             colorBorde: 'borde-amarillo'
// //                         },
// //                         {
// //                             titulo: 'GRANEL - TONS DÍA',
// //                             valor: res.data.granelTons || '1.8K',
// //                             subtitulo: 'Agrícola 35.2K · Mineral 0 · Líquido 17.6K',
// //                             colorBorde: 'borde-naranja'
// //                         },
// //                         {
// //                             titulo: 'CARGA SUELTA - TM',
// //                             valor: res.data.cargaSuelta || '293',
// //                             subtitulo: 'Break-bulk 293 · Project 0 · Paletizada 0',
// //                             colorBorde: 'borde-green'
// //                         },
// //                         {
// //                             titulo: 'VEHÍCULOS RO-RO',
// //                             valor: res.data.vehiculosRoro || '147',
// //                             subtitulo: 'Imp 147 · Exp 0 · PDI 95% ocupado',
// //                             colorBorde: 'borde-teal'
// //                         },
// //                         {
// //                             titulo: 'SATURACIÓN BODEGAS',
// //                             valor: res.data.saturacionBodegas || '72%',
// //                             subtitulo: '8 bodegas · 2 críticas · ruteo activo',
// //                             colorBorde: 'borde-purple'
// //                         }
// //                     ];

// //                     const kpisEnFilaCero = layoutArmado
// //                         .filter((w: any) => w.y === 0 || (w.type || '').toUpperCase().includes('KPI'))
// //                         .sort((a, b) => (a.x || 0) - (b.x || 0));

// //                     kpisEnFilaCero.forEach((kpiItem, index) => {
// //                         if (kpisDataOficial[index]) {
// //                             kpiItem.data = { ...(kpiItem.data || {}), ...kpisDataOficial[index] };
// //                         }
// //                     });

// //                     this.dashboard = layoutArmado.map((widget: any) => {
// //                         if (widget.y === 0 || (widget.type || '').toUpperCase().includes('KPI')) {
// //                             return widget; // Ya los hidratamos limpiamente arriba
// //                         }

// //                         let widgetData = { ...(widget.data || {}) };
// //                         const tipoStr = widget.type || '';
// //                         const tipoLimpio = tipoStr.trim().toUpperCase().replace('WDG_PORT_', '');
// //                         if (res.data[tipoLimpio] || res.data[`WDG_${tipoLimpio}`]) {
// //                             widgetData = { ...widgetData, ...(res.data[tipoLimpio] || res.data[`WDG_${tipoLimpio}`]) };
// //                         }

// //                         return { ...widget, data: widgetData };
// //                     });

// //                     this.finalizarRenderizado();
// //                 }
// //             },
// //             error: (err) => {
// //                 console.error("❌ Error API Marítimo:", err);
// //                 this.finalizarRenderizado();
// //             }
// //         });
// //     }

// //     sincronizarVirtualGate(puerto: string) {
// //         this._virtualGateService.obtenerColaGate().subscribe({
// //             next: (res: any) => {
// //                 if (res && res.data) {
// //                     const layoutBase = this.obtenerLayoutBase(this.pestanaActiva);
// //                     const layoutArmado = construirLayoutEstatico(layoutBase);

// //                     this.dashboard = layoutArmado.map((widget: any) => {
// //                         let widgetData = { ...widget.data, resumen: res.data.resumen, citas: res.data.citas };

// //                         if (widget.type && widget.type.startsWith('WDG_PORT_KPI_')) {
// //                             switch (widget.type) {
// //                                 case 'WDG_PORT_KPI_GATE_OP': widgetData = { titulo: 'CAMIONES EN PUERTO', valor: res.data.resumen.totalCamiones || 0, subtitulo: 'ZONA URBANA BUENAVENTURA', color: '#4dabf7', colorBorde: 'borde-cyan' }; break;
// //                                 case 'WDG_PORT_KPI_GATE_CONT': widgetData = { titulo: 'CONTENEDORES DÍA', valor: res.data.resumen.totalContenedores || '2.847', subtitulo: 'FCL 1.900 · LCL 500 · Reefer 447', color: '#22b8cf', colorBorde: 'borde-amarillo' }; break;
// //                                 case 'WDG_PORT_KPI_GATE_GRANEL': widgetData = { titulo: 'GRANEL - TONS DÍA', valor: '38.4K', subtitulo: 'Agrícola 20K · Mineral 18.4K', color: '#fd7e14', colorBorde: 'borde-rojo' }; break;
// //                                 case 'WDG_PORT_KPI_GATE_SUELTA': widgetData = { titulo: 'CARGA SUELTA - TM', valor: '4.820', subtitulo: 'Break-bulk 3.000 · Paletizada 1.820', color: '#fcc419', colorBorde: 'borde-green' }; break;
// //                                 case 'WDG_PORT_KPI_GATE_RORO': widgetData = { titulo: 'VEHÍCULOS RO-RO', valor: '1.142', subtitulo: 'Imp 800 · Exp 342 · PDI 85%', color: '#20c997', colorBorde: 'borde-fucsia' }; break;
// //                                 case 'WDG_PORT_KPI_GATE_BODEGAS': widgetData = { titulo: 'SATURACIÓN BODEGAS', valor: '72%', subtitulo: '5 bodegas · 1 crítica · ruteo activo', color: '#cc5de8', colorBorde: 'borde-purple' }; break;
// //                                 case 'WDG_PORT_KPI_SUB_CONT': widgetData = { titulo: 'SUB - CONTENEDORES', valor: res.data.resumen.subContenedores || 42, subtitulo: 'Retiros y devoluciones', color: '#868e96', colorBorde: 'borde-naranja' }; break;
// //                                 case 'WDG_PORT_KPI_SUB_GRANEL': widgetData = { titulo: 'SUB - GRANEL', valor: 28, subtitulo: 'Flujo hacia silos', color: '#868e96', colorBorde: 'borde-indigo' }; break;
// //                                 case 'WDG_PORT_KPI_SUB_SUELTA': widgetData = { titulo: 'SUB - CARGA SUELTA', valor: 11, subtitulo: 'Operación en bodega', color: '#868e96', colorBorde: 'borde-purple' }; break;
// //                                 case 'WDG_PORT_KPI_SUB_NINERAS': widgetData = { titulo: 'SUB - NIÑERAS', valor: 6, subtitulo: 'Trasiego a patios', color: '#868e96', colorBorde: 'borde-cyan' }; break;
// //                             }
// //                         }
// //                         return { ...widget, data: widgetData };
// //                     });
// //                 }
// //                 this.finalizarRenderizado();
// //             },
// //             error: (err) => {
// //                 console.error("❌ Error API Virtual Gate:", err);
// //                 this.finalizarRenderizado();
// //             }
// //         });
// //     }

// //     sincronizarContenedores(puerto: string) {
// //         this._contenedoresService.obtenerDashboardContenedores().subscribe({
// //             next: (res: any) => {
// //                 if (res && res.data) {
// //                     const layoutBase = this.obtenerLayoutBase(this.pestanaActiva);
// //                     const layoutArmado = construirLayoutEstatico(layoutBase);

// //                     this.dashboard = layoutArmado.map((widget: any) => {
// //                         let widgetData = { ...widget.data };
// //                         switch (widget.type) {
// //                             case 'WDG_PORT_KPI_CONT_CARGADOS': widgetData = { titulo: 'CARGADOS PENDIENTES', valor: res.data.kpis?.cargadosPendientes?.valor, subtitulo: res.data.kpis?.cargadosPendientes?.subtitulo, color: res.data.kpis?.cargadosPendientes?.color, colorBorde: 'borde-cyan' }; break;
// //                             case 'WDG_PORT_KPI_CONT_VACIOS': widgetData = { titulo: 'VACÍOS POR DEVOLVER', valor: res.data.kpis?.vaciosDevolver?.valor, subtitulo: res.data.kpis?.vaciosDevolver?.subtitulo, color: res.data.kpis?.vaciosDevolver?.color, colorBorde: 'borde-naranja' }; break;
// //                             case 'WDG_PORT_KPI_CONT_REEFER': widgetData = { titulo: 'REEFER ACTIVOS', valor: res.data.kpis?.reeferActivos?.valor, subtitulo: res.data.kpis?.reeferActivos?.subtitulo, color: res.data.kpis?.reeferActivos?.color, colorBorde: 'borde-teal' }; break;
// //                             case 'WDG_PORT_KPI_CONT_FREETIME': widgetData = { titulo: 'FREE TIME VENCIDO', valor: res.data.kpis?.freeTimeVencido?.valor, subtitulo: res.data.kpis?.freeTimeVencido?.subtitulo, color: res.data.kpis?.freeTimeVencido?.color, colorBorde: 'borde-blue' }; break;
// //                             case 'WDG_PORT_CONT_RETIROS': widgetData = res.data.retirosPriorizacion; break;
// //                             case 'WDG_PORT_CONT_NAVIERA': widgetData = res.data.vaciosNaviera; break;
// //                             case 'WDG_PORT_CONT_PATIOS': widgetData = res.data.saturacionPatios; break;
// //                             case 'WDG_PORT_CONT_FREETIME_CHART': widgetData = res.data.freeTimeDistribucion; break;
// //                             case 'WDG_PORT_CONT_TABLA': widgetData = res.data.movimientos; break;
// //                         }
// //                         return { ...widget, data: widgetData };
// //                     });
// //                 }
// //                 this.finalizarRenderizado();
// //             },
// //             error: (err) => {
// //                 console.error("❌ Error API Contenedores:", err);
// //                 this.finalizarRenderizado();
// //             }
// //         });
// //     }

// //     private _hidratarWidgetsConDatos(layoutOriginal: any[], dataReal: any): any[] {
// //         return layoutOriginal.map(widget => {
// //             const tipoStr = widget.type || '';
// //             const tipoLimpio = tipoStr.trim().toUpperCase().replace('WDG_PORT_', '');

// //             if (dataReal[tipoLimpio] || dataReal[`WDG_${tipoLimpio}`]) {
// //                 return {
// //                     ...widget,
// //                     data: {
// //                         ...(widget.data || {}),
// //                         ...(dataReal[tipoLimpio] || dataReal[`WDG_${tipoLimpio}`])
// //                     }
// //                 };
// //             }
// //             return widget;
// //         });
// //     }

// //     private finalizarRenderizado() {
// //         this.cargando = false;
// //         this.isLoading = false;
// //         if (this.options.api && this.options.api.optionsChanged) this.options.api.optionsChanged();
// //         this.cdr.detectChanges();
// //     }

// //     async cargarDatosDelPuerto(nuevoPuerto: any) {
// //         const puertoLimpio = nuevoPuerto?.target?.value || nuevoPuerto?.id || nuevoPuerto;
// //         this.puertoSeleccionado = puertoLimpio;

// //         if (this.options.api && this.options.api.optionsChanged) {
// //             this.options.draggable!.enabled = false;
// //             this.options.resizable!.enabled = false;
// //         }
// //         this.renderizarLayoutDesdeCache(this.pestanaActiva);
// //     }

// //     toggleBloqueoTablero() {
// //         this.tableroBloqueado = !this.tableroBloqueado;
// //         if (this.options.draggable && this.options.resizable) {
// //             this.options.draggable.enabled = !this.tableroBloqueado;
// //             this.options.resizable.enabled = !this.tableroBloqueado;
// //             this.options.api?.optionsChanged?.();
// //         }
// //         if (this.tableroBloqueado && this.hayCambiosSinGuardar) {
// //             this.guardarConfiguracionTablero();
// //         }
// //     }

// //     guardarConfiguracionTablero() {
// //         if (!this.dashboard || this.dashboard.length === 0) return;
// //         const usuario = this.usuarioId || 'SISTEMA_DEFAULT';
// //         const widgetsAguardar = this.dashboard.filter(w => w.type !== 'BORRAR_ME' && !w.type.includes('FANTASMA'));
// //         const layoutPayload: PTLLayoutModel[] = widgetsAguardar.map(itemGridster => {
// //             const itemLayout = new PTLLayoutModel();
// //             itemLayout.codigoLayout = uuidv4();
// //             itemLayout.codigoUsuario = usuario;
// //             itemLayout.codigoPestana = this.pestanaActiva;
// //             itemLayout.codigoWidget = itemGridster.type;
// //             itemLayout.posicion_x = itemGridster.x;
// //             itemLayout.posicion_y = itemGridster.y;
// //             itemLayout.cols = itemGridster.cols;
// //             itemLayout.rows = itemGridster.rows;
// //             itemLayout.config = itemGridster.data ? JSON.stringify(itemGridster.data) : null;
// //             itemLayout.codigoUsuarioCreacion = usuario;
// //             itemLayout.fechaCreacion = new Date().toISOString();
// //             itemLayout.codigoUsuarioModificacion = usuario;
// //             itemLayout.fechaModificacion = new Date().toISOString()

// //             return itemLayout;
// //         });

// //         const navSettings = this._localStoragoService.getNavSettingsLocalStorage();
// //         navSettings.layout = layoutPayload;
// //         this._localStoragoService.setNavSettingsLocalStorage(navSettings);
// //         console.log('Payload limpio y homologado para el backend:', layoutPayload);

// //         this._layoutService.postCrearLayout(layoutPayload).subscribe({
// //             next: (res: any) => {
// //                 console.log('✅ Layout guardado exitosamente en BD', res);
// //                 this.hayCambiosSinGuardar = false;
// //             },
// //             error: (err: any) => {
// //                 console.error('❌ Error al persistir el layout', err);
// //             }
// //         });
// //     }

// //     cerrarModalEnfoque() {
// //         this.widgetEnfoque = null;
// //         this._torreService.cerrarModoEnfoque();
// //     }

// //     inyectarNuevoWidgetAlTablero(widgetCatalogo: any) {
// //         this.dashboard.push({
// //             codigoWidget: `WDG_CUSTOM_${new Date().getTime()}`, type: widgetCatalogo.codigoWidget,
// //             cols: widgetCatalogo.defaultCols || 4, rows: widgetCatalogo.defaultRows || 3, x: 0, y: 0, data: null
// //         });
// //         if (this.options.api && this.options.api.optionsChanged) this.options.api.optionsChanged();

// //         this.renderizarLayoutDesdeCache(this.pestanaActiva);
// //         this.hayCambiosSinGuardar = true;
// //     }

// //     // actualizarWidgetDesdeLobby(evento: { codigoWidget: string, seleccionado: boolean }) {
// //     //     const { codigoWidget, seleccionado } = evento;
// //     //     const indexLayout = this.lsLayout.findIndex(l => l.type === codigoWidget || l.codigoWidget === codigoWidget);

// //     //     if (indexLayout !== -1) {
// //     //         this.lsLayout[indexLayout].visible = seleccionado;
// //     //         if (seleccionado) {
// //     //             if (this.lsLayout[indexLayout].x === undefined || (this.lsLayout[indexLayout].x === 0 && this.lsLayout[indexLayout].y === 0)) {
// //     //                 this.asignarPosicionLibre(this.lsLayout[indexLayout]);
// //     //             }
// //     //         }
// //     //     } else if (seleccionado) {
// //     //         const widgetMaster = this.lsWidgets.find((w: any) => (w.codigoWidget || w.codigo_widget) === codigoWidget) as any;
// //     //         if (widgetMaster) {
// //     //             const nuevoItem = {
// //     //                 type: widgetMaster.codigoWidget || widgetMaster.codigo_widget,
// //     //                 cols: widgetMaster.defaultCols || widgetMaster.cols_defecto || 4,
// //     //                 rows: widgetMaster.defaultRows || widgetMaster.rows_defecto || 3,
// //     //                 x: 0, y: 0,
// //     //                 pestana: this.pestanaActiva,
// //     //                 visible: true,
// //     //                 data: { tipo: widgetMaster.tipo || widgetMaster.categoria },
// //     //                 version: widgetMaster.layoutVersion || 1
// //     //             };
// //     //             this.asignarPosicionLibre(nuevoItem);
// //     //             this.lsLayout.push(nuevoItem);
// //     //         }
// //     //     }

// //     //     // Renderizamos con las nuevas visibilidades
// //     //     this.renderizarLayoutDesdeCache(this.pestanaActiva);
// //     //     this.hayCambiosSinGuardar = true;
// //     // }
// //     actualizarWidgetDesdeLobby(evento: { codigoWidget: string, seleccionado: boolean }) {
// //         const { codigoWidget, seleccionado } = evento;

// //         if (seleccionado) {
// //             // 🟢 ACCIÓN: AGREGAR WIDGET (Instantáneo)
// //             // Verificamos si ya existe en pantalla para no duplicarlo
// //             const existeEnPantalla = this.dashboard.find(w => w.type === codigoWidget || (w as any).codigoWidget === codigoWidget);

// //             if (!existeEnPantalla) {
// //                 // Buscamos la configuración base en el catálogo
// //                 const widgetMaster = this.lsWidgets.find((w: any) => (w.codigoWidget || w.codigo_widget) === codigoWidget) as any;

// //                 if (widgetMaster) {
// //                     const nuevoItem: any = {
// //                         type: widgetMaster.codigoWidget || widgetMaster.codigo_widget,
// //                         codigoWidget: widgetMaster.codigoWidget || widgetMaster.codigo_widget,
// //                         cols: widgetMaster.defaultCols || widgetMaster.cols_defecto || 4,
// //                         rows: widgetMaster.defaultRows || widgetMaster.rows_defecto || 3,
// //                         x: 0, y: 0,
// //                         data: { tipo: widgetMaster.tipo || widgetMaster.categoria }
// //                     };

// //                     // Le buscamos un hueco en la grilla y lo metemos directamente al array visual
// //                     this.asignarPosicionLibre(nuevoItem);
// //                     this.dashboard.push(nuevoItem);
// //                 }
// //             }
// //         } else {
// //             // 🔴 ACCIÓN: QUITAR WIDGET (Instantáneo)
// //             const index = this.dashboard.findIndex(w => w.type === codigoWidget || (w as any).codigoWidget === codigoWidget);
// //             if (index !== -1) {
// //                 // Lo eliminamos directamente del array visual
// //                 this.dashboard.splice(index, 1);
// //             }
// //         }

// //         // ⚡ SINCRONIZACIÓN REACTIVA (La Magia)
// //         // Le avisamos a Gridster que hubo un cambio en el array
// //         if (this.options.api && this.options.api.optionsChanged) {
// //             this.options.api.optionsChanged();
// //         }

// //         // Forzamos la actualización de Angular sin recargar datos
// //         this.cdr.detectChanges();
// //         this.hayCambiosSinGuardar = true;
// //     }

// //     asignarPosicionLibre(item: any) {
// //         if (this.options && this.options.api && typeof (this.options.api as any).getNextPossiblePosition === 'function') {
// //             const posLibre = (this.options.api as any).getNextPossiblePosition(item);
// //             if (posLibre) {
// //                 item.x = posLibre.x;
// //                 item.y = posLibre.y;
// //                 return;
// //             }
// //         }
// //         const totalItems = this.dashboard.length;
// //         item.x = (totalItems * 4) % 12;
// //         item.y = Math.floor((totalItems * 4) / 12) * 3;
// //     }

// //     trackByWidget(index: number, widget: any): string {
// //         // Primero busca idClon (para terminales repetidos), si no, usa el código normal
// //         return widget.idClon || widget.codigoWidget || widget.type;
// //     }

// //     abrirLobbyModal() {
// //         this.filtrarWidgetsParaLobby(this.pestanaActiva);
// //         this.mostrarLobby = true;
// //         this.cdr.detectChanges();
// //     }

// //     filtrarWidgetsParaLobby(nuevaPestana: string) {
// //         this.widgetsParaElLobby = (this.lsWidgets || []).filter((w: any) => {
// //             const estadoValido = w.estadoWidget === true || w.estadoWidget === 'true' || w.estadoWidget === 1;
// //             if (!estadoValido) return false;
// //             return w.codigoPestana === nuevaPestana;
// //         });
// //     }

// //     abrirLobbyPestanas() {
// //         this.mostrarLobbyPestanas = true;
// //         this.cdr.detectChanges();
// //     }

// //     obtenerCodigosVisibles(): string[] {
// //         const settings = this._localStoragoService.getNavSettingsLocalStorage()
// //         return settings.pestanas || [];
// //         //return this.pestanasVisibles.map(p => p.codigoPestana);
// //     }

// //     guardarPreferenciasWidgets(activos: any[]) {
// //         console.log('widgets activos tablero', activos);
// //         this.guardarConfiguracionTablero();
// //         this.cdr.detectChanges();
// //     }

// //     guardarPreferenciasPestanas(codigosSeleccionados: any[]) {
// //         this.pestanasVisibles = codigosSeleccionados
// //             .map(codigo => this.lsPestanas.find(p => p.codigoPestana === codigo.codigoPestana))
// //             .filter(p => p !== undefined);

// //         if (this.pestanasVisibles.length > 0) {
// //             if (!codigosSeleccionados.includes(this.pestanaActiva)) {
// //                 this.cambiarPestana(this.pestanasVisibles[0].codigoPestana);
// //             }
// //         } else {
// //             this.pestanaActiva = '';
// //             this.dashboard = [];
// //         }

// //         this.cdr.detectChanges();
// //         this.persistirEstadoPestanas();
// //     }

// //     onBloqueoClick() {
// //         this.isBloqueado = this.isBloqueado == true ? false : true;
// //         this.toggleBloqueo.emit();
// //     }

// //     async persistirEstadoPestanas() {
// //         const estadoActual = await this._localStoragoService.getNavSettingsLocalStorage() || {};
// //         estadoActual.pestanas = this.obtenerCodigosVisibles();
// //         this._localStoragoService.setNavSettingsLocalStorage(estadoActual);
// //         // if (typeof (this._localStoragoService as any).setTableroLocalStorage === 'function') {
// //         //     (this._localStoragoService as any).setTableroLocalStorage(estadoActual);
// //         // } else {
// //         //     localStorage.setItem('tableroState', JSON.stringify(estadoActual));
// //         // }
// //     }
// // }
// /*
//     Author: German Valencia
//     Pattern: PORTTOS Orchestrator Component - Multi-Tenant (QPLUS Unified)
//     Refactor: Motor de Layouts Dinámico Asíncrono con BD Normalizada
// */
// import { Component, OnInit, OnDestroy, ChangeDetectorRef, EventEmitter, Output } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { TranslateModule } from '@ngx-translate/core';
// import { GridsterConfig, GridsterItem, GridType, GridsterComponent, GridsterItemComponent } from 'angular-gridster2';
// import { Subscription } from 'rxjs';
// import { debounceTime, distinctUntilChanged, filter } from 'rxjs/operators';
// import { v4 as uuidv4 } from 'uuid';

// import { DashboardService } from 'src/app/theme/shared/service/tablero-control/dashboard.service';
// import { TableroStateService } from '../../theme/shared/service/tablero-control/tablero-state.service';
// import { FiltroTableroService } from 'src/app/theme/shared/service/tablero-control/filtro-tablero.service';
// import { PTLWidgetsMaestroService } from 'src/app/theme/shared/service/ptlwidgets-maestro.service';
// import { MaritimoService } from 'src/app/theme/shared/service/tablero-control/maritimo.service';
// import { VirtualGateService } from 'src/app/theme/shared/service/tablero-control/virtual-gate.service';
// import { ContenedoresService } from 'src/app/theme/shared/service/tablero-control/contenedores.service';
// import { LocalStorageService } from 'src/app/theme/shared/service';
// import { PtlpestanasService } from 'src/app/theme/shared/service/ptlpestanas.service';
// import { LayoutService } from 'src/app/theme/shared/service/layout.service';

// import { TcHeaderComponent } from "../widgets/tc-header/tc-header.component";
// import { WidgetSelectorTclComponent } from "../widgets/widget-selector-tcl/widget-selector-tcl.component";
// import { WidgetLobbyTclComponent } from "../widgets/widget-lobby-tcl/widget-lobby-tcl.component";
// import { PestanaLobbyTclComponent } from '../widgets/pestana-lobby-tcl/pestana-lobby-tcl.component';

// import { Widget } from 'src/app/theme/shared/_helpers/models/tablero-control/widget.model';
// import { PTLLayoutModel } from 'src/app/theme/shared/_helpers/models/PTLLayout.model';
// import { construirLayoutEstatico, construirLayoutMaritimo } from '../../theme/shared/_config/tab-layouts.config';

// @Component({
//     selector: 'app-torre-control',
//     standalone: true,
//     imports: [
//         CommonModule,
//         TranslateModule,
//         TcHeaderComponent,
//         GridsterComponent,
//         GridsterItemComponent,
//         WidgetSelectorTclComponent,
//         WidgetLobbyTclComponent,
//         PestanaLobbyTclComponent
//     ],
//     templateUrl: './torre-control.component.html',
//     styleUrls: ['./torre-control.component.scss']
// })
// export class TorreControlComponent implements OnInit, OnDestroy {
//     @Output() toggleBloqueo = new EventEmitter<void>();

//     public options!: GridsterConfig;
//     public dashboard: Array<GridsterItem & { type: string, data: any }> = [];
//     public isLoading: boolean = false;
//     public isOptionBloqueo: boolean = false;
//     public isBloqueado: boolean = false;
//     public cargando: boolean = true;
//     public tableroBloqueado: boolean = true;
//     public widgetEnfoque: { type: string, data: any } | null = null;
//     public hayCambiosSinGuardar: boolean = false;

//     public lsWidgets: Widget[] = [];
//     public lsLayout: any[] = []; // Sincronizado para el Lobby
//     public widgetsParaElLobby: any[] = [];
//     public lsPestanas: any[] = [];
//     public pestanasVisibles: any[] = [];

//     public pestanaActiva: string = '';
//     public puertoSeleccionado: string = 'BUENAVENTURA';
//     public usuarioId: string = '';
//     public mostrarLobby: boolean = false;
//     public mostrarLobbyPestanas: boolean = false;

//     private readonly APP_PORTTOS_ID = '3eb98a9f-cc5d-417d-95ea-a2b8abc3b5fa';
//     private subs: Subscription = new Subscription();

//     constructor(
//         private _stateService: TableroStateService,
//         private _torreService: DashboardService,
//         private _maritimoService: MaritimoService,
//         private _virtualGateService: VirtualGateService,
//         private _contenedoresService: ContenedoresService,
//         private _filtroService: FiltroTableroService,
//         private _widgetsService: PTLWidgetsMaestroService,
//         private _localStoragoService: LocalStorageService,
//         private _layoutService: LayoutService,
//         private _pestanasService: PtlpestanasService,
//         private cdr: ChangeDetectorRef
//     ) { }

//     async ngOnInit() {
//         this.iniciarConfiguracionGridster();

//         const current = this._localStoragoService.getCurrentUserLocalStorage();
//         const navSetttings = this._localStoragoService.getNavSettingsLocalStorage();

//         this.lsLayout = navSetttings.layout || [];
//         this.usuarioId = current?.usuario?.codigoUsuario || 'SISTEMA_DEFAULT';

//         const codigoSuite = navSetttings.suite?.codigoSuite || 'a815687f-b9b6-4404-83dd-9a4074224320';
//         const codigoAplicacion = navSetttings.aplicacion?.codigoAplicacion || this.APP_PORTTOS_ID;

//         this._pestanasService.obtenerPestanasDelContexto(codigoSuite, codigoAplicacion).subscribe(async (res: any) => {
//             if (res.success && res.data && res.data.length > 0) {
//                 this.lsPestanas = res.data;
//                 const preferencias = this._localStoragoService.getNavSettingsLocalStorage();
//                 const pestaActivasUsuario = preferencias.pestanas || [];

//                 // 1. Limpiamos y mapeamos correctamente, soportando strings o un objetos corruptos
//                 if (pestaActivasUsuario.length > 0) {
//                     this.pestanasVisibles = pestaActivasUsuario
//                         .map((codigo: any) => {
//                             const codStr = typeof codigo === 'string' ? codigo : codigo?.codigoPestana;
//                             return this.lsPestanas.find(p => p.codigoPestana === codStr);
//                         })
//                         .filter((p: any) => p !== undefined);
//                 }

//                 // 2. 🚨 ESCUDO ANTI-CRASH: Si la caché estaba rota y quedó vacío, forzamos las 3 primeras
//                 if (!this.pestanasVisibles || this.pestanasVisibles.length === 0) {
//                     this.pestanasVisibles = this.lsPestanas.slice(0, 3);
//                 }

//                 // Guardamos los códigos limpios en caché
//                 preferencias.pestanas = this.pestanasVisibles.map(p => p.codigoPestana);
//                 this._localStoragoService.setNavSettingsLocalStorage(preferencias);

//                 // 3. Seleccionamos la pestaña activa con seguridad
//                 const pestanaGuardada = current?.pestanaActiva || preferencias.pestanas[0];
//                 const existePestana = this.pestanasVisibles.find(p => p.codigoPestana === pestanaGuardada);
//                 this.pestanaActiva = existePestana ? pestanaGuardada : this.pestanasVisibles[0].codigoPestana;

//                 current.pestanaActiva = this.pestanaActiva;
//                 this._localStoragoService.setCurrentUserLocalStorage(current);

//                 this.cargarCatalogoWidgetsYRenderizar();
//             }
//         });

//         this.subs.add(
//             this._filtroService.ciudad$.pipe(
//                 distinctUntilChanged(),
//                 debounceTime(300),
//                 filter(puerto => !!puerto)
//             ).subscribe(async (puerto: any) => {
//                 const puertoStr = typeof puerto === 'string' ? puerto : (puerto.id_puerto || puerto.id || 'BUENAVENTURA');
//                 this.puertoSeleccionado = puertoStr;
//                 this.renderizarLayoutDesdeCache(this.pestanaActiva);
//             })
//         );

//         this.subs.add(this._torreService.widgetFocus$.subscribe(widget => {
//             this.widgetEnfoque = widget;
//             this.cdr.detectChanges();
//         }));
//     }

//     ngOnDestroy() {
//         this.subs.unsubscribe();
//     }

//     obtenerIconoPestana(codigoPestana: string): string {
//         const diccionarioIconos: { [key: string]: string } = {
//             'TLC_MARITIMO_001': 'fas fa-ship text-info',
//             'TLC_VIRTUAL_GATE_001': 'fas fa-truck text-warning',
//             'TLC_CONTENEDORES_001': 'fas fa-box text-success',
//             'TLC_MAPA_001': 'fas fa-map-marked-alt text-danger',
//             'TLC_NOTICIAS_001': 'fas fa-newspaper text-primary'
//         };
//         return diccionarioIconos[codigoPestana] || 'fas fa-th-large text-secondary';
//     }

//     cargarCatalogoWidgetsYRenderizar() {
//         this.lsWidgets = this._widgetsService.getWidgetsActuales() || [];
//         this.cambiarPestana(this.pestanaActiva);
//     }

//     iniciarConfiguracionGridster() {
//         this.options = {
//             gridType: GridType.ScrollVertical,
//             margin: 16, outerMargin: false,
//             minCols: 12, maxCols: 12, minRows: 1, maxRows: 100, fixedRowHeight: 160,
//             pushItems: false, swap: false, compactType: 'none',
//             defaultItemCols: 4, defaultItemRows: 3, displayGrid: 'onDrag&Resize',
//             draggable: { enabled: !this.tableroBloqueado },
//             resizable: { enabled: !this.tableroBloqueado }, outerMarginRight: 0,
//             mobileBreakpoint: 960, keepFixedHeightInMobile: true,
//             itemResizeCallback: () => { this.hayCambiosSinGuardar = true; },
//             itemChangeCallback: () => { this.hayCambiosSinGuardar = true; }
//         };
//     }

//     // ==========================================
//     // NUCLEO: OBTENER LAYOUT (ASÍNCRONO DESDE BD)
//     // ==========================================
//     async obtenerLayoutBase(pestana: string): Promise<any[]> {
//         this.pestanaActiva = pestana;
//         let layoutArmado: any[] = [];
//         const usuario = this.usuarioId || 'SISTEMA_DEFAULT';

//         try {
//             const layoutDesdeBD: PTLLayoutModel[] = await this._layoutService
//                 .cargarRegistrosUsuarioPestana(usuario, pestana)
//                 .toPromise() || [];

//             if (layoutDesdeBD.length > 0) {
//                 // ESCENARIO A: Layout existente en BD
//                 layoutArmado = layoutDesdeBD.map(itemDB => {
//                     const widgetMaster = this.lsWidgets.find(w => (w as any).codigoWidget === itemDB.codigoWidget);
//                     let configData = null;
//                     if (itemDB.config) {
//                         try {
//                             configData = typeof itemDB.config === 'string' ? JSON.parse(itemDB.config) : itemDB.config;
//                         } catch (e) { }
//                     }

//                     return {
//                         ...widgetMaster,
//                         type: itemDB.codigoWidget,
//                         codigoWidget: itemDB.codigoWidget,
//                         cols: itemDB.cols,
//                         rows: itemDB.rows,
//                         x: itemDB.posicion_x,
//                         y: itemDB.posicion_y,
//                         visible: true,
//                         pestana: pestana,
//                         data: configData || (widgetMaster ? (widgetMaster as any).data : null)
//                     };
//                 });
//             } else {
//                 // ESCENARIO B: Carga por defecto del catálogo
//                 const widgetsInicialesBd = this.lsWidgets.filter((w: any) =>
//                     w.codigoPestana === pestana && (w.inicial === true || w.inicial === 'true' || w.inicial === 1)
//                 );

//                 layoutArmado = widgetsInicialesBd.map((w: any, index: number) => {
//                     const posX = w.pos_x !== undefined ? w.pos_x : (index * 4) % 12;
//                     const posY = w.pos_y !== undefined ? w.pos_y : Math.floor((index * 4) / 12) * 3;
//                     return {
//                         ...w,
//                         type: w.codigoWidget || w.codigo_widget,
//                         codigoWidget: w.codigoWidget || w.codigo_widget,
//                         cols: w.defaultCols || w.cols_defecto || 4,
//                         rows: w.defaultRows || w.rows_defecto || 3,
//                         x: posX,
//                         y: posY,
//                         visible: true,
//                         pestana: pestana,
//                         codigoLayout: uuidv4()
//                     };
//                 });
//             }

//             // 🚨 EL FIX ANTI-DUPLICADOS (Limpia la basura de la BD)
//             // 1. Quita los nulos o huérfanos
//             const layoutLimpio = layoutArmado.filter(w => w !== undefined && w.type !== undefined);

//             // 2. Si encuentra dos widgets con el mismo código, se queda solo con el primero
//             const layoutSinDuplicados = layoutLimpio.filter((widget, index, self) =>
//                 index === self.findIndex((w) => w.type === widget.type)
//             );

//             // Sincronizamos para el Lobby
//             this.lsLayout = [...layoutSinDuplicados];
//             return layoutSinDuplicados;

//         } catch (error) {
//             console.error("Error obteniendo layout base:", error);
//             return [];
//         }
//     }

//     async cambiarPestana(nuevaPestana: string) {
//         if (this.hayCambiosSinGuardar) {
//             this.guardarConfiguracionTablero();
//         }

//         this.pestanaActiva = nuevaPestana;
//         const current = this._localStoragoService.getCurrentUserLocalStorage();
//         current.pestanaActiva = nuevaPestana;
//         this._localStoragoService.setCurrentUserLocalStorage(current);

//         this.filtrarWidgetsParaLobby(nuevaPestana);
//         await this.renderizarLayoutDesdeCache(nuevaPestana);
//     }

//     // ==========================================
//     // RENDERIZADO Y SINCRONIZACIÓN DE SERVICIOS
//     // ==========================================
//     async renderizarLayoutDesdeCache(codigoDashboard: string) {
//         this.cargando = true;
//         this.dashboard = [];
//         this.options.gridType = codigoDashboard.includes('MAPA') ? GridType.Fit : GridType.ScrollVertical;

//         if (this.options.api && this.options.api.optionsChanged) this.options.api.optionsChanged();
//         this.cdr.detectChanges();

//         if (codigoDashboard.includes('MARITIMO')) {
//             this.sincronizarTorreMaritima(this.puertoSeleccionado);
//         } else if (codigoDashboard.includes('VIRTUAL_GATE')) {
//             this.sincronizarVirtualGate(this.puertoSeleccionado);
//         } else if (codigoDashboard.includes('CONTENEDORES')) {
//             this.sincronizarContenedores(this.puertoSeleccionado);
//         } else if (codigoDashboard.includes('MAPA')) {
//             const layoutBase = await this.obtenerLayoutBase(codigoDashboard);
//             this.dashboard = [...layoutBase];
//             this._stateService.inyectarDatosVivos(this.puertoSeleccionado, this.dashboard);
//             this.finalizarRenderizado();
//         } else {
//             this.dashboard = await this.obtenerLayoutBase(codigoDashboard);
//             this.finalizarRenderizado();
//         }
//     }

//     sincronizarTorreMaritima(puerto: string) {
//         this._maritimoService.obtenerResumenOperativo(puerto).subscribe({
//             next: async (res: any) => {
//                 if (res && res.success && res.data) {
//                     const terminales = res.data.WDG_TERMINALES || [];
//                     const layoutBase = await this.obtenerLayoutBase(this.pestanaActiva);
//                     let layoutArmado = construirLayoutMaritimo(layoutBase, terminales);

//                     const kpisDataOficial = [
//                         { titulo: 'CAMIONES EN OPERACION', valor: res.data.camionesPuerto || '937', subtitulo: 'ZONA URBANA BUENAVENTURA', colorBorde: 'borde-cyan' },
//                         { titulo: 'CONTENEDORES DÍA', valor: res.data.contenedoresDia || '2.200', subtitulo: 'FCL 2.200 · LCL 0 · Reefer 0', colorBorde: 'borde-amarillo' },
//                         { titulo: 'GRANEL - TONS DÍA', valor: res.data.granelTons || '1.8K', subtitulo: 'Agrícola 35.2K · Mineral 0 · Líquido 17.6K', colorBorde: 'borde-naranja' },
//                         { titulo: 'CARGA SUELTA - TM', valor: res.data.cargaSuelta || '293', subtitulo: 'Break-bulk 293 · Project 0 · Paletizada 0', colorBorde: 'borde-green' },
//                         { titulo: 'VEHÍCULOS RO-RO', valor: res.data.vehiculosRoro || '147', subtitulo: 'Imp 147 · Exp 0 · PDI 95% ocupado', colorBorde: 'borde-teal' },
//                         { titulo: 'SATURACIÓN BODEGAS', valor: res.data.saturacionBodegas || '72%', subtitulo: '8 bodegas · 2 críticas · ruteo activo', colorBorde: 'borde-purple' }
//                     ];

//                     const kpisEnFilaCero = layoutArmado
//                         .filter((w: any) => w.y === 0 || (w.type || '').toUpperCase().includes('KPI'))
//                         .sort((a, b) => (a.x || 0) - (b.x || 0));

//                     kpisEnFilaCero.forEach((kpiItem, index) => {
//                         if (kpisDataOficial[index]) {
//                             kpiItem.data = { ...(kpiItem.data || {}), ...kpisDataOficial[index] };
//                         }
//                     });

//                     this.dashboard = layoutArmado.map((widget: any) => {
//                         if (widget.y === 0 || (widget.type || '').toUpperCase().includes('KPI')) return widget;

//                         let widgetData = { ...(widget.data || {}) };
//                         const tipoLimpio = (widget.type || '').trim().toUpperCase().replace('WDG_PORT_', '');
//                         if (res.data[tipoLimpio] || res.data[`WDG_${tipoLimpio}`]) {
//                             widgetData = { ...widgetData, ...(res.data[tipoLimpio] || res.data[`WDG_${tipoLimpio}`]) };
//                         }

//                         return { ...widget, data: widgetData };
//                     });

//                     this.finalizarRenderizado();
//                 }
//             },
//             error: (err) => {
//                 console.error("❌ Error API Marítimo:", err);
//                 this.finalizarRenderizado();
//             }
//         });
//     }

//     sincronizarVirtualGate(puerto: string) {
//         this._virtualGateService.obtenerColaGate().subscribe({
//             next: async (res: any) => {
//                 if (res && res.data) {
//                     const layoutBase = await this.obtenerLayoutBase(this.pestanaActiva);
//                     const layoutArmado = construirLayoutEstatico(layoutBase);

//                     this.dashboard = layoutArmado.map((widget: any) => {
//                         let widgetData = { ...widget.data, resumen: res.data.resumen, citas: res.data.citas };
//                         if (widget.type && widget.type.startsWith('WDG_PORT_KPI_')) {
//                             switch (widget.type) {
//                                 case 'WDG_PORT_KPI_GATE_OP': widgetData = { titulo: 'CAMIONES EN PUERTO', valor: res.data.resumen.totalCamiones || 0, subtitulo: 'ZONA URBANA BUENAVENTURA', color: '#4dabf7', colorBorde: 'borde-cyan' }; break;
//                                 case 'WDG_PORT_KPI_GATE_CONT': widgetData = { titulo: 'CONTENEDORES DÍA', valor: res.data.resumen.totalContenedores || '2.847', subtitulo: 'FCL 1.900 · LCL 500 · Reefer 447', color: '#22b8cf', colorBorde: 'borde-amarillo' }; break;
//                                 case 'WDG_PORT_KPI_GATE_GRANEL': widgetData = { titulo: 'GRANEL - TONS DÍA', valor: '38.4K', subtitulo: 'Agrícola 20K · Mineral 18.4K', color: '#fd7e14', colorBorde: 'borde-rojo' }; break;
//                                 case 'WDG_PORT_KPI_GATE_SUELTA': widgetData = { titulo: 'CARGA SUELTA - TM', valor: '4.820', subtitulo: 'Break-bulk 3.000 · Paletizada 1.820', color: '#fcc419', colorBorde: 'borde-green' }; break;
//                                 case 'WDG_PORT_KPI_GATE_RORO': widgetData = { titulo: 'VEHÍCULOS RO-RO', valor: '1.142', subtitulo: 'Imp 800 · Exp 342 · PDI 85%', color: '#20c997', colorBorde: 'borde-fucsia' }; break;
//                                 case 'WDG_PORT_KPI_GATE_BODEGAS': widgetData = { titulo: 'SATURACIÓN BODEGAS', valor: '72%', subtitulo: '5 bodegas · 1 crítica · ruteo activo', color: '#cc5de8', colorBorde: 'borde-purple' }; break;
//                                 case 'WDG_PORT_KPI_SUB_CONT': widgetData = { titulo: 'SUB - CONTENEDORES', valor: res.data.resumen.subContenedores || 42, subtitulo: 'Retiros y devoluciones', color: '#868e96', colorBorde: 'borde-naranja' }; break;
//                                 case 'WDG_PORT_KPI_SUB_GRANEL': widgetData = { titulo: 'SUB - GRANEL', valor: 28, subtitulo: 'Flujo hacia silos', color: '#868e96', colorBorde: 'borde-indigo' }; break;
//                                 case 'WDG_PORT_KPI_SUB_SUELTA': widgetData = { titulo: 'SUB - CARGA SUELTA', valor: 11, subtitulo: 'Operación en bodega', color: '#868e96', colorBorde: 'borde-purple' }; break;
//                                 case 'WDG_PORT_KPI_SUB_NINERAS': widgetData = { titulo: 'SUB - NIÑERAS', valor: 6, subtitulo: 'Trasiego a patios', color: '#868e96', colorBorde: 'borde-cyan' }; break;
//                             }
//                         }
//                         return { ...widget, data: widgetData };
//                     });
//                 }
//                 this.finalizarRenderizado();
//             },
//             error: (err) => {
//                 console.error("❌ Error API Virtual Gate:", err);
//                 this.finalizarRenderizado();
//             }
//         });
//     }

//     sincronizarContenedores(puerto: string) {
//         this._contenedoresService.obtenerDashboardContenedores().subscribe({
//             next: async (res: any) => {
//                 if (res && res.data) {
//                     const layoutBase = await this.obtenerLayoutBase(this.pestanaActiva);
//                     const layoutArmado = construirLayoutEstatico(layoutBase);

//                     this.dashboard = layoutArmado.map((widget: any) => {
//                         let widgetData = { ...widget.data };
//                         switch (widget.type) {
//                             case 'WDG_PORT_KPI_CONT_CARGADOS': widgetData = { titulo: 'CARGADOS PENDIENTES', valor: res.data.kpis?.cargadosPendientes?.valor, subtitulo: res.data.kpis?.cargadosPendientes?.subtitulo, color: res.data.kpis?.cargadosPendientes?.color, colorBorde: 'borde-cyan' }; break;
//                             case 'WDG_PORT_KPI_CONT_VACIOS': widgetData = { titulo: 'VACÍOS POR DEVOLVER', valor: res.data.kpis?.vaciosDevolver?.valor, subtitulo: res.data.kpis?.vaciosDevolver?.subtitulo, color: res.data.kpis?.vaciosDevolver?.color, colorBorde: 'borde-naranja' }; break;
//                             case 'WDG_PORT_KPI_CONT_REEFER': widgetData = { titulo: 'REEFER ACTIVOS', valor: res.data.kpis?.reeferActivos?.valor, subtitulo: res.data.kpis?.reeferActivos?.subtitulo, color: res.data.kpis?.reeferActivos?.color, colorBorde: 'borde-teal' }; break;
//                             case 'WDG_PORT_KPI_CONT_FREETIME': widgetData = { titulo: 'FREE TIME VENCIDO', valor: res.data.kpis?.freeTimeVencido?.valor, subtitulo: res.data.kpis?.freeTimeVencido?.subtitulo, color: res.data.kpis?.freeTimeVencido?.color, colorBorde: 'borde-blue' }; break;
//                             case 'WDG_PORT_CONT_RETIROS': widgetData = res.data.retirosPriorizacion; break;
//                             case 'WDG_PORT_CONT_NAVIERA': widgetData = res.data.vaciosNaviera; break;
//                             case 'WDG_PORT_CONT_PATIOS': widgetData = res.data.saturacionPatios; break;
//                             case 'WDG_PORT_CONT_FREETIME_CHART': widgetData = res.data.freeTimeDistribucion; break;
//                             case 'WDG_PORT_CONT_TABLA': widgetData = res.data.movimientos; break;
//                         }
//                         return { ...widget, data: widgetData };
//                     });
//                 }
//                 this.finalizarRenderizado();
//             },
//             error: (err) => {
//                 console.error("❌ Error API Contenedores:", err);
//                 this.finalizarRenderizado();
//             }
//         });
//     }

//     private finalizarRenderizado() {
//         this.cargando = false;
//         this.isLoading = false;
//         if (this.options.api && this.options.api.optionsChanged) this.options.api.optionsChanged();
//         this.cdr.detectChanges();
//     }

//     // ==========================================
//     // GESTIÓN DE LA UI, BLOQUEOS Y PERSISTENCIA
//     // ==========================================
//     toggleBloqueoTablero() {
//         this.tableroBloqueado = !this.tableroBloqueado;
//         if (this.options.draggable && this.options.resizable) {
//             this.options.draggable.enabled = !this.tableroBloqueado;
//             this.options.resizable.enabled = !this.tableroBloqueado;
//             this.options.api?.optionsChanged?.();
//         }
//         if (this.tableroBloqueado && this.hayCambiosSinGuardar) {
//             this.guardarConfiguracionTablero();
//         }
//     }

//     guardarConfiguracionTablero() {
//         if (!this.dashboard || this.dashboard.length === 0) return;

//         const usuario = this.usuarioId || 'SISTEMA_DEFAULT';
//         const widgetsAguardar = this.dashboard.filter(w => w.type !== 'BORRAR_ME' && !w.type.includes('FANTASMA'));

//         const layoutPayload: PTLLayoutModel[] = widgetsAguardar.map(itemGridster => {
//             const itemLayout = new PTLLayoutModel();
//             itemLayout.codigoLayout = (itemGridster as any).codigoLayout || uuidv4();
//             itemLayout.codigoUsuario = usuario;
//             itemLayout.codigoPestana = this.pestanaActiva;
//             itemLayout.codigoWidget = itemGridster.type;
//             itemLayout.posicion_x = itemGridster.x;
//             itemLayout.posicion_y = itemGridster.y;
//             itemLayout.cols = itemGridster.cols;
//             itemLayout.rows = itemGridster.rows;
//             itemLayout.config = itemGridster.data ? JSON.stringify(itemGridster.data) : null;
//             itemLayout.codigoUsuarioCreacion = usuario;
//             itemLayout.fechaCreacion = new Date().toISOString();

//             return itemLayout;
//         });

//         this._layoutService.postCrearLayout(layoutPayload).subscribe({
//             next: (res: any) => {
//                 console.log('✅ Layout guardado exitosamente', res);
//                 this.hayCambiosSinGuardar = false;
//             },
//             error: (err: any) => console.error('❌ Error persistiendo layout', err)
//         });
//     }

//     // ==========================================
//     // INTERACCIÓN CON EL LOBBY DE WIDGETS
//     // ==========================================
//     actualizarWidgetDesdeLobby(evento: { codigoWidget: string, seleccionado: boolean }) {
//         const { codigoWidget, seleccionado } = evento;

//         if (seleccionado) {
//             const existeEnPantalla = this.dashboard.find(w => w.type === codigoWidget || (w as any).codigoWidget === codigoWidget);
//             if (!existeEnPantalla) {
//                 const widgetMaster = this.lsWidgets.find((w: any) => (w.codigoWidget || w.codigo_widget) === codigoWidget) as any;
//                 if (widgetMaster) {
//                     const nuevoItem: any = {
//                         type: widgetMaster.codigoWidget || widgetMaster.codigo_widget,
//                         codigoWidget: widgetMaster.codigoWidget || widgetMaster.codigo_widget,
//                         cols: widgetMaster.defaultCols || widgetMaster.cols_defecto || 4,
//                         rows: widgetMaster.defaultRows || widgetMaster.rows_defecto || 3,
//                         x: 0, y: 0,
//                         data: { tipo: widgetMaster.tipo || widgetMaster.categoria }
//                     };
//                     this.asignarPosicionLibre(nuevoItem);
//                     this.dashboard.push(nuevoItem);
//                 }
//             }
//         } else {
//             const index = this.dashboard.findIndex(w => w.type === codigoWidget || (w as any).codigoWidget === codigoWidget);
//             if (index !== -1) {
//                 this.dashboard.splice(index, 1);
//             }
//         }

//         if (this.options.api && this.options.api.optionsChanged) this.options.api.optionsChanged();
//         this.cdr.detectChanges();
//         this.hayCambiosSinGuardar = true;
//     }

//     guardarPreferenciasWidgets(activos: any[]) {
//         // Al cerrar el lobby y confirmar, guardamos el estado del tablero
//         this.guardarConfiguracionTablero();
//         this.mostrarLobby = false;
//         this.cdr.detectChanges();
//     }

//     asignarPosicionLibre(item: any) {
//         if (this.options && this.options.api && typeof (this.options.api as any).getNextPossiblePosition === 'function') {
//             const posLibre = (this.options.api as any).getNextPossiblePosition(item);
//             if (posLibre) {
//                 item.x = posLibre.x;
//                 item.y = posLibre.y;
//                 return;
//             }
//         }
//         const totalItems = this.dashboard.length;
//         item.x = (totalItems * 4) % 12;
//         item.y = Math.floor((totalItems * 4) / 12) * 3;
//     }

//     // ==========================================
//     // UTILIDADES Y MODALES
//     // ==========================================
//     trackByWidget(index: number, widget: any): string {
//         return widget.idClon || widget.codigoWidget || widget.type;
//     }

//     abrirLobbyModal() {
//         this.filtrarWidgetsParaLobby(this.pestanaActiva);
//         this.mostrarLobby = true;
//         this.cdr.detectChanges();
//     }

//     filtrarWidgetsParaLobby(nuevaPestana: string) {
//         this.widgetsParaElLobby = (this.lsWidgets || []).filter((w: any) => {
//             const estadoValido = w.estadoWidget === true || w.estadoWidget === 'true' || w.estadoWidget === 1;
//             return estadoValido && w.codigoPestana === nuevaPestana;
//         });
//     }

//     abrirLobbyPestanas() {
//         this.mostrarLobbyPestanas = true;
//         this.cdr.detectChanges();
//     }

//     obtenerCodigosVisibles(): string[] {
//         const settings = this._localStoragoService.getNavSettingsLocalStorage()
//         return settings.pestanas || [];
//     }

//     guardarPreferenciasPestanas(codigosSeleccionados: any[]) {
//         this.pestanasVisibles = codigosSeleccionados
//             .map(codigo => this.lsPestanas.find(p => p.codigoPestana === codigo.codigoPestana))
//             .filter(p => p !== undefined);

//         if (this.pestanasVisibles.length > 0) {
//             if (!codigosSeleccionados.includes(this.pestanaActiva)) {
//                 this.cambiarPestana(this.pestanasVisibles[0].codigoPestana);
//             }
//         } else {
//             this.pestanaActiva = '';
//             this.dashboard = [];
//         }

//         this.cdr.detectChanges();
//         this.persistirEstadoPestanas();
//     }

//     cerrarModalEnfoque() {
//         this.widgetEnfoque = null;
//         this._torreService.cerrarModoEnfoque();
//     }

//     async persistirEstadoPestanas() {
//         const estadoActual = await this._localStoragoService.getNavSettingsLocalStorage() || {};
//         estadoActual.pestanas = this.obtenerCodigosVisibles();
//         this._localStoragoService.setNavSettingsLocalStorage(estadoActual);
//     }
// }
/*
    Author: German Valencia
    Pattern: PORTTOS Orchestrator Component - Multi-Tenant (QPLUS Unified)
    Refactor: Motor de Layouts Dinámico Asíncrono con BD Normalizada y Caché de Objetos
*/
import { Component, OnInit, OnDestroy, ChangeDetectorRef, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
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
import { LocalStorageService } from 'src/app/theme/shared/service';
import { PtlpestanasService } from 'src/app/theme/shared/service/ptlpestanas.service';
import { LayoutService } from 'src/app/theme/shared/service/layout.service';

import { TcHeaderComponent } from "../widgets/tc-header/tc-header.component";
import { WidgetSelectorTclComponent } from "../widgets/widget-selector-tcl/widget-selector-tcl.component";
import { WidgetLobbyTclComponent } from "../widgets/widget-lobby-tcl/widget-lobby-tcl.component";
import { PestanaLobbyTclComponent } from '../widgets/pestana-lobby-tcl/pestana-lobby-tcl.component';

import { Widget } from 'src/app/theme/shared/_helpers/models/tablero-control/widget.model';
import { PTLLayoutModel } from 'src/app/theme/shared/_helpers/models/PTLLayout.model';
import { construirLayoutEstatico, construirLayoutMaritimo } from '../../theme/shared/_config/tab-layouts.config';
import { PTLLayoutPestanaModel } from 'src/app/theme/shared/_helpers/models/PTLLayoutPestana.model';

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
    public dashboard: Array<GridsterItem & { type: string, data: any }> = [];
    public isLoading: boolean = false;
    public isOptionBloqueo: boolean = false;
    public isBloqueado: boolean = false;
    public cargando: boolean = true;
    public tableroBloqueado: boolean = true;
    public widgetEnfoque: { type: string, data: any } | null = null;
    public hayCambiosSinGuardar: boolean = false;

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
        private _maritimoService: MaritimoService,
        private _virtualGateService: VirtualGateService,
        private _contenedoresService: ContenedoresService,
        private _filtroService: FiltroTableroService,
        private _widgetsService: PTLWidgetsMaestroService,
        private _localStoragoService: LocalStorageService,
        private _layoutService: LayoutService,
        private _pestanasService: PtlpestanasService,
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

        // this._pestanasService.obtenerPestanasDelContexto(codigoSuite, codigoAplicacion).subscribe(async (res: any) => {
        //     if (res.success && res.data && res.data.length > 0) {
        //         this.lsPestanas = res.data;
        //         const preferencias = this._localStoragoService.getNavSettingsLocalStorage();
        //         const pestaActivasUsuario = preferencias.pestanas || [];

        //         // Validamos y mapeamos soportando strings o un objetos
        //         if (pestaActivasUsuario.length > 0) {
        //             this.pestanasVisibles = pestaActivasUsuario
        //                 .map((codigo: any) => {
        //                     const codStr = typeof codigo === 'string' ? codigo : codigo?.codigoPestana;
        //                     return this.lsPestanas.find(p => p.codigoPestana === codStr);
        //                 })
        //                 .filter((p: any) => p !== undefined);
        //         }

        //         // Escudo anti-crash si la caché estaba corrupta
        //         if (!this.pestanasVisibles || this.pestanasVisibles.length === 0) {
        //             this.pestanasVisibles = this.lsPestanas.slice(0, 3);
        //         }

        //         // Guardamos los objetos completos en caché
        //         preferencias.pestanas = this.pestanasVisibles;
        //         this._localStoragoService.setNavSettingsLocalStorage(preferencias);

        //         const pestanaGuardada = current?.pestanaActiva || this.pestanasVisibles[0]?.codigoPestana;
        //         const existePestana = this.pestanasVisibles.find(p => p.codigoPestana === pestanaGuardada);
        //         this.pestanaActiva = existePestana ? pestanaGuardada : this.pestanasVisibles[0].codigoPestana;

        //         current.pestanaActiva = this.pestanaActiva;
        //         this._localStoragoService.setCurrentUserLocalStorage(current);

        //         this.cargarCatalogoWidgetsYRenderizar();
        //     }
        // });
        this._pestanasService.obtenerPestanasDelContexto(codigoSuite, codigoAplicacion).subscribe(async (resMaster: any) => {
            if (resMaster.success && resMaster.data && resMaster.data.length > 0) {
                this.lsPestanas = resMaster.data;
                const preferencias = this._localStoragoService.getNavSettingsLocalStorage();
                const current = this._localStoragoService.getCurrentUserLocalStorage();

                // 🚨 MAGIA: Consultamos la Base de Datos para ver las preferencias del usuario
                this._layoutService.obtenerPreferenciasPestanas(this.usuarioId).subscribe((resPrefs: any) => {

                    if (resPrefs.ok && resPrefs.data && resPrefs.data.length > 0) {
                        // ESCENARIO A: El usuario ya personalizó sus pestañas
                        // 1. Las ordenamos estrictamente por la columna 'posicion'
                        const pestanasOrdenadasBD = resPrefs.data.sort((a: any, b: any) => a.posicion - b.posicion);

                        // 2. Mapeamos los códigos de la BD con los objetos completos del catálogo maestro
                        this.pestanasVisibles = pestanasOrdenadasBD
                            .map((pref: any) => this.lsPestanas.find(p => p.codigoPestana === pref.codigoPestana))
                            .filter((p: any) => p !== undefined);

                    } else {
                        // ESCENARIO B: Usuario nuevo (Sin registros en BD)
                        // Le mostramos las primeras 3 pestañas por defecto
                        this.pestanasVisibles = this.lsPestanas.slice(0, 3);
                    }

                    // Forzamos actualización de caché local por seguridad
                    preferencias.pestanas = this.pestanasVisibles;
                    this._localStoragoService.setNavSettingsLocalStorage(preferencias);

                    // Determinamos en qué pestaña arranca la aplicación
                    const pestanaGuardada = current?.pestanaActiva || this.pestanasVisibles[0]?.codigoPestana;
                    const existePestana = this.pestanasVisibles.find(p => p.codigoPestana === pestanaGuardada);
                    this.pestanaActiva = existePestana ? pestanaGuardada : this.pestanasVisibles[0].codigoPestana;

                    current.pestanaActiva = this.pestanaActiva;
                    this._localStoragoService.setCurrentUserLocalStorage(current);

                    // Finalmente, disparamos la carga de los widgets
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

    // ==========================================
    // NUCLEO: OBTENER LAYOUT (ASÍNCRONO DESDE BD)
    // ==========================================
    async obtenerLayoutBase(pestana: string): Promise<any[]> {
        this.pestanaActiva = pestana;
        let layoutArmado: any[] = [];
        const usuario = this.usuarioId || 'SISTEMA_DEFAULT';

        try {
            const layoutDesdeBD: PTLLayoutModel[] = await this._layoutService
                .cargarRegistrosUsuarioPestana(usuario, pestana)
                .toPromise() || [];

            if (layoutDesdeBD.length > 0) {
                // ESCENARIO A: Layout existente en BD
                layoutArmado = layoutDesdeBD.map(itemDB => {
                    const widgetMaster = this.lsWidgets.find(w => (w as any).codigoWidget === itemDB.codigoWidget);
                    let configData = null;
                    if (itemDB.config) {
                        try {
                            configData = typeof itemDB.config === 'string' ? JSON.parse(itemDB.config) : itemDB.config;
                        } catch (e) { }
                    }

                    return {
                        ...widgetMaster,
                        type: itemDB.codigoWidget,
                        codigoWidget: itemDB.codigoWidget,
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
                // ESCENARIO B: Carga por defecto del catálogo
                const widgetsInicialesBd = this.lsWidgets.filter((w: any) =>
                    w.codigoPestana === pestana && (w.inicial === true || w.inicial === 'true' || w.inicial === 1)
                );

                layoutArmado = widgetsInicialesBd.map((w: any, index: number) => {
                    const posX = w.pos_x !== undefined ? w.pos_x : (index * 4) % 12;
                    const posY = w.pos_y !== undefined ? w.pos_y : Math.floor((index * 4) / 12) * 3;
                    return {
                        ...w,
                        type: w.codigoWidget || w.codigo_widget,
                        codigoWidget: w.codigoWidget || w.codigo_widget,
                        cols: w.defaultCols || w.cols_defecto || 4,
                        rows: w.defaultRows || w.rows_defecto || 3,
                        x: posX,
                        y: posY,
                        visible: true,
                        pestana: pestana,
                        codigoLayout: uuidv4()
                    };
                });
            }

            // Filtro Anti-Duplicados y Nulos
            const layoutLimpio = layoutArmado.filter(w => w !== undefined && w.type !== undefined);
            const layoutSinDuplicados = layoutLimpio.filter((widget, index, self) =>
                index === self.findIndex((w) => w.type === widget.type)
            );

            // Sincronizamos para el Lobby
            this.lsLayout = [...layoutSinDuplicados];

            // Guardamos el layout completo renderizado en navSettings
            const preferencias = this._localStoragoService.getNavSettingsLocalStorage();
            preferencias.layout = this.lsLayout;
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
    // RENDERIZADO Y SINCRONIZACIÓN DE SERVICIOS
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
        } else {
            this.dashboard = await this.obtenerLayoutBase(codigoDashboard);
            this.finalizarRenderizado();
        }
    }

    sincronizarTorreMaritima(puerto: string) {
        this._maritimoService.obtenerResumenOperativo(puerto).subscribe({
            next: async (res: any) => {
                if (res && res.success && res.data) {
                    const terminales = res.data.WDG_TERMINALES || [];
                    const layoutBase = await this.obtenerLayoutBase(this.pestanaActiva);
                    let layoutArmado = construirLayoutMaritimo(layoutBase, terminales);

                    const kpisDataOficial = [
                        { titulo: 'CAMIONES EN OPERACION', valor: res.data.camionesPuerto || '937', subtitulo: 'ZONA URBANA BUENAVENTURA', colorBorde: 'borde-cyan' },
                        { titulo: 'CONTENEDORES DÍA', valor: res.data.contenedoresDia || '2.200', subtitulo: 'FCL 2.200 · LCL 0 · Reefer 0', colorBorde: 'borde-amarillo' },
                        { titulo: 'GRANEL - TONS DÍA', valor: res.data.granelTons || '1.8K', subtitulo: 'Agrícola 35.2K · Mineral 0 · Líquido 17.6K', colorBorde: 'borde-naranja' },
                        { titulo: 'CARGA SUELTA - TM', valor: res.data.cargaSuelta || '293', subtitulo: 'Break-bulk 293 · Project 0 · Paletizada 0', colorBorde: 'borde-green' },
                        { titulo: 'VEHÍCULOS RO-RO', valor: res.data.vehiculosRoro || '147', subtitulo: 'Imp 147 · Exp 0 · PDI 95% ocupado', colorBorde: 'borde-teal' },
                        { titulo: 'SATURACIÓN BODEGAS', valor: res.data.saturacionBodegas || '72%', subtitulo: '8 bodegas · 2 críticas · ruteo activo', colorBorde: 'borde-purple' }
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
                        if (widget.y === 0 || (widget.type || '').toUpperCase().includes('KPI')) return widget;

                        let widgetData = { ...(widget.data || {}) };
                        const tipoLimpio = (widget.type || '').trim().toUpperCase().replace('WDG_PORT_', '');
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
            next: async (res: any) => {
                if (res && res.data) {
                    const layoutBase = await this.obtenerLayoutBase(this.pestanaActiva);
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
            next: async (res: any) => {
                if (res && res.data) {
                    const layoutBase = await this.obtenerLayoutBase(this.pestanaActiva);
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

    private finalizarRenderizado() {
        this.cargando = false;
        this.isLoading = false;
        if (this.options.api && this.options.api.optionsChanged) this.options.api.optionsChanged();
        this.cdr.detectChanges();
    }

    // ==========================================
    // GESTIÓN DE LA UI, BLOQUEOS Y PERSISTENCIA
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

        const usuario = this.usuarioId || 'SISTEMA_DEFAULT';
        const widgetsAguardar = this.dashboard.filter(w => w.type !== 'BORRAR_ME' && !w.type.includes('FANTASMA'));

        const layoutPayload: PTLLayoutModel[] = widgetsAguardar.map(itemGridster => {
            const itemLayout = new PTLLayoutModel();
            itemLayout.codigoLayout = (itemGridster as any).codigoLayout || uuidv4();
            itemLayout.codigoUsuario = usuario;
            itemLayout.codigoPestana = this.pestanaActiva;
            itemLayout.codigoWidget = itemGridster.type;
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
                console.log('✅ Layout guardado exitosamente', res);
                this.hayCambiosSinGuardar = false;

                // Actualizar la caché local con los widgets completos de la pantalla
                const preferencias = this._localStoragoService.getNavSettingsLocalStorage();
                preferencias.layout = [...this.dashboard];
                this._localStoragoService.setNavSettingsLocalStorage(preferencias);
            },
            error: (err: any) => console.error('❌ Error persistiendo layout', err)
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

        // 🚨 FIX: Sincronizamos la variable que lee el lobby con lo que realmente hay en la pantalla
        this.lsLayout = this.dashboard.map(widgetGridster => {
            return {
                ...widgetGridster,
                // El lobby busca la propiedad codigoWidget para marcar el checkbox
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
        // Blindaje: Extraemos estrictamente el 'codigoPestana' (string)
        // para que el Lobby reconozca qué checkboxes encender.
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

    cerrarModalEnfoque() {
        this.widgetEnfoque = null;
        this._torreService.cerrarModoEnfoque();
    }

    async persistirEstadoPestanas() {
        // 1. Guardamos en LocalStorage para velocidad de navegación (Caché)
        const estadoActual = await this._localStoragoService.getNavSettingsLocalStorage() || {};
        estadoActual.pestanas = this.pestanasVisibles;
        this._localStoragoService.setNavSettingsLocalStorage(estadoActual);

        // 2. Persistencia real en SQL Server
        const usuario = this.usuarioId || 'SISTEMA_DEFAULT';

        const payloadPestanas: PTLLayoutPestanaModel[] = this.pestanasVisibles.map((pestana, index) => {
            return new PTLLayoutPestanaModel({
                codigoUsuario: usuario,
                codigoPestana: pestana.codigoPestana,
                posicion: index, // 🚨 Vital: Guardamos el orden visual actual
                codigoUsuarioCreacion: usuario,
                fechaCreacion: new Date().toISOString()
            });
        });

        this._layoutService.postGuardarPestanasUsuario(payloadPestanas).subscribe({
            next: (res: any) => console.log('✅ Preferencias de pestañas guardadas en BD', res),
            error: (err: any) => console.error('❌ Error persistiendo pestañas en BD', err)
        });
    }
}
