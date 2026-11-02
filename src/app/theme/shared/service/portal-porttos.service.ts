/*
    Author: German Valencia
    Pattern: PORTTOS Servicio - Portal público porttos.co dentro de la web (OT-010, CC-095)
    Description: Única pieza del portal que habla con el API (/api/portal, público, sin JWT), con environment.apiUrl como los demás
      servicios de la web. Lecturas en caché en memoria mientras dure la visita (el API ya cachea 5 min); si una falla se borra de la
      caché para reintentar. Respuesta del API: { ok: true, data }; errores: { ok: false, msg, codigo }.
      conEstado(obs) convierte una lectura en { cargando, dato?, error? } con el texto honesto de mensajeDeError.
*/
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of, shareReplay, startWith, throwError } from 'rxjs';
import { environment } from 'src/environments/environment';
import {
    ConfigPortal, MensajePortal, PaginaPortal, PlanesPortal, PreguntaPortal, PuertoEnVivo, PuertoListado, mensajeDeError
} from 'src/app/plataforma/websites/porttos/nucleo';

export interface Estado<T> { cargando: boolean; dato?: T; error?: string }

export function conEstado<T>(fuente: Observable<T>): Observable<Estado<T>> {
    return fuente.pipe(
        map((dato): Estado<T> => ({ cargando: false, dato })),
        catchError((e) => of<Estado<T>>({ cargando: false, error: mensajeDeError(e) })),
        startWith<Estado<T>>({ cargando: true }),
    );
}

@Injectable({ providedIn: 'root' })
export class PortalPorttosService {
    private readonly http = inject(HttpClient);
    private readonly base = `${environment.apiUrl}/portal`;
    private readonly cache = new Map<string, Observable<unknown>>();

    private leer<T>(ruta: string): Observable<T> {
        const guardado = this.cache.get(ruta) as Observable<T> | undefined;
        if (guardado) return guardado;
        const pedido = this.http.get<{ ok: boolean; data: T }>(`${this.base}/${ruta}`).pipe(
            map((r) => r.data),
            catchError((e) => { this.cache.delete(ruta); return throwError(() => e); }),
            shareReplay({ bufferSize: 1, refCount: false }),
        );
        this.cache.set(ruta, pedido);
        return pedido;
    }

    config(): Observable<ConfigPortal> { return this.leer<ConfigPortal>('config'); }
    pagina(pagina: string, idioma = 'es'): Observable<PaginaPortal> { return this.leer<PaginaPortal>(`paginas/${pagina}?idioma=${idioma}`); }
    planes(): Observable<PlanesPortal> { return this.leer<PlanesPortal>('planes'); }
    preguntas(pagina: string, idioma = 'es'): Observable<PreguntaPortal[]> { return this.leer<PreguntaPortal[]>(`preguntas/${pagina}?idioma=${idioma}`); }
    /** Puertos en vivo (OT-011): solo fuentes públicas; el API cachea 5 minutos. */
    puertos(): Observable<PuertoListado[]> { return this.leer<PuertoListado[]>('puertos-en-vivo'); }
    puertoEnVivo(id: string): Observable<PuertoEnVivo> { return this.leer<PuertoEnVivo>(`puertos-en-vivo/${encodeURIComponent(id)}`); }

    enviarMensaje(m: MensajePortal): Observable<{ recibido: boolean }> {
        return this.http.post<{ ok: boolean; data: { recibido: boolean } }>(`${this.base}/mensajes`, m).pipe(map((r) => r.data));
    }
}
