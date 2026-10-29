/* eslint-disable @typescript-eslint/no-explicit-any */
/*
    Author: German Valencia
    Pattern: PORTTOS Orchestrator Component - Multi-Tenant (QPLUS Unified)
    Refactor: Gatekeeper con Lobby de Widgets y Lobby de Pestañas 100% Persistentes (SessionStorage + BD)
*/
import {
    Component,
    OnInit,
    OnDestroy,
    ChangeDetectorRef,
    EventEmitter,
    Output,
    ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter } from 'rxjs/operators';
import { v4 as uuidv4 } from 'uuid';

import { DashboardService } from 'src/app/theme/shared/service/tablero-control/dashboard.service';
import { FiltroTableroService } from 'src/app/theme/shared/service/tablero-control/filtro-tablero.service';
import { PTLWidgetsMaestroService } from 'src/app/theme/shared/service/ptlwidgets-maestro.service';
import { LocalStorageService, SwalAlertService } from 'src/app/theme/shared/service';
import { PtlpestanasService } from 'src/app/theme/shared/service/ptlpestanas.service';
import { LayoutService } from 'src/app/theme/shared/service/layout.service';

import { TcHeaderComponent } from '../widgets/shared/tc-header/tc-header.component';
import { WidgetSelectorTclComponent } from '../widgets/shared/widget-selector-tcl/widget-selector-tcl.component';
import { WidgetLobbyTclComponent } from '../widgets/shared/widget-lobby-tcl/widget-lobby-tcl.component';
import { PestanaLobbyTclComponent } from '../widgets/shared/pestana-lobby-tcl/pestana-lobby-tcl.component';

import { Widget } from 'src/app/theme/shared/_helpers/models/tablero-control/widget.model';
import { PTLLayoutModel } from 'src/app/theme/shared/_helpers/models/PTLLayout.model';
import { WIDGET_MAP } from './widget-registry';

import { GnlDashboardComponent } from './components/gnl-dashboard/gnl-dashboard.component';
import { MaritimoDashboardComponent } from './components/maritimo-dashboard/maritimo-dashboard.component';
import { ContenedoresDashboardComponent } from './components/contenedores-dashboard/contenedores-dashboard.component';
import { VirtualGateDashboardComponent } from './components/virtual-gate-dashboard/virtual-gate-dashboard.component';
import { MapaDashboardComponent } from './components/mapa-dashboard/mapa-dashboard.component';
import { BodegasDashboardComponent } from './components/bodegas-dashboard/bodegas-dashboard.component';
import { GranelDashboardComponent } from './components/granel-dashboard/granel-dashboard.component';
import { CargaSueltaDashboardComponent } from './components/carga-suelta-dashboard/carga-suelta-dashboard.component';
import { CapacidadDashboardComponent } from './components/capacidad-dashboard/capacidad-dashboard.component';
import { NoticiasDashboardComponent } from './components/noticias-dashboard/noticias-dashboard.component';
import { iconoPestana } from '../widgets/shared/iconos-pestana';

@Component({
    selector: 'app-torre-control',
    standalone: true,
    imports: [
        CommonModule,
        TranslateModule,
        TcHeaderComponent,
        WidgetSelectorTclComponent,
        WidgetLobbyTclComponent,
        PestanaLobbyTclComponent,
        GnlDashboardComponent,
        MaritimoDashboardComponent,
        ContenedoresDashboardComponent,
        VirtualGateDashboardComponent,
        MapaDashboardComponent,
        BodegasDashboardComponent,
        GranelDashboardComponent,
        CargaSueltaDashboardComponent,
        CapacidadDashboardComponent,
        NoticiasDashboardComponent
    ],
    templateUrl: './torre-control.component.html',
    styleUrls: ['./torre-control.component.scss']
})
export class TorreControlComponent implements OnInit, OnDestroy {
    @Output() toggleBloqueo = new EventEmitter<void>();

    // Referencia dinámica a la pestaña hija actualmente renderizada en el ngSwitch
    @ViewChild('pestanaHija') pestanaHijaActiva: any;

    // EL CANDADO MAESTRO DE LA ARQUITECTURA
    public entornoListo: boolean = false;
    public cargando: boolean = false;

    public puertoActivo: string = 'BUENAVENTURA';
    public usuarioActivoId: string = 'SISTEMA_DEFAULT';

    public tableroBloqueado: boolean = true;
    public hayCambiosSinGuardar: boolean = false;
    public menuConfigAbierto: boolean = false;
    public mostrarLobby: boolean = false;
    public mostrarLobbyPestanas: boolean = false;
    /** Widget abierto en modo enfoque: su widgetConfig completo (con puerto y pestaña) y sus datos vivos. */
    public widgetEnfoque: { config: any; datosVivos: any } | null = null;

    public lsWidgets: Widget[] = [];
    public lsLayout: any[] = [];
    public widgetsParaElLobby: any[] = [];
    public lsPestanas: any[] = [];
    public pestanasVisibles: any[] = [];
    public pestanaActiva: string = '';

    private readonly APP_PORTTOS_ID = '3eb98a9f-cc5d-417d-95ea-a2b8abc3b5fa';
    private subs: Subscription = new Subscription();
    private autoGuardarWidgets$ = new Subject<void>();

    constructor(
        private _torreService: DashboardService,
        private translate: TranslateService,
        private _filtroService: FiltroTableroService,
        private _widgetsService: PTLWidgetsMaestroService,
        private _localStoragoService: LocalStorageService,
        private _layoutService: LayoutService,
        private _pestanasService: PtlpestanasService,
        private _swalAlertService: SwalAlertService,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit(): void {
        this.arrancarEntornoGlobal();

        // Auto-guardado en BD cuando el usuario activa/desactiva widgets en el Lobby (espera 600ms)
        this.subs.add(
            this.autoGuardarWidgets$
                .pipe(debounceTime(600))
                .subscribe(() => {
                    this.guardarConfiguracionTablero();
                })
        );

        // Escucha cambios de puerto desde el header global
        this.subs.add(
            this._filtroService.ciudad$
                .pipe(
                    distinctUntilChanged(),
                    debounceTime(300),
                    filter((puerto) => !!puerto)
                )
                .subscribe(async (puerto: any) => {
                    const puertoStr =
                        typeof puerto === 'string'
                            ? puerto
                            : puerto.id_puerto || puerto.id || 'BUENAVENTURA';
                    this.puertoActivo = puertoStr.trim().toUpperCase();
                    this._torreService.setPuerto(this.puertoActivo);
                })
        );

        this.subs.add(
            this._torreService.widgetFocus$.subscribe((widget) => {
                this.widgetEnfoque = this.armarConfigEnfoque(widget);
                this.cdr.detectChanges();
            })
        );
    }

    ngOnDestroy(): void {
        if (this.hayCambiosSinGuardar) {
            this.guardarConfiguracionTablero();
        }
        this.subs.unsubscribe();
    }

    /**
     * ==========================================
     * 1. BOOTSTRAPPING (Arranque Seguro)
     * ==========================================
     */
    arrancarEntornoGlobal(): void {
        const current = this._localStoragoService.getCurrentUserLocalStorage() || {};
        const navSettings = this._localStoragoService.getNavSettingsLocalStorage() || {};

        this.lsLayout = navSettings.layout || [];

        // 🟢 Soportamos tanto estructura anidada (current.usuario.codigoUsuario) como plana (current.codigoUsuario)
        this.usuarioActivoId =
            current?.usuario?.codigoUsuario ||
            current?.codigoUsuario ||
            localStorage.getItem('codigoUsuario') ||
            'SISTEMA_DEFAULT';

        // 1. Cargar el catálogo maestro de widgets
        this.lsWidgets = this._widgetsService.getWidgetsActuales() || [];

        const codigoSuite =
            navSettings.suite?.codigoSuite || 'a815687f-b9b6-4404-83dd-9a4074224320';
        const codigoAplicacion =
            navSettings.aplicacion?.codigoAplicacion || this.APP_PORTTOS_ID;

        // 2. Obtener las pestañas del usuario (BD o Caché)
        this._pestanasService
            .obtenerPestanasDelContexto(codigoSuite, codigoAplicacion)
            .subscribe((resMaster: any) => {
                if (resMaster?.success && Array.isArray(resMaster.data) && resMaster.data.length > 0) {
                    this.lsPestanas = resMaster.data;

                    this._layoutService
                        .obtenerPreferenciasPestanas(this.usuarioActivoId)
                        .subscribe((resPrefs: any) => {
                            if (resPrefs?.ok && Array.isArray(resPrefs.data) && resPrefs.data.length > 0) {
                                const preferenciasUnicas = resPrefs.data.filter(
                                    (pref: any, index: number, self: any[]) =>
                                        index ===
                                        self.findIndex((p) => p.codigoPestana === pref.codigoPestana)
                                );
                                this.pestanasVisibles = preferenciasUnicas
                                    .sort((a: any, b: any) => a.posicion - b.posicion)
                                    .map((pref: any) =>
                                        this.lsPestanas.find(
                                            (p) => p.codigoPestana === pref.codigoPestana
                                        )
                                    )
                                    .filter((p: any) => p !== undefined);
                            } else if (Array.isArray(navSettings.pestanas) && navSettings.pestanas.length > 0) {
                                // Fallback al caché local si la respuesta de BD viene vacía temporalmente
                                this.pestanasVisibles = navSettings.pestanas;
                            } else {
                                this.pestanasVisibles = this.lsPestanas.slice(0, 3);
                            }

                            navSettings.pestanas = this.pestanasVisibles;
                            this._localStoragoService.setNavSettingsLocalStorage(navSettings);

                            const pestanaGuardada =
                                current?.pestanaActiva || this.pestanasVisibles[0]?.codigoPestana;
                            const existePestana = this.pestanasVisibles.find(
                                (p) => p.codigoPestana === pestanaGuardada
                            );
                            this.pestanaActiva = existePestana
                                ? pestanaGuardada
                                : this.pestanasVisibles[0]?.codigoPestana || '';

                            current.pestanaActiva = this.pestanaActiva;
                            this._localStoragoService.setCurrentUserLocalStorage(current);

                            this.filtrarWidgetsParaLobby(this.pestanaActiva);

                            // Liberamos el candado
                            this.entornoListo = true;
                            this.cdr.detectChanges();
                        });
                } else {
                    console.warn('⚠️ No se encontraron pestañas para el contexto.');
                    this.entornoListo = true;
                    this.cdr.detectChanges();
                }
            });
    }

    /**
     * ==========================================
     * 2. NAVEGACIÓN Y ESTADO DE UI
     * ==========================================
     */
    cambiarPestana(nuevaPestana: string): void {
        // Si había cambios de widgets o posiciones en la pestaña actual, los guardamos ANTES de cambiar
        if (this.hayCambiosSinGuardar || this.pestanaHijaActiva?.hayCambiosSinGuardar) {
            this.guardarConfiguracionTablero();
        }

        this.pestanaActiva = nuevaPestana;
        const current = this._localStoragoService.getCurrentUserLocalStorage() || {};
        current.pestanaActiva = nuevaPestana;
        this._localStoragoService.setCurrentUserLocalStorage(current);

        this.filtrarWidgetsParaLobby(nuevaPestana);
        this.cdr.detectChanges();
    }

    toggleBloqueoTablero(): void {
        this.tableroBloqueado = !this.tableroBloqueado;

        // Si se vuelve a bloquear el tablero y hubo cambios en el padre o en el hijo, persistimos en BD y SessionStorage
        if (
            this.tableroBloqueado &&
            (this.hayCambiosSinGuardar || this.pestanaHijaActiva?.hayCambiosSinGuardar)
        ) {
            this.guardarConfiguracionTablero();
        }
        this.cdr.detectChanges();
    }

    toggleMenuConfig(): void {
        this.menuConfigAbierto = !this.menuConfigAbierto;
        this.cdr.detectChanges();
    }

    /** Ícono de la pestaña: pieza común con el lobby de pestañas (widgets/shared/iconos-pestana.ts). */
    obtenerIconoPestana(codigoPestana: string): string {
        return iconoPestana(codigoPestana);
    }

    obtenerComponentePara(codigoWidget: string): any {
        const registro = WIDGET_MAP[codigoWidget];
        return registro ? registro.componente : null;
    }

    /**
     * ==========================================
     * 3. LOBBY DE WIDGETS CON PERSISTENCIA REAL
     * ==========================================
     */
    abrirLobbyModal(): void {
        this.mostrarLobbyPestanas = false;
        this.filtrarWidgetsParaLobby(this.pestanaActiva);

        const dashboardHijo: any[] = this.pestanaHijaActiva?.dashboard || [];
        this.lsLayout = dashboardHijo.map((widgetGridster: any) => ({
            ...widgetGridster,
            codigoWidget: widgetGridster.type || widgetGridster.codigoWidget
        }));

        this.mostrarLobby = true;
        this.cdr.detectChanges();
    }

    filtrarWidgetsParaLobby(nuevaPestana: string): void {
        if (!this.lsWidgets || this.lsWidgets.length === 0) {
            this.lsWidgets = this._widgetsService.getWidgetsActuales() || [];
        }

        this.widgetsParaElLobby = (this.lsWidgets || []).filter((w: any) => {
            const estadoValido =
                w.estadoWidget === true ||
                w.estadoWidget === 'true' ||
                w.estadoWidget === 1 ||
                w.estado === 1;
            const pestanaWidget = w.codigoPestana || w.codigo_pestana || '';
            return estadoValido && pestanaWidget === nuevaPestana;
        });
    }

    actualizarWidgetDesdeLobby(evento: { codigoWidget: string; seleccionado: boolean }): void {
        const { codigoWidget, seleccionado } = evento;
        const hijo = this.pestanaHijaActiva;

        // 1. Si la pestaña hija tiene su propio método de actualización visual, lo ejecutamos,
        // pero NO hacemos return sin antes persistir en SessionStorage y Base de Datos.
        if (hijo && typeof hijo.actualizarWidgetDesdeLobby === 'function') {
            hijo.actualizarWidgetDesdeLobby(evento);
        } else {
            const dashboardActual: any[] = hijo?.dashboard || [];

            if (seleccionado) {
                const existeEnPantalla = dashboardActual.find(
                    (w: any) => w.type === codigoWidget || w.codigoWidget === codigoWidget
                );

                if (!existeEnPantalla) {
                    const widgetMaster: any =
                        this.lsWidgets.find(
                            (w: any) => (w.codigoWidget || w.codigo_widget) === codigoWidget
                        ) ||
                        this.widgetsParaElLobby.find(
                            (w: any) => (w.codigoWidget || w.codigo_widget) === codigoWidget
                        );

                    if (widgetMaster) {
                        const codigoTipo = (
                            widgetMaster.codigoWidget ||
                            widgetMaster.codigo_widget ||
                            codigoWidget
                        )
                            .trim()
                            .toUpperCase();

                        const idUnico = `wdg-${codigoTipo.toLowerCase()}-${Date.now()}`;
                        const compTarget =
                            hijo?.obtenerComponentePara?.(codigoTipo) ||
                            this.obtenerComponentePara(codigoTipo);

                        // 🟢 Leemos también WIDGET_MAP como respaldo de dimensiones de fábrica
                        const defRegistry = WIDGET_MAP[codigoTipo];

                        const nuevoItem: any = {
                            ...widgetMaster,
                            id: idUnico,
                            type: codigoTipo,
                            codigoWidget: codigoTipo,
                            cols: Number(
                                widgetMaster.defaultCols ??
                                widgetMaster.cols_defecto ??
                                widgetMaster.cols ??
                                defRegistry?.defaultCols ??
                                4
                            ),
                            rows: Number(
                                widgetMaster.defaultRows ??
                                widgetMaster.rows_defecto ??
                                widgetMaster.rows ??
                                defRegistry?.defaultRows ??
                                3
                            ),
                            x: 0,
                            y: 0,
                            data: {
                                titulo: widgetMaster.nombreWidget || widgetMaster.titulo,
                                subtitulo: widgetMaster.descripcionWidget || widgetMaster.subtitulo,
                                tipo: widgetMaster.tipo || widgetMaster.categoria
                            },
                            componenteTarget: compTarget,
                            componenteInputs: {
                                widgetConfig: {
                                    ...widgetMaster,
                                    id: idUnico,
                                    type: codigoTipo,
                                    codigoWidget: codigoTipo,
                                    titulo: widgetMaster.nombreWidget || widgetMaster.titulo,
                                    subtitulo: widgetMaster.descripcionWidget || widgetMaster.subtitulo,
                                    puerto: this.puertoActivo
                                },
                                datosVivos: null
                            }
                        };

                        this.asignarPosicionLibre(nuevoItem, dashboardActual, hijo?.options);
                        dashboardActual.push(nuevoItem);
                    }
                }
            } else {
                const index = dashboardActual.findIndex(
                    (w: any) => w.type === codigoWidget || w.codigoWidget === codigoWidget
                );
                if (index !== -1) {
                    dashboardActual.splice(index, 1);
                }
            }

            if (hijo) {
                hijo.dashboard = [...dashboardActual];
                hijo.options?.api?.optionsChanged?.();
                hijo.cdr?.detectChanges?.();
            }
        }

        // 2. Obtenemos la lista actualizada definitiva de la pestaña hija
        const dashboardFinal: any[] = hijo?.dashboard || [];

        this.lsLayout = dashboardFinal.map((w: any) => ({
            ...w,
            codigoWidget: w.type || w.codigoWidget
        }));

        // 3. 🟢 Persistimos inmediatamente en SessionStorage + LocalStorage y disparamos el guardado a BD
        this.sincronizarMovimientoEnCache(dashboardFinal);
        this.hayCambiosSinGuardar = true;
        this.autoGuardarWidgets$.next();
        this.cdr.detectChanges();
    }

    asignarPosicionLibre(item: any, dashboardActual: any[], optionsHijo?: any): void {
        if (
            optionsHijo?.api &&
            typeof optionsHijo.api.getNextPossiblePosition === 'function'
        ) {
            const posLibre = optionsHijo.api.getNextPossiblePosition(item);
            if (posLibre) {
                item.x = posLibre.x;
                item.y = posLibre.y;
                return;
            }
        }
        const totalItems = dashboardActual.length;
        item.x = (totalItems * 4) % 12;
        item.y = Math.floor((totalItems * 4) / 12) * 3;
    }

    /**
     * 🟢 SINCRONIZACIÓN DUAL: Actualiza tanto SessionStorage (leído por las pestañas hijas)
     * como navSettings.layout en LocalStorage.
     */
    sincronizarMovimientoEnCache(dashboardActual?: any[]): void {
        const lista = dashboardActual || this.pestanaHijaActiva?.dashboard || [];
        if (!lista) return;

        const dashboardActualizado = lista
            .filter(
                (w: any) =>
                    w.type !== 'WDG_FANTASMA' && !(w.type || '').includes('FANTASMA')
            )
            .map((w: any) => {
                const origenConfig = w.componenteInputs?.widgetConfig || w;
                return {
                    ...origenConfig,
                    id: w.id || origenConfig.id,
                    idClon: w.idClon || origenConfig.idClon,
                    codigoWidget: w.type || w.codigoWidget || origenConfig.codigoWidget,
                    type: w.type || w.codigoWidget || origenConfig.type,
                    cols: w.cols,
                    rows: w.rows,
                    x: w.x,
                    y: w.y,
                    pestana: this.pestanaActiva
                };
            });

        // 1. 🟢 ACTUALIZAR SESSION STORAGE (La llave que leen VirtualGate, Contenedores, GNL, Marítimo, etc.)
        const puertoNormalizado = (
            this.pestanaHijaActiva?.puerto ||
            this.puertoActivo ||
            'BUENAVENTURA'
        )
            .toString()
            .trim()
            .toUpperCase();
        const cacheKey = `${this.pestanaActiva}_${puertoNormalizado}`;

        if (typeof this._localStoragoService.guardarLayoutPestanaEnSesion === 'function') {
            this._localStoragoService.guardarLayoutPestanaEnSesion(cacheKey, dashboardActualizado);
        }

        // 2. ACTUALIZAR LOCAL STORAGE (navSettings.layout)
        const preferencias = this._localStoragoService.getNavSettingsLocalStorage() || {};
        let layoutGuardado = preferencias.layout || [];

        layoutGuardado = layoutGuardado.filter(
            (w: any) =>
                w.pestana !== this.pestanaActiva &&
                w.type !== 'WDG_FANTASMA' &&
                w.codigoWidget !== 'WDG_FANTASMA'
        );

        preferencias.layout = [...layoutGuardado, ...dashboardActualizado];
        this._localStoragoService.setNavSettingsLocalStorage(preferencias);
    }

    guardarPreferenciasWidgets(_activos?: any[]): void {
        this.guardarConfiguracionTablero();
        this.cdr.detectChanges();
    }

    cerrarLobbyWidgets(): void {
        if (this.hayCambiosSinGuardar || this.pestanaHijaActiva?.hayCambiosSinGuardar) {
            this.guardarConfiguracionTablero();
        }
        this.mostrarLobby = false;
        this.cdr.detectChanges();
    }

    guardarConfiguracionTablero(): void {
        const hijo = this.pestanaHijaActiva;
        const dashboardActual: any[] = hijo?.dashboard || [];

        if (!dashboardActual || dashboardActual.length === 0) return;

        // 1. Sincronizamos primero el SessionStorage y LocalStorage del navegador
        this.sincronizarMovimientoEnCache(dashboardActual);

        // 2. Si el hijo tiene lógica adicional propia, la llamamos pero continuamos o aseguramos la BD
        if (hijo && typeof hijo.guardarConfiguracionTablero === 'function') {
            hijo.guardarConfiguracionTablero();
            this.hayCambiosSinGuardar = false;
            hijo.hayCambiosSinGuardar = false;
            return;
        }

        // 3. Persistimos en SQL Server a través de LayoutService
        const usuario = this.usuarioActivoId || 'SISTEMA_DEFAULT';
        const widgetsAGuardar = dashboardActual.filter(
            (w: any) => w.type !== 'BORRAR_ME' && !(w.type || '').includes('FANTASMA')
        );

        const layoutPayload: PTLLayoutModel[] = widgetsAGuardar.map((itemGridster: any) => {
            const itemLayout = new PTLLayoutModel();
            const origenConfig = itemGridster.componenteInputs?.widgetConfig || itemGridster;

            itemLayout.codigoLayout = uuidv4();
            itemLayout.codigoUsuario = usuario;
            itemLayout.codigoPestana = this.pestanaActiva;
            itemLayout.codigoWidget =
                itemGridster.idClon ||
                itemGridster.type ||
                itemGridster.codigoWidget ||
                origenConfig.codigoWidget;
            itemLayout.posicion_x = itemGridster.x ?? 0;
            itemLayout.posicion_y = itemGridster.y ?? 0;
            itemLayout.cols = itemGridster.cols ?? 4;
            itemLayout.rows = itemGridster.rows ?? 3;

            const dataConfig = itemGridster.data || origenConfig.data || null;
            itemLayout.config = dataConfig ? JSON.stringify(dataConfig) : null;
            itemLayout.codigoUsuarioCreacion = usuario;
            itemLayout.fechaCreacion = new Date().toISOString();

            return itemLayout;
        });

        this._layoutService.postCrearLayout(layoutPayload).subscribe({
            next: () => {
                console.log(`✅ [TorreControl] Layout de ${this.pestanaActiva} persistido en BD y SessionStorage.`);
                this.hayCambiosSinGuardar = false;
                if (hijo) hijo.hayCambiosSinGuardar = false;
            },
            error: (err: any) => {
                console.error('❌ ERROR REAL DE PERSISTENCIA EN BD:', err?.error || err);
            }
        });
    }

    /**
     * ==========================================
     * 4. LOBBY DE PESTAÑAS CON PERSISTENCIA REAL
     * ==========================================
     */
    abrirLobbyPestanas(): void {
        this.mostrarLobby = false;
        this.mostrarLobbyPestanas = true;
        this.cdr.detectChanges();
    }

    /**
     * El modal crea una instancia nueva del widget: se le entrega el contexto completo para que consulte el mismo
     * puerto que el tablero (antes llegaba solo {type, data} y los widgets caían en BUENAVENTURA). Lo que el widget
     * mande en data se aplana en widgetConfig (data se conserva por compatibilidad) y data.datosVivos va como input.
     */
    private armarConfigEnfoque(widget: { type: string; data: any } | null): { config: any; datosVivos: any } | null {
        if (!widget) return null;
        const data = widget.data || {};
        // Si el widget manda una lista (p. ej. sus filas), no se aplana en la configuración
        const { datosVivos, ...resto } = Array.isArray(data) ? ({ datosVivos: undefined } as any) : data;
        const puerto = String(resto.puerto || this.puertoActivo || 'BUENAVENTURA').trim().toUpperCase();
        return {
            config: { ...resto, type: widget.type, codigoWidget: resto.codigoWidget || widget.type, data, puerto, pestana: resto.pestana || this.pestanaActiva },
            datosVivos: datosVivos ?? null
        };
    }

    cerrarModalEnfoque(): void {
        this.widgetEnfoque = null;
        this._torreService.cerrarModoEnfoque();
    }

    actualizarPestanaDesdeLobby(evento: { codigoPestana: string; seleccionado: boolean }): void {
        const { codigoPestana, seleccionado } = evento;

        if (seleccionado) {
            const pestanaMaestra = this.lsPestanas.find((p) => p.codigoPestana === codigoPestana);
            if (
                pestanaMaestra &&
                !this.pestanasVisibles.find((p) => p.codigoPestana === codigoPestana)
            ) {
                this.pestanasVisibles = [...this.pestanasVisibles, pestanaMaestra];
            }
        } else {
            this.pestanasVisibles = this.pestanasVisibles.filter(
                (p) => p.codigoPestana !== codigoPestana
            );
        }

        if (this.pestanasVisibles.length > 0) {
            if (!this.pestanasVisibles.find((p) => p.codigoPestana === this.pestanaActiva)) {
                this.cambiarPestana(this.pestanasVisibles[0].codigoPestana);
            }
        } else {
            this.pestanaActiva = '';
        }

        this.cdr.detectChanges();
        this.persistirEstadoPestanas();
    }

    guardarPreferenciasPestanas(codigosSeleccionados: any[]): void {
        if (Array.isArray(codigosSeleccionados) && codigosSeleccionados.length > 0) {
            this.pestanasVisibles = codigosSeleccionados
                .map((codigo) =>
                    this.lsPestanas.find(
                        (p) => p.codigoPestana === (codigo.codigoPestana || codigo)
                    )
                )
                .filter((p) => p !== undefined);
        }

        if (
            this.pestanasVisibles.length > 0 &&
            !this.pestanasVisibles.find((p) => p.codigoPestana === this.pestanaActiva)
        ) {
            this.cambiarPestana(this.pestanasVisibles[0].codigoPestana);
        }

        this.cdr.detectChanges();
        this.persistirEstadoPestanas();
    }

    cerrarLobbyPestanas(): void {
        this.mostrarLobbyPestanas = false;
        this.cdr.detectChanges();
    }

    persistirEstadoPestanas(): void {
        const estadoActual = this._localStoragoService.getNavSettingsLocalStorage() || {};
        estadoActual.pestanas = this.pestanasVisibles;
        this._localStoragoService.setNavSettingsLocalStorage(estadoActual);

        const usuario = this.usuarioActivoId || 'SISTEMA_DEFAULT';
        const payloadPestanas = this.pestanasVisibles.map((pestana, index) => {
            const codPestana = typeof pestana === 'string' ? pestana : pestana.codigoPestana;
            const maestro = this.lsPestanas.find((p) => p.codigoPestana === codPestana) || pestana;

            return {
                codigoUsuario: usuario,
                codigoPestana: codPestana,
                posicion: index,
                codigoTipo: pestana?.codigoTipo || maestro?.codigoTipo || 'TABLERO',
                estadoPestana: true,
                codigoUsuarioCreacion: usuario,
                fechaCreacion: new Date().toISOString()
            };
        });

        this._layoutService.postGuardarPestanasUsuario(payloadPestanas).subscribe({
            next: () => console.log('✅ Preferencias de pestañas guardadas en BD y LocalStorage'),
            error: (err: any) => console.error('❌ Error persistiendo pestañas en BD', err)
        });
    }

    restaurarTableroDefault(): void {
        this._swalAlertService
            .getAlertQuestionRequest(
                this.translate.instant('PORTTOS.REINICIARTABLERO'),
                this.translate.instant('PORTTOS.REINBICIASUBTITULO'),
                this.translate.instant('PLATAFORMA.RESET'),
                this.translate.instant('PLATAFORMA.CANCEL')
            )
            .subscribe((result) => {
                if (result) {
                    this.menuConfigAbierto = false;

                    // 1. Limpiamos LocalStorage (navSettings.layout)
                    const prefs = this._localStoragoService.getNavSettingsLocalStorage() || {};
                    if (prefs.layout) {
                        prefs.layout = prefs.layout.filter(
                            (w: any) => w.pestana !== this.pestanaActiva
                        );
                        this._localStoragoService.setNavSettingsLocalStorage(prefs);
                    }

                    // 2. 🟢 Limpiamos SessionStorage de la pestaña activa para que no sobreviva al reload
                    const puertoNormalizado = (this.puertoActivo || 'BUENAVENTURA').trim().toUpperCase();
                    const cacheKey = `${this.pestanaActiva}_${puertoNormalizado}`;
                    if (typeof this._localStoragoService.guardarLayoutPestanaEnSesion === 'function') {
                        this._localStoragoService.guardarLayoutPestanaEnSesion(cacheKey, []);
                    }
                    sessionStorage.removeItem(cacheKey);
                    sessionStorage.removeItem(`LAYOUT_${cacheKey}`);

                    // 3. Eliminamos en Base de Datos y recargamos
                    this._layoutService
                        .eliminarLayoutPestana(this.usuarioActivoId, this.pestanaActiva)
                        .subscribe({
                            next: () => {
                                window.location.reload();
                            },
                            error: () => {
                                window.location.reload();
                            }
                        });
                } else {
                    this.menuConfigAbierto = false;
                }
            });
    }
}
