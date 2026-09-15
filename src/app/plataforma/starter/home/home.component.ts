// // /* eslint-disable @typescript-eslint/no-this-alias */
// // /* eslint-disable @typescript-eslint/no-explicit-any */
// // import { ChangeDetectorRef, Component, EventEmitter, OnInit, OnDestroy, Output } from '@angular/core';
// // import { DataTablesModule } from 'angular-datatables';
// // import { Router } from '@angular/router';
// // import { Observable, Subject, Subscription, firstValueFrom } from 'rxjs';
// // import { CommonModule } from '@angular/common';
// // import { debounceTime } from 'rxjs/operators';

// // import { SharedModule } from 'src/app/theme/shared/shared.module';
// // import { TranslateModule, TranslateService } from '@ngx-translate/core';
// // import { PTLSitiosAPModel } from 'src/app/theme/shared/_helpers/models/PTLSitioAP.model';
// // import { GradientConfig } from 'src/app/app-config';
// // import { NavigationService } from 'src/app/theme/shared/service/navigation.service';
// // import { NavBarComponent } from 'src/app/theme/layout/admin/nav-bar/nav-bar.component';
// // import { NavContentComponent } from 'src/app/theme/layout/admin/navigation/nav-content/nav-content.component';
// // import { PTLAplicacionModel } from 'src/app/theme/shared/_helpers/models/PTLAplicacion.model';
// // import { NavigationItem } from 'src/app/theme/shared/_helpers/models/Navigation.model';
// // import { LocalStorageService } from 'src/app/theme/shared/service';
// // import { WidgetLobbyComponent } from "src/app/plataforma/starter/home/widget-lobby/widget-lobby.component";
// // import { WidgetSelectorComponent } from "src/app/plataforma/starter/home/widget-selector/widget-selector.component";
// // import { DashboardService } from 'src/app/theme/shared/service/tablero-control/dashboard.service';
// // import { GridsterConfig, GridsterItem, GridType, GridsterComponent, GridsterItemComponent } from 'angular-gridster2';

// // import { PTLWidgetsMaestroService } from 'src/app/theme/shared/service/ptlwidgets-maestro.service';
// // import { PTLWidgetMaestroModel } from 'src/app/theme/shared/_helpers/models/PTLWidgetMaestro.model';
// // import { LayoutService } from 'src/app/theme/shared/service/layout.service';

// // @Component({
// //     selector: 'app-home',
// //     standalone: true,
// //     imports: [CommonModule, DataTablesModule, SharedModule, TranslateModule, NavBarComponent, NavContentComponent, WidgetSelectorComponent, GridsterComponent, GridsterItemComponent, WidgetLobbyComponent],
// //     templateUrl: './home.component.html',
// //     styleUrl: './home.component.scss'
// // })
// // export class HomeComponent implements OnInit, OnDestroy {
// //     @Output() toggleSidebar = new EventEmitter<void>();

// //     //#region VARIABLES
// //     usuario: any = {};
// //     private saveLayoutSubject = new Subject<any>();
// //     private subs: Subscription = new Subscription();
// //     registrosSub?: Subscription;
// //     registros: PTLSitiosAPModel[] = [];
// //     registrosFiltrado: PTLSitiosAPModel[] = [];
// //     aplicaciones: PTLAplicacionModel[] = [];
// //     aplicacionesSub?: Subscription;
// //     lang: string = localStorage.getItem('lang') || '';
// //     tituloPagina: string = '';
// //     gradientConfig;
// //     hasFiltersSlot: boolean = false;
// //     menuItems$!: Observable<NavigationItem[]>;
// //     activeTab: 'menu' | 'filters' | 'main' = 'menu';

// //     public options!: GridsterConfig;
// //     public dashboard: Array<GridsterItem & { type: string, data: any }> = [];
// //     public isLoading: boolean = false;
// //     public mostrarLobby: boolean = false;
// //     public cargando: boolean = true;
// //     public tableroBloqueado: boolean = true;
// //     public widgetEnfoque: { type: string, data: any } | null = null;
// //     public hayCambiosSinGuardar: boolean = false;
// //     public lsWidgets: PTLWidgetMaestroModel[] = [];
// //     public lsLayout: any[] = [];
// //     public pestanaActiva: string = 'TAB_PLAT_PRINCIPAL';
// //     textoBienvenida = '';
// //     //#endregion VARIABLES

// //     constructor(
// //         private router: Router,
// //         private translate: TranslateService,
// //         private _localStoragoService: LocalStorageService,
// //         private _torreService: DashboardService,
// //         private _navigationService: NavigationService,
// //         private cdr: ChangeDetectorRef,
// //         private _widgetsMaestroService: PTLWidgetsMaestroService,
// //         private _layoutService: LayoutService
// //     ) {
// //         this.gradientConfig = GradientConfig;
// //         this.usuario = _localStoragoService.getCurrentUserLocalStorage().usuario;
// //     }

// //     async ngOnInit() {
// //         this.iniciarConfiguracionGridster();

// //         this.subs.add(
// //             this.saveLayoutSubject.pipe(debounceTime(1500)).subscribe(layoutToSave => {
// //                 this.persistirLayoutEnServidor(layoutToSave);
// //             })
// //         );

// //         this._navigationService.getNavigationItems();
// //         this.menuItems$ = this._navigationService.menuItems$;
// //         this.hasFiltersSlot = true;

// //         try {
// //             this.cargando = true;

// //             // 1. Traemos el catálogo fresco de la base de datos (Para tener las últimas versiones de layout)
// //             const resp = await firstValueFrom(this._widgetsMaestroService.getWidgetsActivos());
// //             const catalogoFresco = resp.widgets || [];

// //             // 🟢 2. Extraemos los permisos que armamos en el Login (Guardados en sesión)
// //             const widgetsPermitidos = this.usuario?.widgets || [];
// //             const codigosPermitidos = widgetsPermitidos.map((w: any) => w.codigoWidget);

// //             // 🟢 3. Asignamos a lsWidgets SOLO los que existen en el arreglo del usuario
// //             // Esto alimenta automáticamente tu componente <app-widget-lobby> de forma segura
// //             this.lsWidgets = catalogoFresco.filter((w: any) => codigosPermitidos.includes(w.codigoWidget));
// //             console.log('📦 Catálogo filtrado por Roles (Lobby):', this.lsWidgets);

// //             const layoutPorDefecto = [
// //                 { type: 'WDG_PLAT_KPI_USUARIOS', cols: 3, rows: 2, x: 0, y: 0, pestana: 'TAB_PLAT_PRINCIPAL', visible: true, data: { tipo: 'usuarios' } },
// //                 { type: 'WDG_PLAT_KPI_PAQUETES', cols: 3, rows: 2, x: 3, y: 0, pestana: 'TAB_PLAT_PRINCIPAL', visible: true, data: { tipo: 'paquetes' } },
// //                 { type: 'WDG_PLAT_KPI_APLICACIONES', cols: 3, rows: 2, x: 6, y: 0, pestana: 'TAB_PLAT_PRINCIPAL', visible: true, data: { tipo: 'aplicaciones' } },
// //                 { type: 'WDG_PLAT_KPI_SUSCRIPTORES', cols: 3, rows: 2, x: 9, y: 0, pestana: 'TAB_PLAT_PRINCIPAL', visible: true, data: { tipo: 'suscriptores' } },
// //                 { type: 'WDG_PLAT_USUARIOS', cols: 4, rows: 3, x: 0, y: 2, pestana: 'TAB_PLAT_PRINCIPAL', visible: true },
// //                 { type: 'WDG_PLAT_TICKETS', cols: 8, rows: 3, x: 6, y: 2, pestana: 'TAB_PLAT_PRINCIPAL', visible: true },
// //                 { type: 'WDG_PLAT_PAQUETES', cols: 12, rows: 4, x: 0, y: 4, pestana: 'TAB_PLAT_PRINCIPAL', visible: true },
// //                 { type: 'WDG_PLAT_RENDIMIENTO', cols: 12, rows: 3, x: 0, y: 0, pestana: 'TAB_PLAT_SISTEMA', visible: true }
// //             ];

// //             let layoutDesdeSesion: any = null;
// //             const layoutCrudoUsuario = this.usuario?.layout;

// //             if (layoutCrudoUsuario) {
// //                 try {
// //                     layoutDesdeSesion = typeof layoutCrudoUsuario === 'string'
// //                         ? JSON.parse(layoutCrudoUsuario)
// //                         : layoutCrudoUsuario;
// //                 } catch (e) {
// //                     console.warn('⚠️ Error al parsear el layout de la sesión:', e);
// //                 }
// //             }

// //             if (layoutDesdeSesion && Array.isArray(layoutDesdeSesion) && layoutDesdeSesion.length > 0) {
// //                 this.lsLayout = layoutDesdeSesion;
// //             } else {
// //                 const tableroState = await this._localStoragoService.getTableroLocalStorage() || {};
// //                 if (tableroState.layout && tableroState.layout.length > 0) {
// //                     this.lsLayout = tableroState.layout;
// //                 } else {
// //                     this.lsLayout = layoutPorDefecto;
// //                 }
// //             }

// //             this.validarActualizacionesDeWidgetsMaestro();

// //             const tableroState = await this._localStoragoService.getTableroLocalStorage() || {};
// //             this.pestanaActiva = tableroState.pestana?.includes('TAB_PLAT') ? tableroState.pestana : 'TAB_PLAT_PRINCIPAL';

// //             this.cambiarPestana(this.pestanaActiva);

// //         } catch (error) {
// //             console.error('❌ Error al cargar los widgets maestros o el layout:', error);
// //             this.cargando = false;
// //         }

// //         this.subs.add(this._torreService.widgetEnfoque$.subscribe(widget => {
// //             this.widgetEnfoque = widget;
// //             this.cdr.detectChanges();
// //         }));
// //     }

// //     validarActualizacionesDeWidgetsMaestro(): void {
// //         let huboCambios = false;

// //         // 🟢 Usamos un nuevo arreglo para poder descartar los no permitidos
// //         const layoutFiltrado: any[] = [];

// //         this.lsLayout.forEach(itemLayout => {
// //             const widgetMaestro = this.lsWidgets.find((w: any) => w.codigoWidget === itemLayout.type);

// //             // 1. Control de Seguridad: Si el widget no está en los permitidos, lo ignoramos
// //             if (!widgetMaestro) {
// //                 huboCambios = true;
// //                 console.log(`🚫 Widget ${itemLayout.type} expulsado del tablero (Sin permisos de rol).`);
// //                 return; // ⬅️ El return detiene la ejecución, por lo que no se añade al layoutFiltrado
// //             }

// //             // 2. Control de Versiones: Actualizamos tamaños si hay cambios en BD
// //             if ((itemLayout.version || 1) < (widgetMaestro.layoutVersion || 1)) {
// //                 itemLayout.cols = widgetMaestro.defaultCols;
// //                 itemLayout.rows = widgetMaestro.defaultRows;
// //                 itemLayout.version = widgetMaestro.layoutVersion || 1;

// //                 huboCambios = true;
// //                 console.log(`🔄 Widget ${itemLayout.type} forzado a sus nuevas medidas (Versión ${itemLayout.version})`);
// //             }

// //             layoutFiltrado.push(itemLayout);
// //         });

// //         this.lsLayout = layoutFiltrado;

// //         if (huboCambios) {
// //             this.saveLayoutSubject.next(this.lsLayout);
// //         }
// //     }

// //     ngOnDestroy() {
// //         this.subs.unsubscribe();
// //     }

// //     iniciarConfiguracionGridster() {
// //         this.options = {
// //             gridType: GridType.ScrollVertical,
// //             margin: 16,
// //             outerMargin: false,
// //             minCols: 12, maxCols: 12,
// //             minRows: 1, maxRows: 100,
// //             fixedRowHeight: 120,
// //             pushItems: true,
// //             swap: true,
// //             compactType: 'compactUp&Left',
// //             defaultItemCols: 4, defaultItemRows: 3,
// //             displayGrid: 'onDrag&Resize',
// //             draggable: { enabled: !this.tableroBloqueado },
// //             resizable: { enabled: !this.tableroBloqueado },
// //             mobileBreakpoint: 960, keepFixedHeightInMobile: true,
// //             itemResizeCallback: () => {
// //                 this.hayCambiosSinGuardar = true;
// //                 this.sincronizarDashboardAMaestro();
// //                 this.saveLayoutSubject.next(this.lsLayout);
// //             },
// //             itemChangeCallback: () => {
// //                 this.hayCambiosSinGuardar = true;
// //                 this.sincronizarDashboardAMaestro();
// //                 this.saveLayoutSubject.next(this.lsLayout);
// //             }
// //         };
// //     }

// //     persistirLayoutEnServidor(layoutData: any[]) {
// //         const codigoUsuario = this.usuario?.codigoUsuario;
// //         if (!codigoUsuario) return;

// //         const payload = {
// //             codigoUsuario: codigoUsuario,
// //             layoutData: layoutData
// //         };

// //         this._layoutService.saveOrUpdateLayout(payload).subscribe({
// //             next: (res: any) => {
// //                 if (res.ok) {
// //                     this.hayCambiosSinGuardar = false;
// //                     console.log('💾 Layout del usuario guardado exitosamente en el servidor.');
// //                 }
// //             },
// //             error: (err) => {
// //                 console.error('❌ Error al guardar el layout en el servidor:', err);
// //             }
// //         });
// //     }

// //     ingresarQplusWeb(): void {
// //         this.router.navigate(['/websites/plataforma']);
// //     }

// //     cerrarModalEnfoque() {
// //         this.widgetEnfoque = null;
// //         this._torreService.cerrarModoEnfoque();
// //     }

// //     async cambiarPestana(nuevaPestana: string) {
// //         this.sincronizarDashboardAMaestro();

// //         this.isLoading = true;
// //         this.cargando = true;
// //         this.pestanaActiva = nuevaPestana;
// //         this.dashboard = [];

// //         this._localStoragoService.setPestanaLocalStorage(nuevaPestana, this.usuario.codigoUsuario);

// //         const layoutParaRenderizar = this.armarDashboardPorPestana(nuevaPestana);

// //         const estadoActual = await this._localStoragoService.getTableroLocalStorage() || {};
// //         estadoActual.layout = layoutParaRenderizar;
// //         estadoActual.pestana = nuevaPestana;

// //         if (typeof (this._localStoragoService as any).setTableroLocalStorage === 'function') {
// //             (this._localStoragoService as any).setTableroLocalStorage(estadoActual);
// //         } else {
// //             localStorage.setItem('tableroState', JSON.stringify(estadoActual));
// //         }

// //         this.renderizarLayoutDesdeCache(layoutParaRenderizar, nuevaPestana);
// //     }

// //     armarDashboardPorPestana(pestana: string): any[] {
// //         return this.lsLayout
// //             .map(layoutItem => {
// //                 const widgetConfig = this.lsWidgets.find(w => w.codigoWidget === layoutItem.type);

// //                 return {
// //                     ...widgetConfig,
// //                     ...layoutItem
// //                 };
// //             })
// //             .filter((item: any) => item.codigoWidget && item.pestana === pestana);
// //     }

// //     renderizarLayoutDesdeCache(layoutCrudo: any[], codigoDashboard: string) {
// //         this.cargando = true;
// //         this.dashboard = [];

// //         this.options.gridType = GridType.ScrollVertical;
// //         if (this.options.api && this.options.api.optionsChanged) {
// //             this.options.api.optionsChanged();
// //         }
// //         this.cdr.detectChanges();

// //         const layoutBase = layoutCrudo.filter((w: any) => w.visible === true || w.visible === 'true' || w.visible === 1);

// //         setTimeout(() => {
// //             this.dashboard = [...layoutBase].map(item => ({ ...item }));
// //             this.cargando = false;
// //             this.isLoading = false;

// //             if (this.options.api && this.options.api.optionsChanged) {
// //                 this.options.api.optionsChanged();
// //             }
// //             this.cdr.detectChanges();

// //             console.log('✅ Dashboard Plataforma Renderizado:', this.dashboard);
// //         }, 100);
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

// //     abrirLobby() {
// //         console.log('🟢 [DEBUG] ¡Se hizo clic en el botón de agregar (+)! Estado previo:', this.mostrarLobby);
// //         this.mostrarLobby = true;
// //         console.log('🟢 [DEBUG] Estado nuevo de mostrarLobby:', this.mostrarLobby);

// //         this.cdr.detectChanges();
// //     }

// //     actualizarWidgetDesdeLobby(evento: { codigoWidget: string, seleccionado: boolean }) {
// //         const { codigoWidget, seleccionado } = evento;

// //         const indexLayout = this.lsLayout.findIndex(l => l.type === codigoWidget || l.codigoWidget === codigoWidget);

// //         if (indexLayout !== -1) {
// //             this.lsLayout[indexLayout].visible = seleccionado;

// //             if (seleccionado) {
// //                 this.lsLayout[indexLayout].x = 0;
// //                 this.lsLayout[indexLayout].y = 0;
// //             }
// //         } else if (seleccionado) {
// //             const widgetMaster = this.lsWidgets.find(w => w.codigoWidget === codigoWidget);
// //             if (widgetMaster) {
// //                 this.lsLayout.push({
// //                     type: widgetMaster.codigoWidget,
// //                     cols: widgetMaster.defaultCols,
// //                     rows: widgetMaster.defaultRows,
// //                     x: 0, y: 0,
// //                     pestana: this.pestanaActiva,
// //                     visible: true,
// //                     data: {},
// //                     version: widgetMaster.layoutVersion
// //                 });
// //             }
// //         }

// //         const layoutActualizado = this.armarDashboardPorPestana(this.pestanaActiva);
// //         this.dashboard = [...layoutActualizado].filter(w => w.visible === true || w.visible === 'true' || w.visible === 1);

// //         if (this.options.api && this.options.api.optionsChanged) {
// //             this.options.api.optionsChanged();
// //         }
// //         this.cdr.detectChanges();

// //         if (this.usuario) {
// //             this.usuario.layout = JSON.stringify(this.lsLayout);
// //             this.sincronizarLayoutEnSessionStorage();
// //         }

// //         this.hayCambiosSinGuardar = true;
// //         this.saveLayoutSubject.next(this.lsLayout);
// //     }

// //     private sincronizarLayoutEnSessionStorage() {
// //         try {
// //             const keysToUpdate = ['currentUser'];

// //             for (const key of keysToUpdate) {
// //                 const rawData = sessionStorage.getItem(key) || localStorage.getItem(key);

// //                 if (rawData) {
// //                     const parsed = JSON.parse(rawData);

// //                     if (parsed && parsed.usuario) {
// //                         parsed.usuario.layout = JSON.stringify(this.lsLayout);
// //                         if (sessionStorage.getItem(key)) {
// //                             sessionStorage.setItem(key, JSON.stringify(parsed));
// //                         } else {
// //                             localStorage.setItem(key, JSON.stringify(parsed));
// //                         }
// //                         break;
// //                     }
// //                     else if (parsed && parsed.codigoUsuario) {
// //                         parsed.layout = JSON.stringify(this.lsLayout);
// //                         if (sessionStorage.getItem(key)) {
// //                             sessionStorage.setItem(key, JSON.stringify(parsed));
// //                         } else {
// //                             localStorage.setItem(key, JSON.stringify(parsed));
// //                         }
// //                         break;
// //                     }
// //                 }
// //             }
// //             console.log('🔄 sessionStorage actualizado con el nuevo layout del usuario.');
// //         } catch (e) {
// //             console.warn('⚠️ No se pudo actualizar el layout en el almacenamiento de sesión:', e);
// //         }
// //     }

// //     toggleBloqueoGridster() {
// //         this.tableroBloqueado = !this.tableroBloqueado;

// //         if (this.options.draggable && this.options.resizable) {
// //             this.options.draggable.enabled = !this.tableroBloqueado;
// //             this.options.resizable.enabled = !this.tableroBloqueado;
// //         }

// //         if (this.options.api && this.options.api.optionsChanged) {
// //             this.options.api.optionsChanged();
// //         }
// //     }

// //     toggleNav(): void {
// //         this.toggleSidebar.emit();
// //     }

// //     trackByWidget(index: number, widget: any): string {
// //         return widget.codigoWidget || widget.type;
// //     }
// // }
// /* eslint-disable @typescript-eslint/no-this-alias */
// /* eslint-disable @typescript-eslint/no-explicit-any */
// import { ChangeDetectorRef, Component, EventEmitter, OnInit, OnDestroy, Output } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { Router } from '@angular/router';
// import { Observable, Subject, Subscription, firstValueFrom } from 'rxjs';
// import { debounceTime } from 'rxjs/operators';
// import { DataTablesModule } from 'angular-datatables';
// import { GridsterConfig, GridsterItem, GridType, GridsterComponent, GridsterItemComponent } from 'angular-gridster2';
// import { TranslateModule, TranslateService } from '@ngx-translate/core';

// // Servicios y Modelos
// import { SharedModule } from 'src/app/theme/shared/shared.module';
// import { PTLSitiosAPModel } from 'src/app/theme/shared/_helpers/models/PTLSitioAP.model';
// import { PTLAplicacionModel } from 'src/app/theme/shared/_helpers/models/PTLAplicacion.model';
// import { PTLWidgetMaestroModel } from 'src/app/theme/shared/_helpers/models/PTLWidgetMaestro.model';
// import { NavigationItem } from 'src/app/theme/shared/_helpers/models/Navigation.model';
// import { GradientConfig } from 'src/app/app-config';

// // Servicios Core
// import { NavigationService } from 'src/app/theme/shared/service/navigation.service';
// import { LocalStorageService, SocketManagerService, SwalAlertService } from 'src/app/theme/shared/service';
// import { DashboardService } from 'src/app/theme/shared/service/tablero-control/dashboard.service';
// import { PTLWidgetsMaestroService } from 'src/app/theme/shared/service/ptlwidgets-maestro.service';
// import { LayoutService } from 'src/app/theme/shared/service/layout.service';

// // 🟢 Importamos el Socket Manager
// // import { AlertasService } from 'src/app/services/alertas.service'; // Descomentar si usas un servicio de alertas/toasts

// // Componentes
// import { NavBarComponent } from 'src/app/theme/layout/admin/nav-bar/nav-bar.component';
// import { NavContentComponent } from 'src/app/theme/layout/admin/navigation/nav-content/nav-content.component';
// import { WidgetLobbyComponent } from "src/app/plataforma/starter/home/widget-lobby/widget-lobby.component";
// import { WidgetSelectorComponent } from "src/app/plataforma/starter/home/widget-selector/widget-selector.component";

// @Component({
//     selector: 'app-home',
//     standalone: true,
//     imports: [CommonModule, DataTablesModule, SharedModule, TranslateModule, NavBarComponent, NavContentComponent, WidgetSelectorComponent, GridsterComponent, GridsterItemComponent, WidgetLobbyComponent],
//     templateUrl: './home.component.html',
//     styleUrl: './home.component.scss'
// })
// export class HomeComponent implements OnInit, OnDestroy {
//     @Output() toggleSidebar = new EventEmitter<void>();

//     //#region VARIABLES
//     usuario: any = {};
//     private saveLayoutSubject = new Subject<any>();
//     private subs: Subscription = new Subscription();
//     private widgetsSub?: Subscription; // 🟢 Suscripción independiente para los sockets

//     registrosSub?: Subscription;
//     registros: PTLSitiosAPModel[] = [];
//     registrosFiltrado: PTLSitiosAPModel[] = [];
//     aplicaciones: PTLAplicacionModel[] = [];
//     aplicacionesSub?: Subscription;
//     lang: string = localStorage.getItem('lang') || '';
//     tituloPagina: string = '';
//     gradientConfig;
//     hasFiltersSlot: boolean = false;
//     menuItems$!: Observable<NavigationItem[]>;
//     activeTab: 'menu' | 'filters' | 'main' = 'menu';

//     public options!: GridsterConfig;
//     public dashboard: Array<GridsterItem & { type: string, data: any }> = [];
//     public isLoading: boolean = false;
//     public mostrarLobby: boolean = false;
//     public cargando: boolean = true;
//     public tableroBloqueado: boolean = true;
//     public widgetEnfoque: { type: string, data: any } | null = null;
//     public hayCambiosSinGuardar: boolean = false;

//     public lsWidgets: PTLWidgetMaestroModel[] = [];
//     public lsLayout: any[] = [];
//     public pestanaActiva: string = 'TAB_PLAT_PRINCIPAL';
//     textoBienvenida = '';
//     //#endregion VARIABLES

//     constructor(
//         private router: Router,
//         private translate: TranslateService,
//         private _localStoragoService: LocalStorageService,
//         private _torreService: DashboardService,
//         private _navigationService: NavigationService,
//         private cdr: ChangeDetectorRef,
//         private _widgetsMaestroService: PTLWidgetsMaestroService,
//         private _layoutService: LayoutService,
//         private _socketManager: SocketManagerService,
//         private _swalAlertService: SwalAlertService
//     ) {
//         this.gradientConfig = GradientConfig;
//         this.usuario = _localStoragoService.getCurrentUserLocalStorage().usuario;
//     }

//     async ngOnInit() {
//         this.iniciarConfiguracionGridster();

//         // Suscripción de Auto-Guardado (Debounce)
//         this.subs.add(
//             this.saveLayoutSubject.pipe(debounceTime(1500)).subscribe(layoutToSave => {
//                 this.persistirLayoutEnServidor(layoutToSave);
//             })
//         );

//         this._navigationService.getNavigationItems();
//         this.menuItems$ = this._navigationService.menuItems$;
//         this.hasFiltersSlot = true;

//         try {
//             this.cargando = true;

//             await this.cargarCatalogoWidgets();
//             await this.cargarLayoutInicial();

//             this.validarActualizacionesDeWidgetsMaestro();

//             const tableroState = await this._localStoragoService.getTableroLocalStorage() || {};
//             this.pestanaActiva = tableroState.pestana?.includes('TAB_PLAT') ? tableroState.pestana : 'TAB_PLAT_PRINCIPAL';
//             this.cambiarPestana(this.pestanaActiva);

//         } catch (error) {
//             console.error('❌ Error al inicializar el home:', error);
//             this.cargando = false;
//         }

//         this.subs.add(this._torreService.widgetEnfoque$.subscribe(widget => {
//             this.widgetEnfoque = widget;
//             this.cdr.detectChanges();
//         }));

//         this.escucharCambiosWidgets();
//     }

//     ngOnDestroy() {
//         this.subs.unsubscribe();
//         if (this.widgetsSub) {
//             this.widgetsSub.unsubscribe();
//         }
//     }

//     // ==========================================
//     // 🟢 METODOS DE CARGA DE DATOS (MODULARIZADOS)
//     // ==========================================
//     async cargarCatalogoWidgets(): Promise<void> {
//         const resp = await firstValueFrom(this._widgetsMaestroService.getWidgetsActivos());
//         const catalogoFresco = resp.widgets || [];

//         const widgetsPermitidos = this.usuario?.widgets || [];
//         const codigosPermitidos = widgetsPermitidos.map((w: any) => w.codigoWidget);

//         this.lsWidgets = catalogoFresco.filter((w: any) => codigosPermitidos.includes(w.codigoWidget));
//         console.log('📦 Catálogo filtrado por Roles (Lobby):', this.lsWidgets);
//     }

//     async cargarLayoutInicial(): Promise<void> {
//         const layoutPorDefecto = [
//             { type: 'WDG_PLAT_KPI_USUARIOS', cols: 3, rows: 2, x: 0, y: 0, pestana: 'TAB_PLAT_PRINCIPAL', visible: true, data: { tipo: 'usuarios' } },
//             { type: 'WDG_PLAT_KPI_PAQUETES', cols: 3, rows: 2, x: 3, y: 0, pestana: 'TAB_PLAT_PRINCIPAL', visible: true, data: { tipo: 'paquetes' } },
//             { type: 'WDG_PLAT_KPI_APLICACIONES', cols: 3, rows: 2, x: 6, y: 0, pestana: 'TAB_PLAT_PRINCIPAL', visible: true, data: { tipo: 'aplicaciones' } },
//             { type: 'WDG_PLAT_KPI_SUSCRIPTORES', cols: 3, rows: 2, x: 9, y: 0, pestana: 'TAB_PLAT_PRINCIPAL', visible: true, data: { tipo: 'suscriptores' } },
//             { type: 'WDG_PLAT_USUARIOS', cols: 4, rows: 3, x: 0, y: 2, pestana: 'TAB_PLAT_PRINCIPAL', visible: true },
//             { type: 'WDG_PLAT_TICKETS', cols: 8, rows: 3, x: 6, y: 2, pestana: 'TAB_PLAT_PRINCIPAL', visible: true },
//             { type: 'WDG_PLAT_PAQUETES', cols: 12, rows: 4, x: 0, y: 4, pestana: 'TAB_PLAT_PRINCIPAL', visible: true },
//             { type: 'WDG_PLAT_RENDIMIENTO', cols: 12, rows: 3, x: 0, y: 0, pestana: 'TAB_PLAT_SISTEMA', visible: true }
//         ];

//         let layoutDesdeSesion: any = null;
//         const layoutCrudoUsuario = this.usuario?.layout;

//         if (layoutCrudoUsuario) {
//             try {
//                 layoutDesdeSesion = typeof layoutCrudoUsuario === 'string'
//                     ? JSON.parse(layoutCrudoUsuario)
//                     : layoutCrudoUsuario;
//             } catch (e) {
//                 console.warn('⚠️ Error al parsear el layout de la sesión:', e);
//             }
//         }

//         if (layoutDesdeSesion && Array.isArray(layoutDesdeSesion) && layoutDesdeSesion.length > 0) {
//             this.lsLayout = layoutDesdeSesion;
//         } else {
//             const tableroState = await this._localStoragoService.getTableroLocalStorage() || {};
//             if (tableroState.layout && tableroState.layout.length > 0) {
//                 this.lsLayout = tableroState.layout;
//             } else {
//                 this.lsLayout = layoutPorDefecto;
//             }
//         }
//     }

//     // ==========================================
//     // 🟢 ESCUCHA DE SOCKETS (TIEMPO REAL)
//     // ==========================================
//     // escucharCambiosWidgets(): void {
//     //     this.widgetsSub = this._socketManager.widgetsActualizados$.subscribe(async (data: any) => {

//     //         if (data.action === 'inactivado') {
//     //             // 1. Quitarlo del catálogo base (modal)
//     //             this.lsWidgets = this.lsWidgets.filter(w => w.codigoWidget !== data.codigoWidget);

//     //             // 2. Quitarlo del layout maestro del usuario
//     //             this.lsLayout = this.lsLayout.filter(l => (l.type !== data.codigoWidget) && (l.codigoWidget !== data.codigoWidget));

//     //             // 3. Expulsarlo de la vista actual del Gridster
//     //             this.dashboard = this.dashboard.filter(w => (w.type !== data.codigoWidget) && (w['codigoWidget'] !== data.codigoWidget));

//     //             // Refrescamos API Visual
//     //             if (this.options.api && this.options.api.optionsChanged) {
//     //                 this.options.api.optionsChanged();
//     //             }
//     //             this.cdr.detectChanges();

//     //             // Auto-Guardado para asentar la limpieza en BD y Memoria
//     //             this.sincronizarLayoutEnSessionStorage();
//     //             this.saveLayoutSubject.next(this.lsLayout);

//     //             console.log(`[Realtime] ${data.msg}`);
//     //             // this._swalAlertService.info(data.msg);
//     //         }

//     //         if (data.action === 'update') {
//     //             // 1. Recargar el catálogo maestro para traer nuevos nombres/imágenes
//     //             await this.cargarCatalogoWidgets();

//     //             // 2. Actualizar las propiedades del layout en memoria
//     //             this.validarActualizacionesDeWidgetsMaestro();
//     //             this.cambiarPestana(this.pestanaActiva);

//     //             console.log(`[Realtime] ${data.msg}`);
//     //             // this._swalAlertService.success(data.msg);
//     //         }
//     //     });
//     // }
//     escucharCambiosWidgets(): void {
//         // 1. Escucha general de widgets (Inactivación o Actualización global)
//         this.widgetsSub = this._socketManager.widgetsActualizados$.subscribe(async (data: any) => {

//             if (data.action === 'inactivado') {
//                 // 1. Quitarlo del catálogo base (modal)
//                 this.lsWidgets = this.lsWidgets.filter(w => w.codigoWidget !== data.codigoWidget);

//                 // 2. Quitarlo del layout maestro del usuario
//                 this.lsLayout = this.lsLayout.filter(l => (l.type !== data.codigoWidget) && (l.codigoWidget !== data.codigoWidget));

//                 // 3. Expulsarlo de la vista actual del Gridster
//                 this.dashboard = this.dashboard.filter(w => (w.type !== data.codigoWidget) && (w['codigoWidget'] !== data.codigoWidget));

//                 // Refrescamos API Visual
//                 if (this.options.api && this.options.api.optionsChanged) {
//                     this.options.api.optionsChanged();
//                 }
//                 this.cdr.detectChanges();

//                 // Auto-Guardado para asentar la limpieza en BD y Memoria
//                 this.sincronizarLayoutEnSessionStorage();
//                 this.saveLayoutSubject.next(this.lsLayout);

//                 console.log(`[Realtime] ${data.msg}`);
//             }

//             if (data.action === 'update') {
//                 // 1. Recargar el catálogo maestro para traer nuevos nombres/imágenes
//                 await this.cargarCatalogoWidgets();

//                 // 2. Actualizar las propiedades del layout en memoria
//                 this.validarActualizacionesDeWidgetsMaestro();
//                 this.cambiarPestana(this.pestanaActiva);

//                 console.log(`[Realtime] ${data.msg}`);
//             }
//         });

//         this.subs.add(
//             this._socketManager.layoutActualizado$.subscribe((data: any) => {
//                 if (data.action === 'layout-limpiado') {
//                     console.log('HOLAAAAAAAAA HPPPPPPPPPP');

//                     console.log('🔄 [Realtime] Layout personal sincronizado por el servidor:', data);

//                     // Reemplazamos directamente con el layout limpio que mandó el backend
//                     this.lsLayout = data.nuevoLayout;

//                     // Actualizamos la sesión en almacenamiento local/sesión
//                     if (this.usuario) {
//                         this.usuario.layout = JSON.stringify(this.lsLayout);
//                         console.log('nuevo layout');

//                         this.sincronizarLayoutEnSessionStorage();
//                     }

//                     // Refrescamos la pestaña actual para que el Gridster pinte el cambio al instante
//                     this.cambiarPestana(this.pestanaActiva);
//                 }
//             })
//         );
//     }

//     // ==========================================
//     // 🟢 MÉTODOS DE GRIDSTER Y LAYOUT
//     // ==========================================
//     iniciarConfiguracionGridster() {
//         this.options = {
//             gridType: GridType.ScrollVertical,
//             margin: 16,
//             outerMargin: false,
//             minCols: 12, maxCols: 12,
//             minRows: 1, maxRows: 100,
//             fixedRowHeight: 120,
//             pushItems: true,
//             swap: true,
//             compactType: 'compactUp&Left',
//             defaultItemCols: 4, defaultItemRows: 3,
//             displayGrid: 'onDrag&Resize',
//             draggable: { enabled: !this.tableroBloqueado },
//             resizable: { enabled: !this.tableroBloqueado },
//             mobileBreakpoint: 960, keepFixedHeightInMobile: true,
//             itemResizeCallback: () => {
//                 this.hayCambiosSinGuardar = true;
//                 this.sincronizarDashboardAMaestro();
//                 this.saveLayoutSubject.next(this.lsLayout);
//             },
//             itemChangeCallback: () => {
//                 this.hayCambiosSinGuardar = true;
//                 this.sincronizarDashboardAMaestro();
//                 this.saveLayoutSubject.next(this.lsLayout);
//             }
//         };
//     }

//     validarActualizacionesDeWidgetsMaestro(): void {
//         let huboCambios = false;
//         const layoutFiltrado: any[] = [];

//         this.lsLayout.forEach(itemLayout => {
//             const widgetMaestro = this.lsWidgets.find((w: any) => w.codigoWidget === itemLayout.type);

//             if (!widgetMaestro) {
//                 huboCambios = true;
//                 console.log(`🚫 Widget ${itemLayout.type} expulsado del tablero (Sin permisos o Inactivo).`);
//                 return;
//             }

//             if ((itemLayout.version || 1) < (widgetMaestro.layoutVersion || 1)) {
//                 itemLayout.cols = widgetMaestro.defaultCols;
//                 itemLayout.rows = widgetMaestro.defaultRows;
//                 itemLayout.version = widgetMaestro.layoutVersion || 1;
//                 huboCambios = true;
//             }

//             layoutFiltrado.push(itemLayout);
//         });

//         this.lsLayout = layoutFiltrado;
//         if (huboCambios) {
//             this.saveLayoutSubject.next(this.lsLayout);
//         }
//     }

//     persistirLayoutEnServidor(layoutData: any[]) {
//         const codigoUsuario = this.usuario?.codigoUsuario;
//         if (!codigoUsuario) return;

//         const payload = {
//             codigoUsuario: codigoUsuario,
//             layoutData: layoutData
//         };

//         this._layoutService.saveOrUpdateLayout(payload).subscribe({
//             next: (res: any) => {
//                 if (res.ok) {
//                     this.hayCambiosSinGuardar = false;
//                     console.log('💾 Layout del usuario guardado exitosamente en el servidor.');
//                 }
//             },
//             error: (err) => console.error('❌ Error al guardar el layout en el servidor:', err)
//         });
//     }

//     // ==========================================
//     // 🟢 MÉTODOS DE PESTAÑAS Y MODALES
//     // ==========================================
//     async cambiarPestana(nuevaPestana: string) {
//         this.sincronizarDashboardAMaestro();

//         this.isLoading = true;
//         this.cargando = true;
//         this.pestanaActiva = nuevaPestana;
//         this.dashboard = [];

//         this._localStoragoService.setPestanaLocalStorage(nuevaPestana, this.usuario.codigoUsuario);

//         const layoutParaRenderizar = this.armarDashboardPorPestana(nuevaPestana);
//         const estadoActual = await this._localStoragoService.getTableroLocalStorage() || {};

//         estadoActual.layout = layoutParaRenderizar;
//         estadoActual.pestana = nuevaPestana;

//         if (typeof (this._localStoragoService as any).setTableroLocalStorage === 'function') {
//             (this._localStoragoService as any).setTableroLocalStorage(estadoActual);
//         } else {
//             localStorage.setItem('tableroState', JSON.stringify(estadoActual));
//         }

//         this.renderizarLayoutDesdeCache(layoutParaRenderizar, nuevaPestana);
//     }

//     armarDashboardPorPestana(pestana: string): any[] {
//         return this.lsLayout
//             .map(layoutItem => {
//                 const widgetConfig = this.lsWidgets.find(w => w.codigoWidget === layoutItem.type);
//                 return { ...widgetConfig, ...layoutItem };
//             })
//             .filter((item: any) => item.codigoWidget && item.pestana === pestana);
//     }

//     renderizarLayoutDesdeCache(layoutCrudo: any[], codigoDashboard: string) {
//         this.cargando = true;
//         this.dashboard = [];
//         this.options.gridType = GridType.ScrollVertical;

//         if (this.options.api && this.options.api.optionsChanged) {
//             this.options.api.optionsChanged();
//         }
//         this.cdr.detectChanges();

//         const layoutBase = layoutCrudo.filter((w: any) => w.visible === true || w.visible === 'true' || w.visible === 1);

//         setTimeout(() => {
//             this.dashboard = [...layoutBase].map(item => ({ ...item }));
//             this.cargando = false;
//             this.isLoading = false;

//             if (this.options.api && this.options.api.optionsChanged) {
//                 this.options.api.optionsChanged();
//             }
//             this.cdr.detectChanges();
//         }, 100);
//     }

//     sincronizarDashboardAMaestro() {
//         if (!this.dashboard || this.dashboard.length === 0) return;

//         this.dashboard.forEach(widgetEnPantalla => {
//             const index = this.lsLayout.findIndex(l => l.type === widgetEnPantalla.type);
//             if (index !== -1) {
//                 this.lsLayout[index] = { ...this.lsLayout[index], ...widgetEnPantalla };
//             } else {
//                 this.lsLayout.push({ ...widgetEnPantalla });
//             }
//         });
//     }

//     abrirLobby() {
//         this.mostrarLobby = true;
//         this.cdr.detectChanges();
//     }

//     actualizarWidgetDesdeLobby(evento: { codigoWidget: string, seleccionado: boolean }) {
//         const { codigoWidget, seleccionado } = evento;
//         const indexLayout = this.lsLayout.findIndex(l => l.type === codigoWidget || l.codigoWidget === codigoWidget);

//         if (indexLayout !== -1) {
//             this.lsLayout[indexLayout].visible = seleccionado;
//             if (seleccionado) {
//                 this.lsLayout[indexLayout].x = 0;
//                 this.lsLayout[indexLayout].y = 0;
//             }
//         } else if (seleccionado) {
//             const widgetMaster = this.lsWidgets.find(w => w.codigoWidget === codigoWidget);
//             if (widgetMaster) {
//                 this.lsLayout.push({
//                     type: widgetMaster.codigoWidget,
//                     cols: widgetMaster.defaultCols,
//                     rows: widgetMaster.defaultRows,
//                     x: 0, y: 0,
//                     pestana: this.pestanaActiva,
//                     visible: true,
//                     data: {},
//                     version: widgetMaster.layoutVersion
//                 });
//             }
//         }

//         const layoutActualizado = this.armarDashboardPorPestana(this.pestanaActiva);
//         this.dashboard = [...layoutActualizado].filter(w => w.visible === true || w.visible === 'true' || w.visible === 1);

//         if (this.options.api && this.options.api.optionsChanged) {
//             this.options.api.optionsChanged();
//         }
//         this.cdr.detectChanges();

//         if (this.usuario) {
//             this.usuario.layout = JSON.stringify(this.lsLayout);
//             this.sincronizarLayoutEnSessionStorage();
//         }

//         this.hayCambiosSinGuardar = true;
//         this.saveLayoutSubject.next(this.lsLayout);
//     }

//     private sincronizarLayoutEnSessionStorage() {
//         try {
//             const keysToUpdate = ['currentUser'];
//             for (const key of keysToUpdate) {
//                 const rawData = sessionStorage.getItem(key) || localStorage.getItem(key);
//                 if (rawData) {
//                     const parsed = JSON.parse(rawData);

//                     if (parsed && parsed.usuario) {
//                         parsed.usuario.layout = JSON.stringify(this.lsLayout);
//                         if (sessionStorage.getItem(key)) sessionStorage.setItem(key, JSON.stringify(parsed));
//                         else localStorage.setItem(key, JSON.stringify(parsed));
//                         break;
//                     }
//                     else if (parsed && parsed.codigoUsuario) {
//                         parsed.layout = JSON.stringify(this.lsLayout);
//                         if (sessionStorage.getItem(key)) sessionStorage.setItem(key, JSON.stringify(parsed));
//                         else localStorage.setItem(key, JSON.stringify(parsed));
//                         break;
//                     }
//                 }
//             }
//         } catch (e) {
//             console.warn('⚠️ No se pudo actualizar el layout en la sesión:', e);
//         }
//     }

//     // ==========================================
//     // 🟢 UTILIDADES
//     // ==========================================
//     toggleBloqueoGridster() {
//         this.tableroBloqueado = !this.tableroBloqueado;
//         if (this.options.draggable && this.options.resizable) {
//             this.options.draggable.enabled = !this.tableroBloqueado;
//             this.options.resizable.enabled = !this.tableroBloqueado;
//         }
//         if (this.options.api && this.options.api.optionsChanged) {
//             this.options.api.optionsChanged();
//         }
//     }

//     ingresarQplusWeb(): void {
//         this.router.navigate(['/websites/plataforma']);
//     }

//     cerrarModalEnfoque() {
//         this.widgetEnfoque = null;
//         this._torreService.cerrarModoEnfoque();
//     }

//     toggleNav(): void {
//         this.toggleSidebar.emit();
//     }

//     trackByWidget(index: number, widget: any): string {
//         return widget.codigoWidget || widget.type;
//     }
// }
/* eslint-disable @typescript-eslint/no-this-alias */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { ChangeDetectorRef, Component, EventEmitter, OnInit, OnDestroy, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Observable, Subject, Subscription, firstValueFrom } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { DataTablesModule } from 'angular-datatables';
import { GridsterConfig, GridsterItem, GridType, GridsterComponent, GridsterItemComponent } from 'angular-gridster2';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

// Servicios y Modelos
import { SharedModule } from 'src/app/theme/shared/shared.module';
import { PTLSitiosAPModel } from 'src/app/theme/shared/_helpers/models/PTLSitioAP.model';
import { PTLAplicacionModel } from 'src/app/theme/shared/_helpers/models/PTLAplicacion.model';
import { PTLWidgetMaestroModel } from 'src/app/theme/shared/_helpers/models/PTLWidgetMaestro.model';
import { NavigationItem } from 'src/app/theme/shared/_helpers/models/Navigation.model';
import { GradientConfig } from 'src/app/app-config';

// Servicios Core
import { NavigationService } from 'src/app/theme/shared/service/navigation.service';
import { LocalStorageService, SocketManagerService, SwalAlertService } from 'src/app/theme/shared/service';
import { DashboardService } from 'src/app/theme/shared/service/tablero-control/dashboard.service';
import { PTLWidgetsMaestroService } from 'src/app/theme/shared/service/ptlwidgets-maestro.service';

// Componentes
import { NavBarComponent } from 'src/app/theme/layout/admin/nav-bar/nav-bar.component';
import { NavContentComponent } from 'src/app/theme/layout/admin/navigation/nav-content/nav-content.component';
import { WidgetLobbyComponent } from "src/app/plataforma/starter/home/widget-lobby/widget-lobby.component";
import { WidgetSelectorComponent } from "src/app/plataforma/starter/home/widget-selector/widget-selector.component";
import { PtlUsuariosWidgetsService } from 'src/app/theme/shared/service/ptlusuarios-widgets.service';

@Component({
    selector: 'app-home',
    standalone: true,
    imports: [CommonModule, DataTablesModule, SharedModule, TranslateModule, NavBarComponent, NavContentComponent, WidgetSelectorComponent, GridsterComponent, GridsterItemComponent, WidgetLobbyComponent],
    templateUrl: './home.component.html',
    styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit, OnDestroy {
    @Output() toggleSidebar = new EventEmitter<void>();

    //#region VARIABLES
    usuario: any = {};
    private saveLayoutSubject = new Subject<any>();
    private subs: Subscription = new Subscription();
    private widgetsSub?: Subscription;

    registrosSub?: Subscription;
    registros: PTLSitiosAPModel[] = [];
    registrosFiltrado: PTLSitiosAPModel[] = [];
    aplicaciones: PTLAplicacionModel[] = [];
    aplicacionesSub?: Subscription;
    lang: string = localStorage.getItem('lang') || '';
    tituloPagina: string = '';
    gradientConfig;
    hasFiltersSlot: boolean = false;
    menuItems$!: Observable<NavigationItem[]>;
    activeTab: 'menu' | 'filters' | 'main' = 'menu';

    public options!: GridsterConfig;
    public dashboard: Array<GridsterItem & { type: string, data: any }> = [];
    public isLoading: boolean = false;
    public mostrarLobby: boolean = false;
    public cargando: boolean = true;
    public tableroBloqueado: boolean = true;
    public widgetEnfoque: { type: string, data: any } | null = null;
    public hayCambiosSinGuardar: boolean = false;

    public lsWidgets: PTLWidgetMaestroModel[] = [];
    public lsLayout: any[] = [];
    public pestanaActiva: string = 'TAB_PLAT_PRINCIPAL';
    textoBienvenida = '';

    private readonly LAYOUT_POR_DEFECTO = [
        { type: 'WDG_PLAT_KPI_USUARIOS', cols: 3, rows: 2, x: 0, y: 0, pestana: 'TAB_PLAT_PRINCIPAL', visible: true, data: { tipo: 'usuarios' } },
        { type: 'WDG_PLAT_KPI_PAQUETES', cols: 3, rows: 2, x: 3, y: 0, pestana: 'TAB_PLAT_PRINCIPAL', visible: true, data: { tipo: 'paquetes' } },
        { type: 'WDG_PLAT_KPI_APLICACIONES', cols: 3, rows: 2, x: 6, y: 0, pestana: 'TAB_PLAT_PRINCIPAL', visible: true, data: { tipo: 'aplicaciones' } },
        { type: 'WDG_PLAT_KPI_SUSCRIPTORES', cols: 3, rows: 2, x: 9, y: 0, pestana: 'TAB_PLAT_PRINCIPAL', visible: true, data: { tipo: 'suscriptores' } },
        { type: 'WDG_PLAT_USUARIOS', cols: 4, rows: 3, x: 0, y: 2, pestana: 'TAB_PLAT_PRINCIPAL', visible: true },
        { type: 'WDG_PLAT_TICKETS', cols: 8, rows: 3, x: 6, y: 2, pestana: 'TAB_PLAT_PRINCIPAL', visible: true },
        { type: 'WDG_PLAT_PAQUETES', cols: 12, rows: 4, x: 0, y: 4, pestana: 'TAB_PLAT_PRINCIPAL', visible: true },
        { type: 'WDG_PLAT_RENDIMIENTO', cols: 12, rows: 3, x: 0, y: 0, pestana: 'TAB_PLAT_SISTEMA', visible: true }
    ];
    //#endregion VARIABLES

    constructor(
        private router: Router,
        private translate: TranslateService,
        private _localStoragoService: LocalStorageService,
        private _torreService: DashboardService,
        private _navigationService: NavigationService,
        private cdr: ChangeDetectorRef,
        private _widgetsMaestroService: PTLWidgetsMaestroService,
        private _usuariosWidgetsService: PtlUsuariosWidgetsService,
        private _socketManager: SocketManagerService,
        private _swalAlertService: SwalAlertService
    ) {
        this.gradientConfig = GradientConfig;
        this.usuario = _localStoragoService.getCurrentUserLocalStorage().usuario;
    }

    async ngOnInit() {
        this.iniciarConfiguracionGridster();
        this.escucharDatosTiempoReal();

        // Suscripción de Auto-Guardado (Debounce)
        this.subs.add(
            this.saveLayoutSubject.pipe(debounceTime(1500)).subscribe(layoutToSave => {
                this.persistirLayoutEnServidor(layoutToSave);
            })
        );

        this._navigationService.getNavigationItems();
        this.menuItems$ = this._navigationService.menuItems$;
        this.hasFiltersSlot = true;

        try {
            this.cargando = true;

            await this.cargarCatalogoWidgets();
            await this.cargarLayoutInicial();

            this.validarActualizacionesDeWidgetsMaestro();

            const tableroState = await this._localStoragoService.getTableroLocalStorage() || {};
            this.pestanaActiva = tableroState.pestana?.includes('TAB_PLAT') ? tableroState.pestana : 'TAB_PLAT_PRINCIPAL';
            this.cambiarPestana(this.pestanaActiva);

        } catch (error) {
            console.error('❌ Error al inicializar el home:', error);
            this.cargando = false;
        }

        this.subs.add(this._torreService.widgetEnfoque$.subscribe(widget => {
            this.widgetEnfoque = widget;
            this.cdr.detectChanges();
        }));

        this.escucharCambiosWidgets();
    }

    ngOnDestroy() {
        this.subs.unsubscribe();
        if (this.widgetsSub) {
            this.widgetsSub.unsubscribe();
        }
    }

    // ==========================================
    // 🟢 METODOS DE CARGA DE DATOS
    // ==========================================
    async cargarCatalogoWidgets(): Promise<void> {
        const resp = await firstValueFrom(this._widgetsMaestroService.getWidgetsActivos());
        const catalogoFresco = resp.widgets || [];

        const widgetsPermitidos = this.usuario?.widgets || [];
        const codigosPermitidos = widgetsPermitidos.map((w: any) => w.codigoWidget);

        this.lsWidgets = catalogoFresco.filter((w: any) => codigosPermitidos.includes(w.codigoWidget));
        console.log('📦 Catálogo filtrado por Roles (Lobby):', this.lsWidgets);
    }

    // ==========================================
    // 🟢 ACTUALIZACIÓN DE MÉTRICAS EN TIEMPO REAL
    // ==========================================
    escucharDatosTiempoReal(): void {
        this.subs.add(
            this._socketManager.datosTablero$.subscribe((eventoData: any) => {
                if (!eventoData || !eventoData.codigoWidget) return;

                // 1. Verificamos si el widget afectado está actualmente visible en el Gridster
                const widgetEnPantalla = this.dashboard.find(w => w.type === eventoData.codigoWidget);

                if (widgetEnPantalla) {
                    console.log(`⚡ [Live Data] Actualizando widget ${eventoData.codigoWidget}`, eventoData.payload);

                    // 2. Fusionamos la data nueva con la existente (para no borrar configuraciones previas)
                    widgetEnPantalla.data = {
                        ...widgetEnPantalla.data,
                        ...eventoData.payload
                    };

                    // 3. Notificamos a la API de Gridster y a Angular que repinten este componente
                    if (this.options.api && this.options.api.optionsChanged) {
                        this.options.api.optionsChanged();
                    }
                    this.cdr.detectChanges();
                }
            })
        );
    }

    async cargarLayoutInicial(): Promise<void> {
        // const layoutPorDefecto = [
        //     { type: 'WDG_PLAT_KPI_USUARIOS', cols: 3, rows: 2, x: 0, y: 0, pestana: 'TAB_PLAT_PRINCIPAL', visible: true, data: { tipo: 'usuarios' } },
        //     { type: 'WDG_PLAT_KPI_PAQUETES', cols: 3, rows: 2, x: 3, y: 0, pestana: 'TAB_PLAT_PRINCIPAL', visible: true, data: { tipo: 'paquetes' } },
        //     { type: 'WDG_PLAT_KPI_APLICACIONES', cols: 3, rows: 2, x: 6, y: 0, pestana: 'TAB_PLAT_PRINCIPAL', visible: true, data: { tipo: 'aplicaciones' } },
        //     { type: 'WDG_PLAT_KPI_SUSCRIPTORES', cols: 3, rows: 2, x: 9, y: 0, pestana: 'TAB_PLAT_PRINCIPAL', visible: true, data: { tipo: 'suscriptores' } },
        //     { type: 'WDG_PLAT_USUARIOS', cols: 4, rows: 3, x: 0, y: 2, pestana: 'TAB_PLAT_PRINCIPAL', visible: true },
        //     { type: 'WDG_PLAT_TICKETS', cols: 8, rows: 3, x: 6, y: 2, pestana: 'TAB_PLAT_PRINCIPAL', visible: true },
        //     { type: 'WDG_PLAT_PAQUETES', cols: 12, rows: 4, x: 0, y: 4, pestana: 'TAB_PLAT_PRINCIPAL', visible: true },
        //     { type: 'WDG_PLAT_RENDIMIENTO', cols: 12, rows: 3, x: 0, y: 0, pestana: 'TAB_PLAT_SISTEMA', visible: true }
        // ];

        try {
            const layoutDesdeBD = await firstValueFrom(this._usuariosWidgetsService.getLayoutUsuario(this.usuario.codigoUsuario));

            if (layoutDesdeBD && layoutDesdeBD.length > 0) {
                this.lsLayout = layoutDesdeBD.map((item: any) => ({
                    ...item,
                    type: item.codigoWidget
                }));
            } else {
                const tableroState = await this._localStoragoService.getTableroLocalStorage() || {};
                if (tableroState.layout && tableroState.layout.length > 0) {
                    this.lsLayout = tableroState.layout;
                } else {
                    this.lsLayout = this.LAYOUT_POR_DEFECTO;
                }

                this.saveLayoutSubject.next(this.lsLayout);
            }
        } catch (error) {
            console.error('⚠️ Error al cargar layout desde SQL. Usando default.', error);
            this.lsLayout = this.LAYOUT_POR_DEFECTO;
        }
    }

    resetearLayout() {
        if (confirm('¿Estás seguro de que deseas restablecer el tablero a su estado original? Perderás tu organización actual.')) {

            this.cargando = true;

            // 1. Matamos los widgets en pantalla para que la sincronización automática no los reviva
            this.dashboard = [];

            // 2. Clonamos el layout por defecto
            this.lsLayout = this.LAYOUT_POR_DEFECTO.map(item => ({ ...item }));

            // 3. Disparamos el guardado hacia SQL Server
            this.saveLayoutSubject.next(this.lsLayout);

            // 4. Sincronizamos la sesión en el navegador
            this.sincronizarLayoutEnSessionStorage();

            // 5. Refrescamos la vista de Gridster
            this.cambiarPestana(this.pestanaActiva);
        }
    }

    // ==========================================
    // 🟢 ESCUCHA DE SOCKETS (TIEMPO REAL)
    // ==========================================
    escucharCambiosWidgets(): void {
        this.widgetsSub = this._socketManager.widgetsActualizados$.subscribe(async (data: any) => {
            if (data.action === 'inactivado') {
                this.lsWidgets = this.lsWidgets.filter(w => w.codigoWidget !== data.codigoWidget);
                this.lsLayout = this.lsLayout.filter(l => (l.type !== data.codigoWidget) && (l.codigoWidget !== data.codigoWidget));
                this.dashboard = this.dashboard.filter(w => (w.type !== data.codigoWidget) && (w['codigoWidget'] !== data.codigoWidget));

                if (this.options.api && this.options.api.optionsChanged) {
                    this.options.api.optionsChanged();
                }
                this.cdr.detectChanges();

                this.sincronizarLayoutEnSessionStorage();
                this.saveLayoutSubject.next(this.lsLayout);

                console.log(`[Realtime] ${data.msg}`);
            }

            if (data.action === 'update') {
                await this.cargarCatalogoWidgets();
                this.validarActualizacionesDeWidgetsMaestro();
                this.cambiarPestana(this.pestanaActiva);
                console.log(`[Realtime] ${data.msg}`);
            }
        });

        this.subs.add(
            this._socketManager.layoutActualizado$.subscribe((data: any) => {
                if (data.action === 'layout-limpiado') {
                    console.log('🔄 [Realtime] Layout personal sincronizado por el servidor:', data);

                    this.lsLayout = data.nuevoLayout.map((item: any) => ({
                        ...item,
                        type: item.codigoWidget || item.type
                    }));

                    if (this.usuario) {
                        this.usuario.layout = JSON.stringify(this.lsLayout);
                        this.sincronizarLayoutEnSessionStorage();
                    }

                    this.cambiarPestana(this.pestanaActiva);
                }
            })
        );
    }

    // ==========================================
    // 🟢 MÉTODOS DE GRIDSTER Y LAYOUT
    // ==========================================
    iniciarConfiguracionGridster() {
        this.options = {
            gridType: GridType.ScrollVertical,
            margin: 16,
            outerMargin: false,
            minCols: 12, maxCols: 12,
            minRows: 1, maxRows: 100,
            fixedRowHeight: 120,
            pushItems: true,
            swap: true,
            compactType: 'compactUp&Left',
            defaultItemCols: 4, defaultItemRows: 3,
            displayGrid: 'onDrag&Resize',
            draggable: { enabled: !this.tableroBloqueado },
            resizable: { enabled: !this.tableroBloqueado },
            mobileBreakpoint: 960, keepFixedHeightInMobile: true,
            itemResizeCallback: () => {
                this.hayCambiosSinGuardar = true;
                this.sincronizarDashboardAMaestro();
                this.saveLayoutSubject.next(this.lsLayout);
            },
            itemChangeCallback: () => {
                this.hayCambiosSinGuardar = true;
                this.sincronizarDashboardAMaestro();
                this.saveLayoutSubject.next(this.lsLayout);
            }
        };
    }

    validarActualizacionesDeWidgetsMaestro(): void {
        let huboCambios = false;
        const layoutFiltrado: any[] = [];

        this.lsLayout.forEach(itemLayout => {
            const widgetMaestro = this.lsWidgets.find((w: any) => w.codigoWidget === itemLayout.type);

            if (!widgetMaestro) {
                huboCambios = true;
                console.log(`🚫 Widget ${itemLayout.type} expulsado del tablero (Sin permisos o Inactivo).`);
                return;
            }

            if ((itemLayout.version || 1) < (widgetMaestro.layoutVersion || 1)) {
                itemLayout.cols = widgetMaestro.defaultCols;
                itemLayout.rows = widgetMaestro.defaultRows;
                itemLayout.version = widgetMaestro.layoutVersion || 1;
                huboCambios = true;
            }

            layoutFiltrado.push(itemLayout);
        });

        this.lsLayout = layoutFiltrado;
        if (huboCambios) {
            this.saveLayoutSubject.next(this.lsLayout);
        }
    }

    // persistirLayoutEnServidor(layoutData: any[]) {
    //     const codigoUsuario = this.usuario?.codigoUsuario;
    //     if (!codigoUsuario) return;

    //     this._usuariosWidgetsService.guardarLayoutUsuario(codigoUsuario, layoutData).subscribe({
    //         next: (res: any) => {
    //             if (res.ok) {
    //                 this.hayCambiosSinGuardar = false;
    //                 console.log('💾 Layout SQL sincronizado exitosamente.');
    //             }
    //         },
    //         error: (err) => console.error('❌ Error al guardar el layout SQL:', err)
    //     });
    // }
    persistirLayoutEnServidor(layoutData: any[]) {
        const codigoUsuario = this.usuario?.codigoUsuario;
        if (!codigoUsuario) return;

        // 🟢 LIMPIEZA DE PAYLOAD: Extraemos estrictamente lo que va a la tabla
        const layoutLimpio = layoutData.map(item => ({
            codigoUsuario: codigoUsuario, // 🟢 Agregado para satisfacer la tabla y Joi
            codigoWidget: item.codigoWidget || item.type,
            pestana: item.pestana || 'TAB_PLAT_PRINCIPAL',
            cols: item.cols,
            rows: item.rows,
            x: item.x,
            y: item.y,
            visible: item.visible,
            codigoUsuarioCreacion: codigoUsuario,
            fechaCreacion: new Date().toISOString()
        }));

        this._usuariosWidgetsService.guardarLayoutUsuario(codigoUsuario, layoutLimpio).subscribe({
            next: (res: any) => {
                if (res.ok) {
                    this.hayCambiosSinGuardar = false;
                    console.log('💾 Layout SQL sincronizado exitosamente (Payload optimizado).');
                }
            },
            error: (err) => console.error('❌ Error al guardar el layout SQL:', err)
        });
    }

    // ==========================================
    // 🟢 MÉTODOS DE PESTAÑAS Y MODALES
    // ==========================================
    async cambiarPestana(nuevaPestana: string) {
        this.sincronizarDashboardAMaestro();

        this.isLoading = true;
        this.cargando = true;
        this.pestanaActiva = nuevaPestana;
        this.dashboard = [];

        this._localStoragoService.setPestanaLocalStorage(nuevaPestana, this.usuario.codigoUsuario);

        const layoutParaRenderizar = this.armarDashboardPorPestana(nuevaPestana);
        const estadoActual = await this._localStoragoService.getTableroLocalStorage() || {};

        estadoActual.layout = layoutParaRenderizar;
        estadoActual.pestana = nuevaPestana;

        if (typeof (this._localStoragoService as any).setTableroLocalStorage === 'function') {
            (this._localStoragoService as any).setTableroLocalStorage(estadoActual);
        } else {
            localStorage.setItem('tableroState', JSON.stringify(estadoActual));
        }

        this.renderizarLayoutDesdeCache(layoutParaRenderizar, nuevaPestana);
    }

    armarDashboardPorPestana(pestana: string): any[] {
        return this.lsLayout
            .map(layoutItem => {
                const widgetConfig = this.lsWidgets.find(w => w.codigoWidget === layoutItem.type);
                return { ...widgetConfig, ...layoutItem };
            })
            .filter((item: any) => item.codigoWidget && item.pestana === pestana);
    }

    renderizarLayoutDesdeCache(layoutCrudo: any[], codigoDashboard: string) {
        this.cargando = true;
        this.dashboard = [];
        this.options.gridType = GridType.ScrollVertical;

        if (this.options.api && this.options.api.optionsChanged) {
            this.options.api.optionsChanged();
        }
        this.cdr.detectChanges();

        const layoutBase = layoutCrudo.filter((w: any) => w.visible === true || w.visible === 'true' || w.visible === 1);

        setTimeout(() => {
            this.dashboard = [...layoutBase].map(item => ({ ...item }));
            this.cargando = false;
            this.isLoading = false;

            if (this.options.api && this.options.api.optionsChanged) {
                this.options.api.optionsChanged();
            }
            this.cdr.detectChanges();
        }, 100);
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

    abrirLobby() {
        this.mostrarLobby = true;
        this.cdr.detectChanges();
    }

    actualizarWidgetDesdeLobby(evento: { codigoWidget: string, seleccionado: boolean }) {
        const { codigoWidget, seleccionado } = evento;
        const indexLayout = this.lsLayout.findIndex(l => l.type === codigoWidget || l.codigoWidget === codigoWidget);

        if (indexLayout !== -1) {
            this.lsLayout[indexLayout].visible = seleccionado;
            if (seleccionado) {
                this.lsLayout[indexLayout].x = 0;
                this.lsLayout[indexLayout].y = 0;
            }
        } else if (seleccionado) {
            const widgetMaster = this.lsWidgets.find(w => w.codigoWidget === codigoWidget);
            if (widgetMaster) {
                this.lsLayout.push({
                    type: widgetMaster.codigoWidget,
                    cols: widgetMaster.defaultCols,
                    rows: widgetMaster.defaultRows,
                    x: 0, y: 0,
                    pestana: this.pestanaActiva,
                    visible: true,
                    data: {},
                    version: widgetMaster.layoutVersion
                });
            }
        }

        const layoutActualizado = this.armarDashboardPorPestana(this.pestanaActiva);
        this.dashboard = [...layoutActualizado].filter(w => w.visible === true || w.visible === 'true' || w.visible === 1);

        if (this.options.api && this.options.api.optionsChanged) {
            this.options.api.optionsChanged();
        }
        this.cdr.detectChanges();

        if (this.usuario) {
            this.usuario.layout = JSON.stringify(this.lsLayout);
            this.sincronizarLayoutEnSessionStorage();
        }

        this.hayCambiosSinGuardar = true;
        this.saveLayoutSubject.next(this.lsLayout);
    }

    private sincronizarLayoutEnSessionStorage() {
        try {
            const keysToUpdate = ['currentUser'];
            for (const key of keysToUpdate) {
                const rawData = sessionStorage.getItem(key) || localStorage.getItem(key);
                if (rawData) {
                    const parsed = JSON.parse(rawData);

                    // 🟢 Reemplazamos el JSON.stringify por el arreglo nativo directo
                    if (parsed && parsed.usuario) {
                        parsed.usuario.layout = this.lsLayout;
                        if (sessionStorage.getItem(key)) sessionStorage.setItem(key, JSON.stringify(parsed));
                        else localStorage.setItem(key, JSON.stringify(parsed));
                        break;
                    }
                    else if (parsed && parsed.codigoUsuario) {
                        parsed.layout = this.lsLayout;
                        if (sessionStorage.getItem(key)) sessionStorage.setItem(key, JSON.stringify(parsed));
                        else localStorage.setItem(key, JSON.stringify(parsed));
                        break;
                    }
                }
            }
        } catch (e) {
            console.warn('⚠️ No se pudo actualizar el layout en la sesión:', e);
        }
    }

    // ==========================================
    // 🟢 UTILIDADES
    // ==========================================
    toggleBloqueoGridster() {
        this.tableroBloqueado = !this.tableroBloqueado;
        if (this.options.draggable && this.options.resizable) {
            this.options.draggable.enabled = !this.tableroBloqueado;
            this.options.resizable.enabled = !this.tableroBloqueado;
        }
        if (this.options.api && this.options.api.optionsChanged) {
            this.options.api.optionsChanged();
        }
    }

    ingresarQplusWeb(): void {
        this.router.navigate(['/websites/plataforma']);
    }

    cerrarModalEnfoque() {
        this.widgetEnfoque = null;
        this._torreService.cerrarModoEnfoque();
    }

    toggleNav(): void {
        this.toggleSidebar.emit();
    }

    trackByWidget(index: number, widget: any): string {
        return widget.codigoWidget || widget.type;
    }
}
