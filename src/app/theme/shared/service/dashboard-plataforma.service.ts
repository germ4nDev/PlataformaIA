import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, map, Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { ToastrService } from 'ngx-toastr';
import { SocketService } from './sockets.service';
import { LocalStorageService } from './local-storage.service';

const base_url = environment.apiUrl;

@Injectable({
    providedIn: 'root'
})
export class DashboardPlataformaService {
    private _widgetFocusSource = new BehaviorSubject<{ type: string, data: any } | null>(null);
    public widgetFocus$ = this._widgetFocusSource.asObservable();

    constructor(
        private http: HttpClient,
        private socketService: SocketService,
        private _localStorageService: LocalStorageService,
        private toastr: ToastrService
    ) { }

    // -------------------------------------------------------------------------
    // MÉTODOS EXISTENTES
    // -------------------------------------------------------------------------

    getUsuariosConectados(): Observable<number> {
        return this.http.get<any>(`${base_url}/dashboard/usuarios-conectados`).pipe(
            map(response => response.data.total)
        );
    }

    getKpiTotales(): Observable<{ totalUsuarios: number, totalPaquetes: number, totalAplicaciones: number, totalSuscriptores: number }> {
        return this.http.get<any>(`${base_url}/dashboard/kpi-totales`).pipe(
            map(response => response.data)
        );
    }

    getPaquetesPorSuscriptor(): Observable<{ activos: any[], inactivos: any[] }> {
        return this.http.get<any>(`${base_url}/dashboard/paquetes-suscriptor`).pipe(
            map(response => response.data)
        );
    }

    getResumenTickets(): Observable<any> {
        return this.http.get<any>(`${base_url}/dashboard/resumen-tickets`).pipe(
            map(response => response.data)
        );
    }

    abrirModoEnfoque(type: string, data: any) {
        console.log('abrir modal widget tipo', type);
        console.log('abrir modal widget', data);
        this._widgetFocusSource.next({ type, data });
    }

    cerrarModoEnfoque() {
        this._widgetFocusSource.next(null);
    }

    // -------------------------------------------------------------------------
    // 🟢 NUEVOS TÚNELES PARA GRÁFICAS (CHART.JS)
    // -------------------------------------------------------------------------

    getChartDistribucionPaquetes(): Observable<{ labels: string[], values: number[] }> {
        return this.http.get<any>(`${base_url}/dashboard/grafica-paquetes`).pipe(
            map(response => response.data)
        );
    }

    getChartEstadoTickets(): Observable<{ labels: string[], resueltos: number[], enProgreso: number[], abiertos: number[] }> {
        return this.http.get<any>(`${base_url}/dashboard/grafica-tickets`).pipe(
            map(response => response.data)
        );
    }

    getChartFacturacionMRR(): Observable<{ labels: string[], anuales: number[], intermedios: number[], mensuales: number[] }> {
        return this.http.get<any>(`${base_url}/dashboard/grafica-facturacion`).pipe(
            map(response => response.data)
        );
    }
}
