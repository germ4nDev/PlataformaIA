/*
    Author: German Valencia
    Refactored for: PORTTOS Architecture & TCL Multi-Agent
    Responsibility: Pure Socket.io connection and real-time event tunneling.
*/
import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { Socket } from 'ngx-socket-io';

@Injectable({
    providedIn: 'root'
})
export class SocketService {
    private connectedSubject = new BehaviorSubject<boolean>(false);
    public connected$ = this.connectedSubject.asObservable();

    /** Puerto cuya sala GNL está activa. Se vuelve a unir automáticamente al reconectar. */
    private puertoGnlActivo: string | null = null;

    /** Sala activa por módulo (ej. maritimo → puerto:BUENAVENTURA:maritimo). Se restauran al reconectar. */
    private salasPuerto = new Map<string, string>();

    /** Quién usa cada sala (mapa, widgets...): se sale solo cuando el último la suelta. */
    private duenosSalaPuerto = new Map<string, Set<string>>();

    constructor(
        private socket: Socket
    ) {
        console.log('🔌 SocketService inicializado.');
        this.inicializarConexion();
    }

    private inicializarConexion() {
        const codigoUsuario = this.obtenerCodigoUsuarioGuardado();
        const codigoSesion = sessionStorage.getItem('codigoSesionActiva');

        if (codigoUsuario && codigoSesion) {
            this.configurarAuthSocket(codigoUsuario, codigoSesion);

            if (!this.socket.ioSocket?.connected) {
                this.socket.connect();
                console.log(`🔑 Socket reconectándose con sesión activa: ${codigoSesion}`);
            }
        } else {
            console.warn('⚠️ No hay sesión activa. El socket esperará al Login.');
        }

        this.configurarListenersGlobales();
    }

    private configurarListenersGlobales() {
        this.socket.fromEvent('connect').subscribe(() => {
            console.log('✅ Socket.IO conectado al servidor.');
            this.connectedSubject.next(true);
            // Las salas no sobreviven a una reconexión: se restauran aquí
            if (this.puertoGnlActivo) {
                this.socket.emit('join-gnl', { puerto: this.puertoGnlActivo });
            }
            this.salasPuerto.forEach((sala) => this.socket.emit('unirse-sala', sala));
        });

        this.socket.fromEvent('disconnect').subscribe(() => {
            console.warn('❌ Socket.IO desconectado.');
            this.connectedSubject.next(false);
        });

        this.socket.fromEvent('connect_error').subscribe((error: any) => {
            console.error('⚠️ Error de conexión Socket.IO:', error);
            this.connectedSubject.next(false);
        });
    }

    public conectarConUsuario(codigoUsuario: string, codigoSesion?: string) {
        if (!codigoUsuario) return;

        const sessionActual = codigoSesion || sessionStorage.getItem('codigoSesionActiva');

        this.configurarAuthSocket(codigoUsuario, sessionActual);

        if (this.socket.ioSocket?.connected) {
            console.log('🔄 Socket ya activo, vinculando nueva sesión:', sessionActual);
            this.emit('vincular_socket_sesion', { codigoSesion: sessionActual });
            return;
        }

        console.log(`🚀 Iniciando socket post-login para usuario: ${codigoUsuario}`);
        this.socket.connect();
    }

    private configurarAuthSocket(codigoUsuario: string, codigoSesion: string | null) {
        const ioSocket = (this.socket as any).ioSocket;
        if (ioSocket) {
            ioSocket.auth = {
                token: this.obtenerTokenGuardado(), // validado por el backend (io.use → socketAuth)
                codigoUsuario,
                codigoSesion
            };
        }
    }

    // ==========================================
    // SALAS DE TIEMPO REAL
    // ==========================================
    /** Recibe la telemetría GNL de un puerto (una sola sala GNL activa a la vez). */
    public unirseSalaGnl(puerto: string): void {
        const puertoNormalizado = (puerto || '').trim().toUpperCase();
        if (!puertoNormalizado) return;
        if (this.puertoGnlActivo && this.puertoGnlActivo !== puertoNormalizado) {
            this.socket.emit('leave-gnl', { puerto: this.puertoGnlActivo });
        }
        this.puertoGnlActivo = puertoNormalizado;
        this.socket.emit('join-gnl', { puerto: puertoNormalizado });
    }

    public salirSalaGnl(): void {
        if (!this.puertoGnlActivo) return;
        this.socket.emit('leave-gnl', { puerto: this.puertoGnlActivo });
        this.puertoGnlActivo = null;
    }

    /**
     * Une al cliente a la sala de un módulo para el puerto elegido en el filtro (una sala por módulo).
     * Ej.: unirseSalaPuerto('maritimo', 'Buenaventura') → puerto:BUENAVENTURA:maritimo.
     * El backend ajusta el radar AIS a los puertos que tienen al menos un cliente en su sala.
     */
    public unirseSalaPuerto(modulo: string, puerto: string, dueno: string = 'default'): void {
        const clave = SocketService.normalizarPuerto(puerto);
        if (!modulo || !clave) return;
        if (!this.duenosSalaPuerto.has(modulo)) this.duenosSalaPuerto.set(modulo, new Set<string>());
        this.duenosSalaPuerto.get(modulo)!.add(dueno);
        const sala = `puerto:${clave}:${modulo}`;
        const anterior = this.salasPuerto.get(modulo);
        if (anterior === sala) return;
        if (anterior) this.socket.emit('salir-sala', anterior);
        this.salasPuerto.set(modulo, sala);
        this.socket.emit('unirse-sala', sala);
    }

    public salirSalaPuerto(modulo: string, dueno: string = 'default'): void {
        const duenos = this.duenosSalaPuerto.get(modulo);
        duenos?.delete(dueno);
        if (duenos && duenos.size > 0) return; // otro componente sigue usando la sala
        this.duenosSalaPuerto.delete(modulo);
        const sala = this.salasPuerto.get(modulo);
        if (!sala) return;
        this.socket.emit('salir-sala', sala);
        this.salasPuerto.delete(modulo);
    }

    /** Misma regla que normalizarPuerto() del backend: "Santa Marta" → "SANTA_MARTA". */
    public static normalizarPuerto(puerto: string): string {
        return String(puerto || '')
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .trim().toUpperCase()
            .replace(/[^A-Z0-9]+/g, '_')
            .replace(/^_+|_+$/g, '');
    }

    public notificarCambioModulo(codigoModulo: string): void {
        this.emit('actualizar_contexto_sesion', { codigoModulo });
    }

    public notificarCambioContexto(contexto: {
        codigoSuscriptor?: string;
        codigoSuite?: string;
        codigoAplicacion?: string;
        codigoModulo?: string;
    }): void {
        this.emit('actualizar_contexto_sesion', contexto);
    }

    private obtenerTokenGuardado(): string | null {
        try {
            const rawUser = localStorage.getItem('currentUser') || sessionStorage.getItem('currentUser');
            return rawUser ? JSON.parse(rawUser)?.token || null : null;
        } catch {
            return null;
        }
    }

    private obtenerCodigoUsuarioGuardado(): string | null {
        try {
            const rawUser = localStorage.getItem('currentUser') || sessionStorage.getItem('currentUser');
            if (rawUser) {
                const parsed = JSON.parse(rawUser);
                return parsed?.codigoUsuario || parsed?.usuario?.codigoUsuario || null;
            }
            return localStorage.getItem('codigoUsuario');
        } catch (e) {
            return localStorage.getItem('codigoUsuario');
        }
    }

    // ==========================================
    // WRAPPERS NATIVOS DE SOCKET.IO
    // ==========================================

    public fromEvent<T = any>(eventName: string): Observable<T> {
        return this.socket.fromEvent<T>(eventName);
    }

    public listen<T = any>(eventName: string): Observable<T> {
        return this.fromEvent<T>(eventName);
    }

    public emit(eventName: string, data?: any): void {
        this.socket.emit(eventName, data);
    }

    public disconnect(): void {
        this.socket.disconnect();
    }
}
