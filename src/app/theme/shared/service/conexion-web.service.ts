/*
    Author: German Valencia
    Servicio (núcleo): Estado de conexión de la web (CC-279)
    Description: ¿Hay internet? (eventos online/offline del navegador) · ¿Responde el API? (latido GET /api/salud cada 30 s, sin
      interceptores ni sesión; caído con 2 fallos seguidos) · ¿Responde la base? (lo dice el latido) · ¿Está vivo el tiempo real?
      (socket desconectado más de 15 s con sesión activa). Cada parte dice desde cuándo falla; al recuperarse todo, «restablecida»
      se mantiene unos segundos. Lo muestran los avisos de conexión del mapa (Porttos) y lo puede usar cualquier aplicación.
*/
import { Injectable, NgZone, OnDestroy } from '@angular/core';
import { HttpBackend, HttpClient } from '@angular/common/http';
import { BehaviorSubject, Subscription, timeout } from 'rxjs';
import { environment } from 'src/environments/environment';
import { SocketService } from './sockets.service';

export interface ParteConexion { ok: boolean; desde: string | null; }
export interface EstadoConexion {
  internet: ParteConexion; api: ParteConexion; bd: ParteConexion; tiempoReal: ParteConexion;
  /** ISO de la última recuperación (se limpia a los 6 s). */
  restablecidaEn: string | null;
}

const LATIDO_MS = 30000;
const TOPE_LATIDO_MS = 8000;
const FALLOS_API = 2;
const GRACIA_SOCKET_MS = 15000;
const RESTABLECIDA_MS = 6000;
const bien = (): ParteConexion => ({ ok: true, desde: null });

@Injectable({ providedIn: 'root' })
export class EstadoConexionService implements OnDestroy {
  private readonly http: HttpClient;
  private readonly estado = new BehaviorSubject<EstadoConexion>({
    internet: { ok: typeof navigator === 'undefined' ? true : navigator.onLine, desde: null }, api: bien(), bd: bien(), tiempoReal: bien(), restablecidaEn: null,
  });
  readonly estado$ = this.estado.asObservable();

  private fallosApi = 0;
  private temporizadorLatido: any = null;
  private temporizadorSocket: any = null;
  private temporizadorRestablecida: any = null;
  private readonly subs = new Subscription();
  private readonly alOnline = () => this.cambiarInternet(true);
  private readonly alOffline = () => this.cambiarInternet(false);

  constructor(backend: HttpBackend, private readonly sockets: SocketService, private readonly zona: NgZone) {
    this.http = new HttpClient(backend);   // sin interceptores: el latido no lleva sesión ni dispara avisos de error
    if (!this.estado.value.internet.ok) this.parcial({ internet: { ok: false, desde: new Date().toISOString() } });
    window.addEventListener('online', this.alOnline);
    window.addEventListener('offline', this.alOffline);
    this.subs.add(this.sockets.connected$.subscribe((conectado) => this.cambiarSocket(conectado)));
    this.latido();
    this.zona.runOutsideAngular(() => { this.temporizadorLatido = setInterval(() => this.zona.run(() => this.latido()), LATIDO_MS); });
  }

  get valor(): EstadoConexion { return this.estado.value; }

  /** Revisa ya (por ejemplo, al volver internet). */
  latido(): void {
    if (!this.estado.value.internet.ok) return;
    this.http.get<{ ok: boolean; bd?: { ok: boolean } }>(`${environment.apiUrl}/salud`).pipe(timeout(TOPE_LATIDO_MS)).subscribe({
      next: (r) => {
        this.fallosApi = 0;
        const ahora = new Date().toISOString();
        const bdOk = r?.bd?.ok !== false;
        this.parcial({
          api: bien(),
          bd: bdOk ? bien() : { ok: false, desde: this.estado.value.bd.desde || ahora },
        });
      },
      error: () => {
        this.fallosApi++;
        if (this.fallosApi >= FALLOS_API && this.estado.value.api.ok) this.parcial({ api: { ok: false, desde: new Date().toISOString() } });
      },
    });
  }

  private cambiarInternet(ok: boolean): void {
    if (ok === this.estado.value.internet.ok) return;
    this.parcial({ internet: ok ? bien() : { ok: false, desde: new Date().toISOString() } });
    if (ok) { this.fallosApi = 0; this.latido(); }
  }

  /** El socket arranca desconectado y reconecta solo: se avisa solo si sigue caído 15 s y hay sesión. */
  private cambiarSocket(conectado: boolean): void {
    clearTimeout(this.temporizadorSocket);
    if (conectado) { if (!this.estado.value.tiempoReal.ok) this.parcial({ tiempoReal: bien() }); return; }
    const desde = new Date().toISOString();
    this.temporizadorSocket = setTimeout(() => {
      if (sessionStorage.getItem('codigoSesionActiva')) this.parcial({ tiempoReal: { ok: false, desde } });
    }, GRACIA_SOCKET_MS);
  }

  private parcial(cambio: Partial<EstadoConexion>): void {
    const antes = this.estado.value;
    const despues = { ...antes, ...cambio };
    const caido = (e: EstadoConexion) => !e.internet.ok || !e.api.ok || !e.bd.ok || !e.tiempoReal.ok;
    if (caido(antes) && !caido(despues)) {
      despues.restablecidaEn = new Date().toISOString();
      clearTimeout(this.temporizadorRestablecida);
      this.temporizadorRestablecida = setTimeout(() => this.estado.next({ ...this.estado.value, restablecidaEn: null }), RESTABLECIDA_MS);
    } else if (caido(despues)) {
      despues.restablecidaEn = null;
    }
    this.estado.next(despues);
  }

  ngOnDestroy(): void {
    window.removeEventListener('online', this.alOnline);
    window.removeEventListener('offline', this.alOffline);
    clearInterval(this.temporizadorLatido);
    clearTimeout(this.temporizadorSocket);
    clearTimeout(this.temporizadorRestablecida);
    this.subs.unsubscribe();
  }
}
