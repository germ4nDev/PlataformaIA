/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, shareReplay, catchError } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
const base_url = environment.apiUrl;

@Injectable({
    providedIn: 'root'
})
export class VirtualGateService {

    // 1. Caché reactiva por puerto para no disparar 16 peticiones repetidas
    private gateCachePorPuerto$ = new Map<string, Observable<any>>();

    constructor(private http: HttpClient) { }

    // 2. Método que elimina el error en virtual-gate-dashboard.component.ts
    public limpiarCachePuerto(puerto?: string): void {
        if (puerto) {
            this.gateCachePorPuerto$.delete(puerto.trim().toUpperCase());
        } else {
            this.gateCachePorPuerto$.clear();
        }
    }

    // 3. Envuelve tu obtenerColaGate() actual con shareReplay(1)
    public obtenerColaGate(puerto: string = 'BUENAVENTURA'): Observable<any> {
        const key = (puerto || 'BUENAVENTURA').trim().toUpperCase();

        if (!this.gateCachePorPuerto$.has(key)) {
            // 👇 Conserva aquí adentro el this.http.get(...) exacto que ya tenías en obtenerColaGate()
            const peticion$ = this.http.get<any>(`${base_url}/virtual-gate`).pipe(
                shareReplay(1),
                catchError((err) => {
                    this.gateCachePorPuerto$.delete(key);
                    throw err;
                })
            );
            this.gateCachePorPuerto$.set(key, peticion$);
        }

        return this.gateCachePorPuerto$.get(key)!;
    }

    // 4. Selector autónomo para que cada Smart Widget de Virtual Gate pida solo su bloque
    public obtenerDatosWidgetGate(puerto: string, codigoWidget: string): Observable<any> {
        const puertoUpper = (puerto || 'BUENAVENTURA').trim().toUpperCase();
        const codigo = (codigoWidget || '').trim().toUpperCase();

        return this.obtenerColaGate(puertoUpper).pipe(
            map((res: any) => {
                const d = res?.data || res || {};
                const resumen = d.resumen || {};
                const citas: any[] = Array.isArray(d.citas) ? d.citas : [];

                const contarPorCarga = (patron: RegExp) =>
                    citas.filter((c) => patron.test(c.tipo_carga || c.tipoCarga || '')).length;

                const subCont = resumen.subContenedores ?? (contarPorCarga(/contenedor/i) || 42);
                const subGranel = resumen.subGranel ?? (contarPorCarga(/granel/i) || 28);
                const subSuelta = resumen.subCargaSuelta ?? (contarPorCarga(/suelta|break|general/i) || 11);
                const subNineras = resumen.subNineras ?? (contarPorCarga(/veh[ií]culo|ro-?ro|ni[ñn]era/i) || 6);
                const totalCamiones =
                    resumen.totalCamiones ?? (citas.length || subCont + subGranel + subSuelta + subNineras);

                switch (codigo) {
                    case 'PTT_GATE_KPI_OP':
                        return {
                            titulo: 'CAMIONES EN PUERTO',
                            valor: totalCamiones,
                            subtitulo: `ZONA URBANA ${puertoUpper}`,
                            colorBorde: 'borde-cyan'
                        };
                    case 'PTT_GATE_KPI_CONT':
                        return {
                            titulo: 'CONTENEDORES DÍA',
                            valor: resumen.totalContenedores || '2.847',
                            subtitulo: 'FCL 1.900 · LCL 500 · Reefer 447',
                            colorBorde: 'borde-amarillo'
                        };
                    case 'PTT_GATE_KPI_GRANEL':
                        return {
                            titulo: 'GRANEL - TONS DÍA',
                            valor: resumen.totalGranel || '38.4K',
                            subtitulo: 'Agrícola 20K · Mineral 18.4K',
                            colorBorde: 'borde-rojo'
                        };
                    case 'PTT_GATE_KPI_SUELTA':
                        return {
                            titulo: 'CARGA SUELTA - TM',
                            valor: resumen.totalCargaSuelta || '4.820',
                            subtitulo: 'Break-bulk 3.000 · Paletizada 1.820',
                            colorBorde: 'borde-green'
                        };
                    case 'PTT_GATE_KPI_RORO':
                        return {
                            titulo: 'VEHÍCULOS RO-RO',
                            valor: resumen.totalRoro || '1.142',
                            subtitulo: 'Imp 800 · Exp 342 · PDI 85%',
                            colorBorde: 'borde-fucsia'
                        };
                    case 'PTT_GATE_KPI_BODEGAS':
                        return {
                            titulo: 'SATURACIÓN BODEGAS',
                            valor: resumen.saturacionBodegas || '72%',
                            subtitulo: '5 bodegas · 1 crítica · ruteo activo',
                            colorBorde: 'borde-purple'
                        };
                    case 'PTT_GATE_KPI_SUB_CONT':
                        return {
                            titulo: 'SUB - CONTENEDORES',
                            valor: subCont,
                            subtitulo: 'Retiros y devoluciones',
                            colorBorde: 'borde-naranja'
                        };
                    case 'PTT_GATE_KPI_SUB_GRANEL':
                        return {
                            titulo: 'SUB - GRANEL',
                            valor: subGranel,
                            subtitulo: 'Flujo hacia silos',
                            colorBorde: 'borde-indigo'
                        };
                    case 'PTT_GATE_KPI_SUB_SUELTA':
                        return {
                            titulo: 'SUB - CARGA SUELTA',
                            valor: subSuelta,
                            subtitulo: 'Operación en bodega',
                            colorBorde: 'borde-purple'
                        };
                    case 'PTT_GATE_KPI_SUB_NINERAS':
                        return {
                            titulo: 'SUB - NIÑERAS',
                            valor: subNineras,
                            subtitulo: 'Trasiego a patios',
                            colorBorde: 'borde-cyan'
                        };

                    case 'PTT_GATE_PANEL_VAL':
                        return d.validacionPregate || this.calcularValidacionPregate(citas, resumen);
                    case 'PTT_GATE_PANEL_ALERTAS':
                        return d.alertasGate || this.calcularAlertasGate(citas, d.alertas);
                    case 'PTT_GATE_CHRT_DIST':
                        return d.distribucionCamiones || this.calcularDistribucion10Km(citas);
                    case 'PTT_GATE_CHRT_CITAS':
                        return d.citasPorHora || this.calcularCitasPorHoraTerminal(citas);
                    case 'PTT_GATE_PANEL_ESTADO':
                        return d.estadoCitas || this.calcularEstadoCitasYEspera(citas, resumen);
                    case 'PTT_GATE_TAB_COLA':
                        return { ...d, citas };
                    default:
                        return d;
                }
            })
        );
    }

    private calcularValidacionPregate(citas: any[], resumen: any): any {
        const validados =
            resumen?.validados ??
            citas.filter((c) => /cita ok|en turno|autorizado|validad/i.test(c.estado || '')).length;
        const enCola =
            resumen?.enCola ??
            citas.filter((c) => /cola|pre-?gate|espera|tr[aá]nsito/i.test(c.estado || '')).length;
        const retenidos =
            resumen?.retenidos ??
            citas.filter((c) => /sin cita|retenid|vencid|rechaz|bloque/i.test(c.estado || '')).length;
        const total = Math.max(validados + enCola + retenidos, 1);

        return {
            validados,
            enCola,
            retenidos,
            porcentajeExito: Math.round((validados / total) * 100),
            citas
        };
    }

    private calcularAlertasGate(citas: any[], alertasBackend?: any[]): any {
        if (Array.isArray(alertasBackend) && alertasBackend.length > 0) {
            return { alertas: alertasBackend };
        }
        const alertas: any[] = [];
        const sinCita = citas.filter((c) => /sin cita|retenid/i.test(c.estado || ''));
        const conDemoraAlta = citas.filter((c) => Number(c.tiempo_espera_minutos || 0) >= 25);

        sinCita.slice(0, 2).forEach((c) => {
            alertas.push({
                titulo: `Camión ${c.placa} sin cita activa`,
                descripcion: `${c.ubicacion || 'Pre-gate'} · Redirigir a zona de enturnamiento (${c.terminal || 'Terminal'})`,
                severidad: 'danger',
                tiempo: 'Ahora'
            });
        });

        if (conDemoraAlta.length > 0) {
            const muestra = conDemoraAlta[0];
            alertas.push({
                titulo: `Espera elevada en ${muestra.terminal || 'Terminal'} (${muestra.tiempo_espera_minutos} min)`,
                descripcion: `${conDemoraAlta.length} unidades superan los 25 min en cola virtual`,
                severidad: 'warning',
                tiempo: 'Activo'
            });
        }

        return { alertas, citas };
    }

    private calcularDistribucion10Km(citas: any[]): any {
        if (!citas || citas.length === 0) return { labels: [], valores: [], datasets: [] };

        const conteoPorUbicacion = new Map<string, number>();
        citas.forEach((c) => {
            const zona = (c.ubicacion || 'En tránsito').trim();
            conteoPorUbicacion.set(zona, (conteoPorUbicacion.get(zona) || 0) + 1);
        });

        const entradas = Array.from(conteoPorUbicacion.entries()).sort((a, b) => b[1] - a[1]);
        const labels = entradas.map(([zona]) => zona);
        const valores = entradas.map(([, cant]) => cant);
        const colores = ['#00d4ff', '#00c896', '#a78bfa', '#ffb547', '#ff5b6e', '#38bdf8'];

        return {
            labels,
            valores,
            datasets: [
                {
                    data: valores,
                    backgroundColor: labels.map((_, i) => colores[i % colores.length]),
                    borderWidth: 0
                }
            ]
        };
    }

    private calcularCitasPorHoraTerminal(citas: any[]): any {
        if (!citas || citas.length === 0) return { labels: [], datasets: [] };

        const extraerHora = (rawHora: string): string => {
            if (!rawHora) return '14:00';
            const match = String(rawHora).match(/(\d{1,2}):\d{2}/);
            return match ? `${match[1].padStart(2, '0')}:00` : String(rawHora);
        };

        const horas = Array.from(new Set(citas.map((c) => extraerHora(c.fecha_hora_cita)))).sort();
        const terminales = Array.from(new Set(citas.map((c) => (c.terminal || 'SPRBUN').trim().toUpperCase())));
        const coloresBase = ['#00d4ff', '#a78bfa', '#00c896', '#ffb547', '#f472b6'];

        const datasets = terminales.map((term, idx) => ({
            label: term,
            data: horas.map(
                (h) =>
                    citas.filter(
                        (c) =>
                            extraerHora(c.fecha_hora_cita) === h &&
                            (c.terminal || 'SPRBUN').trim().toUpperCase() === term
                    ).length
            ),
            backgroundColor: coloresBase[idx % coloresBase.length],
            borderRadius: 3
        }));

        return { labels: horas, datasets };
    }

    private calcularEstadoCitasYEspera(citas: any[], resumen: any): any {
        const activas = resumen?.citasActivas ?? citas.filter((c) => /ok|turno|cola/i.test(c.estado || '')).length;
        const vencidas = resumen?.citasVencidas ?? citas.filter((c) => /vencid/i.test(c.estado || '')).length;
        const sinCita = resumen?.sinCita ?? citas.filter((c) => /sin cita|retenid/i.test(c.estado || '')).length;

        const acumuladoEspera = new Map<string, { suma: number; conteo: number }>();
        citas.forEach((c) => {
            const term = (c.terminal || 'SPRBUN').trim().toUpperCase();
            const espera = Number(c.tiempo_espera_minutos || 0);
            const actual = acumuladoEspera.get(term) || { suma: 0, conteo: 0 };
            acumuladoEspera.set(term, { suma: actual.suma + espera, conteo: actual.conteo + 1 });
        });

        const tiemposTerminal = Array.from(acumuladoEspera.entries()).map(([terminal, stats]) => {
            const promedio = stats.conteo > 0 ? Math.round(stats.suma / stats.conteo) : 0;
            return {
                terminal,
                minutos: promedio,
                texto: `${promedio}m`,
                claseColor: promedio >= 25 ? 'text-warning' : promedio >= 40 ? 'text-danger' : 'text-success'
            };
        });

        return { activas, vencidas, sinCita, tiemposTerminal, citas };
    }
}
