/*
    Author: German Valencia
    Refactored for: PORTTOS Architecture & TCL Multi-Agent
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

    constructor(private socket: Socket) {
        console.log('🔌 SocketService inicializado.');
        this.inicializarConexion();
    }

    private inicializarConexion() {
        const codigoUsuario = this.obtenerCodigoUsuarioGuardado();

        if (codigoUsuario) {
            // Si hay usuario, configuramos la autenticación antes de conectar
            const ioSocket = (this.socket as any).ioSocket;
            if (ioSocket) {
                ioSocket.auth = { codigoUsuario };
            }
            // Conectamos solo si hay usuario logueado
            if (!this.socket.ioSocket?.connected) {
                this.socket.connect();
                console.log(`🔑 Socket conectándose con sesión de: ${codigoUsuario}`);
            }
        } else {
            console.warn('⚠️ No hay usuario en sesión. El socket se omite hasta el Login.');
            return; // No conectamos si no hay usuario
        }

        // Listeners
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

    /**
     * Llamar EXCLUSIVAMENTE tras un Login exitoso
     */
    public conectarConUsuario(codigoUsuario: string) {
        if (!codigoUsuario) return;

        localStorage.setItem('codigoUsuario', codigoUsuario); // Aseguramos que se guarde

        const ioSocket = (this.socket as any).ioSocket;
        if (ioSocket) {
            ioSocket.auth = { codigoUsuario };
        }

        // Si ya está conectado, no lo matamos. Solo actualizamos el auth o reconectamos limpiamente una sola vez.
        if (this.socket.ioSocket?.connected) {
            console.log('🔄 Socket ya activo, actualizando contexto para:', codigoUsuario);
            return;
        }

        console.log(`🚀 Iniciando socket post-login para: ${codigoUsuario}`);
        this.socket.connect();
    }

    private obtenerCodigoUsuarioGuardado(): string | null {
        try {
            const rawUser = localStorage.getItem('currentUser') || localStorage.getItem('usuario');
            if (rawUser) {
                const parsed = JSON.parse(rawUser);
                return parsed?.codigoUsuario || parsed?.usuario?.codigoUsuario || null;
            }
            return localStorage.getItem('codigoUsuario');
        } catch (e) {
            return localStorage.getItem('codigoUsuario');
        }
    }

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
