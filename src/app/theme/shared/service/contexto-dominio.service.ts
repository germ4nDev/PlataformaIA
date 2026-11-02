/*
    Author: German Valencia
    Pattern: PLATAFORMA Service - Contexto del dominio (OT-012, migración 026)
    Description: Se resuelve al arrancar la web (APP_INITIALIZER), antes de las rutas: pregunta al API qué es este dominio
      (GET /api/dominios/contexto?host=…) y lo deja en `contexto` para los guards, el login y la entrada a la aplicación.
      - consola: todo, como hoy · aplicacion: solo esa aplicación (portal, login, menú) · neutro: igual que hoy.
      - En desarrollo se simula otro dominio con ?dominio=porttos.co (se recuerda en la pestaña; ?dominio=localhost lo quita).
      - Si el API no responde en 4 s: respaldo con environment.dominiosPortal (el portal sigue abriendo; nada más se restringe).
*/
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom, timeout } from 'rxjs';
import { environment } from 'src/environments/environment';
import { ContextoDominio, contextoDeRespaldo, hostEfectivo, normalizarContexto } from 'src/app/plataforma/dominios/nucleo';

const LLAVE_SIMULADO = 'dominioSimulado';
const RUTA_PORTAL_RESPALDO = '/websites/porttos';

@Injectable({ providedIn: 'root' })
export class ContextoDominioService {
    contexto: ContextoDominio = contextoDeRespaldo('', [], RUTA_PORTAL_RESPALDO);

    constructor(private http: HttpClient) {}

    async cargar(): Promise<ContextoDominio> {
        const host = this.host();
        try {
            const params = new HttpParams().set('host', host);
            const resp: any = await firstValueFrom(
                this.http.get(`${environment.apiUrl}/dominios/contexto`, { params }).pipe(timeout(4000)));
            this.contexto = normalizarContexto(resp?.data, host);
        } catch (_) {
            const dominios = (environment as { dominiosPortal?: string[] }).dominiosPortal || [];
            this.contexto = contextoDeRespaldo(host, dominios, RUTA_PORTAL_RESPALDO);
        }
        return this.contexto;
    }

    get esAplicacion(): boolean {
        return this.contexto.tipo === 'aplicacion';
    }

    private host(): string {
        let guardado: string | null = null;
        try { guardado = sessionStorage.getItem(LLAVE_SIMULADO); } catch (_) { /* sin almacenamiento */ }
        const h = hostEfectivo(window.location.hostname, window.location.search, environment.production, guardado);
        if (!environment.production) {
            try {
                if (h === window.location.hostname.toLowerCase()) sessionStorage.removeItem(LLAVE_SIMULADO);
                else sessionStorage.setItem(LLAVE_SIMULADO, h);
            } catch (_) { /* sin almacenamiento */ }
        }
        return h;
    }
}
