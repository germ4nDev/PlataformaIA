import { Injectable } from '@angular/core';
import { BehaviorSubject, forkJoin, Observable, of } from 'rxjs';
import { map, tap, take } from 'rxjs/operators';
import { PtlactividadesRolesService } from './ptlactividades-roles.service';
import { LocalStorageService } from './local-storage.service';
import { SocketService } from './../service/sockets.service';
import { NavigationService } from './navigation.service';
import { SwalAlertService } from './swal-alert.service';

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
        private _socketService: SocketService
    ) {
        this.inicializarEscuchaSockets();
    }

    private inicializarEscuchaSockets(): void {
        this._socketService.listen<{ codigoRole?: string, mensaje?: string }>('permisos_actualizados')
            .subscribe((data) => {
                console.log('📡 Alerta Socket Recibida:', data?.mensaje);

                const elRolMeAfecta = data.codigoRole ? this._codigosRolesActuales.includes(data.codigoRole) : true;

                if (elRolMeAfecta) {
                    // 🟢 1. LOG DE DIAGNÓSTICO PARA EL TOAST
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

        const usuarioSCDefecto = currentUser?.usuariosSC?.[0];
        const suscriptorDefecto = usuarioSCDefecto?.suscriptores?.[0];
        const empresaDefecto = suscriptorDefecto?.empresasAsignadas?.[0];

        if (usuarioSCDefecto && empresaDefecto) {
            console.log(`🚀 Auto-arranque: Iniciando con la empresa por defecto [${empresaDefecto.codigoEmpresaSC}]`);
            return this.cargarPermisosUsuarioYEmpresa(usuarioSCDefecto.codigoUsuarioSC, empresaDefecto.codigoEmpresaSC);
        } else {
            console.warn('⚠️ No se encontró una empresa por defecto para inicializar los permisos.');
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

                        // 🟢 Tu payload usa 'permiso' para saber si está activo o inactivo
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

                // 🟢 2. NUEVO: Guarda físicamente en el Local/Session Storage.
                // ¡OJO! Reemplaza 'permisos_usuario' por la llave exacta que uses en tu app
                this._localStorageService.setObject('permisos_usuario', actividadesFinales);
            })
        );

        // return forkJoin(peticionesActividades).pipe(
        //     map((respuestasActividades: any) => {
        //         const actividadesSet = new Set<string>();
        //         console.group('%c2. Cruce de Actividades desde el Backend', 'color: #28a745; font-weight: bold;');

        //         respuestasActividades.forEach((resp: any, index: number) => {
        //             const actividades = Array.isArray(resp) ? resp : (resp.data || []);
        //             const nombreRol = rolesDeEstaEmpresa[index].codigoRole;

        //             console.log(`🔹 Rol [${nombreRol}] otorgó ${actividades.length} permisos:`, actividades);

        //             actividades.forEach((ar: any) => {
        //                 const actividadMaestraActiva = ar.actividad ? ar.actividad.estadoActividad === true : true;

        //                 const asignacionActiva = ar.estadoActividad !== false;

        //                 if (ar.permiso === true && actividadMaestraActiva && asignacionActiva) {
        //                     const permisoLegible = ar.actividad?.llavePermiso || ar.codigoActividad;
        //                     actividadesSet.add(permisoLegible);
        //                 }
        //             });
        //         });

        //         console.groupEnd();
        //         return Array.from(actividadesSet);
        //     }),
        //     tap((actividadesFinales: string[]) => {
        //         console.group('%c3. RAM Actualizada (Listo para UI)', 'color: #ffc107; font-weight: bold; background: #333;');
        //         console.log(`✅ Actividades únicas (${actividadesFinales.length}):`, actividadesFinales);
        //         console.groupEnd();

        //         this._actividadesAutorizadas.next(actividadesFinales);
        //         this._navigationService.getNavigationItems();
        //     })
        // );
    }

    tienePermiso(codigoPermiso: string): boolean {
        const permisosActuales = this._actividadesAutorizadas.getValue();
        return permisosActuales.includes(codigoPermiso);
    }

    tieneRole(nombreRolRequerido: string): boolean {
        const rolesActuales = this._rolesAutorizados.getValue();
        return rolesActuales.includes(nombreRolRequerido);
    }

    limpiarPermisos() {
        this._actividadesAutorizadas.next([]);
        this._rolesAutorizados.next([]);
        this._codigosRolesActuales = [];
    }
}
