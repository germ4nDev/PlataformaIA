/*
    Author: German Valencia
    Regla 22 · OT-027: cargador de traducciones de la web. Toma el JSON que trae el build (assets/i18n/<idioma>.json) y encima el que
    administra Utilidades › Traducciones en el API (GET /api/traducciones/<idioma>, público). Si el API no responde, queda el del build.
    En la compilación de una app (OT-034, CC-200) el JSON del build ya viene sin los textos de las otras apps y lo del API se filtra igual.
*/
import { HttpClient } from '@angular/common/http';
import { TranslateLoader } from '@ngx-translate/core';
import { Observable, catchError, forkJoin, map, of, timeout } from 'rxjs';
import { environment } from 'src/environments/environment';
import { textosDeLaCompilacion } from './textos-compilacion';

// CC-200 (OT-034): la mezcla y el filtro de la compilación de una app viven en textos-compilacion.ts (puro, con prueba)
export { mezclarArboles } from './textos-compilacion';

export class CargadorTraducciones implements TranslateLoader {
    constructor(private readonly http: HttpClient) {}

    getTranslation(idioma: string): Observable<any> {
        const build = this.http.get(`./assets/i18n/${idioma}.json`).pipe(catchError(() => of({})));
        const api = this.http.get<any>(`${environment.apiUrl}/traducciones/${idioma}`).pipe(
            map((r) => r?.traducciones || {}),
            timeout(4000),
            catchError(() => of({}))
        );
        // La compilación de una app trae _compilacion: se quita y se filtran los textos de las otras apps que lleguen del API (CC-200)
        return forkJoin([build, api]).pipe(map(([b, a]) => textosDeLaCompilacion(b, a)));
    }
}

export function crearCargadorTraducciones(http: HttpClient): TranslateLoader {
    return new CargadorTraducciones(http);
}
