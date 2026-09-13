/*
    Author: German Valencia
    Refactored for: QPLUS Architecture & HTTP Client Communication
*/
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment'
const base_url = environment.apiUrl

@Injectable({
    providedIn: 'root'
})
export class LayoutService {

    constructor(private http: HttpClient) { }

    // 🟢 Obtener el layout guardado del usuario en SQL Server
    getLayoutByUsuario(codigoUsuario: string): Observable<any> {
        return this.http.get<any>(`${base_url}/layout/${codigoUsuario}`);
    }

    // 🟢 Guardar o actualizar el layout del usuario (Upsert)
    saveOrUpdateLayout(data: { codigoUsuario: string; layoutData: any }): Observable<any> {
        return this.http.post<any>(`${base_url}/layout/`, data);
    }
}
