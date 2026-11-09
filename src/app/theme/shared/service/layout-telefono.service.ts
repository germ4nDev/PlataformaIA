/* eslint-disable @typescript-eslint/no-explicit-any */
/*
    Author: German Valencia
    Pattern: PORTTOS Service - Layout del teléfono (OT-017 fase 3)
    Description: Llama a /api/layout-telefono (API propia, JWT + sesión por el interceptor). Solo lo usa la web embebida en el
      teléfono (EmbebidoService.esTelefono); la web y la tableta siguen con /api/layout.
        pestanas()                    [{ codigoPestana, widgets }]
        obtener(pestana)              { codigoPestana, columnas, origen, items, disponibles, ocultos, version }
        guardar(pestana, items)       guarda [{ codigo, x, y, cols, rows }] y devuelve el layout guardado
        restablecer(pestana)          vuelve al por defecto
*/
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, map } from 'rxjs';
import { environment } from 'src/environments/environment';

const base_url = `${environment.apiUrl}/layout-telefono`;

@Injectable({ providedIn: 'root' })
export class LayoutTelefonoService {
    constructor(private http: HttpClient) { }

    pestanas(): Promise<Array<{ codigoPestana: string; widgets: number }>> {
        return firstValueFrom(this.http.get<any>(base_url).pipe(map((r) => (Array.isArray(r?.data) ? r.data : []))));
    }

    obtener(pestana: string): Promise<any> {
        return firstValueFrom(this.http.get<any>(`${base_url}/${encodeURIComponent(pestana)}`).pipe(map((r) => r?.data)));
    }

    guardar(pestana: string, items: any[]): Promise<any> {
        return firstValueFrom(this.http.put<any>(`${base_url}/${encodeURIComponent(pestana)}`, { items }).pipe(map((r) => r?.data)));
    }

    restablecer(pestana: string): Promise<any> {
        return firstValueFrom(this.http.delete<any>(`${base_url}/${encodeURIComponent(pestana)}`).pipe(map((r) => r?.data)));
    }
}
