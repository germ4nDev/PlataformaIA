/* eslint-disable @typescript-eslint/no-explicit-any */
/*
    Author: German Valencia
    Service: PORTTOS Virtual Gate Service
*/
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, shareReplay } from 'rxjs/operators';
import { FiltroTableroService } from './filtro-tablero.service';
import { environment } from 'src/environments/environment';

@Injectable({
    providedIn: 'root'
})
export class VirtualGateService {
    private readonly baseApi: string;
    private gateCachePorPuerto$ = new Map<string, Observable<any>>();

    constructor(
        private http: HttpClient,
        private _filtroTablero: FiltroTableroService
    ) {
        const rawUrl = (environment.apiUrl || 'http://localhost:3000/api').replace(/\/+$/, '');
        this.baseApi = rawUrl.endsWith('/virtual-gate')
            ? rawUrl
            : `${rawUrl}/virtual-gate`;
    }

    private resolverPuertoReal(puertoCandidato?: any): string {
        if (!puertoCandidato || typeof puertoCandidato === 'object') {
            return (this._filtroTablero.getCiudadActual() || 'BUENAVENTURA').toString().trim().toUpperCase();
        }

        const limpio = String(puertoCandidato).trim().toUpperCase();

        if (limpio.startsWith('PTT_') || limpio.startsWith('TLC_') || limpio.includes('[OBJECT OBJECT]')) {
            return (this._filtroTablero.getCiudadActual() || 'BUENAVENTURA').toString().trim().toUpperCase();
        }

        return limpio;
    }

    public obtenerColaGate(puerto?: string, forzarRefresco: boolean = false): Observable<any> {
        const puertoFinal = this.resolverPuertoReal(puerto);

        if (forzarRefresco || !this.gateCachePorPuerto$.has(puertoFinal)) {
            const params = new HttpParams().set('puerto', puertoFinal);

            const request$ = this.http.get<any>(this.baseApi, { params }).pipe(
                map((res: any) => this.procesarRespuesta(res, puertoFinal)),
                catchError((err) => {
                    console.error('❌ [Error API Virtual Gate]:', err);
                    this.gateCachePorPuerto$.delete(puertoFinal);
                    return of({ ok: false, puerto: puertoFinal, virtualGate: this.generarVirtualGateVacio() });
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
                const vg = resp?.virtualGate || this.generarVirtualGateVacio();

                switch (codigo) {
                    case 'PTT_GATE_CHRT_CITAS': return { ...(vg.citas12h || {}), origen: vg.origen };
                    case 'PTT_GATE_CHRT_DIST': return { ...(vg.distribucion10km || {}), origen: vg.origen };
                    // Los paneles reciben su nodo + las citas (para derivar lo que el backend no trae)
                    case 'PTT_GATE_PANEL_ALERTAS': return { alertas: vg.alertas || [], totalAlertas: vg.totalAlertas, citas: vg.citas || [], origen: vg.origen };
                    case 'PTT_GATE_PANEL_ESTADO': return { ...(vg.estadoCitas || {}), citas: vg.citas || [], origen: vg.origen };
                    case 'PTT_GATE_PANEL_VAL': return { ...(vg.validacion || {}), citas: vg.citas || [], origen: vg.origen };
                    case 'PTT_GATE_TAB_COLA':
                    case 'PTT_GATE_TABLA_COLA': return vg.citas;
                    default: {
                        // Corregido 2026-10-17: las 10 tarjetas PTT_GATE_KPI_* recibían el objeto completo (sin 'valor')
                        // y mostraban 0 / "Métrica Clave".
                        const kpi = this.kpiGate(codigo, vg.resumen || {});
                        return kpi ? { ...kpi, ...this.detalleKpiGate(codigo, vg.citas || []), origen: vg.origen } : vg;
                    }
                }
            })
        );
    }

    /**
     * 🟢 LA CORRECCIÓN ESTÁ AQUÍ: Buscamos dentro de virtualGate correctamente
     */
    private procesarRespuesta(res: any, puerto: string): any {
        const rawData = res?.data || {};

        // Extraemos de rawData.virtualGate (que es lo que manda tu backend en la captura)
        const fuenteDatos = rawData.virtualGate || rawData;

        // Extraemos las citas desde la ruta correcta
        const citasCrudas = Array.isArray(fuenteDatos.citas)
            ? fuenteDatos.citas
            : (Array.isArray(rawData.citas) ? rawData.citas : []);

        const resumenBackend = fuenteDatos.resumen || rawData.resumen || {};

        // Normalizamos
        // Corregido 2026-10-23: el front ya no completa datos que faltan (transportador, terminal, fecha = ahora...):
        // lo que no viene queda vacío y la vista lo muestra como '—'. El API marca esos campos en `imputados`.
        const mayus = (v: any) => (v === null || v === undefined || v === '' ? null : String(v).toUpperCase());
        const citas = citasCrudas.map((c: any, idx: number) => ({
            ...c,
            id_cita: c.id_cita || `VG-${100 + idx}`,
            placa: mayus(c.placa),
            transportador: c.transportador || c.empresa || null,
            empresa: c.transportador || c.empresa || null,
            tipo_carga: mayus(c.tipo_carga),
            operacion: mayus(c.operacion),
            terminal: mayus(c.terminal),
            ubicacion: c.ubicacion || null,
            estado: String(c.estado || 'SIN_ESTADO').trim(),
            tiempo_espera_minutos: Number(c.tiempo_espera_minutos ?? c.tiempo_espera ?? 0),
            fecha_hora_cita: c.fecha_hora_cita || null
        }));

        // Construimos
        const virtualGate = {
            resumen: this.calcularResumenKpis(citas, resumenBackend),
            citas: citas,
            citas12h: fuenteDatos.citas12h || this.calcularCitasPorHoraTerminal(citas),
            distribucion10km: fuenteDatos.distribucion10km || this.calcularDistribucion10Km(citas),
            estadoCitas: fuenteDatos.estadoCitas || this.calcularEstadoCitasYEspera(citas, resumenBackend),
            validacion: fuenteDatos.validacion || this.calcularValidacionPregate(citas, resumenBackend),
            alertas: fuenteDatos.alertas || this.calcularAlertasGate(citas),
            totalAlertas: fuenteDatos.totalAlertas ?? (fuenteDatos.alertas || []).length,
            origen: fuenteDatos.origen || null
        };

        return { ...res, ok: true, puerto, virtualGate };
    }

    /** Tarjeta {titulo, valor, subtitulo, colorBorde} para cada código PTT_GATE_KPI_*; null si no es KPI. */
    private kpiGate(codigo: string, r: any): any {
        const n = (v: any) => (v === null || v === undefined || v === '' ? 0 : v);
        const mapa: { [k: string]: any } = {
            PTT_GATE_KPI_OP: { titulo: 'CAMIONES EN GATE', valor: n(r.totalCamiones), subtitulo: `${n(r.validados)} validados · ${n(r.enCola)} en cola`, colorBorde: 'borde-cyan' },
            PTT_GATE_KPI_CONT: { titulo: 'CONTENEDORES', valor: n(r.totalContenedores), subtitulo: r.subtituloContenedores || '', colorBorde: 'borde-amarillo' },
            PTT_GATE_KPI_GRANEL: { titulo: 'GRANEL (TON)', valor: n(r.totalGranel), subtitulo: r.subtituloGranel || '', colorBorde: 'borde-naranja' },
            PTT_GATE_KPI_SUELTA: { titulo: 'CARGA SUELTA (TON)', valor: n(r.totalCargaSuelta), subtitulo: r.subtituloCargaSuelta || '', colorBorde: 'borde-green' },
            PTT_GATE_KPI_RORO: { titulo: 'VEHÍCULOS RO-RO', valor: n(r.totalRoro), subtitulo: r.subtituloRoro || '', colorBorde: 'borde-teal' },
            PTT_GATE_KPI_BODEGAS: { titulo: 'SATURACIÓN BODEGAS', valor: r.saturacionBodegas || '—', subtitulo: r.subtituloBodegas || '', colorBorde: 'borde-purple' },
            PTT_GATE_KPI_SUB_CONT: { titulo: 'CAMIONES CONTENEDOR', valor: n(r.subContenedores), subtitulo: 'Citas de contenedores', colorBorde: 'borde-amarillo' },
            PTT_GATE_KPI_SUB_GRANEL: { titulo: 'CAMIONES GRANEL', valor: n(r.subGranel), subtitulo: 'Citas de granel', colorBorde: 'borde-naranja' },
            PTT_GATE_KPI_SUB_SUELTA: { titulo: 'CAMIONES CARGA SUELTA', valor: n(r.subCargaSuelta), subtitulo: 'Citas de carga suelta', colorBorde: 'borde-green' },
            PTT_GATE_KPI_SUB_NINERAS: { titulo: 'NIÑERAS / RO-RO', valor: n(r.subNineras), subtitulo: 'Citas de vehículos', colorBorde: 'borde-teal' }
        };
        return mapa[codigo] ?? null;
    }

    /**
     * Vista ampliada de los KPI del gate (2026-10-24): desglose con las citas que ya llegan (por estado o por
     * terminal) y su definición. Toneladas solo con peso de báscula.
     */
    private detalleKpiGate(codigo: string, citas: any[]): { desglose: any[]; definicion: string } {
        const final = (c: any) => /FINALIZADO|CANCELADO|ATENDIDO|SALI/.test(String(c.estado || ''));
        const tipo: Record<string, (c: any) => boolean> = {
            CONT: (c) => String(c.tipo_carga || '').includes('CONT'),
            GRANEL: (c) => String(c.tipo_carga || '').includes('GRANEL'),
            SUELTA: (c) => /SUELTA|GENERAL/.test(String(c.tipo_carga || '')),
            RORO: (c) => /RORO|VEH|NI[ÑN]ERA/.test(String(c.tipo_carga || ''))
        };
        const agrupar = (lista: any[], clave: (c: any) => string, valor: (c: any) => number = () => 1, unidad = 'citas') => {
            const m = new Map<string, number>();
            lista.forEach((c) => m.set(clave(c) || 'SIN DATO', (m.get(clave(c) || 'SIN DATO') || 0) + valor(c)));
            return [...m.entries()].sort((a, b) => b[1] - a[1]).map(([etiqueta, v]) => ({ etiqueta, valor: Math.round(v * 10) / 10, unidad }));
        };
        const sub = codigo.replace('PTT_GATE_KPI_', '');
        if (sub === 'OP') {
            return { desglose: agrupar(citas.filter((c) => !final(c)), (c) => c.estado), definicion: 'Camiones con cita activa en la ventana de 48 h, por estado.' };
        }
        const base = sub.replace('SUB_', '').replace('NINERAS', 'RORO');
        const filtro = tipo[base];
        if (!filtro) return { desglose: [], definicion: '' };
        const lista = citas.filter(filtro);
        if (sub.startsWith('SUB_')) {
            return { desglose: agrupar(lista.filter((c) => !final(c)), (c) => c.estado), definicion: 'Citas activas del tipo de carga, por estado.' };
        }
        if (base === 'GRANEL' || base === 'SUELTA') {
            return {
                desglose: agrupar(lista.filter((c) => c.peso_bascula_ton !== null && c.peso_bascula_ton !== undefined), (c) => c.terminal, (c) => Number(c.peso_bascula_ton) || 0, 't'),
                definicion: 'Toneladas con peso de báscula por terminal (las citas sin pesaje no suman).'
            };
        }
        return { desglose: agrupar(lista, (c) => c.terminal), definicion: 'Citas del tipo de carga en la ventana de 48 h, por terminal.' };
    }

    private generarVirtualGateVacio(): any {
        return {
            resumen: {},
            citas: [],
            citas12h: { labels: [], datasets: [], categories: [], series: [] },
            distribucion10km: { labels: [], valores: [], items: [], total: 0 },
            estadoCitas: null,
            validacion: null,
            alertas: []
        };
    }

    // --- MÉTODOS DE CÁLCULO MANTENIDOS INTACTOS ---
    private calcularResumenKpis(citas: any[], rBackend: any): any {
        const contList = citas.filter(c => c.tipo_carga.includes('CONT'));
        const granelList = citas.filter(c => c.tipo_carga.includes('GRANEL'));
        const sueltaList = citas.filter(c => c.tipo_carga.includes('SUELTA') || c.tipo_carga.includes('GEN'));
        const roroList = citas.filter(c => c.tipo_carga.includes('RORO') || c.tipo_carga.includes('VEH') || c.tipo_carga.includes('NIÑERA'));

        const totalCamiones = rBackend.totalCamiones ?? citas.length;
        const validados = rBackend.validados ?? citas.filter(c => c.estado.toUpperCase().includes('VALID')).length;
        const enCola = rBackend.enCola ?? citas.filter(c => c.estado.toUpperCase().includes('COLA')).length;

        // Corregido 2026-10-17: antes estos cálculos de respaldo PISABAN lo que enviaba el backend
        // (contenedores = mitad de los camiones, granel = conteo × 34, subtítulo fijo de TCBUEN).
        // Ahora solo se usan cuando el backend no trae el dato.
        const respaldo = {
            totalCamiones,
            validados,
            enCola,
            totalContenedores: contList.length,
            subtituloContenedores: `${validados} validados · ${enCola} en cola`,
            totalGranel: 0,
            subtituloGranel: `${granelList.length} camiones granel`,
            totalCargaSuelta: 0,
            subtituloCargaSuelta: `${sueltaList.length} turnos carga suelta`,
            totalRoro: roroList.length,
            subtituloRoro: 'Unidades en enturnamiento',
            saturacionBodegas: '0%',
            subtituloBodegas: '',
            subContenedores: contList.length,
            subGranel: granelList.length,
            subCargaSuelta: sueltaList.length,
            subNineras: roroList.length
        };
        const definidos = Object.fromEntries(Object.entries(rBackend || {}).filter(([, v]) => v !== null && v !== undefined && v !== ''));
        return { ...respaldo, ...definidos };
    }

    private calcularCitasPorHoraTerminal(citas: any[]): any {
        if (!citas.length) return { labels: [], datasets: [], categories: [], series: [] };
        const horasMap = new Map<string, Record<string, number>>();
        const terminalesSet = new Set<string>();

        citas.forEach((c) => {
            const d = new Date(c.fecha_hora_cita);
            const horaLabel = !isNaN(d.getTime()) ? `${String(d.getHours()).padStart(2, '0')}:00` : '08:00';
            const terminal = c.terminal || 'TCBUEN';

            terminalesSet.add(terminal);
            if (!horasMap.has(horaLabel)) horasMap.set(horaLabel, {});
            const grupo = horasMap.get(horaLabel)!;
            grupo[terminal] = (grupo[terminal] || 0) + 1;
        });

        const labels = Array.from(horasMap.keys()).sort();
        const terminales = Array.from(terminalesSet);

        const datasets = terminales.map((term) => ({
            label: term,
            name: term,
            data: labels.map((h) => horasMap.get(h)?.[term] || 0)
        }));

        return { labels, categories: labels, datasets, series: datasets };
    }

    private calcularDistribucion10Km(citas: any[]): any {
        if (!citas.length) return { labels: [], valores: [], data: [], items: [], total: 0 };
        const conteoPorUbicacion = new Map<string, number>();
        citas.forEach((c) => {
            const ub = String(c.ubicacion || 'Zona Enturnamiento').trim();
            conteoPorUbicacion.set(ub, (conteoPorUbicacion.get(ub) || 0) + 1);
        });

        const labels = Array.from(conteoPorUbicacion.keys());
        const valores = Array.from(conteoPorUbicacion.values());
        const total = valores.reduce((a, b) => a + b, 0);

        const items = labels.map((label, idx) => ({
            label, nombre: label, valor: valores[idx],
            porcentaje: total > 0 ? Number(((valores[idx] / total) * 100).toFixed(1)) : 0
        }));

        return { labels, valores, data: valores, series: valores, total, items };
    }

    private calcularEstadoCitasYEspera(citas: any[], rBackend: any): any {
        return {
            total: citas.length,
            enVentana: rBackend.validados || citas.filter((c) => ['VALIDADO', 'CONFIRMADA'].includes(c.estado.toUpperCase())).length,
            enCola: rBackend.enCola || citas.filter((c) => ['EN COLA', 'ENTURNADO'].includes(c.estado.toUpperCase())).length,
            vencidas: citas.filter((c) => c.estado.toUpperCase().includes('VENCID') || c.tiempo_espera_minutos > 45).length,
            retenidos: rBackend.retenidos || citas.filter((c) => c.estado.toUpperCase().includes('RETEN')).length,
            // Corregido 2026-10-17: sin dato del backend ya no se inventan 18/12/9 min (el widget los calcula de las citas)
            tiempoMedioTCBUEN: rBackend.tiempoMedioTCBUEN ?? undefined,
            tiempoMedioSPRBUN: rBackend.tiempoMedioSPRBUN ?? undefined,
            tiempoMedioAGUADULCE: rBackend.tiempoMedioAGUADULCE ?? undefined
        };
    }

    private calcularValidacionPregate(citas: any[], rBackend: any): any {
        const total = rBackend.totalCamiones ?? citas.length;
        const validados = rBackend.validados ?? 0;
        return {
            totalCamiones: total,
            validados,
            enCola: rBackend.enCola ?? 0,
            retenidos: rBackend.retenidos ?? 0,
            porcentajeValidados: total > 0 ? Math.round((validados / total) * 100) : 0,
            citas
        };
    }

    private calcularAlertasGate(citas: any[]): any[] {
        const alertas: any[] = [];
        citas.forEach((c) => {
            if (c.estado.toUpperCase().includes('RETEN')) {
                alertas.push({ severidad: 'CRITICO', titulo: `Camión ${c.placa} — RETENIDO`, subtitulo: `${c.ubicacion} · ${c.transportador}`, tiempo: `${c.tiempo_espera_minutos} min` });
            } else if (c.tiempo_espera_minutos >= 25) {
                alertas.push({ severidad: 'ALERTA', titulo: `Demora en gate ${c.terminal}`, subtitulo: `${c.tiempo_espera_minutos} min de espera · ${c.transportador}`, tiempo: `${c.tiempo_espera_minutos} min` });
            }
        });
        return alertas;
    }

    public limpiarCachePuerto(puerto?: string): void {
        if (puerto) this.gateCachePorPuerto$.delete(puerto.trim().toUpperCase());
        else this.gateCachePorPuerto$.clear();
    }
}
