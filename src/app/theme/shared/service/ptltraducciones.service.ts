/*
    Author: German Valencia
    OT-027: servicio de Utilidades › Traducciones (llaves de es.json, en.json… en el API, con su árbol MODULO.SUBMODULO.LLAVE).
*/
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, timer, switchMap, takeWhile } from 'rxjs';
import { environment } from 'src/environments/environment';

const base_url = environment.apiUrl;

export interface FilaTraduccion { llave: string; modulo: string; textos: Record<string, string | null>; protegida: boolean }
export interface RamaTraduccion { modulo: string; submodulos: string[] }
export interface ListaTraducciones { idiomas: string[]; ramas: RamaTraduccion[]; filas: FilaTraduccion[]; faltan: string[] }
/** CC-215: avance de la traducción de un idioma nuevo */
export interface TrabajoTraduccion { estado: 'traduciendo' | 'listo' | 'error'; total: number; hechas: number; sinTraducir: number; motivo: string | null }
/** CC-215: regla única de idiomas (activos en el maestro con archivo, español primero) y activos sin archivo */
export interface EstadoIdiomas {
    idiomas: string[];
    nombres: Record<string, string>;
    sinArchivo: { sigla: string; nombre: string; trabajo: TrabajoTraduccion | null }[];
    trabajos: Record<string, TrabajoTraduccion>;
    traductor: { ok: boolean; motivo?: string };
}

/** CC-215: ¿queda algún idioma traduciéndose? */
export const hayTraduccionEnCurso = (e: EstadoIdiomas | null): boolean => !!e?.sinArchivo?.some((x) => x.trabajo?.estado === 'traduciendo');

@Injectable({ providedIn: 'root' })
export class PtlTraduccionesService {
    constructor(private readonly http: HttpClient) {}

    listar(): Observable<ListaTraducciones> {
        return this.http.get<any>(`${base_url}/traducciones`).pipe(map((r) => ({ idiomas: r?.idiomas || [], ramas: r?.ramas || [], filas: r?.filas || [], faltan: r?.faltan || [] })));
    }

    arbol(idioma: string): Observable<any> {
        return this.http.get<any>(`${base_url}/traducciones/${idioma}`).pipe(map((r) => r?.traducciones || {}));
    }

    crear(llave: string, textos: Record<string, string>): Observable<any> {
        return this.http.post(`${base_url}/traducciones`, { llave, textos });
    }

    modificar(llave: string, textos: Record<string, string>): Observable<any> {
        return this.http.put(`${base_url}/traducciones`, { llave, textos });
    }

    eliminar(llave: string): Observable<any> {
        return this.http.delete(`${base_url}/traducciones`, { params: { llave } });
    }

    /** JSON que trae el build de la web (para sembrar en el API un idioma que todavía no tiene). */
    jsonDelBuild(idioma: string): Observable<any> {
        return this.http.get(`./assets/i18n/${idioma}.json`);
    }

    /** CC-208 / CC-215: crea los idiomas activos del maestro que falten, traducidos por la IA (en curso: enCurso); 'espanol' = copia del español */
    sincronizarIdiomas(modo?: 'espanol'): Observable<{ creados: string[]; enCurso: string[] }> {
        return this.http
            .post<any>(`${base_url}/traducciones/idiomas/sincronizar`, modo ? { modo } : {})
            .pipe(map((r) => ({ creados: r?.creados || [], enCurso: r?.enCurso || [] })));
    }

    /** CC-215: idiomas editables, activos sin archivo y avance de su traducción */
    estadoIdiomas(): Observable<EstadoIdiomas> {
        return this.http.get<any>(`${base_url}/traducciones/idiomas/estado`).pipe(
            map((r) => ({ idiomas: r?.idiomas || ['es'], nombres: r?.nombres || {}, sinArchivo: r?.sinArchivo || [], trabajos: r?.trabajos || {}, traductor: r?.traductor || { ok: false } }))
        );
    }

    /** CC-215: el estado cada 4 s mientras haya un idioma traduciéndose (emite también el último, ya terminado) */
    seguirTraduccion(): Observable<EstadoIdiomas> {
        return timer(0, 4000).pipe(
            switchMap(() => this.estadoIdiomas()),
            takeWhile((e) => hayTraduccionEnCurso(e), true)
        );
    }

    sembrar(idioma: string, arbol: any): Observable<any> {
        return this.http.post(`${base_url}/traducciones/${idioma}/sembrar`, { arbol });
    }
}
