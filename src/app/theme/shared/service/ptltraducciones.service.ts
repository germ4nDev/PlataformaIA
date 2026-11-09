/*
    Author: German Valencia
    OT-027: servicio de Utilidades › Traducciones (llaves de es.json, en.json… en el API, con su árbol MODULO.SUBMODULO.LLAVE).
*/
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from 'src/environments/environment';

const base_url = environment.apiUrl;

export interface FilaTraduccion { llave: string; modulo: string; textos: Record<string, string | null>; protegida: boolean }
export interface RamaTraduccion { modulo: string; submodulos: string[] }
export interface ListaTraducciones { idiomas: string[]; ramas: RamaTraduccion[]; filas: FilaTraduccion[] }

@Injectable({ providedIn: 'root' })
export class PtlTraduccionesService {
    constructor(private readonly http: HttpClient) {}

    listar(): Observable<ListaTraducciones> {
        return this.http.get<any>(`${base_url}/traducciones`).pipe(map((r) => ({ idiomas: r?.idiomas || [], ramas: r?.ramas || [], filas: r?.filas || [] })));
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

    sembrar(idioma: string, arbol: any): Observable<any> {
        return this.http.post(`${base_url}/traducciones/${idioma}/sembrar`, { arbol });
    }
}
