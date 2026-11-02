/*
    Author: German Valencia
    Pattern: PLATAFORMA Service - Modo embebido (OT-014 fase 1, CC-109)
    Description: La web dentro de la app Porttos (tableta). `activo` solo si la página está en un marco y entró por /embebido
      (se recuerda en la pestaña); fuera de un marco la web es la de siempre.
      - esperarSesion(): avisa 'listo' cada segundo hasta que la app entregue la sesión (o se agote el tiempo).
      - avisar(): mensaje a la app (solo a sus orígenes).
      - cerrarSesion(motivo): una sola vez; borra la sesión de la pestaña y la app hace su cierre de siempre.
    Contrato y validaciones en plataforma/embebido/nucleo.
*/
import { Injectable, NgZone } from '@angular/core';
import { environment } from 'src/environments/environment';
import {
    MotivoCierreEmbebido, SesionEntregada, TipoMensajeWeb, esRutaEmbebida, leerSesionEntregada, mensajeParaApp,
    origenAppPermitido, origenesDestino
} from 'src/app/plataforma/embebido/nucleo';

const LLAVE_MODO = 'modoEmbebido';

@Injectable({ providedIn: 'root' })
export class EmbebidoService {
    readonly activo: boolean;
    /** Motivo del cierre ya avisado (el primero gana: un 401 dispara varios interceptores). */
    cerrada: MotivoCierreEmbebido | null = null;

    constructor(private zona: NgZone) {
        this.activo = this.detectar();
    }

    esperarSesion(tiempoMs = 20000): Promise<SesionEntregada> {
        return new Promise((resolver, rechazar) => {
            const alRecibir = (ev: MessageEvent) => {
                if (ev.source !== window.parent || !origenAppPermitido(ev.origin, environment.production)) return;
                const sesion = leerSesionEntregada(ev.data);
                if (!sesion) return;
                terminar();
                this.zona.run(() => resolver(sesion));
            };
            const listo = setInterval(() => this.avisar('listo'), 1000);
            const limite = setTimeout(() => { terminar(); this.zona.run(() => rechazar(new Error('La app no entregó la sesión.'))); }, tiempoMs);
            const terminar = () => { clearInterval(listo); clearTimeout(limite); window.removeEventListener('message', alRecibir); };
            window.addEventListener('message', alRecibir);
            this.avisar('listo');
        });
    }

    avisar(tipo: TipoMensajeWeb, datos: Record<string, unknown> = {}): void {
        if (!this.activo) return;
        const mensaje = mensajeParaApp(tipo, datos);
        for (const origen of origenesDestino(this.origenPadre(), environment.production)) {
            try { window.parent.postMessage(mensaje, origen); } catch (_) { /* origen distinto: se descarta */ }
        }
    }

    /** Devuelve true si cerró (y avisó) ahora; false si no está embebida o ya se había cerrado. */
    cerrarSesion(motivo: MotivoCierreEmbebido): boolean {
        if (!this.activo || this.cerrada) return false;
        this.cerrada = motivo;
        try {
            sessionStorage.removeItem('currentUser');
            sessionStorage.removeItem('navsettings');
        } catch (_) { /* sin almacenamiento */ }
        this.avisar('cerrar-sesion', { motivo });
        return true;
    }

    private detectar(): boolean {
        let enMarco = false;
        try { enMarco = window.parent !== window; } catch (_) { enMarco = true; }
        try {
            if (!enMarco) { sessionStorage.removeItem(LLAVE_MODO); return false; }
            if (esRutaEmbebida(window.location.pathname)) sessionStorage.setItem(LLAVE_MODO, '1');
            return sessionStorage.getItem(LLAVE_MODO) === '1';
        } catch (_) {
            return enMarco && esRutaEmbebida(window.location.pathname);
        }
    }

    private origenPadre(): string {
        const ancestros = (window.location as Location & { ancestorOrigins?: DOMStringList }).ancestorOrigins;
        if (ancestros && ancestros.length > 0) return ancestros[0];
        try { return document.referrer ? new URL(document.referrer).origin : ''; } catch (_) { return ''; }
    }
}
