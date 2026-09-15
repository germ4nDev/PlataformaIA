/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

const base_url = environment.apiUrl;

@Injectable({
    providedIn: 'root'
})
export class PtlUsuariosWidgetsService {

    constructor(private http: HttpClient) {
        console.log('******* Servicio de Usuarios-Widgets (Layout Relacional) iniciado correctamente');
    }

    getLayoutUsuario(codigoUsuario: string): Observable<any[]> {
        const url = `${base_url}/usuarios-widgets/${codigoUsuario}`;

        return this.http.get(url).pipe(
            map((resp: any) => {
                console.log('🔄 Layout cargado desde SQL:', resp.layoutData);
                return resp.layoutData || [];
            })
        );
    }

    guardarLayoutUsuario(codigoUsuario: string, layoutData: any[]): Observable<any> {
        const url = `${base_url}/usuarios-widgets`;

        const payload = {
            codigoUsuario,
            layoutData
        };

        console.log('📤 Enviando layout para guardar/sincronizar:', payload);

        return this.http.post(url, payload).pipe(
            map((resp: any) => {
                console.log('✅ Layout guardado exitosamente:', resp);
                return resp;
            })
        );
    }
}
