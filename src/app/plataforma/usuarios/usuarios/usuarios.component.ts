/* eslint-disable @angular-eslint/use-lifecycle-interface */
/* eslint-disable @typescript-eslint/no-explicit-any */
//#region IMPORTS
import { Component, EventEmitter, OnInit, Output } from '@angular/core'
import { CommonModule } from '@angular/common'
import { DataTablesModule } from 'angular-datatables'
import { Router } from '@angular/router'
import { GradientConfig } from 'src/app/app-config'
import { SharedModule } from 'src/app/theme/shared/shared.module'
import { TranslateModule } from '@ngx-translate/core'
import { TranslateService } from '@ngx-translate/core'
import { ColumnMetadata } from 'src/app/theme/shared/_helpers/models/ColumnMetadata.model'
import { NavigationItem } from 'src/app/theme/shared/_helpers/models/Navigation.model'
import { BaseSessionModel } from 'src/app/theme/shared/_helpers/models/BaseSession.model'
import { PTLLogActividadAPModel } from 'src/app/theme/shared/_helpers/models/PTLlogActividadAP.model'
import { PTLUsuarioModel } from 'src/app/theme/shared/_helpers/models/PTLUsuario.model'
import { BehaviorSubject, catchError, combineLatest, filter, map, Observable, startWith, switchMap } from 'rxjs'
import { NavBarComponent } from 'src/app/theme/layout/admin/nav-bar/nav-bar.component'
import { NavContentComponent } from 'src/app/theme/layout/admin/navigation/nav-content/nav-content.component'
import {
    NavigationService,
    SwalAlertService,
    UploadFilesService,
    PTLUsuariosService,
    LocalStorageService,
    PtlAplicacionesService,
    PtlSuitesAPService,
    PtlusuariosRolesApService,
    PTLRolesAPService,
    PtlactividadesRolesService,
    AuthenticationService,
    UtilidadesService,
    PtllogActividadesService,
    PtlusuariosScService,
    PTLSuscriptoresService,
} from 'src/app/theme/shared/service'
import { DatatableComponent } from 'src/app/theme/shared/components/data-table/data-table.component'
import { of, Subscription } from 'rxjs'
import { DataLoaderComponent } from 'src/app/theme/shared/components/data-loader/data-loader.component'
import { PTLAplicacionModel } from 'src/app/theme/shared/_helpers/models/PTLAplicacion.model'
import { PTLSuiteAPModel } from 'src/app/theme/shared/_helpers/models/PTLSuiteAP.model'
import { PTLUsuarioRoleAPModel } from 'src/app/theme/shared/_helpers/models/PTLUsuarioRole.model'
import { PTLRoleAPModel } from 'src/app/theme/shared/_helpers/models/PTLRoleAP.model'
import { PTLUsuarioSCModel } from 'src/app/theme/shared/_helpers/models/PTLUsuarioSC.model'
import { PTLSuscriptorModel } from 'src/app/theme/shared/_helpers/models/PTLSuscriptor.model'
import { PTLEmpresaSCModel } from 'src/app/theme/shared/_helpers/models/PTLEmpresaSC.model'
import { PTLUsuaioEmpresasSCModel } from 'src/app/theme/shared/_helpers/models/PTLUsuarioEmpresaSC.model'
import { PTLActividadRoleModel } from 'src/app/theme/shared/_helpers/models/PTLActividadesRoles.model'
import { EmailService } from 'src/app/theme/shared/service/email.service'
import { PTLTiposRoleModel } from '../../../theme/shared/_helpers/models/PTLTiposRole.model';
import { PTLTiposRolesService } from 'src/app/theme/shared/service/ptltipos-roles.service'
import { TableDataComponent } from "src/app/theme/shared/components/table-data/table-data.component";
//#endregion IMPORTS

@Component({
    selector: 'app-usuarios',
    standalone: true,
    imports: [
        CommonModule,
        DataTablesModule,
        SharedModule,
        TranslateModule,
        NavBarComponent,
        NavContentComponent,
        DataLoaderComponent,
        TableDataComponent
    ],
    templateUrl: './usuarios.component.html',
    styleUrl: './usuarios.component.scss'
})
export class UsuariosComponent implements OnInit {
    //#region VARIABLES
    @Output() toggleSidebar = new EventEmitter<void>()
    FormRegistro: PTLUsuarioModel = new PTLUsuarioModel()
    DataModel: BaseSessionModel = new BaseSessionModel()
    DataLogActividad: PTLLogActividadAPModel = new PTLLogActividadAPModel()
    moduloTituloExcel: string = ''
    hasFiltersSlot: boolean = false
    gradientConfig
    lang = localStorage.getItem('lang')
    menuItems$!: Observable<NavigationItem[]>
    activeTab: 'menu' | 'filters' | 'main' = 'menu'
    tituloPagina: string = ''
    suscPlataforma: string = ''
    mostrarModalPassword: boolean = false;
    mostrarModalReset: boolean = false;
    isClaveActual: boolean = true
    registroSeleccionado: string = ''
    cargandoExcel: boolean = false;

    claveActual: string = '';
    claveNueva: string = '';
    confirmarClave: string = '';
    usuarioSeleccionadoParaClave: any = null;

    subscriptions = new Subscription()
    filtroIdentificacionSubject = new BehaviorSubject<string>('')
    filtroNombreSubject = new BehaviorSubject<string>('')
    filtroCorreoSubject = new BehaviorSubject<string>('')
    filtroUsernameSubject = new BehaviorSubject<string>('')
    filtroDescripcionSubject = new BehaviorSubject<string>('')
    filtroEstadoSubject = new BehaviorSubject<string>('todos')

    registrosTransformados$: Observable<PTLUsuarioModel[]> = of([])
    registrosFiltrado$: Observable<PTLUsuarioModel[]> = of([])
    usuarios: PTLUsuarioModel[] = []
    registros: PTLUsuarioModel[] = []
    aplicaciones: PTLAplicacionModel[] = []
    suites: PTLSuiteAPModel[] = []
    usuariosRoles: PTLUsuarioRoleAPModel[] = []
    actividadesRoles: PTLActividadRoleModel[] = []
    empresasSC: PTLEmpresaSCModel[] = []
    roles: PTLRoleAPModel[] = []
    rolesUsuario: PTLRoleAPModel[] = []
    tiposRoles: PTLTiposRoleModel[] = []

    usuariosSC: PTLUsuarioSCModel[] = []
    suscriptores: PTLSuscriptorModel[] = []
    usuarioEmpresaSC: PTLUsuaioEmpresasSCModel[] = []

    // colorOpcion1 = '#ff0000'
    // letraOpcion1 = 'I'
    // colorOpcion2 = '#25a042'
    // letraOpcion2 = 'C'
    // colorOpcion3 = '#d3751d'
    // letraOpcion3 = 'R'
    // colorOpcion4 = '#c41dd3'
    // letraOpcion4 = 'R'


    //#endregion VARIABLES

    constructor(
        private router: Router,
        private translate: TranslateService,
        private _navigationService: NavigationService,
        private _swalService: SwalAlertService,
        private _usuariosService: PTLUsuariosService,
        private _usuariosSCService: PtlusuariosScService,
        private _aplicacionesService: PtlAplicacionesService,
        private _actividadesRolesService: PtlactividadesRolesService,
        private _rolesUsuariosService: PtlusuariosRolesApService,
        private _rolesService: PTLRolesAPService,
        private _tiposRolesService: PTLTiposRolesService,
        private _suitesService: PtlSuitesAPService,
        private _authService: AuthenticationService,
        private _utilidadesService: UtilidadesService,
        private _emailService: EmailService,
        private _suscriptoresService: PTLSuscriptoresService,
        // private _usuariosEmpresasSCService: PtlusuariosEmpresasScService,
        private _localStorageService: LocalStorageService,
        private _logActividadesService: PtllogActividadesService,
        private _uploadService: UploadFilesService
    ) {
        this.gradientConfig = GradientConfig

    }

    ngOnInit() {
        this._navigationService.getNavigationItems();
        this.menuItems$ = this._navigationService.menuItems$;
        this.hasFiltersSlot = true;
        this.rolesUsuario = this._rolesService.getRolesActuales(); // 🟢 Retenido de tu lógica original

        this.actividadesRoles = this._actividadesRolesService.getActividadesRolesActuales();
        this.usuarios = this._usuariosService.getUsuariosActuales();
        this.usuariosRoles = this._rolesUsuariosService.getUsuairosRolesActuales();
        this.tiposRoles = this._tiposRolesService.getTiposRolesActuales();
        this.suscriptores = this._suscriptoresService.getSuscriptoresActuales(); // Asumiendo que está inyectado

        this.subscriptions.add(this._usuariosService.cargarRegistros().subscribe(
            () => console.log('Usuarios cargados'),
            err => console.error('Error al cargar usuarios:', err)
        ));
        this.subscriptions.add(this._rolesUsuariosService.cargarRegistros().subscribe());
        this.subscriptions.add(this._usuariosSCService.cargarRegistros().subscribe());
        this.subscriptions.add(this._rolesService.cargarRegistros().subscribe());

        this.setupRegistrosStream();
    }

    ngOnDestroy(): void {
        this.subscriptions.unsubscribe()
    }

    setupRegistrosStream(): void {
        this.suscPlataforma = this._localStorageService.getSuscriptorPlataformaLocalStorage();
        let codigo = this.suscPlataforma;

        this.registrosTransformados$ = combineLatest([
            this._usuariosService.usuarios$,
            this._rolesUsuariosService._usuariosRoles$
        ]).pipe(
            switchMap(([users, usuariosRoles]) => {
                if (!users || users.length === 0) return of([]);

                this.usuarios = users;
                this.usuariosRoles = usuariosRoles || [];

                this.usuariosSC = this._usuariosSCService.getUsuariosSCActuales();
                this.roles = this._rolesService.getRolesActuales();
                this.tiposRoles = this._tiposRolesService.getTiposRolesActuales();
                this.aplicaciones = this._aplicacionesService.getBAplicacionesActuales();
                this.suites = this._suitesService.getSuitesActuales();

                const transformedUsuarios = users.map((user: any) => {
                    user.nomEstado = user.estadoUsuario ? 'Activo' : 'Inactivo';
                    user.avatarUsuario = this._uploadService.getFilePath(codigo, 'usuarios', user.fotoUsuario);

                    user.letraDinamica1 = user.estadoUsuario ? 'I' : 'A';
                    user.colorDinamico1 = user.estadoUsuario ? '#ff0000' : '#28a745';
                    user.tooltipDinamico1 = user.estadoUsuario ? 'Inactivar Usuario' : 'Activar Usuario';

                    const relacionesSCDelUsuario = this.usuariosSC.filter(x => x.codigoUsuario === user.codigoUsuario);
                    const idsUsuariosSC = relacionesSCDelUsuario.map(sc => sc.codigoUsuarioSC);

                    const rolesAsignados = this.usuariosRoles.filter(ur => idsUsuariosSC.includes(ur.codigoUsuarioSC));

                    user.roles = rolesAsignados.map(ur => {
                        const rolInfo = this.roles.find(r => r.codigoRole === ur.codigoRole);

                        const nombreTipoRole = rolInfo && rolInfo.codigoTipoRole
                            ? this.tiposRoles.find(t => t.codigoTipoRole === rolInfo.codigoTipoRole)?.nombreTipoRole || 'N/A'
                            : 'N/A';

                        const nombreApp = rolInfo && rolInfo.codigoAplicacion
                            ? this.aplicaciones.find(a => a.codigoAplicacion === rolInfo.codigoAplicacion)?.nombreAplicacion || 'N/A'
                            : 'N/A';

                        const nombreSuite = rolInfo && rolInfo.codigoSuite
                            ? this.suites.find(s => s.codigoSuite === rolInfo.codigoSuite)?.nombreSuite || 'N/A'
                            : 'N/A';

                        return {
                            'Nombre Rol': rolInfo ? rolInfo.nombreRole : 'Rol Desconocido',
                            'Aplicación': nombreApp,
                            'Suite': nombreSuite,
                            'Tipo Rol': nombreTipoRole,
                            'Estado': ur.estadoUsuarioRole ? 'Activo' : 'Inactivo'
                        };
                    });

                    return {
                        ...user,
                        '_acciones': [
                            { accion: 'INACTIVAR', letra: 'I', color: '#ff0000', tooltip: (this.translate.instant('USUARIOS.INACTIVAR')) },
                            { accion: 'CAMBIAR', letra: 'C', color: '#25a042', tooltip: (this.translate.instant('USUARIOS.CAMBIAR')) },
                            { accion: 'RESETEAR', letra: 'R', color: '#d3751d', tooltip: (this.translate.instant('USUARIOS.RESERTEAR')) },
                            { accion: 'ROLES', letra: 'R', color: '#c41dd3', tooltip: (this.translate.instant('USUARIOS.ROLES')) }
                        ],
                    } as PTLUsuarioModel;
                });

                this.registros = transformedUsuarios;
                return of(transformedUsuarios);
            }),
            catchError(err => {
                console.error('Error en el stream de usuarios:', err);
                return of([]);
            })
        );

        this.registrosFiltrado$ = combineLatest([
            this.registrosTransformados$.pipe(startWith([])),
            this.filtroIdentificacionSubject,
            this.filtroNombreSubject,
            this.filtroCorreoSubject,
            this.filtroUsernameSubject,
            this.filtroDescripcionSubject,
            this.filtroEstadoSubject
        ]).pipe(
            map(([users, identificacion, nombre, correo, username, descripcion, estado]) => {
                let filteredRegistros = users;

                if (identificacion) {
                    const text = identificacion.toLowerCase();
                    filteredRegistros = filteredRegistros.filter(reg =>
                        (reg.identificacionUsuario?.toString() || '').toLowerCase().includes(text)
                    );
                }
                if (nombre) {
                    const text = nombre.toLowerCase();
                    filteredRegistros = filteredRegistros.filter(reg =>
                        (reg.nombreUsuario || '').toLowerCase().includes(text)
                    );
                }
                if (correo) {
                    const text = correo.toLowerCase();
                    filteredRegistros = filteredRegistros.filter(reg =>
                        (reg.correoUsuario || '').toLowerCase().includes(text)
                    );
                }
                if (username) {
                    const text = username.toLowerCase();
                    filteredRegistros = filteredRegistros.filter(reg =>
                        (reg.userNameUsuario || '').toLowerCase().includes(text)
                    );
                }
                if (estado !== 'todos') {
                    const estadoBoolean = estado === 'true';
                    filteredRegistros = filteredRegistros.filter(reg => reg.estadoUsuario === estadoBoolean);
                }
                if (descripcion) {
                    const textoFiltro = descripcion.toLowerCase();
                    filteredRegistros = filteredRegistros.filter(reg =>
                        (reg.descripcionUsuario || '').toLowerCase().includes(textoFiltro)
                    );
                }

                return filteredRegistros;
            })
        );
    }

    columnasUsuarios: ColumnMetadata[] = [
        {
            name: 'avatarUsuario',
            header: 'USUARIOS.USUARIOS.FOTO',
            type: 'avatar',
            isSortable: false
        },
        {
            name: 'identificacionUsuario',
            header: 'USUARIOS.USUARIOS.IDENTIFICACION',
            type: 'text'
        },
        {
            name: 'nombreUsuario',
            header: 'USUARIOS.USUARIOS.NAME',
            type: 'text'
        },
        {
            name: 'userNameUsuario',
            header: 'USUARIOS.USUARIOS.USERNAME',
            type: 'text'
        },
        {
            name: 'nomEstado',
            header: 'USUARIOS.USUARIOS.STATUS',
            type: 'estado'
        }
    ]

    columnasDetailRegistros: ColumnMetadata[] = [
        {
            name: 'correoUsuario',
            header: 'USUARIOS.USUARIOS.CORREO',
            type: 'text'
        },
        {
            name: 'descripcionUsuario',
            header: 'USUARIOS.USUARIOS.DESCRIPCION',
            type: 'text'
        },
        {
            name: 'roles',
            header: 'USUARIOS.USUARIOS.ROLES',
            type: 'json-tabla'
        }
    ]

    consultarRolesUsuario(codUsuario: string) {
        let rolesUsuarioFinal: any[] = []
        const user = this._localStorageService.getObject<any>('currentUser');
        const nav = this._localStorageService.getObject<any>('navsettings');
        const usuarioSC = user.usuariosSC[0];
        const suscriptor = nav.suscriptor;
        const empresasSC = nav.suscriptor.empresasAsignadas;
        // const usuariosEmpresaSC = this.usuarioEmpresaSC.filter(ru => ru.codigoUsuarioSC == usuarioSC.codigoUsuarioSC && ru.estadoUsuarioEmpresaSC == true)
        let rolesUsuario: PTLUsuarioRoleAPModel[] = []
        let actividadesUsuario: any[] = []
        const roles = this.usuariosRoles.filter(ue => ue.codigoUsuarioSC === usuarioSC.codigoUsuarioSC && ue.estadoUsuarioRole == true)// usuariosEmpresaSC.forEach((usuEmp: any) => {
        // const activisRole = this.actividadesRoles.filter(x => x.codigoRole == role.codigoRole)
        // const emp = empresasSC.filter(x => x.codigoEmpresaSC == usuEmp.codigoEmpresaSC)[0]
        // const actisRoles = {
        //     empresa: emp.codigoEmpresaSC,
        //     role: role.codigoRole,
        //     actividades: activisRole
        // }
        // actividadesUsuario.push(actisRoles)

        //
        //     roles.forEach(role => {

        //         role.codigoEmpresaSC = usuEmp.codigoEmpresaSC
        //     });
        //     rolesUsuario.push(...roles)
        // });
        // rolesUsuarioFinal = rolesUsuario.map(ru => {
        //     const role = this.roles.find(r => r.codigoRole === ru.codigoRole && r.estadoRole == true)
        //     const suite = this.suites.find(s => s.codigoSuite === ru?.codigoSuite)
        //     const aplicacion = this.aplicaciones.find(a => a.codigoAplicacion === ru?.codigoAplicacion)
        //     const empresa = empresasSC.find(a => a.codigoEmpresaSC === ru.codigoEmpresaSC)
        //     return {
        //         suscriptor: suscriptor ? suscriptor.nombreSuscriptor : 'Sin Suscriptor',
        //         empresa: empresa ? empresa.nombreEmpresa : 'Sin Empresa',
        //         aplicacion: aplicacion ? aplicacion.nombreAplicacion : 'Sin Aplicación',
        //         suite: suite ? suite.nombreSuite : 'Sin Suite',
        //         role: role ? role.nombreRole : 'Rol Desconocido'
        //     }
        // })
        // // console.log('actividadesUsuario', actividadesUsuario);
        // console.log('rolesUsuario', rolesUsuarioFinal);
        return rolesUsuarioFinal
    }

    // setupRegistrosStream(): void {
    //     this.suscPlataforma = this._localStorageService.getSuscriptorPlataformaLocalStorage();
    //     let codigo = this._localStorageService.getSuscriptorPlataformaLocalStorage();

    //     this.registrosTransformados$ = this._usuariosService.usuarios$.pipe(
    //         switchMap((users: PTLUsuarioModel[]) => {
    //             if (!users || users.length === 0) return of([]);
    //             this.usuarios = users;

    //             const transformedUsuarios = users.map((user: any) => {
    //                 // 1. Estados base
    //                 user.nomEstado = user.estadoUsuario ? 'Activo' : 'Inactivo';
    //                 user.fotoUsuario = this._uploadService.getFilePath(codigo, 'usuarios', user.fotoUsuario);
    //                 user.rolesUsuario = this.consultarRolesUsuario(user.codigoUsuario) || [];

    //                 // 2. Configuración dinámica del botón (Opcion1)
    //                 user.letraDinamica1 = user.estadoUsuario ? 'I' : 'A';
    //                 user.colorDinamico1 = user.estadoUsuario ? '#ff0000' : '#28a745';
    //                 user.tooltipDinamico1 = user.estadoUsuario ? 'Inactivar Usuario' : 'Activar Usuario';

    //                 // 3. Procesamiento de la Subtabla (Cruce de Datos)
    //                 const relacionesSCDelUsuario = this.usuariosSC.filter(x => x.codigoUsuario === user.codigoUsuario);
    //                 const idsUsuariosSC = relacionesSCDelUsuario.map(sc => sc.codigoUsuarioSC);

    //                 const rolesAsignados = this.usuariosRoles.filter(ur => idsUsuariosSC.includes(ur.codigoUsuarioSC));

    //                 // 4. Mapeo para generar el 'json-tabla' con los cruces
    //                 user.roles = rolesAsignados.map(ur => {
    //                     // Rescatar el registro principal del Rol
    //                     const rolInfo = this.roles.find(r => r.codigoRole === ur.codigoRole);

    //                     // Rescatar los nombres cruzando con las listas maestras (si el rol existe)
    //                     const nombreTipoRole = rolInfo && rolInfo.codigoTipoRole
    //                         ? this.tiposRoles.find(t => t.codigoTipoRole === rolInfo.codigoTipoRole)?.nombreTipoRole || 'N/A'
    //                         : 'N/A';

    //                     const nombreApp = rolInfo && rolInfo.codigoAplicacion
    //                         ? this.aplicaciones.find(a => a.codigoAplicacion === rolInfo.codigoAplicacion)?.nombreAplicacion || 'N/A'
    //                         : 'N/A';

    //                     const nombreSuite = rolInfo && rolInfo.codigoSuite
    //                         ? this.suites.find(s => s.codigoSuite === rolInfo.codigoSuite)?.nombreSuite || 'N/A'
    //                         : 'N/A';

    //                     // Las llaves de este objeto se convierten en los headers de la subtabla automáticamente
    //                     return {
    //                         'Nombre Rol': rolInfo ? rolInfo.nombreRole : 'Rol Desconocido',
    //                         'Aplicación': nombreApp,
    //                         'Suite': nombreSuite,
    //                         'Tipo Rol': nombreTipoRole,
    //                         'Estado': ur.estadoUsuarioRole ? 'Activo' : 'Inactivo'
    //                     };
    //                 });

    //                 return user as PTLUsuarioModel;
    //             });

    //             this.registros = transformedUsuarios;
    //             console.log('registros roles para tabla', this.registros);

    //             return of(transformedUsuarios);
    //         }),
    //         catchError(err => {
    //             console.error('Error en el stream de usuarios:', err);
    //             return of([]);
    //         })
    //     );

    //     this.registrosFiltrado$ = combineLatest([
    //         this.registrosTransformados$.pipe(startWith([])),
    //         this.filtroIdentificacionSubject,
    //         this.filtroNombreSubject,
    //         this.filtroCorreoSubject,
    //         this.filtroUsernameSubject,
    //         this.filtroDescripcionSubject,
    //         this.filtroEstadoSubject
    //     ]).pipe(
    //         map(([users, identificacion, nombre, correo, username, descripcion, estado]) => {
    //             let filteredRegistros = users;

    //             if (identificacion) {
    //                 const text = identificacion.toLowerCase();
    //                 filteredRegistros = filteredRegistros.filter(reg =>
    //                     (reg.identificacionUsuario?.toString() || '').toLowerCase().includes(text)
    //                 );
    //             }
    //             if (nombre) {
    //                 const text = nombre.toLowerCase();
    //                 filteredRegistros = filteredRegistros.filter(reg =>
    //                     (reg.nombreUsuario || '').toLowerCase().includes(text)
    //                 );
    //             }
    //             if (correo) {
    //                 const text = correo.toLowerCase();
    //                 filteredRegistros = filteredRegistros.filter(reg =>
    //                     (reg.correoUsuario || '').toLowerCase().includes(text)
    //                 );
    //             }
    //             if (username) {
    //                 const text = username.toLowerCase();
    //                 filteredRegistros = filteredRegistros.filter(reg =>
    //                     (reg.userNameUsuario || '').toLowerCase().includes(text)
    //                 );
    //             }
    //             if (estado !== 'todos') {
    //                 const estadoBoolean = estado === 'true';
    //                 filteredRegistros = filteredRegistros.filter(reg => reg.estadoUsuario === estadoBoolean);
    //             }
    //             if (descripcion) {
    //                 const textoFiltro = descripcion.toLowerCase();
    //                 filteredRegistros = filteredRegistros.filter(reg =>
    //                     (reg.descripcionUsuario || '').toLowerCase().includes(textoFiltro)
    //                 );
    //             }

    //             return filteredRegistros;
    //         })
    //     );
    // }

    OnNuevoRegistroClick() {
        this._localStorageService.setObject('regId', 'nuevo')
        this.router.navigate(['usuarios/gestion-usuario'])
    }

    OnEditarRegistroClick(id: any) {
        this._localStorageService.setObject('regId', id)
        this.router.navigate(['usuarios/gestion-usuario'])
    }

    onFiltroIdentificacionChangeClick(evento: any) {
        const value = evento.target.value
        this.filtroIdentificacionSubject.next(value)
    }

    onFiltroNombreChangeClick(evento: any) {
        const value = evento.target.value
        this.filtroNombreSubject.next(value)
    }

    onFiltroCorreoChangeClick(evento: any) {
        const value = evento.target.value
        this.filtroCorreoSubject.next(value)
    }

    onFiltroUsernameChangeClick(evento: any) {
        const value = evento.target.value
        this.filtroUsernameSubject.next(value)
    }

    onFiltroDescripcionChangeClick(evento: any) {
        const value = evento.target.value
        this.filtroDescripcionSubject.next(value)
    }

    onFiltroEstadoChangeClick(evento: any) {
        const value = evento.target.value
        this.filtroEstadoSubject.next(value)
    }

    OnEliminarRegistroClick(id: any) {
    }

    OnOption2Click(id: any) {

    }

    OnOption3Click(id: any) {

    }

    OnOption4Click(id: any) {

        // this.procesarCambioClave(id, nuevaClave);
    }

    onAccionPrincipal(evento: { accion: string, row: any }) {
        const { accion, row } = evento;
        const id = row.codigoUsuario || row.id;

        console.log(`Acción ejecutada: [${accion}] sobre el registro ID:`, id);

        switch (accion) {
            case 'INACTIVAR':
                console.log('inactivar usuario codigo', id);
                const usuario = this.usuarios.find(x => x.codigoUsuario === id);
                if (!usuario) return;
                this._swalService.getAlertQuestionRequest(
                    this.translate.instant('USUARIOS.INACTIVAR'),
                    this.translate.instant('USUARIOS.INACTIVARTITULO'),
                    this.translate.instant('USUARIOS.INACTIVARBTN'),
                    this.translate.instant('PLATAFORMA.CANCEL')
                ).subscribe(result => {
                    if (result) {
                        usuario.estadoUsuario = usuario.estadoUsuario == true ? false : true;
                        console.log('usuario a inactivar', usuario);
                        this._usuariosService.actualizarUsuario(usuario).subscribe({
                            next: (resp: any) => {
                                const logData = {
                                    codigoTipoLog: '',
                                    codigoRespuesta: '201',
                                    descripcionLog: this.translate.instant('USUARIOS.ELIMINAREXITOSA') + ' ' + resp.mensaje
                                }
                                this._logActividadesService.postCrearRegistro(logData).subscribe(() => console.log('log creado exitosamente'))
                                this._swalService.getAlertSuccess(this.translate.instant('USUARIOS.ROLES.ELIMINARERROR'));
                                this.setupRegistrosStream()
                            },
                            error: (err: any) => {
                                // const logData = {
                                //     codigoTipoLog: '',
                                //     codigoRespuesta: '201',
                                //     descripcionLog: this.translate.instant('USUARIOS.ROLES.ELIMINARERROR') + ' ' + err.mensaje
                                // }
                                // this._logActividadesService.postCrearRegistro(logData).subscribe(() => console.log('log creado exitosamente'))
                                this._swalService.getAlertSuccess(this.translate.instant('USUARIOS.ROLES.ELIMINARERROR') + ' ' + err.mensaje)
                                // this.setupRegistrosStream()
                                console.error('Error eliminando', err)
                            }
                        })
                    }
                });
                break;
            case 'CAMBIAR':
                const value = id;
                console.log('opcion 1 click', value);
                this.registroSeleccionado = id;
                //this._prepararDatosDeRenovacion(event);
                this.mostrarModalPassword = true;
                this.FormRegistro = {}
                this.usuarioSeleccionadoParaClave = this.usuarios.find(x => x.codigoUsuario === id);
                this.claveActual = '';
                this.claveNueva = '';
                this.confirmarClave = '';
                break;
            case 'RESETEAR':
                this.registroSeleccionado = id;
                const nuevaClave = this._utilidadesService.generarClaveSegura();
                console.log('La nueva clave generada es:', nuevaClave);
                this.procesarCambioClave(id, nuevaClave);
                break;
            case 'ROLES':
                console.log('Redirigirse a la pagina de roles:', id);
                this._localStorageService.setObject('regId', id)
                this.router.navigate(['usuarios/roles-usuario'])
                break;
            default:
                console.warn(`Acción no reconocida: ${accion}`);
                break;
        }
    }

    onFileExcelSelected(event: any) {
        const file: File = event.target.files[0];

        if (file) {
            // 1. Validación rápida de formato en el frontend
            const extension = file.name.split('.').pop()?.toLowerCase();
            if (extension !== 'xlsx' && extension !== 'xls') {
                console.error('El archivo seleccionado no es un formato de Excel válido.');
                // Aquí puedes lanzar una alerta (ej. SweetAlert o Toast)
                return;
            }

            this.cargandoExcel = true;

            // 2. Obtener el ID del usuario actual (reemplaza esto con tu variable de sesión)
            const usuarioLogueado = 'SISTEMA_O_ID_USUARIO';

            // 3. Llamar al servicio
            this._usuariosService.cargueMasivoExcel(file, usuarioLogueado).subscribe({
                next: (resp) => {
                    this.cargandoExcel = false;
                    console.log('✅ Éxito:', resp.msg);

                    // Refrescar la tabla de usuarios
                    // this.cargarUsuarios();

                    // Limpiar el input para permitir subir el mismo archivo si hubo correcciones
                    event.target.value = '';
                },
                error: (err) => {
                    this.cargandoExcel = false;
                    console.error('❌ Error en el cargue:', err);

                    // Si tu backend devolvió la lista de filas con error, puedes mostrarla aquí
                    if (err.error && err.error.errores) {
                        console.log('Detalle de filas con error:', err.error.errores);
                    }

                    event.target.value = '';
                }
            });
        }
    }

    procesarArchivoExcel(file: File): void {
        if (!file) return;

        const extension = file.name.split('.').pop()?.toLowerCase();
        if (extension !== 'xlsx' && extension !== 'xls') {
            console.error('Por favor, selecciona un archivo de Excel válido.');
            return;
        }

        this.cargandoExcel = true;

        const usuarioLogueado = 'ADMIN_SISTEMA';

        this._usuariosService.cargueMasivoExcel(file, usuarioLogueado).subscribe({
            next: (resp: any) => {
                this.cargandoExcel = false;

                console.log('✅ Éxito:', resp.msg);
                this.setupRegistrosStream();
            },
            error: (err: any) => {
                this.cargandoExcel = false;

                const mensajePrincipal = err.error?.msg || 'Error interno al procesar el archivo.';
                console.error('❌ Error de cargue:', mensajePrincipal);

                if (err.error?.errores) {
                    console.warn('Detalle de validación de Joi:', err.error.errores);
                }
            }
        });
    }

    validarClaveActual(claveActual: any) {
        const userName = this.FormRegistro.userNameUsuario || ''
        console.log('validar el usuario', userName, claveActual);
        console.log('data el usuario', this.FormRegistro);
        this._authService.verificarClaveActual(userName, claveActual).subscribe((data: any) => {
            console.log('data', data);
            if (data.ok == true) {
                if (this.FormRegistro.codigoUsuario === data.usuario.codigoUsuario) {
                    this.isClaveActual = false
                    console.log('respuesta perfil', data);
                }
            } else {
                this.FormRegistro.claveNew = ''
                this.FormRegistro.claveConfirm = ''
                this.isClaveActual = true
            }
        })
    }

    getCambiarClave(form: any) {

        console.log(form);
        const registroData = form.value
        console.log('registroData', registroData);

        if (!registroData.claveUsuario || !registroData.claveNew || !registroData.claveConfirm) {
            console.warn('Todos los campos son obligatorios.');
            return;
        }

        if (registroData.claveNew !== registroData.claveConfirm) {
            console.warn('La confirmación no coincide con la nueva clave.');
            return;
        }

        const username = this.usuarioSeleccionadoParaClave.userNameUsuario;
        const correo = this.usuarioSeleccionadoParaClave.correoUsuario;

        this._authService.verificarClaveActual(username, registroData.claveUsuario).subscribe({
            next: (respValidacion) => {
                const usuarioActualizado = {
                    ...this.usuarioSeleccionadoParaClave,
                    claveUsuario: registroData.claveNew
                };

                this._usuariosService.actualizarUsuarioClave(usuarioActualizado).subscribe({
                    next: (respUpdate) => {
                        console.log('✅ Cambio de clave exitoso', respUpdate);
                        this.registroSeleccionado = '';
                        this.mostrarModalPassword = false;

                        this._emailService.enviarClaveUsuario(correo, registroData.claveNew).subscribe({
                            next: (respEmail) => {
                                console.log('📧 Correo enviado con éxito', respEmail);
                            },
                            error: (errEmail) => {
                                console.error('❌ La clave se actualizó, pero falló el envío del correo', errEmail);
                            }
                        });

                        this._swalService.getAlertConfirmSuccess(this.translate.instant('USUARIOS.USUARIOS.CAMBIOCLACESUCCESS'));
                    },
                    error: (errUpdate) => {
                        console.error('❌ Error guardando la nueva clave', errUpdate);
                    }
                });

            },
            error: (errValidacion) => {
                console.error('❌ La clave actual ingresada no es correcta', errValidacion);
            }
        });
    }

    procesarCambioClave(id: string, nuevaClave: string) {
        const usuario = this.usuarios.find(x => x.codigoUsuario === id);
        if (!usuario) {
            console.error('Usuario no encontrado en la tabla');
            return;
        }

        const correo = usuario.correoUsuario || 'german.valencia10@gmail.com';
        const usuarioActualizado = { ...usuario, claveUsuario: nuevaClave };

        this._usuariosService.actualizarUsuarioClave(usuarioActualizado).subscribe({
            next: (respUpdate) => {
                console.log('✅ Clave actualizada en BD correctamente', respUpdate);

                this._emailService.enviarClaveUsuario(correo, nuevaClave).subscribe({
                    next: (respEmail) => {
                        console.log('📧 Correo enviado con éxito', respEmail);
                    },
                    error: (errEmail) => {
                        console.error('❌ La clave se actualizó, pero falló el envío del correo', errEmail);
                    }
                });
            },
            error: (errUpdate) => {
                console.error('❌ Error actualizando la clave en la base de datos', errUpdate);
            }
        });

    }

    cerrarModal() {
        this.mostrarModalPassword = false;
        //this.registroSeleccionado = null;
    }

    toggleNav(): void {
        this.toggleSidebar.emit()
    }
}
