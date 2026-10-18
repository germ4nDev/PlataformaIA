/*
    Author: German Valencia
    Pattern: PORTTOS Client - KPIs marítimos en vivo (PlataformaApiIA · /api/maritimo/:puerto/{resumen,tiempos,ocupacion,llegadas})
    Los tipos reflejan el contrato de services/torre-control/maritimo-vivo.service.js.
    El token lo agrega el AuthInterceptor, igual que para el API actual.
*/
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { SocketService } from '../sockets.service';

export interface PuertoMaritimo { idPuerto: string; nombre: string; capitaniaDimar?: string | null }
export interface MetricaEstado { naves: number; minutosPromedio: number | null; minutosMaximo: number | null }
export interface NaveFondeada {
    mmsi: string; nombre: string | null; destino: string | null; latitud: number; longitud: number; minutos: number | null;
}
export interface ResumenMaritimo {
    puerto: PuertoMaritimo;
    generadoEn: string;
    vigenciaMin: number;
    totalNaves: number;
    porEstado: Record<string, MetricaEstado>;
    fondeo: MetricaEstado & { cola: NaveFondeada[] };
    atracadas: number;
    enMovimiento: number;
    criticas: number;
}
export interface Estadistica {
    eventos: number; promedioMin: number | null; medianaMin: number | null; p90Min: number | null; maximoMin: number | null;
}
export interface TiemposMaritimos {
    puerto: PuertoMaritimo;
    generadoEn: string;
    desde: string;
    dias: number;
    fondeo: { resumen: Estadistica; porDia: Array<{ dia: string } & Estadistica>; porTerminal: Array<{ idTerminal: string } & Estadistica> };
    estadia: { resumen: Estadistica; porTerminal: Array<{ idTerminal: string } & Estadistica> };
}
export interface NaveAtracada { mmsi: string; nombre: string | null; idTerminal: string | null; codigoMuelle: string | null; minutos: number | null }
export interface MuelleOcupacion {
    codigoMuelle: string; idTerminal: string; terminal: string; especialidad: string | null; caladoMetros: number | null;
    enMantenimiento: boolean; ocupado: boolean; naves: NaveAtracada[];
}
export interface OcupacionMuelles {
    puerto: PuertoMaritimo;
    generadoEn: string;
    resumen: { muelles: number; ocupados: number; enMantenimiento: number; disponibles: number; porcentajeOcupacion: number | null };
    terminales: Array<{ idTerminal: string; nombre: string; muelles: MuelleOcupacion[]; navesSinMuelle: NaveAtracada[] }>;
    navesSinTerminal: NaveAtracada[];
}
export type SituacionLlegada = 'EN PUERTO' | 'ATRASADA' | 'EN RADAR' | 'SIN AIS';
export interface AvisoLlegada {
    idAviso: string; motonave: string; omi: string | null; bandera: string | null; tipoNave: string | null;
    eslora: number | null; calado: number | null; agencia: string | null; instalacion: string | null; eta: string;
    minutosParaEta: number | null; mmsi: string | null; estadoAis: string | null; puertoAis: string | null;
    latitud: number | null; longitud: number | null; velocidad: number | null; minutosDesdeAis: number | null;
    situacion: SituacionLlegada;
}
export interface Llegadas {
    puerto: PuertoMaritimo;
    generadoEn: string;
    horas: number;
    resumen: { total: number; proximas24h: number; de24a48h: number; de48a72h: number; atrasadas: number; enRadar: number; enPuerto: number; sinAis: number };
    naves: AvisoLlegada[];
}
/** Evento 'nave-cambio-estado' que emite el motor AIS a la sala puerto:{PUERTO}:maritimo */
export interface CambioEstadoNave {
    mmsi: string; nombre_motonave: string | null; estado_anterior: string | null; estado_nuevo: string;
    id_puerto: string | null; id_terminal: string | null; codigo_muelle: string | null;
    duracion_anterior_min: number | null; fecha: string;
}

interface RespuestaApi<T> { ok: boolean; data: T }

@Injectable({ providedIn: 'root' })
export class MaritimoVivoService {
    private readonly base = `${environment.apiUrl}/maritimo`;
    private contadorSuscriptores = 0;

    constructor(private http: HttpClient, private socket: SocketService) { }

    private get<T>(puerto: string, recurso: string, parametros: Record<string, number> = {}): Observable<T> {
        let params = new HttpParams();
        for (const [clave, valor] of Object.entries(parametros)) params = params.set(clave, String(valor));
        return this.http
            .get<RespuestaApi<T>>(`${this.base}/${encodeURIComponent(puerto)}/${recurso}`, { params })
            .pipe(map((r) => r.data));
    }

    resumen(puerto: string, limiteCola = 20, vigenciaMin = 60): Observable<ResumenMaritimo> {
        return this.get<ResumenMaritimo>(puerto, 'resumen', { limiteCola, vigenciaMin });
    }

    tiempos(puerto: string, dias = 30): Observable<TiemposMaritimos> {
        return this.get<TiemposMaritimos>(puerto, 'tiempos', { dias });
    }

    ocupacion(puerto: string): Observable<OcupacionMuelles> {
        return this.get<OcupacionMuelles>(puerto, 'ocupacion');
    }

    llegadas(puerto: string, horas = 72, horasAtras = 12): Observable<Llegadas> {
        return this.get<Llegadas>(puerto, 'llegadas', { horas, horasAtras });
    }

    /**
     * Cambios de estado AIS del puerto en tiempo real. Mientras haya suscriptores, el cliente
     * está en la sala puerto:{PUERTO}:maritimo (y el radar AIS sigue a ese puerto).
     */
    cambiosDeEstado(puerto: string): Observable<CambioEstadoNave> {
        return new Observable<CambioEstadoNave>((suscriptor) => {
            const dueno = `widget-maritimo-${++this.contadorSuscriptores}`;
            this.socket.unirseSalaPuerto('maritimo', puerto, dueno);
            const sub = this.socket.listen<CambioEstadoNave>('nave-cambio-estado').subscribe(suscriptor);
            return () => {
                sub.unsubscribe();
                this.socket.salirSalaPuerto('maritimo', dueno);
            };
        });
    }
}
