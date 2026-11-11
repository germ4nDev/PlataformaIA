/*
    Author: German Valencia
    Utilidades › Países: código ISO, moneda y datos regionales (API /api/paises). Listas de precios elige el país de aquí.
*/
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from 'src/environments/environment';

const base_url = `${environment.apiUrl}/paises`;

export interface Pais {
    codigoPais: string; codigoIso3: string; codigoNumerico?: string | null; nombrePais: string;
    moneda: string; simboloMoneda?: string | null; decimalesMoneda: number; indicativo?: string | null;
    zonaHoraria?: string | null; idioma?: string | null; descripcion?: string | null; estadoPais: boolean;
}

@Injectable({ providedIn: 'root' })
export class PtlPaisesService {
    constructor(private readonly http: HttpClient) {}

    listar(): Observable<Pais[]> {
        return this.http.get<any>(base_url).pipe(map((r) => (r?.paises || []).map((p: Pais) => ({ ...p, codigoPais: String(p.codigoPais).trim(), estadoPais: !!p.estadoPais }))));
    }

    obtener(codigoPais: string): Observable<Pais> {
        return this.http.get<any>(`${base_url}/${encodeURIComponent(codigoPais)}`).pipe(map((r) => r.pais));
    }

    crear(p: Partial<Pais>): Observable<any> { return this.http.post(base_url, p); }

    modificar(codigoPais: string, p: Partial<Pais>): Observable<any> { return this.http.put(`${base_url}/${encodeURIComponent(codigoPais)}`, p); }

    eliminar(codigoPais: string): Observable<any> { return this.http.delete(`${base_url}/${encodeURIComponent(codigoPais)}`); }

    /** Nombre del país en el idioma del usuario a partir del código ISO (Intl); si el navegador no lo conoce, el guardado. */
    nombreEn(p: Pick<Pais, 'codigoPais' | 'nombrePais'>, idioma: string): string {
        try { return new Intl.DisplayNames([idioma || 'es'], { type: 'region' }).of(p.codigoPais) || p.nombrePais; } catch { return p.nombrePais; }
    }
}
