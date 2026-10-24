const iconosLogistica: { id: string; url: string }[] = [];

/* eslint-disable @typescript-eslint/no-explicit-any */
/*
    Author: German Valencia
    Componente: PORTTOS Smart Widget - Mapa Logístico (Autónomo, Ciclo MapLibre Sin Fugas y Capas Sincronizadas)
*/
import {
    Component,
    ElementRef,
    OnDestroy,
    ViewChild,
    AfterViewInit,
    OnInit,
    OnChanges,
    SimpleChanges,
    Input,
    HostBinding,
    HostListener,
    NgZone,
    ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, Subscription, interval, of } from 'rxjs';
import { catchError, debounceTime, switchMap } from 'rxjs/operators';
import {
    MaritimoVivoService, EmbudoLlegada, EtapaEmbudo, CodigoEtapaEmbudo
} from 'src/app/theme/shared/service/tablero-control/maritimo-vivo.service';
import { EmbudoLlegadaComponent } from './embudo-llegada/embudo-llegada.component';
import { RecorridoPanelComponent } from './recorrido-panel/recorrido-panel.component';
import {
    RecorridoMapaService, RecorridoMapa, EventoRecorrido
} from 'src/app/theme/shared/service/tablero-control/recorrido-mapa.service';
import { VACIO, eventosEntre, fechaDelSegundo, fotogramaRecorrido } from './mapa-recorrido';
import { ThemeService } from '../../../../theme/shared/service/theme.service';
import { LocalStorageService, SocketService } from 'src/app/theme/shared/service';
import { MapaGeneralService } from '../../../../theme/shared/service/tablero-control/mapa-general.service';
import { DashboardService } from 'src/app/theme/shared/service/tablero-control/dashboard.service';
import { FiltroTableroService } from 'src/app/theme/shared/service/tablero-control/filtro-tablero.service';
import { PuertosService } from 'src/app/theme/shared/service/tablero-control/puertos.service';
import { IWidget } from 'src/app/theme/shared/interfaces/torre-control/widget.interface';
import { FaroModel } from 'src/app/theme/shared/_helpers/models/tablero-control/faro.model';
import { FarosService } from 'src/app/theme/shared/service/tablero-control/faros.service';
import maplibregl, { GeoJSONSource } from 'maplibre-gl';
import { AlertasMapaService, AlertaMapa } from 'src/app/theme/shared/service/tablero-control/alertas-mapa.service';
import { parse } from 'wellknown';
import * as turf from '@turf/turf';
import { ColumnaTabla, TablaTclComponent } from '../../shared/tabla-tcl/tabla-tcl.component';
import { COLORES_MAPA, LEYENDA_MAPA, iconoDataUrl, registrarIconosMapa, tipoInfraestructura } from './mapa-iconos';
import { GRUPOS_CAPAS, visibilidadPorCapaMapLibre } from './mapa-capas';
import { esPosicion, esPoligonoValido, hacerCircular, convertirWKT_ACirculo, calcularBboxGeoJSON, procesarInfraestructuraWkt, marcadoresDeInfraestructura } from './mapa-geometria';
import { generarContenidoPopup, ContextoPopup } from './mapa-popups';
import { agregarFuentesYCapas } from './mapa-capas-maplibre';

const INFRA_THEME = {
    puerto: { fill: '#cbd5e1', line: '#475569', circle: '#cbd5e1' },
    terminal: { fill: '#fbbf24', line: '#d97706', circle: '#fbbf24' },
    muelle: { fill: '#0ea5e9', line: '#0284c7', circle: '#0ea5e9' },
    bodega_almacenamiento: { fill: '#8b5cf6', line: '#6d28d9', circle: '#8b5cf6' },
    patio_contenedores: { fill: '#a3e635', line: '#4d7c0f', circle: '#a3e635' },
    patio_vehiculos: { fill: '#14b8a6', line: '#0f766e', circle: '#14b8a6' },
    almacenamiento_granel: { fill: '#fb923c', line: '#c2410c', circle: '#fb923c' },
    almacenamiento_liquido: { fill: '#38bdf8', line: '#075985', circle: '#38bdf8' },
    default: { fill: '#94a3b8', line: '#475569', circle: '#94a3b8' }
};

export const NOMENCLATURA_ENTIDADES = [
    { id: 'naves', label: 'Motonaves en tránsito', color: '#00E5FF' },
    { id: 'clima', label: 'Alertas IDEAM', color: '#8b5cf6' },
    { id: 'accidentes', label: 'Incidentes Viales', color: '#ef4444' },
    { id: 'terrestre', label: 'Flota Terrestre', color: '#10b981' },
    { id: 'peajes', label: 'Peajes (Control)', color: '#eab308' }
];

export const ESTADOS_OPERATIVOS = [
    { id: 'libre', label: 'Libre / Fluido', color: '#22c55e' },
    { id: 'ocupado', label: 'Ocupado / Capacidad Media', color: '#facc15' },
    { id: 'congestionado', label: 'Congestionado / Retraso', color: '#f59e0b' },
    { id: 'critico', label: 'Crítico / Bloqueado', color: '#dc2626' },
    { id: 'desocupado', label: 'Desocupado / Sin Operación', color: '#94a3b8' }
];

export type TipoMapaBase = 'outdoor' | 'terreno' | 'satelite';

@Component({
    selector: 'app-mapa-logistico',
    standalone: true,
    imports: [CommonModule, EmbudoLlegadaComponent, RecorridoPanelComponent, TablaTclComponent],
    templateUrl: './mapa-logistico.component.html',
    styleUrls: ['./mapa-logistico.component.scss']
})
export class MapaLogisticoComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy, IWidget {
    @ViewChild('mapContainer') mapContainer!: ElementRef;
    /** Raíz del widget: es lo que se amplía (pantalla completa del navegador, el mismo mapa sin crear otro). */
    @ViewChild('raizMapa') raizMapa?: ElementRef<HTMLElement>;
    public pantallaCompleta = false;

    @Input() widgetConfig: any;
    @Input()
    set datosVivos(val: any) {
        this._datosVivos = val;
        if (val) {
            this.data = val;
            this.hidratarConDatosVivos(val);
        }
    }
    get datosVivos(): any {
        return this._datosVivos;
    }
    private _datosVivos: any;

    @Input() isEnfoque: boolean = false;
    @Input() mostrarTabla: boolean = false;
    @Input() title: string = '';
    @Input() config: any = { colspan: 12 };
    @Input() widgetId?: string;
    @Input() data: any;
    @Input() puertoSeleccionado: any;

    public map!: maplibregl.Map;
    public isDark: boolean = false;
    public estiloBase: TipoMapaBase = 'outdoor';

    private pollingSubscription!: Subscription;
    private subs: Subscription = new Subscription();
    private geocercasSubscription!: Subscription;
    private resizeObserver!: ResizeObserver;
    private maritimoSub!: Subscription;

    // Caché local de GeoJSON para re-hidratar capas al cambiar estilo base (Satélite/Outdoor) o Tema
    private peajesGeoJson: any = null;
    private ultimosIncidentes: any = null;
    private ultimaFlotaGeoJson: any = null;
    private ultimaInfraGeoJson: any = null;
    private ultimoClimaGeoJson: any = null;
    private ultimaViasGeoJson: any = null;
    private ultimasGeocercasKpiGeoJson: any = null;
    private ultimaVisibilidad: Record<string, boolean> = {};
    private lastGeocercaStr: string = '';
    /**
     * true desde el primer 'style.load' (fuentes y capas creadas). No se usa map.isStyleLoaded(): devuelve false
     * mientras cualquier fuente GeoJSON recarga (p. ej. al vaciar las naves al cambiar de puerto) y el enfoque se perdía.
     */
    private mapaListo = false;

    /** Estado de muelles (libre / ocupado / reservado / mantenimiento) del puerto activo. */
    private ultimoEstadoMuelles: any = null;
    /** Disparador común de las capas marítimas en vivo (estado de muelles y embudo de llegada). */
    private readonly recargaMaritima$ = new Subject<void>();

    /** Embudo de llegada (panel del mapa). */
    public mostrarEmbudo = false;
    public embudo: EmbudoLlegada | null = null;
    public cargandoEmbudo = false;
    public etapaEmbudo: CodigoEtapaEmbudo | null = null;
    private ultimoResaltadoEmbudo: any = null;

    /**
     * Modo reproducir (últimas 6/12/24 h). Mientras está activo, naves y camiones se pintan desde el recorrido
     * guardado y las actualizaciones en vivo solo refrescan la caché (al volver a en vivo se pinta lo último).
     */
    public modoRecorrido = false;
    public mostrarRecorrido = false;
    public recorrido: RecorridoMapa | null = null;
    public cargandoRecorrido = false;
    public errorRecorrido: string | null = null;
    public horasRecorrido = 24;
    public segundoRecorrido = 0;
    public reproduciendo = false;
    public velocidadRecorrido = 300;
    private recorridoSub?: Subscription;
    private cuadroRecorrido = 0;
    /** Fuentes que el modo reproducir toma prestadas de las capas en vivo. */
    private static readonly FUENTES_RECORRIDO = new Set(['naves-source', 'terrestre-source']);

    private navesActuales = new Map<string, any>();
    private farosActivos: any[] = [];

    private suscripcionesDatosIniciadas = false;
    private eventosClicksConfigurados = false;
    public menuConfigAbierto: boolean = false;

    public mostrarCapas: boolean = false;
    public mostrarLeyenda: boolean = false;
    /** Bitácora de alertas del mapa (motor de alertas, fase 1). */
    public mostrarBitacora: boolean = false;
    public bitacoraAlertas: AlertaMapa[] = [];
    public alertasSinLeer: number = 0;
    private pulsos = new Set<maplibregl.Marker>();
    public entidades = NOMENCLATURA_ENTIDADES;
    /** Leyenda con los mismos íconos del mapa */
    public leyendaMapa = LEYENDA_MAPA;
    public iconoLeyenda = iconoDataUrl;
    private ultimosMarcadoresInfra: any = null;
    public estados = ESTADOS_OPERATIVOS;

    /**
     * Menú de capas: sale del catálogo único (mapa-capas.ts). El estado "activa" se toma del servicio,
     * así el menú coincide con el mapa aunque el componente se vuelva a crear (cambio de pestaña).
     */
    public menuCapas = this.construirMenuCapas({});

    private construirMenuCapas(estado: Record<string, boolean>) {
        return GRUPOS_CAPAS.map((g) => ({
            ...g,
            capas: g.capas.map((c) => ({ ...c, activa: estado[c.id] ?? c.defecto }))
        }));
    }

    constructor(
        private _themeService: ThemeService,
        private _localStorage: LocalStorageService,
        private _torreService: DashboardService,
        public _mapaService: MapaGeneralService,
        public _farosService: FarosService,
        private _filtroTableroService: FiltroTableroService,
        private _puertosService: PuertosService,
        private _alertasMapa: AlertasMapaService,
        private _socketService: SocketService,
        private _maritimoVivo: MaritimoVivoService,
        private _recorridoMapa: RecorridoMapaService,
        private cdr: ChangeDetectorRef,
        private _zone: NgZone
    ) {
        this.isDark = this._localStorage.getThemeSettings()?.isDarkTheme || false;
    }

    @HostBinding('class') get hostClass(): string {
        const cols = this.widgetConfig?.cols || this.config?.colspan || 12;
        return `col-span-${cols}`;
    }

    /** Aviso sobre el mapa cuando la última sincronización con TomTom falló en alguna zona. */
    public avisoEventosViales: string | null = null;

    /** Despeje manual desde el popup: el API lo pasa a DESPEJADO y la capa se recarga. */
    private readonly alPulsarEnPopup = (ev: Event): void => {
        const boton = (ev.target as HTMLElement | null)?.closest?.('[data-despejar]') as HTMLButtonElement | null;
        if (!boton || boton.disabled) return;
        const codigo = decodeURIComponent(boton.getAttribute('data-despejar') || '');
        if (!codigo) return;
        boton.disabled = true;
        boton.textContent = 'Despejando…';
        this._mapaService.despejarEventoVial(codigo).subscribe({
            next: () => {
                boton.textContent = '✅ Despejado';
                setTimeout(() => (boton.closest('.maplibregl-popup')?.querySelector('.maplibregl-popup-close-button') as HTMLElement | null)?.click(), 800);
            },
            error: (e) => {
                boton.disabled = false;
                boton.textContent = e?.error?.msg || 'No se pudo despejar, reintentar';
            }
        });
    };

    get hayPanelAbierto(): boolean {
        return this.mostrarCapas ||
            this.mostrarLeyenda ||
            this.mostrarBitacora ||
            this.mostrarEmbudo ||
            this.mostrarRecorrido ||
            this.modoRecorrido;
    }

    cerrarPaneles(): void {
        this.mostrarCapas = false;
        this.mostrarLeyenda = false;
        this.mostrarBitacora = false;
        this.mostrarEmbudo = false;
        this.mostrarRecorrido = false;
    }

    ngOnInit(): void {
        this.menuCapas = this.construirMenuCapas(this._mapaService.visibilidad$.getValue() || {});
        // El puerto del widget se fija antes de la carga inicial: naves, flota, geocercas e incidentes ya salen filtrados
        this._mapaService.establecerPuerto(this.widgetConfig?.puerto);
        this._alertasMapa.iniciar(this.widgetConfig?.puerto);
        this.subs.add(this._alertasMapa.nueva$.subscribe((a) => this.pulsoAlerta(a)));
        this.subs.add(this._alertasMapa.enfocar$.subscribe((a) => this.enfocarAlerta(a)));
        this.subs.add(this._alertasMapa.bitacora$.subscribe((lista) => (this.bitacoraAlertas = lista)));
        this.subs.add(this._alertasMapa.sinLeer$.subscribe((n) => (this.alertasSinLeer = n)));
        if (this.widgetConfig?.titulo || this.widgetConfig?.tituloWidget) {
            this.title = this.widgetConfig.titulo || this.widgetConfig.tituloWidget;
        }

        this.subs.add(
            this._themeService.isDarkTheme$.subscribe((isDark) => {
                if (this.isDark === isDark) return;
                this.isDark = isDark;
                if (this.map) {
                    this.map.setStyle(this.getStyle());
                }
            })
        );

        this.subs.add(
            this._filtroTableroService.ciudad$.subscribe((ciudadEmitida: any) => {
                let idEsperado: string | null = null;
                if (typeof ciudadEmitida === 'string') idEsperado = ciudadEmitida;
                else if (ciudadEmitida?.id_puerto) idEsperado = ciudadEmitida.id_puerto;
                else if (ciudadEmitida?.id) idEsperado = ciudadEmitida.id;
                else if (ciudadEmitida?.target?.value) idEsperado = ciudadEmitida.target.value;

                if (idEsperado) {
                    this.cambiarPuertoMapa(idEsperado);
                    this.verificarCambioDeSession(idEsperado, 0);
                    // El radar AIS sigue al puerto del filtro: el backend solo rastrea los puertos que alguien mira
                    this._socketService.unirseSalaPuerto('maritimo', idEsperado);
                }
            })
        );

        this.cargarPeajesEstaticos();
        this.iniciarCapaMaritima();
        this.cargarFaros();
        this.iniciarEstadoMuelles();
    }

    ngAfterViewInit(): void {
        this.inicializarMapa();
        // Botón "Marcar como despejado" de los popups de eventos viales manuales (los popups viven dentro del mapa)
        this.raizMapa?.nativeElement.addEventListener('click', this.alPulsarEnPopup);

        this.resizeObserver = new ResizeObserver(() => {
            if (this.map) {
                // El setTimeout aquí evita el temido error de consola "ResizeObserver loop limit exceeded"
                // y le da un respiro a Angular para terminar de dibujar el DOM.
                setTimeout(() => {
                    this.map.resize();
                }, 0);
            }
        });

        if (this.mapContainer?.nativeElement) {
            this.resizeObserver.observe(this.mapContainer.nativeElement);
        }

        this.resizeObserver = new ResizeObserver(() => {
            if (this.map) requestAnimationFrame(() => this.map.resize());
        });

        if (this.mapContainer?.nativeElement) {
            this.resizeObserver.observe(this.mapContainer.nativeElement);
        }
    }

    ngOnChanges(changes: SimpleChanges): void {
        // Si cambia el puerto en widgetConfig desde el Layout Manager, reenfocamos la cámara
        if (changes['widgetConfig'] && !changes['widgetConfig'].isFirstChange()) {
            const nuevoPuerto = this.widgetConfig?.puerto;
            // Solo si el puerto es otro: normalmente el filtro (ciudad$) ya lo cambió y la cámara ya va en vuelo;
            // repetir el enfoque reiniciaría la animación.
            if (nuevoPuerto && this.cambiarPuertoMapa(nuevoPuerto)) {
                this.verificarCambioDeSession(nuevoPuerto, 0);
                this._socketService.unirseSalaPuerto('maritimo', nuevoPuerto);
            }
        }

        if (changes['isEnfoque'] && !changes['isEnfoque'].isFirstChange()) {
            setTimeout(() => {
                this.map?.resize();
            }, 80);
        }
    }

    ngOnDestroy(): void {
        this.raizMapa?.nativeElement.removeEventListener('click', this.alPulsarEnPopup);
        clearInterval(this.refrescoPanel);
        this.subs.unsubscribe();
        if (this.pollingSubscription) this.pollingSubscription.unsubscribe();
        if (this.geocercasSubscription) this.geocercasSubscription.unsubscribe();
        if (this.resizeObserver) this.resizeObserver.disconnect();
        this._alertasMapa.detener();
        this.pulsos.forEach((m) => m.remove());
        this.pulsos.clear();
        if (this.maritimoSub) this.maritimoSub.unsubscribe();
        this.detenerReproduccion();
        this.recorridoSub?.unsubscribe();

        this._socketService.salirSalaPuerto('maritimo');
        if (this.map) this.map.remove();
    }

    /**
     * Hidratación reactiva compatible con datos inyectados o cacheados
     */
    private hidratarConDatosVivos(data: any): void {
        if (!data) return;

        if (data.CAPA_INFRAESTRUCTURA) {
            this.ultimaInfraGeoJson = procesarInfraestructuraWkt(data.CAPA_INFRAESTRUCTURA);
            this.actualizarFuente('infra-source', this.ultimaInfraGeoJson);
            this.ultimosMarcadoresInfra = marcadoresDeInfraestructura(this.ultimaInfraGeoJson);
            this.actualizarFuente('infra-marcadores-source', this.ultimosMarcadoresInfra);
        }
        if (data.CAPA_TERRESTRE) {
            this.ultimaFlotaGeoJson = data.CAPA_TERRESTRE;
            this.actualizarFuente('terrestre-source', this.ultimaFlotaGeoJson);
        }
        if (data.CAPA_CLIMA) {
            this.ultimoClimaGeoJson = data.CAPA_CLIMA;
            this.actualizarFuente('clima-source', this.ultimoClimaGeoJson);
        }
        if (data.CAPA_VIAS) {
            this.ultimaViasGeoJson = data.CAPA_VIAS;
            this.actualizarFuente('vias-source', this.ultimaViasGeoJson);
        }
    }

    private iniciarCapaMaritima(): void {
        this.maritimoSub = this._socketService.listen('radar-actualizado').subscribe((featureSocket: any) => {
            // Corregido 2026-10-18: un error aquí (geocerca con huecos o multipolígono, coordenadas nulas)
            // cortaba la actualización del radar. Ahora se valida la nave y cada geocerca por separado.
            try {
                this.procesarNaveRadar(featureSocket);
            } catch (error) {
                console.warn('⚠️ [Mapa] Pulso AIS descartado:', error);
            }
        });
    }

    /**
     * Agregado 2026-10-18: al cambiar de puerto se limpian las naves del puerto anterior (antes quedaban en el mapa)
     * y se vuelven a pedir las capas filtradas por el puerto nuevo.
     */
    private cambiarPuertoMapa(puerto: string): boolean {
        if (!this._mapaService.establecerPuerto(puerto)) return false;
        this.salirRecorrido();
        this._alertasMapa.iniciar(puerto);
        this.embudo = null;
        this.seleccionarEtapaEmbudo(null);
        this.recargaMaritima$.next();
        this.navesActuales.clear();
        this.renderizarNavesFusionadas();
        this._mapaService.recargarCapasDelPuerto();
        if (this.geocercasSubscription) this.consultarGeocercas();
        return true;
    }

    /** Geocercas de faros con geometría válida para turf (se calcula una vez al cargar los faros). */
    private geocercasFarosValidas: Array<{ faro: any; poligono: any }> = [];

    private indexarGeocercasFaros(): void {
        this.geocercasFarosValidas = (this.farosActivos || []).flatMap((faro: any) => {
            const feature = faro?.geocerca_geo?.features?.[0];
            return feature && esPoligonoValido(feature.geometry) ? [{ faro, poligono: feature }] : [];
        });
    }

    private procesarNaveRadar(featureSocket: any): void {
        if (featureSocket && featureSocket.properties && esPosicion(featureSocket.geometry?.coordinates)) {
            const idUnico = featureSocket.properties.mmsi || featureSocket.properties.nombre_motonave;
            if (!idUnico) return;
            const nombreNave = featureSocket.properties.nombre_motonave || 'Desconocida';
            const naveExistente = this.navesActuales.get(idUnico);

            const puntoNave = turf.point(featureSocket.geometry.coordinates);
            let faroDetectado: any = null;

            for (const { faro, poligono } of this.geocercasFarosValidas) {
                try {
                    if (turf.booleanPointInPolygon(puntoNave, poligono)) {
                        faroDetectado = faro;
                        break;
                    }
                } catch {
                    // geocerca que turf no puede evaluar: se ignora
                }
            }

            // faro_actual_id alimenta el popup de la nave; la alerta de entrada a la zona la emite la API (fase 2)
            const faroDetectadoId = faroDetectado ? faroDetectado.id_faro : null;

            featureSocket.properties = {
                ...(naveExistente ? naveExistente.properties : {}),
                ...featureSocket.properties,
                faro_actual_id: faroDetectadoId
            };

            this.navesActuales.set(idUnico, featureSocket);
            this.renderizarNavesFusionadas();
        }
    }

    public cambiarEstiloBase(nuevoEstilo: TipoMapaBase): void {
        if (this.estiloBase === nuevoEstilo) return;
        this.estiloBase = nuevoEstilo;
        if (this.map) {
            this.map.setStyle(this.getStyle());
        }
    }

    public togglePanelCapas(): void {
        this.mostrarCapas = !this.mostrarCapas;
        if (this.mostrarCapas) { this.mostrarLeyenda = false; this.mostrarBitacora = false; this.cerrarEmbudo(); this.mostrarRecorrido = false; }
    }

    // ── Embudo de llegada ────────────────────────────────────────────────────

    public toggleEmbudo(): void {
        this.mostrarEmbudo = !this.mostrarEmbudo;
        if (this.mostrarEmbudo) {
            this.mostrarCapas = false;
            this.mostrarLeyenda = false;
            this.mostrarBitacora = false;
            this.mostrarRecorrido = false;
            this.recargaMaritima$.next();
        } else {
            this.seleccionarEtapaEmbudo(null);
        }
    }

    public cerrarEmbudo(): void {
        if (!this.mostrarEmbudo) return;
        this.mostrarEmbudo = false;
        this.seleccionarEtapaEmbudo(null);
    }

    /** Resalta en el mapa las naves de la etapa elegida (otra vez la misma etapa, o null, la quita). */
    public seleccionarEtapaEmbudo(etapa: EtapaEmbudo | null): void {
        this.etapaEmbudo = etapa ? etapa.codigo : null;
        this.resaltarEtapaEmbudo(true);
    }

    /** Pinta el anillo sobre las naves de la etapa activa; con encuadrar=true lleva la cámara a ellas. */
    private resaltarEtapaEmbudo(encuadrar: boolean): void {
        const etapa = this.embudo?.etapas.find((e) => e.codigo === this.etapaEmbudo) || null;
        const puntos = (etapa?.lista || [])
            .filter((n) => esPosicion([n.longitud, n.latitud]))
            .map((n) => ({
                type: 'Feature' as const,
                geometry: { type: 'Point' as const, coordinates: [n.longitud as number, n.latitud as number] },
                properties: { mmsi: n.mmsi, nombre: n.nombre }
            }));
        this.ultimoResaltadoEmbudo = { type: 'FeatureCollection', features: puntos };
        this.actualizarFuente('embudo-resaltado-source', this.ultimoResaltadoEmbudo);
        if (!encuadrar || !this.map || !puntos.length) return;
        const caja = new maplibregl.LngLatBounds();
        puntos.forEach((p) => caja.extend(p.geometry.coordinates as [number, number]));
        this.map.fitBounds(caja, { padding: 80, maxZoom: 13, duration: 1500, essential: true });
    }

    public toggleBitacora(): void {
        this.mostrarBitacora = !this.mostrarBitacora;
        if (this.mostrarBitacora) {
            this.mostrarCapas = false;
            this.mostrarLeyenda = false;
            this.cerrarEmbudo();
            this.mostrarRecorrido = false;
            this._alertasMapa.marcarLeidas();
        }
    }

    public verAlerta(alerta: AlertaMapa): void {
        this._alertasMapa.enfocar(alerta);
    }

    public trackAlerta(_: number, a: AlertaMapa): string {
        return a.id;
    }

    /**
     * Estado de muelles del puerto activo (GET /api/maritimo/:puerto/muelles-estado). Se recarga al tener el mapa
     * listo, al cambiar de puerto, con cada cambio de estado AIS (atraque, zarpe…) y cada 2 min por el line-up.
     * Las recargas seguidas se agrupan (1,5 s) y una respuesta vieja nunca pisa a una nueva (switchMap).
     */
    private iniciarEstadoMuelles(): void {
        this.subs.add(
            this.recargaMaritima$.pipe(
                debounceTime(1500),
                switchMap(() => {
                    const puerto = this._mapaService.puertoFiltro;
                    return puerto ? this._maritimoVivo.estadoMuelles(puerto).pipe(catchError(() => of(null))) : of(null);
                })
            ).subscribe((fc) => {
                this.ultimoEstadoMuelles = fc || { type: 'FeatureCollection', features: [] };
                this.actualizarFuente('muelles-estado-source', this.ultimoEstadoMuelles);
            })
        );
        // Embudo de llegada: mismos disparadores; solo se consulta con el panel abierto
        this.subs.add(
            this.recargaMaritima$.pipe(
                debounceTime(1500),
                switchMap(() => {
                    const puerto = this._mapaService.puertoFiltro;
                    if (!this.mostrarEmbudo || !puerto) return of(undefined);
                    this.cargandoEmbudo = true;
                    return this._maritimoVivo.embudo(puerto).pipe(catchError(() => of(null)));
                })
            ).subscribe((embudo) => {
                if (embudo === undefined) return;
                this.cargandoEmbudo = false;
                this.embudo = embudo;
                this.resaltarEtapaEmbudo(false);
            })
        );
        this.subs.add(this._socketService.listen('nave-cambio-estado').subscribe(() => this.recargaMaritima$.next()));
        this.subs.add(interval(120000).subscribe(() => this.recargaMaritima$.next()));
    }

    /** Anillo que late ~10 s en el punto de la alerta, del color de su nivel. */
    private pulsoAlerta(alerta: AlertaMapa): void {
        if (!this.map || !alerta?.coordenadas) return;
        const el = document.createElement('div');
        el.className = `pulso-alerta pulso-${alerta.nivel}`;
        const marcador = new maplibregl.Marker({ element: el }).setLngLat(alerta.coordenadas).addTo(this.map);
        this.pulsos.add(marcador);
        setTimeout(() => {
            marcador.remove();
            this.pulsos.delete(marcador);
        }, 10000);
    }

    /** Clic en una notificación o en la bitácora: la cámara vuela al punto y vuelve a latir. */
    private enfocarAlerta(alerta: AlertaMapa): void {
        if (!this.map || !alerta?.coordenadas) return;
        this.map.flyTo({ center: alerta.coordenadas, zoom: Math.max(this.map.getZoom(), 13), duration: 1800, essential: true });
        this.pulsoAlerta(alerta);
    }

    // ── Modo reproducir (últimas horas) ──────────────────────────────────────

    /** Botón del mapa: abre el panel y entra al modo reproducir; si ya está abierto, solo lo oculta. */
    public toggleRecorrido(): void {
        this.mostrarRecorrido = this.mostrarRecorrido ? false : true;
        this.modoRecorrido = this.modoRecorrido ? false : true;
        if (!this.mostrarRecorrido) return;
        this.mostrarCapas = false;
        this.mostrarLeyenda = false;
        this.mostrarBitacora = false;
        this.cerrarEmbudo();
        if (!this.modoRecorrido) {
            this.entrarRecorrido();
        }
    }

    private entrarRecorrido(): void {
        this.modoRecorrido = true;
        this.cargarRecorrido(this.horasRecorrido);
    }

    /** Hora del recorrido que se está viendo (aviso sobre el mapa). */
    get fechaRecorrido(): Date | null {
        return this.recorrido ? fechaDelSegundo(this.recorrido, this.segundoRecorrido) : null;
    }

    public cambiarHorasRecorrido(horas: number): void {
        if (horas === this.horasRecorrido && this.recorrido) return;
        this.cargarRecorrido(horas);
    }

    private cargarRecorrido(horas: number): void {
        const puerto = this._mapaService.puertoFiltro;
        this.detenerReproduccion();
        this.horasRecorrido = horas;
        this.recorridoSub?.unsubscribe();
        if (!puerto) {
            this.errorRecorrido = 'Elige un puerto para reproducir su recorrido.';
            return;
        }
        this.cargandoRecorrido = true;
        this.errorRecorrido = null;
        this.recorridoSub = this._recorridoMapa.recorrido(puerto, horas).subscribe({
            next: (r) => {
                this.cargandoRecorrido = false;
                this.recorrido = r;
                // Arranca al inicio de la ventana; el usuario pulsa reproducir o mueve la barra
                this.segundoRecorrido = 0;
                this.pintarRecorrido();
            },
            error: (e) => {
                this.cargandoRecorrido = false;
                this.recorrido = null;
                this.errorRecorrido = e?.error?.msg || 'No se pudo cargar el recorrido. Intenta de nuevo en un momento.';
                this.pintarRecorrido();
            }
        });
    }

    public alternarReproduccion(): void {
        if (this.reproduciendo) { this.detenerReproduccion(); return; }
        if (!this.recorrido) return;
        if (this.segundoRecorrido >= this.recorrido.duracionSeg) this.segundoRecorrido = 0;
        this.reproduciendo = true;
        // El reloj corre fuera de Angular: 10 cuadros por segundo al mapa, la hora del panel 4 veces por segundo
        this._zone.runOutsideAngular(() => {
            let previo = performance.now();
            let ultimoPintado = 0;
            let ultimoPanel = 0;
            const paso = (ahora: number) => {
                if (!this.reproduciendo || !this.recorrido) return;
                const antes = this.segundoRecorrido;
                const fin = this.recorrido.duracionSeg;
                this.segundoRecorrido = Math.min(fin, antes + ((ahora - previo) / 1000) * this.velocidadRecorrido);
                previo = ahora;
                if (ahora - ultimoPintado >= 100) {
                    ultimoPintado = ahora;
                    this.pintarRecorrido();
                }
                eventosEntre(this.recorrido, antes, this.segundoRecorrido).slice(0, 5).forEach((e) => this.pulsoEvento(e));
                const termino = this.segundoRecorrido >= fin;
                if (termino || ahora - ultimoPanel >= 250) {
                    ultimoPanel = ahora;
                    this._zone.run(() => {
                        if (termino) { this.reproduciendo = false; this.pintarRecorrido(); }
                    });
                }
                if (!termino) this.cuadroRecorrido = requestAnimationFrame(paso);
            };
            this.cuadroRecorrido = requestAnimationFrame(paso);
        });
    }

    private detenerReproduccion(): void {
        this.reproduciendo = false;
        if (this.cuadroRecorrido) cancelAnimationFrame(this.cuadroRecorrido);
        this.cuadroRecorrido = 0;
    }

    public cambiarVelocidadRecorrido(velocidad: number): void {
        this.velocidadRecorrido = velocidad;
    }

    /** Barra de tiempo o saltos de ±15 min. */
    public buscarRecorrido(segundo: number): void {
        if (!this.recorrido) return;
        this.segundoRecorrido = Math.min(this.recorrido.duracionSeg, Math.max(0, segundo));
        this.pintarRecorrido();
    }

    /** Clic en un evento: va un minuto antes de que ocurra y lleva la cámara al punto. */
    public verEventoRecorrido(evento: EventoRecorrido): void {
        this.buscarRecorrido(evento.seg - 60);
        if (this.map && evento.coordenadas) {
            this.map.flyTo({ center: evento.coordenadas, zoom: Math.max(this.map.getZoom(), 13), duration: 1500, essential: true });
            this.pulsoEvento(evento);
        }
    }

    /** Sale del modo reproducir: borra las estelas y vuelve a pintar lo último en vivo. */
    public salirRecorrido(): void {
        if (!this.modoRecorrido) return;
        this.detenerReproduccion();
        this.recorridoSub?.unsubscribe();
        this.modoRecorrido = false;
        this.mostrarRecorrido = false;
        this.recorrido = null;
        this.errorRecorrido = null;
        this.cargandoRecorrido = false;
        this.escribirFuente('recorrido-estelas-source', VACIO);
        this.renderizarNavesFusionadas();
        this.escribirFuente('terrestre-source', this.ultimaFlotaGeoJson || VACIO);
    }

    /** Pinta naves, camiones y estelas del segundo actual (o vacío si no hay recorrido). */
    private pintarRecorrido(): void {
        if (!this.modoRecorrido || !this.map) return;
        const f = this.recorrido ? fotogramaRecorrido(this.recorrido, this.segundoRecorrido) : { naves: VACIO, camiones: VACIO, estelas: VACIO };
        this.escribirFuente('naves-source', f.naves);
        this.escribirFuente('terrestre-source', f.camiones);
        this.escribirFuente('recorrido-estelas-source', f.estelas);
    }

    /** Anillo del color del nivel en el punto del evento (el mismo de las alertas en vivo). */
    private pulsoEvento(e: EventoRecorrido): void {
        if (!e.coordenadas) return;
        this.pulsoAlerta({ nivel: e.nivel, coordenadas: e.coordenadas } as AlertaMapa);
    }

    public toggleLeyenda(): void {
        this.mostrarLeyenda = !this.mostrarLeyenda;
        if (this.mostrarLeyenda) { this.mostrarCapas = false; this.mostrarBitacora = false; this.cerrarEmbudo(); this.mostrarRecorrido = false; }
    }

    public toggleGrupoMenu(grupo: any): void {
        grupo.abierto = !grupo.abierto;
    }

    private cargarPeajesEstaticos(): void {
        this.subs.add(
            this._mapaService.obtenerPeajes().subscribe({
                next: (data) => {
                    this.peajesGeoJson = data;
                    if (this.map && this.map.getSource('peajes-source')) {
                        this.actualizarFuente('peajes-source', this.peajesGeoJson);
                    }
                    this.procesarRelacionIncidentePeaje();
                }
            })
        );
    }

    private cargarFaros(): void {
        this.subs.add(
            this._farosService.getAllFaros().subscribe({
                next: (faros: FaroModel[]) => {
                    this.farosActivos = faros || [];
                    this.indexarGeocercasFaros();
                    this.renderizarFarosMapa();
                },
                error: (error) => {
                    console.error('Error al obtener los faros:', error);
                }
            })
        );
    }

    private renderizarFarosMapa(): void {
        if (!this.map || !this.mapaListo) return;

        const featuresFaros: any[] = [];
        this.farosActivos.forEach((faro) => {
            if (faro.geocerca_geo && faro.geocerca_geo.features && faro.geocerca_geo.features.length > 0) {
                const feature = faro.geocerca_geo.features[0];
                feature.properties = {
                    ...feature.properties,
                    id_faro: faro.id_faro,
                    nombre_faro: faro.nombre_faro,
                    color_ui: faro.color_ui || '#00E5FF'
                };
                featuresFaros.push(feature);
            }
        });

        const farosGeoJSON = { type: 'FeatureCollection' as const, features: featuresFaros };
        this.actualizarFuente('source-faros', farosGeoJSON);
    }

    /**
     * Puerto activo con su geometría. El id sale del filtro del tablero (fuente única del puerto) y el detalle
     * del catálogo de puertos. (Antes se leía de LocalStorageService, que no guardaba el cambio de puerto.)
     */
    private puertoActivo(): any {
        const id = String(this._filtroTableroService.getCiudadActual() || '').toUpperCase().replace(/\s+/g, '_');
        if (!id || id === 'ALL') return null;
        const normalizar = (v: any) => String(v || '').toUpperCase().replace(/\s+/g, '_');
        return (this._puertosService.getPuertosActuales() || [])
            .find((p: any) => normalizar(p.id_puerto) === id || normalizar(p.nombre) === id) || null;
    }

    /**
     * Enfoca el puerto elegido. Reintenta (hasta ~5 s) mientras el mapa termina de cargar o el catálogo de puertos
     * aún no trae ese puerto; en cuanto lo trae, vuela a él.
     */
    private verificarCambioDeSession(idEsperado: string, intento: number): void {
        if (!this.map) return;

        if (!idEsperado || idEsperado.toUpperCase() === 'ALL') {
            if (this.mapaListo) this.irAColombia();
            else if (intento < 20) setTimeout(() => this.verificarCambioDeSession(idEsperado, intento + 1), 250);
            return;
        }

        const listo = this.mapaListo && !!this.puertoActivo();
        if (!listo && intento < 20) {
            setTimeout(() => this.verificarCambioDeSession(idEsperado, intento + 1), 250);
            return;
        }
        this.leerSessionYEnfocar(true);
    }

    private leerSessionYEnfocar(moverCamara: boolean = true): void {
        if (!this.map || !this.mapaListo) return;

        this.map.resize();
        const puerto = this.puertoActivo();
        const highlightSource = this.map.getSource('highlight-source') as GeoJSONSource;

        if (!puerto || (!puerto.geocerca_geo && !puerto.puerto_geocerca_wkt)) {
            if (!moverCamara) return;
            const centro = puerto ? this.centroDePuerto(puerto) : null;
            if (centro) {
                // Puerto sin geocerca: se limpia el resaltado anterior y se vuela a su ubicación
                if (highlightSource) highlightSource.setData({ type: 'FeatureCollection', features: [] });
                this.lastGeocercaStr = '';
                this.map.flyTo({ center: centro, zoom: 12, duration: 2500, essential: true });
            } else {
                this.irAColombia(highlightSource);
            }
            return;
        }

        this.lastGeocercaStr = puerto.geocerca_geo
            ? typeof puerto.geocerca_geo === 'string'
                ? puerto.geocerca_geo
                : JSON.stringify(puerto.geocerca_geo)
            : puerto.puerto_geocerca_wkt || '';

        let geojsonObj = null;
        try {
            if (puerto.geocerca_geo) {
                geojsonObj =
                    typeof puerto.geocerca_geo === 'string' ? JSON.parse(puerto.geocerca_geo) : puerto.geocerca_geo;
            } else if (puerto.puerto_geocerca_wkt) {
                geojsonObj = parse(puerto.puerto_geocerca_wkt);
            }
            if (geojsonObj) geojsonObj = hacerCircular(geojsonObj);
        } catch (e) { }

        if (geojsonObj) {
            let dataToSet: any = { type: 'FeatureCollection', features: [] };
            if (geojsonObj.type === 'FeatureCollection') dataToSet = geojsonObj;
            else if (geojsonObj.type === 'Feature') dataToSet.features.push(geojsonObj);
            else dataToSet.features.push({ type: 'Feature', geometry: geojsonObj, properties: {} });

            if (highlightSource) highlightSource.setData(dataToSet);

            if (!moverCamara) return;

            const bounds = calcularBboxGeoJSON(dataToSet);
            let centroExacto = null;
            if (puerto.ubicacion_geo) {
                try {
                    const ubi =
                        typeof puerto.ubicacion_geo === 'string'
                            ? JSON.parse(puerto.ubicacion_geo)
                            : puerto.ubicacion_geo;
                    centroExacto = turf.center(ubi).geometry.coordinates;
                } catch (e) { }
            }

            if (bounds && centroExacto) {
                const camera = this.map.cameraForBounds(bounds, { padding: 50 });
                const zoomCalculado = camera?.zoom ? Math.min(camera.zoom, 14) : 14;
                this.map.flyTo({
                    center: centroExacto as [number, number],
                    zoom: zoomCalculado,
                    duration: 2500,
                    essential: true
                });
            } else if (bounds) {
                this.map.fitBounds(bounds, { padding: 50, duration: 2500, maxZoom: 14, essential: true });
            } else {
                this.irAColombia(highlightSource);
            }
        } else {
            if (moverCamara) this.irAColombia(highlightSource);
        }
    }

    /** Centro de la ubicación registrada del puerto (ubicacion_geo), o null. */
    private centroDePuerto(puerto: any): [number, number] | null {
        if (!puerto?.ubicacion_geo) return null;
        try {
            const ubi = typeof puerto.ubicacion_geo === 'string' ? JSON.parse(puerto.ubicacion_geo) : puerto.ubicacion_geo;
            const c = turf.center(ubi).geometry.coordinates;
            return esPosicion(c) ? [c[0], c[1]] : null;
        } catch {
            return null;
        }
    }

    private irAColombia(source?: GeoJSONSource): void {
        if (!this.map) return;
        const highlight = source || (this.map.getSource('highlight-source') as GeoJSONSource);
        if (highlight) highlight.setData({ type: 'FeatureCollection', features: [] });
        this.map.resize();
        this.map.flyTo({ center: [-73.5, 4.0], zoom: 5.5, duration: 2000 });
    }

    /**
     * Inicialización unificada de MapLibre GL sin duplicar suscripciones en cambios de estilo
     */
    private inicializarMapa(): void {
        const mapOptions: any = {
            container: this.mapContainer.nativeElement,
            style: this.getStyle(),
            attributionControl: false,
            center: [-73.5, 4.0],
            zoom: 5.5
        };

        this.map = new maplibregl.Map(mapOptions);

        setTimeout(() => {
            if (this.map) {
                this.map.resize();
            }
        }, 300);

        const iconosLogistica = [
            { id: 'icono-barco', url: '/assets/icons/barco.png' },
            { id: 'icono-camion', url: '/assets/icons/camion.png' },
            { id: 'icono-camion-frente', url: '/assets/icons/camion-frente.png' },
            { id: 'icono-accidente', url: '/assets/icons/accidente.png' },
            { id: 'accidente-cluster', url: '/assets/icons/accidente-cluster.png' },
            { id: 'icono-congestion', url: '/assets/icons/congestion.png' },
            { id: 'icono-obra', url: '/assets/icons/congestion.png' },
            { id: 'congestion-cluster', url: '/assets/icons/congestion-cluster.png' },
            { id: 'marcador-puerto', url: '/assets/icons/puerto.png' },
            { id: 'icono-peaje', url: '/assets/icons/peaje.png' },
            { id: 'peaje-cluster', url: '/assets/icons/peaje-cluster.png' },
            { id: 'icono-faro', url: '/assets/icons/faro.png' },
            { id: 'clima-lluvia', url: '/assets/icons/clima-lluvia.png' },
            { id: 'clima-tormenta', url: '/assets/icons/clima-tormenta.png' },
            { id: 'clima-viento', url: '/assets/icons/clima-viento.png' },
            { id: 'clima-incendio', url: '/assets/icons/clima-incendio.png' },
            { id: 'clima-defecto', url: '/assets/icons/clima.png' }
        ];

        // Único listener 'style.load': carga íconos, reconstruye capas y re-hidrata fuentes
        this.map.on('style.load', async () => {
            await this.cargarIconosMasivamente(iconosLogistica);
            await registrarIconosMapa(this.map);
            this.viasDescargadas = agregarFuentesYCapas(this.map, { isDark: this.isDark, viasGeoJson: this.ultimaViasGeoJson });
            this.mapaListo = true;
            this.recargaMaritima$.next();
            this.rehidratarFuentesEnMapa();

            // Las suscripciones RxJS, timers y eventos click se registran UNA SOLA VEZ
            if (!this.eventosClicksConfigurados) {
                this.configurarEventosClicks();
                this.eventosClicksConfigurados = true;
            }

            if (!this.suscripcionesDatosIniciadas) {
                this.suscribirseADatos();
                this.iniciarRadarGeocercas();
                this.iniciarRadarTiempoReal();
                this._mapaService.cargarDatosIniciales();
                this.suscripcionesDatosIniciadas = true;
            }
        });

        this.map.once('idle', () => {
            const comprobarDimensiones = setInterval(() => {
                if (this.mapContainer?.nativeElement?.offsetWidth > 0) {
                    clearInterval(comprobarDimensiones);
                    this.map.resize();
                    setTimeout(() => {
                        this.leerSessionYEnfocar(true);
                    }, 50);
                }
            }, 100);
            setTimeout(() => clearInterval(comprobarDimensiones), 3000);
        });

        // this.map.addControl(new maplibregl.NavigationControl(), 'top-right');
    }

    /**
     * Restaura los datos en las fuentes GeoJSON después de alternar Satélite/Outdoor o Tema Oscuro/Claro
     */
    private rehidratarFuentesEnMapa(): void {
        if (this.ultimaInfraGeoJson) this.actualizarFuente('infra-source', this.ultimaInfraGeoJson);
        if (this.ultimosMarcadoresInfra) this.actualizarFuente('infra-marcadores-source', this.ultimosMarcadoresInfra);
        if (this.ultimaFlotaGeoJson) this.actualizarFuente('terrestre-source', this.ultimaFlotaGeoJson);
        if (this.ultimoClimaGeoJson) this.actualizarFuente('clima-source', this.ultimoClimaGeoJson);
        if (this.ultimaViasGeoJson) this.actualizarFuente('vias-source', this.ultimaViasGeoJson);
        if (this.peajesGeoJson) {
            this.actualizarFuente('peajes-source', this.peajesGeoJson);
            this.procesarRelacionIncidentePeaje();
        }
        if (this.ultimasGeocercasKpiGeoJson) {
            this.actualizarFuente('geocercas-kpi-source', this.ultimasGeocercasKpiGeoJson);
        }
        if (this.navesActuales.size > 0) {
            this.renderizarNavesFusionadas();
        }
        if (this.ultimoEstadoMuelles) this.actualizarFuente('muelles-estado-source', this.ultimoEstadoMuelles);
        if (this.ultimoResaltadoEmbudo) this.actualizarFuente('embudo-resaltado-source', this.ultimoResaltadoEmbudo);
        if (this.farosActivos.length > 0) {
            this.renderizarFarosMapa();
        }
        if (Object.keys(this.ultimaVisibilidad).length > 0) {
            this.aplicarVisibilidadCapas(this.ultimaVisibilidad);
        }
        if (this.modoRecorrido) this.pintarRecorrido();
        this.leerSessionYEnfocar(false);
    }

    private consultarGeocercas(): void {
        this._mapaService.getGeocercasKPIs().subscribe({
            next: (res: any) => {
                if (!Array.isArray(res?.data)) return;

                // Corregido 2026-10-18: una geocerca sin geometría (wkt nulo o inválido) tumbaba toda la capa en
                // cada ciclo de 30 s; ahora se omite esa geocerca.
                const features = res.data.map((item: any) => {
                    let geometry: any = null;
                    try {
                        geometry = item.wkt ? convertirWKT_ACirculo(item.wkt, item.radio_metros) : null;
                    } catch {
                        geometry = null;
                    }
                    return { item, geometry };
                }).filter((x: any) => x.geometry && x.geometry.type && x.geometry.coordinates)
                    .map(({ item, geometry }: any) => ({
                        type: 'Feature',
                        geometry,
                        properties: {
                            nombre_faro: item.nombre_faro,
                            tipo_faro: item.tipo_faro,
                            estado_kpi: item.estado_kpi,
                            color_ui: item.color_ui,
                            total_camiones: item.total_camiones,
                            camiones_ruta: item.camiones_ruta,
                            camiones_detenidos: item.camiones_detenidos,
                            total_naves: item.total_naves,
                            // El backend envía fondeadas/avisadas/arribadas (antes se leía naves_* → NaN en el popup)
                            naves_fondeadas: Number(item.naves_fondeadas ?? item.fondeadas ?? 0),
                            naves_avisadas: Number(item.naves_avisadas ?? item.avisadas ?? 0),
                            naves_arribadas: Number(item.naves_arribadas ?? item.arribadas ?? 0)
                        }
                    }));

                this.ultimasGeocercasKpiGeoJson = { type: 'FeatureCollection', features };
                this.actualizarFuente('geocercas-kpi-source', this.ultimasGeocercasKpiGeoJson);
            },
            error: (err) => console.error('Error radar Faros en el componente:', err)
        });
    }

    private iniciarRadarTiempoReal(): void {
        if (this.pollingSubscription) this.pollingSubscription.unsubscribe();
        this.pollingSubscription = interval(10000).subscribe(() => {
            this._mapaService.getFlotaGeoJSON().subscribe({
                next: (nuevoGeoJSON) => {
                    this.ultimaFlotaGeoJson = nuevoGeoJSON;
                    this.actualizarFuente('terrestre-source', nuevoGeoJSON);
                }
            });
        });
    }

    private procesarRelacionIncidentePeaje(): void {
        const geocercasFeatures: any[] = [];

        if (this.peajesGeoJson && this.peajesGeoJson.features) {
            this.peajesGeoJson.features.forEach((peaje: any) => {
                if (peaje.geometry && peaje.geometry.coordinates) {
                    const puntoTurf = turf.point(peaje.geometry.coordinates);
                    const buffer2km = turf.buffer(puntoTurf, 2, { units: 'kilometers' });
                    if (buffer2km) {
                        buffer2km.properties = { nombrePeaje: peaje.properties?.nombre || 'Peaje' };
                        geocercasFeatures.push(buffer2km);
                    }
                }
            });
            this.actualizarFuente('geocercas-peajes-source', {
                type: 'FeatureCollection',
                features: geocercasFeatures
            });
        }

        if (!this.ultimosIncidentes || !this.ultimosIncidentes.features) return;

        this.ultimosIncidentes.features.forEach((incidente: any) => {
            incidente.properties.afectaPeaje = false;
            incidente.properties.peajeAfectado = '';

            if (incidente.geometry && incidente.geometry.coordinates && geocercasFeatures.length > 0) {
                const puntoIncidente = turf.point(incidente.geometry.coordinates);
                for (const geocerca of geocercasFeatures) {
                    if (turf.booleanPointInPolygon(puntoIncidente, geocerca)) {
                        incidente.properties.afectaPeaje = true;
                        incidente.properties.peajeAfectado = geocerca.properties.nombrePeaje;
                        break;
                    }
                }
            }
        });

        this.actualizarFuente('alertas-viales-source', this.ultimosIncidentes);
    }

    private configurarEventosClicks(): void {
        // Clic en un grupo: acercar hasta separarlo (antes no hacía nada o abría un popup genérico)
        const capasGrupo: Array<[string, string]> = [
            ['naves-cluster-symbol', 'naves-source'],
            ['terrestre-cluster-content', 'terrestre-source'],
            ['peajes-cluster-content', 'peajes-source'],
            ['viales-cluster-content', 'alertas-viales-source'],
            ['clima-cluster-symbol', 'clima-source']
        ];
        capasGrupo.forEach(([capa, fuente]) => {
            this.map.on('click', capa, async (e: any) => {
                const f = e.features?.[0];
                const idGrupo = f?.properties?.cluster_id;
                const src = this.map.getSource(fuente) as any;
                if (idGrupo === undefined || !src?.getClusterExpansionZoom) return;
                try {
                    const zoom = await src.getClusterExpansionZoom(idGrupo);
                    this.map.easeTo({ center: f.geometry.coordinates, zoom: Math.min(zoom + 0.3, 17), duration: 600 });
                } catch { /* grupo ya no existe */ }
            });
            this.map.on('mouseenter', capa, () => (this.map.getCanvas().style.cursor = 'zoom-in'));
            this.map.on('mouseleave', capa, () => (this.map.getCanvas().style.cursor = ''));
        });

        const capasClickeables = [
            'capa-infra-fill',
            'capa-infra-terminal-fill',
            'capa-infra-point',
            'naves-individual',
            'terrestre-individual',
            'viales-individual',
            'clima-individual',
            'peajes-individual',
            'infra-marcadores-puerto',
            'infra-marcadores-terminal',
            'infra-marcadores-detalle',
            'geocerca-fill-layer',
            'muelles-estado-fill'
        ];

        capasClickeables.forEach((layerId) => {
            this.map.on('click', layerId, (e) => {
                if (!e.features || e.features.length === 0) return;
                const html = generarContenidoPopup(layerId, e.features[0], this.contextoPopup());
                const themeClass = this.isDark ? 'popup-dark' : 'popup-light';
                new maplibregl.Popup({
                    closeButton: true,
                    className: `PORTTOS-popup popup-${layerId} ${themeClass}`
                })
                    .setLngLat(e.lngLat)
                    .setHTML(html)
                    .addTo(this.map);
            });

            this.map.on('mouseenter', layerId, () => (this.map.getCanvas().style.cursor = 'pointer'));
            this.map.on('mouseleave', layerId, () => (this.map.getCanvas().style.cursor = ''));
        });
    }

    private async cargarIconosMasivamente(iconos: { id: string; url: string }[]): Promise<void> {
        const promesas = iconos.map(async (icono) => {
            if (this.map.hasImage(icono.id)) return;
            try {
                const response = await this.map.loadImage(icono.url);
                if (response && response.data && !this.map.hasImage(icono.id)) {
                    this.map.addImage(icono.id, response.data);
                }
            } catch (error) {
                console.error(`Error cargando el ícono [${icono.id}]:`, error);
            }
        });

        await Promise.all(promesas);
    }

    private suscribirseADatos(): void {
        this.subs.add(
            this._mapaService.gemeloDigital$.subscribe((data) => {
                if (!data) return;
                this.hidratarConDatosVivos(data);
            })
        );

        this.subs.add(
            this._mapaService.naves$.subscribe((data: any) => {
                const dataToSet = data && data.data && data.data.type === 'FeatureCollection' ? data.data : data;
                if (dataToSet && dataToSet.features) {
                    dataToSet.features.forEach((feature: any) => {
                        const idUnico =
                            feature.properties.mmsi || feature.properties.omi || feature.properties.nombre_motonave;
                        if (idUnico) this.navesActuales.set(idUnico, feature);
                    });
                    this.renderizarNavesFusionadas();
                }
            })
        );

        this.subs.add(
            this._mapaService.origenViales$.subscribe((o) => {
                this.avisoEventosViales = o?.zonasFallidas?.length
                    ? `Eventos viales: TomTom no respondió en ${o.zonasFallidas.join(', ')}. Se muestran como estaban en la última consulta buena.`
                    : null;
                this.cdr.markForCheck();
            })
        );

        this.subs.add(
            this._mapaService.accidentes$.subscribe((data) => {
                if (data) {
                    this.ultimosIncidentes = data;
                    this.procesarRelacionIncidentePeaje();
                }
            })
        );

        this.subs.add(
            this._mapaService.visibilidad$.subscribe((vis) => {
                if (!vis) return;
                this.ultimaVisibilidad = vis;
                this.aplicarVisibilidadCapas(vis);
            })
        );
    }

    /**
     * Aplica la visibilidad sincronizando tanto los íconos individuales como sus círculos y textos de clúster
     */
    private aplicarVisibilidadCapas(vis: Record<string, boolean>): void {
        if (!this.map || !this.mapaListo) return;

        // Rediseño 2026-10-18: la visibilidad sale del catálogo único (mapa-capas.ts): cada entrada del menú
        // enciende/apaga todas sus capas de MapLibre (íconos, grupos, rellenos, bordes y etiquetas).
        if ((vis['vias'] ?? false) === true) this.asegurarRedVial();

        visibilidadPorCapaMapLibre(vis).forEach((m) => {
            if (this.map.getLayer(m.id)) {
                this.map.setLayoutProperty(m.id, 'visibility', m.visible ? 'visible' : 'none');
            }
        });
    }

    /** Red vial simplificada (IGAC/INVIAS, ~50 m de tolerancia). Se pide una sola vez por estilo del mapa. */
    private static readonly URL_RED_VIAL = '/assets/data/Red_Vial_simplificada.geojson';
    private viasDescargadas = false;

    private asegurarRedVial(): void {
        if (this.viasDescargadas || !this.map) return;
        const fuente = this.map.getSource('vias-source') as GeoJSONSource | undefined;
        if (!fuente) return;
        this.viasDescargadas = true;
        fuente.setData(MapaLogisticoComponent.URL_RED_VIAL as any);
    }

    private iniciarRadarGeocercas(): void {
        if (this.geocercasSubscription) this.geocercasSubscription.unsubscribe();
        this.consultarGeocercas();
        this.geocercasSubscription = interval(30000).subscribe(() => {
            this.consultarGeocercas();
        });
    }

    private renderizarNavesFusionadas(): void {
        const features = Array.from(this.navesActuales.values());
        this.actualizarFuente('naves-source', { type: 'FeatureCollection', features });
    }

    private actualizarFuente(sourceId: string, data: any): void {
        // En modo reproducir naves y camiones son del recorrido: lo en vivo queda en caché hasta volver
        if (this.modoRecorrido && MapaLogisticoComponent.FUENTES_RECORRIDO.has(sourceId)) return;
        this.escribirFuente(sourceId, data);
    }

    private escribirFuente(sourceId: string, data: any): void {
        if (!this.map || !this.map.getSource(sourceId)) return;
        (this.map.getSource(sourceId) as any).setData(data);
    }

    private contextoPopup(): ContextoPopup {
        return { isDark: this.isDark, ultimaFlotaGeoJson: this.ultimaFlotaGeoJson, ultimosIncidentes: this.ultimosIncidentes };
    }

    private getStyle(): string {
        const MAPTILER_KEY = 'WMNuRXDl7kbmZ19cOGo2';

        switch (this.estiloBase) {
            case 'terreno':
                return this.isDark
                    ? `https://api.maptiler.com/maps/topo-v2-dark/style.json?key=${MAPTILER_KEY}`
                    : `https://api.maptiler.com/maps/topo-v2/style.json?key=${MAPTILER_KEY}`;
            case 'satelite':
                return `https://api.maptiler.com/maps/hybrid/style.json?key=${MAPTILER_KEY}`;
            case 'outdoor':
            default:
                return this.isDark
                    ? `https://api.maptiler.com/maps/streets-v2-dark/style.json?key=${MAPTILER_KEY}`
                    : `https://api.maptiler.com/maps/streets-v2/style.json?key=${MAPTILER_KEY}`;
        }
    }

    public centrarMapa(): void {
        this.leerSessionYEnfocar(true);
    }

    /**
     * Vista ampliada del mapa (2026-10-22): pantalla completa del navegador sobre el mismo componente. No se usa el
     * modal porque crearía un segundo MapLibre y se perderían el embudo, la reproducción y las capas en memoria.
     */
    public alternarPantallaCompleta(): void {
        const raiz = this.raizMapa?.nativeElement;
        if (!raiz) return;
        if (document.fullscreenElement) {
            document.exitFullscreen?.().catch(() => undefined);
        } else {
            raiz.requestFullscreen?.().catch(() => undefined);
        }
    }

    @HostListener('document:fullscreenchange')
    public alCambiarPantallaCompleta(): void {
        this.pantallaCompleta = !!this.raizMapa && document.fullscreenElement === this.raizMapa.nativeElement;
        clearInterval(this.refrescoPanel);
        if (this.pantallaCompleta) {
            this.refrescarPanelLateral();
            this.refrescoPanel = setInterval(() => this._zone.run(() => this.refrescarPanelLateral()), 10_000);
        }
        this.cdr.detectChanges();
        setTimeout(() => this.map?.resize(), 80);
    }

    // ---------------------------------------------------------------- panel lateral de la vista ampliada (2026-10-24)
    // Lee las cachés que el mapa ya tiene en memoria (naves, flota, muelles, geocercas, bitácora): no consulta nada.
    public panelLateralAbierto = true;
    public pestanaPanel: 'buques' | 'camiones' | 'muelles' | 'alertas' | 'geocercas' = 'buques';
    public filasPanel: Record<string, any[]> = { buques: [], camiones: [], muelles: [], alertas: [], geocercas: [] };
    private refrescoPanel?: any;
    public readonly pestanasPanel: Array<{ id: 'buques' | 'camiones' | 'muelles' | 'alertas' | 'geocercas'; nombre: string; icono: string }> = [
        { id: 'buques', nombre: 'Buques', icono: 'feather icon-anchor' },
        { id: 'camiones', nombre: 'Camiones', icono: 'feather icon-truck' },
        { id: 'muelles', nombre: 'Muelles', icono: 'feather icon-grid' },
        { id: 'alertas', nombre: 'Alertas', icono: 'feather icon-bell' },
        { id: 'geocercas', nombre: 'Geocercas', icono: 'feather icon-target' }
    ];
    public readonly columnasPanel: Record<string, ColumnaTabla[]> = {
        buques: [
            { campo: 'nombre', titulo: 'Nave', tipo: 'principal' }, { campo: 'estado', titulo: 'Estado', tipo: 'estado' },
            { campo: 'velocidad', titulo: 'Vel.', tipo: 'numero', decimales: 1, unidad: 'kn' }, { campo: 'terminal', titulo: 'Terminal' },
            { campo: 'eta', titulo: 'ETA', tipo: 'fecha' }, { campo: 'mmsi', titulo: 'MMSI' }
        ],
        camiones: [
            { campo: 'placa', titulo: 'Placa', tipo: 'principal' }, { campo: 'estado', titulo: 'Estado', tipo: 'estado' },
            { campo: 'velocidad', titulo: 'Vel.', tipo: 'numero', unidad: 'km/h' }, { campo: 'tipo', titulo: 'Tipo' }, { campo: 'conductor', titulo: 'Conductor' }
        ],
        muelles: [
            { campo: 'terminal', titulo: 'Terminal' }, { campo: 'muelle', titulo: 'Muelle', tipo: 'principal' }, { campo: 'estado', titulo: 'Estado', tipo: 'estado' },
            { campo: 'nave', titulo: 'Nave' }, { campo: 'horasAtracada', titulo: 'Atracada', tipo: 'numero', decimales: 1, unidad: 'h' },
            { campo: 'proximo', titulo: 'Próximo' }, { campo: 'proximoEnHoras', titulo: 'En', tipo: 'numero', decimales: 1, unidad: 'h' }
        ],
        alertas: [
            { campo: 'nivel', titulo: 'Nivel', tipo: 'estado' }, { campo: 'titulo', titulo: 'Alerta', tipo: 'principal' },
            { campo: 'mensaje', titulo: 'Detalle' }, { campo: 'fecha', titulo: 'Hora', tipo: 'fecha' }, { campo: 'simulado', titulo: 'Simulada', tipo: 'si-no' }
        ],
        geocercas: [
            { campo: 'nombre', titulo: 'Geocerca', tipo: 'principal' }, { campo: 'estado', titulo: 'Estado', tipo: 'estado' },
            { campo: 'camiones', titulo: 'Camiones', tipo: 'numero' }, { campo: 'enRuta', titulo: 'En ruta', tipo: 'numero' },
            { campo: 'detenidos', titulo: 'Detenidos', tipo: 'numero' }, { campo: 'naves', titulo: 'Naves', tipo: 'numero' }
        ]
    };

    public refrescarPanelLateral(): void {
        const punto = (f: any): [number, number] | null => {
            try {
                const c = f?.geometry?.type === 'Point' ? f.geometry.coordinates : turf.centroid(f).geometry.coordinates;
                return esPosicion(c) ? [c[0], c[1]] : null;
            } catch {
                return null;
            }
        };
        const p = (f: any) => f?.properties || {};
        this.filasPanel = {
            buques: Array.from(this.navesActuales.values()).map((f: any, i) => ({
                id: p(f).mmsi || `nave-${i}`, nombre: p(f).nombre_motonave || p(f).mmsi || 'Desconocida', mmsi: p(f).mmsi || null,
                estado: p(f).estado_ais || p(f).estado_inferido || p(f).estado_nave || null, velocidad: p(f).velocidad ?? null,
                terminal: p(f).id_terminal || p(f).terminal || null, eta: p(f).eta || null, coordenadas: punto(f)
            })),
            camiones: (this.ultimaFlotaGeoJson?.features || []).map((f: any, i: number) => ({
                id: p(f).placa || `camion-${i}`, placa: p(f).placa || 'Sin placa', estado: p(f).estado_camion || p(f).estado || null,
                velocidad: p(f).velocidad ?? null, tipo: p(f).tipo_camion || null, conductor: p(f).conductor || null, coordenadas: punto(f)
            })),
            muelles: (this.ultimoEstadoMuelles?.features || []).map((f: any, i: number) => ({
                id: p(f).clave || `muelle-${i}`, terminal: p(f).terminal, muelle: p(f).codigoMuelle, estado: p(f).estado, nave: p(f).nave || null,
                horasAtracada: p(f).minutosAtracada != null ? p(f).minutosAtracada / 60 : null, proximo: p(f).proximoMotonave || null,
                proximoEnHoras: p(f).proximoEnMinutos != null ? p(f).proximoEnMinutos / 60 : null, coordenadas: punto(f)
            })),
            alertas: (this.bitacoraAlertas || []).map((a) => ({
                id: a.id, nivel: a.nivel, titulo: a.titulo, mensaje: a.mensaje, fecha: a.fecha, simulado: a.simulado, coordenadas: a.coordenadas
            })),
            geocercas: (this.ultimasGeocercasKpiGeoJson?.features || []).map((f: any, i: number) => ({
                id: p(f).id_faro || `geocerca-${i}`, nombre: p(f).nombre_faro || p(f).nombre || 'Geocerca', estado: p(f).estado_kpi || null,
                camiones: p(f).total_camiones ?? null, enRuta: p(f).camiones_ruta ?? null, detenidos: p(f).camiones_detenidos ?? null,
                naves: p(f).total_naves ?? null, coordenadas: punto(f)
            }))
        };
        this.cdr.detectChanges();
    }

    public volarAFila(fila: any): void {
        if (!this.map || !fila?.coordenadas) return;
        this.map.flyTo({ center: fila.coordenadas, zoom: Math.max(this.map.getZoom(), 14), duration: 1500, essential: true });
    }

    public maximizar(): void {
        if (this.isEnfoque) {
            this._torreService.cerrarModoEnfoque();
        } else {
            this._torreService.abrirModoEnfoque(
                this.widgetConfig?.type || this.widgetId || 'PTT_MAPA_LOGISTICO',
                this.data || {}
            );
        }
    }

    public grupoActivo(grupo: { capas: Array<{ activa: boolean }> }): boolean {
        return grupo.capas.every((c) => c.activa);
    }

    public grupoParcial(grupo: { capas: Array<{ activa: boolean }> }): boolean {
        const activas = grupo.capas.filter((c) => c.activa).length;
        return activas > 0 && activas < grupo.capas.length;
    }

    public toggleGrupoCompleto(grupo: { capas: Array<{ id: string; activa: boolean }> }, visible: boolean): void {
        grupo.capas.forEach((c) => {
            c.activa = visible;
            this._mapaService.actualizarVisibilidadCapa(c.id, visible);
        });
    }

    public toggleCapaMenu(capaId: string, event: any): void {
        const estado = event.target.checked;
        this._mapaService.actualizarVisibilidadCapa(capaId, estado);
    }

    public toggleMapaBase(): void {
        const nuevoEstilo = this.estiloBase === 'satelite' ? 'outdoor' : 'satelite';
        this.cambiarEstiloBase(nuevoEstilo);
    }

    toggleMenuConfig(): void {
        this.menuConfigAbierto = !this.menuConfigAbierto;
        this.cdr.detectChanges();
    }
}
