/*
    Author: German Valencia
    Pattern: PORTTOS Client - Capa de análisis con IA (PlataformaApiIA · /api/analisis-ia)
      panel(puerto)            alertas tempranas y tendencias vigentes, último resumen del turno y estado de la capa
      historial(puerto, dias)  todos los hallazgos de los últimos días (vista ampliada)
      feedback(id, util)       «Útil» → CONFIRMADO · «No era» → FALSO
      cambios(puerto)          aviso 'ia-hallazgo' de la sala puerto:{PUERTO}:mapa (turno nuevo, resumen nuevo o voto)
    Fase 4:
      tendencias(puerto, ...)  tendencias de 24 h, 7 días y 30 días por KPI (sin modelo)
      resumenes(puerto, dias)  cierres de turno y resúmenes diarios · generarResumen(puerto, tipo) rehace el último
      admin*                   panel de administración: resumen, configuración por puerto y tarea, prompts
    Los tipos reflejan services/ia/analista.service.js. El token lo agrega el AuthInterceptor.
*/
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { SocketService } from '../sockets.service';

export type SeveridadIA = 'info' | 'atencion' | 'critica';
export type EstadoHallazgoIA = 'PROPUESTO' | 'PUBLICADO' | 'CONFIRMADO' | 'DESCARTADO' | 'FALSO';

export interface HallazgoIA {
    id: number;
    puerto: string;
    clase: 'ALERTA' | 'TENDENCIA' | 'RESUMEN';
    tipo: string;
    entidad: string | null;
    severidad: SeveridadIA | null;
    confianza: number | null;
    horizonteMinH: number | null;
    horizonteMaxH: number | null;
    titulo: string;
    explicacion: string | null;
    accionSugerida: string | null;
    evidencia: string[];
    estado: EstadoHallazgoIA;
    vigenteHasta: string | null;
    resultado: string | null;
    fecha: string;
}

export interface EstadoCapaIA {
    disponible: boolean;
    motivo?: string;
    habilitada: boolean;
    apagadaPor?: 'env' | 'panel' | null;
    modoSombra: boolean;
    tiposPublicar: string[];
    cortacircuitoAbierto: boolean;
    cortacircuitoHasta: string | null;
    intervaloMin: number;
    ultimoTurno: { fecha: string; estado: string | null; motivo: string | null } | null;
}

export interface PanelIA {
    puerto: string;
    nombre: string;
    fecha: string;
    estado: EstadoCapaIA;
    alertas: HallazgoIA[];
    tendencias: HallazgoIA[];
    resumen: HallazgoIA | null;
}

// ── Fase 5: asistente ────────────────────────────────────────────────────────────────────────────────
export type EstadoPreguntaIA = 'RESPONDIDA' | 'SIN_DATOS' | 'RECHAZADA' | 'APAGADO' | 'TOPE_USUARIO' | 'OMITIDA_PRESUPUESTO' | 'CORTACIRCUITO' | 'ERROR' | 'INVALIDA' | 'OMITIDA_APAGADA';
export interface RespuestaAsistenteIA {
    id: number | null; estado: EstadoPreguntaIA; puerto: string | null; decision: 'dentro' | 'frontera' | 'fuera' | null; tema: string | null;
    motivo?: string; respuesta: string; fuentes: Array<{ herramienta: string; detalle: string }>; sugerencias: string[];
    verificacion: { ok: boolean; sinRespaldo: number[]; revisadas: number } | null; herramientas: string[];
}
export interface TurnoAsistenteIA { pregunta: string; respuesta: string }

// ── Fase 4 ───────────────────────────────────────────────────────────────────────────────────────────
export type VentanaTendencia = '24h' | '7d' | '30d';
export type EfectoTendencia = 'empeora' | 'mejora' | 'neutral' | 'estable' | 'sin_datos';
export interface TendenciaVentana {
    id: string; ventana: VentanaTendencia; actual: number | null; referencia: number | null; ultimo: number | null;
    cambioPct: number | null; pendienteDia: number | null; cobertura: number;
    direccion: 'sube' | 'baja' | 'estable' | 'sin_datos'; efecto: EfectoTendencia; relevante: boolean; puntaje: number;
    enUmbral: boolean; simulado: boolean; lectura: string; puntos: Array<number | null>;
}
export interface TendenciaKpi {
    codigo: string; modulo: string; titulo: string; unidad: string; deseable: 'bajo' | 'alto' | null;
    umbrales: { atencion: number; critico: number; sentido: string } | null;
    ventanas: Partial<Record<VentanaTendencia, TendenciaVentana>>;
}
export interface TendenciaDestacada extends TendenciaVentana { codigo: string; modulo: string; titulo: string; unidad: string }
export interface TendenciasIA {
    puerto: string; nombre: string; generadoEn: string; disponible: boolean; motivo?: string; conDatos?: number;
    ventanas: Array<{ codigo: VentanaTendencia; nombre: string; contra: string }>;
    kpis: TendenciaKpi[]; destacadas: TendenciaDestacada[];
}
export interface ContenidoResumenIA {
    titular: string; loQuePaso: string[]; loQueViene: string[]; vigilar: string[];
    tendencias: Array<Partial<TendenciaDestacada> & { id: string; explicacion: string; kpi?: string }>;
    evidencia: string[]; origen: 'modelo' | 'automatico'; modelo: string | null;
    periodo: { tipo: 'cierre_turno' | 'resumen_diario'; clave: string; desde: string; hasta: string; etiqueta: string };
    conteos: Record<string, number>; externo?: { noticias: Array<{ titulo: string; medio: string | null }>; trm: any };
    quitadas: string[]; manual?: boolean;
}
export interface ResumenIA {
    id: number; puerto: string; tipo: 'cierre_turno' | 'resumen_diario'; clave: string; titulo: string; explicacion: string;
    estado: EstadoHallazgoIA; resultado: string | null; fecha: string; evidencia: string[]; contenido: ContenidoResumenIA;
}
export interface ConfigEfectivaIA {
    habilitada: boolean; activa: boolean; modoSombra: boolean; topeLlamadasDia: number; topeTokensDia: number;
    confianzaMinima: number; tiposPublicar: string[]; origen: Record<string, 'env' | '*' | 'puerto'>;
}
export interface FilaConfigIA {
    id?: number; puerto: string; codigoTarea: string; activo: boolean | null; modoSombra: boolean | null;
    topeLlamadasDia: number | null; topeTokensDia: number | null; confianzaMinima: number | null; tiposPublicar: string[] | null;
    modificadoPor?: string | null; fechaModificacionIso?: string | null;
}
export interface UsoTareaIA {
    llamadas: number; omitidas: number; errores: number; invalidas: number; tokensEntrada: number; tokensSalida: number;
    tokensCache: number; costoUsd: number; latenciaMediaMs: number | null;
}
export interface AdminResumenIA {
    generadoEn: string; dias: number; disponible: boolean; env: any; cerebro: any; verificacion: any; resumenes: any;
    consumo: { total: UsoTareaIA; porDia: Array<{ dia: string; llamadas: number; costoUsd: number; tokens: number }> };
    puertos: Array<{
        puerto: string; nombre: string;
        tareas: Record<string, ConfigEfectivaIA & { uso: UsoTareaIA | null }>;
        hallazgos: { alertas: number; publicadas: number; descartadas: number; resumenes: number };
        precision: { alertas: number; seCumplieron: number; noSeCumplieron: number; votosUtiles: number; votosNoEra: number; precisionPct: number | null; utilPct: number | null };
        precisionPorTipo: any[];
        ultimoTurno: { fecha: string; estado: string; motivo: string | null } | null;
    }>;
}
export interface AdminConfigIA {
    esquema017: boolean; tareas: Record<string, { nombre: string; descripcion: string }>; tiposAlerta: string[]; env: any;
    filas: FilaConfigIA[]; puertos: Array<{ clave: string; nombre: string }>;
    efectiva: Array<{ puerto: string; tareas: Record<string, ConfigEfectivaIA> }>;
}
export interface PromptIA {
    id?: number; codigoTarea: string; version: number; estado?: 'BORRADOR' | 'ACTIVO' | 'RETIRADO'; origen?: string;
    modelo: string; temperatura: number; maxTokens: number; sistema: string; esquemaSalida: string; nota?: string | null;
    creadoPor?: string; fechaCreacion?: string;
}
export interface AdminPromptsIA {
    disponible: boolean; tareas: Record<string, { nombre: string; descripcion: string }>;
    incorporados: PromptIA[]; versiones: PromptIA[];
    activos: Record<string, { origen: string; id?: number; version: number }>;
    creado?: { id: number; version: number };
}

export interface AvisoHallazgoIA { puerto: string; id?: number | null; estado?: EstadoHallazgoIA; feedback?: boolean; resumen?: string; fecha?: string }

interface RespuestaApi<T> { ok: boolean; data: T }

@Injectable({ providedIn: 'root' })
export class AnalisisIAService {
    private readonly base = `${environment.apiUrl}/analisis-ia`;
    private contador = 0;

    constructor(private http: HttpClient, private socket: SocketService) { }

    panel(puerto: string): Observable<PanelIA> {
        return this.http.get<RespuestaApi<PanelIA>>(`${this.base}/${encodeURIComponent(puerto)}/panel`).pipe(map((r) => r.data));
    }

    historial(puerto: string, dias = 7, limite = 200): Observable<HallazgoIA[]> {
        const params = new HttpParams().set('dias', String(dias)).set('limite', String(limite));
        return this.http.get<RespuestaApi<HallazgoIA[]>>(`${this.base}/${encodeURIComponent(puerto)}/hallazgos`, { params }).pipe(map((r) => r.data));
    }

    feedback(id: number, util: boolean, comentario?: string): Observable<{ id: number; estado: EstadoHallazgoIA; util: boolean }> {
        return this.http
            .post<RespuestaApi<{ id: number; estado: EstadoHallazgoIA; util: boolean }>>(`${this.base}/hallazgos/${id}/feedback`, { util, comentario: comentario || null })
            .pipe(map((r) => r.data));
    }

    tendencias(puerto: string, opciones: { ventana?: VentanaTendencia; modulo?: string; relevantes?: boolean } = {}): Observable<TendenciasIA> {
        let params = new HttpParams();
        if (opciones.ventana) params = params.set('ventana', opciones.ventana);
        if (opciones.modulo) params = params.set('modulo', opciones.modulo);
        if (opciones.relevantes) params = params.set('relevantes', '1');
        return this.http.get<RespuestaApi<TendenciasIA>>(`${this.base}/${encodeURIComponent(puerto)}/tendencias`, { params }).pipe(map((r) => r.data));
    }

    resumenes(puerto: string, dias = 7, tipo?: 'cierre_turno' | 'resumen_diario'): Observable<{ puerto: string; disponible: boolean; motivo?: string; resumenes: ResumenIA[] }> {
        let params = new HttpParams().set('dias', String(dias));
        if (tipo) params = params.set('tipo', tipo);
        return this.http.get<RespuestaApi<{ puerto: string; disponible: boolean; motivo?: string; resumenes: ResumenIA[] }>>(`${this.base}/${encodeURIComponent(puerto)}/resumenes`, { params })
            .pipe(map((r) => r.data));
    }

    generarResumen(puerto: string, tipo: 'cierre_turno' | 'resumen_diario' = 'cierre_turno'): Observable<any> {
        return this.http.post<RespuestaApi<any>>(`${this.base}/${encodeURIComponent(puerto)}/resumenes`, { tipo }).pipe(map((r) => r.data));
    }

    /** Análisis a demanda del puerto (respeta IA_ENABLED, la config del puerto y el presupuesto). */
    analizar(puerto: string): Observable<any> {
        return this.http.post<RespuestaApi<any>>(`${this.base}/${encodeURIComponent(puerto)}/analizar`, {}).pipe(map((r) => r.data));
    }

    /** Asistente de Porttos (fase 5): solo responde dentro del marco de alcance del proceso logístico portuario. */
    preguntar(pregunta: string, opciones: { puerto?: string | null; pestana?: string | null; historial?: TurnoAsistenteIA[] } = {}): Observable<RespuestaAsistenteIA> {
        const body = { pregunta, puerto: opciones.puerto || null, pestana: opciones.pestana || null, historial: (opciones.historial || []).slice(-4) };
        return this.http.post<RespuestaApi<RespuestaAsistenteIA>>(`${this.base}/asistente/preguntar`, body).pipe(map((r) => r.data));
    }

    calificarRespuesta(id: number, util: boolean, comentario?: string): Observable<{ id: number; util: boolean }> {
        return this.http.post<RespuestaApi<{ id: number; util: boolean }>>(`${this.base}/asistente/preguntas/${id}/feedback`, { util, comentario: comentario || null })
            .pipe(map((r) => r.data));
    }

    adminAsistente(dias = 7, decision?: string): Observable<any> {
        let params = new HttpParams().set('dias', String(dias));
        if (decision) params = params.set('decision', decision);
        return this.http.get<RespuestaApi<any>>(`${this.base}/admin/asistente`, { params }).pipe(map((r) => r.data));
    }

    adminAlcance(): Observable<any> {
        return this.http.get<RespuestaApi<any>>(`${this.base}/admin/alcance`).pipe(map((r) => r.data));
    }

    adminGuardarTema(tema: any): Observable<any> {
        return this.http.put<RespuestaApi<any>>(`${this.base}/admin/alcance`, tema).pipe(map((r) => r.data));
    }

    adminProbarAlcance(pregunta: string): Observable<any> {
        return this.http.post<RespuestaApi<any>>(`${this.base}/admin/alcance/probar`, { pregunta }).pipe(map((r) => r.data));
    }

    // ── administración ────────────────────────────────────────────────────────────────────────────────
    adminResumen(dias = 7): Observable<AdminResumenIA> {
        return this.http.get<RespuestaApi<AdminResumenIA>>(`${this.base}/admin/resumen`, { params: new HttpParams().set('dias', String(dias)) }).pipe(map((r) => r.data));
    }

    adminConfig(): Observable<AdminConfigIA> {
        return this.http.get<RespuestaApi<AdminConfigIA>>(`${this.base}/admin/config`).pipe(map((r) => r.data));
    }

    adminGuardarConfig(fila: FilaConfigIA): Observable<AdminConfigIA> {
        return this.http.put<RespuestaApi<AdminConfigIA>>(`${this.base}/admin/config`, fila).pipe(map((r) => r.data));
    }

    adminRestablecerConfig(puerto: string, codigoTarea: string): Observable<AdminConfigIA> {
        return this.http.post<RespuestaApi<AdminConfigIA>>(`${this.base}/admin/config/restablecer`, { puerto, codigoTarea }).pipe(map((r) => r.data));
    }

    adminPrompts(tarea?: string): Observable<AdminPromptsIA> {
        const params = tarea ? new HttpParams().set('tarea', tarea) : undefined;
        return this.http.get<RespuestaApi<AdminPromptsIA>>(`${this.base}/admin/prompts`, { params }).pipe(map((r) => r.data));
    }

    adminCrearPrompt(prompt: Partial<PromptIA>): Observable<AdminPromptsIA> {
        return this.http.post<RespuestaApi<AdminPromptsIA>>(`${this.base}/admin/prompts`, prompt).pipe(map((r) => r.data));
    }

    adminEstadoPrompt(id: number, estado: 'ACTIVO' | 'RETIRADO'): Observable<AdminPromptsIA> {
        return this.http.put<RespuestaApi<AdminPromptsIA>>(`${this.base}/admin/prompts/${id}/estado`, { estado }).pipe(map((r) => r.data));
    }

    /** Avisos 'ia-hallazgo' del puerto. Mientras haya suscriptores, el cliente está en la sala puerto:{PUERTO}:mapa. */
    cambios(puerto: string): Observable<AvisoHallazgoIA> {
        const clave = SocketService.normalizarPuerto(puerto);
        return new Observable<AvisoHallazgoIA>((suscriptor) => {
            const dueno = `analista-ia-${++this.contador}`;
            this.socket.unirseSalaPuerto('mapa', clave, dueno);
            const sub = this.socket.listen<AvisoHallazgoIA>('ia-hallazgo').subscribe((aviso) => {
                if (SocketService.normalizarPuerto(aviso?.puerto || '') === clave) suscriptor.next(aviso);
            });
            return () => {
                sub.unsubscribe();
                this.socket.salirSalaPuerto('mapa', dueno);
            };
        });
    }
}
