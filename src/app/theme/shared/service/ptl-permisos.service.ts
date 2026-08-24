/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable } from '@angular/core';
import { BehaviorSubject, forkJoin, Observable, of } from 'rxjs';
import { map, switchMap, tap, take } from 'rxjs/operators';
import { PtlusuariosRolesApService } from './ptlusuarios-roles-ap.service';
import { PtlactividadesRolesService } from './ptlactividades-roles.service';

@Injectable({
    providedIn: 'root'
})
export class PtlPermisosService {
    private _actividadesAutorizadas = new BehaviorSubject<string[]>([]);
    public actividadesAutorizadas$ = this._actividadesAutorizadas.asObservable();

    constructor(
        private _usuariosRolesService: PtlusuariosRolesApService,
        private _actividadesRolesService: PtlactividadesRolesService
    ) { }

    // 🟢 Método original (para cuando se carga por usuario general)
    cargarPermisosUsuario(codigoUsuarioSC: string): Observable<string[]> {
        return this._usuariosRolesService.getRegistroByCodigoUsuario(codigoUsuarioSC).pipe(
            take(1),
            switchMap((respRoles: any) => {
                const rolesDelUsuario = respRoles.usuarioRole || [];

                if (rolesDelUsuario.length === 0) {
                    return of([]);
                }

                const peticionesActividades = rolesDelUsuario.map((rol: any) =>
                    this._actividadesRolesService.getRegistroByCodeRole(rol.codigoRole).pipe(take(1))
                );

                return forkJoin(peticionesActividades).pipe(
                    map((respuestasActividades: any) => {
                        const actividadesSet = new Set<string>();

                        respuestasActividades.forEach((resp: any) => {
                            const actividades = resp.actividadesRoles || [];
                            actividades.forEach((ar: any) => {
                                actividadesSet.add(ar.codigoActividad);
                            });
                        });

                        return Array.from(actividadesSet);
                    })
                );
            }),
            tap((actividadesFinales: string[]) => {
                console.log('🛡️ Permisos calculados y guardados en RAM:', actividadesFinales);
                this._actividadesAutorizadas.next(actividadesFinales);
            })
        );
    }

    // 🟢 NUEVO MÉTODO: Filtra por Usuario y Empresa específica (Usado por el selector de empresas)
    cargarPermisosUsuarioYEmpresa(codigoUsuarioSC: string, codigoEmpresaSC: string): Observable<string[]> {
        return this._usuariosRolesService.getRolesPorUsuarioYEmpresa(codigoUsuarioSC, codigoEmpresaSC).pipe(
            take(1),
            switchMap((respRoles: any) => {
                // 🟢 Extraemos 'usuarioRole' tal como lo hace el método original de usuario
                const rolesDelUsuario = respRoles.usuarioRole || [];

                if (rolesDelUsuario.length === 0) {
                    return of([]);
                }

                const peticionesActividades = rolesDelUsuario.map((rol: any) =>
                    this._actividadesRolesService.getRegistroByCodeRole(rol.codigoRole).pipe(take(1))
                );

                return forkJoin(peticionesActividades).pipe(
                    map((respuestasActividades: any) => {
                        const actividadesSet = new Set<string>();

                        respuestasActividades.forEach((resp: any) => {
                            const actividades = resp.actividadesRoles || [];
                            actividades.forEach((ar: any) => {
                                actividadesSet.add(ar.codigoActividad);
                            });
                        });

                        return Array.from(actividadesSet);
                    })
                );
            }),
            tap((actividadesFinales: string[]) => {
                console.log('🛡️ Permisos de Empresa recalculados y guardados en RAM:', actividadesFinales);
                this._actividadesAutorizadas.next(actividadesFinales);
            })
        );
    }

    tienePermiso(codigoActividad: string): boolean {
        const permisosActuales = this._actividadesAutorizadas.getValue();
        return permisosActuales.includes(codigoActividad);
    }

    limpiarPermisos() {
        this._actividadesAutorizadas.next([]);
    }
}
