/*
    Author: German Valencia
    Regla 22 · OT-027: cargador de traducciones de la web. Toma el JSON que trae el build (assets/i18n/<idioma>.json) y encima el que
    administra Utilidades › Traducciones en el API (GET /api/traducciones/<idioma>, público). Si el API no responde, queda el del build.
*/
import { HttpClient } from '@angular/common/http';
import { TranslateLoader } from '@ngx-translate/core';
import { Observable, catchError, forkJoin, map, of, timeout } from 'rxjs';
import { environment } from 'src/environments/environment';

export function mezclarArboles(base: any, encima: any): any {
    if (!encima || typeof encima !== 'object' || Array.isArray(encima)) return encima ?? base;
    const r: any = base && typeof base === 'object' && !Array.isArray(base) ? { ...base } : {};
    for (const k of Object.keys(encima)) r[k] = mezclarArboles(r[k], encima[k]);
    return r;
}

export class CargadorTraducciones implements TranslateLoader {
    constructor(private readonly http: HttpClient) {}

    getTranslation(idioma: string): Observable<any> {
        const build = this.http.get(`./assets/i18n/${idioma}.json`).pipe(catchError(() => of({})));
        const api = this.http.get<any>(`${environment.apiUrl}/traducciones/${idioma}`).pipe(
            map((r) => r?.traducciones || {}),
            timeout(4000),
            catchError(() => of({}))
        );
        return forkJoin([build, api]).pipe(map(([b, a]) => mezclarArboles(b, a)));
    }
}

export function crearCargadorTraducciones(http: HttpClient): TranslateLoader {
    return new CargadorTraducciones(http);
}
