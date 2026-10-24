/*
    Author: German Valencia
    Pattern: PORTTOS Client - Historial de la telemetría GNL (vista ampliada, Fase 3)
    GET /api/gnl-telemetria/historial/:puerto?horas=24|72|168 → serie por hora (volumen, energía, presión,
    temperatura, alarmas) y volumen por brazo, desde los consolidados de 5 min (TCL_OperacionesFlujoGNL).
*/
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

export interface HistorialGnl {
    labels: string[]; volumenM3: number[]; energiaMmbtu: number[]; presionPsi: Array<number | null>; temperaturaC: Array<number | null>;
    alarmas: number[]; porBrazo: Array<{ brazo: string; volumenM3: number[]; total: number }>; filas: number; horas: number;
    simulado: boolean; fuente: string;
}

@Injectable({ providedIn: 'root' })
export class GnlHistorialService {
    constructor(private http: HttpClient) { }

    historial(puerto: string, horas: 24 | 72 | 168 = 24): Observable<HistorialGnl> {
        const p = encodeURIComponent((puerto || 'BUENAVENTURA').trim().toUpperCase());
        return this.http.get<{ ok: boolean; data: HistorialGnl }>(`${environment.apiUrl}/gnl-telemetria/historial/${p}`, { params: { horas: String(horas) } })
            .pipe(map((r) => r.data));
    }
}
