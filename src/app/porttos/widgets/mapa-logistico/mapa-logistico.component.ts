// /*
//     Author: German Valencia
//     Componente: Mapa Logístico - Integración Completa (Metadata-Driven & Datos Vivos)
//     (Checkpoints circulares, KPIs desglosados, Radar asíncrono y Capas Symbol)
// */
// import { Component, ElementRef, OnDestroy, ViewChild, AfterViewInit, OnInit, Input, HostBinding, NgZone } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { Subscription, interval } from 'rxjs';
// import { HttpClient } from '@angular/common/http';
// import { ThemeService } from '../../../theme/shared/service/theme.service';
// import { LocalStorageService, SocketService } from 'src/app/theme/shared/service';
// import { MapaGeneralService } from '../../../theme/shared/service/tablero-control/mapa-general.service';
// import { DashboardService } from 'src/app/theme/shared/service/tablero-control/dashboard.service';
// import { FiltroTableroService } from 'src/app/theme/shared/service/tablero-control/filtro-tablero.service';
// import { IWidget } from 'src/app/theme/shared/interfaces/torre-control/widget.interface';
// import { MapSocketService } from 'src/app/theme/shared/service/tablero-control/map-socket.service';
// import { FaroModel } from 'src/app/theme/shared/_helpers/models/tablero-control/faro.model';
// import { FarosService } from 'src/app/theme/shared/service/tablero-control/faros.service';
// import { AisRadarService } from 'src/app/theme/shared/service/tablero-control/ais-radar.service';
// import maplibregl, { GeoJSONSource } from 'maplibre-gl';
// import { ToastrService } from 'ngx-toastr';
// import { parse } from 'wellknown';
// import * as turf from '@turf/turf';

// const INFRA_THEME = {
//     'puerto': { fill: '#cbd5e1', line: '#475569', circle: '#cbd5e1' },
//     'terminal': { fill: '#fbbf24', line: '#d97706', circle: '#fbbf24' },
//     'muelle': { fill: '#0ea5e9', line: '#0284c7', circle: '#0ea5e9' },
//     'bodega_almacenamiento': { fill: '#8b5cf6', line: '#6d28d9', circle: '#8b5cf6' },
//     'patio_contenedores': { fill: '#a3e635', line: '#4d7c0f', circle: '#a3e635' },
//     'patio_vehiculos': { fill: '#14b8a6', line: '#0f766e', circle: '#14b8a6' },
//     'almacenamiento_granel': { fill: '#fb923c', line: '#c2410c', circle: '#fb923c' },
//     'almacenamiento_liquido': { fill: '#38bdf8', line: '#075985', circle: '#38bdf8' },
//     'default': { fill: '#94a3b8', line: '#475569', circle: '#94a3b8' }
// };

// export const NOMENCLATURA_ENTIDADES = [
//     { id: 'naves', label: 'Motonaves en tránsito', color: '#00E5FF' },
//     { id: 'clima', label: 'Alertas IDEAM', color: '#8b5cf6' },
//     { id: 'accidentes', label: 'Incidentes Viales', color: '#ef4444' },
//     { id: 'terrestre', label: 'Flota Terrestre', color: '#10b981' },
//     { id: 'peajes', label: 'Peajes (Control)', color: '#eab308' }
// ];

// export const ESTADOS_OPERATIVOS = [
//     { id: 'libre', label: 'Libre / Fluido', color: '#22c55e' },
//     { id: 'ocupado', label: 'Ocupado / Capacidad Media', color: '#facc15' },
//     { id: 'congestionado', label: 'Congestionado / Retraso', color: '#f59e0b' },
//     { id: 'critico', label: 'Crítico / Bloqueado', color: '#dc2626' },
//     { id: 'desocupado', label: 'Desocupado / Sin Operación', color: '#94a3b8' }
// ];

// export type TipoMapaBase = 'outdoor' | 'terreno' | 'satelite';

// @Component({
//     selector: 'app-mapa-logistico',
//     standalone: true,
//     imports: [CommonModule],
//     templateUrl: './mapa-logistico.component.html',
//     styleUrls: ['./mapa-logistico.component.scss']
// })
// export class MapaLogisticoComponent implements AfterViewInit, OnInit, OnDestroy, IWidget {
//     @ViewChild('mapContainer') mapContainer!: ElementRef;

//     // 🟢 NUEVOS ENLACES DE ARQUITECTURA METADATA-DRIVEN
//     @Input() widgetConfig: any;
//     @Input()
//     set datosVivos(val: any) {
//         if (val) {
//             this.data = val;
//             this.hidratarConDatosVivos(val);
//         }
//     }
//     get datosVivos(): any { return this._datosVivos; }
//     private _datosVivos: any;

//     @Input() isEnfoque: boolean = false;
//     @Input() mostrarTabla: boolean = false;
//     @Input() title: string = '';
//     @Input() config: any = { colspan: 12 };
//     @Input() widgetId?: string;
//     @Input() data: any;
//     @Input() puertoSeleccionado: any;

//     public map!: maplibregl.Map;
//     public isDark: boolean = false;
//     public estiloBase: TipoMapaBase = 'outdoor';

//     private pollingSubscription!: Subscription;
//     private subs: Subscription = new Subscription();
//     private geocercasSubscription!: Subscription;
//     private resizeObserver!: ResizeObserver;
//     private alertaSub!: Subscription;
//     private peajesGeoJson: any = null;
//     private ultimosIncidentes: any = null;
//     private ultimaFlotaGeoJson: any = null;
//     private lastGeocercaStr: string = '';

//     private navesActuales = new Map<string, any>();
//     private lastNotificationTimes = new Map<string, number>();

//     public mostrarCapas: boolean = false;
//     public mostrarLeyenda: boolean = false;
//     public entidades = NOMENCLATURA_ENTIDADES;
//     public estados = ESTADOS_OPERATIVOS;

//     private alertaTerrestreSub!: Subscription;
//     private maritimoSub!: Subscription;
//     private farosActivos: any[] = [];

//     public menuCapas = [
//         { grupo: 'Operación Marítima', icono: 'directions_boat', abierto: true, capas: [{ id: 'naves', nombre: 'Motonaves en tránsito', activa: true }] },
//         { grupo: 'Infraestructura', icono: 'domain', abierto: true, capas: [{ id: 'infra', nombre: 'Puertos y Terminales', activa: true }] },
//         {
//             grupo: 'Operación Terrestre', icono: 'local_shipping', abierto: true, capas: [
//                 { id: 'terrestre', nombre: 'Flota en ruta (GPS)', activa: true },
//                 { id: 'vias', nombre: 'Red Vial Nacional', activa: true },
//                 { id: 'peajes', nombre: 'Peajes y Geocercas', activa: true }
//             ]
//         },
//         { grupo: 'Riesgos y Clima', icono: 'warning', abierto: true, capas: [{ id: 'accidentes', nombre: 'Incidentes Viales', activa: true }, { id: 'clima', nombre: 'Alertas IDEAM', activa: true }] }
//     ];

//     constructor(
//         private _themeService: ThemeService,
//         private _localStorage: LocalStorageService,
//         private _torreService: DashboardService,
//         public _mapaService: MapaGeneralService,
//         public _mapaSocketService: MapSocketService,
//         public _farosService: FarosService,
//         private _radarAisService: AisRadarService,
//         private _filtroTableroService: FiltroTableroService,
//         private http: HttpClient,
//         private toastr: ToastrService,
//         private _socketService: SocketService,
//         private ngZone: NgZone
//     ) {
//         this.isDark = this._localStorage.getThemeSettings()?.isDarkTheme || false;
//     }

//     @HostBinding('class') get hostClass() {
//         // Soporta la configuración dinámica de columnas enviada por metadatos o config local
//         const cols = this.widgetConfig?.cols || this.config?.colspan || 12;
//         return `col-span-${cols}`;
//     }

//     ngOnInit(): void {
//         // Si el widgetConfig trae un título, lo asignamos
//         if (this.widgetConfig?.titulo) {
//             this.title = this.widgetConfig.titulo;
//         }

//         this.subs.add(this._themeService.isDarkTheme$.subscribe(isDark => {
//             this.isDark = isDark;
//             if (this.map) {
//                 this.map.setStyle(this.getStyle());
//                 this.map.once('style.load', () => this.inicializarCapas());
//             }
//         }));

//         this.subs.add(this._filtroTableroService.ciudad$.subscribe((ciudadEmitida: any) => {
//             let idEsperado: string | null = null;
//             if (typeof ciudadEmitida === 'string') idEsperado = ciudadEmitida;
//             else if (ciudadEmitida?.id_puerto) idEsperado = ciudadEmitida.id_puerto;
//             else if (ciudadEmitida?.id) idEsperado = ciudadEmitida.id;
//             else if (ciudadEmitida?.target?.value) idEsperado = ciudadEmitida.target.value;

//             if (idEsperado) this.verificarCambioDeSession(idEsperado, 0);
//         }));

//         this.cargarPeajesEstaticos();
//         this.iniciarAlertasTerrestres();
//         this.iniciarCapaMaritima();
//         this.cargarEventosViales();
//         this.cargarFaros();
//     }

//     ngAfterViewInit(): void {
//         this.inicializarMapa();

//         this.resizeObserver = new ResizeObserver(() => {
//             if (this.map) requestAnimationFrame(() => this.map.resize());
//         });

//         if (this.mapContainer?.nativeElement) {
//             this.resizeObserver.observe(this.mapContainer.nativeElement);
//         }
//     }

//     ngOnDestroy(): void {
//         this.subs.unsubscribe();
//         if (this.pollingSubscription) this.pollingSubscription.unsubscribe();
//         if (this.geocercasSubscription) this.geocercasSubscription.unsubscribe();
//         if (this.resizeObserver) this.resizeObserver.disconnect();
//         if (this.map) this.map.remove();
//         if (this.alertaSub) this.alertaSub.unsubscribe();
//         if (this.alertaTerrestreSub) this.alertaTerrestreSub.unsubscribe();

//         this._mapaSocketService.desconectarSalaMaritima();
//         if (this.maritimoSub) {
//             this.maritimoSub.unsubscribe();
//         }
//     }

//     /**
//      * 🟢 HIDRATACIÓN REACTIVA DESDE EL ESTADO GLOBAL (DATOS VIVOS)
//      */
//     private hidratarConDatosVivos(data: any): void {
//         if (!this.map || !this.map.isStyleLoaded()) return;

//         if (data.CAPA_INFRAESTRUCTURA) {
//             this.actualizarFuente('infra-source', this.procesarInfraestructuraWkt(data.CAPA_INFRAESTRUCTURA));
//         }
//         if (data.CAPA_TERRESTRE) {
//             this.ultimaFlotaGeoJson = data.CAPA_TERRESTRE;
//             this.actualizarFuente('terrestre-source', data.CAPA_TERRESTRE);
//         }
//         if (data.CAPA_CLIMA) {
//             this.actualizarFuente('clima-source', data.CAPA_CLIMA);
//         }
//         if (data.CAPA_VIAS) {
//             this.actualizarFuente('vias-source', data.CAPA_VIAS);
//         }
//     }

//     cargarEventosViales() {
//         this._mapaService.obtenerAccidentesYBloqueosViales().subscribe({
//             next: (geoJsonRespuesta) => {
//                 console.log("✅ GeoJSON de Eventos Viales listo para el mapa:", geoJsonRespuesta);
//             },
//             error: (error) => {
//                 console.error("❌ Error al traer los datos de incidentes:", error);
//             }
//         });
//     }

//     private iniciarAlertasTerrestres(): void {
//         this.alertaTerrestreSub = this._socketService.listen('alerta-terrestre').subscribe((data: any) => {
//             this.toastr.warning(
//                 `Ingresó a: ${data.geocerca}`,
//                 `🚛 Alerta: Camión ${data.placa}`,
//                 { timeOut: 6000, positionClass: 'toast-bottom-right', progressBar: true }
//             );
//         });
//     }

//     private iniciarCapaMaritima(): void {
//         if (this._mapaSocketService && typeof this._mapaSocketService.conectarSalaMaritima === 'function') {
//             this._mapaSocketService.conectarSalaMaritima();
//         }

//         this.maritimoSub = this._socketService.listen('radar-actualizado').subscribe((featureSocket: any) => {
//             if (featureSocket && featureSocket.geometry) {
//                 const idUnico = featureSocket.properties.mmsi || featureSocket.properties.nombre_motonave;
//                 const nombreNave = featureSocket.properties.nombre_motonave || 'Desconocida';
//                 const naveExistente = this.navesActuales.get(idUnico);

//                 const puntoNave = turf.point(featureSocket.geometry.coordinates);
//                 let faroDetectado = null;

//                 for (const faro of this.farosActivos) {
//                     if (faro.geocerca_geo && faro.geocerca_geo.features.length > 0) {
//                         const poligonoFaro = faro.geocerca_geo.features[0];
//                         if (turf.booleanPointInPolygon(puntoNave, poligonoFaro)) {
//                             faroDetectado = faro;
//                             break;
//                         }
//                     }
//                 }

//                 const faroAnteriorId = naveExistente ? naveExistente.properties.faro_actual_id : null;
//                 const faroDetectadoId = faroDetectado ? faroDetectado.id_faro : null;

//                 if (faroDetectado && faroDetectadoId !== faroAnteriorId) {
//                     if (faroDetectado.genera_alerta_toast) {
//                         this.toastr.info(
//                             `Ingresó a zona: ${faroDetectado.nombre_faro}`,
//                             `⚓ Alerta: ${nombreNave}`,
//                             { timeOut: 7000, positionClass: 'toast-bottom-right', progressBar: true }
//                         );
//                     }
//                 }

//                 featureSocket.properties = {
//                     ...(naveExistente ? naveExistente.properties : {}),
//                     ...featureSocket.properties,
//                     faro_actual_id: faroDetectadoId
//                 };

//                 this.navesActuales.set(idUnico, featureSocket);
//                 this.renderizarNavesFusionadas();
//             }
//         });
//     }

//     public cambiarEstiloBase(nuevoEstilo: TipoMapaBase): void {
//         if (this.estiloBase === nuevoEstilo) return;
//         this.estiloBase = nuevoEstilo;
//         if (this.map) {
//             this.map.setStyle(this.getStyle());
//             this.map.once('style.load', () => this.inicializarCapas());
//         }
//     }

//     public togglePanelCapas(): void {
//         this.mostrarCapas = !this.mostrarCapas;
//         if (this.mostrarCapas) this.mostrarLeyenda = false;
//     }

//     public toggleLeyenda(): void {
//         this.mostrarLeyenda = !this.mostrarLeyenda;
//         if (this.mostrarLeyenda) this.mostrarCapas = false;
//     }

//     public toggleGrupoMenu(grupo: any): void {
//         grupo.abierto = !grupo.abierto;
//     }

//     private hacerCircular(geojsonOriginal: any, radioMetrosDB?: number): any {
//         try {
//             if (!geojsonOriginal) return null;
//             let geom = geojsonOriginal;
//             if (geojsonOriginal.type === 'FeatureCollection') geom = geojsonOriginal.features[0]?.geometry;
//             else if (geojsonOriginal.type === 'Feature') geom = geojsonOriginal.geometry;

//             if (!geom) return geojsonOriginal;

//             if (radioMetrosDB && radioMetrosDB > 0) {
//                 const centro = turf.centroid(geom);
//                 return turf.circle(centro.geometry.coordinates, radioMetrosDB / 1000, { steps: 64, units: 'kilometers' }).geometry;
//             }

//             if (geom.type === 'Point') return turf.circle(geom.coordinates, 2, { steps: 64, units: 'kilometers' }).geometry;

//             const centro = turf.centroid(geom);
//             const bbox = turf.bbox(geom);
//             const puntoBorde = turf.point([centro.geometry.coordinates[0], bbox[1]]);
//             let radioKm = turf.distance(centro, puntoBorde, { units: 'kilometers' });

//             if (radioKm === 0) radioKm = 1;
//             return turf.circle(centro.geometry.coordinates, radioKm, { steps: 64, units: 'kilometers' }).geometry;
//         } catch (e) {
//             return geojsonOriginal;
//         }
//     }

//     private convertirWKT_ACirculo(wkt: string, radioMetrosDB?: number): any {
//         try {
//             const geojsonOriginal = parse(wkt);
//             return this.hacerCircular(geojsonOriginal, radioMetrosDB);
//         } catch (e) {
//             return parse(wkt);
//         }
//     }

//     private cargarPeajesEstaticos(): void {
//         this.subs.add(
//             this.http.get('/assets/data/Peajes_20260705.geojson').subscribe({
//                 next: (data) => {
//                     this.peajesGeoJson = data;
//                     if (this.map && this.map.getSource('peajes-source')) {
//                         this.actualizarFuente('peajes-source', this.peajesGeoJson);
//                     }
//                     this.procesarRelacionIncidentePeaje();
//                 }
//             })
//         );
//     }

//     private cargarFaros(): void {
//         this._farosService.getAllFaros().subscribe({
//             next: (faros: FaroModel[]) => {
//                 this.farosActivos = faros;
//                 this.renderizarFarosMapa();
//             },
//             error: (error) => {
//                 console.error('Error al obtener los faros:', error);
//             }
//         });
//     }

//     private renderizarFarosMapa(): void {
//         if (!this.map || !this.map.isStyleLoaded()) return;

//         const featuresFaros: any[] = [];
//         this.farosActivos.forEach(faro => {
//             if (faro.geocerca_geo && faro.geocerca_geo.features && faro.geocerca_geo.features.length > 0) {
//                 const feature = faro.geocerca_geo.features[0];
//                 feature.properties = {
//                     ...feature.properties,
//                     id_faro: faro.id_faro,
//                     nombre_faro: faro.nombre_faro,
//                     color_ui: faro.color_ui || '#00E5FF'
//                 };
//                 featuresFaros.push(feature);
//             }
//         });

//         const farosGeoJSON = { type: 'FeatureCollection' as const, features: featuresFaros };
//         const source = this.map.getSource('source-faros') as any;
//         if (source) source.setData(farosGeoJSON);
//     }

//     private verificarCambioDeSession(idEsperado: string, intento: number): void {
//         if (!this.map || !this.map.isStyleLoaded()) return;

//         if (!idEsperado || idEsperado === 'ALL') {
//             this.irAColombia();
//             return;
//         }

//         const puerto = this._localStorage.getPuertoLocalStorage();
//         const idActual = puerto?.id_puerto || puerto?.nombre || '';
//         const esPuertoCorrecto = idActual && (idActual.toUpperCase().includes(idEsperado.toUpperCase()) || idEsperado.toUpperCase().includes(idActual.toUpperCase()));

//         const currentGeocercaStr = puerto?.geocerca_geo
//             ? (typeof puerto.geocerca_geo === 'string' ? puerto.geocerca_geo : JSON.stringify(puerto.geocerca_geo))
//             : (puerto?.puerto_geocerca_wkt || '');

//         if (currentGeocercaStr && currentGeocercaStr !== this.lastGeocercaStr && esPuertoCorrecto) {
//             this.leerSessionYEnfocar(true);
//         } else if (intento < 20) {
//             setTimeout(() => this.verificarCambioDeSession(idEsperado, intento + 1), 250);
//         } else {
//             this.leerSessionYEnfocar(true);
//         }
//     }

//     private leerSessionYEnfocar(moverCamara: boolean = true): void {
//         if (!this.map || !this.map.isStyleLoaded()) return;

//         this.map.resize();
//         const puerto = this._localStorage.getPuertoLocalStorage();
//         const highlightSource = this.map.getSource('highlight-source') as GeoJSONSource;

//         if (!puerto || (!puerto.geocerca_geo && !puerto.puerto_geocerca_wkt)) {
//             if (moverCamara) this.irAColombia(highlightSource);
//             return;
//         }

//         this.lastGeocercaStr = puerto.geocerca_geo
//             ? (typeof puerto.geocerca_geo === 'string' ? puerto.geocerca_geo : JSON.stringify(puerto.geocerca_geo))
//             : (puerto.puerto_geocerca_wkt || '');

//         let geojsonObj = null;
//         try {
//             if (puerto.geocerca_geo) {
//                 geojsonObj = typeof puerto.geocerca_geo === 'string' ? JSON.parse(puerto.geocerca_geo) : puerto.geocerca_geo;
//             } else if (puerto.puerto_geocerca_wkt) {
//                 geojsonObj = parse(puerto.puerto_geocerca_wkt);
//             }
//             if (geojsonObj) geojsonObj = this.hacerCircular(geojsonObj);
//         } catch (e) { }

//         if (geojsonObj) {
//             let dataToSet: any = { type: 'FeatureCollection', features: [] };
//             if (geojsonObj.type === 'FeatureCollection') dataToSet = geojsonObj;
//             else if (geojsonObj.type === 'Feature') dataToSet.features.push(geojsonObj);
//             else dataToSet.features.push({ type: 'Feature', geometry: geojsonObj, properties: {} });

//             if (highlightSource) highlightSource.setData(dataToSet);

//             if (!moverCamara) return;

//             const bounds = this.calcularBboxGeoJSON(dataToSet);
//             let centroExacto = null;
//             if (puerto.ubicacion_geo) {
//                 try {
//                     const ubi = typeof puerto.ubicacion_geo === 'string' ? JSON.parse(puerto.ubicacion_geo) : puerto.ubicacion_geo;
//                     centroExacto = turf.center(ubi).geometry.coordinates;
//                 } catch (e) { }
//             }

//             if (bounds && centroExacto) {
//                 const camera = this.map.cameraForBounds(bounds, { padding: 50 });
//                 const zoomCalculado = camera?.zoom ? Math.min(camera.zoom, 14) : 14;
//                 this.map.flyTo({ center: centroExacto as [number, number], zoom: zoomCalculado, duration: 2500, essential: true });
//             } else if (bounds) {
//                 this.map.fitBounds(bounds, { padding: 50, duration: 2500, maxZoom: 14, essential: true });
//             } else {
//                 this.irAColombia(highlightSource);
//             }
//         } else {
//             if (moverCamara) this.irAColombia(highlightSource);
//         }
//     }

//     private irAColombia(source?: GeoJSONSource): void {
//         if (!this.map) return;
//         const highlight = source || this.map.getSource('highlight-source') as GeoJSONSource;
//         if (highlight) highlight.setData({ type: 'FeatureCollection', features: [] });
//         this.map.resize();
//         this.map.flyTo({ center: [-73.5, 4.0], zoom: 5.5, duration: 2000 });
//     }

//     private calcularBboxGeoJSON(geojson: any): maplibregl.LngLatBounds | null {
//         if (!geojson) return null;
//         try {
//             const bbox = turf.bbox(geojson);
//             return new maplibregl.LngLatBounds([bbox[0], bbox[1]], [bbox[2], bbox[3]]);
//         } catch (e) {
//             return null;
//         }
//     }

//     private inicializarMapa(): void {
//         let mapOptions: any = {
//             container: this.mapContainer.nativeElement,
//             style: this.getStyle(),
//             attributionControl: false,
//             center: [-73.5, 4.0],
//             zoom: 5.5
//         };

//         this.map = new maplibregl.Map(mapOptions);

//         this.map.on('style.load', () => {
//             const iconosLogistica = [
//                 { id: 'icono-barco', url: '/assets/icons/barco.png' },
//                 { id: 'icono-camion', url: '/assets/icons/camion.png' },
//                 { id: 'icono-camion-frente', url: '/assets/icons/camion-frente.png' },
//                 { id: 'icono-accidente', url: '/assets/icons/accidente.png' },
//                 { id: 'accidente-cluster', url: '/assets/icons/accidente-cluster.png' },
//                 { id: 'icono-congestion', url: '/assets/icons/congestion.png' },
//                 { id: 'icono-obra', url: '/assets/icons/congestion.png' },
//                 { id: 'congestion-cluster', url: '/assets/icons/congestion-cluster.png' },
//                 { id: 'marcador-puerto', url: '/assets/icons/puerto.png' },
//                 { id: 'icono-peaje', url: '/assets/icons/peaje.png' },
//                 { id: 'peaje-cluster', url: '/assets/icons/peaje-cluster.png' },
//                 { id: 'icono-faro', url: '/assets/icons/faro.png' },
//                 { id: 'clima-lluvia', url: '/assets/icons/clima-lluvia.png' },
//                 { id: 'clima-tormenta', url: '/assets/icons/clima-tormenta.png' },
//                 { id: 'clima-viento', url: '/assets/icons/clima-viento.png' },
//                 { id: 'clima-incendio', url: '/assets/icons/clima-incendio.png' },
//                 { id: 'clima-defecto', url: '/assets/icons/clima.png' }
//             ];

//             this.cargarIconosMasivamente(iconosLogistica).then(() => {
//                 this.inicializarCapas();
//             });
//         });

//         this.map.on('style.load', () => {
//             this.suscribirseADatos();
//             this.configurarEventosClicks();
//             this.iniciarRadarGeocercas();
//             this.iniciarRadarTiempoReal();
//         });

//         this.map.once('idle', () => {
//             const comprobarDimensiones = setInterval(() => {
//                 if (this.mapContainer.nativeElement.offsetWidth > 0) {
//                     clearInterval(comprobarDimensiones);
//                     this.map.resize();

//                     setTimeout(() => {
//                         this.leerSessionYEnfocar(true);
//                     }, 50);
//                 }
//             }, 100);
//             setTimeout(() => clearInterval(comprobarDimensiones), 3000);
//         });

//         this.map.addControl(new maplibregl.NavigationControl(), 'top-right');
//     }

//     private consultarGeocercas(): void {
//         this._mapaService.getGeocercasKPIs().subscribe({
//             next: (res: any) => {
//                 if (!res.data) return;

//                 const features = res.data.map((item: any) => ({
//                     type: 'Feature',
//                     geometry: this.convertirWKT_ACirculo(item.wkt, item.radio_metros),
//                     properties: {
//                         nombre_faro: item.nombre_faro,
//                         tipo_faro: item.tipo_faro,
//                         estado_kpi: item.estado_kpi,
//                         color_ui: item.color_ui,
//                         total_camiones: item.total_camiones,
//                         camiones_ruta: item.camiones_ruta,
//                         camiones_detenidos: item.camiones_detenidos,
//                         total_naves: item.total_naves,
//                         naves_fondeadas: item.naves_fondeadas,
//                         naves_avisadas: item.naves_avisadas,
//                         naves_arribadas: item.naves_arribadas
//                     }
//                 }));

//                 this.actualizarFuente('geocercas-kpi-source', { type: 'FeatureCollection', features });
//             },
//             error: (err) => console.error("Error radar Faros en el componente:", err)
//         });
//     }

//     private iniciarRadarTiempoReal(): void {
//         this.pollingSubscription = interval(10000).subscribe(() => {
//             this._mapaService.getFlotaGeoJSON().subscribe({
//                 next: (nuevoGeoJSON) => {
//                     this.ultimaFlotaGeoJson = nuevoGeoJSON;
//                     const source = this.map?.getSource('terrestre-source') as GeoJSONSource;
//                     if (source) source.setData(nuevoGeoJSON);
//                 }
//             });
//         });
//     }

//     private procesarRelacionIncidentePeaje(): void {
//         const geocercasFeatures: any[] = [];

//         if (this.peajesGeoJson && this.peajesGeoJson.features) {
//             this.peajesGeoJson.features.forEach((peaje: any) => {
//                 if (peaje.geometry && peaje.geometry.coordinates) {
//                     const puntoTurf = turf.point(peaje.geometry.coordinates);
//                     const buffer2km = turf.buffer(puntoTurf, 2, { units: 'kilometers' });
//                     if (buffer2km) {
//                         buffer2km.properties = { nombrePeaje: peaje.properties?.nombre || 'Peaje' };
//                         geocercasFeatures.push(buffer2km);
//                     }
//                 }
//             });
//             this.actualizarFuente('geocercas-peajes-source', { type: 'FeatureCollection', features: geocercasFeatures });
//         }

//         if (!this.ultimosIncidentes || !this.ultimosIncidentes.features) return;

//         this.ultimosIncidentes.features.forEach((incidente: any) => {
//             incidente.properties.afectaPeaje = false;
//             incidente.properties.peajeAfectado = '';

//             if (incidente.geometry && incidente.geometry.coordinates && geocercasFeatures.length > 0) {
//                 const puntoIncidente = turf.point(incidente.geometry.coordinates);
//                 for (const geocerca of geocercasFeatures) {
//                     if (turf.booleanPointInPolygon(puntoIncidente, geocerca)) {
//                         incidente.properties.afectaPeaje = true;
//                         incidente.properties.peajeAfectado = geocerca.properties.nombrePeaje;
//                         break;
//                     }
//                 }
//             }
//         });

//         this.actualizarFuente('alertas-viales-source', this.ultimosIncidentes);
//     }

//     private procesarInfraestructuraWkt(puertosArray: any[]): any {
//         const features: any[] = [];
//         if (!Array.isArray(puertosArray)) return { type: 'FeatureCollection', features };

//         puertosArray.forEach(puerto => {
//             const wktPuerto = puerto.puerto_wkt || puerto.puerto_geocerca_wkt;
//             if (wktPuerto) {
//                 const geo = this.convertirWKT_ACirculo(wktPuerto);
//                 if (geo) features.push({
//                     type: 'Feature', geometry: geo as any,
//                     properties: {
//                         id: puerto.id_puerto,
//                         nombre: puerto.nombre_puerto,
//                         tipo: 'puerto',
//                         color_ui: puerto.color_ui
//                     }
//                 });
//             }

//             if (Array.isArray(puerto.terminales)) {
//                 puerto.terminales.forEach((terminal: any) => {
//                     const muellesFeaturesTerminal: any[] = [];
//                     if (Array.isArray(terminal.muelles)) {
//                         terminal.muelles.forEach((muelle: any) => {
//                             const wktMuelle = muelle.muelle_wkt || muelle.muelle_geocerca_wkt;
//                             if (wktMuelle) {
//                                 const geo = parse(wktMuelle);
//                                 if (geo) {
//                                     const muelleFeature = {
//                                         type: 'Feature', geometry: geo as any,
//                                         properties: {
//                                             id: muelle.id_interno,
//                                             nombre: muelle.nombre_muelle,
//                                             tipo: 'muelle',
//                                             color_ui: muelle.color_ui
//                                         }
//                                     };
//                                     muellesFeaturesTerminal.push(muelleFeature);
//                                     features.push(muelleFeature);
//                                 }
//                             }
//                         });
//                     }

//                     const wktTerminal = terminal.terminal_wkt || terminal.terminal_geocerca_wkt;
//                     let terminalGeo = null;

//                     if (wktTerminal) {
//                         terminalGeo = parse(wktTerminal);
//                     } else if (muellesFeaturesTerminal.length > 0) {
//                         try {
//                             const featureCollection = turf.featureCollection(muellesFeaturesTerminal);
//                             const envolvente = turf.envelope(featureCollection);
//                             const envolventeConMargen = turf.buffer(envolvente, 0.05, { units: 'kilometers' });
//                             if (envolventeConMargen && envolventeConMargen.geometry) {
//                                 terminalGeo = envolventeConMargen.geometry;
//                             }
//                         } catch (e) { }
//                     }

//                     if (terminalGeo) {
//                         features.push({
//                             type: 'Feature', geometry: terminalGeo as any,
//                             properties: {
//                                 id: terminal.id_terminal,
//                                 nombre: terminal.nombre_terminal,
//                                 tipo: 'terminal',
//                                 autogenerada: !wktTerminal,
//                                 color_ui: terminal.color_ui
//                             }
//                         });
//                     }
//                 });
//             }
//         });

//         return { type: 'FeatureCollection', features };
//     }

//     private configurarEventosClicks(): void {
//         const capasClickeables = [
//             'capa-infra-fill',
//             'capa-infra-point',
//             'naves-individual',
//             'terrestre-individual',
//             'viales-individual',
//             'clima-individual',
//             'peajes-individual',
//             'peajes-cluster-symbol',
//             'geocerca-fill-layer'
//         ];

//         capasClickeables.forEach(layerId => {
//             this.map.on('click', layerId, (e) => {
//                 if (!e.features || e.features.length === 0) return;
//                 const html = this._generarContenidoPopup(layerId, e.features[0]);
//                 const themeClass = this.isDark ? 'popup-dark' : 'popup-light';
//                 new maplibregl.Popup({ closeButton: true, className: `PORTTOS-popup popup-${layerId} ${themeClass}` })
//                     .setLngLat(e.lngLat).setHTML(html).addTo(this.map);
//             });

//             this.map.on('mouseenter', layerId, () => this.map.getCanvas().style.cursor = 'pointer');
//             this.map.on('mouseleave', layerId, () => this.map.getCanvas().style.cursor = '');
//         });
//     }

//     private async cargarIconosMasivamente(iconos: { id: string, url: string }[]): Promise<void> {
//         const promesas = iconos.map(async (icono) => {
//             if (this.map.hasImage(icono.id)) return;
//             try {
//                 const response = await this.map.loadImage(icono.url);
//                 if (response && response.data) {
//                     this.map.addImage(icono.id, response.data);
//                 }
//             } catch (error) {
//                 console.error(`Error cargando el ícono [${icono.id}]:`, error);
//             }
//         });

//         await Promise.all(promesas);
//     }

//     private inicializarCapas(): void {
//         const emptyData: any = { type: 'FeatureCollection', features: [] };

//         ['infra-source', 'naves-source', 'clima-source', 'alertas-viales-source', 'terrestre-source', 'highlight-source', 'peajes-source', 'geocercas-peajes-source', 'geocercas-kpi-source'].forEach(id => {
//             if (!this.map.getSource(id)) {
//                 const isClusterable = (id === 'terrestre-source' || id === 'alertas-viales-source' || id === 'peajes-source' || id === 'naves-source');
//                 this.map.addSource(id, {
//                     type: 'geojson',
//                     data: emptyData,
//                     cluster: isClusterable,
//                     clusterMaxZoom: 14,
//                     clusterRadius: 50
//                 } as any);
//             }
//         });

//         if (!this.map.getSource('source-faros')) {
//             this.map.addSource('source-faros', { type: 'geojson', data: emptyData });
//         }

//         if (!this.map.getSource('vias-source')) {
//             this.map.addSource('vias-source', { type: 'geojson', data: '/assets/data/Red_Vial_20260626.geojson' });
//         }

//         this.map.addLayer({
//             id: 'debug-terminales-fill',
//             type: 'fill',
//             source: 'infra-source',
//             filter: ['==', 'tipo', 'terminal'],
//             paint: { 'fill-color': '#ff0000', 'fill-opacity': 0.8 }
//         });

//         if (this.peajesGeoJson) this.actualizarFuente('peajes-source', this.peajesGeoJson);

//         const layers = [
//             { id: 'capa-infra-fill', type: 'fill', source: 'infra-source', filter: ['all', ['==', '$type', 'Polygon'], ['!=', 'tipo', 'puerto']], paint: { 'fill-color': ['coalesce', ['get', 'color_ui'], '#94a3b8'], 'fill-opacity': 0.7 } },
//             { id: 'capa-infra-line', type: 'line', source: 'infra-source', filter: ['all', ['==', '$type', 'Polygon'], ['!=', 'tipo', 'puerto']], paint: { 'line-color': ['coalesce', ['get', 'color_ui'], '#475569'], 'line-width': 1.5 } },
//             { id: 'puerto-fill', type: 'fill', source: 'infra-source', filter: ['all', ['==', '$type', 'Polygon'], ['==', 'tipo', 'puerto']], paint: { 'fill-color': ['coalesce', ['get', 'color_ui'], !this.isDark ? '#60a5fa' : '#3b82f6'], 'fill-opacity': 0.15 } },
//             { id: 'puerto-line', type: 'line', source: 'infra-source', filter: ['all', ['==', '$type', 'Polygon'], ['==', 'tipo', 'puerto']], paint: { 'line-color': ['coalesce', ['get', 'color_ui'], !this.isDark ? '#699dd8' : '#567cf7'], 'line-width': 2.5, 'line-dasharray': [4, 2] } },
//             { id: 'vias-layer', type: 'line', source: 'vias-source', layout: { 'line-cap': 'round', 'line-join': 'round', 'visibility': 'visible' }, paint: { 'line-color': !this.isDark ? '#5d85be' : '#64748b', 'line-width': 1.8, 'line-opacity': 0.75 } },
//             { id: 'geocercas-layer', type: 'fill', source: 'geocercas-peajes-source', paint: { 'fill-color': ['coalesce', ['get', 'color_ui'], '#eab308'], 'fill-opacity': 0.15 } },
//             { id: 'geocercas-line-layer', type: 'line', source: 'geocercas-peajes-source', paint: { 'line-color': ['coalesce', ['get', 'color_ui'], '#ca8a04'], 'line-width': 1, 'line-dasharray': [4, 4] } },
//             { id: 'geocerca-fill-layer', type: 'fill', source: 'geocercas-kpi-source', paint: { 'fill-color': ['coalesce', ['get', 'color_ui'], '#94a3b8'], 'fill-opacity': 0.3 } },
//             { id: 'geocerca-line-layer', type: 'line', source: 'geocercas-kpi-source', paint: { 'line-color': ['coalesce', ['get', 'color_ui'], '#3b82f6'], 'line-width': 2, 'line-dasharray': [4, 2] } },
//             { id: 'layer-faros-fill', type: 'fill', source: 'source-faros', paint: { 'fill-color': ['coalesce', ['get', 'color_ui'], '#00E5FF'], 'fill-opacity': 0.25 } },
//             { id: 'layer-faros-line', type: 'line', source: 'source-faros', paint: { 'line-color': ['coalesce', ['get', 'color_ui'], '#00E5FF'], 'line-width': 2, 'line-dasharray': [3, 3] } },
//             { id: 'highlight-layer', type: 'line', source: 'highlight-source', paint: { 'line-color': this.isDark ? '#f59e0b' : '#c2410c', 'line-width': 4, 'line-opacity': 0.9, 'line-dasharray': [2, 2] }, layout: { 'line-cap': 'round', 'line-join': 'round' } },
//             { id: 'capa-infra-point', type: 'circle', source: 'infra-source', filter: ['==', '$type', 'Point'], paint: { 'circle-radius': 8, 'circle-stroke-width': 2, 'circle-stroke-color': '#ffffff', 'circle-color': ['match', ['get', 'estado_operativo'], 'libre', '#22c55e', 'ocupado', '#facc15', 'congestionado', '#f59e0b', 'critico', '#dc2626', 'desocupado', '#94a3b8', '#38bdf8'] } },
//             { id: 'terrestre-cluster-circle', type: 'circle', source: 'terrestre-source', filter: ['has', 'point_count'], paint: { 'circle-color': ['step', ['get', 'point_count'], '#2563eb', 20, '#f59e0b', 50, '#ef4444'], 'circle-radius': 24, 'circle-stroke-width': 2, 'circle-stroke-color': '#000000' } },
//             { id: 'terrestre-cluster-content', type: 'symbol', source: 'terrestre-source', filter: ['has', 'point_count'], layout: { 'icon-image': 'icono-camion-frente', 'icon-size': 0.05, 'icon-offset': [0, -10], 'text-field': '{point_count_abbreviated}', 'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'], 'text-size': 12, 'text-offset': [0, 0.8], 'icon-allow-overlap': true, 'text-allow-overlap': true }, paint: { 'text-color': '#ffffff' } },
//             { id: 'terrestre-individual', type: 'symbol', source: 'terrestre-source', filter: ['!', ['has', 'point_count']], layout: { 'icon-image': 'icono-camion', 'icon-size': ['case', ['>', ['get', 'velocidad'], 0], 0.05, 0.07], 'icon-allow-overlap': true, 'icon-rotate': ['coalesce', ['get', 'rumbo'], 0], 'icon-rotation-alignment': 'map' } },
//             { id: 'peajes-cluster-circle', type: 'circle', source: 'peajes-source', filter: ['has', 'point_count'], paint: { 'circle-color': ['step', ['get', 'point_count'], '#10b981', 4, '#059669', 8, '#047857'], 'circle-radius': 22, 'circle-stroke-width': 2, 'circle-stroke-color': '#000000' } },
//             { id: 'peajes-cluster-content', type: 'symbol', source: 'peajes-source', filter: ['has', 'point_count'], layout: { 'icon-image': 'peaje-cluster', 'icon-size': 0.08, 'icon-offset': [0, -100], 'text-field': '{point_count_abbreviated}', 'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'], 'text-size': 13, 'text-offset': [0, 0.7], 'icon-allow-overlap': true, 'text-allow-overlap': true }, paint: { 'text-color': '#ffffff' } },
//             { id: 'peajes-individual', type: 'symbol', source: 'peajes-source', filter: ['!', ['has', 'point_count']], layout: { 'icon-image': 'icono-peaje', 'icon-size': 0.05, 'icon-allow-overlap': true } },
//             { id: 'viales-cluster-circle', type: 'circle', source: 'alertas-viales-source', filter: ['has', 'point_count'], paint: { 'circle-color': ['step', ['get', 'point_count'], '#eab308', 4, '#f97316', 8, '#dc2626'], 'circle-radius': 22, 'circle-stroke-width': 2, 'circle-stroke-color': '#000000' } },
//             { id: 'viales-cluster-content', type: 'symbol', source: 'alertas-viales-source', filter: ['has', 'point_count'], layout: { 'icon-image': 'accidente-cluster', 'icon-size': 0.05, 'icon-offset': [0, -85], 'text-field': '{point_count_abbreviated}', 'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'], 'text-size': 13, 'text-offset': [0, 1.1], 'icon-allow-overlap': true, 'text-allow-overlap': true }, paint: { 'text-color': '#ffffff', 'text-halo-color': '#000000', 'text-halo-width': 1 } },
//             { id: 'viales-individual', type: 'symbol', source: 'alertas-viales-source', filter: ['!', ['has', 'point_count']], layout: { 'icon-image': ['match', ['get', 'tipoEvento'], 'ACCIDENTE', 'icono-accidente', 'VEHICULO_AVERIDADO', 'icono-accidente', 'MANTENIMIENTO_OBRA', 'icono-obra', 'CIERRE_VIAL', 'icono-obra', 'CONGESTION', 'icono-obra', 'icono-accidente'], 'icon-size': 0.1, 'icon-allow-overlap': true, 'icon-ignore-placement': true } },
//             { id: 'naves-cluster-symbol', type: 'symbol', source: 'naves-source', filter: ['has', 'point_count'], layout: { 'icon-image': 'icono-barco', 'icon-size': 0.07, 'icon-allow-overlap': true, 'text-field': '{point_count}', 'text-size': 12, 'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'], 'text-allow-overlap': true, 'text-offset': [0, 1.2] }, paint: { 'text-color': '#ffffff', 'text-halo-color': '#0f172a', 'text-halo-width': 2 } },
//             { id: 'naves-individual', type: 'symbol', source: 'naves-source', filter: ['!', ['has', 'point_count']], layout: { 'icon-image': 'icono-barco', 'icon-size': 0.06, 'icon-allow-overlap': true, 'icon-rotate': ['coalesce', ['get', 'rumbo'], 0], 'icon-rotation-alignment': 'map' } },
//             { id: 'naves-nombres', type: 'symbol', source: 'naves-source', filter: ['!', ['has', 'point_count']], layout: { 'text-field': ['get', 'nombre_motonave'], 'text-size': 11, 'text-offset': [0, 2], 'text-anchor': 'top' }, paint: { 'text-color': '#ffffff', 'text-halo-color': '#020617', 'text-halo-width': 2 } },
//             { id: 'clima-cluster-symbol', type: 'symbol', source: 'clima-source', filter: ['has', 'point_count'], layout: { 'icon-image': 'clima-defecto', 'icon-size': 0.04, 'icon-allow-overlap': true, 'text-field': '{point_count}', 'text-size': 12, 'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'], 'text-allow-overlap': true, 'text-offset': [0, 1.2] }, paint: { 'text-color': '#ffffff', 'text-halo-color': '#0f172a', 'text-halo-width': 2 } },
//             { id: 'clima-individual', type: 'symbol', source: 'clima-source', filter: ['!', ['has', 'point_count']], layout: { 'icon-image': ['match', ['get', 'fenomeno'], 'Lluvia', 'clima-lluvia', 'Precipitaciones', 'clima-lluvia', 'Tormenta Electrica', 'clima-tormenta', 'Vientos Fuertes', 'clima-viento', 'Vendaval', 'clima-viento', 'Incendio Forestal', 'clima-incendio', 'clima-defecto'], 'icon-size': 0.04, 'icon-allow-overlap': true } }
//         ];

//         layers.forEach(l => {
//             try {
//                 if (this.map.getLayer(l.id)) this.map.removeLayer(l.id);
//                 this.map.addLayer(l as any);
//             } catch (e) { console.error('Error cargando capa:', l.id, e); }
//         });

//         this._mapaService.cargarDatosIniciales();
//     }

//     private suscribirseADatos() {
//         this.subs.add(this._mapaService.gemeloDigital$.subscribe(data => {
//             if (!data) return;
//             if (data.CAPA_INFRAESTRUCTURA) this.actualizarFuente('infra-source', this.procesarInfraestructuraWkt(data.CAPA_INFRAESTRUCTURA));
//             if (data.CAPA_TERRESTRE) {
//                 this.ultimaFlotaGeoJson = data.CAPA_TERRESTRE;
//                 this.actualizarFuente('terrestre-source', data.CAPA_TERRESTRE);
//             }
//             if (data.CAPA_CLIMA) this.actualizarFuente('clima-source', data.CAPA_CLIMA);
//             if (data.CAPA_VIAS) this.actualizarFuente('vias-source', data.CAPA_VIAS);
//         }));

//         this.subs.add(this._mapaService.naves$.subscribe((data: any) => {
//             const dataToSet = (data && data.data && data.data.type === 'FeatureCollection') ? data.data : data;
//             if (dataToSet && dataToSet.features) {
//                 dataToSet.features.forEach((feature: any) => {
//                     const idUnico = feature.properties.mmsi || feature.properties.omi || feature.properties.nombre_motonave;
//                     if (idUnico) this.navesActuales.set(idUnico, feature);
//                 });
//                 this.renderizarNavesFusionadas();
//             }
//         }));

//         this.subs.add(this._mapaService.accidentes$.subscribe(data => {
//             this.ultimosIncidentes = data;
//             this.procesarRelacionIncidentePeaje();
//         }));

//         this.subs.add(this._mapaService.visibilidad$.subscribe(vis => {
//             if (!this.map || !this.map.isStyleLoaded()) return;

//             const isInfraVisible = vis['infra'] !== false;
//             const isNavesVisible = vis['naves'] !== false;
//             const isTerrestreVisible = vis['terrestre'] !== false;
//             const isViasVisible = vis['vias'] !== false;
//             const isClimaVisible = vis['clima'] !== false;
//             const isAccidentesVisible = vis['accidentes'] !== false;
//             const isPeajesVisible = vis['peajes'] !== false;

//             const mapping = [
//                 { id: 'vias-layer', visible: isViasVisible },
//                 { id: 'naves-cluster-symbol', visible: isNavesVisible },
//                 { id: 'naves-individual', visible: isNavesVisible },
//                 { id: 'naves-nombres', visible: isNavesVisible },
//                 { id: 'capa-infra-fill', visible: isInfraVisible },
//                 { id: 'capa-infra-line', visible: isInfraVisible },
//                 { id: 'capa-infra-point', visible: isInfraVisible },
//                 { id: 'puerto-fill', visible: isInfraVisible },
//                 { id: 'puerto-line', visible: isInfraVisible },
//                 { id: 'terrestre-cluster-symbol', visible: isTerrestreVisible },
//                 { id: 'terrestre-individual', visible: isTerrestreVisible },
//                 { id: 'clima-cluster-symbol', visible: isClimaVisible },
//                 { id: 'clima-individual', visible: isClimaVisible },
//                 { id: 'viales-cluster-symbol', visible: isAccidentesVisible },
//                 { id: 'viales-individual', visible: isAccidentesVisible },
//                 { id: 'peajes-cluster-symbol', visible: isPeajesVisible },
//                 { id: 'peajes-individual', visible: isPeajesVisible },
//                 { id: 'geocercas-layer', visible: isPeajesVisible },
//                 { id: 'geocercas-line-layer', visible: isPeajesVisible }
//             ];

//             mapping.forEach(m => {
//                 if (this.map.getLayer(m.id)) {
//                     this.map.setLayoutProperty(m.id, 'visibility', m.visible ? 'visible' : 'none');
//                 }
//             });
//         }));
//     }

//     private iniciarRadarGeocercas(): void {
//         this.consultarGeocercas();
//         this.geocercasSubscription = interval(30000).subscribe(() => {
//             this.consultarGeocercas();
//         });
//     }

//     private _generarContenidoPopup(layerId: string, feature: any): string {
//         const data = feature.properties || {};

//         switch (layerId) {
//             case 'capa-infra-fill':
//             case 'capa-infra-point':
//                 return `<div class="custom-map-popup infra"><h3>${data.nombre || 'Sin nombre'}</h3><p><strong>Tipo:</strong> ${data.tipo ? data.tipo.toUpperCase() : 'N/A'}</p></div>`;

//             case 'naves-individual':
//                 const estadoNave = data.estado_nave || 'EN TRÁNSITO';
//                 const omi = data.omi || 'N/A';
//                 const bandera = data.bandera || 'Desconocida';
//                 const eta = data.eta ? new Date(data.eta).toLocaleString('es-CO') : 'No Registrada';
//                 const agencia = data.agencia || 'N/A';
//                 const velocidadnv = data.velocidad !== undefined && data.velocidad !== null ? `${data.velocidad} nudos` : 'N/A';
//                 const rumbo = data.rumbo !== undefined && data.rumbo !== null ? `${data.rumbo}°` : 'N/A';
//                 const tipoNave = data.tipo_nave || 'N/A';
//                 const terminal = data.instalacion_portuaria || 'N/A';
//                 const eslora = data.eslora || 'N/A';
//                 const calado = data.calado ? `${data.calado}m` : 'N/A';

//                 let badgeColor = '#64748b';
//                 if (estadoNave === 'AVISADAS') badgeColor = '#a855f7';
//                 if (estadoNave === 'FONDEADAS') badgeColor = '#facc15';
//                 if (estadoNave === 'ARRIBADAS') badgeColor = '#22c55e';

//                 return `
//                 <div class="custom-map-popup nave-popup" style="min-width: 260px; font-family: sans-serif;">
//                     <div class="PORTTOS-popup-header" style="border-bottom: 2px solid #00E5FF; padding-bottom: 8px; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: flex-start;">
//                         <div style="flex: 1; min-width: 0; padding-right: 8px;">
//                             <h3 style="color: ${this.isDark ? '#38bdf8' : '#0056b3'}; margin:0; font-size: 10px; font-weight: 600; line-height: 1.4; word-wrap: break-word;">
//                                 🚢 ${data.nombre_motonave || 'DESCONOCIDA'}
//                             </h3>
//                         </div>
//                         <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 4px; flex-shrink: 0;">
//                             <span style="background-color: #334155; color: #fff; padding: 2px 6px; border-radius: 4px; font-size: 9px; font-weight: bold; white-space: nowrap;">
//                                 MMSI: ${data.mmsi || 'N/A'}
//                             </span>
//                             <span style="background-color: ${badgeColor}; color: ${estadoNave === 'FONDEADAS' ? '#000' : '#fff'}; padding: 2px 6px; border-radius: 4px; font-size: 9px; font-weight: bold; white-space: nowrap;">
//                                 ${estadoNave}
//                             </span>
//                         </div>
//                     </div>
//                     <div class="PORTTOS-popup-body" style="font-size: 12px; line-height: 1.5; color: ${this.isDark ? '#e2e8f0' : '#334155'};">
//                         <b>OMI:</b> ${omi}<br>
//                         <b>Tipo:</b> ${tipoNave}<br>
//                         <b>Bandera:</b> ${bandera}<br>
//                         <b>Agencia:</b> ${agencia}<br>
//                         <hr style="margin: 4px 0; border: 0.5px dashed #ccc;">
//                         <b>Velocidad:</b> ${velocidadnv} | <b>Rumbo:</b> ${rumbo}<br>
//                         <b>Dimensiones:</b> Eslora ${eslora}m | Calado ${calado}<br>
//                         <b>Instalación:</b> ${terminal}<br>
//                         <b>ETA:</b> <span style="color: #d9534f; font-weight: bold;">${eta}</span>
//                     </div>
//                 </div>`;

//             case 'geocerca-fill-layer':
//                 const colorKpi = data.estado_kpi === 'ROJO' ? '#dc2626' : (data.estado_kpi === 'AMARILLO' ? '#facc15' : '#22c55e');
//                 const textoColor = data.estado_kpi === 'AMARILLO' ? '#000' : '#fff';

//                 const htmlTerrestre = data.total_camiones > 0 || data.tipo_faro !== 'MARITIMA' ? `
//                     <div style="margin-top: 8px; border-top: 1px solid #334155; padding-top: 8px;">
//                         <div style="margin-bottom: 4px;"><strong>🚛 Terrestre en zona:</strong> ${data.total_camiones}</div>
//                         <div style="margin-bottom: 4px; color: #22c55e; font-size: 11px;">&nbsp;↳ En movimiento: ${data.camiones_ruta}</div>
//                         <div style="margin-bottom: 4px; color: #ef4444; font-size: 11px;">&nbsp;↳ Detenidos/Filas: ${data.camiones_detenidos}</div>
//                     </div>
//                 ` : '';

//                 const navesClasificadas = data.naves_fondeadas + data.naves_avisadas + data.naves_arribadas;
//                 const navesTránsito = data.total_naves - navesClasificadas;

//                 const htmlMaritimo = data.total_naves > 0 || data.tipo_faro === 'MARITIMA' ? `
//                     <div style="margin-top: 8px; border-top: 1px solid #334155; padding-top: 8px;">
//                         <div style="margin-bottom: 4px; color: #06b6d4;"><strong>🚢 Naves en zona:</strong> ${data.total_naves}</div>
//                         <div style="margin-bottom: 4px; color: #facc15; font-size: 11px;">&nbsp;↳ Fondeadas (Espera): ${data.naves_fondeadas}</div>
//                         <div style="margin-bottom: 4px; color: #a855f7; font-size: 11px;">&nbsp;↳ Avisadas (Aprox): ${data.naves_avisadas}</div>
//                         <div style="margin-bottom: 4px; color: #22c55e; font-size: 11px;">&nbsp;↳ Arribadas (Muelle): ${data.naves_arribadas}</div>
//                         <div style="margin-bottom: 4px; color: #94a3b8; font-size: 11px;">&nbsp;↳ Tránsito / Sin match: ${navesTránsito}</div>
//                     </div>
//                 ` : '';

//                 return `
//                     <div class="custom-map-popup kpi" style="min-width: 230px;">
//                         <div class="PORTTOS-popup-header" style="border-bottom: 2px solid ${colorKpi}; padding-bottom: 8px;">
//                             <h3 style="color:${colorKpi}; margin:0; font-size: 15px;">📍 ${data.nombre_faro}</h3>
//                             <span class="PORTTOS-badge" style="background-color:${colorKpi}; color: ${textoColor}; border-radius: 4px; padding: 2px 6px; font-size: 10px; font-weight: bold; margin-top: 5px; display: inline-block;">
//                                 ESTADO ${data.estado_kpi}
//                             </span>
//                         </div>
//                         <div class="PORTTOS-popup-body" style="font-size: 13px;">
//                             ${htmlTerrestre}
//                             ${htmlMaritimo}
//                         </div>
//                     </div>
//                 `;

//             case 'viales-individual':
//                 const tipo = data.tipoEvento ? data.tipoEvento.replace(/_/g, ' ') : 'ALERTA VIAL';
//                 const sev = parseInt(data.nivelSeveridad, 10);

//                 let sevBadgeClass = 'success';
//                 let sevText = '🟢 BAJA';
//                 if (sev >= 3) { sevBadgeClass = 'danger'; sevText = '🔴 ALTA'; }
//                 else if (sev === 2) { sevBadgeClass = 'warning'; sevText = '🟠 MEDIA'; }

//                 let fechaVial = 'Fecha desconocida';
//                 if (data.fechaInicio) {
//                     fechaVial = new Date(data.fechaInicio).toLocaleString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
//                 }

//                 let htmlVial = `
//                     <div class="PORTTOS-popup-header">
//                         <h3>🚨 ${tipo}</h3>
//                         <span class="PORTTOS-badge ${sevBadgeClass}">${sevText}</span>
//                     </div>
//                     <div class="PORTTOS-popup-body">
//                         <div class="PORTTOS-col">
//                             <span class="PORTTOS-label">📍 Corredor:</span>
//                             <span class="PORTTOS-value">${data.corredor || data.corredorVial || 'No especificado'}</span>
//                         </div>
//                         <div class="PORTTOS-col">
//                             <span class="PORTTOS-label">🛣️ Sector:</span>
//                             <span class="PORTTOS-value">${data.sector || 'No especificado'}</span>
//                         </div>
//                         <div class="PORTTOS-col">
//                             <span class="PORTTOS-label">🕒 Reportado:</span>
//                             <span class="PORTTOS-value">${fechaVial}</span>
//                         </div>
//                         <div class="PORTTOS-divider" style="color: #e2e8f0; font-size: 11px; max-height: 80px; overflow-y: auto;">
//                             ${data.descripcion || 'Sin descripción detallada.'}
//                         </div>
//                 `;

//                 if (data.afectaPeaje === true || data.afectaPeaje === 'true') {
//                     htmlVial += `<div class="PORTTOS-alert-box">⚠️ CRÍTICO: Cerca a ${data.peajeAfectado}</div>`;
//                 }
//                 return htmlVial + `</div>`;

//             case 'terrestre-individual':
//                 const placa = data.placa || 'SIN PLACA';
//                 const conductor = data.conductor || 'No asignado';
//                 const velocidad = data.velocidad !== undefined ? data.velocidad : 0;
//                 const estadoCrudo = data.estado_camion || data.estado || 'DESCONOCIDO';
//                 const estadoCamion = estadoCrudo.replace(/_/g, ' ').toUpperCase();

//                 let estadoBadgeClass = 'warning';
//                 let estadoText = `🟡 ${estadoCamion}`;

//                 if (estadoCamion.includes('RUTA')) { estadoBadgeClass = 'success'; estadoText = '🟢 EN RUTA'; }
//                 else if (estadoCamion.includes('TRAFICO') || estadoCamion.includes('TRÁFICO')) { estadoBadgeClass = 'danger'; estadoText = '🟠 TRÁFICO'; }
//                 else if (estadoCamion.includes('DETENIDO')) { estadoBadgeClass = 'danger'; estadoText = '🔴 DETENIDO'; }
//                 else if (estadoCamion.includes('DESCARGANDO')) { estadoBadgeClass = 'info'; estadoText = '🔵 DESCARGANDO'; }

//                 return `
//                     <div class="PORTTOS-popup-header">
//                         <h3>🚛 ${placa}</h3>
//                         <span class="PORTTOS-badge ${estadoBadgeClass}">${estadoText}</span>
//                     </div>
//                     <div class="PORTTOS-popup-body">
//                         <div class="PORTTOS-row">
//                             <span class="PORTTOS-label">👨‍✈️ Conductor:</span>
//                             <span class="PORTTOS-value">${conductor}</span>
//                         </div>
//                         <div class="PORTTOS-row">
//                             <span class="PORTTOS-label">💨 Velocidad:</span>
//                             <span class="PORTTOS-value" style="color: ${velocidad > 0 ? '#38bdf8' : '#f1f5f9'};">${velocidad} km/h</span>
//                         </div>
//                         <div class="PORTTOS-row">
//                             <span class="PORTTOS-label">🚚 Tipo:</span>
//                             <span class="PORTTOS-value">${data.tipo_camion || 'Furgón'}</span>
//                         </div>
//                     </div>
//                 `;

//             case 'peajes-individual':
//                 const nombrePeaje = data.nombre || 'Punto de Control';
//                 let totalCamiones = 0;
//                 let incidentesCercanos = 0;
//                 let tieneIncidenteCritico = false;

//                 try {
//                     if (feature.geometry && feature.geometry.coordinates) {
//                         const centroPeaje = turf.point(feature.geometry.coordinates);
//                         const areaInfluencia = turf.buffer(centroPeaje, 2, { units: 'kilometers' });

//                         if (areaInfluencia) {
//                             if (this.ultimaFlotaGeoJson && this.ultimaFlotaGeoJson.features) {
//                                 this.ultimaFlotaGeoJson.features.forEach((camion: any) => {
//                                     if (camion.geometry && camion.geometry.coordinates) {
//                                         if (turf.booleanPointInPolygon(turf.point(camion.geometry.coordinates), areaInfluencia as any)) {
//                                             totalCamiones++;
//                                         }
//                                     }
//                                 });
//                             }

//                             if (this.ultimosIncidentes && this.ultimosIncidentes.features) {
//                                 this.ultimosIncidentes.features.forEach((inc: any) => {
//                                     if (inc.geometry && inc.geometry.coordinates) {
//                                         if (turf.booleanPointInPolygon(turf.point(inc.geometry.coordinates), areaInfluencia as any)) {
//                                             incidentesCercanos++;
//                                             if (inc.properties.nivelSeveridad >= 3) {
//                                                 tieneIncidenteCritico = true;
//                                             }
//                                         }
//                                     }
//                                 });
//                             }
//                         }
//                     }
//                 } catch (e) { }

//                 let estadoKpiP = 'VERDE';
//                 let colorHexP = '#22c55e';
//                 let estadoTextoP = 'Flujo Normal';

//                 if (tieneIncidenteCritico || totalCamiones >= 20) {
//                     estadoKpiP = 'ROJO';
//                     colorHexP = '#dc2626';
//                     estadoTextoP = 'Crítico / Congestión';
//                 } else if (incidentesCercanos > 0 || totalCamiones >= 5) {
//                     estadoKpiP = 'AMARILLO';
//                     colorHexP = '#facc15';
//                     estadoTextoP = 'Tráfico Denso';
//                 }

//                 return `
//                     <div class="custom-map-popup kpi" style="min-width: 200px;">
//                         <div class="PORTTOS-popup-header" style="border-bottom: 2px solid ${colorHexP}; padding-bottom: 8px; margin-bottom: 8px;">
//                             <h3 style="color:${colorHexP}; margin:0; font-size: 15px;">🏢 ${nombrePeaje}</h3>
//                             <span class="PORTTOS-badge" style="background-color:${colorHexP}; color: ${estadoKpiP === 'AMARILLO' ? '#000' : '#fff'}; border-radius: 4px; padding: 2px 6px; font-size: 10px; font-weight: bold; margin-top: 5px; display: inline-block;">
//                                 ESTADO ${estadoKpiP}
//                             </span>
//                         </div>
//                         <div class="PORTTOS-popup-body" style="font-size: 13px;">
//                             <div style="margin-bottom: 4px;"><strong>🚦 Operación:</strong> ${estadoTextoP}</div>
//                             <div style="margin-bottom: 4px;"><strong>🚛 Camiones en zona (2km):</strong> ${totalCamiones}</div>
//                             <div style="margin-bottom: 4px;"><strong>⚠️ Incidentes cercanos:</strong> ${incidentesCercanos}</div>
//                         </div>
//                     </div>
//                 `;

//             case 'clima-individual':
//                 const fenomenoStr = data.fenomeno || 'Alerta Climática';
//                 const nivelAlertaStr = data.nivel || 'N/A';
//                 const dptoStr = data.departamento || 'No especificado';
//                 const munStr = data.municipio || 'No especificado';
//                 const detalleClima = data.descripcion || data.description || 'Sin descripción detallada.';
//                 const colorClima = '#8b5cf6';

//                 return `
//                     <div class="custom-map-popup" style="padding: 16px; min-width: 260px;">
//                         <div class="qplus-popup-header" style="border-bottom: 2px solid ${colorClima}; padding-bottom: 12px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center;">
//                             <h3 style="color: ${this.isDark ? '#f8fafc' : '#1e293b'}; margin:0; font-size: 14px; font-weight: bold; flex: 1; padding-right: 10px; line-height: 1.2;">
//                                 ☁️ ${fenomenoStr.toUpperCase()}
//                             </h3>
//                             <span class="qplus-badge" style="background-color: ${colorClima}; color: #ffffff; border-radius: 4px; padding: 4px 8px; font-size: 10px; font-weight: bold; flex-shrink: 0; text-align: center;">
//                                 NIVEL ${nivelAlertaStr.toUpperCase()}
//                             </span>
//                         </div>
//                         <div class="qplus-popup-body" style="font-size: 13px; color: ${this.isDark ? '#cbd5e1' : '#64748b'};">
//                             <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
//                                 <span>📍 Ubicación:</span>
//                                 <span style="font-weight: 600; color: ${this.isDark ? '#f8fafc' : '#0f172a'}; text-align: right;">
//                                     ${munStr}, ${dptoStr}
//                                 </span>
//                             </div>
//                             <div style="margin-top: 10px; border-top: 1px solid #334155; padding-top: 10px; font-style: italic; text-transform: capitalize; color: ${this.isDark ? '#94a3b8' : '#475569'};">
//                                 ${detalleClima}
//                             </div>
//                         </div>
//                     </div>
//                 `;

//             default:
//                 return `<div class="custom-map-popup"><h3>Información</h3></div>`;
//         }
//     }

//     private renderizarNavesFusionadas(): void {
//         const features = Array.from(this.navesActuales.values());
//         this.actualizarFuente('naves-source', { type: 'FeatureCollection', features });
//     }

//     private actualizarFuente(sourceId: string, data: any): void {
//         if (!this.map || !this.map.getSource(sourceId)) return;
//         (this.map.getSource(sourceId) as any).setData(data);
//     }

//     private getStyle(): string {
//         const MAPTILER_KEY = 'WMNuRXDl7kbmZ19cOGo2';

//         switch (this.estiloBase) {
//             case 'terreno':
//                 return this.isDark
//                     ? `https://api.maptiler.com/maps/topo-v2-dark/style.json?key=${MAPTILER_KEY}`
//                     : `https://api.maptiler.com/maps/topo-v2/style.json?key=${MAPTILER_KEY}`;
//             case 'satelite':
//                 return `https://api.maptiler.com/maps/hybrid/style.json?key=${MAPTILER_KEY}`;
//             case 'outdoor':
//             default:
//                 return this.isDark
//                     ? `https://api.maptiler.com/maps/streets-v2-dark/style.json?key=${MAPTILER_KEY}`
//                     : `https://api.maptiler.com/maps/streets-v2/style.json?key=${MAPTILER_KEY}`;
//         }
//     }

//     public centrarMapa(): void {
//         this.leerSessionYEnfocar(true);
//     }

//     public maximizar(): void {
//         this._torreService.abrirModoEnfoque(this.widgetId || '', []);
//     }

//     public toggleCapaMenu(capaId: string, event: any): void {
//         const estado = event.target.checked;
//         this._mapaService.actualizarVisibilidadCapa(capaId, estado);
//     }

//     private _getMatchConfig(property: 'fill' | 'line' | 'circle'): any[] {
//         const matchArray: any[] = ['match', ['get', 'tipo']];
//         Object.entries(INFRA_THEME).forEach(([tipo, colores]) => {
//             if (tipo !== 'default') matchArray.push(tipo, colores[property]);
//         });
//         matchArray.push(INFRA_THEME['default'][property]);
//         return matchArray;
//     }

//     public toggleMapaBase(): void {
//         const nuevoEstilo = this.estiloBase === 'satelite' ? 'outdoor' : 'satelite';
//         this.cambiarEstiloBase(nuevoEstilo);
//     }
// }
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
    HostBinding
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription, interval } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { ThemeService } from '../../../theme/shared/service/theme.service';
import { LocalStorageService, SocketService } from 'src/app/theme/shared/service';
import { MapaGeneralService } from '../../../theme/shared/service/tablero-control/mapa-general.service';
import { DashboardService } from 'src/app/theme/shared/service/tablero-control/dashboard.service';
import { FiltroTableroService } from 'src/app/theme/shared/service/tablero-control/filtro-tablero.service';
import { IWidget } from 'src/app/theme/shared/interfaces/torre-control/widget.interface';
import { MapSocketService } from 'src/app/theme/shared/service/tablero-control/map-socket.service';
import { FaroModel } from 'src/app/theme/shared/_helpers/models/tablero-control/faro.model';
import { FarosService } from 'src/app/theme/shared/service/tablero-control/faros.service';
import { AisRadarService } from 'src/app/theme/shared/service/tablero-control/ais-radar.service';
import maplibregl, { GeoJSONSource } from 'maplibre-gl';
import { ToastrService } from 'ngx-toastr';
import { parse } from 'wellknown';
import * as turf from '@turf/turf';

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
    imports: [CommonModule],
    templateUrl: './mapa-logistico.component.html',
    styleUrls: ['./mapa-logistico.component.scss']
})
export class MapaLogisticoComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy, IWidget {
    @ViewChild('mapContainer') mapContainer!: ElementRef;

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
    private alertaTerrestreSub!: Subscription;
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

    private navesActuales = new Map<string, any>();
    private farosActivos: any[] = [];

    private suscripcionesDatosIniciadas = false;
    private eventosClicksConfigurados = false;

    public mostrarCapas: boolean = false;
    public mostrarLeyenda: boolean = false;
    public entidades = NOMENCLATURA_ENTIDADES;
    public estados = ESTADOS_OPERATIVOS;

    public menuCapas = [
        {
            grupo: 'Operación Marítima',
            icono: 'directions_boat',
            abierto: true,
            capas: [{ id: 'naves', nombre: 'Motonaves en tránsito', activa: true }]
        },
        {
            grupo: 'Infraestructura',
            icono: 'domain',
            abierto: true,
            capas: [{ id: 'infra', nombre: 'Puertos y Terminales', activa: true }]
        },
        {
            grupo: 'Operación Terrestre',
            icono: 'local_shipping',
            abierto: true,
            capas: [
                { id: 'terrestre', nombre: 'Flota en ruta (GPS)', activa: true },
                { id: 'vias', nombre: 'Red Vial Nacional', activa: true },
                { id: 'peajes', nombre: 'Peajes y Geocercas', activa: true }
            ]
        },
        {
            grupo: 'Riesgos y Clima',
            icono: 'warning',
            abierto: true,
            capas: [
                { id: 'accidentes', nombre: 'Incidentes Viales', activa: true },
                { id: 'clima', nombre: 'Alertas IDEAM', activa: true }
            ]
        }
    ];

    constructor(
        private _themeService: ThemeService,
        private _localStorage: LocalStorageService,
        private _torreService: DashboardService,
        public _mapaService: MapaGeneralService,
        public _mapaSocketService: MapSocketService,
        public _farosService: FarosService,
        private _radarAisService: AisRadarService,
        private _filtroTableroService: FiltroTableroService,
        private http: HttpClient,
        private toastr: ToastrService,
        private _socketService: SocketService
    ) {
        this.isDark = this._localStorage.getThemeSettings()?.isDarkTheme || false;
    }

    @HostBinding('class') get hostClass(): string {
        const cols = this.widgetConfig?.cols || this.config?.colspan || 12;
        return `col-span-${cols}`;
    }

    ngOnInit(): void {
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

                if (idEsperado) this.verificarCambioDeSession(idEsperado, 0);
            })
        );

        this.cargarPeajesEstaticos();
        this.iniciarAlertasTerrestres();
        this.iniciarCapaMaritima();
        this.cargarEventosViales();
        this.cargarFaros();
    }

    ngAfterViewInit(): void {
        this.inicializarMapa();

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
            if (nuevoPuerto) {
                this.verificarCambioDeSession(nuevoPuerto, 0);
            }
        }

        if (changes['isEnfoque'] && !changes['isEnfoque'].isFirstChange()) {
            setTimeout(() => {
                this.map?.resize();
            }, 80);
        }
    }

    ngOnDestroy(): void {
        this.subs.unsubscribe();
        if (this.pollingSubscription) this.pollingSubscription.unsubscribe();
        if (this.geocercasSubscription) this.geocercasSubscription.unsubscribe();
        if (this.resizeObserver) this.resizeObserver.disconnect();
        if (this.alertaTerrestreSub) this.alertaTerrestreSub.unsubscribe();
        if (this.maritimoSub) this.maritimoSub.unsubscribe();

        this._mapaSocketService.desconectarSalaMaritima();
        if (this.map) this.map.remove();
    }

    /**
     * Hidratación reactiva compatible con datos inyectados o cacheados
     */
    private hidratarConDatosVivos(data: any): void {
        if (!data) return;

        if (data.CAPA_INFRAESTRUCTURA) {
            this.ultimaInfraGeoJson = this.procesarInfraestructuraWkt(data.CAPA_INFRAESTRUCTURA);
            this.actualizarFuente('infra-source', this.ultimaInfraGeoJson);
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

    public cargarEventosViales(): void {
        this.subs.add(
            this._mapaService.obtenerAccidentesYBloqueosViales().subscribe({
                next: (geoJsonRespuesta) => {
                    if (geoJsonRespuesta) {
                        this.ultimosIncidentes = geoJsonRespuesta;
                        this.procesarRelacionIncidentePeaje();
                    }
                },
                error: (error) => {
                    console.error('❌ Error al traer los datos de incidentes:', error);
                }
            })
        );
    }

    private iniciarAlertasTerrestres(): void {
        this.alertaTerrestreSub = this._socketService.listen('alerta-terrestre').subscribe((data: any) => {
            this.toastr.warning(`Ingresó a: ${data.geocerca}`, `🚛 Alerta: Camión ${data.placa}`, {
                timeOut: 6000,
                positionClass: 'toast-bottom-right',
                progressBar: true
            });
        });
    }

    private iniciarCapaMaritima(): void {
        if (this._mapaSocketService && typeof this._mapaSocketService.conectarSalaMaritima === 'function') {
            this._mapaSocketService.conectarSalaMaritima();
        }

        this.maritimoSub = this._socketService.listen('radar-actualizado').subscribe((featureSocket: any) => {
            if (featureSocket && featureSocket.geometry) {
                const idUnico = featureSocket.properties.mmsi || featureSocket.properties.nombre_motonave;
                const nombreNave = featureSocket.properties.nombre_motonave || 'Desconocida';
                const naveExistente = this.navesActuales.get(idUnico);

                const puntoNave = turf.point(featureSocket.geometry.coordinates);
                let faroDetectado = null;

                for (const faro of this.farosActivos) {
                    if (faro.geocerca_geo && faro.geocerca_geo.features.length > 0) {
                        const poligonoFaro = faro.geocerca_geo.features[0];
                        if (turf.booleanPointInPolygon(puntoNave, poligonoFaro)) {
                            faroDetectado = faro;
                            break;
                        }
                    }
                }

                const faroAnteriorId = naveExistente ? naveExistente.properties.faro_actual_id : null;
                const faroDetectadoId = faroDetectado ? faroDetectado.id_faro : null;

                if (faroDetectado && faroDetectadoId !== faroAnteriorId) {
                    if (faroDetectado.genera_alerta_toast) {
                        this.toastr.info(`Ingresó a zona: ${faroDetectado.nombre_faro}`, `⚓ Alerta: ${nombreNave}`, {
                            timeOut: 7000,
                            positionClass: 'toast-bottom-right',
                            progressBar: true
                        });
                    }
                }

                featureSocket.properties = {
                    ...(naveExistente ? naveExistente.properties : {}),
                    ...featureSocket.properties,
                    faro_actual_id: faroDetectadoId
                };

                this.navesActuales.set(idUnico, featureSocket);
                this.renderizarNavesFusionadas();
            }
        });
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
        if (this.mostrarCapas) this.mostrarLeyenda = false;
    }

    public toggleLeyenda(): void {
        this.mostrarLeyenda = !this.mostrarLeyenda;
        if (this.mostrarLeyenda) this.mostrarCapas = false;
    }

    public toggleGrupoMenu(grupo: any): void {
        grupo.abierto = !grupo.abierto;
    }

    private hacerCircular(geojsonOriginal: any, radioMetrosDB?: number): any {
        try {
            if (!geojsonOriginal) return null;
            let geom = geojsonOriginal;
            if (geojsonOriginal.type === 'FeatureCollection') geom = geojsonOriginal.features[0]?.geometry;
            else if (geojsonOriginal.type === 'Feature') geom = geojsonOriginal.geometry;

            if (!geom) return geojsonOriginal;

            if (radioMetrosDB && radioMetrosDB > 0) {
                const centro = turf.centroid(geom);
                return turf.circle(centro.geometry.coordinates, radioMetrosDB / 1000, {
                    steps: 64,
                    units: 'kilometers'
                }).geometry;
            }

            if (geom.type === 'Point') {
                return turf.circle(geom.coordinates, 2, { steps: 64, units: 'kilometers' }).geometry;
            }

            const centro = turf.centroid(geom);
            const bbox = turf.bbox(geom);
            const puntoBorde = turf.point([centro.geometry.coordinates[0], bbox[1]]);
            let radioKm = turf.distance(centro, puntoBorde, { units: 'kilometers' });

            if (radioKm === 0) radioKm = 1;
            return turf.circle(centro.geometry.coordinates, radioKm, { steps: 64, units: 'kilometers' }).geometry;
        } catch (e) {
            return geojsonOriginal;
        }
    }

    private convertirWKT_ACirculo(wkt: string, radioMetrosDB?: number): any {
        try {
            const geojsonOriginal = parse(wkt);
            return this.hacerCircular(geojsonOriginal, radioMetrosDB);
        } catch (e) {
            return parse(wkt);
        }
    }

    private cargarPeajesEstaticos(): void {
        this.subs.add(
            this.http.get('/assets/data/Peajes_20260705.geojson').subscribe({
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
                    this.farosActivos = faros;
                    this.renderizarFarosMapa();
                },
                error: (error) => {
                    console.error('Error al obtener los faros:', error);
                }
            })
        );
    }

    private renderizarFarosMapa(): void {
        if (!this.map || !this.map.isStyleLoaded()) return;

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

    private verificarCambioDeSession(idEsperado: string, intento: number): void {
        if (!this.map || !this.map.isStyleLoaded()) return;

        if (!idEsperado || idEsperado === 'ALL') {
            this.irAColombia();
            return;
        }

        const puerto = this._localStorage.getPuertoLocalStorage();
        const idActual = puerto?.id_puerto || puerto?.nombre || '';
        const esPuertoCorrecto =
            idActual &&
            (idActual.toUpperCase().includes(idEsperado.toUpperCase()) ||
                idEsperado.toUpperCase().includes(idActual.toUpperCase()));

        const currentGeocercaStr = puerto?.geocerca_geo
            ? typeof puerto.geocerca_geo === 'string'
                ? puerto.geocerca_geo
                : JSON.stringify(puerto.geocerca_geo)
            : puerto?.puerto_geocerca_wkt || '';

        if (currentGeocercaStr && currentGeocercaStr !== this.lastGeocercaStr && esPuertoCorrecto) {
            this.leerSessionYEnfocar(true);
        } else if (intento < 20) {
            setTimeout(() => this.verificarCambioDeSession(idEsperado, intento + 1), 250);
        } else {
            this.leerSessionYEnfocar(true);
        }
    }

    private leerSessionYEnfocar(moverCamara: boolean = true): void {
        if (!this.map || !this.map.isStyleLoaded()) return;

        this.map.resize();
        const puerto = this._localStorage.getPuertoLocalStorage();
        const highlightSource = this.map.getSource('highlight-source') as GeoJSONSource;

        if (!puerto || (!puerto.geocerca_geo && !puerto.puerto_geocerca_wkt)) {
            if (moverCamara) this.irAColombia(highlightSource);
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
            if (geojsonObj) geojsonObj = this.hacerCircular(geojsonObj);
        } catch (e) { }

        if (geojsonObj) {
            let dataToSet: any = { type: 'FeatureCollection', features: [] };
            if (geojsonObj.type === 'FeatureCollection') dataToSet = geojsonObj;
            else if (geojsonObj.type === 'Feature') dataToSet.features.push(geojsonObj);
            else dataToSet.features.push({ type: 'Feature', geometry: geojsonObj, properties: {} });

            if (highlightSource) highlightSource.setData(dataToSet);

            if (!moverCamara) return;

            const bounds = this.calcularBboxGeoJSON(dataToSet);
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

    private irAColombia(source?: GeoJSONSource): void {
        if (!this.map) return;
        const highlight = source || (this.map.getSource('highlight-source') as GeoJSONSource);
        if (highlight) highlight.setData({ type: 'FeatureCollection', features: [] });
        this.map.resize();
        this.map.flyTo({ center: [-73.5, 4.0], zoom: 5.5, duration: 2000 });
    }

    private calcularBboxGeoJSON(geojson: any): maplibregl.LngLatBounds | null {
        if (!geojson) return null;
        try {
            const bbox = turf.bbox(geojson);
            return new maplibregl.LngLatBounds([bbox[0], bbox[1]], [bbox[2], bbox[3]]);
        } catch (e) {
            return null;
        }
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
            this.inicializarCapas();
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

        this.map.addControl(new maplibregl.NavigationControl(), 'top-right');
    }

    /**
     * Restaura los datos en las fuentes GeoJSON después de alternar Satélite/Outdoor o Tema Oscuro/Claro
     */
    private rehidratarFuentesEnMapa(): void {
        if (this.ultimaInfraGeoJson) this.actualizarFuente('infra-source', this.ultimaInfraGeoJson);
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
        if (this.farosActivos.length > 0) {
            this.renderizarFarosMapa();
        }
        if (Object.keys(this.ultimaVisibilidad).length > 0) {
            this.aplicarVisibilidadCapas(this.ultimaVisibilidad);
        }
        this.leerSessionYEnfocar(false);
    }

    private consultarGeocercas(): void {
        this._mapaService.getGeocercasKPIs().subscribe({
            next: (res: any) => {
                if (!res?.data) return;

                const features = res.data.map((item: any) => ({
                    type: 'Feature',
                    geometry: this.convertirWKT_ACirculo(item.wkt, item.radio_metros),
                    properties: {
                        nombre_faro: item.nombre_faro,
                        tipo_faro: item.tipo_faro,
                        estado_kpi: item.estado_kpi,
                        color_ui: item.color_ui,
                        total_camiones: item.total_camiones,
                        camiones_ruta: item.camiones_ruta,
                        camiones_detenidos: item.camiones_detenidos,
                        total_naves: item.total_naves,
                        naves_fondeadas: item.naves_fondeadas,
                        naves_avisadas: item.naves_avisadas,
                        naves_arribadas: item.naves_arribadas
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

    private procesarInfraestructuraWkt(puertosArray: any[]): any {
        const features: any[] = [];
        if (!Array.isArray(puertosArray)) return { type: 'FeatureCollection', features };

        puertosArray.forEach((puerto) => {
            const wktPuerto = puerto.puerto_wkt || puerto.puerto_geocerca_wkt;
            if (wktPuerto) {
                const geo = this.convertirWKT_ACirculo(wktPuerto);
                if (geo) {
                    features.push({
                        type: 'Feature',
                        geometry: geo as any,
                        properties: {
                            id: puerto.id_puerto,
                            nombre: puerto.nombre_puerto,
                            tipo: 'puerto',
                            color_ui: puerto.color_ui
                        }
                    });
                }
            }

            if (Array.isArray(puerto.terminales)) {
                puerto.terminales.forEach((terminal: any) => {
                    const muellesFeaturesTerminal: any[] = [];
                    if (Array.isArray(terminal.muelles)) {
                        terminal.muelles.forEach((muelle: any) => {
                            const wktMuelle = muelle.muelle_wkt || muelle.muelle_geocerca_wkt;
                            if (wktMuelle) {
                                const geo = parse(wktMuelle);
                                if (geo) {
                                    const muelleFeature = {
                                        type: 'Feature',
                                        geometry: geo as any,
                                        properties: {
                                            id: muelle.id_interno,
                                            nombre: muelle.nombre_muelle,
                                            tipo: 'muelle',
                                            color_ui: muelle.color_ui
                                        }
                                    };
                                    muellesFeaturesTerminal.push(muelleFeature);
                                    features.push(muelleFeature);
                                }
                            }
                        });
                    }

                    const wktTerminal = terminal.terminal_wkt || terminal.terminal_geocerca_wkt;
                    let terminalGeo = null;

                    if (wktTerminal) {
                        terminalGeo = parse(wktTerminal);
                    } else if (muellesFeaturesTerminal.length > 0) {
                        try {
                            const featureCollection = turf.featureCollection(muellesFeaturesTerminal);
                            const envolvente = turf.envelope(featureCollection);
                            const envolventeConMargen = turf.buffer(envolvente, 0.05, { units: 'kilometers' });
                            if (envolventeConMargen && envolventeConMargen.geometry) {
                                terminalGeo = envolventeConMargen.geometry;
                            }
                        } catch (e) { }
                    }

                    if (terminalGeo) {
                        features.push({
                            type: 'Feature',
                            geometry: terminalGeo as any,
                            properties: {
                                id: terminal.id_terminal,
                                nombre: terminal.nombre_terminal,
                                tipo: 'terminal',
                                autogenerada: !wktTerminal,
                                color_ui: terminal.color_ui
                            }
                        });
                    }
                });
            }
        });

        return { type: 'FeatureCollection', features };
    }

    private configurarEventosClicks(): void {
        const capasClickeables = [
            'capa-infra-fill',
            'capa-infra-point',
            'naves-individual',
            'terrestre-individual',
            'viales-individual',
            'clima-individual',
            'peajes-individual',
            'peajes-cluster-content',
            'geocerca-fill-layer'
        ];

        capasClickeables.forEach((layerId) => {
            this.map.on('click', layerId, (e) => {
                if (!e.features || e.features.length === 0) return;
                const html = this._generarContenidoPopup(layerId, e.features[0]);
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

    private inicializarCapas(): void {
        const emptyData: any = { type: 'FeatureCollection', features: [] };

        [
            'infra-source',
            'naves-source',
            'clima-source',
            'alertas-viales-source',
            'terrestre-source',
            'highlight-source',
            'peajes-source',
            'geocercas-peajes-source',
            'geocercas-kpi-source'
        ].forEach((id) => {
            if (!this.map.getSource(id)) {
                const isClusterable =
                    id === 'terrestre-source' ||
                    id === 'alertas-viales-source' ||
                    id === 'peajes-source' ||
                    id === 'naves-source';
                this.map.addSource(id, {
                    type: 'geojson',
                    data: emptyData,
                    cluster: isClusterable,
                    clusterMaxZoom: 14,
                    clusterRadius: 50
                } as any);
            }
        });

        if (!this.map.getSource('source-faros')) {
            this.map.addSource('source-faros', { type: 'geojson', data: emptyData });
        }

        if (!this.map.getSource('vias-source')) {
            this.map.addSource('vias-source', {
                type: 'geojson',
                data: this.ultimaViasGeoJson || '/assets/data/Red_Vial_20260626.geojson'
            });
        }

        const layers = [
            {
                id: 'capa-infra-fill',
                type: 'fill',
                source: 'infra-source',
                filter: ['all', ['==', '$type', 'Polygon'], ['!=', 'tipo', 'puerto']],
                paint: {
                    'fill-color': ['coalesce', ['get', 'color_ui'], '#94a3b8'],
                    'fill-opacity': 0.7
                }
            },
            {
                id: 'capa-infra-line',
                type: 'line',
                source: 'infra-source',
                filter: ['all', ['==', '$type', 'Polygon'], ['!=', 'tipo', 'puerto']],
                paint: {
                    'line-color': ['coalesce', ['get', 'color_ui'], '#475569'],
                    'line-width': 1.5
                }
            },
            {
                id: 'puerto-fill',
                type: 'fill',
                source: 'infra-source',
                filter: ['all', ['==', '$type', 'Polygon'], ['==', 'tipo', 'puerto']],
                paint: {
                    'fill-color': ['coalesce', ['get', 'color_ui'], !this.isDark ? '#60a5fa' : '#3b82f6'],
                    'fill-opacity': 0.15
                }
            },
            {
                id: 'puerto-line',
                type: 'line',
                source: 'infra-source',
                filter: ['all', ['==', '$type', 'Polygon'], ['==', 'tipo', 'puerto']],
                paint: {
                    'line-color': ['coalesce', ['get', 'color_ui'], !this.isDark ? '#699dd8' : '#567cf7'],
                    'line-width': 2.5,
                    'line-dasharray': [4, 2]
                }
            },
            {
                id: 'vias-layer',
                type: 'line',
                source: 'vias-source',
                layout: { 'line-cap': 'round', 'line-join': 'round', visibility: 'visible' },
                paint: {
                    'line-color': !this.isDark ? '#5d85be' : '#64748b',
                    'line-width': 1.8,
                    'line-opacity': 0.75
                }
            },
            {
                id: 'geocercas-layer',
                type: 'fill',
                source: 'geocercas-peajes-source',
                paint: {
                    'fill-color': ['coalesce', ['get', 'color_ui'], '#eab308'],
                    'fill-opacity': 0.15
                }
            },
            {
                id: 'geocercas-line-layer',
                type: 'line',
                source: 'geocercas-peajes-source',
                paint: {
                    'line-color': ['coalesce', ['get', 'color_ui'], '#ca8a04'],
                    'line-width': 1,
                    'line-dasharray': [4, 4]
                }
            },
            {
                id: 'geocerca-fill-layer',
                type: 'fill',
                source: 'geocercas-kpi-source',
                paint: {
                    'fill-color': ['coalesce', ['get', 'color_ui'], '#94a3b8'],
                    'fill-opacity': 0.3
                }
            },
            {
                id: 'geocerca-line-layer',
                type: 'line',
                source: 'geocercas-kpi-source',
                paint: {
                    'line-color': ['coalesce', ['get', 'color_ui'], '#3b82f6'],
                    'line-width': 2,
                    'line-dasharray': [4, 2]
                }
            },
            {
                id: 'layer-faros-fill',
                type: 'fill',
                source: 'source-faros',
                paint: {
                    'fill-color': ['coalesce', ['get', 'color_ui'], '#00E5FF'],
                    'fill-opacity': 0.25
                }
            },
            {
                id: 'layer-faros-line',
                type: 'line',
                source: 'source-faros',
                paint: {
                    'line-color': ['coalesce', ['get', 'color_ui'], '#00E5FF'],
                    'line-width': 2,
                    'line-dasharray': [3, 3]
                }
            },
            {
                id: 'highlight-layer',
                type: 'line',
                source: 'highlight-source',
                paint: {
                    'line-color': this.isDark ? '#f59e0b' : '#c2410c',
                    'line-width': 4,
                    'line-opacity': 0.9,
                    'line-dasharray': [2, 2]
                },
                layout: { 'line-cap': 'round', 'line-join': 'round' }
            },
            {
                id: 'capa-infra-point',
                type: 'circle',
                source: 'infra-source',
                filter: ['==', '$type', 'Point'],
                paint: {
                    'circle-radius': 8,
                    'circle-stroke-width': 2,
                    'circle-stroke-color': '#ffffff',
                    'circle-color': [
                        'match',
                        ['get', 'estado_operativo'],
                        'libre',
                        '#22c55e',
                        'ocupado',
                        '#facc15',
                        'congestionado',
                        '#f59e0b',
                        'critico',
                        '#dc2626',
                        'desocupado',
                        '#94a3b8',
                        '#38bdf8'
                    ]
                }
            },
            {
                id: 'terrestre-cluster-circle',
                type: 'circle',
                source: 'terrestre-source',
                filter: ['has', 'point_count'],
                paint: {
                    'circle-color': ['step', ['get', 'point_count'], '#2563eb', 20, '#f59e0b', 50, '#ef4444'],
                    'circle-radius': 24,
                    'circle-stroke-width': 2,
                    'circle-stroke-color': '#000000'
                }
            },
            {
                id: 'terrestre-cluster-content',
                type: 'symbol',
                source: 'terrestre-source',
                filter: ['has', 'point_count'],
                layout: {
                    'icon-image': 'icono-camion-frente',
                    'icon-size': 0.05,
                    'icon-offset': [0, -10],
                    'text-field': '{point_count_abbreviated}',
                    'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
                    'text-size': 12,
                    'text-offset': [0, 0.8],
                    'icon-allow-overlap': true,
                    'text-allow-overlap': true
                },
                paint: { 'text-color': '#ffffff' }
            },
            {
                id: 'terrestre-individual',
                type: 'symbol',
                source: 'terrestre-source',
                filter: ['!', ['has', 'point_count']],
                layout: {
                    'icon-image': 'icono-camion',
                    'icon-size': ['case', ['>', ['get', 'velocidad'], 0], 0.05, 0.07],
                    'icon-allow-overlap': true,
                    'icon-rotate': ['coalesce', ['get', 'rumbo'], 0],
                    'icon-rotation-alignment': 'map'
                }
            },
            {
                id: 'peajes-cluster-circle',
                type: 'circle',
                source: 'peajes-source',
                filter: ['has', 'point_count'],
                paint: {
                    'circle-color': ['step', ['get', 'point_count'], '#10b981', 4, '#059669', 8, '#047857'],
                    'circle-radius': 22,
                    'circle-stroke-width': 2,
                    'circle-stroke-color': '#000000'
                }
            },
            {
                id: 'peajes-cluster-content',
                type: 'symbol',
                source: 'peajes-source',
                filter: ['has', 'point_count'],
                layout: {
                    'icon-image': 'peaje-cluster',
                    'icon-size': 0.08,
                    'icon-offset': [0, -100],
                    'text-field': '{point_count_abbreviated}',
                    'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
                    'text-size': 13,
                    'text-offset': [0, 0.7],
                    'icon-allow-overlap': true,
                    'text-allow-overlap': true
                },
                paint: { 'text-color': '#ffffff' }
            },
            {
                id: 'peajes-individual',
                type: 'symbol',
                source: 'peajes-source',
                filter: ['!', ['has', 'point_count']],
                layout: { 'icon-image': 'icono-peaje', 'icon-size': 0.05, 'icon-allow-overlap': true }
            },
            {
                id: 'viales-cluster-circle',
                type: 'circle',
                source: 'alertas-viales-source',
                filter: ['has', 'point_count'],
                paint: {
                    'circle-color': ['step', ['get', 'point_count'], '#eab308', 4, '#f97316', 8, '#dc2626'],
                    'circle-radius': 22,
                    'circle-stroke-width': 2,
                    'circle-stroke-color': '#000000'
                }
            },
            {
                id: 'viales-cluster-content',
                type: 'symbol',
                source: 'alertas-viales-source',
                filter: ['has', 'point_count'],
                layout: {
                    'icon-image': 'accidente-cluster',
                    'icon-size': 0.05,
                    'icon-offset': [0, -85],
                    'text-field': '{point_count_abbreviated}',
                    'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
                    'text-size': 13,
                    'text-offset': [0, 1.1],
                    'icon-allow-overlap': true,
                    'text-allow-overlap': true
                },
                paint: { 'text-color': '#ffffff', 'text-halo-color': '#000000', 'text-halo-width': 1 }
            },
            {
                id: 'viales-individual',
                type: 'symbol',
                source: 'alertas-viales-source',
                filter: ['!', ['has', 'point_count']],
                layout: {
                    'icon-image': [
                        'match',
                        ['get', 'tipoEvento'],
                        'ACCIDENTE',
                        'icono-accidente',
                        'VEHICULO_AVERIDADO',
                        'icono-accidente',
                        'MANTENIMIENTO_OBRA',
                        'icono-obra',
                        'CIERRE_VIAL',
                        'icono-obra',
                        'CONGESTION',
                        'icono-obra',
                        'icono-accidente'
                    ],
                    'icon-size': 0.1,
                    'icon-allow-overlap': true,
                    'icon-ignore-placement': true
                }
            },
            {
                id: 'naves-cluster-symbol',
                type: 'symbol',
                source: 'naves-source',
                filter: ['has', 'point_count'],
                layout: {
                    'icon-image': 'icono-barco',
                    'icon-size': 0.07,
                    'icon-allow-overlap': true,
                    'text-field': '{point_count}',
                    'text-size': 12,
                    'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
                    'text-allow-overlap': true,
                    'text-offset': [0, 1.2]
                },
                paint: { 'text-color': '#ffffff', 'text-halo-color': '#0f172a', 'text-halo-width': 2 }
            },
            {
                id: 'naves-individual',
                type: 'symbol',
                source: 'naves-source',
                filter: ['!', ['has', 'point_count']],
                layout: {
                    'icon-image': 'icono-barco',
                    'icon-size': 0.06,
                    'icon-allow-overlap': true,
                    'icon-rotate': ['coalesce', ['get', 'rumbo'], 0],
                    'icon-rotation-alignment': 'map'
                }
            },
            {
                id: 'naves-nombres',
                type: 'symbol',
                source: 'naves-source',
                filter: ['!', ['has', 'point_count']],
                layout: {
                    'text-field': ['get', 'nombre_motonave'],
                    'text-size': 11,
                    'text-offset': [0, 2],
                    'text-anchor': 'top'
                },
                paint: { 'text-color': '#ffffff', 'text-halo-color': '#020617', 'text-halo-width': 2 }
            },
            {
                id: 'clima-cluster-symbol',
                type: 'symbol',
                source: 'clima-source',
                filter: ['has', 'point_count'],
                layout: {
                    'icon-image': 'clima-defecto',
                    'icon-size': 0.04,
                    'icon-allow-overlap': true,
                    'text-field': '{point_count}',
                    'text-size': 12,
                    'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
                    'text-allow-overlap': true,
                    'text-offset': [0, 1.2]
                },
                paint: { 'text-color': '#ffffff', 'text-halo-color': '#0f172a', 'text-halo-width': 2 }
            },
            {
                id: 'clima-individual',
                type: 'symbol',
                source: 'clima-source',
                filter: ['!', ['has', 'point_count']],
                layout: {
                    'icon-image': [
                        'match',
                        ['get', 'fenomeno'],
                        'Lluvia',
                        'clima-lluvia',
                        'Precipitaciones',
                        'clima-lluvia',
                        'Tormenta Electrica',
                        'clima-tormenta',
                        'Vientos Fuertes',
                        'clima-viento',
                        'Vendaval',
                        'clima-viento',
                        'Incendio Forestal',
                        'clima-incendio',
                        'clima-defecto'
                    ],
                    'icon-size': 0.04,
                    'icon-allow-overlap': true
                }
            }
        ];

        layers.forEach((l) => {
            try {
                if (this.map.getLayer(l.id)) this.map.removeLayer(l.id);
                this.map.addLayer(l as any);
            } catch (e) {
                console.error('Error cargando capa:', l.id, e);
            }
        });
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
        if (!this.map || !this.map.isStyleLoaded()) return;

        const isInfraVisible = vis['infra'] !== false;
        const isNavesVisible = vis['naves'] !== false;
        const isTerrestreVisible = vis['terrestre'] !== false;
        const isViasVisible = vis['vias'] !== false;
        const isClimaVisible = vis['clima'] !== false;
        const isAccidentesVisible = vis['accidentes'] !== false;
        const isPeajesVisible = vis['peajes'] !== false;

        const mapping = [
            { id: 'vias-layer', visible: isViasVisible },
            { id: 'naves-cluster-symbol', visible: isNavesVisible },
            { id: 'naves-individual', visible: isNavesVisible },
            { id: 'naves-nombres', visible: isNavesVisible },
            { id: 'capa-infra-fill', visible: isInfraVisible },
            { id: 'capa-infra-line', visible: isInfraVisible },
            { id: 'capa-infra-point', visible: isInfraVisible },
            { id: 'puerto-fill', visible: isInfraVisible },
            { id: 'puerto-line', visible: isInfraVisible },
            { id: 'terrestre-cluster-circle', visible: isTerrestreVisible },
            { id: 'terrestre-cluster-content', visible: isTerrestreVisible },
            { id: 'terrestre-individual', visible: isTerrestreVisible },
            { id: 'clima-cluster-symbol', visible: isClimaVisible },
            { id: 'clima-individual', visible: isClimaVisible },
            { id: 'viales-cluster-circle', visible: isAccidentesVisible },
            { id: 'viales-cluster-content', visible: isAccidentesVisible },
            { id: 'viales-individual', visible: isAccidentesVisible },
            { id: 'peajes-cluster-circle', visible: isPeajesVisible },
            { id: 'peajes-cluster-content', visible: isPeajesVisible },
            { id: 'peajes-individual', visible: isPeajesVisible },
            { id: 'geocercas-layer', visible: isPeajesVisible },
            { id: 'geocercas-line-layer', visible: isPeajesVisible }
        ];

        mapping.forEach((m) => {
            if (this.map.getLayer(m.id)) {
                this.map.setLayoutProperty(m.id, 'visibility', m.visible ? 'visible' : 'none');
            }
        });
    }

    private iniciarRadarGeocercas(): void {
        if (this.geocercasSubscription) this.geocercasSubscription.unsubscribe();
        this.consultarGeocercas();
        this.geocercasSubscription = interval(30000).subscribe(() => {
            this.consultarGeocercas();
        });
    }

    private _generarContenidoPopup(layerId: string, feature: any): string {
        const data = feature.properties || {};

        switch (layerId) {
            case 'capa-infra-fill':
            case 'capa-infra-point':
                return `<div class="custom-map-popup infra"><h3>${data.nombre || 'Sin nombre'}</h3><p><strong>Tipo:</strong> ${data.tipo ? data.tipo.toUpperCase() : 'N/A'
                    }</p></div>`;

            case 'naves-individual': {
                const estadoNave = data.estado_nave || 'EN TRÁNSITO';
                const omi = data.omi || 'N/A';
                const bandera = data.bandera || 'Desconocida';
                const eta = data.eta ? new Date(data.eta).toLocaleString('es-CO') : 'No Registrada';
                const agencia = data.agencia || 'N/A';
                const velocidadnv =
                    data.velocidad !== undefined && data.velocidad !== null ? `${data.velocidad} nudos` : 'N/A';
                const rumbo = data.rumbo !== undefined && data.rumbo !== null ? `${data.rumbo}°` : 'N/A';
                const tipoNave = data.tipo_nave || 'N/A';
                const terminal = data.instalacion_portuaria || 'N/A';
                const eslora = data.eslora || 'N/A';
                const calado = data.calado ? `${data.calado}m` : 'N/A';

                let badgeColor = '#64748b';
                if (estadoNave === 'AVISADAS') badgeColor = '#a855f7';
                if (estadoNave === 'FONDEADAS') badgeColor = '#facc15';
                if (estadoNave === 'ARRIBADAS') badgeColor = '#22c55e';

                return `
                <div class="custom-map-popup nave-popup" style="min-width: 260px; font-family: sans-serif;">
                    <div class="PORTTOS-popup-header" style="border-bottom: 2px solid #00E5FF; padding-bottom: 8px; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: flex-start;">
                        <div style="flex: 1; min-width: 0; padding-right: 8px;">
                            <h3 style="color: ${this.isDark ? '#38bdf8' : '#0056b3'}; margin:0; font-size: 10px; font-weight: 600; line-height: 1.4; word-wrap: break-word;">
                                🚢 ${data.nombre_motonave || 'DESCONOCIDA'}
                            </h3>
                        </div>
                        <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 4px; flex-shrink: 0;">
                            <span style="background-color: #334155; color: #fff; padding: 2px 6px; border-radius: 4px; font-size: 9px; font-weight: bold; white-space: nowrap;">
                                MMSI: ${data.mmsi || 'N/A'}
                            </span>
                            <span style="background-color: ${badgeColor}; color: ${estadoNave === 'FONDEADAS' ? '#000' : '#fff'
                    }; padding: 2px 6px; border-radius: 4px; font-size: 9px; font-weight: bold; white-space: nowrap;">
                                ${estadoNave}
                            </span>
                        </div>
                    </div>
                    <div class="PORTTOS-popup-body" style="font-size: 12px; line-height: 1.5; color: ${this.isDark ? '#e2e8f0' : '#334155'
                    };">
                        <b>OMI:</b> ${omi}<br>
                        <b>Tipo:</b> ${tipoNave}<br>
                        <b>Bandera:</b> ${bandera}<br>
                        <b>Agencia:</b> ${agencia}<br>
                        <hr style="margin: 4px 0; border: 0.5px dashed #ccc;">
                        <b>Velocidad:</b> ${velocidadnv} | <b>Rumbo:</b> ${rumbo}<br>
                        <b>Dimensiones:</b> Eslora ${eslora}m | Calado ${calado}<br>
                        <b>Instalación:</b> ${terminal}<br>
                        <b>ETA:</b> <span style="color: #d9534f; font-weight: bold;">${eta}</span>
                    </div>
                </div>`;
            }

            case 'geocerca-fill-layer': {
                const colorKpi =
                    data.estado_kpi === 'ROJO' ? '#dc2626' : data.estado_kpi === 'AMARILLO' ? '#facc15' : '#22c55e';
                const textoColor = data.estado_kpi === 'AMARILLO' ? '#000' : '#fff';

                const htmlTerrestre =
                    data.total_camiones > 0 || data.tipo_faro !== 'MARITIMA'
                        ? `
                    <div style="margin-top: 8px; border-top: 1px solid #334155; padding-top: 8px;">
                        <div style="margin-bottom: 4px;"><strong>🚛 Terrestre en zona:</strong> ${data.total_camiones}</div>
                        <div style="margin-bottom: 4px; color: #22c55e; font-size: 11px;">&nbsp;↳ En movimiento: ${data.camiones_ruta}</div>
                        <div style="margin-bottom: 4px; color: #ef4444; font-size: 11px;">&nbsp;↳ Detenidos/Filas: ${data.camiones_detenidos}</div>
                    </div>
                `
                        : '';

                const navesClasificadas = data.naves_fondeadas + data.naves_avisadas + data.naves_arribadas;
                const navesTransito = data.total_naves - navesClasificadas;

                const htmlMaritimo =
                    data.total_naves > 0 || data.tipo_faro === 'MARITIMA'
                        ? `
                    <div style="margin-top: 8px; border-top: 1px solid #334155; padding-top: 8px;">
                        <div style="margin-bottom: 4px; color: #06b6d4;"><strong>🚢 Naves en zona:</strong> ${data.total_naves}</div>
                        <div style="margin-bottom: 4px; color: #facc15; font-size: 11px;">&nbsp;↳ Fondeadas (Espera): ${data.naves_fondeadas}</div>
                        <div style="margin-bottom: 4px; color: #a855f7; font-size: 11px;">&nbsp;↳ Avisadas (Aprox): ${data.naves_avisadas}</div>
                        <div style="margin-bottom: 4px; color: #22c55e; font-size: 11px;">&nbsp;↳ Arribadas (Muelle): ${data.naves_arribadas}</div>
                        <div style="margin-bottom: 4px; color: #94a3b8; font-size: 11px;">&nbsp;↳ Tránsito / Sin match: ${navesTransito}</div>
                    </div>
                `
                        : '';

                return `
                    <div class="custom-map-popup kpi" style="min-width: 230px;">
                        <div class="PORTTOS-popup-header" style="border-bottom: 2px solid ${colorKpi}; padding-bottom: 8px;">
                            <h3 style="color:${colorKpi}; margin:0; font-size: 15px;">📍 ${data.nombre_faro}</h3>
                            <span class="PORTTOS-badge" style="background-color:${colorKpi}; color: ${textoColor}; border-radius: 4px; padding: 2px 6px; font-size: 10px; font-weight: bold; margin-top: 5px; display: inline-block;">
                                ESTADO ${data.estado_kpi}
                            </span>
                        </div>
                        <div class="PORTTOS-popup-body" style="font-size: 13px;">
                            ${htmlTerrestre}
                            ${htmlMaritimo}
                        </div>
                    </div>
                `;
            }

            case 'viales-individual': {
                const tipo = data.tipoEvento ? data.tipoEvento.replace(/_/g, ' ') : 'ALERTA VIAL';
                const sev = parseInt(data.nivelSeveridad, 10);

                let sevBadgeClass = 'success';
                let sevText = '🟢 BAJA';
                if (sev >= 3) {
                    sevBadgeClass = 'danger';
                    sevText = '🔴 ALTA';
                } else if (sev === 2) {
                    sevBadgeClass = 'warning';
                    sevText = '🟠 MEDIA';
                }

                let fechaVial = 'Fecha desconocida';
                if (data.fechaInicio) {
                    fechaVial = new Date(data.fechaInicio).toLocaleString('es-CO', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    });
                }

                let htmlVial = `
                    <div class="PORTTOS-popup-header">
                        <h3>🚨 ${tipo}</h3>
                        <span class="PORTTOS-badge ${sevBadgeClass}">${sevText}</span>
                    </div>
                    <div class="PORTTOS-popup-body">
                        <div class="PORTTOS-col">
                            <span class="PORTTOS-label">📍 Corredor:</span>
                            <span class="PORTTOS-value">${data.corredor || data.corredorVial || 'No especificado'}</span>
                        </div>
                        <div class="PORTTOS-col">
                            <span class="PORTTOS-label">🛣️ Sector:</span>
                            <span class="PORTTOS-value">${data.sector || 'No especificado'}</span>
                        </div>
                        <div class="PORTTOS-col">
                            <span class="PORTTOS-label">🕒 Reportado:</span>
                            <span class="PORTTOS-value">${fechaVial}</span>
                        </div>
                        <div class="PORTTOS-divider" style="color: #e2e8f0; font-size: 11px; max-height: 80px; overflow-y: auto;">
                            ${data.descripcion || 'Sin descripción detallada.'}
                        </div>
                `;

                if (data.afectaPeaje === true || data.afectaPeaje === 'true') {
                    htmlVial += `<div class="PORTTOS-alert-box">⚠️ CRÍTICO: Cerca a ${data.peajeAfectado}</div>`;
                }
                return htmlVial + `</div>`;
            }

            case 'terrestre-individual': {
                const placa = data.placa || 'SIN PLACA';
                const conductor = data.conductor || 'No asignado';
                const velocidad = data.velocidad !== undefined ? data.velocidad : 0;
                const estadoCrudo = data.estado_camion || data.estado || 'DESCONOCIDO';
                const estadoCamion = estadoCrudo.replace(/_/g, ' ').toUpperCase();

                let estadoBadgeClass = 'warning';
                let estadoText = `🟡 ${estadoCamion}`;

                if (estadoCamion.includes('RUTA')) {
                    estadoBadgeClass = 'success';
                    estadoText = '🟢 EN RUTA';
                } else if (estadoCamion.includes('TRAFICO') || estadoCamion.includes('TRÁFICO')) {
                    estadoBadgeClass = 'danger';
                    estadoText = '🟠 TRÁFICO';
                } else if (estadoCamion.includes('DETENIDO')) {
                    estadoBadgeClass = 'danger';
                    estadoText = '🔴 DETENIDO';
                } else if (estadoCamion.includes('DESCARGANDO')) {
                    estadoBadgeClass = 'info';
                    estadoText = '🔵 DESCARGANDO';
                }

                return `
                    <div class="PORTTOS-popup-header">
                        <h3>🚛 ${placa}</h3>
                        <span class="PORTTOS-badge ${estadoBadgeClass}">${estadoText}</span>
                    </div>
                    <div class="PORTTOS-popup-body">
                        <div class="PORTTOS-row">
                            <span class="PORTTOS-label">👨‍✈️ Conductor:</span>
                            <span class="PORTTOS-value">${conductor}</span>
                        </div>
                        <div class="PORTTOS-row">
                            <span class="PORTTOS-label">💨 Velocidad:</span>
                            <span class="PORTTOS-value" style="color: ${velocidad > 0 ? '#38bdf8' : '#f1f5f9'};">${velocidad} km/h</span>
                        </div>
                        <div class="PORTTOS-row">
                            <span class="PORTTOS-label">🚚 Tipo:</span>
                            <span class="PORTTOS-value">${data.tipo_camion || 'Furgón'}</span>
                        </div>
                    </div>
                `;
            }

            case 'peajes-individual': {
                const nombrePeaje = data.nombre || 'Punto de Control';
                let totalCamiones = 0;
                let incidentesCercanos = 0;
                let tieneIncidenteCritico = false;

                try {
                    if (feature.geometry && feature.geometry.coordinates) {
                        const centroPeaje = turf.point(feature.geometry.coordinates);
                        const areaInfluencia = turf.buffer(centroPeaje, 2, { units: 'kilometers' });

                        if (areaInfluencia) {
                            if (this.ultimaFlotaGeoJson && this.ultimaFlotaGeoJson.features) {
                                this.ultimaFlotaGeoJson.features.forEach((camion: any) => {
                                    if (camion.geometry && camion.geometry.coordinates) {
                                        if (
                                            turf.booleanPointInPolygon(
                                                turf.point(camion.geometry.coordinates),
                                                areaInfluencia as any
                                            )
                                        ) {
                                            totalCamiones++;
                                        }
                                    }
                                });
                            }

                            if (this.ultimosIncidentes && this.ultimosIncidentes.features) {
                                this.ultimosIncidentes.features.forEach((inc: any) => {
                                    if (inc.geometry && inc.geometry.coordinates) {
                                        if (
                                            turf.booleanPointInPolygon(
                                                turf.point(inc.geometry.coordinates),
                                                areaInfluencia as any
                                            )
                                        ) {
                                            incidentesCercanos++;
                                            if (inc.properties.nivelSeveridad >= 3) {
                                                tieneIncidenteCritico = true;
                                            }
                                        }
                                    }
                                });
                            }
                        }
                    }
                } catch (e) { }

                let estadoKpiP = 'VERDE';
                let colorHexP = '#22c55e';
                let estadoTextoP = 'Flujo Normal';

                if (tieneIncidenteCritico || totalCamiones >= 20) {
                    estadoKpiP = 'ROJO';
                    colorHexP = '#dc2626';
                    estadoTextoP = 'Crítico / Congestión';
                } else if (incidentesCercanos > 0 || totalCamiones >= 5) {
                    estadoKpiP = 'AMARILLO';
                    colorHexP = '#facc15';
                    estadoTextoP = 'Tráfico Denso';
                }

                return `
                    <div class="custom-map-popup kpi" style="min-width: 200px;">
                        <div class="PORTTOS-popup-header" style="border-bottom: 2px solid ${colorHexP}; padding-bottom: 8px; margin-bottom: 8px;">
                            <h3 style="color:${colorHexP}; margin:0; font-size: 15px;">🏢 ${nombrePeaje}</h3>
                            <span class="PORTTOS-badge" style="background-color:${colorHexP}; color: ${estadoKpiP === 'AMARILLO' ? '#000' : '#fff'
                    }; border-radius: 4px; padding: 2px 6px; font-size: 10px; font-weight: bold; margin-top: 5px; display: inline-block;">
                                ESTADO ${estadoKpiP}
                            </span>
                        </div>
                        <div class="PORTTOS-popup-body" style="font-size: 13px;">
                            <div style="margin-bottom: 4px;"><strong>🚦 Operación:</strong> ${estadoTextoP}</div>
                            <div style="margin-bottom: 4px;"><strong>🚛 Camiones en zona (2km):</strong> ${totalCamiones}</div>
                            <div style="margin-bottom: 4px;"><strong>⚠️ Incidentes cercanos:</strong> ${incidentesCercanos}</div>
                        </div>
                    </div>
                `;
            }

            case 'clima-individual': {
                const fenomenoStr = data.fenomeno || 'Alerta Climática';
                const nivelAlertaStr = data.nivel || 'N/A';
                const dptoStr = data.departamento || 'No especificado';
                const munStr = data.municipio || 'No especificado';
                const detalleClima = data.descripcion || data.description || 'Sin descripción detallada.';
                const colorClima = '#8b5cf6';

                return `
                    <div class="custom-map-popup" style="padding: 16px; min-width: 260px;">
                        <div class="qplus-popup-header" style="border-bottom: 2px solid ${colorClima}; padding-bottom: 12px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center;">
                            <h3 style="color: ${this.isDark ? '#f8fafc' : '#1e293b'}; margin:0; font-size: 14px; font-weight: bold; flex: 1; padding-right: 10px; line-height: 1.2;">
                                ☁️ ${fenomenoStr.toUpperCase()}
                            </h3>
                            <span class="qplus-badge" style="background-color: ${colorClima}; color: #ffffff; border-radius: 4px; padding: 4px 8px; font-size: 10px; font-weight: bold; flex-shrink: 0; text-align: center;">
                                NIVEL ${nivelAlertaStr.toUpperCase()}
                            </span>
                        </div>
                        <div class="qplus-popup-body" style="font-size: 13px; color: ${this.isDark ? '#cbd5e1' : '#64748b'
                    };">
                            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                                <span>📍 Ubicación:</span>
                                <span style="font-weight: 600; color: ${this.isDark ? '#f8fafc' : '#0f172a'
                    }; text-align: right;">
                                    ${munStr}, ${dptoStr}
                                </span>
                            </div>
                            <div style="margin-top: 10px; border-top: 1px solid #334155; padding-top: 10px; font-style: italic; text-transform: capitalize; color: ${this.isDark ? '#94a3b8' : '#475569'
                    };">
                                ${detalleClima}
                            </div>
                        </div>
                    </div>
                `;
            }

            default:
                return `<div class="custom-map-popup"><h3>Información</h3></div>`;
        }
    }

    private renderizarNavesFusionadas(): void {
        const features = Array.from(this.navesActuales.values());
        this.actualizarFuente('naves-source', { type: 'FeatureCollection', features });
    }

    private actualizarFuente(sourceId: string, data: any): void {
        if (!this.map || !this.map.getSource(sourceId)) return;
        (this.map.getSource(sourceId) as any).setData(data);
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

    public toggleCapaMenu(capaId: string, event: any): void {
        const estado = event.target.checked;
        this._mapaService.actualizarVisibilidadCapa(capaId, estado);
    }

    public toggleMapaBase(): void {
        const nuevoEstilo = this.estiloBase === 'satelite' ? 'outdoor' : 'satelite';
        this.cambiarEstiloBase(nuevoEstilo);
    }
}
