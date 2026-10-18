// /*
//     Author: German Valencia
//     Component: GNL Dashboard (Layout Manager Puro + Telemetría Desacoplada en GnlStateService)
// */
// import { Component, Input, OnInit, OnChanges, SimpleChanges, OnDestroy, ChangeDetectorRef } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { GridsterConfig, GridsterItem, GridType, GridsterComponent, GridsterItemComponent } from 'angular-gridster2';
// import { Subject } from 'rxjs';
// import { takeUntil } from 'rxjs/operators';

// // Importamos el SocketService nativo para forzar la suscripción en el backend
// import { SocketService } from 'src/app/theme/shared/service/sockets.service';
// import { SocketManagerService } from 'src/app/theme/shared/service/socket-manager.service';
// import { LayoutMetadataEngineService } from 'src/app/theme/shared/service/layout-metadata-engine.service';
// import { GnlStateService } from 'src/app/theme/shared/service/tablero-control/gnl-state.service';
// import { WIDGET_MAP } from '../../widget-registry';
// import { LocalStorageService } from 'src/app/theme/shared/service';

// @Component({
//     selector: 'app-gnl-dashboard',
//     standalone: true,
//     imports: [CommonModule, GridsterComponent, GridsterItemComponent],
//     templateUrl: './gnl-dashboard.component.html',
//     styleUrls: ['./gnl-dashboard.component.scss']
// })
// export class GnlDashboardComponent implements OnInit, OnChanges, OnDestroy {
//     @Input() puerto: string = 'BUENAVENTURA';
//     @Input() usuarioId!: string;
//     @Input() lsWidgets: any[] = [];

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
//     get tableroBloqueado(): boolean {
//         return this._tableroBloqueado;
//     }

//     public readonly pestanaActiva: string = 'TLC_GNL_001';
//     public options!: GridsterConfig;

//     // Estado exclusivo de Layout (Coordenadas + Componente Target + Config Inmutable)
//     public dashboard: Array<GridsterItem & {
//         id?: string;
//         idClon?: string;
//         type: string;
//         componenteTarget?: any;
//         componenteInputs?: { widgetConfig: any };
//     }> = [];

//     public cargando: boolean = true;
//     public hayCambiosSinGuardar: boolean = false;

//     // Estado del selector de brazos en el Header de GNL
//     public brazoSeleccionado: string = 'TODOS';
//     public listaBrazosOrdenados: string[] = [];

//     private construyendoLayout: boolean = false;
//     private readonly destroy$ = new Subject<void>();

//     constructor(
//         private layoutEngine: LayoutMetadataEngineService,
//         private socketManager: SocketManagerService,
//         private socketService: SocketService, // 🟢 INYECTADO PARA DESPERTAR AL BACKEND
//         private _gnlState: GnlStateService,
//         private _localStorageService: LocalStorageService,
//         private cdr: ChangeDetectorRef
//     ) { }

//     ngOnInit(): void {
//         this.iniciarGridster();
//         this.suscribirEstadoBrazos();
//         this.iniciarEmisionTelemetria();
//         this.encenderTelemetria();

//         if (this.lsWidgets && this.lsWidgets.length > 0) {
//             this.inicializarLayoutPorPuerto();
//         }
//     }

//     ngOnChanges(changes: SimpleChanges): void {
//         const catalogoListo = this.lsWidgets && this.lsWidgets.length > 0;

//         // 1. Si cambia el puerto en el Header, limpiamos telemetría del puerto anterior y reconstruimos layout
//         if (changes['puerto'] && !changes['puerto'].isFirstChange() && catalogoListo) {
//             this.brazoSeleccionado = 'TODOS';
//             this._gnlState.reiniciarEstadoPuerto(this.puerto);
//             this.inicializarLayoutPorPuerto(true);

//             // 🟢 NUEVO: Notificamos al backend que enviamos telemetría para el nuevo puerto
//             this.iniciarEmisionTelemetria();
//         }

//         // 2. Si el catálogo maestro lsWidgets llega por primera vez desde el Padre
//         if (changes['lsWidgets'] && catalogoListo && this.dashboard.length === 0) {
//             this.inicializarLayoutPorPuerto();
//         }
//     }

//     ngOnDestroy(): void {
//         this.destroy$.next();
//         this.destroy$.complete();
//         // Opcional: Desuscribirse de la sala del puerto al salir de la pestaña
//         if (typeof (this.socketService as any).emit === 'function') {
//             (this.socketService as any).emit('leave-gnl', { puerto: this.puerto });
//         }
//     }

//     /**
//      * Envía la señal al Backend (NodeJS) para que inicie la transmisión SCADA
//      */
//     private iniciarEmisionTelemetria(): void {
//         const puertoNormalizado = (this.puerto || 'BUENAVENTURA').trim().toUpperCase();
//         console.log(`🔌 [GNL Dashboard] Solicitando telemetría SCADA para el puerto: ${puertoNormalizado}`);

//         // Emitimos el canal por defecto que despierta la lectura de CSV o BD en tu backend
//         if (typeof (this.socketService as any).emit === 'function') {
//             (this.socketService as any).emit('join-gnl', { puerto: puertoNormalizado });
//             // Agrego esto por si en el backend lo llamaste distinto:
//             (this.socketService as any).emit('solicitar_telemetria_gnl', { puerto: puertoNormalizado });
//         }
//     }

//     /**
//      * Construye o recupera de sesión únicamente el layout geométrico de Gridster.
//      * Ordena los KPIs por posición X para inyectarles su kpiIndex de forma determinista.
//      */
//     async inicializarLayoutPorPuerto(forzarReconstruccion: boolean = false): Promise<void> {
//         if (this.construyendoLayout) return;
//         this.construyendoLayout = true;
//         this.cargando = true;

//         const puertoNormalizado = (this.puerto || 'BUENAVENTURA').trim().toUpperCase();
//         const cacheKey = `${this.pestanaActiva}_${puertoNormalizado}`;

//         try {
//             let layoutGuardado = !forzarReconstruccion
//                 ? this._localStorageService.getLayoutPestana(cacheKey)
//                 : null;

//             if (!layoutGuardado || layoutGuardado.length === 0) {
//                 layoutGuardado = await this.layoutEngine.obtenerLayoutBase(
//                     this.pestanaActiva,
//                     this.usuarioId,
//                     this.lsWidgets
//                 );

//                 layoutGuardado = (layoutGuardado || []).filter((w: any) => w.type || w.codigoWidget);
//                 this._localStorageService.guardarLayoutPestanaEnSesion(cacheKey, layoutGuardado);
//             }

//             // Identificamos el orden horizontal (X) de los KPIs para preservar la asignación exacta de los 6 KPIs de GNL
//             const idsKpisOrdenados = [...(layoutGuardado || [])]
//                 .filter((w: any) => (w.type || w.codigoWidget || '').toUpperCase().includes('KPI'))
//                 .sort((a: any, b: any) => (a.x || 0) - (b.x || 0))
//                 .map((w: any, idx: number) => w.idClon || w.id || `kpi-${idx}-${w.x}-${w.y}`);

//             this.dashboard = (layoutGuardado || []).map((w: any, index: number) => {
//                 const codigoTipo = (w.type || w.codigoWidget || '').trim().toUpperCase();
//                 const idUnico = w.idClon || w.id || `wdg-gnl-${index}-${w.x}-${w.y}`;
//                 const kpiPos = idsKpisOrdenados.indexOf(w.idClon || w.id || `kpi-${index}-${w.x}-${w.y}`);

//                 return {
//                     ...w,
//                     id: idUnico,
//                     type: codigoTipo,
//                     componenteTarget: this.obtenerComponentePara(codigoTipo),
//                     componenteInputs: {
//                         widgetConfig: {
//                             ...w,
//                             id: idUnico,
//                             type: codigoTipo,
//                             puerto: puertoNormalizado,
//                             pestana: this.pestanaActiva,
//                             kpiIndex: kpiPos >= 0 ? kpiPos : index
//                         }
//                     }
//                 };
//             });
//         } catch (error) {
//             console.error('❌ [GNL Layout Manager] Error construyendo el layout:', error);
//         } finally {
//             this.cargando = false;
//             this.construyendoLayout = false;
//             this.cdr.detectChanges();

//             setTimeout(() => {
//                 if (this.options?.api?.resize) {
//                     this.options.api.resize();
//                 }
//             }, 50);
//         }
//     }

//     /**
//      * Escucha el socket del manager y delega el cálculo a GnlStateService
//      */
//     private encenderTelemetria(): void {
//         this.socketManager.telemetriaGNLActualizada$
//             .pipe(takeUntil(this.destroy$))
//             .subscribe((payload: any) => {
//                 this._gnlState.procesarPulsoSocket(payload, this.puerto);
//             });
//     }

//     private suscribirEstadoBrazos(): void {
//         this._gnlState.brazosActivos$
//             .pipe(takeUntil(this.destroy$))
//             .subscribe((brazos) => {
//                 if (brazos.length !== this.listaBrazosOrdenados.length) {
//                     this.listaBrazosOrdenados = brazos;
//                     this.cdr.detectChanges();
//                 }
//             });
//     }

//     get brazosOrdenados(): string[] {
//         return this.listaBrazosOrdenados;
//     }

//     public cambiarFiltroGNL(brazo: string): void {
//         this.brazoSeleccionado = brazo;
//         this._gnlState.seleccionarBrazo(brazo);
//     }

//     obtenerComponentePara(codigoWidget: string): any {
//         return WIDGET_MAP[codigoWidget] ? WIDGET_MAP[codigoWidget].componente : null;
//     }

//     iniciarGridster(): void {
//         this.options = {
//             gridType: GridType.ScrollVertical,
//             margin: 12,
//             addEmptyRowsCount: 1,
//             outerMargin: true,
//             outerMarginBottom: 24,
//             minCols: 12,
//             maxCols: 12,
//             minRows: 1,
//             maxRows: 1000,
//             fixedRowHeight: 160,
//             pushItems: true,
//             swap: false,
//             compactType: 'none',
//             defaultItemCols: 4,
//             defaultItemRows: 3,
//             displayGrid: 'onDrag&Resize',
//             draggable: { enabled: !this.tableroBloqueado },
//             pushDirections: { north: false, east: false, south: true, west: false },
//             resizable: { enabled: !this.tableroBloqueado },
//             mobileBreakpoint: 960,
//             keepFixedHeightInMobile: true,
//             itemResizeCallback: () => {
//                 if (!this.cargando) this.hayCambiosSinGuardar = true;
//             },
//             itemChangeCallback: () => {
//                 if (!this.cargando) this.hayCambiosSinGuardar = true;
//             }
//         };
//     }

//     trackByWidget(index: number, w: any): string {
//         const origen = w.componenteInputs?.widgetConfig || w;
//         return origen.idClon || origen.id || origen.type || index.toString();
//     }
// }
/*
    Author: German Valencia
    Component: GNL Dashboard (Layout Manager Puro + Telemetría Desacoplada en GnlStateService)
*/
import { Component, Input, OnInit, OnChanges, SimpleChanges, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GridsterConfig, GridsterItem, GridType, GridsterComponent, GridsterItemComponent } from 'angular-gridster2';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// Importamos el SocketService nativo para forzar la suscripción en el backend
import { SocketService } from 'src/app/theme/shared/service/sockets.service';
import { SocketManagerService } from 'src/app/theme/shared/service/socket-manager.service';
import { LayoutMetadataEngineService } from 'src/app/theme/shared/service/layout-metadata-engine.service';
import { GnlStateService } from 'src/app/theme/shared/service/tablero-control/gnl-state.service';
import { WIDGET_MAP } from '../../widget-registry';
import { LocalStorageService } from 'src/app/theme/shared/service';

@Component({
    selector: 'app-gnl-dashboard',
    standalone: true,
    imports: [CommonModule, GridsterComponent, GridsterItemComponent],
    templateUrl: './gnl-dashboard.component.html',
    styleUrls: ['./gnl-dashboard.component.scss']
})
export class GnlDashboardComponent implements OnInit, OnChanges, OnDestroy {
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

    public readonly pestanaActiva: string = 'TLC_GNL_001';
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

    // Estado del selector de brazos en el Header de GNL
    public brazoSeleccionado: string = 'TODOS';
    public listaBrazosOrdenados: string[] = [];

    private construyendoLayout: boolean = false;
    private readonly destroy$ = new Subject<void>();

    constructor(
        private layoutEngine: LayoutMetadataEngineService,
        private socketManager: SocketManagerService,
        private socketService: SocketService,
        private _gnlState: GnlStateService,
        private _localStorageService: LocalStorageService,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit(): void {
        this.iniciarGridster();
        this.suscribirEstadoBrazos();

        // 🟢 NUEVO: Suscribirse a la telemetría filtrada para inyectar datos a los KPIs genéricos
        this.suscribirTelemetriaKPIs();

        this.iniciarEmisionTelemetria();
        this.encenderTelemetria();

        if (this.lsWidgets && this.lsWidgets.length > 0) {
            this.inicializarLayoutPorPuerto();
        }
    }

    ngOnChanges(changes: SimpleChanges): void {
        const catalogoListo = this.lsWidgets && this.lsWidgets.length > 0;

        if (changes['puerto'] && !changes['puerto'].isFirstChange() && catalogoListo) {
            this.brazoSeleccionado = 'TODOS';
            this._gnlState.reiniciarEstadoPuerto(this.puerto);
            this.inicializarLayoutPorPuerto(true);
            this.iniciarEmisionTelemetria();
        }

        if (changes['lsWidgets'] && catalogoListo && this.dashboard.length === 0) {
            this.inicializarLayoutPorPuerto();
        }
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
        this.socketService.salirSalaGnl();
    }

    /**
     * Envía la señal al Backend (NodeJS) para que inicie la transmisión SCADA
     */
    private iniciarEmisionTelemetria(): void {
        const puertoNormalizado = (this.puerto || 'BUENAVENTURA').trim().toUpperCase();
        console.log(`🔌 [GNL Dashboard] Solicitando telemetría SCADA para el puerto: ${puertoNormalizado}`);

        this.socketService.unirseSalaGnl(puertoNormalizado);
    }

    /**
     * Construye o recupera de sesión únicamente el layout geométrico de Gridster.
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

            const idsKpisOrdenados = [...(layoutGuardado || [])]
                .filter((w: any) => (w.type || w.codigoWidget || '').toUpperCase().includes('KPI'))
                .sort((a: any, b: any) => (a.x || 0) - (b.x || 0))
                .map((w: any, idx: number) => w.idClon || w.id || `kpi-${idx}-${w.x}-${w.y}`);

            this.dashboard = (layoutGuardado || []).map((w: any, index: number) => {
                const codigoTipo = (w.type || w.codigoWidget || '').trim().toUpperCase();
                const idUnico = w.idClon || w.id || `wdg-gnl-${index}-${w.x}-${w.y}`;
                const kpiPos = idsKpisOrdenados.indexOf(w.idClon || w.id || `kpi-${index}-${w.x}-${w.y}`);

                // Se inicializa el valor en '0' si es un KPI
                const esKPI = codigoTipo.includes('KPI');

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
                            pestana: this.pestanaActiva,
                            kpiIndex: kpiPos >= 0 ? kpiPos : index,
                            // Inicializamos la propiedad valor
                            valor: esKPI ? '0' : undefined
                        }
                    }
                };
            });
        } catch (error) {
            console.error('❌ [GNL Layout Manager] Error construyendo el layout:', error);
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

    /**
     * Escucha el socket del manager y delega el cálculo a GnlStateService
     */
    private encenderTelemetria(): void {
        this.socketManager.telemetriaGNLActualizada$
            .pipe(takeUntil(this.destroy$))
            .subscribe((payload: any) => {
                this._gnlState.procesarPulsoSocket(payload, this.puerto);
            });
    }

    /**
         * 🟢 ESCUCHA LA TELEMETRÍA FILTRADA PARA ACTUALIZAR LOS KPIs SUPERIORES
         */
    private suscribirTelemetriaKPIs(): void {
        this._gnlState.telemetriaFiltrada$
            .pipe(takeUntil(this.destroy$))
            .subscribe((telemetria: any) => {
                if (!telemetria || !this.dashboard || this.dashboard.length === 0) return;

                let cambiosAplicados = false;

                this.dashboard = this.dashboard.map(widget => {
                    const tipo = widget.type.toUpperCase();

                    if (!tipo.startsWith('PTT_GNL_KPI')) return widget;

                    const nuevoWidget = { ...widget };
                    const nuevaConfig = { ...(widget.componenteInputs?.widgetConfig || {}) };

                    let nuevoValor: string | number = '0';

                    switch (tipo) {
                        case 'PTT_GNL_KPI_CALIDAD':
                        case 'PTT_GNL_KPI_CALORIFICO':
                            nuevoValor = telemetria.poder_calorifico !== undefined ? telemetria.poder_calorifico : '0';
                            break;

                        // 2. DESCARGA DE BUQUES (Usa la variable 'descarga_buque' sin la 's')
                        case 'PTT_GNL_KPI_DESCARGA':
                        case 'PTT_GNL_KPI_INYECCION':
                            nuevoValor = telemetria.descarga_buque !== undefined ? telemetria.descarga_buque : '0';
                            break;

                        // 3. ENERGÍA TRANSFERIDA (Calculada dinámicamente usando 'caudal_m3h')
                        case 'PTT_GNL_KPI_ODO_MMBTU':
                            const flujoParaEnergia = Number(telemetria.caudal_m3h ?? telemetria.flujo_m3h ?? 0);
                            nuevoValor = flujoParaEnergia > 0 ? ((flujoParaEnergia * 22.4) / 3600).toFixed(4) : '0';
                            break;

                        // 4. BOG - GAS EVAPORADO (Toma 'bog_m3h' o 'bog')
                        case 'PTT_GNL_KPI_BOG':
                            nuevoValor = telemetria.bog_m3h ?? telemetria.bog ?? '0';
                            break;

                        // 5. OCUPACIÓN / VOLUMEN (Toma 'volumen_almacenado' y le añade el %)
                        case 'PTT_GNL_KPI_VOLUMEN':
                        case 'PTT_GNL_KPI_TNQ_OCUP':
                            nuevoValor = telemetria.volumen_almacenado !== undefined ? `${telemetria.volumen_almacenado}%` : '0%';
                            break;

                        // 6. MÉTRICA GNL ADICIONAL (Podemos inyectarle el 'indice_wobbe' o 'metano_pct')
                        case 'PTT_GNL_KPI_METRICA':
                            nuevoValor = telemetria.indice_wobbe ?? telemetria.metano_pct ?? '0';
                            break;

                        // 🟢 EXTRA: Por si decides usar las tarjetas de Flujo y Presión sueltas del Registry
                        case 'PTT_GNL_KPI_FLUJO':
                            nuevoValor = telemetria.caudal_m3h ?? telemetria.flujo ?? '0';
                            break;

                        case 'PTT_GNL_KPI_PRESION':
                            nuevoValor = telemetria.presion_psi ?? telemetria.presion ?? '0';
                            break;

                        case 'PTT_GNL_KPI_TEMP':
                            nuevoValor = telemetria.temp_ducto ?? telemetria.temperatura ?? '0';
                            break;

                        case 'PTT_GNL_KPI_ALERTAS':
                            nuevoValor = telemetria.alarma_activa ? 'ALERTA SCADA' : 'OPERACIÓN NORMAL';
                            break;
                    }

                    // Tipado estricto para inyectar el valor actualizado
                    if (nuevaConfig.valor !== nuevoValor) {
                        nuevaConfig.valor = nuevoValor;
                        nuevoWidget.componenteInputs = { widgetConfig: nuevaConfig };
                        cambiosAplicados = true;
                        return nuevoWidget;
                    }

                    return widget;
                });

                if (cambiosAplicados) {
                    this.cdr.detectChanges();
                }
            });
    }

    private suscribirEstadoBrazos(): void {
        this._gnlState.brazosActivos$
            .pipe(takeUntil(this.destroy$))
            .subscribe((brazos) => {
                if (brazos.length !== this.listaBrazosOrdenados.length) {
                    this.listaBrazosOrdenados = brazos;
                    this.cdr.detectChanges();
                }
            });
    }

    get brazosOrdenados(): string[] {
        return this.listaBrazosOrdenados;
    }

    public cambiarFiltroGNL(brazo: string): void {
        this.brazoSeleccionado = brazo;
        this._gnlState.seleccionarBrazo(brazo);
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
