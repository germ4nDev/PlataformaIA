/*
    Author: German Valencia
    Utilidades › Pestañas y Tipos de pestaña (CC-203): administración de PTL_Pestanas y PTL_TiposPestana (API /api/pestanas y
    /api/tipos-pestana). El motor de tableros sigue leyendo con PtlpestanasService; este servicio es solo de la administración.
*/
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from 'src/environments/environment';
import { PestanaAdmin, TipoPestana } from 'src/app/plataforma/utilidades/pestanas/nucleo';

const PESTANAS = `${environment.apiUrl}/pestanas`;
const TIPOS = `${environment.apiUrl}/tipos-pestana`;
const bool = (v: any) => v === true || v === 1 || v === '1' || v === 'true';

@Injectable({ providedIn: 'root' })
export class PtlPestanasAdminService {
    constructor(private readonly http: HttpClient) {}

    listar(): Observable<PestanaAdmin[]> {
        return this.http
            .get<any>(PESTANAS)
            .pipe(map((r) => (r?.respuesta || r?.data || []).map((p: any) => ({ ...p, estado: bool(p.estado) }) as PestanaAdmin)));
    }
    obtener(codigo: string): Observable<PestanaAdmin> {
        return this.http.get<any>(`${PESTANAS}/${encodeURIComponent(codigo)}`).pipe(map((r) => ({ ...r.pestana, estado: bool(r.pestana?.estado) })));
    }
    crear(p: Partial<PestanaAdmin>): Observable<any> {
        return this.http.post(PESTANAS, p);
    }
    modificar(codigo: string, p: Partial<PestanaAdmin>): Observable<any> {
        return this.http.put(`${PESTANAS}/${encodeURIComponent(codigo)}`, p);
    }
    inactivar(codigo: string): Observable<any> {
        return this.http.delete(`${PESTANAS}/${encodeURIComponent(codigo)}`);
    }

    listarTipos(): Observable<TipoPestana[]> {
        return this.http
            .get<any>(TIPOS)
            .pipe(map((r) => (r?.respuesta || r?.tipos || []).map((t: any) => ({ ...t, estado: bool(t.estado) }) as TipoPestana)));
    }
    obtenerTipo(codigo: string): Observable<TipoPestana> {
        return this.http.get<any>(`${TIPOS}/${encodeURIComponent(codigo)}`).pipe(map((r) => ({ ...(r.tipo || r.tipoRole), estado: bool((r.tipo || r.tipoRole)?.estado) })));
    }
    crearTipo(t: Partial<TipoPestana>): Observable<any> {
        return this.http.post(TIPOS, t);
    }
    modificarTipo(codigo: string, t: Partial<TipoPestana>): Observable<any> {
        return this.http.put(`${TIPOS}/${encodeURIComponent(codigo)}`, t);
    }
    inactivarTipo(codigo: string): Observable<any> {
        return this.http.delete(`${TIPOS}/${encodeURIComponent(codigo)}`);
    }
}
