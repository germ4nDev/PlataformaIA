// /* eslint-disable @angular-eslint/use-lifecycle-interface */
// /* eslint-disable @typescript-eslint/no-explicit-any */
// //#region IMPORTS
// import { Component, EventEmitter, OnInit, Output } from '@angular/core'
// import { CommonModule } from '@angular/common'
// import { GradientConfig } from 'src/app/app-config'
// import { Router } from '@angular/router'
// import { BehaviorSubject, catchError, combineLatest, map, Observable, startWith, switchMap } from 'rxjs'
// import { SharedModule } from 'src/app/theme/shared/shared.module'
// import { TranslateModule } from '@ngx-translate/core'
// import { TranslateService } from '@ngx-translate/core'
// import { NavBarComponent } from 'src/app/theme/layout/admin/nav-bar/nav-bar.component'
// import { NavContentComponent } from 'src/app/theme/layout/admin/navigation/nav-content/nav-content.component'
// import { DatatableComponent } from 'src/app/theme/shared/components/data-table/data-table.component'
// import { ColumnMetadata } from 'src/app/theme/shared/_helpers/models/ColumnMetadata.model'
// import { PTLLogActividadAPModel } from 'src/app/theme/shared/_helpers/models/PTLlogActividadAP.model'
// import { NavigationItem } from 'src/app/theme/shared/_helpers/models/Navigation.model'
// import { BaseSessionModel } from 'src/app/theme/shared/_helpers/models/BaseSession.model'
// import { PTLAplicacionModel } from 'src/app/theme/shared/_helpers/models/PTLAplicacion.model'
// import {
//     NavigationService,
//     PtlAplicacionesService,
//     LanguageService,
//     PtlusuariosRolesApService,
//     PtlSuitesAPService,
//     PTLUsuariosService,
//     PtlusuariosScService,
//     LocalStorageService,
//     PTLSuscriptoresService
// } from 'src/app/theme/shared/service'
// import { of, Subscription } from 'rxjs'
// import Swal from 'sweetalert2'
// import { PtllogActividadesService, PTLRolesAPService, SwalAlertService } from 'src/app/theme/shared/service'
// import { PTLSuiteAPModel } from 'src/app/theme/shared/_helpers/models/PTLSuiteAP.model'
// import { PTLRoleAPModel } from 'src/app/theme/shared/_helpers/models/PTLRoleAP.model'
// import { PTLUsuarioModel } from 'src/app/theme/shared/_helpers/models/PTLUsuario.model'
// import { PTLUsuarioRoleAPModel } from 'src/app/theme/shared/_helpers/models/PTLUsuarioRole.model'
// import { DataLoaderComponent } from 'src/app/theme/shared/components/data-loader/data-loader.component'
// import { PTLUsuarioSCModel } from 'src/app/theme/shared/_helpers/models/PTLUsuarioSC.model'
// import { PTLSuscriptorModel } from 'src/app/theme/shared/_helpers/models/PTLSuscriptor.model'
// //#endregion IMPORTS

// @Component({
//     selector: 'app-usuarios-role',
//     standalone: true,
//     imports: [CommonModule, SharedModule, TranslateModule, NavBarComponent, NavContentComponent, DatatableComponent, DataLoaderComponent],
//     templateUrl: './usuarios-roles.component.html',
//     styleUrl: './usuarios-roles.component.scss'
// })
// export class UsuariosRolesComponent implements OnInit {
//     //#region VARIABLES
//     @Output() toggleSidebar = new EventEmitter<void>()
//     usuario: PTLUsuarioModel = new PTLUsuarioModel();
//     DataModel: BaseSessionModel = new BaseSessionModel()
//     DataLogActividad: PTLLogActividadAPModel = new PTLLogActividadAPModel()
//     moduloTituloExcel: string = ''
//     hasFiltersSlot: boolean = false
//     gradientConfig
//     lang = localStorage.getItem('lang')
//     menuItems$!: Observable<NavigationItem[]>
//     activeTab: 'menu' | 'filters' | 'main' = 'menu'
//     tituloPagina: string = ''
//     codigoRole: string = ''

//     subscriptions = new Subscription()
//     filtroCodigoRoleSubject = new BehaviorSubject<string>('todos')
//     filtroCodigoUsuariosRolesSubject = new BehaviorSubject<string>('todos')
//     filtroEstadoSubject = new BehaviorSubject<string>('todos')
//     filtroTipoRolSubject = new BehaviorSubject<string>('todos')

//     registrosTransformados$: Observable<PTLUsuarioRoleAPModel[]> = of([])
//     registrosFiltrado$: Observable<PTLUsuarioRoleAPModel[]> = of([])
//     roles: PTLRoleAPModel[] = []
//     usuariosRoles: PTLUsuarioRoleAPModel[] = []
//     usuarios: PTLUsuarioModel[] = []
//     usuariosSC: PTLUsuarioSCModel[] = []
//     registros: PTLUsuarioRoleAPModel[] = []
//     aplicaciones: PTLAplicacionModel[] = []
//     suites: PTLSuiteAPModel[] = []
//     suscriptores: PTLSuscriptorModel[] = []

//     colorOpcion1 = '#3db120'
//     letraOpcion1 = 'I'
//     //#endregion VARIABLES

//     constructor(
//         private router: Router,
//         private translate: TranslateService,
//         private _navigationService: NavigationService,
//         private _aplicacionesService: PtlAplicacionesService,
//         private _usuariosRolesService: PtlusuariosRolesApService,
//         private _usuariosService: PTLUsuariosService,
//         private _usuariosSCService: PtlusuariosScService,
//         private _rolesAPService: PTLRolesAPService,
//         private _suitesService: PtlSuitesAPService,
//         private _suscriptoresService: PTLSuscriptoresService,
//         private _logActividadesService: PtllogActividadesService,
//         private _swalAlertService: SwalAlertService,
//         private _localStorageService: LocalStorageService
//     ) {
//         this.gradientConfig = GradientConfig
//         this.codigoRole = this._localStorageService.getObject<string>('regId') || '';
//     }

//     ngOnInit() {
//         this._navigationService.getNavigationItems()
//         this.menuItems$ = this._navigationService.menuItems$;
//         this.hasFiltersSlot = true;
//         this.roles = this._rolesAPService.getRolesActuales();
//         this.usuariosSC = this._usuariosSCService.getUsuariosSCActuales();
//         this.aplicaciones = this._aplicacionesService.getBAplicacionesActuales();
//         this.suites = this._suitesService.getSuitesActuales();
//         this.suscriptores = this._suscriptoresService.getSuscriptoresActuales();
//         this.usuariosRoles = this._usuariosRolesService.getUsuairosRolesActuales();
//         this.usuarios = this._usuariosService.getUsuariosActuales();
//         console.log('datos usuarios', this.usuarios);
//         this.usuario = this.usuarios.find(x => x.codigoUsuario == this.codigoRole) || {}
//         console.log('datos usuario', this.usuario);
//         this.tituloPagina = this.translate.instant('USUARIOS.USUARIOSROLES.TITLE') + ' ' + this.usuario.nombreUsuario;
//         console.log('roles actuales', this.roles);
//         console.log('usuarios actuales', this.usuarios);
//         console.log('aplicaciones actuales', this.aplicaciones);
//         console.log('suites actuales', this.suites);
//         setTimeout(() => {
//             this.setupRolesStream()
//         }, 100)
//         this.subscriptions.add(
//             this._usuariosRolesService.cargarRegistros().subscribe(
//                 () => console.log('Roles cargados y guardados en el servicio'),
//                 err => console.error('Error al cargar roles:', err)
//             )
//         )
//     }

//     ngOnDestroy(): void {
//         this.subscriptions.unsubscribe()
//     }

//     setupRolesStream(): void {
//         this.registrosTransformados$ = this._usuariosRolesService._usuariosRoles$.pipe(
//             switchMap((usuariosRoles: PTLUsuarioRoleAPModel[]) => {
//                 if (!usuariosRoles || usuariosRoles.length === 0) return of([]);

//                 const codigosSCDelUsuario = this.usuariosSC
//                     .filter(x => x.codigoUsuario === this.codigoRole)
//                     .map(x => x.codigoUsuarioSC);

//                 const rolesDelUsuario = usuariosRoles.filter(rol =>
//                     codigosSCDelUsuario.includes(rol.codigoUsuarioSC)
//                 );

//                 const transformedApps = rolesDelUsuario.map((usuarioRole: any) => {
//                     usuarioRole.nomEstado = usuarioRole.estadoUsuarioRole ? 'Activo' : 'Inactivo';

//                     const rolAsignado = this.roles.find(x => x.codigoRole === usuarioRole.codigoRole);
//                     usuarioRole.nomRole = rolAsignado ? rolAsignado.nombreRole : 'N/A';

//                     const codigoAppDelRol = rolAsignado ? rolAsignado.codigoAplicacion : null;
//                     const codigoSuiteDelRol = rolAsignado ? rolAsignado.codigoSuite : null;

//                     const appEncontrada = codigoAppDelRol
//                         ? this.aplicaciones.find(x => x.codigoAplicacion === codigoAppDelRol)
//                         : null;
//                     usuarioRole.nomAplicacion = appEncontrada ? appEncontrada.nombreAplicacion : 'N/A';

//                     const suiteEncontrada = codigoSuiteDelRol
//                         ? this.suites.find(x => x.codigoSuite === codigoSuiteDelRol)
//                         : null;
//                     usuarioRole.nomSuite = suiteEncontrada ? suiteEncontrada.nombreSuite : 'N/A';

//                     const relacionSC = this.usuariosSC.find(x => x.codigoUsuarioSC === usuarioRole.codigoUsuarioSC);

//                     const usuarioAsignado = relacionSC
//                         ? this.usuarios.find(x => x.codigoUsuario === relacionSC.codigoUsuario)
//                         : null;
//                     usuarioRole.nomUsuario = usuarioAsignado ? usuarioAsignado.nombreUsuario : 'N/A';

//                     const suscriptorAsignado = relacionSC
//                         ? this.suscriptores.find(x => x.codigoSuscriptor === relacionSC.codigoSuscriptor)
//                         : null;
//                     usuarioRole.nomSuscriptor = suscriptorAsignado ? suscriptorAsignado.nombreSuscriptor : 'N/A';

//                     usuarioRole.tipoRol = codigoAppDelRol ? 'Suscriptor' : 'Plataforma';

//                     return usuarioRole as PTLUsuarioRoleAPModel;
//                 });

//                 this.registros = transformedApps;
//                 console.log('todos los roles del usuario', this.registros);
//                 return of(transformedApps);
//             }),
//             catchError(err => {
//                 console.error('Error en el stream de roles:', err);
//                 return of([]);
//             })
//         );

//         // El combineLatest para los filtros de la tabla se mantiene intacto
//         this.registrosFiltrado$ = combineLatest([
//             this.registrosTransformados$.pipe(startWith([])),
//             this.filtroCodigoRoleSubject,
//             this.filtroCodigoUsuariosRolesSubject,
//             this.filtroEstadoSubject,
//             this.filtroTipoRolSubject
//         ]).pipe(
//             map(([usuariosRoles, codigoRol, codigoUsuario, estado, tipoRol]) => {
//                 let filteredRegistros = usuariosRoles;

//                 if (tipoRol !== 'todos') {
//                     filteredRegistros = filteredRegistros.filter(reg => {
//                         const esSuscriptor = reg.codigoAplicacion && reg.codigoAplicacion !== '';
//                         return tipoRol === 'suscriptor' ? esSuscriptor : !esSuscriptor;
//                     });
//                 }
//                 if (codigoRol !== 'todos') {
//                     filteredRegistros = filteredRegistros.filter(reg => reg.codigoRole === codigoRol);
//                 }
//                 if (codigoUsuario !== 'todos') {
//                     filteredRegistros = filteredRegistros.filter(reg => reg.codigoUsuarioSC === codigoUsuario);
//                 }
//                 if (estado !== 'todos') {
//                     const estadoBoolean = estado === 'true';
//                     filteredRegistros = filteredRegistros.filter(reg => reg.estadoUsuarioRole === estadoBoolean);
//                 }
//                 return filteredRegistros;
//             })
//         );
//     }


//     columnasRegistros: ColumnMetadata[] = [
//         {
//             name: 'nomSuscriptor',
//             header: 'USUARIOS.USUARIOSROLES.NOMBRESUSCRIPTOR',
//             type: 'text'
//         },
//         {
//             name: 'nomAplicacion', // 🟢 Se mueve a la vista principal
//             header: 'USUARIOS.USUARIOSROLES.NOMBREAPLICACION',
//             type: 'text'
//         },
//         {
//             name: 'nomRole',
//             header: 'USUARIOS.USUARIOSROLES.NOMBREROL',
//             type: 'text'
//         },
//         {
//             name: 'tipoRol',
//             header: 'USUARIOS.USUARIOSROLES.TIPOROLE',
//             type: 'text'
//         },
//         {
//             name: 'nomEstado',
//             header: 'USUARIOS.USUARIOSROLES.ESTADOROLE',
//             type: 'estado'
//         }
//     ];

//     columnasDetailRegistros: ColumnMetadata[] = [
//         {
//             name: 'nomAplicacion',
//             header: 'USUARIOS.USUARIOSROLES.NOMBREAPLICACION',
//             type: 'text'
//         },
//         {
//             name: 'nomSuite',
//             header: 'USUARIOS.USUARIOSROLES.NOMBRESUITE',
//             type: 'text'
//         }
//     ]

//     onFiltroTipoRolChangeClick(evento: any): void {
//         const value = evento.target.value
//         this.filtroTipoRolSubject.next(value)
//     }

//     onFiltroCodigoUsuariosRolesChangeClick(evento: any): void {
//         const value = evento.target.value
//         this.filtroCodigoUsuariosRolesSubject.next(value)
//     }

//     onFiltroCodigoRoleChangeClick(evento: any): void {
//         const value = evento.target.value
//         this.filtroCodigoRoleSubject.next(value)
//     }

//     onFiltroEstadoChangeClick(evento: any): void {
//         const value = evento.target.value
//         this.filtroEstadoSubject.next(value)
//     }

//     OnNuevoRegistroClick() {
//         this._localStorageService.setObject('regId', this.codigoRole);
//         this.router.navigate(['usuarios/gestion-usuarios-role'])
//     }

//     OnRegresarClick(id: any) {
//         this._localStorageService.removeObject('regId');
//         this.router.navigate(['usuarios/roles'])
//     }

//     OnOption1Click(id: any) {
//         const value = id;
//         console.log('opcion 1 click', value);
//         const usuRole = this.usuariosRoles.find(x => x.codigoUsuarioRole == value) || {}
//         usuRole.estadoUsuarioRole = usuRole?.estadoUsuarioRole ? false : true;
//         usuRole.codigoUsuarioCreacion = this._localStorageService.getUsuarioLocalStorage().codigoUsuario;
//         usuRole.fechaCreacion = new Date().toISOString();
//         console.log('opcion 1 usuRole modificaar', usuRole);

//         this._usuariosRolesService.putModificarRegistro(usuRole).subscribe({
//             next: (resp: any) => {
//                 const logData = {
//                     codigoTipoLog: '',
//                     codigoRespuesta: '201',
//                     descripcionLog: this.translate.instant('ROLES.ELIMINAREXITOSA') + ' ' + resp.mensaje
//                 }
//                 this._logActividadesService.postCrearRegistro(logData).subscribe(() => console.log('log creado exitosamente'))
//                 this.setupRolesStream()
//                 this._swalAlertService.getAlertSuccess(this.translate.instant('ROLES.ELIMINAREXITOSA') + ' ' + resp.mensaje)
//             },
//             error: (err: any) => {
//                 const logData = {
//                     codigoTipoLog: '',
//                     codigoRespuesta: '201',
//                     descripcionLog: this.translate.instant('ROLES.ELIMINARERROR') + ' ' + err.mensaje
//                 }
//                 this._logActividadesService.postCrearRegistro(logData).subscribe(() => console.log('log creado exitosamente'))
//                 this._swalAlertService.getAlertSuccess(this.translate.instant('ROLES.ELIMINARERROR') + ' ' + err.mensaje)
//                 console.error('Error eliminando', err)
//             }
//         })
//     }

//     OnEliminarRegistroClick(id: any) {
//         // const nombre = this.registros.filter((x) => x.codigoRole == id.id)[0]
//         this._swalAlertService.getAlertQuestionRequest(
//             this.translate.instant('ACTIVIDADES.ELIMINARTEXTO'),
//             this.translate.instant('ACTIVIDADES.ELIMINARTITULO'),
//             this.translate.instant('PLATAFORMA.DELETE'),
//             this.translate.instant('PLATAFORMA.CANCEL')
//         ).subscribe(result => {
//             if (result) {
//                 const usuRole = this.usuariosRoles.filter(x => x.codigoUsuarioRole == id.id)[0];
//                 console.log('inactivar usuRole', id.id);
//                 this._usuariosRolesService.deleteTodosUsuarioRole(id.id).subscribe({
//                     next: (resp: any) => {
//                         console.log('respuesta', resp);
//                         if (resp.ok) {
//                             const logData = {
//                                 codigoTipoLog: '',
//                                 codigoRespuesta: '201',
//                                 descripcionLog: this.translate.instant('ACTIVIDADES.UPDATESUCCSESSFULLY')
//                             };
//                             this._logActividadesService.postCrearRegistro(logData).subscribe(() => console.log('log creado exitosamente'));
//                             this.setupRolesStream()
//                             this._swalAlertService.getAlertSuccess(this.translate.instant('ACTIVIDADES.UPDATESUCCSESSFULLY'));
//                         }
//                     },
//                     error: (err: any) => {
//                         console.error(err);
//                         const logData = {
//                             codigoTipoLog: '',
//                             codigoRespuesta: '501',
//                             descripcionLog: this.translate.instant('ACTIVIDADES.UPDATEERROR')
//                         };
//                         this._logActividadesService.postCrearRegistro(logData).subscribe(() => console.log('log creado exitosamente'));
//                         this._swalAlertService.getAlertError('No se pudo actualizar la Actividad');
//                     }
//                 });
//             }
//         })
//     }

//     toggleNav(): void {
//         this.toggleSidebar.emit()
//     }
// }
/* eslint-disable @angular-eslint/use-lifecycle-interface */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { BehaviorSubject, combineLatest, Observable, of, Subscription } from 'rxjs';
import { catchError, map, startWith, switchMap } from 'rxjs/operators';
import { SharedModule } from 'src/app/theme/shared/shared.module';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { NavBarComponent } from 'src/app/theme/layout/admin/nav-bar/nav-bar.component';
import { NavContentComponent } from 'src/app/theme/layout/admin/navigation/nav-content/nav-content.component';
import { DataLoaderComponent } from 'src/app/theme/shared/components/data-loader/data-loader.component';
import { ColumnMetadata } from 'src/app/theme/shared/_helpers/models/ColumnMetadata.model';
import { NavigationItem } from 'src/app/theme/shared/_helpers/models/Navigation.model';
import { PTLUsuarioRoleAPModel } from 'src/app/theme/shared/_helpers/models/PTLUsuarioRole.model';
import { PTLRoleAPModel } from 'src/app/theme/shared/_helpers/models/PTLRoleAP.model';
import { PTLUsuarioModel } from 'src/app/theme/shared/_helpers/models/PTLUsuario.model';
import { PTLUsuarioSCModel } from 'src/app/theme/shared/_helpers/models/PTLUsuarioSC.model';
import { PTLSuscriptorModel } from 'src/app/theme/shared/_helpers/models/PTLSuscriptor.model';
import {
    NavigationService,
    PtlusuariosRolesApService,
    PTLUsuariosService,
    PtlusuariosScService,
    LocalStorageService,
    PTLSuscriptoresService,
    PTLRolesAPService,
    SwalAlertService,
    PtllogActividadesService
} from 'src/app/theme/shared/service';
import { TableDataComponent } from "src/app/theme/shared/components/table-data/table-data.component";

@Component({
    selector: 'app-usuarios-role',
    standalone: true,
    imports: [CommonModule, SharedModule, TranslateModule, NavBarComponent, NavContentComponent, DataLoaderComponent, TableDataComponent],
    templateUrl: './usuarios-roles.component.html',
    styleUrl: './usuarios-roles.component.scss'
})
export class UsuariosRolesComponent implements OnInit {
    @Output() toggleSidebar = new EventEmitter<void>();

    rolActual: PTLRoleAPModel = new PTLRoleAPModel();
    codigoRoleBase: string = '';
    tituloPagina: string = '';

    menuItems$!: Observable<NavigationItem[]>;
    activeTab: 'menu' | 'filters' | 'main' = 'menu';
    subscriptions = new Subscription();

    filtroEstadoSubject = new BehaviorSubject<string>('todos');
    filtroSuscriptorSubject = new BehaviorSubject<string>('todos');

    registrosTransformados$: Observable<PTLUsuarioRoleAPModel[]> = of([]);
    registrosFiltrado$: Observable<PTLUsuarioRoleAPModel[]> = of([]);

    roles: PTLRoleAPModel[] = [];
    usuariosRoles: PTLUsuarioRoleAPModel[] = [];
    usuarios: PTLUsuarioModel[] = [];
    usuariosSC: PTLUsuarioSCModel[] = [];
    suscriptores: PTLSuscriptorModel[] = [];

    colorOpcion1 = '#3db120'
    letraOpcion1 = 'I'

    constructor(
        private router: Router,
        private translate: TranslateService,
        private _navigationService: NavigationService,
        private _usuariosRolesService: PtlusuariosRolesApService,
        private _usuariosService: PTLUsuariosService,
        private _usuariosSCService: PtlusuariosScService,
        private _rolesAPService: PTLRolesAPService,
        private _suscriptoresService: PTLSuscriptoresService,
        private _swalAlertService: SwalAlertService,
        private _logActividadesService: PtllogActividadesService,
        private _localStorageService: LocalStorageService
    ) {
        // En este componente, regId representa el ID del ROL, no del usuario
        this.codigoRoleBase = this._localStorageService.getObject<string>('regId') || '';
    }

    ngOnInit() {
        this._navigationService.getNavigationItems();
        this.menuItems$ = this._navigationService.menuItems$;

        this.roles = this._rolesAPService.getRolesActuales();
        this.usuariosSC = this._usuariosSCService.getUsuariosSCActuales();
        this.suscriptores = this._suscriptoresService.getSuscriptoresActuales();
        this.usuariosRoles = this._usuariosRolesService.getUsuairosRolesActuales();
        this.usuarios = this._usuariosService.getUsuariosActuales();

        this.rolActual = this.roles.find(x => x.codigoRole === this.codigoRoleBase) || new PTLRoleAPModel();
        this.tituloPagina = `Usuarios con el Rol: ${this.rolActual.nombreRole || 'Desconocido'}`;

        setTimeout(() => { this.setupUsuariosStream(); }, 100);

        this.subscriptions.add(
            this._usuariosRolesService.cargarRegistros().subscribe()
        );
    }

    ngOnDestroy(): void {
        this.subscriptions.unsubscribe();
    }

    setupUsuariosStream(): void {
        this.registrosTransformados$ = this._usuariosRolesService._usuariosRoles$.pipe(
            switchMap((usuariosRoles: PTLUsuarioRoleAPModel[]) => {
                if (!usuariosRoles || usuariosRoles.length === 0) return of([]);

                // 1. Filtrar la tabla puente SOLO por el rol actual
                const usuariosDelRol = usuariosRoles.filter(ur => ur.codigoRole === this.codigoRoleBase);

                // 2. Mapear los nombres de los usuarios y suscriptores
                const transformedUsers = usuariosDelRol.map((ur: any) => {
                    ur.nomEstado = ur.estadoUsuarioRole ? 'Activo' : 'Inactivo';

                    // Formatear fecha para visualización
                    ur.fechaCreacionFormateada = ur.fechaCreacion ? new Date(ur.fechaCreacion).toLocaleDateString() : 'N/A';

                    const relacionSC = this.usuariosSC.find(x => x.codigoUsuarioSC === ur.codigoUsuarioSC);

                    const usuarioBase = relacionSC ? this.usuarios.find(u => u.codigoUsuario === relacionSC.codigoUsuario) : null;
                    ur.nomUsuario = usuarioBase ? usuarioBase.nombreUsuario : 'Usuario No Encontrado';

                    const suscriptor = relacionSC ? this.suscriptores.find(s => s.codigoSuscriptor === relacionSC.codigoSuscriptor) : null;
                    ur.nomSuscriptor = suscriptor ? suscriptor.nombreSuscriptor : 'Plataforma (Global)';
                    ur.codigoSuscriptor = suscriptor ? suscriptor.codigoSuscriptor : 'plataforma'; // Para el filtro

                    return {
                        ...ur,
                        '_acciones': [
                            { accion: 'INACTIVAR', letra: 'I', color: '#3db120', tooltip: (this.translate.instant('USUARIOSROLES.INACTIVAR')) }
                        ],
                    } as PTLUsuarioRoleAPModel;
                });

                return of(transformedUsers);
            }),
            catchError(err => {
                console.error('Error en el stream de usuarios:', err);
                return of([]);
            })
        );

        this.registrosFiltrado$ = combineLatest([
            this.registrosTransformados$.pipe(startWith([])),
            this.filtroEstadoSubject,
            this.filtroSuscriptorSubject
        ]).pipe(
            map(([registros, estado, suscriptor]) => {
                let filtrados = registros;

                if (estado !== 'todos') {
                    const estadoBool = estado === 'true';
                    filtrados = filtrados.filter(reg => reg.estadoUsuarioRole === estadoBool);
                }
                if (suscriptor !== 'todos') {
                    filtrados = filtrados.filter((reg: any) => reg.codigoSuscriptor === suscriptor);
                }

                return filtrados;
            })
        );
    }

    columnasRegistros: ColumnMetadata[] = [
        { name: 'nomUsuario', header: 'Nombre Usuario', type: 'text' },
        { name: 'nomSuscriptor', header: 'Suscriptor Asignado', type: 'text' },
        { name: 'fechaCreacionFormateada', header: 'Fecha Asignación', type: 'text' },
        { name: 'nomEstado', header: 'Estado', type: 'estado' }
    ];

    columnasDetailRegistros: ColumnMetadata[] = [
        {
            name: 'nomAplicacion',
            header: 'USUARIOS.USUARIOSROLES.NOMBREAPLICACION',
            type: 'text'
        },
        {
            name: 'nomSuite',
            header: 'USUARIOS.USUARIOSROLES.NOMBRESUITE',
            type: 'text'
        }
    ]

    onFiltroEstadoChangeClick(evento: any): void {
        this.filtroEstadoSubject.next(evento.target.value);
    }

    onFiltroSuscriptorChangeClick(evento: any): void {
        this.filtroSuscriptorSubject.next(evento.target.value);
    }

    OnNuevoRegistroClick() {
        this._localStorageService.setObject('regId', this.codigoRoleBase);
        this.router.navigate(['usuarios/gestion-usuarios-role'])
    }

    OnRegresarClick(evento: any) {
        this._localStorageService.removeObject('regId');
        this.router.navigate(['usuarios/roles'])
    }

    OnEliminarRegistroClick(id: any) {
        this._swalAlertService.getAlertQuestionRequest(
            this.translate.instant('ACTIVIDADES.ELIMINARTEXTO'),
            this.translate.instant('ACTIVIDADES.ELIMINARTITULO'),
            this.translate.instant('PLATAFORMA.DELETE'),
            this.translate.instant('PLATAFORMA.CANCEL')
        ).subscribe(result => {
            if (result) {
                this._usuariosRolesService.deleteTodosUsuarioRole(id.id).subscribe({
                    next: (resp: any) => {
                        if (resp.ok) {
                            this.setupUsuariosStream();
                            this._swalAlertService.getAlertSuccess('Relación eliminada exitosamente');
                        }
                    },
                    error: (err: any) => {
                        this._swalAlertService.getAlertError('No se pudo eliminar la relación');
                    }
                });
            }
        });
    }

    onAccionPrincipal(evento: { accion: string, row: any }) {
        const { accion, row } = evento;
        const id = row.codigoUsuarioRole || row.id;

        console.log(`Acción ejecutada: [${accion}] sobre el registro ID:`, id);

        switch (accion) {
            case 'INACTIVAR':
                this._swalAlertService.getAlertQuestionRequest(
                    this.translate.instant('USUARIOSROLES.INACTIVAR'),
                    this.translate.instant('USUARIOSROLES.INACTIVARTITULO'),
                    this.translate.instant('USUARIOSROLES.INACTIVARBTN'),
                    this.translate.instant('PLATAFORMA.CANCEL')
                ).subscribe(result => {
                    if (result) {
                        console.log('inactivar usuario codigo', id);
                        const value = id;
                        console.log('opcion 1 click', value);
                        const usuRole = this.usuariosRoles.find(x => x.codigoUsuarioRole == value) || {}
                        usuRole.estadoUsuarioRole = usuRole?.estadoUsuarioRole ? false : true;
                        usuRole.codigoUsuarioCreacion = this._localStorageService.getUsuarioLocalStorage().codigoUsuario;
                        usuRole.fechaCreacion = new Date().toISOString();
                        console.log('opcion 1 usuRole modificaar', usuRole);

                        this._usuariosRolesService.putModificarRegistro(usuRole).subscribe({
                            next: (resp: any) => {
                                const logData = {
                                    codigoTipoLog: '',
                                    codigoRespuesta: '201',
                                    descripcionLog: this.translate.instant('ROLES.ELIMINAREXITOSA') + ' ' + resp.mensaje
                                }
                                this._logActividadesService.postCrearRegistro(logData).subscribe(() => console.log('log creado exitosamente'))
                                this.setupUsuariosStream()
                                this._swalAlertService.getAlertSuccess(this.translate.instant('ROLES.ELIMINAREXITOSA') + ' ' + resp.mensaje)
                            },
                            error: (err: any) => {
                                const logData = {
                                    codigoTipoLog: '',
                                    codigoRespuesta: '201',
                                    descripcionLog: this.translate.instant('ROLES.ELIMINARERROR') + ' ' + err.mensaje
                                }
                                this._logActividadesService.postCrearRegistro(logData).subscribe(() => console.log('log creado exitosamente'))
                                this._swalAlertService.getAlertSuccess(this.translate.instant('ROLES.ELIMINARERROR') + ' ' + err.mensaje)
                                console.error('Error eliminando', err)
                            }
                        })

                    }
                });
                break;
            default:
                console.warn(`Acción no reconocida: ${accion}`);
                break;
        }
    }

    // OnOption1Click(id: any) {
    //     const value = id;
    //     console.log('opcion 1 click', value);
    //     const usuRole = this.usuariosRoles.find(x => x.codigoUsuarioRole == value) || {}
    //     usuRole.estadoUsuarioRole = usuRole?.estadoUsuarioRole ? false : true;
    //     usuRole.codigoUsuarioCreacion = this._localStorageService.getUsuarioLocalStorage().codigoUsuario;
    //     usuRole.fechaCreacion = new Date().toISOString();
    //     console.log('opcion 1 usuRole modificaar', usuRole);

    //     this._usuariosRolesService.putModificarRegistro(usuRole).subscribe({
    //         next: (resp: any) => {
    //             const logData = {
    //                 codigoTipoLog: '',
    //                 codigoRespuesta: '201',
    //                 descripcionLog: this.translate.instant('ROLES.ELIMINAREXITOSA') + ' ' + resp.mensaje
    //             }
    //             this._logActividadesService.postCrearRegistro(logData).subscribe(() => console.log('log creado exitosamente'))
    //             this.setupUsuariosStream()
    //             this._swalAlertService.getAlertSuccess(this.translate.instant('ROLES.ELIMINAREXITOSA') + ' ' + resp.mensaje)
    //         },
    //         error: (err: any) => {
    //             const logData = {
    //                 codigoTipoLog: '',
    //                 codigoRespuesta: '201',
    //                 descripcionLog: this.translate.instant('ROLES.ELIMINARERROR') + ' ' + err.mensaje
    //             }
    //             this._logActividadesService.postCrearRegistro(logData).subscribe(() => console.log('log creado exitosamente'))
    //             this._swalAlertService.getAlertSuccess(this.translate.instant('ROLES.ELIMINARERROR') + ' ' + err.mensaje)
    //             console.error('Error eliminando', err)
    //         }
    //     })
    // }

    toggleNav(): void {
        this.toggleSidebar.emit();
    }
}
