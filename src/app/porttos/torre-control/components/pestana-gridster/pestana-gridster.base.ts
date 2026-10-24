/* eslint-disable @typescript-eslint/no-explicit-any */
/*
    Author: German Valencia
    Pattern: PORTTOS Layout Manager común de las pestañas (Gridster + Smart Widgets)
    Description: Lo que repetían todos los dashboards por pestaña: arma la cuadrícula con el layout guardado en sesión
      o el layout base del motor de layouts, resuelve cada código de widget en el WIDGET_MAP y le pasa su widgetConfig
      (puerto y pestaña incluidos). Cada widget trae sus datos solo.
      Todas las pestañas de la Torre de Control la usan, con la plantilla común pestana-gridster.component.html:
      Marítimo, Contenedores, Virtual Gate, GNL, Bodegas, Granel, Carga suelta, Capacidad, Noticias y Mapa.
      Una pestaña nueva solo declara su código, su nombre y un ícono. Lo propio de cada una va en los ganchos
      (todos opcionales):
        - alIniciar()              al iniciar (suscripciones, precarga de su servicio)
        - alCambiarPuerto()        antes de reconstruir por cambio de puerto; si devuelve true ya lo resolvió en sitio
        - antesDeArmar(puerto)     async, antes de armar (ej. Marítimo consulta las terminales del puerto)
        - necesitaLayoutBase(l)    si el layout de sesión no sirve y hay que pedir el base
        - obtenerLayoutBaseTab()   cómo pedir el layout base
        - armarDashboard / armarWidget   cómo se convierte el layout en items de gridster
        - despuesDeArmar(puerto)   al terminar de armar (ej. hidratación de Marítimo)
        - obtenerComponentePara()  resolución del componente (también la usa torre-control al agregar desde el lobby)
        - opcionesGridster()       ajustes de la cuadrícula sobre los comunes
        - alDestruir()             limpieza propia (destroy$ ya se completa en la base)
*/
import { ChangeDetectorRef, Directive, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { GridsterConfig, GridsterItem, GridType } from 'angular-gridster2';
import { Subject } from 'rxjs';
import { LayoutMetadataEngineService } from 'src/app/theme/shared/service/layout-metadata-engine.service';
import { LocalStorageService } from 'src/app/theme/shared/service';
import { WIDGET_MAP } from '../../widget-registry';

export type WidgetEnCuadricula = GridsterItem & {
    id?: string;
    idClon?: string;
    type: string;
    componenteTarget?: any;
    componenteInputs?: { widgetConfig: any; [input: string]: any };
};

@Directive()
export abstract class PestanaGridsterBase implements OnInit, OnChanges, OnDestroy {
    @Input() puerto: string = 'BUENAVENTURA';
    @Input() usuarioId!: string;
    @Input() lsWidgets: any[] = [];

    private _tableroBloqueado = true;
    @Input()
    set tableroBloqueado(bloqueado: boolean) {
        this._tableroBloqueado = bloqueado;
        if (this.options?.api) {
            this.options.draggable = { enabled: !bloqueado };
            this.options.resizable = { enabled: !bloqueado };
            this.options.api.optionsChanged!();
        }
    }
    get tableroBloqueado(): boolean {
        return this._tableroBloqueado;
    }

    /** Código de la pestaña en PTLPestanas (ej. TLC_GRANEL_001). */
    abstract readonly pestanaActiva: string;
    /** Nombre para los mensajes de carga y vacío (ej. 'Granel'). */
    abstract readonly nombrePestana: string;
    /** Ícono feather del estado vacío. */
    readonly iconoVacio: string = 'feather icon-grid';

    public options!: GridsterConfig;
    public dashboard: WidgetEnCuadricula[] = [];
    public cargando = true;
    public hayCambiosSinGuardar = false;
    private construyendoLayout = false;
    protected readonly destroy$ = new Subject<void>();

    constructor(
        protected layoutEngine: LayoutMetadataEngineService,
        protected localStorageService: LocalStorageService,
        public cdr: ChangeDetectorRef
    ) {
        this.iniciarGridster();
    }

    // ---------------------------------------------------------------- ciclo de vida

    ngOnInit(): void {
        this.alIniciar();
        if (this.lsWidgets?.length && !this.dashboard.length) this.inicializarLayoutPorPuerto();
    }

    ngOnChanges(changes: SimpleChanges): void {
        const catalogoListo = this.lsWidgets?.length > 0;
        if (changes['puerto'] && !changes['puerto'].isFirstChange() && catalogoListo) {
            // Los widgets reciben el nuevo widgetConfig y se reconectan solos
            if (this.alCambiarPuerto() !== true) this.inicializarLayoutPorPuerto(true);
        }
        if (changes['lsWidgets'] && catalogoListo && !this.dashboard.length) {
            this.inicializarLayoutPorPuerto();
        }
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
        this.alDestruir();
    }

    // ---------------------------------------------------------------- ganchos (opcionales)

    protected alIniciar(): void { }
    /** Devuelve true si la pestaña ya resolvió el cambio de puerto sin reconstruir. */
    protected alCambiarPuerto(): boolean | void { }
    protected async antesDeArmar(_puerto: string): Promise<void> { }
    protected necesitaLayoutBase(layout: any[] | null): boolean {
        return !layout || layout.length === 0;
    }
    protected async obtenerLayoutBaseTab(): Promise<any[]> {
        const layout = await this.layoutEngine.obtenerLayoutBase(this.pestanaActiva, this.usuarioId, this.lsWidgets);
        return (layout || []).filter((w: any) => w.type || w.codigoWidget);
    }
    protected despuesDeArmar(_puerto: string): void { }
    protected alDestruir(): void { }
    /** Ajustes de la cuadrícula sobre los comunes (ej. pushDirections, compactType, outerMarginBottom). */
    protected opcionesGridster(): Partial<GridsterConfig> {
        return {};
    }
    /**
     * Si el widgetConfig lleva titulo/subtitulo tomados del catálogo (nombreWidget/descripcionWidget).
     * Las pestañas cuyos widgets ya ponían su propio título lo apagan para no cambiarlo.
     */
    protected titulosDelCatalogo(): boolean {
        return true;
    }
    /** Prefijo del id de los widgets que no traen uno propio. */
    protected prefijoId(): string {
        return `wdg-${this.pestanaActiva}`;
    }

    /** Componente del WIDGET_MAP para un código (torre-control también lo usa al agregar desde el lobby). */
    obtenerComponentePara(codigoWidget: string): any {
        const codigo = (codigoWidget || '').trim().toUpperCase();
        return WIDGET_MAP[codigo]?.componente ?? null;
    }

    protected armarDashboard(layout: any[], puerto: string): WidgetEnCuadricula[] {
        return layout.map((w, index) => this.armarWidget(w, index, puerto));
    }

    protected armarWidget(w: any, index: number, puerto: string): WidgetEnCuadricula {
        const codigo = (w.type || w.codigoWidget || '').trim().toUpperCase();
        const id = w.idClon || w.id || `${this.prefijoId()}-${index}-${w.x}-${w.y}`;
        return {
            ...w,
            id,
            type: codigo,
            componenteTarget: this.obtenerComponentePara(codigo),
            componenteInputs: {
                widgetConfig: {
                    ...w, id, type: codigo, codigoWidget: codigo,
                    ...(this.titulosDelCatalogo()
                        ? { titulo: w.nombreWidget || w.titulo || w.tituloWidget, subtitulo: w.descripcionWidget || w.subtitulo }
                        : {}),
                    puerto,
                    pestana: this.pestanaActiva
                }
            }
        };
    }

    // ---------------------------------------------------------------- armado

    protected get puertoNormalizado(): string {
        return (this.puerto || 'BUENAVENTURA').trim().toUpperCase();
    }

    async inicializarLayoutPorPuerto(forzarReconstruccion = false): Promise<void> {
        if (this.construyendoLayout) return;
        this.construyendoLayout = true;
        this.cargando = true;
        const puerto = this.puertoNormalizado;
        const cacheKey = `${this.pestanaActiva}_${puerto}`;
        try {
            await this.antesDeArmar(puerto);
            let layout = !forzarReconstruccion ? this.localStorageService.getLayoutPestana(cacheKey) : null;
            if (this.necesitaLayoutBase(layout)) {
                layout = await this.obtenerLayoutBaseTab();
                this.localStorageService.guardarLayoutPestanaEnSesion(cacheKey, layout);
            }
            this.dashboard = this.armarDashboard(layout || [], puerto);
            this.despuesDeArmar(puerto);
        } catch (error) {
            console.error(`❌ [${this.nombrePestana}] Error construyendo el layout:`, error);
        } finally {
            this.cargando = false;
            this.construyendoLayout = false;
            this.cdr.detectChanges();
            setTimeout(() => this.options?.api?.resize?.(), 50);
        }
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
            ...this.opcionesGridster(),
            itemResizeCallback: () => { if (!this.cargando) this.hayCambiosSinGuardar = true; },
            itemChangeCallback: () => { if (!this.cargando) this.hayCambiosSinGuardar = true; }
        };
    }

    trackByWidget(index: number, w: any): string {
        const origen = w.componenteInputs?.widgetConfig || w;
        return origen.idClon || origen.id || origen.type || index.toString();
    }
}
