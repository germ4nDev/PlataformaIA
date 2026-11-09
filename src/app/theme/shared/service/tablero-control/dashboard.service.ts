import { traducir } from '../../i18n/traducir';
/*
    Author: German Valencia
    Component: Dashboard Service (El Gobernador Central de Telemetría)
    Refactored for: Separación de Layout (SessionStorage) y Datos Vivos (RxJS)
*/
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable, OnDestroy, OnInit } from '@angular/core';
import { environment } from '../../../../../environments/environment';
import { BehaviorSubject, catchError, map, Observable, of, Subscription, tap } from 'rxjs';
import { SocketService } from '../sockets.service';
import Swal from 'sweetalert2'
import { ToastrService } from 'ngx-toastr';
import { IngestaService } from './ingesta.service';
import { LocalStorageService } from '../local-storage.service';

const base_url = environment.apiUrl;

// 🟢 1. LA ESTRUCTURA DEL ESTADO GLOBAL (Solo Telemetría)
// Ya no guardamos layouts aquí para evitar bucles de renderizado.
export interface AppState {
    datosVivos: { [pestana: string]: any }; // Los números vivos (API) de cada pestaña
}

@Injectable({
    providedIn: 'root'
})
export class DashboardService implements OnInit, OnDestroy {

    // ==========================================
    // 🟢 2. EL CEREBRO DEL GOBERNADOR (Datos Vivos)
    // ==========================================
    private stateSource = new BehaviorSubject<AppState>({ datosVivos: {} });
    public datosVivos$ = this.stateSource.asObservable(); // Las pestañas se suscriben a esto

    // ==========================================
    // VARIABLES EXISTENTES
    // ==========================================
    private _widgetFocusSource = new BehaviorSubject<{ type: string, data: any } | null>(null);
    public widgetFocus$ = this._widgetFocusSource.asObservable();

    private _puertoSeleccionadoSource = new BehaviorSubject<string>('TODOS');
    public puertoSeleccionado$ = this._puertoSeleccionadoSource.asObservable();

    private socketSub: Subscription = new Subscription;
    public climaPortuario: any;
    public mapaPortuario: any[] = [];

    constructor(
        private http: HttpClient,
        private socketService: SocketService,
        private _ingestaService: IngestaService,
        private _localStorageService: LocalStorageService,
        private toastr: ToastrService
    ) { }

    ngOnInit(): void {
        this.socketSub = this.socketService.listen('alerta-interactiva').subscribe((alerta: any) => {
            if (alerta.nivel === 'warning' && alerta.accionRequerida) {
                const toastRef = this.toastr.warning(
                    alerta.mensaje + '<br><br><b>👉 Haz clic en esta tarjeta para sincronizar ahora</b>',
                    alerta.titulo,
                    {
                        enableHtml: true, timeOut: 15000, progressBar: true, tapToDismiss: true
                    }
                );
                toastRef.onTap.subscribe(() => this.ejecutarSincronizacion());
            } else {
                this.toastr.info(alerta.mensaje, alerta.titulo);
            }
        });
    }

    // ==========================================
    // 🟢 3. NUEVOS MÉTODOS DE ESTADO (Telemetría)
    // ==========================================

    /**
     * Inyecta los datos vivos consultados desde la API al estado global.
     * Los componentes suscritos (ej. Virtual Gate) reaccionarán automáticamente.
     */
    setDatosPestana(nombrePestana: string, datos: any) {
        const currentState = this.stateSource.value;
        currentState.datosVivos[nombrePestana] = datos;
        this.stateSource.next({ ...currentState });
    }

    /**
     * Limpia la memoria de telemetría (Útil al cambiar de puerto).
     */
    purgarDatos() {
        this.stateSource.next({ datosVivos: {} });
    }

    /**
     * Consulta síncrona del estado actual de los datos.
     */
    obtenerEstadoDatos() {
        return this.stateSource.value.datosVivos;
    }


    // ==========================================
    // MÉTODOS EXISTENTES GLOBALES Y ALERTAS
    // ==========================================

    setPuerto(puerto: string) {
        if (puerto !== this._puertoSeleccionadoSource.value) {
            this._puertoSeleccionadoSource.next(puerto);
            this._localStorageService.setObject('puerto_seleccionado', puerto);
            this.purgarDatos(); // Limpiamos la telemetría vieja al cambiar de puerto
        }
    }

    abrirModoEnfoque(type: string, data?: any) {
        this._widgetFocusSource.next({ type, data });
    }

    cerrarModoEnfoque() {
        this._widgetFocusSource.next(null);
    }

    mostrarAlerta(alerta: any) {
        Swal.fire({
            title: alerta.titulo, text: alerta.mensaje, icon: alerta.nivel,
            showCancelButton: true, confirmButtonColor: '#3b82f6', cancelButtonColor: '#64748b',
            confirmButtonText: traducir('WEB.DASHBOARD_SERVICE.SI_SINCRONIZAR'), cancelButtonText: traducir('WEB.DASHBOARD_SERVICE.MAS_TARDE')
        }).then((result) => {
            if (result.isConfirmed) {
                // endpointAccion trae la ruta completa (/api/...): se usa la raíz del API del ambiente, nunca localhost (2026-10-29)
                this.http.post(`${environment.sctUrl}${alerta.endpointAccion}`, {}).subscribe({
                    next: (res: any) => Swal.fire(traducir('WEB.DASHBOARD_SERVICE.SINCRONIZADO'), traducir('WEB.DASHBOARD_SERVICE.LOS_HISTORICOS_DE_SUPERTRANSPORTE_ESTAN'), 'success'),
                    error: (err) => Swal.fire(traducir('WEB.DASHBOARD_SERVICE.ERROR'), traducir('WEB.DASHBOARD_SERVICE.NO_SE_PUDO_CONECTAR_CON'), 'error')
                });
            }
        });
    }

    ejecutarSincronizacion() {
        this.toastr.info(traducir('WEB.DASHBOARD_SERVICE.SINCRONIZANDO_CON_SUPERTRANSPORTE'), traducir('WEB.DASHBOARD_SERVICE.PROCESANDO'), { timeOut: 2000 });
        this._ingestaService.actualizarHistoricoSuperTrasnporte();
    }

    // ==========================================
    // ENDPOINTS DE API CORE Y MARÍTIMO
    // ==========================================

    getLayout(codigo: string): Observable<any> {
        return this.http.get(`${base_url}/tclp-dashboard/${codigo}`);
    }

    saveLayout(payload: any): Observable<any> {
        return this.http.post(`${base_url}/tclp-dashboard`, { payload });
    }

    obtenerResumenKpis(puerto?: string): Observable<any> {
        let params = new HttpParams();
        if (puerto) params = params.set('puerto', puerto.toUpperCase());
        return this.http.get(`${base_url}/torre-control/kpis`, { params });
    }

    obtenerReportes(puerto: string): Observable<any> {
        const token = this._localStorageService.getTokenLocalStorage();
        const headers = new HttpHeaders({ 'x-token': token });
        return this.http.get(`${base_url}/tclp-dashboard/reportes-operativos`, { params: { puerto }, headers: headers })
            .pipe(catchError(err => { console.error('Error Reportes:', err); return of([]); }));
    }

    evaluarTerminalIA(terminalId: string): Observable<any> {
        return this.http.get<any>(`${base_url}/ia/dashboard/motonaves-72h`);
    }

    cargarMapaPortuario(): Observable<any> {
        if (this.mapaPortuario.length > 0) return of(this.mapaPortuario);
        return this.http.get(`${base_url}/tclp-dashboard/puertos`).pipe(tap((data: any) => this.mapaPortuario = data));
    }

    cargarClimaPortuario(puerto: string): Observable<any> {
        return this.http.get(`${base_url}/maritimo/clima/${puerto}`).pipe(tap(data => this.climaPortuario = data));
    }

    obtenerOperacionesSLA(puerto: string): Observable<any> {
        return this.http.get(`${base_url}/maritimo/operaciones/${puerto}`);
    }

    obtenerMatrizEficiencias(terminal?: string): Observable<any> {
        let params = new HttpParams();
        if (terminal) params = params.set('terminal', terminal.toUpperCase().trim());
        return this.http.get(`${base_url}/maritimo/matriz`, { params });
    }

    obtenerProductividadData(puerto: string): Observable<any> {
        let params = new HttpParams();
        if (puerto) params = params.set('ciudad', puerto.toUpperCase().trim());
        return this.http.get(`${base_url}/tclp-dashboard/productividad-grafica`, { params });
    }

    obtenerLineUpMaritimo(puerto: string): Observable<any[]> {
        return this.http.get<any>(`${base_url}/maritimo/lineup/${puerto}`).pipe(
            map(response => (response.success && response.data) ? response.data : [])
        );
    }

    ngOnDestroy() {
        if (this.socketSub) this.socketSub.unsubscribe();
    }
}
