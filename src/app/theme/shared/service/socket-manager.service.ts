import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { SocketService } from './sockets.service'; // Tu servicio de sockets
import { LocalStorageService } from './local-storage.service'; // Tu servicio de storage

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

    // ACTIVIDADES
    public actividadesActualizadas$ = new Subject<any>();
    public actividadesRolesActualizadas$ = new Subject<any>();

    // APLICACIONES
    public aplicacionesActualizados$ = new Subject<any>();
    public suitesActualizados$ = new Subject<any>();
    public modulosActualizados$ = new Subject<any>();
    public paquetesActualizados$ = new Subject<any>();
    public versionesActualizados$ = new Subject<any>();

    // SUSCRIPTOR
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

    // LISTAA PRECIOS
    public itemsActualizados$ = new Subject<any>();
    public tiposItemActualizados$ = new Subject<any>();
    public tiosValorActualizados$ = new Subject<any>();

    // WIDGETS MAESTRO
    public widgetsActualizados$ = new Subject<any>();
    public widgetsRolesActualizados$ = new Subject<any>();

    constructor(
        private socketService: SocketService,
        private localStorageService: LocalStorageService
    ) {
        this.iniciarListenersGlobales();
    }

    private iniciarListenersGlobales() {
        // ==========================================
        // USUARIOS
        // ==========================================
        this.socketService.listen('usuarios-actualizados').subscribe(data => this.usuariosActualizados$.next(data)); //ok
        this.socketService.listen('roles-actualizados').subscribe(data => this.rolesActualizados$.next(data)); //ok
        this.socketService.listen('permisos_actualizados').subscribe(data => this.permisosActualizados$.next(data));
        this.socketService.listen('roles-usuarios-actualizados').subscribe(data => this.rolesUsuariosActualizados$.next(data));
        this.socketService.listen('usuarios-roles-actualizados').subscribe(data => this.usuariosRolesActualizados$.next(data));

        // ==========================================
        // ACTIVIDADES
        // ==========================================
        this.socketService.listen('actividades-actualizadas').subscribe(data => this.actividadesActualizadas$.next(data)); //ok
        this.socketService.listen('actividades-roles-actualizadas').subscribe(data => this.actividadesRolesActualizadas$.next(data)); //ok

        // ==========================================
        // APLICACIONES
        // ==========================================
        this.socketService.listen('aplicaciones-actualizadas').subscribe(data => this.aplicacionesActualizados$.next(data)); //ok
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
        // LOSTA PRECIOS
        // ==========================================
        this.socketService.listen('items-actualizados').subscribe(data => this.ticketsActualizados$.next(data));
        this.socketService.listen('tipos-item-actualizados').subscribe(data => this.requerimientosTKActualizados$.next(data));
        this.socketService.listen('tipos-valor-actualizados').subscribe(data => this.sseguimientosTKActualizados$.next(data));

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
        this.socketService.listen('colores-nav-actualizados').subscribe(data => this.ticketsActualizados$.next(data));
        this.socketService.listen('idiomas-actualizados').subscribe(data => this.requerimientosTKActualizados$.next(data));
        this.socketService.listen('slider-inicio-actualizados').subscribe(data => this.sseguimientosTKActualizados$.next(data));

        // ==========================================
        // WIDGETS INICIO
        // ==========================================
        this.socketService.listen('widgets-maestro-actualizados').subscribe(data => this.widgetsActualizados$.next(data));
        this.socketService.listen('widgets-roles-actualizados').subscribe(data => this.widgetsRolesActualizados$.next(data));
    }

    // private verificarYActualizarSesion() {
    //     // Usamos el getter de tu LocalStorageService
    //     const currentUser = this.localStorageService.getCurrentUserLocalStorage();

    //     if (currentUser && currentUser.usuario) {
    //         // Llamada a tu API para traer los roles y actividades frescos de la base de datos
    //         //   this.authService..obtenerPerfilFresco(currentUser.usuario.codigoUsuario).subscribe(
    //         //     (nuevoPerfil: any) => {
    //         //       // Usamos los setters de tu LocalStorageService para actualizar la memoria
    //         //       this.localStorageService.setRolesLocalStorage(nuevoPerfil.roles);
    //         //       this.localStorageService.setActividadesLocalStorage(nuevoPerfil.actividades);

    //         //       console.log('✅ Sesión actualizada globalmente vía Socket');
    //         //     }
    //         //   );
    //     }
    // }
}
