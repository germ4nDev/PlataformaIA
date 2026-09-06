/* eslint-disable @angular-eslint/use-lifecycle-interface */
/* eslint-disable @typescript-eslint/no-explicit-any */
//#region IMPORTS
import { Component, EventEmitter, OnInit, Output } from '@angular/core'
import { CommonModule } from '@angular/common'
import { GradientConfig } from 'src/app/app-config'
import { Router } from '@angular/router'
import { BehaviorSubject, catchError, combineLatest, map, Observable, startWith, switchMap } from 'rxjs'
import { SharedModule } from 'src/app/theme/shared/shared.module'
import { TranslateModule } from '@ngx-translate/core'
import { TranslateService } from '@ngx-translate/core'
import { NavBarComponent } from 'src/app/theme/layout/admin/nav-bar/nav-bar.component'
import { NavContentComponent } from 'src/app/theme/layout/admin/navigation/nav-content/nav-content.component'
import { DatatableComponent } from 'src/app/theme/shared/components/data-table/data-table.component'
import { PTLRoleAPModel } from 'src/app/theme/shared/_helpers/models/PTLRoleAP.model'
import { ColumnMetadata } from 'src/app/theme/shared/_helpers/models/ColumnMetadata.model'
import { PTLLogActividadAPModel } from 'src/app/theme/shared/_helpers/models/PTLlogActividadAP.model'
import { NavigationItem } from 'src/app/theme/shared/_helpers/models/Navigation.model'
import { BaseSessionModel } from 'src/app/theme/shared/_helpers/models/BaseSession.model'
import { PTLAplicacionModel } from 'src/app/theme/shared/_helpers/models/PTLAplicacion.model'
import { NavigationService, PtlAplicacionesService, PtlSuitesAPService, LocalStorageService, PTLUsuariosService, PtlusuariosScService, PTLSuscriptoresService, PtlusuariosRolesApService } from 'src/app/theme/shared/service'
import { of, Subscription } from 'rxjs'
import { PtllogActividadesService, PTLRolesAPService, SwalAlertService } from 'src/app/theme/shared/service'
import { PTLSuiteAPModel } from 'src/app/theme/shared/_helpers/models/PTLSuiteAP.model'
import { DataLoaderComponent } from 'src/app/theme/shared/components/data-loader/data-loader.component'
import { PTLUsuarioRoleAPModel } from 'src/app/theme/shared/_helpers/models/PTLUsuarioRole.model'
import { PTLUsuarioModel } from 'src/app/theme/shared/_helpers/models/PTLUsuario.model'
import { PTLUsuarioSCModel } from 'src/app/theme/shared/_helpers/models/PTLUsuarioSC.model'
import { PTLSuscriptorModel } from '../../../theme/shared/_helpers/models/PTLSuscriptor.model';
import { TableDataComponent } from "src/app/theme/shared/components/table-data/table-data.component";
//#endregion IMPORTS

@Component({
    selector: 'app-roles',
    standalone: true,
    imports: [CommonModule, SharedModule, TranslateModule, NavBarComponent, NavContentComponent, DatatableComponent, DataLoaderComponent, TableDataComponent],
    templateUrl: './roles.component.html',
    styleUrl: './roles.component.scss'
})
export class RolesComponent implements OnInit {
    //#region VARIABLES
    @Output() toggleSidebar = new EventEmitter<void>()
    DataModel: BaseSessionModel = new BaseSessionModel()
    DataLogActividad: PTLLogActividadAPModel = new PTLLogActividadAPModel()
    moduloTituloExcel: string = ''
    hasFiltersSlot: boolean = false
    gradientConfig
    lang = localStorage.getItem('lang')
    menuItems$!: Observable<NavigationItem[]>
    activeTab: 'menu' | 'filters' | 'main' = 'menu'
    tituloPagina: string = ''

    subscriptions = new Subscription()
    filtroTipoRolSubject = new BehaviorSubject<string>('todos')
    filtroCodigoRoleSubject = new BehaviorSubject<string>('todos')
    filtroCodigoAplicacionSubject = new BehaviorSubject<string>('todos')
    filtroCodigoSuiteSubject = new BehaviorSubject<string>('todos')
    filtroNombreSubject = new BehaviorSubject<string>('todos')
    filtroDescripcionSubject = new BehaviorSubject<string>('')
    filtroEstadoSubject = new BehaviorSubject<string>('todos')

    registrosTransformados$: Observable<PTLRoleAPModel[]> = of([])
    registrosFiltrado$: Observable<PTLRoleAPModel[]> = of([])
    roles: PTLRoleAPModel[] = []
    registros: PTLRoleAPModel[] = []
    aplicaciones: PTLAplicacionModel[] = []
    suites: PTLSuiteAPModel[] = []
    usuariosRoles: PTLUsuarioRoleAPModel[] = []
    usuarios: PTLUsuarioModel[] = []
    usuariosSC: PTLUsuarioSCModel[] = []
    suscriptores: PTLSuscriptorModel[] = []
    //#endregion VARIABLES

    constructor(
        private router: Router,
        private translate: TranslateService,
        private _navigationService: NavigationService,
        private _aplicacionesService: PtlAplicacionesService,
        private _suitesService: PtlSuitesAPService,
        private _rolesAPService: PTLRolesAPService,
        private _usuariosService: PTLUsuariosService,
        private _usuariosSCService: PtlusuariosScService,
        private _usuariosRolesService: PtlusuariosRolesApService,
        private _suscriptoresService: PTLSuscriptoresService,
        private _logActividadesService: PtllogActividadesService,
        private _localStorageService: LocalStorageService,
        private _swalService: SwalAlertService
    ) {
        this.gradientConfig = GradientConfig
    }

    ngOnInit() {
        this._navigationService.getNavigationItems();
        this.menuItems$ = this._navigationService.menuItems$;
        this.hasFiltersSlot = true;

        // 1. Cargar lo que ya exista en la memoria local (síncrono)
        this.aplicaciones = this._aplicacionesService.getBAplicacionesActuales();
        this.suites = this._suitesService.getSuitesActuales();
        this.usuarios = this._usuariosService.getUsuariosActuales();
        this.usuariosSC = this._usuariosSCService.getUsuariosSCActuales();
        this.suscriptores = this._suscriptoresService.getSuscriptoresActuales();
        this.usuariosRoles = this._usuariosRolesService.getUsuairosRolesActuales(); // 🟢 Agregado

        this.subscriptions.add(this._rolesAPService.cargarRegistros().subscribe(
            () => console.log('Roles cargados'),
            err => console.error('Error al cargar roles:', err)
        ));

        this.subscriptions.add(this._usuariosRolesService.cargarRegistros().subscribe());
        this.subscriptions.add(this._usuariosService.cargarRegistros().subscribe());
        this.subscriptions.add(this._usuariosSCService.cargarRegistros().subscribe());
        this.subscriptions.add(this._suscriptoresService.getRegistros().subscribe());

        setTimeout(() => {
            this.setupRolesStream();
        }, 100);
    }

    ngOnDestroy(): void {
        this.subscriptions.unsubscribe()
    }

    columnasRegistros: ColumnMetadata[] = [
        {
            name: 'nombreRole',
            header: 'USUARIOS.ROLES.NOMBREROL',
            type: 'text'
        },
        {
            name: 'nomEstado',
            header: 'USUARIOS.ROLES.ESTADOROLE',
            type: 'estado'
        },
        {
            name: 'tipoRol',
            header: 'USUARIOS.ROLES.TIPOROLE',
            type: 'text'
        }
    ]

    columnasDetailRegistros: ColumnMetadata[] = [
        {
            name: 'nomAplicacion',
            header: 'USUARIOS.ROLES.NOMBREAPLICACION',
            type: 'text'
        },
        {
            name: 'nomSuite',
            header: 'USUARIOS.ROLES.NOMBRESUITE',
            type: 'text'
        },
        {
            name: 'descripcionRole',
            header: 'USUARIOS.ROLES.DESCRIPCIONROL',
            type: 'text'
        },
        {
            name: 'usuarios',
            header: 'USUARIOS.ROLES.DESCRIPCIONROL',
            type: 'json-tabla'
        }
    ]

    setupRolesStream(): void {
        this.registrosTransformados$ = combineLatest([
            this._rolesAPService.roles$,
            this._usuariosRolesService._usuariosRoles$
        ]).pipe(
            switchMap(([roles, usuariosRoles]) => {
                if (!roles || roles.length === 0) return of([]);

                this.roles = roles;
                this.usuariosRoles = usuariosRoles || [];

                const transformedRoles = roles.map((role: any) => {
                    // 1. Estados y Botones Dinámicos
                    role.nomEstado = role.estadoRole ? 'Activo' : 'Inactivo';
                    role.letraDinamica1 = role.estadoRole ? 'I' : 'A';
                    role.colorDinamico1 = role.estadoRole ? '#dc3545' : '#28a745';
                    role.tooltipDinamico1 = role.estadoRole ? 'Inactivar Rol' : 'Activar Rol';

                    // 2. Cruces básicos del Rol
                    const appEncontrada = role.codigoAplicacion ? this.aplicaciones.find(x => x.codigoAplicacion === role.codigoAplicacion) : null;
                    role.nomAplicacion = appEncontrada ? appEncontrada.nombreAplicacion : 'N/A';

                    const suiteEncontrada = role.codigoSuite ? this.suites.find(x => x.codigoSuite === role.codigoSuite) : null;
                    role.nomSuite = suiteEncontrada ? suiteEncontrada.nombreSuite : 'N/A';

                    role.tipoRol = role.codigoAplicacion ? 'Suscriptor' : 'Plataforma';

                    // 3. SUBTABLA DE USUARIOS ('json-tabla')
                    // 🟢 Ahora this.usuariosRoles sí tiene datos garantizados
                    const asignacionesDelRol = this.usuariosRoles.filter(ur => ur.codigoRole === role.codigoRole);

                    role.usuarios = asignacionesDelRol.map(ur => {
                        const relacionSC = this.usuariosSC.find(sc => sc.codigoUsuarioSC === ur.codigoUsuarioSC);

                        const usuarioBase = relacionSC
                            ? this.usuarios.find(u => u.codigoUsuario === relacionSC.codigoUsuario)
                            : null;

                        const suscriptor = relacionSC
                            ? this.suscriptores.find(s => s.codigoSuscriptor === relacionSC.codigoSuscriptor)
                            : null;

                        return {
                            'Nombre Usuario': usuarioBase ? usuarioBase.nombreUsuario : 'Usuario Desconocido',
                            'Correo Electrónico': usuarioBase ? usuarioBase.correoUsuario : 'N/A',
                            'Suscriptor': suscriptor ? suscriptor.nombreSuscriptor : 'Plataforma',
                            'Fecha Asignación': ur.fechaCreacion ? new Date(ur.fechaCreacion).toLocaleDateString() : 'N/A',
                            'Estado': ur.estadoUsuarioRole ? 'Activo' : 'Inactivo'
                        };
                    });

                    return {
                        ...role,
                        '_acciones': [
                            { accion: 'INACTIVAR', letra: 'I', color: '#a02525', tooltip: (this.translate.instant('ROLES.INACTIVAR')) },
                            { accion: 'USUARIOS', letra: 'U', color: '#a025a0', tooltip: (this.translate.instant('ROLES.USUARIOSROLE')) }
                        ],
                    } as PTLRoleAPModel;
                });

                this.registros = transformedRoles;
                return of(transformedRoles);
            }),
            catchError(err => {
                console.error('Error en el stream de roles:', err);
                return of([]);
            })
        );

        this.registrosFiltrado$ = combineLatest([
            this.registrosTransformados$.pipe(startWith([])), // Usa la fuente de datos transformada
            this.filtroCodigoRoleSubject,
            this.filtroCodigoAplicacionSubject,
            this.filtroCodigoSuiteSubject,
            this.filtroNombreSubject,
            this.filtroDescripcionSubject,
            this.filtroEstadoSubject,
            this.filtroTipoRolSubject
        ]).pipe(
            map(([roles, codigorol, codigoapp, codigosuite, nombre, descripcion, estado, tipoRol]) => {
                // console.log('================== roles 2', roles);

                let filteredRegistros = roles
                if (tipoRol !== 'todos') {
                    filteredRegistros = filteredRegistros.filter(reg => {
                        const esSuscriptor = reg.codigoAplicacion && reg.codigoAplicacion !== ''
                        return tipoRol === 'suscriptor' ? esSuscriptor : !esSuscriptor
                    })
                }
                if (codigorol !== 'todos') {
                    filteredRegistros = filteredRegistros.filter(reg => reg.codigoRole === codigorol)
                }
                if (codigoapp !== 'todos') {
                    filteredRegistros = filteredRegistros.filter(reg => reg.codigoAplicacion === codigoapp)
                }
                if (codigosuite !== 'todos') {
                    filteredRegistros = filteredRegistros.filter(reg => reg.codigoSuite === codigosuite)
                }
                if (nombre !== 'todos') {
                    filteredRegistros = filteredRegistros.filter(reg => reg.nombreRole === nombre)
                }
                if (estado !== 'todos') {
                    const estadoBoolean = estado === 'true'
                    filteredRegistros = filteredRegistros.filter(reg => reg.estadoRole === estadoBoolean)
                }
                if (descripcion) {
                    const textoFiltro = descripcion.toLowerCase()
                    filteredRegistros = filteredRegistros.filter(app => (app.descripcionRole || '').toLowerCase().includes(textoFiltro))
                }
                return filteredRegistros
            })
        )
    }
    // setupRolesStream(): void {
    //     // Limpiamos cualquier stream previo ligado a roles para evitar duplicidad
    //     // (Puedes almacenar esta subscripción específica en tu clase si gustas)

    //     this.registrosTransformados$ = combineLatest([
    //         this._rolesAPService.roles$,
    //         this._usuariosRolesService._usuariosRoles$
    //     ]).pipe(
    //         switchMap(([roles, usuariosRoles]) => {
    //             if (!roles || roles.length === 0) return of([]);

    //             this.roles = roles;
    //             this.usuariosRoles = usuariosRoles || [];

    //             const transformedRoles = roles.map((role: any) => {
    //                 // 1. Estados y Botones Dinámicos
    //                 role.nomEstado = role.estadoRole ? 'Activo' : 'Inactivo';
    //                 role.letraDinamica1 = role.estadoRole ? 'I' : 'A';
    //                 role.colorDinamico1 = role.estadoRole ? '#dc3545' : '#28a745';
    //                 role.tooltipDinamico1 = role.estadoRole ? 'Inactivar Rol' : 'Activar Rol';

    //                 // 2. Cruces básicos del Rol
    //                 const appEncontrada = role.codigoAplicacion ? this.aplicaciones.find(x => x.codigoAplicacion === role.codigoAplicacion) : null;
    //                 role.nomAplicacion = appEncontrada ? appEncontrada.nombreAplicacion : 'N/A';

    //                 const suiteEncontrada = role.codigoSuite ? this.suites.find(x => x.codigoSuite === role.codigoSuite) : null;
    //                 role.nomSuite = suiteEncontrada ? suiteEncontrada.nombreSuite : 'N/A';

    //                 role.tipoRol = role.codigoAplicacion ? 'Suscriptor' : 'Plataforma';

    //                 // 3. SUBTABLA DE USUARIOS ('json-tabla')
    //                 const asignacionesDelRol = this.usuariosRoles.filter(ur => ur.codigoRole === role.codigoRole);

    //                 role.usuarios = asignacionesDelRol.map(ur => {
    //                     const relacionSC = this.usuariosSC.find(sc => sc.codigoUsuarioSC === ur.codigoUsuarioSC);

    //                     const usuarioBase = relacionSC
    //                         ? this.usuarios.find(u => u.codigoUsuario === relacionSC.codigoUsuario)
    //                         : null;

    //                     const suscriptor = relacionSC
    //                         ? this.suscriptores.find(s => s.codigoSuscriptor === relacionSC.codigoSuscriptor)
    //                         : null;

    //                     return {
    //                         'Nombre Usuario': usuarioBase ? usuarioBase.nombreUsuario : 'Usuario Desconocido',
    //                         'Correo Electrónico': usuarioBase ? usuarioBase.correoUsuario : 'N/A',
    //                         'Suscriptor': suscriptor ? suscriptor.nombreSuscriptor : 'Plataforma',
    //                         'Fecha Asignación': ur.fechaCreacion ? new Date(ur.fechaCreacion).toLocaleDateString() : 'N/A',
    //                         'Estado': ur.estadoUsuarioRole ? 'Activo' : 'Inactivo'
    //                     };
    //                 });

    //                 return {
    //                     ...role,
    //                     '_acciones': [
    //                         { accion: 'INACTIVAR', letra: 'I', color: '#a02525', tooltip: (this.translate.instant('ROLES.INACTIVAR')) },
    //                         { accion: 'USUARIOS', letra: 'U', color: '#a025a0', tooltip: (this.translate.instant('ROLES.USUARIOSROLE')) }
    //                     ],
    //                 } as PTLRoleAPModel;
    //             });

    //             this.registros = transformedRoles;
    //             return of(transformedRoles);
    //         }),
    //         catchError(err => {
    //             console.error('Error en el stream de roles:', err);
    //             return of([]);
    //         })
    //     );
    // }

    onFiltroTipoRolChangeClick(evento: any): void {
        const value = evento.target.value
        this.filtroTipoRolSubject.next(value)
    }

    onFiltroCodigoAplicacionChangeClick(evento: any): void {
        const value = evento.target.value
        this.filtroCodigoAplicacionSubject.next(value)
    }
    onFiltroCodigoSuiteChangeClick(evento: any) {
        const value = evento.target.value
        this.filtroCodigoSuiteSubject.next(value)
    }

    onFiltroCodigoRoleChangeClick(evento: any): void {
        const value = evento.target.value
        this.filtroCodigoRoleSubject.next(value)
    }

    onFiltroNombreChangeClick(evento: any): void {
        const value = evento.target.value
        this.filtroNombreSubject.next(value)
    }

    onFiltroDescripcionChangeClick(evento: any): void {
        const value = evento.target.value
        this.filtroDescripcionSubject.next(value)
    }

    onFiltroEstadoChangeClick(evento: any): void {
        const value = evento.target.value
        this.filtroEstadoSubject.next(value)
    }

    OnNuevoRegistroClick() {
        this._localStorageService.setObject('regId', 'nuevo')
        this.router.navigate(['usuarios/gestion-roles'])
    }

    OnEditarRegistroClick(id: number) {
        this._localStorageService.setObject('regId', id)
        this.router.navigate(['usuarios/gestion-roles'])
    }

    onAccionPrincipal(evento: { accion: string, row: any }) {
        const { accion, row } = evento;
        const id = row.codigoRole || row.id;

        console.log(`Acción ejecutada: [${accion}] sobre el registro ID:`, id);

        switch (accion) {
            case 'INACTIVAR':
                console.log('id', id);

                const role = this.registros.filter(x => x.codigoRole == id)[0]
                console.log('cambiar estado role', role);

                this._swalService.getAlertQuestionRequest(
                    this.translate.instant('ROLES.INACTIVAR'),
                    this.translate.instant('ROLES.USUARIOS'),
                    this.translate.instant('ROLES.INACTIVARBTN'),
                    this.translate.instant('PLATAFORMA.CANCEL')
                ).subscribe(result => {
                    if (result) {
                        role.estadoRole = role.estadoRole == true ? false : true;
                        console.log('role', role);
                        this._rolesAPService.putModificarRegistro(role).subscribe({
                            next: (resp: any) => {
                                const logData = {
                                    codigoTipoLog: '',
                                    codigoRespuesta: '201',
                                    descripcionLog: this.translate.instant('USUARIOS.ROLES.ELIMINAREXITOSA') + ' ' + resp.mensaje
                                }
                                this._logActividadesService.postCrearRegistro(logData).subscribe(() => console.log('log creado exitosamente'))
                                this._rolesAPService.cargarRegistros().subscribe();
                            },
                            error: (err: any) => {
                                const logData = {
                                    codigoTipoLog: '',
                                    codigoRespuesta: '201',
                                    descripcionLog: this.translate.instant('USUARIOS.ROLES.ELIMINARERROR') + ' ' + err.mensaje
                                }
                                this._logActividadesService.postCrearRegistro(logData).subscribe(() => console.log('log creado exitosamente'))
                                this._swalService.getAlertSuccess(this.translate.instant('USUARIOS.ROLES.ELIMINARERROR') + ' ' + err.mensaje)
                                this._rolesAPService.cargarRegistros().subscribe();
                                console.error('Error eliminando', err)
                            }
                        })
                    }
                });
                break;
            case 'USUARIOS':
                const value = id;
                console.log('opcion 1 click', value);
                this._localStorageService.setObject('regId', value)
                this.router.navigate(['usuarios/usuarios-roles'])
                break;
            default:
                console.warn(`Acción no reconocida: ${accion}`);
                break;
        }
    }

    toggleNav(): void {
        this.toggleSidebar.emit()
    }
}
