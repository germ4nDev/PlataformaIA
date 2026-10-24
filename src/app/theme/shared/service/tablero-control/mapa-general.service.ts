import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, Subscription, shareReplay, map, tap } from 'rxjs';
import { environment } from 'src/environments/environment';
import { VISIBILIDAD_INICIAL } from 'src/app/porttos/widgets/panel-mapa/mapa-logistico/mapa-capas';
import { SocketService } from '../sockets.service';

/** Aviso del API cuando un evento vial aparece o se despeja (sala puerto:{P}:mapa). */
const EVENTO_CAMBIO_VIALES = 'eventos-viales-cambio';

/** Origen de la capa de eventos viales (ciclo de vida, 2026-10-26). */
export interface OrigenEventosViales {
    fuente: string | null;
    esRespaldo: boolean;
    periodo: string | null;
    generadoEn: string;
    nota: string | null;
    ultimaSincronizacion: string | null;
    zonasFallidas: string[];
}

const base_url = environment.apiUrl;

@Injectable({
    providedIn: 'root'
})
export class MapaGeneralService {

    // ==========================================================
    // 1. ESTADO DE DATOS (Las tuberías de información)
    // 🟢 Agregamos pipe(shareReplay(1)) para que los widgets
    // reciban el último dato válido instantáneamente al suscribirse.
    // ==========================================================
    private navesSubject = new BehaviorSubject<any>(null);
    public naves$ = this.navesSubject.asObservable().pipe(shareReplay(1));

    private infraSubject = new BehaviorSubject<any>(null);
    public infra$ = this.infraSubject.asObservable().pipe(shareReplay(1));

    private terrestreSubject = new BehaviorSubject<any>(null);
    public terrestre$ = this.terrestreSubject.asObservable().pipe(shareReplay(1));

    private climaSubject = new BehaviorSubject<any>(null);
    public clima$ = this.climaSubject.asObservable().pipe(shareReplay(1));

    private viasSubject = new BehaviorSubject<any>(null);
    public vias$ = this.viasSubject.asObservable().pipe(shareReplay(1));

    private gemeloDigitalSubject = new BehaviorSubject<any>(null);
    public gemeloDigital$ = this.gemeloDigitalSubject.asObservable().pipe(shareReplay(1));

    private puertoSeleccionadoSubject = new BehaviorSubject<any>(null);
    public puertoSeleccionado$ = this.puertoSeleccionadoSubject.asObservable().pipe(shareReplay(1));

    private accidentesSubject = new BehaviorSubject<any>(null);
    public accidentes$: Observable<any> = this.accidentesSubject.asObservable().pipe(shareReplay(1));

    /** Origen de los eventos viales: última sincronización con TomTom y zonas que fallaron. */
    private origenVialesSubject = new BehaviorSubject<OrigenEventosViales | null>(null);
    public origenViales$: Observable<OrigenEventosViales | null> = this.origenVialesSubject.asObservable();
    private cambiosVialesSub: Subscription | null = null;

    // ==========================================================
    // 2. ESTADO DE VISIBILIDAD
    // ==========================================================
    // Estado de cada entrada del menú de capas (catálogo único en mapa-logistico/mapa-capas.ts)
    private visibilidadState: { [key: string]: boolean } = { ...VISIBILIDAD_INICIAL };

    public visibilidad$ = new BehaviorSubject<{ [key: string]: boolean }>(this.visibilidadState);
    private datosCargados = false;

    // ==========================================================
    // FILTRO DE PUERTO (agregado 2026-10-18)
    // Naves, flota, geocercas e incidentes se piden solo para el puerto del filtro del tablero
    // (?puerto=). Infraestructura y clima siguen siendo nacionales: dan el contexto del país.
    // ==========================================================
    private puertoActual: string | null = null;

    public get puertoFiltro(): string | null {
        return this.puertoActual;
    }

    /** Devuelve true si el puerto cambió (el mapa debe limpiar y recargar sus capas por puerto). */
    public establecerPuerto(puerto: string | null | undefined): boolean {
        const limpio = (puerto || '').toString().trim().toUpperCase();
        const nuevo = !limpio || limpio === 'ALL' ? null : limpio;
        if (nuevo === this.puertoActual) return false;
        this.puertoActual = nuevo;
        return true;
    }

    private paramsPuerto(extra: { [k: string]: string } = {}): HttpParams {
        let params = new HttpParams({ fromObject: extra });
        if (this.puertoActual) params = params.set('puerto', this.puertoActual);
        return params;
    }

    /** Recarga solo las capas que dependen del puerto. */
    public recargarCapasDelPuerto(): void {
        if (!this.datosCargados) return; // la carga inicial ya usará el puerto nuevo
        this.getCapaNaves().subscribe();
        this.cargarEventosVialesActivos();
        this.cargarFlotaTerrestreGPS();
    }

    constructor(private http: HttpClient, private _socketService: SocketService) { }

    // ==========================================================
    // 3. EL MOTOR DE ARRANQUE
    // ==========================================================
    public cargarDatosIniciales(): void {
        // 🟢 Solo cargamos si los datos no existen.
        // Si el mapa se recarga, no vuelve a pedir todo al backend innecesariamente.
        if (this.datosCargados) return;

        this.getCapaInfraestructura().subscribe();
        this.getCapaClima().subscribe();
        this.getCapaNaves().subscribe();
        this.cargarEventosVialesActivos();
        this.escucharCambiosEventosViales();

        // 🟢 NUEVO: Carga de flota GPS integrada (Reemplaza la antigua capa estática)
        this.cargarFlotaTerrestreGPS();

        console.log('🚀 [MapaGeneralService] Iniciando carga de datos...');
        this.datosCargados = true;
    }

    // ==========================================================
    // 4. MÉTODOS DE SERVICIOS API
    // ==========================================================
    public getCapaInfraestructura(): Observable<any> {
        return this.http.get<any>(`${base_url}/mapa-general/infraestructura`).pipe(
            tap(resp => {
                if (resp.success && resp.CAPA_INFRAESTRUCTURA) {
                    this.infraSubject.next(resp.CAPA_INFRAESTRUCTURA);
                    this.actualizarGemelo('CAPA_INFRAESTRUCTURA', resp.CAPA_INFRAESTRUCTURA);
                }
            })
        );
    }

    // Nota: Mantenemos este método por compatibilidad con tu código antiguo,
    // pero la flota real la está manejando getFlotaGeoJSON()
    public getCapaTerrestre(): Observable<any> {
        return this.http.get<any>(`${base_url}/mapa-general/terrestre`).pipe(
            tap(resp => {
                if (resp.success && resp.CAPA_TERRESTRE) {
                    // Solo actualizamos si no choca con el GPS en vivo
                    if (!this.terrestreSubject.getValue()) {
                        this.terrestreSubject.next(resp.CAPA_TERRESTRE);
                        this.actualizarGemelo('CAPA_TERRESTRE_ESTATICA', resp.CAPA_TERRESTRE);
                    }
                }
            })
        );
    }

    public getCapaClima(): Observable<any> {
        return this.http.get<any>(`${base_url}/mapa-general/clima`).pipe(
            tap(resp => {
                if (resp.success && resp.CAPA_CLIMA) {
                    this.climaSubject.next(resp.CAPA_CLIMA);
                    this.actualizarGemelo('CAPA_CLIMA', resp.CAPA_CLIMA);
                }
            })
        );
    }

    public getCapaNaves(): Observable<any> {
        return this.http.get<any>(`${base_url}/mapa-general/naves`, { params: this.paramsPuerto() }).pipe(
            tap(resp => {
                if (resp.success && resp.data) {
                    this.navesSubject.next(resp.data);
                    this.actualizarGemelo('CAPA_NAVES', resp.data);
                }
            })
        );
    }

    // ==========================================================
    // 5. ACTUALIZADOR INTELIGENTE DEL GEMELO DIGITAL
    // ==========================================================
    private actualizarGemelo(key: string, data: any) {
        const currentData = this.gemeloDigitalSubject.getValue() || {};
        // 🟢 PREVENCIÓN: Solo actualizamos si realmente hay datos nuevos
        if (data) {
            this.gemeloDigitalSubject.next({
                ...currentData,
                [key]: data
            });
        }
    }

    // ==========================================================
    // 6. CONTROLADORES DE ESTADO Y UPDATERS
    // ==========================================================
    public actualizarVisibilidadCapa(capaId: string, visible: boolean): void {
        this.visibilidadState = { ...this.visibilidadState, [capaId]: visible };
        this.visibilidad$.next(this.visibilidadState);
    }

    public aplicarVista(vista: 'operativa' | 'emergencia' | 'resumen'): void { }

    public actualizarNaves(data: any): void { this.navesSubject.next(data); }
    public actualizarInfraestructura(data: any): void { this.infraSubject.next(data); }
    public actualizarTerrestre(data: any): void { this.terrestreSubject.next(data); }
    public actualizarClima(data: any): void { this.climaSubject.next(data); }
    public actualizarVias(data: any): void { this.viasSubject.next(data); }
    public actualizarAccidentes(data: any): void { this.accidentesSubject.next(data); }

    public seleccionarPuerto(puerto: any): void { this.puertoSeleccionadoSubject.next(puerto); }

    public obtenerGemeloDigital(): Observable<any> {
        return this.http.get<any>(`${base_url}/mapa-general/capas`).pipe(
            map(response => response?.data ? response.data : this.lanzarError('Formato inválido'))
        );
    }

    public obtenerCapaTerrestreMapa(): Observable<any> {
        return this.http.get<any>(`${base_url}/mapa-general/terrestre`).pipe(
            map(response => response?.data ? response.data : this.lanzarError('Formato inválido'))
        );
    }

    public getGeocercasKPIs(): Observable<any> {
        return this.http.get(`${base_url}/flota-terrestre/geocercas-kpis`, { params: this.paramsPuerto() });
    }

    // 🟢 ESTE ES EL ENDPOINT MAESTRO DE LA FLOTA GPS QUE USA EL COMPONENTE PARA EL RADAR
    public getFlotaGeoJSON(): Observable<any> {
        // Al agregar ?t= milisegundos, la URL cambia cada 10 segundos y el navegador no puede cachearla
        const timestamp = new Date().getTime();
        return this.http.get<any>(`${base_url}/flota-terrestre/activa`, { params: this.paramsPuerto({ t: String(timestamp) }) });
    }

    public obtenerCapaNaves(): Observable<any> {
        return this.http.get<any>(`${base_url}/mapa-general/capa-naves`).pipe(
            map(response => response?.data ? response.data : this.lanzarError('Formato inválido'))
        );
    }

    public getAlertasActivas(): Observable<any> {
        return this.http.get(`${base_url}/alertas`);
    }

    public cargarEventosVialesActivos(): void {
        const endpoint = `${base_url}/eventos-viales/eventos`;
        this.http.get<any>(endpoint, { params: this.paramsPuerto() }).subscribe({
            next: (geoJsonData) => {
                this.accidentesSubject.next(geoJsonData);
                this.origenVialesSubject.next(geoJsonData?.origen || null);
                this.actualizarGemelo('CAPA_ACCIDENTES', geoJsonData);
            },
            error: (error) => { console.error('❌ Error incidentes:', error); }
        });
    }

    /**
     * Ciclo de vida de los eventos viales: el API avisa cuando uno aparece o se despeja (cada sincronización con
     * TomTom o un despeje manual) y la capa se recarga, así el accidente resuelto sale del mapa sin recargar.
     * El mapa ya está en la sala puerto:{P}:mapa (la abre AlertasMapaService).
     */
    private escucharCambiosEventosViales(): void {
        if (this.cambiosVialesSub) return;
        this.cambiosVialesSub = this._socketService
            .listen<{ puerto: string; nuevos: string[]; despejados: string[] }>(EVENTO_CAMBIO_VIALES)
            .subscribe((cambio) => {
                const propio = !this.puertoActual
                    || SocketService.normalizarPuerto(cambio?.puerto || '') === SocketService.normalizarPuerto(this.puertoActual);
                if (propio) this.cargarEventosVialesActivos();
            });
    }

    /** Despeje manual del operador (eventos que no vienen de TomTom). La capa se recarga al terminar. */
    public despejarEventoVial(codigo: string): Observable<any> {
        return this.http.patch(`${base_url}/eventos-viales/eventos/${encodeURIComponent(codigo)}/despejar`, {}).pipe(
            tap(() => this.cargarEventosVialesActivos())
        );
    }

    // 🟢 Método de carga inicial optimizado
    private cargarFlotaTerrestreGPS(): void {
        this.getFlotaGeoJSON().subscribe({
            next: (geoJsonFlota) => {
                // Al cargar la página, alimentamos tanto el subject como el gemelo digital
                this.terrestreSubject.next(geoJsonFlota);
                this.actualizarGemelo('CAPA_TERRESTRE', geoJsonFlota);
            },
            error: (error) => { console.error('❌ Error cargando Flota Terrestre GPS:', error); }
        });
    }

    /** Peajes nacionales (archivo estático del front). */
    public obtenerPeajes(): Observable<any> {
        return this.http.get('/assets/data/Peajes_20260705.geojson');
    }

    public vincularMotonave(mmsi: string, idAviso: number, nombreOpcional?: string) {
        const payload = {
            mmsi: mmsi,
            idAviso: idAviso,
            nombreReferencia: nombreOpcional // Esto llegará al 'rawData' del DTO en Node
        };

        // Asumiendo que tu prefijo base de API es '/api/motonaves'
        return this.http.post(`${base_url}/motonaves/vincular`, payload);
    }

    private lanzarError(mensaje: string): never { throw new Error(mensaje); }
}
