// /* eslint-disable @typescript-eslint/no-explicit-any */
// /*
//     Author: German Valencia
//     Component: Marítimo Dashboard (Layout Manager Puro + Cascada Dinámica de Terminales)
// */
// import { Component, Input, OnInit, OnChanges, SimpleChanges, ChangeDetectorRef } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { GridsterConfig, GridsterItem, GridType, GridsterComponent, GridsterItemComponent } from 'angular-gridster2';
// import { firstValueFrom } from 'rxjs';

// import { LayoutMetadataEngineService } from 'src/app/theme/shared/service/layout-metadata-engine.service';
// import { MaritimoService } from 'src/app/theme/shared/service/tablero-control/maritimo.service';
// import { WIDGET_MAP } from '../../widget-registry';
// import { LocalStorageService } from 'src/app/theme/shared/service';

// @Component({
//     selector: 'app-maritimo-dashboard',
//     standalone: true,
//     imports: [CommonModule, GridsterComponent, GridsterItemComponent],
//     templateUrl: './maritimo-dashboard.component.html',
//     styleUrls: ['./maritimo-dashboard.component.scss']
// })
// export class MaritimoDashboardComponent implements OnInit, OnChanges {
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

//     public readonly pestanaActiva: string = 'TLC_MARITIMO_001';
//     public options: GridsterConfig = {};

//     // Estado exclusivo de Layout (Coordenadas + Componente Target + Configuración Estable)
//     public dashboard: Array<GridsterItem & {
//         id?: string;
//         idClon?: string;
//         type: string;
//         componenteTarget?: any;
//         componenteInputs?: { widgetConfig: any; dataTerminal?: any; datosVivos?: any };
//     }> = [];

//     public cargando: boolean = true;
//     public hayCambiosSinGuardar: boolean = false;
//     private construyendoLayout: boolean = false;

//     constructor(
//         private layoutEngine: LayoutMetadataEngineService,
//         private _maritimoService: MaritimoService,
//         private _localStorageService: LocalStorageService,
//         private cdr: ChangeDetectorRef
//     ) { }

//     ngOnInit(): void {
//         this.iniciarGridster();
//         if (this.lsWidgets && this.lsWidgets.length > 0) {
//             this.inicializarLayoutPorPuerto();
//         }
//     }

//     ngOnChanges(changes: SimpleChanges): void {
//         const catalogoListo = this.lsWidgets && this.lsWidgets.length > 0;

//         // 1. Si cambió el puerto seleccionado en el Header, limpiamos caché del servicio y rearmamos grilla
//         if (changes['puerto'] && !changes['puerto'].isFirstChange() && catalogoListo) {
//             this._maritimoService.limpiarCachePuerto();
//             this.inicializarLayoutPorPuerto(true);
//         }

//         // 2. Si el catálogo maestro lsWidgets acaba de llegar desde el componente Padre
//         if (changes['lsWidgets'] && catalogoListo && this.dashboard.length === 0) {
//             this.inicializarLayoutPorPuerto();
//         }
//     }

//     /**
//      * Construye o recupera de sesión la estructura geométrica (Gridster)
//      * asegurando que los slots dinámicos de terminales siempre estén presentes e hidratados.
//      */
//     async inicializarLayoutPorPuerto(forzarReconstruccion: boolean = false): Promise<void> {
//         if (this.construyendoLayout) return;
//         this.construyendoLayout = true;
//         this.cargando = true;

//         const puertoNormalizado = (this.puerto || 'BUENAVENTURA').trim().toUpperCase();
//         const cacheKey = `${this.pestanaActiva}_${puertoNormalizado}`;

//         try {
//             // 1. Siempre consultamos las terminales del puerto activo
//             let terminalesDelPuerto: any[] = [];
//             try {
//                 const resTerminales = await firstValueFrom(
//                     this._maritimoService.obtenerTerminalesPorPuerto(puertoNormalizado)
//                 );
//                 terminalesDelPuerto = Array.isArray(resTerminales) ? resTerminales : [];
//                 console.log(`⚓ [Marítimo] Terminales obtenidas para ${puertoNormalizado}:`, terminalesDelPuerto.length, terminalesDelPuerto);
//             } catch (errTerm) {
//                 console.warn('⚠️ [Marítimo] Error obteniendo terminales por puerto:', errTerm);
//                 terminalesDelPuerto = [];
//             }

//             let layoutGuardado = !forzarReconstruccion
//                 ? this._localStorageService.getLayoutPestana(cacheKey)
//                 : null;

//             // 2. Verificamos si el layout en caché tiene los slots de terminales cuando el puerto sí tiene terminales
//             const tieneSlotsTerminales = Array.isArray(layoutGuardado) && layoutGuardado.some((w: any) => {
//                 const cod = String(w.idClon || w.type || w.codigoWidget || '').toUpperCase();
//                 return cod.startsWith('TERM_SLOT_') || cod === 'PTT_MAE_WGT_TERMINAL' || cod === 'WDG_PORT_TERMINAL_INDIVIDUAL';
//             });

//             if (
//                 !layoutGuardado ||
//                 layoutGuardado.length === 0 ||
//                 (terminalesDelPuerto.length > 0 && !tieneSlotsTerminales)
//             ) {
//                 console.log('🔨 [Marítimo] Construyendo layout base con cascada de terminales...');
//                 layoutGuardado = await this.layoutEngine.obtenerLayoutBase(
//                     this.pestanaActiva,
//                     this.usuarioId,
//                     this.lsWidgets,
//                     terminalesDelPuerto
//                 );

//                 this._localStorageService.guardarLayoutPestanaEnSesion(cacheKey, layoutGuardado);
//             }

//             // 3. Montamos las carcasas e inyectamos los datos de cada terminal en su respectivo TERM_SLOT_N
//             let contadorTerminal = 0;

//             this.dashboard = (layoutGuardado || []).map((w: any, index: number) => {
//                 const rawCodigo = (w.type || w.codigoWidget || '').trim().toUpperCase();
//                 const idClonUpper = String(w.idClon || '').trim().toUpperCase();

//                 const esSlotTerminal =
//                     idClonUpper.startsWith('TERM_SLOT_') ||
//                     rawCodigo.startsWith('TERM_SLOT_') ||
//                     rawCodigo === 'PTT_MAE_WGT_TERMINAL' ||
//                     rawCodigo === 'WDG_PORT_TERMINAL_INDIVIDUAL';

//                 // Si el widget fue guardado como TERM_SLOT_0 en type, lo normalizamos a PTT_MAE_WGT_TERMINAL para el Registry
//                 const codigoTipo = rawCodigo.startsWith('TERM_SLOT_')
//                     ? 'PTT_MAE_WGT_TERMINAL'
//                     : rawCodigo;

//                 const idUnico = w.idClon || w.id || (esSlotTerminal ? `TERM_SLOT_${contadorTerminal}` : `wdg-mar-${index}-${w.x}-${w.y}`);

//                 // Determinamos qué terminal le toca a este slot
//                 let terminalAsignada = w.dataTerminal || w.data?.terminal || null;
//                 let slotIdx = -1;

//                 if (esSlotTerminal) {
//                     const matchSlot = (idClonUpper || rawCodigo).match(/TERM_SLOT_(\d+)/);
//                     slotIdx = matchSlot ? parseInt(matchSlot[1], 10) : contadorTerminal;
//                     contadorTerminal++;

//                     if (!terminalAsignada && terminalesDelPuerto[slotIdx]) {
//                         terminalAsignada = terminalesDelPuerto[slotIdx];
//                     }
//                 }

//                 const configEnriquecida = {
//                     ...w,
//                     id: idUnico,
//                     idClon: esSlotTerminal ? (w.idClon || `TERM_SLOT_${slotIdx}`) : w.idClon,
//                     type: codigoTipo,
//                     puerto: puertoNormalizado,
//                     terminalIndex: slotIdx >= 0 ? slotIdx : undefined,
//                     dataTerminal: terminalAsignada,
//                     data: terminalAsignada ? { ...(w.data || {}), ...terminalAsignada } : w.data
//                 };

//                 return {
//                     ...w,
//                     id: idUnico,
//                     idClon: configEnriquecida.idClon,
//                     type: codigoTipo,
//                     dataTerminal: terminalAsignada,
//                     componenteTarget: this.obtenerComponenteRegistry(codigoTipo),
//                     componenteInputs: {
//                         widgetConfig: configEnriquecida
//                     }
//                 };
//             });
//         } catch (error) {
//             console.error('❌ [Marítimo Layout Manager] Error construyendo el layout:', error);
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

//     obtenerComponenteRegistry(codigoWidget: string): any {
//         const key = (codigoWidget || '').trim().toUpperCase();
//         if (key.startsWith('TERM_SLOT_') || key === 'PTT_MAE_WGT_TERMINAL' || key === 'WDG_PORT_TERMINAL_INDIVIDUAL') {
//             return (
//                 WIDGET_MAP['PTT_MAE_WGT_TERMINAL']?.componente ||
//                 WIDGET_MAP['WDG_PORT_TERMINAL_INDIVIDUAL']?.componente ||
//                 null
//             );
//         }
//         return WIDGET_MAP[key] ? WIDGET_MAP[key].componente : null;
//     }

//     iniciarGridster(): void {
//         this.options = {
//             gridType: GridType.ScrollVertical,
//             margin: 12,
//             outerMargin: true,
//             outerMarginBottom: 24,
//             addEmptyRowsCount: 1,
//             minCols: 12,
//             maxCols: 12,
//             minRows: 1,
//             maxRows: 1000,
//             fixedRowHeight: 160,
//             pushItems: true,
//             swap: false,
//             compactType: 'compactUp',
//             defaultItemCols: 4,
//             defaultItemRows: 3,
//             displayGrid: 'onDrag&Resize',
//             draggable: { enabled: !this.tableroBloqueado },
//             pushDirections: { north: true, east: true, south: true, west: false },
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
//         return w.idClon || w.id || w.type || index.toString();
//     }
// }


/* eslint-disable @typescript-eslint/no-explicit-any */
/*
    Author: German Valencia
    Component: Marítimo Dashboard (Layout Manager Puro + Cascada Dinámica de Terminales)
*/
import { Component, Input, OnInit, OnChanges, SimpleChanges, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GridsterConfig, GridsterItem, GridType, GridsterComponent, GridsterItemComponent } from 'angular-gridster2';
import { firstValueFrom, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

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
export class MaritimoDashboardComponent implements OnInit, OnChanges, OnDestroy {
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
    public options: GridsterConfig = {};

    public dashboard: Array<GridsterItem & {
        id?: string;
        idClon?: string;
        type: string;
        componenteTarget?: any;
        componenteInputs?: { widgetConfig: any; datosVivos?: any };
    }> = [];

    public cargando: boolean = true;
    public hayCambiosSinGuardar: boolean = false;
    private construyendoLayout: boolean = false;
    private readonly destroy$ = new Subject<void>();

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

        if (changes['puerto'] && !changes['puerto'].isFirstChange() && catalogoListo) {
            this._maritimoService.limpiarCachePuerto();
            this.inicializarLayoutPorPuerto(true);
        }

        if (changes['lsWidgets'] && catalogoListo && this.dashboard.length === 0) {
            this.inicializarLayoutPorPuerto();
        }
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    async inicializarLayoutPorPuerto(forzarReconstruccion: boolean = false): Promise<void> {
        if (this.construyendoLayout) return;
        this.construyendoLayout = true;
        this.cargando = true;

        const puertoNormalizado = (this.puerto || 'BUENAVENTURA').trim().toUpperCase();
        const cacheKey = `${this.pestanaActiva}_${puertoNormalizado}`;

        try {
            let terminalesDelPuerto: any[] = [];
            try {
                const resTerminales = await firstValueFrom(
                    this._maritimoService.obtenerTerminalesPorPuerto(puertoNormalizado)
                );
                terminalesDelPuerto = Array.isArray(resTerminales) ? resTerminales : [];
            } catch (errTerm) {
                console.warn('⚠️ [Marítimo] Error obteniendo terminales por puerto:', errTerm);
                terminalesDelPuerto = [];
            }

            let layoutGuardado = !forzarReconstruccion
                ? this._localStorageService.getLayoutPestana(cacheKey)
                : null;

            const tieneSlotsTerminales = Array.isArray(layoutGuardado) && layoutGuardado.some((w: any) => {
                const cod = String(w.idClon || w.type || w.codigoWidget || '').toUpperCase();
                return cod.startsWith('TERM_SLOT_') || cod === 'PTT_MAE_WGT_TERMINAL' || cod === 'WDG_PORT_TERMINAL_INDIVIDUAL';
            });

            if (
                !layoutGuardado ||
                layoutGuardado.length === 0 ||
                (terminalesDelPuerto.length > 0 && !tieneSlotsTerminales)
            ) {
                layoutGuardado = await this.layoutEngine.obtenerLayoutBase(
                    this.pestanaActiva,
                    this.usuarioId,
                    this.lsWidgets,
                    terminalesDelPuerto
                );

                this._localStorageService.guardarLayoutPestanaEnSesion(cacheKey, layoutGuardado);
            }

            let contadorTerminal = 0;

            this.dashboard = (layoutGuardado || []).map((w: any, index: number) => {
                const rawCodigo = (w.type || w.codigoWidget || '').trim().toUpperCase();
                const idClonUpper = String(w.idClon || '').trim().toUpperCase();

                const esSlotTerminal =
                    idClonUpper.startsWith('TERM_SLOT_') ||
                    rawCodigo.startsWith('TERM_SLOT_') ||
                    rawCodigo === 'PTT_MAE_WGT_TERMINAL' ||
                    rawCodigo === 'WDG_PORT_TERMINAL_INDIVIDUAL';

                const codigoTipo = rawCodigo.startsWith('TERM_SLOT_')
                    ? 'PTT_MAE_WGT_TERMINAL'
                    : rawCodigo;

                const idUnico = w.idClon || w.id || (esSlotTerminal ? `TERM_SLOT_${contadorTerminal}` : `wdg-mar-${index}-${w.x}-${w.y}`);

                let terminalAsignada = w.dataTerminal || w.data?.terminal || null;
                let slotIdx = -1;

                if (esSlotTerminal) {
                    const matchSlot = (idClonUpper || rawCodigo).match(/TERM_SLOT_(\d+)/);
                    slotIdx = matchSlot ? parseInt(matchSlot[1], 10) : contadorTerminal;
                    contadorTerminal++;

                    if (!terminalAsignada && terminalesDelPuerto[slotIdx]) {
                        terminalAsignada = terminalesDelPuerto[slotIdx];
                    }
                }

                const configEnriquecida = {
                    ...w,
                    id: idUnico,
                    idClon: esSlotTerminal ? (w.idClon || `TERM_SLOT_${slotIdx}`) : w.idClon,
                    type: codigoTipo,
                    puerto: puertoNormalizado,
                    terminalIndex: slotIdx >= 0 ? slotIdx : undefined,
                    dataTerminal: terminalAsignada,
                    data: terminalAsignada ? { ...(w.data || {}), ...terminalAsignada } : w.data
                };

                // 🟢 INYECCIÓN DINÁMICA ANTI-ERRORES (NG0303)
                const inputsDinamicos: any = {
                    widgetConfig: configEnriquecida,
                    datosVivos: null // Listo para ser llenado por el motor de hidratación
                };

                return {
                    ...w,
                    id: idUnico,
                    idClon: configEnriquecida.idClon,
                    type: codigoTipo,
                    dataTerminal: terminalAsignada,
                    componenteTarget: this.obtenerComponenteRegistry(codigoTipo),
                    componenteInputs: inputsDinamicos
                };
            });

            // Llama al motor de hidratación para llenar gráficas y tablas
            this.hidratarWidgetsNoAutonomos(puertoNormalizado);

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

    /**
     * 🟢 NUEVO MOTOR DE HIDRATACIÓN (CALIBRADO PARA LA CONSOLA SCADA)
     */
    private hidratarWidgetsNoAutonomos(puerto: string): void {
        const metodoServicio = this._maritimoService.obtenerResumenOperativo
            || this._maritimoService.obtenerTerminalesPorPuerto
            || this._maritimoService.obtenerDatosTerminalSlot;

        if (!metodoServicio) return;

        metodoServicio.call(this._maritimoService, puerto)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (res: any) => {
                    // Accedemos a "data" tal como lo muestra tu consola "Respuesta cruda"
                    const datosGlobales = res?.data || res || {};
                    if (!datosGlobales || !this.dashboard) return;

                    let cambiosAplicados = false;

                    this.dashboard = this.dashboard.map(widget => {
                        const tipo = widget.type.toUpperCase();

                        const nuevoWidget = { ...widget };

                        // 🟢 CLONAMOS WIDGETCONFIG DE FORMA SEGURA
                        const nuevosInputs = {
                            ...nuevoWidget.componenteInputs,
                            widgetConfig: { ...(nuevoWidget.componenteInputs?.widgetConfig || {}) }
                        } as any;

                        let dataEncontrada = null;

                        // Intentamos buscar por el tipo exacto (ej. PTT_MAE_CHART_RENDIMIENTO)
                        if (datosGlobales[tipo] !== undefined) {
                            dataEncontrada = datosGlobales[tipo];
                        }
                        // Intentamos buscar sin el prefijo PTT_MAE_ (ej. si el widget se llama KPI_BODEGAS)
                        else {
                            const tipoLimpio = tipo.replace('PTT_MAE_', '');
                            if (datosGlobales[tipoLimpio] !== undefined) {
                                dataEncontrada = datosGlobales[tipoLimpio];
                            }
                        }

                        // 🟢 INYECTAMOS EN WIDGETCONFIG (Evitamos el error NG0303)
                        if (tipo === 'PTT_MAE_WGT_TERMINAL' || tipo.startsWith('TERM_SLOT_')) {
                            if (datosGlobales['PTT_MAE_PANEL_TERMINALES'] && Array.isArray(datosGlobales['PTT_MAE_PANEL_TERMINALES'])) {
                                const idx = nuevosInputs.widgetConfig.terminalIndex;
                                if (idx !== undefined && datosGlobales['PTT_MAE_PANEL_TERMINALES'][idx]) {
                                    const terminalData = datosGlobales['PTT_MAE_PANEL_TERMINALES'][idx];

                                    // Asignamos adentro de widgetConfig
                                    nuevosInputs.widgetConfig.dataTerminal = terminalData;
                                    nuevosInputs.widgetConfig.data = {
                                        ...(nuevosInputs.widgetConfig.data || {}),
                                        ...terminalData
                                    };
                                }
                            }
                        }
                        // 🟢 Para todo lo demás (Gráficas, KPIs, Tablas) inyectamos en datosVivos
                        else if (dataEncontrada !== null) {
                            nuevosInputs.datosVivos = dataEncontrada;
                        }

                        // 🟢 COMPROBACIÓN SEGURA BUSCANDO DENTRO DE WIDGETCONFIG
                        const datosVivosCambiaron = JSON.stringify(widget.componenteInputs?.datosVivos) !== JSON.stringify(nuevosInputs.datosVivos);
                        const terminalCambio = JSON.stringify(widget.componenteInputs?.widgetConfig?.dataTerminal) !== JSON.stringify(nuevosInputs.widgetConfig.dataTerminal);

                        if (datosVivosCambiaron || terminalCambio) {
                            nuevoWidget.componenteInputs = nuevosInputs;
                            cambiosAplicados = true;
                            return nuevoWidget;
                        }

                        return widget;
                    });

                    if (cambiosAplicados) {
                        this.cdr.detectChanges();
                    }
                },
                error: (err) => console.error('❌ Error hidratando widgets marítimos:', err)
            });
    }

    obtenerComponenteRegistry(codigoWidget: string): any {
        const key = (codigoWidget || '').trim().toUpperCase();
        if (key.startsWith('TERM_SLOT_') || key === 'PTT_MAE_WGT_TERMINAL' || key === 'WDG_PORT_TERMINAL_INDIVIDUAL') {
            return (
                WIDGET_MAP['PTT_MAE_WGT_TERMINAL']?.componente ||
                WIDGET_MAP['WDG_PORT_TERMINAL_INDIVIDUAL']?.componente ||
                null
            );
        }
        return WIDGET_MAP[key] ? WIDGET_MAP[key].componente : null;
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
            compactType: 'compactUp',
            defaultItemCols: 4,
            defaultItemRows: 3,
            displayGrid: 'onDrag&Resize',
            draggable: { enabled: !this.tableroBloqueado },
            pushDirections: { north: true, east: true, south: true, west: false },
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
