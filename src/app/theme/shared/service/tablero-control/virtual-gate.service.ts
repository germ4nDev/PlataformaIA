// /* eslint-disable @typescript-eslint/no-explicit-any */
// /*
//     Author: German Valencia
//     Service: PORTTOS Virtual Gate Service
//     Description: Consume una única vez /api/torre-control/virtual-gate?puerto=X con shareReplay(1)
//                  y transforma data.citas / data.resumen para cada Smart Widget y KPI.
// */
// import { Injectable } from '@angular/core';
// import { HttpClient, HttpParams } from '@angular/common/http';
// import { Observable, of } from 'rxjs';
// import { catchError, map, shareReplay } from 'rxjs/operators';
// import { LocalStorageService } from 'src/app/theme/shared/service';
// import { environment } from 'src/environments/environment';

// @Injectable({
//     providedIn: 'root'
// })
// export class VirtualGateService {
//     private readonly baseApi: string;
//     private gateCachePorPuerto$ = new Map<string, Observable<any>>();

//     constructor(
//         private http: HttpClient,
//         private _localStorageService: LocalStorageService
//     ) {
//         const rawUrl = (environment.apiUrl || 'http://localhost:3000/api').replace(/\/+$/, '');
//         this.baseApi = rawUrl.endsWith('/torre-control')
//             ? `${rawUrl}/virtual-gate`
//             : `${rawUrl}/torre-control/virtual-gate`;
//     }

//     /**
//      * Normaliza el nombre del puerto. Si un widget pasa por error su codigoWidget ('PTT_GATE_...')
//      * como primer parámetro, toma el puerto real desde LocalStorage ('BUENAVENTURA').
//      */
//     private resolverPuertoReal(puertoCandidato?: string): string {
//         const limpio = (puertoCandidato || '').toString().trim().toUpperCase();
//         if (!limpio || limpio.startsWith('PTT_') || limpio.startsWith('TLC_')) {
//             return (this._localStorageService.getPuertoLocalStorage() || 'BUENAVENTURA')
//                 .toString()
//                 .trim()
//                 .toUpperCase();
//         }
//         return limpio;
//     }

//     /**
//      * Realiza 1 sola petición HTTP por puerto y comparte la respuesta enriquecida
//      * entre los 6 widgets y los 10 KPIs mediante shareReplay(1).
//      */
//     public obtenerColaGate(puerto?: string, forzarRefresco: boolean = false): Observable<any> {
//         const puertoFinal = this.resolverPuertoReal(puerto);

//         if (forzarRefresco || !this.gateCachePorPuerto$.has(puertoFinal)) {
//             const params = new HttpParams().set('puerto', puertoFinal);

//             const request$ = this.http.get<any>(this.baseApi, { params }).pipe(
//                 map((res: any) => this.enriquecerRespuestaGate(res, puertoFinal)),
//                 catchError((err) => {
//                     console.error('[VirtualGateService] Error consultando Virtual Gate:', err);
//                     this.gateCachePorPuerto$.delete(puertoFinal);
//                     return of({ ok: false, data: { citas: [], cola: [], resumen: {} } });
//                 }),
//                 shareReplay(1)
//             );

//             this.gateCachePorPuerto$.set(puertoFinal, request$);
//         }

//         return this.gateCachePorPuerto$.get(puertoFinal)!;
//     }

//     /**
//      * Método invocado por los Smart Widgets. Soporta tanto:
//      * - obtenerDatosWidgetGate('PTT_GATE_CHRT_CITAS', 'BUENAVENTURA')
//      * - obtenerDatosWidgetGate('PTT_GATE_CHRT_CITAS')
//      */
//     public obtenerDatosWidgetGate(
//         codigoWidget: string,
//         puerto?: string,
//         forzarRefresco: boolean = false
//     ): Observable<any> {
//         const codigo = (codigoWidget || '').trim().toUpperCase();
//         const puertoFinal = this.resolverPuertoReal(puerto);

//         return this.obtenerColaGate(puertoFinal, forzarRefresco).pipe(
//             map((resEnriquecida: any) => {
//                 const d = resEnriquecida?.data || {};

//                 switch (codigo) {
//                     case 'PTT_GATE_CHRT_CITAS':
//                         return d.citas12h;

//                     case 'PTT_GATE_CHRT_DIST':
//                         return d.distribucion10km;

//                     case 'PTT_GATE_PANEL_ALERTAS':
//                         return { ...resEnriquecida, data: d.alertas, alertas: d.alertas, citas: d.citas };

//                     case 'PTT_GATE_PANEL_ESTADO':
//                         return { ...resEnriquecida, data: d.estadoCitas, resumen: d.resumen, citas: d.citas };

//                     case 'PTT_GATE_PANEL_VAL':
//                         return { ...resEnriquecida, data: d.validacion, resumen: d.resumen, citas: d.citas };

//                     case 'PTT_GATE_TAB_COLA':
//                     case 'PTT_GATE_TABLA_COLA':
//                         return { ...resEnriquecida, data: { ...d, cola: d.citas, citas: d.citas } };

//                     default:
//                         return resEnriquecida;
//                 }
//             })
//         );
//     }

//     /**
//      * Toma { data: { resumen, citas } } del backend y construye todas las vistas derivadas
//      */
//     private enriquecerRespuestaGate(res: any, puerto: string): any {
//         const rawData = res?.data || res || {};
//         const citasRaw: any[] = Array.isArray(rawData.citas)
//             ? rawData.citas
//             : Array.isArray(rawData.cola)
//               ? rawData.cola
//               : [];
//         const resumenBackend = rawData.resumen || {};

//         const citas = citasRaw.map((c: any, idx: number) => ({
//             ...c,
//             id_cita: c.id_cita || `VG-${100 + idx}`,
//             placa: String(c.placa || 'S/P').toUpperCase(),
//             transportador: c.transportador || c.empresa || 'LOGÍSTICA PORTUARIA',
//             empresa: c.transportador || c.empresa || 'LOGÍSTICA PORTUARIA',
//             tipo_carga: String(c.tipo_carga || 'CONTENEDORES').toUpperCase(),
//             operacion: String(c.operacion || 'RETIRO').toUpperCase(),
//             terminal: String(c.terminal || 'TCBUEN').toUpperCase(),
//             ubicacion: c.ubicacion || 'Pre-gate',
//             estado: String(c.estado || 'En Cola').trim(),
//             tiempo_espera_minutos: Number(c.tiempo_espera_minutos ?? c.tiempo_espera ?? 0),
//             fecha_hora_cita: c.fecha_hora_cita || new Date().toISOString()
//         }));

//         const citas12h = this.calcularCitasPorHoraTerminal(citas);
//         const distribucion10km = this.calcularDistribucion10Km(citas);
//         const estadoCitas = this.calcularEstadoCitasYEspera(citas, resumenBackend);
//         const validacion = this.calcularValidacionPregate(citas, resumenBackend);
//         const alertas = this.calcularAlertasGate(citas);
//         const resumenKpis = this.calcularResumenKpis(citas, resumenBackend);

//         return {
//             ...res,
//             ok: true,
//             puerto,
//             data: {
//                 ...rawData,
//                 citas,
//                 cola: citas,
//                 resumen: resumenKpis,
//                 citas12h,
//                 distribucion10km,
//                 estadoCitas,
//                 validacion,
//                 alertas
//             }
//         };
//     }

//     private calcularResumenKpis(citas: any[], resumenBackend: any): any {
//         const esCont = (c: any) => c.tipo_carga.includes('CONT');
//         const esGranel = (c: any) => c.tipo_carga.includes('GRANEL');
//         const esSuelta = (c: any) => c.tipo_carga.includes('SUELTA') || c.tipo_carga.includes('GEN');
//         const esRoro = (c: any) => c.tipo_carga.includes('RORO') || c.tipo_carga.includes('VEH') || c.tipo_carga.includes('NIÑERA');

//         const contList = citas.filter(esCont);
//         const granelList = citas.filter(esGranel);
//         const sueltaList = citas.filter(esSuelta);
//         const roroList = citas.filter(esRoro);

//         const totalCamiones = resumenBackend.totalCamiones ?? citas.length;
//         const validados = resumenBackend.validados ?? citas.filter((c) => c.estado.toUpperCase().includes('VALID')).length;
//         const enCola = resumenBackend.enCola ?? citas.filter((c) => c.estado.toUpperCase().includes('COLA')).length;
//         const retenidos = resumenBackend.retenidos ?? citas.filter((c) => c.estado.toUpperCase().includes('RETEN')).length;

//         return {
//             ...resumenBackend,
//             totalCamiones,
//             validados,
//             enCola,
//             retenidos,
//             totalContenedores: contList.length || Math.ceil(totalCamiones * 0.5),
//             subtituloContenedores: `${validados} validados · ${enCola} en cola`,
//             totalGranel: granelList.length * 34,
//             subtituloGranel: `${granelList.length} camiones granel`,
//             totalCargaSuelta: sueltaList.length * 22,
//             subtituloCargaSuelta: `${sueltaList.length} turnos carga suelta`,
//             totalRoro: roroList.length,
//             subtituloRoro: 'Unidades en enturnamiento',
//             saturacionBodegas: resumenBackend.saturacionBodegas || `${Math.min(98, Math.round((enCola / Math.max(1, totalCamiones)) * 100))}%`,
//             subtituloBodegas: `Espera media TCBUEN: ${resumenBackend.tiempoMedioTCBUEN ?? 15} min`,
//             subContenedores: contList.length,
//             subGranel: granelList.length,
//             subCargaSuelta: sueltaList.length,
//             subNineras: roroList.length
//         };
//     }

//     private calcularCitasPorHoraTerminal(citas: any[]): any {
//         if (!citas.length) {
//             return { labels: [], datasets: [], categories: [], series: [] };
//         }

//         const horasMap = new Map<string, Record<string, number>>();
//         const terminalesSet = new Set<string>();

//         citas.forEach((c) => {
//             const d = new Date(c.fecha_hora_cita);
//             const horaLabel = !isNaN(d.getTime())
//                 ? `${String(d.getHours()).padStart(2, '0')}:00`
//                 : '08:00';
//             const terminal = c.terminal || 'TCBUEN';

//             terminalesSet.add(terminal);
//             if (!horasMap.has(horaLabel)) {
//                 horasMap.set(horaLabel, {});
//             }
//             const grupo = horasMap.get(horaLabel)!;
//             grupo[terminal] = (grupo[terminal] || 0) + 1;
//         });

//         const labels = Array.from(horasMap.keys()).sort();
//         const terminales = Array.from(terminalesSet);

//         const datasets = terminales.map((term) => ({
//             label: term,
//             name: term,
//             data: labels.map((h) => horasMap.get(h)?.[term] || 0)
//         }));

//         return {
//             labels,
//             categories: labels,
//             datasets,
//             series: datasets
//         };
//     }

//     private calcularDistribucion10Km(citas: any[]): any {
//         if (!citas.length) {
//             return { labels: [], valores: [], data: [], items: [], total: 0 };
//         }

//         const conteoPorUbicacion = new Map<string, number>();
//         citas.forEach((c) => {
//             const ub = String(c.ubicacion || 'Zona Enturnamiento').trim();
//             conteoPorUbicacion.set(ub, (conteoPorUbicacion.get(ub) || 0) + 1);
//         });

//         const labels = Array.from(conteoPorUbicacion.keys());
//         const valores = Array.from(conteoPorUbicacion.values());
//         const total = valores.reduce((a, b) => a + b, 0);

//         const items = labels.map((label, idx) => ({
//             label,
//             nombre: label,
//             valor: valores[idx],
//             porcentaje: total > 0 ? Number(((valores[idx] / total) * 100).toFixed(1)) : 0
//         }));

//         return {
//             labels,
//             valores,
//             data: valores,
//             series: valores,
//             total,
//             items
//         };
//     }

//     private calcularEstadoCitasYEspera(citas: any[], resumenBackend: any): any {
//         const enVentana = citas.filter((c) =>
//             ['VALIDADO', 'CONFIRMADA', 'EN VENTANA', 'ATENDIDO'].includes(c.estado.toUpperCase())
//         ).length;
//         const enCola = citas.filter((c) =>
//             ['EN COLA', 'EN_COLA', 'ENTURNADO', 'PROGRAMADO'].includes(c.estado.toUpperCase())
//         ).length;
//         const vencidas = citas.filter((c) =>
//             c.estado.toUpperCase().includes('VENCID') || c.tiempo_espera_minutos > 45
//         ).length;
//         const retenidos = citas.filter((c) =>
//             c.estado.toUpperCase().includes('RETEN') || c.estado.toUpperCase().includes('SIN CITA')
//         ).length;

//         return {
//             total: citas.length,
//             enVentana: enVentana || resumenBackend.validados || 0,
//             enCola: enCola || resumenBackend.enCola || 0,
//             vencidas,
//             retenidos: retenidos || resumenBackend.retenidos || 0,
//             tiempoMedioTCBUEN: resumenBackend.tiempoMedioTCBUEN ?? 18,
//             tiempoMedioSPRBUN: resumenBackend.tiempoMedioSPRBUN ?? 12,
//             tiempoMedioAGUADULCE: resumenBackend.tiempoMedioAGUADULCE ?? 9
//         };
//     }

//     private calcularValidacionPregate(citas: any[], resumenBackend: any): any {
//         const total = resumenBackend.totalCamiones ?? citas.length;
//         const validados = resumenBackend.validados ?? citas.filter((c) => c.estado.toUpperCase().includes('VALID')).length;
//         const enCola = resumenBackend.enCola ?? citas.filter((c) => c.estado.toUpperCase().includes('COLA')).length;
//         const retenidos = resumenBackend.retenidos ?? citas.filter((c) => c.estado.toUpperCase().includes('RETEN')).length;

//         return {
//             totalCamiones: total,
//             validados,
//             enCola,
//             retenidos,
//             porcentajeValidados: total > 0 ? Math.round((validados / total) * 100) : 0,
//             citas
//         };
//     }

//     private calcularAlertasGate(citas: any[]): any[] {
//         const alertas: any[] = [];
//         citas.forEach((c) => {
//             if (c.estado.toUpperCase().includes('RETEN')) {
//                 alertas.push({
//                     severidad: 'CRITICO',
//                     titulo: `Camión ${c.placa} — RETENIDO`,
//                     subtitulo: `${c.ubicacion} · ${c.transportador} (${c.terminal})`,
//                     tiempo: `${c.tiempo_espera_minutos} min`
//                 });
//             } else if (c.tiempo_espera_minutos >= 25) {
//                 alertas.push({
//                     severidad: 'ALERTA',
//                     titulo: `Demora en gate ${c.terminal} (${c.placa})`,
//                     subtitulo: `${c.tiempo_espera_minutos} min de espera · ${c.transportador}`,
//                     tiempo: `${c.tiempo_espera_minutos} min`
//                 });
//             }
//         });
//         return alertas;
//     }

//     public limpiarCachePuerto(puerto?: string): void {
//         if (puerto) {
//             this.gateCachePorPuerto$.delete(puerto.trim().toUpperCase());
//         } else {
//             this.gateCachePorPuerto$.clear();
//         }
//     }
// }
/* eslint-disable @typescript-eslint/no-explicit-any */
/*
    Author: German Valencia
    Service: PORTTOS Virtual Gate Service (Encapsulated in virtualGate object)
*/
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, shareReplay } from 'rxjs/operators';
import { LocalStorageService } from 'src/app/theme/shared/service';
import { environment } from 'src/environments/environment';
const base_url = environment.apiUrl;

@Injectable({
    providedIn: 'root'
})
export class VirtualGateService {
    private readonly baseApi: string;
    private gateCachePorPuerto$ = new Map<string, Observable<any>>();

    constructor(
        private http: HttpClient,
        private _localStorageService: LocalStorageService
    ) {
        const rawUrl = (base_url || 'http://localhost:3000/api').replace(/\/+$/, '');
        this.baseApi = rawUrl.endsWith('/torre-control')
            ? `${rawUrl}/virtual-gate`
            : `${rawUrl}/torre-control/virtual-gate`;
    }

    private resolverPuertoReal(puertoCandidato?: string): string {
        const limpio = (puertoCandidato || '').toString().trim().toUpperCase();
        if (!limpio || limpio.startsWith('PTT_') || limpio.startsWith('TLC_')) {
            return (this._localStorageService.getPuertoLocalStorage() || 'BUENAVENTURA')
                .toString()
                .trim()
                .toUpperCase();
        }
        return limpio;
    }

    public obtenerColaGate(puerto?: string, forzarRefresco: boolean = false): Observable<any> {
        const puertoFinal = this.resolverPuertoReal(puerto);

        if (forzarRefresco || !this.gateCachePorPuerto$.has(puertoFinal)) {
            const params = new HttpParams().set('puerto', puertoFinal);

            const request$ = this.http.get<any>(this.baseApi, { params }).pipe(
                map((res: any) => {
                    // Extrae el objeto encapsulado virtualGate del backend
                    const vg = res?.data?.virtualGate || res?.virtualGate || res?.data || {};
                    return {
                        ok: true,
                        puerto: puertoFinal,
                        virtualGate: vg,
                        // Aliases directos para compatibilidad con widgets existentes
                        resumen: vg.resumen || {},
                        citas: vg.citas || [],
                        cola: vg.citas || []
                    };
                }),
                catchError((err) => {
                    console.error('[VirtualGateService] Error:', err);
                    this.gateCachePorPuerto$.delete(puertoFinal);
                    return of({ ok: false, virtualGate: {}, resumen: {}, citas: [] });
                }),
                shareReplay(1)
            );

            this.gateCachePorPuerto$.set(puertoFinal, request$);
        }

        return this.gateCachePorPuerto$.get(puertoFinal)!;
    }

    public obtenerDatosWidgetGate(
        codigoWidget: string,
        puerto?: string,
        forzarRefresco: boolean = false
    ): Observable<any> {
        const codigo = (codigoWidget || '').trim().toUpperCase();
        const puertoFinal = this.resolverPuertoReal(puerto);

        return this.obtenerColaGate(puertoFinal, forzarRefresco).pipe(
            map((resp: any) => {
                const vg = resp?.virtualGate || resp;

                switch (codigo) {
                    case 'PTT_GATE_CHRT_CITAS':
                        return vg.citas12h || { labels: [], datasets: [] };

                    case 'PTT_GATE_CHRT_DIST':
                        return vg.distribucion10km || { labels: [], valores: [], items: [], total: 0 };

                    case 'PTT_GATE_PANEL_ALERTAS':
                        return vg.alertas || [];

                    case 'PTT_GATE_PANEL_ESTADO':
                        return vg.estadoCitas || null;

                    case 'PTT_GATE_PANEL_VAL':
                        return vg.validacion || null;

                    case 'PTT_GATE_TAB_COLA':
                    case 'PTT_GATE_TABLA_COLA':
                        return vg.citas || [];

                    default:
                        return vg;
                }
            })
        );
    }

    public limpiarCachePuerto(puerto?: string): void {
        if (puerto) {
            this.gateCachePorPuerto$.delete(puerto.trim().toUpperCase());
        } else {
            this.gateCachePorPuerto$.clear();
        }
    }
}
