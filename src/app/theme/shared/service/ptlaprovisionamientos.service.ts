/*
    Author: German Valencia
    OT-030: estado de las bases de un suscriptor (una por aplicación de su paquete, menos la Plataforma) y reintento.
*/
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from 'src/environments/environment';

const base_url = `${environment.apiUrl}/aprovisionamientos`;

export interface Aprovisionamiento {
    codigoAprovisionamiento: string; codigoSuscriptor: string; codigoAplicacion: string; nombreAplicacion?: string;
    nombreBD: string; estado: 'PENDIENTE' | 'EN_CURSO' | 'LISTA' | 'ERROR'; mensaje?: string | null; version: number; intentos: number;
}

@Injectable({ providedIn: 'root' })
export class PtlAprovisionamientosService {
    constructor(private readonly http: HttpClient) {}

    listar(codigoSuscriptor: string): Observable<Aprovisionamiento[]> {
        return this.http.get<any>(base_url, { params: { codigoSuscriptor } }).pipe(map((r) => r?.aprovisionamientos || []));
    }

    reintentar(codigoSuscriptor: string, codigoAplicacion: string): Observable<any> {
        return this.http.post(`${base_url}/reintentar`, { codigoSuscriptor, codigoAplicacion });
    }
}
