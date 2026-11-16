/*
    Author: German Valencia
    Utilidades › Catálogos (CC-204): administración de los catálogos simples por sus API de siempre (/api/tipos-roles, /api/tipos-widget,
    /api/tipos-pago, /api/tipos-paquete, /api/tipos-actividad, /api/tipos-estados, /api/estados). La definición de cada uno está en
    plataforma/utilidades/catalogos/catalogos-nucleo.ts. Las pantallas que ya leían esos catálogos siguen con sus servicios.
*/
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from 'src/environments/environment';
import { DefCatalogo, filasDe } from 'src/app/plataforma/utilidades/catalogos/catalogos-nucleo';

@Injectable({ providedIn: 'root' })
export class PtlCatalogosService {
    constructor(private readonly http: HttpClient) {}

    private url(def: DefCatalogo, id?: string): string {
        return `${environment.apiUrl}/${def.api}${id === undefined ? '' : '/' + encodeURIComponent(id)}`;
    }

    listar(def: DefCatalogo): Observable<any[]> {
        return this.http.get<any>(this.url(def)).pipe(map((r) => filasDe(r)));
    }
    obtener(def: DefCatalogo, id: string): Observable<any> {
        return this.http.get<any>(this.url(def, id)).pipe(map((r) => r?.registro || {}));
    }
    crear(def: DefCatalogo, p: Record<string, any>): Observable<any> {
        return this.http.post(this.url(def), p);
    }
    modificar(def: DefCatalogo, id: string, p: Record<string, any>): Observable<any> {
        return this.http.put(this.url(def, id), p);
    }
    eliminar(def: DefCatalogo, id: string): Observable<any> {
        return this.http.delete(this.url(def, id));
    }
}
