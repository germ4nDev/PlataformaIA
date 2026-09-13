import { Injectable } from '@angular/core';
import { BehaviorSubject, forkJoin, Observable, of } from 'rxjs';
import { map, tap, take } from 'rxjs/operators';
import { PtlactividadesRolesService } from './ptlactividades-roles.service';
import { LocalStorageService } from './local-storage.service';
import { SocketService } from './../service/sockets.service';
import { NavigationService } from './navigation.service';
import { SwalAlertService } from './swal-alert.service';
import { SocketManagerService } from './socket-manager.service';

@Injectable({
    providedIn: 'root'
})
export class PtlPermisosService {
    private _actividadesAutorizadas = new BehaviorSubject<string[]>([]);
    public actividadesAutorizadas$ = this._actividadesAutorizadas.asObservable();

    private _rolesAutorizados = new BehaviorSubject<string[]>([]);
    public rolesAutorizados$ = this._rolesAutorizados.asObservable();

    private _codigosRolesActuales: string[] = [];

    constructor(
        private _actividadesRolesService: PtlactividadesRolesService,
        private _localStorageService: LocalStorageService,
        private _navigationService: NavigationService,
        private _swalService: SwalAlertService,
        private _socketService: SocketService,
        private _socketManager: SocketManagerService
    ) {
        this.inicializarEscuchaSockets();
    }

    private inicializarEscuchaSockets(): void {
        this._socketManager.permisosActualizados$.subscribe((data) => {
            console.log('📡 Alerta desde Manager Recibida:', data?.mensaje);

            const elRolMeAfecta = data.codigoRole ? this._codigosRolesActuales.includes(data.codigoRole) : true;

            if (elRolMeAfecta) {
                console.log(`⚡ El rol [${data.codigoRole}] te afecta. 🚀 LANZANDO TOAST...`);
                this._swalService.getToastInfo('Tus permisos han sido actualizados.');

                this.inicializarPermisosPorDefecto().pipe(take(1)).subscribe();
            } else {
                console.log(`💤 Cambio en el rol [${data.codigoRole}] ignorado. No pertenece a este usuario.`);
            }
        });
    }

    inicializarPermisosPorDefecto(): Observable<string[]> {
        const currentUser = this._localStorageService.getCurrentUserLocalStorage();

        const aplicacionActual = this._localStorageService.getObject<any>('aplicacion');
        if (!currentUser || !currentUser.usuariosSC) {
            this.limpiarPermisos();
            return of([]);
        }

        const usuarioSCDefecto = currentUser?.usuariosSC?.[0];
        const suscriptorDefecto = usuarioSCDefecto?.suscriptores?.[0];
        const empresaDefecto = suscriptorDefecto?.empresasAsignadas?.[0];

        if (usuarioSCDefecto && empresaDefecto) {
            console.log(`🚀 Auto-arranque: Iniciando con la empresa por defecto [${empresaDefecto.codigoEmpresaSC}]`);
            return this.cargarPermisosUsuarioYEmpresa(usuarioSCDefecto.codigoUsuarioSC, empresaDefecto.codigoEmpresaSC);
        } else {
            console.warn('⚠️ Contexto incompleto: Esperando selección de aplicación/empresa.');
            this.limpiarPermisos();
            return of([]);
        }
    }

    cargarPermisosUsuarioYEmpresa(codigoUsuarioSC: string, codigoEmpresaSC: string): Observable<string[]> {
        const currentUser = this._localStorageService.getCurrentUserLocalStorage();

        if (!currentUser || !currentUser.usuariosSC) {
            this.limpiarPermisos();
            return of([]);
        }

        let rolesDeEstaEmpresa: any[] = [];
        const usuSC = currentUser.usuariosSC.find((u: any) => u.codigoUsuarioSC === codigoUsuarioSC);

        if (usuSC && usuSC.suscriptores) {
            for (const susc of usuSC.suscriptores) {
                if (susc.empresasAsignadas) {
                    const empresaEncontrada = susc.empresasAsignadas.find((e: any) => e.codigoEmpresaSC === codigoEmpresaSC);

                    if (empresaEncontrada && empresaEncontrada.rolesAsignados) {
                        rolesDeEstaEmpresa = empresaEncontrada.rolesAsignados;
                        const nombresDeRoles = rolesDeEstaEmpresa.map((rol: any) => rol.nombreRolLegible);

                        this._rolesAutorizados.next(nombresDeRoles);
                        this._codigosRolesActuales = rolesDeEstaEmpresa.map((rol: any) => rol.codigoRole);

                        console.group('%c1. Roles encontrados en Storage', 'color: #007bff; font-weight: bold;');
                        console.log(`🛡️ Empresa: ${codigoEmpresaSC}`, rolesDeEstaEmpresa);
                        console.log(`👑 Roles Legibles cargados para el Guard:`, nombresDeRoles);
                        console.groupEnd();
                        break;
                    }
                }
            }
        }

        if (rolesDeEstaEmpresa.length === 0) {
            this.limpiarPermisos();
            return of([]);
        }

        const peticionesActividades = rolesDeEstaEmpresa.map((rol: any) =>
            this._actividadesRolesService.getRegistroByCodeRole(rol.codigoRole).pipe(take(1))
        );

        return forkJoin(peticionesActividades).pipe(
            map((respuestasActividades: any) => {
                const actividadesSet = new Set<string>();

                respuestasActividades.forEach((resp: any, index: number) => {
                    const actividades = Array.isArray(resp) ? resp : (resp.data || []);

                    actividades.forEach((ar: any) => {
                        const actividadMaestraActiva = ar.actividad ? ar.actividad.estadoActividad === true : true;

                        if (ar.permiso === true && actividadMaestraActiva) {
                            const permisoLegible = ar.actividad?.llavePermiso || ar.codigoActividad;
                            actividadesSet.add(permisoLegible);
                        }
                    });
                });

                return Array.from(actividadesSet);
            }),
            tap((actividadesFinales: string[]) => {
                // 1. Actualiza la RAM y Menú
                this._actividadesAutorizadas.next(actividadesFinales);
                this._navigationService.getNavigationItems();

                currentUser.usuario.permisos = actividadesFinales;
                this._localStorageService.setCurrentUserLocalStorage(currentUser);
            })
        );
    }

    tienePermiso(codigoPermiso: string): boolean {
        // 1. Verificamos la caché en memoria (rápida y reactiva)
        const permisosMemoria = this._actividadesAutorizadas.getValue();
        if (permisosMemoria.length > 0) {
            return permisosMemoria.includes(codigoPermiso);
        }

        // 2. Fallback (Si presionaron F5): Leemos directamente del sessionStorage
        const currentUser = this._localStorageService.getCurrentUserLocalStorage();
        const permisosStorage = currentUser?.usuario?.permisos || [];

        // Autorecuperación: Si estaban en storage pero no en memoria, restauramos la memoria
        if (permisosStorage.length > 0 && permisosMemoria.length === 0) {
            this._actividadesAutorizadas.next(permisosStorage);
        }

        return permisosStorage.includes(codigoPermiso);
    }

    tieneRole(criterioRol: string): boolean {
        // 1. Verificamos la caché de nombres en memoria
        const rolesMemoria = this._rolesAutorizados.getValue();
        if (rolesMemoria.length > 0) {
            return rolesMemoria.includes(criterioRol);
        }

        // 2. Fallback: Buscamos en los objetos del sessionStorage
        const currentUser = this._localStorageService.getCurrentUserLocalStorage();
        const rolesStorage = currentUser?.usuario?.roles || [];

        // 3. Evaluamos buscando en la raíz y en el objeto anidado 'role'
        return rolesStorage.some((relacion: any) => {
            // Coincidencia rápida en la tabla pivote (si pasas el ID de la relación o el ID del rol)
            if (relacion.codigoUsuarioRole === criterioRol || relacion.codigoRole === criterioRol) {
                return true;
            }

            // Coincidencia en el objeto anidado completo que agregaste
            if (relacion.role) {
                return relacion.role.codigoRole === criterioRol ||
                    relacion.role.nombreRole === criterioRol ||
                    relacion.role.nombreRolLegible === criterioRol;
            }

            return false;
        });
    }

    limpiarPermisos() {
        this._actividadesAutorizadas.next([]);
        this._rolesAutorizados.next([]);
        this._codigosRolesActuales = [];
    }
}
