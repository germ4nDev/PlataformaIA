// // /*
// //     Author: German Valencia
// //     Pattern: PORTTOS Orchestrator Component - Limpieza Absoluta de Pestañas + Virtual Gate + Contenedores
// // */
// // import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
// // import { CommonModule } from '@angular/common';
// // import { Router } from '@angular/router';
// // import { TranslateModule } from '@ngx-translate/core';
// // import { GridsterConfig, GridsterItem, GridType, GridsterComponent, GridsterItemComponent } from 'angular-gridster2';

// // import { Subscription } from 'rxjs';
// // import { debounceTime, distinctUntilChanged, filter } from 'rxjs/operators';

// // import { DashboardService } from 'src/app/theme/shared/service/tablero-control/dashboard.service';
// // import { TableroStateService } from '../../theme/shared/service/tablero-control/tablero-state.service';
// // import { FiltroTableroService } from 'src/app/theme/shared/service/tablero-control/filtro-tablero.service';
// // import { WidgetsService } from 'src/app/theme/shared/service/tablero-control/widgets.service';
// // import { MaritimoService } from 'src/app/theme/shared/service/tablero-control/maritimo.service';
// // import { VirtualGateService } from 'src/app/theme/shared/service/tablero-control/virtual-gate.service';
// // import { ContenedoresService } from 'src/app/theme/shared/service/tablero-control/contenedores.service'; // 👈 Nuevo servicio
// // import { LocalStorageService } from 'src/app/theme/shared/service';

// // import { TcHeaderComponent } from "../widgets/tc-header/tc-header.component";
// // import { WidgetSelectorComponent } from "../widgets/widget-selector/widget-selector.component";
// // import { WidgetLobbyComponent } from "../widgets/widget-lobby/widget-lobby.component";
// // import { Widget } from 'src/app/theme/shared/_helpers/models/tablero-control/widget.model';
// // import { LayoutTclService } from 'src/app/theme/shared/service/tablero-control/layout-tcl.service';

// // @Component({
// //     selector: 'app-torre-control',
// //     standalone: true,
// //     imports: [CommonModule, TranslateModule, TcHeaderComponent, GridsterComponent, GridsterItemComponent, WidgetSelectorComponent, WidgetLobbyComponent],
// //     templateUrl: './torre-control.component.html',
// //     styleUrls: ['./torre-control.component.scss']
// // })
// // export class TorreControlComponent implements OnInit, OnDestroy {
// //     public options!: GridsterConfig;
// //     public dashboard: Array<GridsterItem & { type: string, data: any }> = [];

// //     public cargando: boolean = true;
// //     public tableroBloqueado: boolean = true;
// //     public widgetEnfoque: { type: string, data: any } | null = null;
// //     public hayCambiosSinGuardar: boolean = false;
// //     public lsWidgets: Widget[] = [];
// //     public lsLayout: any[] = [];

// //     public pestanaActiva: string = '';
// //     public puertoSeleccionado: string = 'BUENAVENTURA';
// //     public usuarioId: string = '';
// //     public isLoading: boolean = false;
// //     public mostrarLobby: boolean = false;

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
// //         private _contenedoresService: ContenedoresService, // 👈 Inyectado en el constructor
// //         private _filtroService: FiltroTableroService,
// //         private _widgetsService: WidgetsService,
// //         private _localStoragoService: LocalStorageService,
// //         private _layoutService: LayoutTclService,
// //         private cdr: ChangeDetectorRef
// //     ) { }

// //     async ngOnInit() {
// //         this.iniciarConfiguracionGridster();

// //         this.lsWidgets = this._widgetsService.getWidgetsActuales();
// //         this.lsLayout = this._layoutService.getLayoutActuales();

// //         const current = this._localStoragoService.getCurrentUserLocalStorage();
// //         this.usuarioId = current?.usuario?.codigoUsuario || 'SISTEMA_DEFAULT';

// //         const tableroState = await this._localStoragoService.getTableroLocalStorage();
// //         this.pestanaActiva = tableroState.pestana || 'TLC_MARITIMO_001';
// //         this._localStoragoService.setPuertoLocalStorage(this.puertoSeleccionado);

// //         // 2. Ejecutamos el cambio de pestaña inicial (Esto hará el join y filtrado automáticamente)
// //         this.cambiarPestana(this.pestanaActiva);

// //         this.subs.add(
// //             this._filtroService.ciudad$.pipe(
// //                 distinctUntilChanged(),
// //                 debounceTime(300),
// //                 filter(puerto => !!puerto)
// //             ).subscribe(async (puerto: any) => {
// //                 const puertoStr = typeof puerto === 'string' ? puerto : (puerto.id_puerto || puerto.id || 'BUENAVENTURA');
// //                 this.puertoSeleccionado = puertoStr;

// //                 if (this.pestanaActiva.includes('MARITIMO')) {
// //                     this.sincronizarTorreMaritima(puertoStr);
// //                 } else if (this.pestanaActiva.includes('VIRTUAL_GATE')) {
// //                     this.sincronizarVirtualGate(puertoStr);
// //                 } else if (this.pestanaActiva.includes('CONTENEDORES')) { // 👈 Regla para Contenedores
// //                     this.sincronizarContenedores(puertoStr);
// //                 } else if (!this.pestanaActiva.includes('MAPA')) {
// //                     this._stateService.inyectarDatosVivos(puertoStr, this.dashboard);
// //                 }
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

// //     armarDashboardPorPestana(pestana: string): any[] {
// //         return this.lsLayout
// //             .map(layoutItem => {
// //                 const widgetConfig = this.lsWidgets.find(w => w.codigo_widget === layoutItem.type);

// //                 return {
// //                     ...widgetConfig,
// //                     ...layoutItem
// //                 };
// //             })
// //             .filter((item: any) => item.codigo_widget && item.pestana === pestana);
// //     }

// //     async cambiarPestana(nuevaPestana: string) {
// //         this.sincronizarDashboardAMaestro();

// //         if (this.hayCambiosSinGuardar) {
// //             this.guardarConfiguracionTablero();
// //         }

// //         this.isLoading = true;
// //         this.cargando = true;
// //         this.pestanaActiva = nuevaPestana;
// //         this.dashboard = [];

// //         this._localStoragoService.setPestanaLocalStorage(nuevaPestana, this.usuarioId);

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

// //     sincronizarDashboardAMaestro() {
// //         if (!this.dashboard || this.dashboard.length === 0) return;

// //         this.dashboard.forEach(widgetEnPantalla => {
// //             // Buscamos el widget original en el maestro comparando el type
// //             const index = this.lsLayout.findIndex(l => l.type === widgetEnPantalla.type);

// //             if (index !== -1) {
// //                 // Si ya existe, reemplazamos todo el objeto en el maestro.
// //                 // Fusionamos lo que ya tenía con TODAS las propiedades nuevas del widget en pantalla.
// //                 this.lsLayout[index] = { ...this.lsLayout[index], ...widgetEnPantalla };
// //             } else {
// //                 // Si NO existe (ej. un widget recién agregado desde el Lobby),
// //                 // insertamos el objeto completo directamente en el arreglo maestro.
// //                 this.lsLayout.push({ ...widgetEnPantalla });
// //             }
// //         });
// //     }

// //     renderizarLayoutDesdeCache(layoutCrudo: any[], codigoDashboard: string) {
// //         this.cargando = true;
// //         const esMaritimo = codigoDashboard.includes('MARITIMO');
// //         const esVirtualGate = codigoDashboard.includes('VIRTUAL_GATE');
// //         const esContenedores = codigoDashboard.includes('CONTENEDORES');
// //         const esMapa = codigoDashboard.includes('MAPA');

// //         this.dashboard = [];
// //         this.options.gridType = esMapa ? GridType.Fit : GridType.ScrollVertical;
// //         if (this.options.api && this.options.api.optionsChanged) {
// //             this.options.api.optionsChanged();
// //         }
// //         this.cdr.detectChanges();

// //         let layoutBase: any[] = [];

// //         if (esMapa) {
// //             layoutBase = layoutCrudo.filter((w: any) => w.type === 'WDG_MAPA_LOGISTICO' || w.type === 'MAPA');
// //             if (layoutBase.length === 0) {
// //                 layoutBase = [{ type: 'WDG_MAPA_LOGISTICO', cols: 12, rows: 5, x: 0, y: 0, visible: true }];
// //             } else {
// //                 layoutBase.forEach((w: any) => { w.cols = 12; w.rows = 5; w.x = 0; w.y = 0; });
// //             }
// //         }
// //         else {
// //             layoutBase = layoutCrudo.filter((w: any) =>
// //                 !['TERMINAL_INDIVIDUAL', 'WDG_TERMINAL_INDIVIDUAL', 'WDG_FANTASMA', 'BORRAR_ME', 'WDG_MAPA_LOGISTICO', 'MAPA'].includes(w.type) &&
// //                 !(w.codigo_widget && w.codigo_widget.includes('TERM_DINAMICO')) &&
// //                 !(w.codigo_widget && w.codigo_widget.includes('FANTASMA'))
// //             );
// //         }

// //         layoutBase = layoutBase.filter((w: any) => w.visible === true || w.visible === 'true' || w.visible === 1);

// //         setTimeout(() => {
// //             if (esMapa) {
// //                 this.dashboard = [...layoutBase];
// //                 this.cargando = false;
// //                 this.isLoading = false;
// //                 if (this.options.api && this.options.api.optionsChanged) this.options.api.optionsChanged();
// //                 this.cdr.detectChanges();
// //             }
// //             else if (esMaritimo) {
// //                 const esqueletosTerminales = Array.from({ length: 6 }).map((_, index) => ({
// //                     codigo_widget: 'WDG_TERM_DINAMICO_' + index, type: 'WDG_TERMINAL_INDIVIDUAL',
// //                     cols: 4, rows: 2, x: (index % 3) * 4, y: index < 3 ? 1 : 3, data: null
// //                 }));

// //                 this.dashboard = [...layoutBase, ...esqueletosTerminales].map(item => ({ ...item }));
// //                 if (this.options.api && this.options.api.optionsChanged) this.options.api.optionsChanged();

// //                 this.sincronizarTorreMaritima(this.puertoSeleccionado);
// //             }
// //             else if (esVirtualGate) {
// //                 // Aquí ya no necesitas filtrar, layoutBase ya viene limpio
// //                 this.dashboard = [...layoutBase].map(item => ({ ...item }));
// //                 console.log('✅ Dashboard renderizado (solo widgets visibles):', this.dashboard);

// //                 if (this.options.api && this.options.api.optionsChanged) this.options.api.optionsChanged();

// //                 this.sincronizarVirtualGate(this.puertoSeleccionado);
// //             }
// //             else if (esContenedores) {
// //                 this.dashboard = [...layoutBase].map(item => ({ ...item }));
// //                 if (this.options.api && this.options.api.optionsChanged) this.options.api.optionsChanged();

// //                 this.sincronizarContenedores(this.puertoSeleccionado);
// //             }
// //             else {
// //                 this.dashboard = [...layoutBase].map(item => ({ ...item }));
// //                 this.cargando = false;
// //                 this.isLoading = false;
// //                 if (this.options.api && this.options.api.optionsChanged) this.options.api.optionsChanged();
// //                 this.cdr.detectChanges();
// //             }
// //         }, 100);
// //     }

// //     async cargarDatosDelPuerto(nuevoPuerto: any) {
// //         const puertoLimpio = nuevoPuerto?.target?.value || nuevoPuerto?.id || nuevoPuerto;
// //         this.puertoSeleccionado = puertoLimpio;

// //         if (this.options.api && this.options.api.optionsChanged) {
// //             this.options.draggable!.enabled = false;
// //             this.options.resizable!.enabled = false;
// //         }

// //         if (this.pestanaActiva.includes('MARITIMO')) {
// //             this.sincronizarTorreMaritima(this.puertoSeleccionado);
// //         } else if (this.pestanaActiva.includes('VIRTUAL_GATE')) {
// //             this.sincronizarVirtualGate(this.puertoSeleccionado);
// //         } else if (this.pestanaActiva.includes('CONTENEDORES')) { // 👈 Regla para Contenedores
// //             this.sincronizarContenedores(this.puertoSeleccionado);
// //         } else if (!this.pestanaActiva.includes('MAPA')) {
// //             this._stateService.inyectarDatosVivos(this.puertoSeleccionado, this.dashboard);
// //         }
// //     }

// //     sincronizarTorreMaritima(puerto: string) {
// //         if (!this.dashboard || this.dashboard.length === 0) return;
// //         this.cargando = true;
// //         this.cdr.detectChanges();

// //         this._maritimoService.obtenerResumenOperativo(puerto).subscribe({
// //             next: (res: any) => {
// //                 if (res && res.success && res.data) {
// //                     this.dashboard = [...this._hidratarWidgetsConDatos(this.dashboard, res.data)];
// //                     this.cargando = false;
// //                     this.isLoading = false;
// //                     if (this.options.api && this.options.api.optionsChanged) this.options.api.optionsChanged();
// //                     this.cdr.detectChanges();
// //                 }
// //             },
// //             error: (err) => {
// //                 console.error("❌ Error API Marítimo:", err);
// //                 this.cargando = false;
// //                 this.isLoading = false;
// //                 this.cdr.detectChanges();
// //             }
// //         });
// //     }

// //     sincronizarVirtualGate(puerto: string) {
// //         if (!this.dashboard || this.dashboard.length === 0) {
// //             this.cargando = false;
// //             this.isLoading = false;
// //             this.cdr.detectChanges();
// //             return;
// //         }

// //         this.cargando = true;
// //         this.cdr.detectChanges();

// //         this._virtualGateService.obtenerColaGate().subscribe({
// //             next: (res: any) => {
// //                 if (res && res.data) {
// //                     this.dashboard = this.dashboard.map(widget => {
// //                         let widgetData = {
// //                             ...widget.data,
// //                             resumen: res.data.resumen,
// //                             citas: res.data.citas
// //                         };

// //                         if (widget.type && widget.type.startsWith('KPI_')) {
// //                             switch (widget.type) {
// //                                 case 'KPI_GATE_OP':
// //                                     widgetData = { titulo: 'CAMIONES EN PUERTO', valor: res.data.resumen.totalCamiones || 0, subtitulo: 'ZONA URBANA BUENAVENTURA', color: '#4dabf7', colorBorde: 'borde-cyan' };
// //                                     break;
// //                                 case 'KPI_GATE_CONT':
// //                                     widgetData = { titulo: 'CONTENEDORES DÍA', valor: '2.847', subtitulo: 'FCL 1.900 · LCL 500 · Reefer 447', color: '#22b8cf', colorBorde: 'borde-amarillo' };
// //                                     break;
// //                                 case 'KPI_GATE_GRANEL':
// //                                     widgetData = { titulo: 'GRANEL - TONS DÍA', valor: '38.4K', subtitulo: 'Agrícola 20K · Mineral 18.4K', color: '#fd7e14', colorBorde: 'borde-rojo' };
// //                                     break;
// //                                 case 'KPI_GATE_SUELTA':
// //                                     widgetData = { titulo: 'CARGA SUELTA - TM', valor: '4.820', subtitulo: 'Break-bulk 3.000 · Paletizada 1.820', color: '#fcc419', colorBorde: 'borde-green' };
// //                                     break;
// //                                 case 'KPI_GATE_RORO':
// //                                     widgetData = { titulo: 'VEHÍCULOS RO-RO', valor: '1.142', subtitulo: 'Imp 800 · Exp 342 · PDI 85%', color: '#20c997', colorBorde: 'borde-fucsia' };
// //                                     break;
// //                                 case 'KPI_GATE_BODEGAS':
// //                                     widgetData = { titulo: 'SATURACIÓN BODEGAS', valor: '72%', subtitulo: '5 bodegas · 1 crítica · ruteo activo', color: '#cc5de8', colorBorde: 'borde-purple' };
// //                                     break;
// //                                 case 'KPI_SUB_CONT':
// //                                     widgetData = { titulo: 'SUB - CONTENEDORES', valor: 42, subtitulo: 'Retiros y devoluciones', color: '#868e96', colorBorde: 'borde-naranja' };
// //                                     break;
// //                                 case 'KPI_SUB_GRANEL':
// //                                     widgetData = { titulo: 'SUB - GRANEL', valor: 28, subtitulo: 'Flujo hacia silos', color: '#868e96', colorBorde: 'borde-indigo' };
// //                                     break;
// //                                 case 'KPI_SUB_SUELTA':
// //                                     widgetData = { titulo: 'SUB - CARGA SUELTA', valor: 11, subtitulo: 'Operación en bodega', color: '#868e96', colorBorde: 'borde-purple' };
// //                                     break;
// //                                 case 'KPI_SUB_NINERAS':
// //                                     widgetData = { titulo: 'SUB - NIÑERAS', valor: 6, subtitulo: 'Trasiego a patios', color: '#868e96', colorBorde: 'borde-cyan' };
// //                                     break;
// //                             }
// //                         }
// //                         return { ...widget, data: widgetData };
// //                     });
// //                 }

// //                 this.cargando = false;
// //                 this.isLoading = false;
// //                 if (this.options.api && this.options.api.optionsChanged) this.options.api.optionsChanged();
// //                 this.cdr.detectChanges();
// //             },
// //             error: (err) => {
// //                 console.error("❌ Error API Virtual Gate:", err);
// //                 this.cargando = false;
// //                 this.isLoading = false;
// //                 this.cdr.detectChanges();
// //             }
// //         });
// //     }

// //     sincronizarContenedores(puerto: string) {
// //         console.log('sincronizando el panes de contenedores', puerto);

// //         if (!this.dashboard || this.dashboard.length === 0) {
// //             this.cargando = false;
// //             this.isLoading = false;
// //             this.cdr.detectChanges();
// //             return;
// //         }

// //         this.cargando = true;
// //         this.cdr.detectChanges();

// //         // Puedes cambiar obtenerDashboardContenedores() por obtenerDatosContenedores() si así lo llamaste en el servicio
// //         this._contenedoresService.obtenerDashboardContenedores().subscribe({
// //             next: (res: any) => {
// //                 if (res && res.data) {

// //                     this.dashboard = this.dashboard.map(widget => {
// //                         let widgetData = { ...widget.data };
// //                         console.log('datos widget', widgetData);

// //                         // Asignamos la data correspondiente a cada Widget de Contenedores
// //                         switch (widget.type) {
// //                             case 'KPI_CONT_CARGADOS':
// //                                 widgetData = { titulo: 'CARGADOS PENDIENTES', valor: res.data.kpis.cargadosPendientes?.valor, subtitulo: res.data.kpis.cargadosPendientes?.subtitulo, color: res.data.kpis.cargadosPendientes?.color, colorBorde: 'borde-cyan' };
// //                                 break;
// //                             case 'KPI_CONT_VACIOS':
// //                                 widgetData = { titulo: 'VACÍOS POR DEVOLVER', valor: res.data.kpis.vaciosDevolver?.valor, subtitulo: res.data.kpis.vaciosDevolver?.subtitulo, color: res.data.kpis.vaciosDevolver?.color, colorBorde: 'borde-naranja' };
// //                                 break;
// //                             case 'KPI_CONT_REEFER':
// //                                 widgetData = { titulo: 'REEFER ACTIVOS', valor: res.data.kpis.reeferActivos?.valor, subtitulo: res.data.kpis.reeferActivos?.subtitulo, color: res.data.kpis.reeferActivos?.color, colorBorde: 'borde-teal' };
// //                                 break;
// //                             case 'KPI_CONT_FREETIME':
// //                                 widgetData = { titulo: 'FREE TIME VENCIDO', valor: res.data.kpis.freeTimeVencido?.valor, subtitulo: res.data.kpis.freeTimeVencido?.subtitulo, color: res.data.kpis.freeTimeVencido?.color, colorBorde: 'borde-blue' };
// //                                 break;
// //                             case 'WDG_CONT_RETIROS':
// //                                 widgetData = res.data.retirosPriorizacion;
// //                                 break;
// //                             case 'WDG_CONT_NAVIERA':
// //                                 widgetData = res.data.vaciosNaviera;
// //                                 break;
// //                             case 'WDG_CONT_PATIOS':
// //                                 widgetData = res.data.saturacionPatios;
// //                                 break;
// //                             case 'WDG_CONT_FREETIME_CHART':
// //                                 widgetData = res.data.freeTimeDistribucion;
// //                                 break;
// //                             case 'WDG_CONT_TABLA':
// //                                 widgetData = res.data.movimientos;
// //                                 break;
// //                         }
// //                         console.log('datos del widget', widgetData);

// //                         return { ...widget, data: widgetData };
// //                     });

// //                     this.cargando = false;
// //                     this.isLoading = false;
// //                     if (this.options.api && this.options.api.optionsChanged) this.options.api.optionsChanged();
// //                     this.cdr.detectChanges();
// //                 }
// //             },
// //             error: (err) => {
// //                 console.error("❌ Error API Contenedores:", err);
// //                 this.cargando = false;
// //                 this.isLoading = false;
// //                 this.cdr.detectChanges();
// //             }
// //         });
// //     }

// //     private _hidratarWidgetsConDatos(layoutOriginal: any[], dataReal: any): any[] {
// //         const estaticos = layoutOriginal.filter(w =>
// //             !['TERMINAL_INDIVIDUAL', 'WDG_TERMINAL_INDIVIDUAL', 'WDG_FANTASMA', 'BORRAR_ME', 'WDG_MAPA_LOGISTICO', 'MAPA'].includes(w.type) &&
// //             !(w.codigo_widget && w.codigo_widget.includes('TERM_DINAMICO'))
// //         );

// //         const arrTerminales = dataReal.WDG_TERMINALES || dataReal.KPI_TERMINALES || [];
// //         const numTerminales = arrTerminales.length;
// //         const filasTerminales = Math.ceil(numTerminales / 3) * 2;
// //         const inicioEstaticos = 1 + filasTerminales;

// //         const estaticosAbajo = estaticos.filter(w => w.y > 0);
// //         const minYActual = estaticosAbajo.length > 0 ? Math.min(...estaticosAbajo.map(w => w.y)) : inicioEstaticos;
// //         const shiftY = inicioEstaticos - minYActual;

// //         const nuevoLayout = estaticos.map(widget => {
// //             let nuevaPosicionY = widget.y;
// //             if (widget.y > 0) nuevaPosicionY += shiftY;
// //             const tipo = widget.type?.trim().toUpperCase();
// //             if (dataReal[tipo]) return { ...widget, y: nuevaPosicionY, data: { ...(widget.data || {}), ...dataReal[tipo] } };
// //             return { ...widget, y: nuevaPosicionY };
// //         });

// //         const widgetsTerminales = arrTerminales.map((termData: any, index: number) => ({
// //             codigo_widget: 'WDG_TERM_DINAMICO_' + index, type: 'WDG_TERMINAL_INDIVIDUAL',
// //             cols: 4, rows: 2, x: (index % 3) * 4, y: 1 + Math.floor(index / 3) * 2, data: termData
// //         }));

// //         const fantasmas = [];
// //         const faltantes = (3 - (numTerminales % 3)) % 3;
// //         if (numTerminales > 0 && faltantes > 0) {
// //             const ultimaFilaY = 1 + Math.floor((numTerminales - 1) / 3) * 2;
// //             let currentX = (numTerminales % 3) * 4;
// //             for (let i = 0; i < faltantes; i++) {
// //                 fantasmas.push({
// //                     codigo_widget: 'WDG_FANTASMA_' + i, type: 'WDG_FANTASMA',
// //                     cols: 4, rows: 2, x: currentX, y: ultimaFilaY,
// //                     dragEnabled: false, resizeEnabled: false, compactEnabled: false
// //                 });
// //                 currentX += 4;
// //             }
// //         }
// //         return [...nuevoLayout, ...widgetsTerminales, ...fantasmas];
// //     }

// //     iniciarConfiguracionGridster() {
// //         this.options = {
// //             gridType: GridType.ScrollVertical, margin: 16, outerMargin: false,
// //             minCols: 12, maxCols: 12, minRows: 1, maxRows: 100, fixedRowHeight: 160,
// //             pushItems: false, swap: true, compactType: 'compactUp',
// //             defaultItemCols: 4, defaultItemRows: 3, displayGrid: 'onDrag&Resize',
// //             draggable: { enabled: !this.tableroBloqueado }, resizable: { enabled: !this.tableroBloqueado },
// //             mobileBreakpoint: 960, keepFixedHeightInMobile: true,
// //             itemResizeCallback: () => { this.hayCambiosSinGuardar = true; },
// //             itemChangeCallback: () => { this.hayCambiosSinGuardar = true; }
// //         };
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
// //         const usuarioPrueba = this.usuarioId || 'SISTEMA_DEFAULT';
// //         const widgetsAguardar = this.dashboard.filter(w => w.type !== 'BORRAR_ME');
// //         this._widgetsService.guardarDisposicion(usuarioPrueba, widgetsAguardar).subscribe({
// //             next: () => { this.hayCambiosSinGuardar = false; }
// //         });
// //     }

// //     cerrarModalEnfoque() {
// //         this.widgetEnfoque = null;
// //         this._torreService.cerrarModoEnfoque();
// //     }

// //     inyectarNuevoWidgetAlTablero(widgetCatalogo: any) {
// //         this.dashboard.push({
// //             codigo_widget: `WDG_CUSTOM_${new Date().getTime()}`, type: widgetCatalogo.codigo,
// //             cols: widgetCatalogo.columnas_default || 4, rows: widgetCatalogo.filas_default || 3, x: 0, y: 0, data: null
// //         });
// //         if (this.options.api && this.options.api.optionsChanged) this.options.api.optionsChanged();

// //         if (this.pestanaActiva.includes('MARITIMO')) this.sincronizarTorreMaritima(this.puertoSeleccionado);
// //         if (this.pestanaActiva.includes('VIRTUAL_GATE')) this.sincronizarVirtualGate(this.puertoSeleccionado);
// //         if (this.pestanaActiva.includes('CONTENEDORES')) this.sincronizarContenedores(this.puertoSeleccionado); // 👈 Regla aplicada al inyectar desde lobby

// //         this.hayCambiosSinGuardar = true;
// //     }

// //     trackByWidget(index: number, widget: any): string {
// //         return widget.codigo_widget || widget.type;
// //     }
// // }
// /*
//     Author: German Valencia
//     Pattern: PORTTOS Orchestrator Component - Multi-Tenant (QPLUS Unified)
//     Tabs: Marítimo | Virtual Gate | Contenedores | Mapa Logístico
// */
// import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { TranslateModule } from '@ngx-translate/core';
// import { GridsterConfig, GridsterItem, GridType, GridsterComponent, GridsterItemComponent } from 'angular-gridster2';

// import { Subscription } from 'rxjs';
// import { debounceTime, distinctUntilChanged, filter } from 'rxjs/operators';

// import { DashboardService } from 'src/app/theme/shared/service/tablero-control/dashboard.service';
// import { TableroStateService } from '../../theme/shared/service/tablero-control/tablero-state.service';
// import { FiltroTableroService } from 'src/app/theme/shared/service/tablero-control/filtro-tablero.service';
// import { PTLWidgetsMaestroService } from 'src/app/theme/shared/service/ptlwidgets-maestro.service';
// import { MaritimoService } from 'src/app/theme/shared/service/tablero-control/maritimo.service';
// import { VirtualGateService } from 'src/app/theme/shared/service/tablero-control/virtual-gate.service';
// import { ContenedoresService } from 'src/app/theme/shared/service/tablero-control/contenedores.service';
// import { LocalStorageService } from 'src/app/theme/shared/service';

// import { TcHeaderComponent } from "../widgets/tc-header/tc-header.component";
// import { WidgetSelectorTclComponent } from "../widgets/widget-selector-tcl/widget-selector-tcl.component";
// import { WidgetLobbyTclComponent } from "../widgets/widget-lobby-tcl/widget-lobby-tcl.component";
// import { Widget } from 'src/app/theme/shared/_helpers/models/tablero-control/widget.model';
// import { LayoutTclService } from 'src/app/theme/shared/service/tablero-control/layout-tcl.service';
// import { PTLWidgetMaestroModel } from 'src/app/theme/shared/_helpers/models/PTLWidgetMaestro.model';
// import { PtlpestanasService } from 'src/app/theme/shared/service/ptlpestanas.service';

// @Component({
//     selector: 'app-torre-control',
//     standalone: true,
//     imports: [CommonModule, TranslateModule, TcHeaderComponent, GridsterComponent, GridsterItemComponent, WidgetSelectorTclComponent, WidgetLobbyTclComponent],
//     templateUrl: './torre-control.component.html',
//     styleUrls: ['./torre-control.component.scss']
// })
// export class TorreControlComponent implements OnInit, OnDestroy {
//     public options!: GridsterConfig;
//     public dashboard: Array<GridsterItem & { type: string, data: any }> = [];

//     public cargando: boolean = true;
//     public tableroBloqueado: boolean = true;
//     public widgetEnfoque: { type: string, data: any } | null = null;
//     public hayCambiosSinGuardar: boolean = false;
//     public lsWidgets: Widget[] = [];
//     public lsLayout: any[] = [];
//     public widgetsParaElLobby: any[] = [];

//     public pestanaActiva: string = '';
//     public puertoSeleccionado: string = 'BUENAVENTURA';
//     public usuarioId: string = '';
//     public isLoading: boolean = false;
//     public mostrarLobby: boolean = false;

//     private readonly APP_PORTTOS_ID = '3eb98a9f-cc5d-417d-95ea-a2b8abc3b5fa';

//     public listaDePuertos: any[] = [
//         { id: 'BUENAVENTURA', nombre: 'Buenaventura (SPRBUN / TCBUEN)' },
//         { id: 'CARTAGENA', nombre: 'Cartagena (SPRC / CONTECAR)' },
//         { id: 'BARRANQUILLA', nombre: 'Barranquilla (SPRB)' },
//         { id: 'SANTAMARTA', nombre: 'Santa Marta (SPRB)' }
//     ];

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
//         private _layoutService: LayoutTclService,
//         private _pestanasService: PtlpestanasService,
//         private cdr: ChangeDetectorRef
//     ) { }

//     async ngOnInit() {
//         this.iniciarConfiguracionGridster();

// // 1. Obtenemos el contexto actual de navegación QPLUS
//         const contexto = this._localStoragoService.getContextoNavegacion();
//         const codigoSuite = contexto?.codigoSuite || 'a815687f-b9b6-4404-83dd-9a4074224320';
//         const codigoAplicacion = contexto?.codigoAplicacion || this.APP_PORTTOS_ID;

//         // 2. Traemos las pestañas dinámicas desde tu API (usando req.params)
//         this._pestanasService..obtenerPestanasDelContexto(codigoSuite, codigoAplicacion).subscribe(async (res: any) => {
//             if (res.success && res.data.length > 0) {
//                 this.lsPestanas = res.data; // Ej: [{codigoPestana: 'TLC_MARITIMO_001', nombre: 'Marítimo'...}]

//                 // Leemos si el usuario estaba en alguna pestaña, si no, lo mandamos a la primera disponible (orden 1)
//                 const tableroState = await this._localStoragoService.getTableroLocalStorage();
//                 const pestanaGuardada = tableroState.pestana;

//                 const existePestana = this.lsPestanas.find(p => p.codigoPestana === pestanaGuardada);
//                 this.pestanaActiva = existePestana ? pestanaGuardada : this.lsPestanas[0].codigoPestana;

//                 // 3. Cargamos el maestro de widgets y disparamos el renderizado
//                 this.cargarCatalogoWidgets();
//             }
//         });

//         this.lsLayout = this._layoutService.getLayoutActuales();

//         const current = this._localStoragoService.getCurrentUserLocalStorage();
//         this.usuarioId = current?.usuario?.codigoUsuario || 'SISTEMA_DEFAULT';

//         const tableroState = await this._localStoragoService.getTableroLocalStorage();
//         this.pestanaActiva = tableroState.pestana || 'TLC_MARITIMO_001';
//         this._localStoragoService.setPuertoLocalStorage(this.puertoSeleccionado);

//         this.cambiarPestana(this.pestanaActiva);

//         // Escucha cambios de puerto/ciudad
//         this.subs.add(
//             this._filtroService.ciudad$.pipe(
//                 distinctUntilChanged(),
//                 debounceTime(300),
//                 filter(puerto => !!puerto)
//             ).subscribe(async (puerto: any) => {
//                 const puertoStr = typeof puerto === 'string' ? puerto : (puerto.id_puerto || puerto.id || 'BUENAVENTURA');
//                 this.puertoSeleccionado = puertoStr;
//                 this.sincronizarDatosSegunPestana(puertoStr);
//             })
//         );

//         // Escucha eventos de enfoque
//         this.subs.add(this._torreService.widgetFocus$.subscribe(widget => {
//             this.widgetEnfoque = widget;
//             this.cdr.detectChanges();
//         }));
//     }

//     ngOnDestroy() {
//         this.subs.unsubscribe();
//     }

//     iniciarConfiguracionGridster() {
//         this.options = {
//             gridType: GridType.ScrollVertical,
//             margin: 16,
//             outerMargin: false,
//             minCols: 12, maxCols: 12, minRows: 1, maxRows: 100, fixedRowHeight: 160,

//             // 🟢 CLAVE 1: Permitir que los ítems se empujen entre sí en lugar de encimarse
//             pushItems: true,
//             swap: false,

//             // 🟢 CLAVE 2: Tipo de compactación (hacia arriba o compactLeft/compactRight)
//             compactType: 'compactUp',

//             defaultItemCols: 4, defaultItemRows: 3, displayGrid: 'onDrag&Resize',
//             draggable: { enabled: !this.tableroBloqueado },
//             resizable: { enabled: !this.tableroBloqueado },
//             mobileBreakpoint: 960, keepFixedHeightInMobile: true,
//             itemResizeCallback: () => { this.hayCambiosSinGuardar = true; },
//             itemChangeCallback: () => { this.hayCambiosSinGuardar = true; }
//         };
//     }

//     private sincronizarDatosSegunPestana(puertoStr: string) {
//         if (this.pestanaActiva.includes('MARITIMO')) {
//             this.sincronizarTorreMaritima(puertoStr);
//         } else if (this.pestanaActiva.includes('VIRTUAL_GATE')) {
//             this.sincronizarVirtualGate(puertoStr);
//         } else if (this.pestanaActiva.includes('CONTENEDORES')) {
//             this.sincronizarContenedores(puertoStr);
//         } else if (this.pestanaActiva.includes('MAPA')) {
//             // El mapa se sincroniza inyectando datos vivos (Socket/GeoJSON)
//             this._stateService.inyectarDatosVivos(puertoStr, this.dashboard);
//             this.finalizarRenderizado();
//         } else {
//             this._stateService.inyectarDatosVivos(puertoStr, this.dashboard);
//             this.finalizarRenderizado();
//         }
//     }

//     verificarYAplicarLayoutInicial(pestana: string) {
//         // 1. Verificamos si el usuario ya tiene elementos guardados en su layout para esta pestaña
//         const widgetsEnLayoutDelUsuario = this.lsLayout.filter(l => l.pestana === pestana && l.visible);

//         // 2. Si el usuario NO tiene un layout personalizado guardado, usamos los marcados con 'inicial' en la BD
//         if (widgetsEnLayoutDelUsuario.length === 0) {

//             // Filtramos del catálogo maestro los que pertenecen a la pestaña y tienen inicial = true
//             const widgetsInicialesBd = this.lsWidgets.filter((w: any) => {
//                 const pWdg = String(w.pestana || w.categoria || '').toUpperCase().trim();
//                 const esDeLaPestana = pWdg === pestana || pWdg.includes(pestana.replace('TLC_', '').replace('_001', ''));

//                 // 🟢 Validamos el booleano 'inicial' (soporta boolean o número/string por seguridad)
//                 const esInicial = w.inicial === true || w.inicial === 'true' || w.inicial === 1;

//                 return esDeLaPestana && esInicial;
//             });

//             // 3. Los inyectamos automáticamente al layout del usuario como visibles
//             widgetsInicialesBd.forEach((widgetMaster: any, index: number) => {
//                 const codigoW = widgetMaster.codigoWidget || widgetMaster.codigo_widget;

//                 // Evitamos duplicados si ya existían inactivos
//                 const existe = this.lsLayout.find(l => l.type === codigoW || l.codigoWidget === codigoW);

//                 if (existe) {
//                     existe.visible = true;
//                 } else {
//                     this.lsLayout.push({
//                         type: codigoW,
//                         codigoWidget: codigoW,
//                         cols: widgetMaster.defaultCols || widgetMaster.cols_defecto || 4,
//                         rows: widgetMaster.defaultRows || widgetMaster.rows_defecto || 3,
//                         x: (index % 3) * 4,
//                         y: Math.floor(index / 3) * 3,
//                         visible: true,
//                         pestana: pestana,
//                         version: widgetMaster.layoutVersion || 1
//                     });
//                 }
//             });
//         }
//     }

//     // filtrarWidgetsParaLobby(nuevaPestana: string) {
//     //     const pestanaLimpia = String(nuevaPestana || '').toUpperCase().replace('TLC_', '').replace('_001', '').trim();

//     //     this.widgetsParaElLobby = this.lsWidgets.filter((w: any) => {
//     //         const estadoValido = w.estadoWidget === true || w.estadoWidget === 'true' || w.estadoWidget === 1 || w.estadoWidget == null;
//     //         if (!estadoValido) return false;

//     //         const pestanaWdg = String(w.pestana || w.categoria || w.modulo || '').toUpperCase().trim();
//     //         if (pestanaWdg === '') return false;

//     //         return pestanaWdg === nuevaPestana || pestanaWdg.includes(pestanaLimpia) || pestanaLimpia.includes(pestanaWdg);
//     //     });
//     // }
//     filtrarWidgetsParaLobby(nuevaPestana: string) {
//         const pestanaLimpia = String(nuevaPestana || '')
//             .toUpperCase()
//             .replace('TLC_', '')
//             .replace('_001', '')
//             .trim(); // Ej: 'MARITIMO'

//         this.widgetsParaElLobby = (this.lsWidgets || []).filter((w: any) => {
//             // Verificamos estado activo
//             const estadoValido = w.estadoWidget === true || w.estadoWidget === 'true' || w.estadoWidget === 1 || w.estadoWidget == null;
//             if (!estadoValido) return false;

//             const pestanaWdg = String(w.pestana || w.categoria || w.modulo || '').toUpperCase().trim();

//             // 🛡️ Flexibilidad: Si el widget no tiene definida una pestaña en la BD,
//             // por defecto lo dejamos pasar para que no se quede vacío el lobby.
//             if (pestanaWdg === '') return true;

//             // Coincidencia amplia por inclusión de texto en cualquier dirección
//             const matchExacto = pestanaWdg === nuevaPestana;
//             const matchParcial = pestanaWdg.includes(pestanaLimpia) || pestanaLimpia.includes(pestanaWdg);

//             return matchExacto || matchParcial;
//         });

//         console.log(`🔍 Widgets filtrados para el lobby [${nuevaPestana}]:`, this.widgetsParaElLobby.length);
//     }

//     armarDashboardPorPestana(pestana: string): any[] {
//         return this.lsLayout
//             .map(layoutItem => {
//                 const widgetConfig = this.lsWidgets.find(w => (w as any).codigoWidget === layoutItem.type);
//                 return {
//                     ...widgetConfig,
//                     ...layoutItem
//                 };
//             })
//             .filter((item: any) => item.codigoWidget && item.pestana === pestana);
//     }

//     async cambiarPestana(nuevaPestana: string) {
//         this.sincronizarDashboardAMaestro();

//         if (this.hayCambiosSinGuardar) {
//             this.guardarConfiguracionTablero();
//         }

//         this.isLoading = true;
//         this.cargando = true;
//         this.pestanaActiva = nuevaPestana;
//         this.dashboard = [];

//         this._localStoragoService.setPestanaLocalStorage(nuevaPestana, this.usuarioId);

//         this.verificarYAplicarLayoutInicial(nuevaPestana);

//         const layoutParaRenderizar = this.armarDashboardPorPestana(nuevaPestana);
//         const estadoActual = await this._localStoragoService.getTableroLocalStorage() || {};

//         estadoActual.layout = layoutParaRenderizar;
//         estadoActual.pestana = nuevaPestana;

//         if (typeof (this._localStoragoService as any).setTableroLocalStorage === 'function') {
//             (this._localStoragoService as any).setTableroLocalStorage(estadoActual);
//         } else {
//             localStorage.setItem('tableroState', JSON.stringify(estadoActual));
//         }

//         this.filtrarWidgetsParaLobby(nuevaPestana);
//         this.renderizarLayoutDesdeCache(layoutParaRenderizar, nuevaPestana);
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

//     renderizarLayoutDesdeCache(layoutCrudo: any[], codigoDashboard: string) {
//         this.cargando = true;
//         const esMaritimo = codigoDashboard.includes('MARITIMO');
//         const esVirtualGate = codigoDashboard.includes('VIRTUAL_GATE');
//         const esContenedores = codigoDashboard.includes('CONTENEDORES');
//         const esMapa = codigoDashboard.includes('MAPA');

//         this.dashboard = [];
//         this.options.gridType = esMapa ? GridType.Fit : GridType.ScrollVertical;
//         if (this.options.api && this.options.api.optionsChanged) this.options.api.optionsChanged();
//         this.cdr.detectChanges();

//         let layoutBase: any[] = [];

//         if (esMapa) {
//             layoutBase = layoutCrudo.filter((w: any) => w.type === 'WDG_PORT_MAPA_LOGISTICO' || w.type === 'MAPA');
//             if (layoutBase.length === 0) {
//                 layoutBase = [{ type: 'WDG_PORT_MAPA_LOGISTICO', cols: 12, rows: 5, x: 0, y: 0, visible: true }];
//             } else {
//                 layoutBase.forEach((w: any) => { w.cols = 12; w.rows = 5; w.x = 0; w.y = 0; });
//             }
//         } else if (esMaritimo) {
//             this.dashboard = [...layoutBase].map(item => ({ ...item }));
//             this.sincronizarTorreMaritima(this.puertoSeleccionado);
//         } else {
//             layoutBase = layoutCrudo.filter((w: any) =>
//                 !['WDG_PORT_TERMINAL_INDIVIDUAL', 'WDG_PORT_FANTASMA', 'BORRAR_ME'].includes(w.type) &&
//                 !(w.type && w.type.includes('TERM_DINAMICO')) &&
//                 !(w.type && w.type.includes('FANTASMA'))
//             );
//         }

//         layoutBase = layoutBase.filter((w: any) => w.visible === true || w.visible === 'true' || w.visible === 1);

//         setTimeout(() => {
//             if (esMapa) {
//                 this.dashboard = [...layoutBase];
//                 this.sincronizarDatosSegunPestana(this.puertoSeleccionado);
//             } else if (esMaritimo) {
//                 const esqueletosTerminales = Array.from({ length: 6 }).map((_, index) => ({
//                     codigoWidget: 'WDG_PORT_TERM_DINAMICO_' + index, type: 'WDG_PORT_TERMINAL_INDIVIDUAL',
//                     cols: 4, rows: 2, x: (index % 3) * 4, y: index < 3 ? 1 : 3, data: null
//                 }));
//                 this.dashboard = [...layoutBase, ...esqueletosTerminales].map(item => ({ ...item }));
//                 this.sincronizarTorreMaritima(this.puertoSeleccionado);
//             } else if (esVirtualGate) {
//                 this.dashboard = [...layoutBase].map(item => ({ ...item }));
//                 this.sincronizarVirtualGate(this.puertoSeleccionado);
//             } else if (esContenedores) {
//                 this.dashboard = [...layoutBase].map(item => ({ ...item }));
//                 this.sincronizarContenedores(this.puertoSeleccionado);
//             } else {
//                 this.dashboard = [...layoutBase].map(item => ({ ...item }));
//                 this.finalizarRenderizado();
//             }
//         }, 100);
//     }

//     ensamblarTableroGenerico(
//         widgetsSistema: any[],
//         layoutUsuario: any[],
//         config = { cols: 4, rows: 2, maxColsFila: 3 }
//     ) {
//         let offsetY = 0;
//         let sistemaProcesados: any[] = [];

//         if (widgetsSistema && widgetsSistema.length > 0) {
//             sistemaProcesados = widgetsSistema.map((widget, index) => {
//                 const fila = Math.floor(index / config.maxColsFila);
//                 const columna = index % config.maxColsFila;

//                 return {
//                     codigoWidget: widget.idUnico || `WDG_SYS_DINAMICO_${index}`,
//                     type: widget.type,
//                     cols: config.cols,
//                     rows: config.rows,
//                     x: columna * config.cols,
//                     y: fila * config.rows,
//                     data: widget.data,
//                     dragEnabled: false,
//                     resizeEnabled: false
//                 };
//             });

//             offsetY = Math.ceil(widgetsSistema.length / config.maxColsFila) * config.rows;
//         }

//         const usuarioDesplazado = layoutUsuario.map(widget => ({
//             ...widget,
//             y: (widget.y || 0) + offsetY
//         }));

//         this.dashboard = [...sistemaProcesados, ...usuarioDesplazado];
//         this.finalizarRenderizado();
//     }

//     generarWidgetsDinamicosDelPuerto(terminalesReales: any[]) {
//         this.lsWidgets = this.lsWidgets.filter((w: any) => !(w.codigoWidget || '').startsWith('WDG_DINAMICO_TERM_'));
//         this.lsLayout = this.lsLayout.filter(l => !(l.type || '').startsWith('WDG_DINAMICO_TERM_'));

//         const nuevosWidgetsTerminales = terminalesReales.map((term, index) => {
//             const idUnico = `WDG_DINAMICO_TERM_${term.id_terminal || index}`;

//             return {
//                 codigoWidget: idUnico,
//                 nombreWidget: `${term.nombreTerminal || 'Desconocido'}`,
//                 descripcionWidget: `Métricas operativas en tiempo real para el terminal ${term.nombreTerminal}`,
//                 type: 'WDG_PORT_TERMINAL_INDIVIDUAL',
//                 pestana: 'TLC_MARITIMO_001',
//                 estadoWidget: true,
//                 defaultCols: 4,
//                 defaultRows: 2,
//                 imagenWidget: 'assets/images/widget-terminal.png',
//                 data: term
//             };
//         });

//         this.lsWidgets = [...this.lsWidgets, ...nuevosWidgetsTerminales];
//         this.filtrarWidgetsParaLobby(this.pestanaActiva);

//         nuevosWidgetsTerminales.forEach((nuevoWdg, index) => {
//             const fila = Math.floor(index / 3);
//             const columna = index % 3;

//             this.lsLayout.push({
//                 type: nuevoWdg.codigoWidget,
//                 codigoWidget: nuevoWdg.codigoWidget,
//                 cols: 4, rows: 2,
//                 x: columna * 4, y: fila * 2,
//                 visible: false,
//                 pestana: 'TLC_MARITIMO_001'
//             });
//         });
//     }

//     private finalizarRenderizado() {
//         this.cargando = false;
//         this.isLoading = false;
//         if (this.options.api && this.options.api.optionsChanged) this.options.api.optionsChanged();
//         this.cdr.detectChanges();
//     }

//     async cargarDatosDelPuerto(nuevoPuerto: any) {
//         const puertoLimpio = nuevoPuerto?.target?.value || nuevoPuerto?.id || nuevoPuerto;
//         this.puertoSeleccionado = puertoLimpio;

//         if (this.options.api && this.options.api.optionsChanged) {
//             this.options.draggable!.enabled = false;
//             this.options.resizable!.enabled = false;
//         }

//         this.sincronizarDatosSegunPestana(this.puertoSeleccionado);
//     }

//     sincronizarTorreMaritima(puerto: string) {
//         this.cargando = true;
//         this.cdr.detectChanges();

//         this._maritimoService.obtenerResumenOperativo(puerto).subscribe({
//             next: (res: any) => {
//                 if (res && res.success && res.data) {

//                     const terminales = res.data.WDG_TERMINALES || [];
//                     this.generarWidgetsDinamicosDelPuerto(terminales);
//                     const layoutLimpio = this.armarDashboardPorPestana(this.pestanaActiva)
//                         .filter((w: any) => w.visible === true || w.visible === 'true' || w.visible === 1);
//                     this.dashboard = this._hidratarWidgetsConDatos(layoutLimpio, res.data);

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
//         if (!this.dashboard || this.dashboard.length === 0) return this.finalizarRenderizado();
//         this.cargando = true;

//         this._virtualGateService.obtenerColaGate().subscribe({
//             next: (res: any) => {
//                 if (res && res.data) {
//                     this.dashboard = this.dashboard.map(widget => {
//                         let widgetData = { ...widget.data, resumen: res.data.resumen, citas: res.data.citas };

//                         if (widget.type && widget.type.startsWith('WDG_PORT_KPI_')) {
//                             switch (widget.type) {
//                                 case 'WDG_PORT_KPI_GATE_OP':
//                                     widgetData = { titulo: 'CAMIONES EN PUERTO', valor: res.data.resumen.totalCamiones || 0, subtitulo: 'ZONA URBANA BUENAVENTURA', color: '#4dabf7', colorBorde: 'borde-cyan' };
//                                     break;
//                                 case 'WDG_PORT_KPI_GATE_CONT':
//                                     widgetData = { titulo: 'CONTENEDORES DÍA', valor: res.data.resumen.totalContenedores || '2.847', subtitulo: 'FCL 1.900 · LCL 500 · Reefer 447', color: '#22b8cf', colorBorde: 'borde-amarillo' };
//                                     break;
//                                 case 'WDG_PORT_KPI_GATE_GRANEL':
//                                     widgetData = { titulo: 'GRANEL - TONS DÍA', valor: '38.4K', subtitulo: 'Agrícola 20K · Mineral 18.4K', color: '#fd7e14', colorBorde: 'borde-rojo' };
//                                     break;
//                                 case 'WDG_PORT_KPI_GATE_SUELTA':
//                                     widgetData = { titulo: 'CARGA SUELTA - TM', valor: '4.820', subtitulo: 'Break-bulk 3.000 · Paletizada 1.820', color: '#fcc419', colorBorde: 'borde-green' };
//                                     break;
//                                 case 'WDG_PORT_KPI_GATE_RORO':
//                                     widgetData = { titulo: 'VEHÍCULOS RO-RO', valor: '1.142', subtitulo: 'Imp 800 · Exp 342 · PDI 85%', color: '#20c997', colorBorde: 'borde-fucsia' };
//                                     break;
//                                 case 'WDG_PORT_KPI_GATE_BODEGAS':
//                                     widgetData = { titulo: 'SATURACIÓN BODEGAS', valor: '72%', subtitulo: '5 bodegas · 1 crítica · ruteo activo', color: '#cc5de8', colorBorde: 'borde-purple' };
//                                     break;
//                                 case 'WDG_PORT_KPI_SUB_CONT':
//                                     widgetData = { titulo: 'SUB - CONTENEDORES', valor: res.data.resumen.subContenedores || 42, subtitulo: 'Retiros y devoluciones', color: '#868e96', colorBorde: 'borde-naranja' };
//                                     break;
//                                 case 'WDG_PORT_KPI_SUB_GRANEL':
//                                     widgetData = { titulo: 'SUB - GRANEL', valor: 28, subtitulo: 'Flujo hacia silos', color: '#868e96', colorBorde: 'borde-indigo' };
//                                     break;
//                                 case 'WDG_PORT_KPI_SUB_SUELTA':
//                                     widgetData = { titulo: 'SUB - CARGA SUELTA', valor: 11, subtitulo: 'Operación en bodega', color: '#868e96', colorBorde: 'borde-purple' };
//                                     break;
//                                 case 'WDG_PORT_KPI_SUB_NINERAS':
//                                     widgetData = { titulo: 'SUB - NIÑERAS', valor: 6, subtitulo: 'Trasiego a patios', color: '#868e96', colorBorde: 'borde-cyan' };
//                                     break;
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
//         if (!this.dashboard || this.dashboard.length === 0) return this.finalizarRenderizado();
//         this.cargando = true;

//         this._contenedoresService.obtenerDashboardContenedores().subscribe({
//             next: (res: any) => {
//                 if (res && res.data) {
//                     this.dashboard = this.dashboard.map(widget => {
//                         let widgetData = { ...widget.data };

//                         // 🟢 NORMALIZACIÓN WDG_PORT_
//                         switch (widget.type) {
//                             case 'WDG_PORT_KPI_CONT_CARGADOS':
//                                 widgetData = { titulo: 'CARGADOS PENDIENTES', valor: res.data.kpis?.cargadosPendientes?.valor, subtitulo: res.data.kpis?.cargadosPendientes?.subtitulo, color: res.data.kpis?.cargadosPendientes?.color, colorBorde: 'borde-cyan' };
//                                 break;
//                             case 'WDG_PORT_KPI_CONT_VACIOS':
//                                 widgetData = { titulo: 'VACÍOS POR DEVOLVER', valor: res.data.kpis?.vaciosDevolver?.valor, subtitulo: res.data.kpis?.vaciosDevolver?.subtitulo, color: res.data.kpis?.vaciosDevolver?.color, colorBorde: 'borde-naranja' };
//                                 break;
//                             case 'WDG_PORT_KPI_CONT_REEFER':
//                                 widgetData = { titulo: 'REEFER ACTIVOS', valor: res.data.kpis?.reeferActivos?.valor, subtitulo: res.data.kpis?.reeferActivos?.subtitulo, color: res.data.kpis?.reeferActivos?.color, colorBorde: 'borde-teal' };
//                                 break;
//                             case 'WDG_PORT_KPI_CONT_FREETIME':
//                                 widgetData = { titulo: 'FREE TIME VENCIDO', valor: res.data.kpis?.freeTimeVencido?.valor, subtitulo: res.data.kpis?.freeTimeVencido?.subtitulo, color: res.data.kpis?.freeTimeVencido?.color, colorBorde: 'borde-blue' };
//                                 break;
//                             case 'WDG_PORT_CONT_RETIROS':
//                                 widgetData = res.data.retirosPriorizacion;
//                                 break;
//                             case 'WDG_PORT_CONT_NAVIERA':
//                                 widgetData = res.data.vaciosNaviera;
//                                 break;
//                             case 'WDG_PORT_CONT_PATIOS':
//                                 widgetData = res.data.saturacionPatios;
//                                 break;
//                             case 'WDG_PORT_CONT_FREETIME_CHART':
//                                 widgetData = res.data.freeTimeDistribucion;
//                                 break;
//                             case 'WDG_PORT_CONT_TABLA':
//                                 widgetData = res.data.movimientos;
//                                 break;
//                         }
//                         return { ...widget, data: widgetData };
//                     });
//                     this.finalizarRenderizado();
//                 }
//             },
//             error: (err) => {
//                 console.error("❌ Error API Contenedores:", err);
//                 this.finalizarRenderizado();
//             }
//         });
//     }

//     private _hidratarWidgetsConDatos(layoutOriginal: any[], dataReal: any): any[] {
//         // 🟢 Versión Limpia: Solo hidrata los widgets que realmente existen en el layout.
//         // Cero inyección forzada de terminales o fantasmas.
//         return layoutOriginal.map(widget => {
//             // Extraemos el tipo base ignorando el prefijo para hacer match con los datos de la API
//             const tipoStr = widget.type || '';
//             const tipoLimpio = tipoStr.trim().toUpperCase().replace('WDG_PORT_', '');

//             // Si la API trajo datos para este widget específico, se los inyectamos
//             if (dataReal[tipoLimpio] || dataReal[`WDG_${tipoLimpio}`]) {
//                 return {
//                     ...widget,
//                     data: {
//                         ...(widget.data || {}),
//                         ...(dataReal[tipoLimpio] || dataReal[`WDG_${tipoLimpio}`])
//                     }
//                 };
//             }

//             // Si no hay datos nuevos, devolvemos el widget tal como estaba
//             return widget;
//         });
//     }

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
//         const usuarioPrueba = this.usuarioId || 'SISTEMA_DEFAULT';
//         const widgetsAguardar = this.dashboard.filter(w => w.type !== 'BORRAR_ME' && !w.type.includes('FANTASMA'));
//         // this._widgetsService..guardarDisposicion(usuarioPrueba, widgetsAguardar).subscribe({
//         //     next: () => { this.hayCambiosSinGuardar = false; }
//         // });
//     }

//     cerrarModalEnfoque() {
//         this.widgetEnfoque = null;
//         this._torreService.cerrarModoEnfoque();
//     }

//     inyectarNuevoWidgetAlTablero(widgetCatalogo: any) {
//         // 🟢 NUEVO MODELO DE COLUMNAS: defaultCols / defaultRows
//         this.dashboard.push({
//             codigoWidget: `WDG_CUSTOM_${new Date().getTime()}`, type: widgetCatalogo.codigoWidget,
//             cols: widgetCatalogo.defaultCols || 4, rows: widgetCatalogo.defaultRows || 3, x: 0, y: 0, data: null
//         });
//         if (this.options.api && this.options.api.optionsChanged) this.options.api.optionsChanged();

//         this.sincronizarDatosSegunPestana(this.puertoSeleccionado);
//         this.hayCambiosSinGuardar = true;
//     }

//     actualizarWidgetDesdeLobby(evento: { codigoWidget: string, seleccionado: boolean }) {
//         const { codigoWidget, seleccionado } = evento;
//         const indexLayout = this.lsLayout.findIndex(l => l.type === codigoWidget || l.codigoWidget === codigoWidget);

//         if (indexLayout !== -1) {
//             this.lsLayout[indexLayout].visible = seleccionado;
//             if (seleccionado) {
//                 if (this.lsLayout[indexLayout].x === undefined || (this.lsLayout[indexLayout].x === 0 && this.lsLayout[indexLayout].y === 0)) {
//                     this.asignarPosicionLibre(this.lsLayout[indexLayout]);
//                 }
//             }
//         } else if (seleccionado) {
//             const widgetMaster = this.lsWidgets.find((w: any) => (w.codigoWidget || w.codigo_widget) === codigoWidget) as any;

//             if (widgetMaster) {
//                 const nuevoItem = {
//                     type: widgetMaster.codigoWidget || widgetMaster.codigo_widget,
//                     cols: widgetMaster.defaultCols || widgetMaster.cols_defecto || 4,
//                     rows: widgetMaster.defaultRows || widgetMaster.rows_defecto || 3,
//                     x: 0, y: 0,
//                     pestana: this.pestanaActiva,
//                     visible: true,
//                     data: { tipo: widgetMaster.tipo || widgetMaster.categoria },
//                     version: widgetMaster.layoutVersion || 1
//                 };

//                 this.asignarPosicionLibre(nuevoItem);
//                 this.lsLayout.push(nuevoItem);
//             }
//         }

//         const layoutActualizado = this.armarDashboardPorPestana(this.pestanaActiva);
//         this.dashboard = [...layoutActualizado].filter(w => w.visible === true || w.visible === 'true' || w.visible === 1);

//         if (this.options.api && this.options.api.optionsChanged) {
//             this.options.api.optionsChanged();
//         }
//         this.cdr.detectChanges();

//         this.hayCambiosSinGuardar = true;
//     }

//     asignarPosicionLibre(item: any) {
//         // Si Gridster tiene la API activa, le pedimos la siguiente posición libre
//         if (this.options && this.options.api && typeof (this.options.api as any).getNextPossiblePosition === 'function') {
//             const posLibre = (this.options.api as any).getNextPossiblePosition(item);
//             if (posLibre) {
//                 item.x = posLibre.x;
//                 item.y = posLibre.y;
//                 return;
//             }
//         }

//         const totalItems = this.dashboard.length;
//         item.x = (totalItems * 4) % 12; // Se desplaza horizontalmente en bloques de 4
//         item.y = Math.floor((totalItems * 4) / 12) * 3; // Baja filas según sea necesario
//     }

//     trackByWidget(index: number, widget: any): string {
//         return (widget as any).codigoWidget || widget.type;
//     }

//     abrirLobbyModal() {
//         // 🟢 Aseguramos que los widgets de la pestaña actual estén listos antes de abrir el modal
//         this.filtrarWidgetsParaLobby(this.pestanaActiva);

//         this.mostrarLobby = true;
//         console.log('✅ Torre de Control: Cambiando mostrarLobby a', this.mostrarLobby);
//         this.cdr.detectChanges();
//     }
// }
/*
    Author: German Valencia
    Pattern: PORTTOS Orchestrator Component - Multi-Tenant (QPLUS Unified)
    Tabs: Dinámicas por Base de Datos
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
import { PtlpestanasService } from 'src/app/theme/shared/service/ptlpestanas.service'; // 👈 Servicio Pestañas

import { TcHeaderComponent } from "../widgets/tc-header/tc-header.component";
import { WidgetSelectorTclComponent } from "../widgets/widget-selector-tcl/widget-selector-tcl.component";
import { WidgetLobbyTclComponent } from "../widgets/widget-lobby-tcl/widget-lobby-tcl.component";
import { Widget } from 'src/app/theme/shared/_helpers/models/tablero-control/widget.model';
import { LayoutTclService } from 'src/app/theme/shared/service/tablero-control/layout-tcl.service';
import { PestanaLobbyTclComponent } from '../widgets/pestana-lobby-tcl/pestana-lobby-tcl.component';

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
    public lsPestanas: any[] = []; // 🟢 PROPIEDAD AÑADIDA PARA TUS PESTAÑAS DINÁMICAS

    public pestanaActiva: string = '';
    public puertoSeleccionado: string = 'BUENAVENTURA';
    public usuarioId: string = '';
    public isLoading: boolean = false;
    public mostrarLobby: boolean = false;

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

        // 1. Configuraciones sincrónicas iniciales
        this.lsLayout = this._layoutService.getLayoutActuales();
        const current = this._localStoragoService.getCurrentUserLocalStorage();
        this.usuarioId = current?.usuario?.codigoUsuario || 'SISTEMA_DEFAULT';

        // 2. Obtenemos el contexto actual de navegación QPLUS
        //const contexto = this._localStoragoService.getContextoNavegacion();

        const navSetttings = this._localStoragoService.getNavSettingsLocalStorage();
        const codigoSuite = navSetttings.suite?.codigoSuite || 'a815687f-b9b6-4404-83dd-9a4074224320';
        const codigoAplicacion = navSetttings.aplicacion?.codigoAplicacion || this.APP_PORTTOS_ID;

        this._pestanasService.obtenerPestanasDelContexto(codigoSuite, codigoAplicacion).subscribe(async (res: any) => {
            if (res.success && res.data && res.data.length > 0) {
                this.lsPestanas = res.data;

                // 1. Cargamos las preferencias del usuario (qué pestañas tiene encendidas)
                const preferencias = await this._localStoragoService.getTableroLocalStorage() || {};
                const pestaActivasUsuario = preferencias.pestanasVisibles || [];

                // 2. Filtramos el catálogo. Si el usuario no tiene preferencias guardadas,
                // mostramos por defecto las que tengan un orden 1, 2 o 3 (o un flag 'inicial' si se lo agregas a la tabla PTLPestanas).
                if (pestaActivasUsuario.length > 0) {
                    this.pestanasVisibles = this.lsPestanas.filter(p => pestaActivasUsuario.includes(p.codigoPestana));
                } else {
                    this.pestanasVisibles = this.lsPestanas.filter((p, index) => index < 3);
                }

                // 3. Validamos la pestaña activa
                const pestanaGuardada = preferencias.pestana;
                const existePestana = this.pestanasVisibles.find(p => p.codigoPestana === pestanaGuardada);
                this.pestanaActiva = existePestana ? pestanaGuardada : this.pestanasVisibles[0].codigoPestana;

                this.cargarCatalogoWidgetsYRenderizar();
            }
        });

        // Escucha cambios de puerto/ciudad
        this.subs.add(
            this._filtroService.ciudad$.pipe(
                distinctUntilChanged(),
                debounceTime(300),
                filter(puerto => !!puerto)
            ).subscribe(async (puerto: any) => {
                const puertoStr = typeof puerto === 'string' ? puerto : (puerto.id_puerto || puerto.id || 'BUENAVENTURA');
                this.puertoSeleccionado = puertoStr;
                this.sincronizarDatosSegunPestana(puertoStr);
            })
        );

        // Escucha eventos de enfoque
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
            'TLC_MARITIMO_001': 'fas fa-ship text-info',          // 🚢 Reemplaza por tu clase de icono real
            'TLC_VIRTUAL_GATE_001': 'fas fa-truck text-warning',  // 🚧
            'TLC_CONTENEDORES_001': 'fas fa-box text-success',    // 🚛
            'TLC_MAPA_001': 'fas fa-map-marked-alt text-danger',  // 🧠
            'TLC_NOTICIAS_001': 'fas fa-newspaper text-primary'   // 📰
        };

        // Si llega una pestaña nueva desde la BD que no tiene icono aquí, le pone uno por defecto
        return diccionarioIconos[codigoPestana] || 'fas fa-th-large text-secondary';
    }

    // 🟢 NUEVO MÉTODO ORQUESTADOR (Se llama solo cuando llegan las pestañas)
    cargarCatalogoWidgetsYRenderizar() {
        // Obtenemos los widgets que ya descargó el servicio
        this.lsWidgets = this._widgetsService.getWidgetsActuales() || [];

        // Ejecutamos el cambio de pestaña para filtrar y dibujar la cuadrícula
        this.cambiarPestana(this.pestanaActiva);
    }

    iniciarConfiguracionGridster() {
        this.options = {
            gridType: GridType.ScrollVertical,
            margin: 16, outerMargin: false,
            minCols: 12, maxCols: 12, minRows: 1, maxRows: 100, fixedRowHeight: 160,
            pushItems: true, swap: false, compactType: 'compactUp',
            defaultItemCols: 4, defaultItemRows: 3, displayGrid: 'onDrag&Resize',
            draggable: { enabled: !this.tableroBloqueado },
            resizable: { enabled: !this.tableroBloqueado },
            mobileBreakpoint: 960, keepFixedHeightInMobile: true,
            itemResizeCallback: () => { this.hayCambiosSinGuardar = true; },
            itemChangeCallback: () => { this.hayCambiosSinGuardar = true; }
        };
    }

    private sincronizarDatosSegunPestana(puertoStr: string) {
        if (this.pestanaActiva.includes('MARITIMO')) {
            this.sincronizarTorreMaritima(puertoStr);
        } else if (this.pestanaActiva.includes('VIRTUAL_GATE')) {
            this.sincronizarVirtualGate(puertoStr);
        } else if (this.pestanaActiva.includes('CONTENEDORES')) {
            this.sincronizarContenedores(puertoStr);
        } else if (this.pestanaActiva.includes('MAPA')) {
            this._stateService.inyectarDatosVivos(puertoStr, this.dashboard);
            this.finalizarRenderizado();
        } else {
            this._stateService.inyectarDatosVivos(puertoStr, this.dashboard);
            this.finalizarRenderizado();
        }
    }

    verificarYAplicarLayoutInicial(pestana: string) {
        const widgetsEnLayoutDelUsuario = this.lsLayout.filter(l => l.pestana === pestana && l.visible);

        if (widgetsEnLayoutDelUsuario.length === 0) {
            const widgetsInicialesBd = this.lsWidgets.filter((w: any) => {
                // 🟢 Validamos ESTRICTAMENTE por la llave foránea relacional
                const esDeLaPestana = w.codigoPestana === pestana;
                const esInicial = w.inicial === true || w.inicial === 'true' || w.inicial === 1;
                return esDeLaPestana && esInicial;
            });

            widgetsInicialesBd.forEach((widgetMaster: any, index: number) => {
                const codigoW = widgetMaster.codigoWidget || widgetMaster.codigo_widget;
                const existe = this.lsLayout.find(l => l.type === codigoW || l.codigoWidget === codigoW);

                if (existe) {
                    existe.visible = true;
                } else {
                    this.lsLayout.push({
                        type: codigoW,
                        codigoWidget: codigoW,
                        cols: widgetMaster.defaultCols || widgetMaster.cols_defecto || 4,
                        rows: widgetMaster.defaultRows || widgetMaster.rows_defecto || 3,
                        x: (index % 3) * 4,
                        y: Math.floor(index / 3) * 3,
                        visible: true,
                        pestana: pestana,
                        version: widgetMaster.layoutVersion || 1
                    });
                }
            });
        }
    }

    filtrarWidgetsParaLobby(nuevaPestana: string) {
        this.widgetsParaElLobby = (this.lsWidgets || []).filter((w: any) => {
            const estadoValido = w.estadoWidget === true || w.estadoWidget === 'true' || w.estadoWidget === 1;
            if (!estadoValido) return false;

            // 🟢 Filtro invencible: Solo comparamos el código exacto de la base de datos
            return w.codigoPestana === nuevaPestana;
        });

        console.log(`🔍 Widgets filtrados para el lobby [${nuevaPestana}]:`, this.widgetsParaElLobby.length);
    }

    armarDashboardPorPestana(pestana: string): any[] {
        return this.lsLayout
            .map(layoutItem => {
                const widgetConfig = this.lsWidgets.find(w => (w as any).codigoWidget === layoutItem.type);
                return {
                    ...widgetConfig,
                    ...layoutItem
                };
            })
            .filter((item: any) => item.codigoWidget && item.pestana === pestana);
    }

    async cambiarPestana(nuevaPestana: string) {
        this.sincronizarDashboardAMaestro();

        if (this.hayCambiosSinGuardar) {
            this.guardarConfiguracionTablero();
        }

        this.isLoading = true;
        this.cargando = true;
        this.pestanaActiva = nuevaPestana;
        this.dashboard = [];

        this._localStoragoService.setPestanaLocalStorage(nuevaPestana, this.usuarioId);

        this.verificarYAplicarLayoutInicial(nuevaPestana);

        const layoutParaRenderizar = this.armarDashboardPorPestana(nuevaPestana);
        const estadoActual = await this._localStoragoService.getTableroLocalStorage() || {};

        estadoActual.layout = layoutParaRenderizar;
        estadoActual.pestana = nuevaPestana;

        if (typeof (this._localStoragoService as any).setTableroLocalStorage === 'function') {
            (this._localStoragoService as any).setTableroLocalStorage(estadoActual);
        } else {
            localStorage.setItem('tableroState', JSON.stringify(estadoActual));
        }

        this.filtrarWidgetsParaLobby(nuevaPestana);
        this.renderizarLayoutDesdeCache(layoutParaRenderizar, nuevaPestana);
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

    renderizarLayoutDesdeCache(layoutCrudo: any[], codigoDashboard: string) {
        this.cargando = true;
        const esMaritimo = codigoDashboard.includes('MARITIMO');
        const esVirtualGate = codigoDashboard.includes('VIRTUAL_GATE');
        const esContenedores = codigoDashboard.includes('CONTENEDORES');
        const esMapa = codigoDashboard.includes('MAPA');

        this.dashboard = [];
        this.options.gridType = esMapa ? GridType.Fit : GridType.ScrollVertical;
        if (this.options.api && this.options.api.optionsChanged) this.options.api.optionsChanged();
        this.cdr.detectChanges();

        let layoutBase: any[] = [];

        if (esMapa) {
            layoutBase = layoutCrudo.filter((w: any) => w.type === 'WDG_PORT_MAPA_LOGISTICO' || w.type === 'MAPA');
            if (layoutBase.length === 0) {
                layoutBase = [{ type: 'WDG_PORT_MAPA_LOGISTICO', cols: 12, rows: 5, x: 0, y: 0, visible: true }];
            } else {
                layoutBase.forEach((w: any) => { w.cols = 12; w.rows = 5; w.x = 0; w.y = 0; });
            }
        } else if (esMaritimo) {
            this.dashboard = [...layoutBase].map(item => ({ ...item }));
            this.sincronizarTorreMaritima(this.puertoSeleccionado);
        } else {
            layoutBase = layoutCrudo.filter((w: any) =>
                !['WDG_PORT_TERMINAL_INDIVIDUAL', 'WDG_PORT_FANTASMA', 'BORRAR_ME'].includes(w.type) &&
                !(w.type && w.type.includes('TERM_DINAMICO')) &&
                !(w.type && w.type.includes('FANTASMA'))
            );
        }

        layoutBase = layoutBase.filter((w: any) => w.visible === true || w.visible === 'true' || w.visible === 1);

        setTimeout(() => {
            if (esMapa) {
                this.dashboard = [...layoutBase];
                this.sincronizarDatosSegunPestana(this.puertoSeleccionado);
            } else if (esMaritimo) {
                const esqueletosTerminales = Array.from({ length: 6 }).map((_, index) => ({
                    codigoWidget: 'WDG_PORT_TERM_DINAMICO_' + index, type: 'WDG_PORT_TERMINAL_INDIVIDUAL',
                    cols: 4, rows: 2, x: (index % 3) * 4, y: index < 3 ? 1 : 3, data: null
                }));
                this.dashboard = [...layoutBase, ...esqueletosTerminales].map(item => ({ ...item }));
                this.sincronizarTorreMaritima(this.puertoSeleccionado);
            } else if (esVirtualGate) {
                this.dashboard = [...layoutBase].map(item => ({ ...item }));
                this.sincronizarVirtualGate(this.puertoSeleccionado);
            } else if (esContenedores) {
                this.dashboard = [...layoutBase].map(item => ({ ...item }));
                this.sincronizarContenedores(this.puertoSeleccionado);
            } else {
                this.dashboard = [...layoutBase].map(item => ({ ...item }));
                this.finalizarRenderizado();
            }
        }, 100);
    }

    ensamblarTableroGenerico(widgetsSistema: any[], layoutUsuario: any[], config = { cols: 4, rows: 2, maxColsFila: 3 }) {
        let offsetY = 0;
        let sistemaProcesados: any[] = [];

        if (widgetsSistema && widgetsSistema.length > 0) {
            sistemaProcesados = widgetsSistema.map((widget, index) => {
                const fila = Math.floor(index / config.maxColsFila);
                const columna = index % config.maxColsFila;

                return {
                    codigoWidget: widget.idUnico || `WDG_SYS_DINAMICO_${index}`,
                    type: widget.type,
                    cols: config.cols,
                    rows: config.rows,
                    x: columna * config.cols,
                    y: fila * config.rows,
                    data: widget.data,
                    dragEnabled: false,
                    resizeEnabled: false
                };
            });
            offsetY = Math.ceil(widgetsSistema.length / config.maxColsFila) * config.rows;
        }

        const usuarioDesplazado = layoutUsuario.map(widget => ({
            ...widget,
            y: (widget.y || 0) + offsetY
        }));

        this.dashboard = [...sistemaProcesados, ...usuarioDesplazado];
        this.finalizarRenderizado();
    }

    generarWidgetsDinamicosDelPuerto(terminalesReales: any[]) {
        this.lsWidgets = this.lsWidgets.filter((w: any) => !(w.codigoWidget || '').startsWith('WDG_DINAMICO_TERM_'));
        this.lsLayout = this.lsLayout.filter(l => !(l.type || '').startsWith('WDG_DINAMICO_TERM_'));

        const nuevosWidgetsTerminales = terminalesReales.map((term, index) => {
            const idUnico = `WDG_DINAMICO_TERM_${term.id_terminal || index}`;

            return {
                codigoWidget: idUnico,
                nombreWidget: `${term.nombreTerminal || 'Desconocido'}`,
                descripcionWidget: `Métricas operativas en tiempo real para el terminal ${term.nombreTerminal}`,
                type: 'WDG_PORT_TERMINAL_INDIVIDUAL',
                pestana: 'TLC_MARITIMO_001',
                estadoWidget: true,
                defaultCols: 4,
                defaultRows: 2,
                imagenWidget: 'assets/images/widget-terminal.png',
                data: term
            };
        });

        this.lsWidgets = [...this.lsWidgets, ...nuevosWidgetsTerminales];
        this.filtrarWidgetsParaLobby(this.pestanaActiva);

        nuevosWidgetsTerminales.forEach((nuevoWdg, index) => {
            const fila = Math.floor(index / 3);
            const columna = index % 3;

            this.lsLayout.push({
                type: nuevoWdg.codigoWidget,
                codigoWidget: nuevoWdg.codigoWidget,
                cols: 4, rows: 2,
                x: columna * 4, y: fila * 2,
                visible: false,
                pestana: 'TLC_MARITIMO_001'
            });
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

        this.sincronizarDatosSegunPestana(this.puertoSeleccionado);
    }

    sincronizarTorreMaritima(puerto: string) {
        this.cargando = true;
        this.cdr.detectChanges();

        this._maritimoService.obtenerResumenOperativo(puerto).subscribe({
            next: (res: any) => {
                if (res && res.success && res.data) {
                    const terminales = res.data.WDG_TERMINALES || [];
                    this.generarWidgetsDinamicosDelPuerto(terminales);
                    const layoutLimpio = this.armarDashboardPorPestana(this.pestanaActiva)
                        .filter((w: any) => w.visible === true || w.visible === 'true' || w.visible === 1);
                    this.dashboard = this._hidratarWidgetsConDatos(layoutLimpio, res.data);

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
        if (!this.dashboard || this.dashboard.length === 0) return this.finalizarRenderizado();
        this.cargando = true;

        this._virtualGateService.obtenerColaGate().subscribe({
            next: (res: any) => {
                if (res && res.data) {
                    this.dashboard = this.dashboard.map(widget => {
                        let widgetData = { ...widget.data, resumen: res.data.resumen, citas: res.data.citas };

                        if (widget.type && widget.type.startsWith('WDG_PORT_KPI_')) {
                            switch (widget.type) {
                                case 'WDG_PORT_KPI_GATE_OP':
                                    widgetData = { titulo: 'CAMIONES EN PUERTO', valor: res.data.resumen.totalCamiones || 0, subtitulo: 'ZONA URBANA BUENAVENTURA', color: '#4dabf7', colorBorde: 'borde-cyan' };
                                    break;
                                case 'WDG_PORT_KPI_GATE_CONT':
                                    widgetData = { titulo: 'CONTENEDORES DÍA', valor: res.data.resumen.totalContenedores || '2.847', subtitulo: 'FCL 1.900 · LCL 500 · Reefer 447', color: '#22b8cf', colorBorde: 'borde-amarillo' };
                                    break;
                                case 'WDG_PORT_KPI_GATE_GRANEL':
                                    widgetData = { titulo: 'GRANEL - TONS DÍA', valor: '38.4K', subtitulo: 'Agrícola 20K · Mineral 18.4K', color: '#fd7e14', colorBorde: 'borde-rojo' };
                                    break;
                                case 'WDG_PORT_KPI_GATE_SUELTA':
                                    widgetData = { titulo: 'CARGA SUELTA - TM', valor: '4.820', subtitulo: 'Break-bulk 3.000 · Paletizada 1.820', color: '#fcc419', colorBorde: 'borde-green' };
                                    break;
                                case 'WDG_PORT_KPI_GATE_RORO':
                                    widgetData = { titulo: 'VEHÍCULOS RO-RO', valor: '1.142', subtitulo: 'Imp 800 · Exp 342 · PDI 85%', color: '#20c997', colorBorde: 'borde-fucsia' };
                                    break;
                                case 'WDG_PORT_KPI_GATE_BODEGAS':
                                    widgetData = { titulo: 'SATURACIÓN BODEGAS', valor: '72%', subtitulo: '5 bodegas · 1 crítica · ruteo activo', color: '#cc5de8', colorBorde: 'borde-purple' };
                                    break;
                                case 'WDG_PORT_KPI_SUB_CONT':
                                    widgetData = { titulo: 'SUB - CONTENEDORES', valor: res.data.resumen.subContenedores || 42, subtitulo: 'Retiros y devoluciones', color: '#868e96', colorBorde: 'borde-naranja' };
                                    break;
                                case 'WDG_PORT_KPI_SUB_GRANEL':
                                    widgetData = { titulo: 'SUB - GRANEL', valor: 28, subtitulo: 'Flujo hacia silos', color: '#868e96', colorBorde: 'borde-indigo' };
                                    break;
                                case 'WDG_PORT_KPI_SUB_SUELTA':
                                    widgetData = { titulo: 'SUB - CARGA SUELTA', valor: 11, subtitulo: 'Operación en bodega', color: '#868e96', colorBorde: 'borde-purple' };
                                    break;
                                case 'WDG_PORT_KPI_SUB_NINERAS':
                                    widgetData = { titulo: 'SUB - NIÑERAS', valor: 6, subtitulo: 'Trasiego a patios', color: '#868e96', colorBorde: 'borde-cyan' };
                                    break;
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
        if (!this.dashboard || this.dashboard.length === 0) return this.finalizarRenderizado();
        this.cargando = true;

        this._contenedoresService.obtenerDashboardContenedores().subscribe({
            next: (res: any) => {
                if (res && res.data) {
                    this.dashboard = this.dashboard.map(widget => {
                        let widgetData = { ...widget.data };

                        switch (widget.type) {
                            case 'WDG_PORT_KPI_CONT_CARGADOS':
                                widgetData = { titulo: 'CARGADOS PENDIENTES', valor: res.data.kpis?.cargadosPendientes?.valor, subtitulo: res.data.kpis?.cargadosPendientes?.subtitulo, color: res.data.kpis?.cargadosPendientes?.color, colorBorde: 'borde-cyan' };
                                break;
                            case 'WDG_PORT_KPI_CONT_VACIOS':
                                widgetData = { titulo: 'VACÍOS POR DEVOLVER', valor: res.data.kpis?.vaciosDevolver?.valor, subtitulo: res.data.kpis?.vaciosDevolver?.subtitulo, color: res.data.kpis?.vaciosDevolver?.color, colorBorde: 'borde-naranja' };
                                break;
                            case 'WDG_PORT_KPI_CONT_REEFER':
                                widgetData = { titulo: 'REEFER ACTIVOS', valor: res.data.kpis?.reeferActivos?.valor, subtitulo: res.data.kpis?.reeferActivos?.subtitulo, color: res.data.kpis?.reeferActivos?.color, colorBorde: 'borde-teal' };
                                break;
                            case 'WDG_PORT_KPI_CONT_FREETIME':
                                widgetData = { titulo: 'FREE TIME VENCIDO', valor: res.data.kpis?.freeTimeVencido?.valor, subtitulo: res.data.kpis?.freeTimeVencido?.subtitulo, color: res.data.kpis?.freeTimeVencido?.color, colorBorde: 'borde-blue' };
                                break;
                            case 'WDG_PORT_CONT_RETIROS':
                                widgetData = res.data.retirosPriorizacion;
                                break;
                            case 'WDG_PORT_CONT_NAVIERA':
                                widgetData = res.data.vaciosNaviera;
                                break;
                            case 'WDG_PORT_CONT_PATIOS':
                                widgetData = res.data.saturacionPatios;
                                break;
                            case 'WDG_PORT_CONT_FREETIME_CHART':
                                widgetData = res.data.freeTimeDistribucion;
                                break;
                            case 'WDG_PORT_CONT_TABLA':
                                widgetData = res.data.movimientos;
                                break;
                        }
                        return { ...widget, data: widgetData };
                    });
                    this.finalizarRenderizado();
                }
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

        this.sincronizarDatosSegunPestana(this.puertoSeleccionado);
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

        const layoutActualizado = this.armarDashboardPorPestana(this.pestanaActiva);
        this.dashboard = [...layoutActualizado].filter(w => w.visible === true || w.visible === 'true' || w.visible === 1);

        if (this.options.api && this.options.api.optionsChanged) {
            this.options.api.optionsChanged();
        }
        this.cdr.detectChanges();

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
        return (widget as any).codigoWidget || widget.type;
    }

    abrirLobbyModal() {
        this.filtrarWidgetsParaLobby(this.pestanaActiva);
        this.mostrarLobby = true;
        this.cdr.detectChanges();
    }

    abrirLobbyPestanas() {
        // Aquí encenderías el flag para mostrar el nuevo modal de pestañas
        this.mostrarLobbyPestanas = true;
        this.cdr.detectChanges();
    }

    obtenerCodigosVisibles(): string[] {
        return this.pestanasVisibles.map(p => p.codigoPestana);
    }

    guardarPreferenciasPestanas(codigosSeleccionados: string[]) {
        // 1. Filtramos el catálogo maestro para construir la nueva lista visible
        this.pestanasVisibles = this.lsPestanas.filter(p => codigosSeleccionados.includes(p.codigoPestana));

        // 2. Control de navegación: Si apagó la pestaña actual, saltamos a la primera que quede visible
        if (this.pestanasVisibles.length > 0) {
            if (!codigosSeleccionados.includes(this.pestanaActiva)) {
                this.cambiarPestana(this.pestanasVisibles[0].codigoPestana);
            }
        } else {
            // Si desactivó todas, limpiamos el tablero
            this.pestanaActiva = '';
            this.dashboard = [];
        }

        // 3. Forzamos a Angular a redibujar el nav-tabs inmediatamente
        this.cdr.detectChanges();

        // 4. Guardamos el estado para que persista
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
