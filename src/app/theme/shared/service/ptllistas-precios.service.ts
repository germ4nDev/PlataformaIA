/*
    Author: German Valencia
    OT-029: listas de precios (único lugar del precio de venta de paquetes e items). API /api/lista-precios.
*/
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from 'src/environments/environment';
import { SocketManagerService } from './socket-manager.service';

const base_url = `${environment.apiUrl}/lista-precios`;

export interface ListaPrecios {
    codigoLista: string; nombreLista: string; moneda: string; paisAplica?: string | null;
    fechaInicio: string; fechaFin?: string | null; estadoLista: boolean; numPrecios?: number;
}
export interface PrecioLista {
    codigoDetalle: string; codigoLista?: string; tipoReferencia: 'PAQUETE' | 'ITEM'; codigoReferencia: string; nombreReferencia?: string;
    valorMensual: number; valorAnual: number; precioSetup: number; estadoDetalle: boolean;
}
export interface FotoPrecio {
    codigoLista: string; moneda: string; periodicidad: 'MENSUAL' | 'ANUAL'; mesesCobertura: number;
    valorPeriodo: number; precioSetup: number; porcentajeDescuento: number; valorFinal: number;
}
export interface ReferenciaPaquete {
    lista: ListaPrecios | null; precio: PrecioLista | null; sumaItems: { mensual: number; anual: number; setup: number; sinPrecio: string[] } | null;
}

@Injectable({ providedIn: 'root' })
export class PTLListasPreciosService {
    /** Avisa cuando otra sesión cambia una lista (socket listas-precios-actualizadas). */
    readonly cambios$: Observable<any>;

    constructor(private readonly http: HttpClient, socketManager: SocketManagerService) {
        this.cambios$ = socketManager.listasPreciosActualizadas$.asObservable();
    }

    listar(): Observable<ListaPrecios[]> {
        return this.http.get<any>(base_url).pipe(map((r) => r?.listas || []));
    }

    obtener(codigoLista: string): Observable<{ lista: ListaPrecios; detalles: PrecioLista[] }> {
        return this.http.get<any>(`${base_url}/${encodeURIComponent(codigoLista)}`).pipe(map((r) => ({ lista: r.lista, detalles: r.detalles || [] })));
    }

    crear(lista: Partial<ListaPrecios>): Observable<any> { return this.http.post(base_url, lista); }

    modificar(codigoLista: string, lista: Partial<ListaPrecios>): Observable<any> {
        return this.http.put(`${base_url}/${encodeURIComponent(codigoLista)}`, lista);
    }

    duplicar(codigoLista: string, datos: { codigoLista: string; nombreLista: string; fechaInicio: string; fechaFin?: string | null; porcentajeAjuste?: number }): Observable<any> {
        return this.http.post(`${base_url}/${encodeURIComponent(codigoLista)}/duplicar`, datos);
    }

    agregarPrecio(codigoLista: string, precio: Partial<PrecioLista>): Observable<any> {
        return this.http.post(`${base_url}/${encodeURIComponent(codigoLista)}/detalles`, precio);
    }

    modificarPrecio(codigoDetalle: string, cambios: Partial<PrecioLista>): Observable<any> {
        return this.http.put(`${base_url}/detalles/${encodeURIComponent(codigoDetalle)}`, cambios);
    }

    eliminarPrecio(codigoDetalle: string): Observable<any> {
        return this.http.delete(`${base_url}/detalles/${encodeURIComponent(codigoDetalle)}`);
    }

    /** Lista vigente hoy (por país y moneda; sin país, la general o la más reciente) con sus precios. */
    vigente(pais = '', moneda = ''): Observable<{ lista: ListaPrecios | null; detalles: PrecioLista[] }> {
        const params: any = {};
        if (pais) params.pais = pais;
        if (moneda) params.moneda = moneda;
        return this.http.get<any>(`${base_url}/vigente`, { params }).pipe(map((r) => ({ lista: r.lista || null, detalles: r.detalles || [] })));
    }

    /** Precio de la lista elegida (o la vigente) para el paquete y suma de sus items, de referencia. */
    referenciaPaquete(codigoPaquete: string, codigoLista = ''): Observable<ReferenciaPaquete> {
        return this.http.get<any>(`${base_url}/paquete/${encodeURIComponent(codigoPaquete)}`, { params: codigoLista ? { codigoLista } : {} })
            .pipe(map((r) => ({ lista: r.lista, precio: r.precio, sumaItems: r.sumaItems })));
    }

    /** Foto del precio con la que se vende un paquete (meses y descuento del tipo de paquete). */
    cotizar(codigoPaquete: string, codigoTipoPaquete: string, codigoLista = ''): Observable<FotoPrecio> {
        const params: any = { codigoPaquete, codigoTipoPaquete };
        if (codigoLista) params.codigoLista = codigoLista;
        return this.http.get<any>(`${base_url}/cotizar`, { params }).pipe(map((r) => r.cotizacion));
    }
}
