import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment'

const base_url = environment.apiUrl

@Injectable({
    providedIn: 'root'
})
export class EmailService {

    constructor(private http: HttpClient) { }

    enviarNuevaClaveUsuario(correo: string, clavePlana: string): Observable<any> {
        const payload = {
            correo: correo,
            clave: clavePlana
        };

        return this.http.post(`${base_url}/email/cambiar-clave`, payload);
    }

    enviarClaveUsuario(correo: string, clavePlana: string): Observable<any> {
        const payload = {
            correo: correo,
            clave: clavePlana
        };

        return this.http.post(`${base_url}/email/enviar-clave`, payload);
    }
}
