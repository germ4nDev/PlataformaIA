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
                codigoUsuario,
                codigoSesion
            };
        }
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
