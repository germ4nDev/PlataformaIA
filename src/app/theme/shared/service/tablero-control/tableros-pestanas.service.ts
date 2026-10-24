/* eslint-disable @typescript-eslint/no-explicit-any */
/*
    Author: German Valencia
    Pattern: PORTTOS Client - Tableros por pestaña (PlataformaApiIA · GET /api/tableros/{granel,carga-suelta,capacidad,noticias}/:puerto)
    Una sola consulta por pestaña y puerto, compartida por todos sus widgets (shareReplay con refCount: cuando no queda
    ningún widget de la pestaña, se deja de consultar). Se refresca sola cada cierto tiempo y cuando el API avisa por
    socket ('tablero-actualizado' en la sala puerto:{PUERTO}:{modulo}) que llegó información nueva (ingesta o simulador).
    Los tipos reflejan el contrato de utils/{granel,carga-suelta,capacidad,noticias}.js del API.
*/
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, merge, of, timer } from 'rxjs';
import { catchError, debounceTime, filter, finalize, map, shareReplay, switchMap } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { SocketService } from '../sockets.service';

export type ModuloTablero = 'granel' | 'carga-suelta' | 'capacidad' | 'noticias';
export type Semaforo = 'verde' | 'amarillo' | 'rojo' | 'gris';

export interface KpiTablero {
    titulo: string; valor: number | string; unidad?: string; subtitulo?: string; colorBorde?: string; icono?: string;
    simulado?: boolean; valorCompleto?: string;
}
export interface SerieSimple { labels: string[]; valores: number[] }
export interface HistoricoMensual { labels: string[]; series: Record<string, number[]> }

export interface TableroGranel {
    puerto: string; generadoEn: string; simulado: boolean; kpis: Record<string, KpiTablero>;
    motonaves: Array<{
        idOperacion: number; motonave: string; terminal: string | null; muelle: string | null; tipo: string; producto: string | null;
        sentido: string; tmTotal: number; tmOperadas: number; avancePct: number; ritmoTmh: number; finEstimado: string | null;
        equipos: string[]; estado: string; simulado: boolean;
    }>;
    productos: SerieSimple;
    equipos: Array<{ codigo: string; tipo: string; descripcion: string | null; terminal: string | null; motonave: string | null; producto: string | null; rendimientoTmh: number | null; capacidadTmh: number | null; estado: string }>;
    bodegas: Array<{ id: number; nombre: string; producto: string; capacidad: number; inventario: number; porcentaje: number; semaforo: Semaforo }>;
    tendencia: SerieSimple & { total24h: number; pico: { hora: string; tmh: number } | null };
    historico: HistoricoMensual;
}

export interface FolioCargaSuelta {
    folio: string; producto: string; cliente: string | null; motonave: string | null; naviera: string | null; terminal: string | null;
    sentido: string; bultos: number | null; bultosRecibidos: number | null; tm: number | null; pesoUnitarioTm: number | null;
    dimensiones: string | null; equipoRequerido: string | null; ubicacion: string | null; requierePermiso: boolean;
    permisoAprobado: boolean | null; estado: string; fechaProgramada: string | null; simulado: boolean;
}
export interface TableroCargaSuelta {
    puerto: string; generadoEn: string; simulado: boolean; kpis: Record<string, KpiTablero>;
    breakBulk: FolioCargaSuelta[]; proyecto: FolioCargaSuelta[]; composicion: SerieSimple;
    patios: Array<{ id: string; nombre: string; capacidad: number; unidades: number; porcentaje: number; semaforo: Semaforo; marcas: string[] }>;
    roro: Array<{ motonave: string; naviera: string | null; terminal: string | null; muelle: string | null; producto: string | null; total: number; operadas: number; avancePct: number; eta: string | null; estado: string; activa: boolean; simulado: boolean }>;
    marcas: SerieSimple;
    indicadores: Array<{ codigo: string; nombre: string; valor: number | null; unidad: string; detalle: string; semaforo: Semaforo }>;
    historico: HistoricoMensual;
}

export interface NodoCapacidad {
    id: string; nombre: string; categoria: string; categoriaNombre: string; operador: string | null; unidad: string; capacidad: number;
    capacidadTexto: string; operaciones: string[]; ocupacionPct: number | null; semaforo: Semaforo; estado: string;
    ingresosH: number | null; salidasH: number | null; esperaMin: number | null; fechaDato: string | null; simulado: boolean;
}
export interface TableroCapacidad {
    puerto: string; generadoEn: string; simulado: boolean; kpis: Record<string, KpiTablero>;
    saturacion: SerieSimple; trafico: { labels: string[]; ingresos: number[]; salidas: number[] };
    nodos: NodoCapacidad[]; categorias: Array<{ codigo: string; nombre: string; nodos: number }>;
    tendencia: { labels: string[]; series: Array<{ categoria: string; valores: Array<number | null> }> };
    cobertura: { conDato: number; total: number };
}

export interface NoticiaTablero {
    id: string; titulo: string; resumen: string | null; url: string; medio: string | null; proveedor: string;
    categoria: string; categoriaNombre: string; delPuerto: boolean; fecha: string;
}
export interface TableroNoticias {
    puerto: string; generadoEn: string; kpis: Record<string, KpiTablero>;
    noticias: NoticiaTablero[]; categorias: Array<{ codigo: string; nombre: string; noticias: number }>;
    corredores: Array<{
        corredor: string; estado: string; semaforo: Semaforo; eventos: number; detalle: string;
        /** Eventos del día del corredor (vista ampliada) */
        lista?: Array<{ codigo: string | null; tipo: string | null; sector: string | null; descripcion: string | null; severidad: string | number | null; desde: string | null; lat: number | null; lon: number | null }>;
    }>;
    clima: Array<{ puerto: string; nombre: string; vientoNudos: number; temperatura: number; codigoTiempo: number; condicion: string }>;
    fuentes: Array<{ grupo: string; nombre: string; enlaces: Array<{ nombre: string; descripcion: string | null; url: string }> }>;
    trm: { valor: number; fecha: string; variacionPct: number | null } | null;
}

/** Detalle bajo demanda de la vista ampliada (Fase 3). */
export interface AvanceOperacion {
    operacion?: { idOperacion: number; motonave: string; producto: string | null; tipo: string; total: number; operadas: number; pendiente: number; finEstimado: string | null; simulado: boolean };
    labels: string[]; valores?: number[]; acumulado?: number[]; ritmoNecesarioTmh?: number | null;
    series?: Record<string, number[]>; unidad: string; horas: number;
}
export interface SerieNodo {
    idNodo: string; labels: string[]; ocupacionPct: Array<number | null>; ingresosH: Array<number | null>; salidasH: Array<number | null>;
    esperaMin: Array<number | null>; simulado: boolean; conDato: number; horas: number;
}
export interface SerieSimpleConFuente { labels: string[]; valores: number[]; fuente?: string }

/** Lo que reciben los widgets: los datos, o el motivo por el que no hay (p. ej. falta la migración 013). */
export interface EstadoTablero<T> { datos: T | null; error: string | null }

interface RespuestaApi<T> { ok: boolean; data: T }

/** Sala de socket de cada módulo (la del API: helpers/salas.helper.js). */
const SALA: Record<ModuloTablero, string> = { granel: 'granel', 'carga-suelta': 'suelta', capacidad: 'capacidad', noticias: 'noticias' };
const REFRESCO_MS: Record<ModuloTablero, number> = { granel: 60000, 'carga-suelta': 60000, capacidad: 120000, noticias: 300000 };
/** Prefijo de código de widget → módulo (lo usa kpi-card-tcl). */
export const PREFIJOS_TABLERO: Array<[string, ModuloTablero]> = [
    ['PTT_GRA_', 'granel'], ['PTT_SUE_', 'carga-suelta'], ['PTT_CAP_', 'capacidad'], ['PTT_NOT_', 'noticias']
];

@Injectable({ providedIn: 'root' })
export class TablerosPestanasService {
    private readonly base = `${environment.apiUrl}/tableros`;
    private readonly flujos = new Map<string, Observable<EstadoTablero<any>>>();

    constructor(private http: HttpClient, private socket: SocketService) { }

    /** Módulo al que pertenece un código de widget (PTT_GRA_..., PTT_SUE_..., PTT_CAP_..., PTT_NOT_...). */
    static moduloDe(codigoWidget: string): ModuloTablero | null {
        const c = (codigoWidget || '').trim().toUpperCase();
        return PREFIJOS_TABLERO.find(([p]) => c.startsWith(p))?.[1] ?? null;
    }

    /** Tablero vivo de una pestaña y un puerto (compartido entre widgets). */
    tablero<T>(modulo: ModuloTablero, puerto: string): Observable<EstadoTablero<T>> {
        const clave = SocketService.normalizarPuerto(puerto || 'BUENAVENTURA');
        const llave = `${modulo}|${clave}`;
        if (!this.flujos.has(llave)) {
            const dueno = `tablero-${modulo}`;
            const avisos$ = this.socket.listen<any>('tablero-actualizado').pipe(
                filter((e) => e?.modulo === SALA[modulo] && e?.puerto === clave),
                debounceTime(1500)
            );
            this.socket.unirseSalaPuerto(SALA[modulo], clave, dueno);
            const flujo$ = merge(timer(0, REFRESCO_MS[modulo]), avisos$).pipe(
                switchMap(() => this.http.get<RespuestaApi<T>>(`${this.base}/${modulo}/${encodeURIComponent(clave)}`).pipe(
                    map((r) => ({ datos: r?.data ?? null, error: null } as EstadoTablero<T>)),
                    catchError((e) => of({ datos: null, error: e?.error?.msg || 'No se pudo consultar el tablero' } as EstadoTablero<T>))
                )),
                finalize(() => {
                    this.flujos.delete(llave);
                    this.socket.salirSalaPuerto(SALA[modulo], dueno);
                }),
                shareReplay({ bufferSize: 1, refCount: true })
            );
            this.flujos.set(llave, flujo$);
        }
        return this.flujos.get(llave)! as Observable<EstadoTablero<T>>;
    }

    // ---------------------------------------------------------------- detalle de la vista ampliada (Fase 3)

    /** Avance de una operación de granel (con idOperacion) o por tipo, en 24, 72 o 168 h. */
    avanceGranel(puerto: string, horas: 24 | 72 | 168 = 24, idOperacion?: string | number | null): Observable<AvanceOperacion> {
        const params: Record<string, string> = { horas: String(horas) };
        if (idOperacion !== null && idOperacion !== undefined) params['idOperacion'] = String(idOperacion);
        return this.detalle<AvanceOperacion>('granel', puerto, 'avance', params);
    }

    /** Serie horaria de un nodo de capacidad. */
    serieNodo(puerto: string, idNodo: string, horas: 24 | 72 | 168 = 24): Observable<SerieNodo> {
        return this.detalle<SerieNodo>('capacidad', puerto, 'serie', { idNodo, horas: String(horas) });
    }

    /** TRM de los últimos días. */
    trm(puerto: string, dias = 30): Observable<SerieSimpleConFuente> {
        return this.detalle<SerieSimpleConFuente>('noticias', puerto, 'trm', { dias: String(dias) });
    }

    private detalle<T>(modulo: ModuloTablero, puerto: string, recurso: string, params: Record<string, string>): Observable<T> {
        const clave = SocketService.normalizarPuerto(puerto || 'BUENAVENTURA');
        return this.http.get<RespuestaApi<T>>(`${this.base}/${modulo}/${encodeURIComponent(clave)}/${recurso}`, { params }).pipe(map((r) => r.data));
    }

    /** KPI de un código de widget (contrato de kpi-card-tcl), o null si el tablero no lo trae. */
    kpi(codigoWidget: string, puerto: string): Observable<KpiTablero | { valor: number; subtitulo: string } | null> {
        const modulo = TablerosPestanasService.moduloDe(codigoWidget);
        if (!modulo) return of(null);
        const codigo = codigoWidget.trim().toUpperCase();
        return this.tablero<any>(modulo, puerto).pipe(
            map((e) => (e.error ? { valor: 0, subtitulo: e.error } : e.datos?.kpis?.[codigo] ?? null))
        );
    }
}
