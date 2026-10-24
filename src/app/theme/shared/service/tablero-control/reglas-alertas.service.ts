/*
    Author: German Valencia
    Servicio: Reglas de alertas del mapa (TCL_ConfigAlertas · migración 011)
*/
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface UmbralCatalogo { etiqueta: string; defecto: number; }

export interface ReglaCatalogo {
    codigo: string;
    nombre: string;
    niveles: string;
    porPuerto: boolean;
    enfriamientoMin: number;
    umbrales: UmbralCatalogo[];
}

export interface FilaConfigAlerta {
    codigo_regla: string;
    id_puerto: string;
    activa: boolean;
    umbral_1: number | null;
    umbral_2: number | null;
    umbral_3: number | null;
    enfriamiento_min: number;
    descripcion?: string | null;
    fecha_modificacion?: string | null;
    usuario_modificacion?: string | null;
}

export interface RespuestaReglas {
    persistencia: boolean;
    catalogo: ReglaCatalogo[];
    filas: FilaConfigAlerta[];
}

@Injectable({ providedIn: 'root' })
export class ReglasAlertasService {
    private readonly url = `${environment.apiUrl}/alertas-mapa/reglas`;

    constructor(private http: HttpClient) { }

    listar(): Observable<RespuestaReglas> {
        return this.http.get<RespuestaReglas>(this.url);
    }

    guardar(fila: FilaConfigAlerta): Observable<RespuestaReglas> {
        return this.http.put<RespuestaReglas>(this.url, fila);
    }

    /** Quita la configuración propia del puerto: vuelve a la global. */
    restablecer(codigo: string, puerto: string): Observable<RespuestaReglas> {
        return this.http.delete<RespuestaReglas>(`${this.url}/${encodeURIComponent(codigo)}/${encodeURIComponent(puerto)}`);
    }
}
