import { Injectable, Injector } from '@angular/core';
import { Subject } from 'rxjs';
import { Router } from '@angular/router';
import { SocketService } from './sockets.service';
import { LocalStorageService } from './local-storage.service';
import { SwalAlertService } from './swal-alert.service';

@Injectable({
    providedIn: 'root'
})
export class SocketManagerService {
    // Observables para que las vistas (tablas, formularios) reaccionen a los cambios

    // USUARIOS
    public usuariosActualizados$ = new Subject<any>();
    public rolesActualizados$ = new Subject<any>();
    public permisosActualizados$ = new Subject<any>();
    public rolesUsuariosActualizados$ = new Subject<any>();
    public usuariosRolesActualizados$ = new Subject<any>();

    // Canal para el widget de usuarios conectados y auditoría de sesiones
    public sesionesActualizadas$ = new Subject<any>();

    // ACTIVIDADES
    public actividadesActualizadas$ = new Subject<any>();
    public actividadesRolesActualizadas$ = new Subject<any>();

    // APLICACIONES
    public aplicacionesActualizados$ = new Subject<any>();
    public suitesActualizados$ = new Subject<any>();
    public modulosActualizados$ = new Subject<any>();
    public paquetesActualizados$ = new Subject<any>();
    public versionesActualizados$ = new Subject<any>();

    // SUSCRIPTORES
    public suscriptoresActualizados$ = new Subject<any>();
    public usuariosSCActualizados$ = new Subject<any>();
    public empresasSCActualizados$ = new Subject<any>();
    public usuariosEmpresasSCActualizados$ = new Subject<any>();
    public paquetesSCActualizados$ = new Subject<any>();

    // TICKETS
    public ticketsActualizados$ = new Subject<any>();
    public requerimientosTKActualizados$ = new Subject<any>();
    public sseguimientosTKActualizados$ = new Subject<any>();
    public clasesTKActualizados$ = new Subject<any>();

    // UTILIDADES
    public coloresNavActualizados$ = new Subject<any>();
    public idiomasActualizados$ = new Subject<any>();
    public sliderInicioActualizados$ = new Subject<any>();

    // LISTA PRECIOS
    public itemsActualizados$ = new Subject<any>();
    public tiposItemActualizados$ = new Subject<any>();
    public tiosValorActualizados$ = new Subject<any>();

    // WIDGETS INICIO
    public widgetsActualizados$ = new Subject<any>();
    public widgetsRolesActualizados$ = new Subject<any>();
    public layoutActualizado$ = new Subject<any>();
    public datosTablero$ = new Subject<any>();
    public listasPreciosActualizadas$ = new Subject<any>();

    constructor(
        private socketService: SocketService,
        private _localStorageService: LocalStorageService,
        private _swalAlertService: SwalAlertService,
        private injector: Injector
    ) {
        this.iniciarListenersGlobales();
    }

    private iniciarListenersGlobales() {
        // ==========================================
        // USUARIOS
        // ==========================================
        this.socketService.listen('usuarios-actualizados').subscribe(data => this.usuariosActualizados$.next(data));
        this.socketService.listen('roles-actualizados').subscribe(data => this.rolesActualizados$.next(data));
        this.socketService.listen('permisos_actualizados').subscribe(data => this.permisosActualizados$.next(data));
        this.socketService.listen('roles-usuarios-actualizados').subscribe(data => this.rolesUsuariosActualizados$.next(data));
        this.socketService.listen('usuarios-roles-actualizados').subscribe(data => this.usuariosRolesActualizados$.next(data));

        // Listener para capturar el evento que emite el backend de sesiones
        this.socketService.listen('sesiones-actualizadas').subscribe(data => this.sesionesActualizadas$.next(data));

        // Cierre de Sesión Concurrente (El Golpe de Gracia)
        this.socketService.listen<any>('sesion-reemplazada').subscribe(data => this.ejecutarGolpeDeGracia(data));

        // ==========================================
        // ACTIVIDADES
        // ==========================================
        this.socketService.listen('actividades-actualizadas').subscribe(data => this.actividadesActualizadas$.next(data));
        this.socketService.listen('actividades-roles-actualizadas').subscribe(data => this.actividadesRolesActualizadas$.next(data));

        // ==========================================
        // APLICACIONES
        // ==========================================
        this.socketService.listen('aplicaciones-actualizadas').subscribe(data => this.aplicacionesActualizados$.next(data));
        this.socketService.listen('suites-actualizadas').subscribe(data => this.suitesActualizados$.next(data));
        this.socketService.listen('modulos-actualizados').subscribe(data => this.modulosActualizados$.next(data));
        this.socketService.listen('paquetes-actualizados').subscribe(data => this.paquetesActualizados$.next(data));
        this.socketService.listen('versiones-actualizadas').subscribe(data => this.versionesActualizados$.next(data));

        // ==========================================
        // SUSCRIPTORES
        // ==========================================
        this.socketService.listen('suscriptores-actualizados').subscribe(data => this.suscriptoresActualizados$.next(data));
        this.socketService.listen('usuarios-sc-actualizados').subscribe(data => this.usuariosSCActualizados$.next(data));
        this.socketService.listen('empresas-sc-actualizadas').subscribe(data => this.empresasSCActualizados$.next(data));
        this.socketService.listen('usuarios-empresas-sc-actualizados').subscribe(data => this.usuariosEmpresasSCActualizados$.next(data));
        this.socketService.listen('paquetes-sc-actualizados').subscribe(data => this.paquetesSCActualizados$.next(data));

        // ==========================================
        // LISTA PRECIOS
        // ==========================================
        this.socketService.listen('items-actualizados').subscribe(data => this.itemsActualizados$.next(data));
        this.socketService.listen('tipos-item-actualizados').subscribe(data => this.tiposItemActualizados$.next(data));
        this.socketService.listen('tipos-valor-actualizados').subscribe(data => this.tiosValorActualizados$.next(data));

        // ==========================================
        // TICKETS
        // ==========================================
        this.socketService.listen('tickets-actualizados').subscribe(data => this.ticketsActualizados$.next(data));
        this.socketService.listen('requerimientos-tk-actualizados').subscribe(data => this.requerimientosTKActualizados$.next(data));
        this.socketService.listen('seguimientos-tk-actualizados').subscribe(data => this.sseguimientosTKActualizados$.next(data));
        this.socketService.listen('clases-tk-actualizadas').subscribe(data => this.clasesTKActualizados$.next(data));

        // ==========================================
        // UTILIDADES
        // ==========================================
        this.socketService.listen('colores-nav-actualizados').subscribe(data => this.coloresNavActualizados$.next(data));
        this.socketService.listen('idiomas-actualizados').subscribe(data => this.idiomasActualizados$.next(data));
        this.socketService.listen('slider-inicio-actualizados').subscribe(data => this.sliderInicioActualizados$.next(data));

        // ==========================================
        // WIDGETS INICIO
        // ==========================================
        this.socketService.listen('widgets-actualizados').subscribe(data => this.widgetsActualizados$.next(data));
        this.socketService.listen('widgets-roles-actualizados').subscribe(data => this.widgetsRolesActualizados$.next(data));
        this.socketService.listen('layout-actualizado').subscribe(data => this.layoutActualizado$.next(data));
        this.socketService.listen('lista-precios-actualizados').subscribe(data => this.listasPreciosActualizadas$.next(data));
        this.socketService.listen('actualizacion-datos-widget').subscribe(data => {
            this.datosTablero$.next(data);
        });
    }

    private ejecutarGolpeDeGracia(data: any): void {
        const router = this.injector.get(Router);

        if (router.url.includes('/login')) return;

        console.log('📡 [MANAGER] Evento "sesion-reemplazada" recibido:', data);

        const rawUser = localStorage.getItem('currentUser') || sessionStorage.getItem('currentUser');
        let currentUser = null;
        let currentSession = null;

        if (rawUser) {
            const parsed = JSON.parse(rawUser);
            currentUser = parsed?.codigoUsuario || parsed?.usuario?.codigoUsuario || null;
            currentSession = parsed?.codigoSesion || parsed?.usuario?.codigoSesion || null;
        }

        if (!currentUser) currentUser = localStorage.getItem('codigoUsuario');

        const localUserStr = String(currentUser).trim();
        const localSessionStr = String(currentSession).trim();
        const incomingUserStr = String(data.codigoUsuario).trim();
        const incomingSessionStr = String(data.nuevaSesionId).trim();

        if (incomingUserStr === localUserStr && incomingSessionStr !== localSessionStr) {
            console.warn('⚠️ [MANAGER] ¡Cierre forzado! Sesión abierta en otro navegador.');

            // Cortamos comunicación al instante
            if (this.socketService) this.socketService.disconnect();

            // 1. Dejamos la nota póstuma
            localStorage.setItem('alerta_expiracion', 'Se ha iniciado sesión con tu usuario desde otro dispositivo o pestaña. Por tu seguridad, esta sesión ha sido cerrada.');

            // 2. Limpieza quirúrgica de credenciales
            localStorage.removeItem('token');
            localStorage.removeItem('currentUser');
            localStorage.removeItem('codigoUsuario');
            sessionStorage.removeItem('currentUser');
            sessionStorage.removeItem('codigoSesionActiva');

            // 3. Redirección inmediata (Cero pantallas blancas)
            window.location.href = '/autenticacion/login';
        }
    }

    actualizarContextoSesion(codigoSuscriptor: string | null, codigoAplicacion: string | null = null, codigoSuite: string | null = null, codigoModulo: string | null = null): void {
        const rawUser = localStorage.getItem('currentUser') || sessionStorage.getItem('currentUser');
        let codigoSesion = '';

        if (rawUser) {
            try {
                const parsed = JSON.parse(rawUser);
                codigoSesion = parsed?.codigoSesion || parsed?.usuario?.codigoSesion || '';
            } catch (e) { }
        }

        if (codigoSesion) {
            this.socketService.emit('actualizar-contexto', {
                codigoSesion: codigoSesion,
                codigoSuscriptor: codigoSuscriptor,
                codigoAplicacion: codigoAplicacion,
                codigoSuite: codigoSuite,
                codigoModulo: codigoModulo,
                fechaActualizacion: new Date()
            });
        }
    }

    // MÉTODOS EMISORES ÚTILES PARA EL FLUJO DE SESIÓN
    public registrarSesion(userData: any): void {
        this.socketService.emit('registrar_sesion', userData);
    }

    public notificarCambioModulo(nombreModulo: string): void {
        this.socketService.emit('cambiar_modulo', { modulo: nombreModulo });
    }
}
