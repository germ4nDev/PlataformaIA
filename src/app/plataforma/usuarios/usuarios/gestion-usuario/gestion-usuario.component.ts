import { traducir } from '../../../../theme/shared/i18n/traducir';
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core'
import { CommonModule } from '@angular/common'
import { Router, ActivatedRoute } from '@angular/router'
import { SharedModule } from 'src/app/theme/shared/shared.module'
import { PTLUsuarioModel } from '../../../../theme/shared/_helpers/models/PTLUsuario.model'
import { TranslateModule, TranslateService } from '@ngx-translate/core'
import { PTLUsuariosService } from 'src/app/theme/shared/service/ptlusuarios.service'
import { UploadFilesService } from 'src/app/theme/shared/service/upload-files.service'
import { NavBarComponent } from 'src/app/theme/layout/admin/nav-bar/nav-bar.component'
import { NavContentComponent } from 'src/app/theme/layout/admin/navigation/nav-content/nav-content.component'
import { NavigationService } from 'src/app/theme/shared/service/navigation.service'
import {
    AuthenticationService,
    PtlAplicacionesService,
    PtlEmpresasScService,
    PtllogActividadesService,
    PTLRolesAPService,
    PtlSuitesAPService,
    PTLSuscriptoresService,
    PtlusuariosEmpresasScService,
    PtlusuariosRolesApService,
    PtlusuariosScService
} from 'src/app/theme/shared/service'
import { SwalAlertService } from 'src/app/theme/shared/service/swal-alert.service'
import { LocalStorageService } from 'src/app/theme/shared/service/local-storage.service'
import { v4 as uuidv4 } from 'uuid'
import Swal from 'sweetalert2'
import { TextEditorComponent } from 'src/app/theme/shared/components/text-editor/text-editor.component'
import { catchError, Observable, of, Subscription, tap } from 'rxjs'
import { NavigationItem } from 'src/app/theme/shared/_helpers/models/Navigation.model'
import { PTLAplicacionModel } from 'src/app/theme/shared/_helpers/models/PTLAplicacion.model'
import { PTLSuiteAPModel } from 'src/app/theme/shared/_helpers/models/PTLSuiteAP.model'
import { PTLRoleAPModel } from 'src/app/theme/shared/_helpers/models/PTLRoleAP.model'
import { PTLSuscriptorModel } from 'src/app/theme/shared/_helpers/models/PTLSuscriptor.model'
import { PTLUsuarioSCModel } from 'src/app/theme/shared/_helpers/models/PTLUsuarioSC.model'
import { PTLEmpresaSCModel } from 'src/app/theme/shared/_helpers/models/PTLEmpresaSC.model'
import { PTLUsuarioRoleAPModel } from 'src/app/theme/shared/_helpers/models/PTLUsuarioRole.model'
import { PTLUsuaioEmpresasSCModel } from 'src/app/theme/shared/_helpers/models/PTLUsuarioEmpresaSC.model'
import { NavSettings } from 'src/app/theme/shared/_helpers/models/navSettings.model'

import { AsignacionRolesUsuarioComponent } from './asignacion-roles-usuario/asignacion-roles-usuario.component'

@Component({
    selector: 'app-gestion-usuario',
    standalone: true,
    imports: [CommonModule, SharedModule, TranslateModule, NavBarComponent, NavContentComponent, TextEditorComponent, AsignacionRolesUsuarioComponent],
    templateUrl: './gestion-usuario.component.html',
    styleUrl: './gestion-usuario.component.scss'
})
export class GestionUsuarioComponent implements OnInit, OnDestroy {
    @Output() toggleSidebar = new EventEmitter<void>()
    usuario: PTLUsuarioModel = new PTLUsuarioModel()
    FormRegistro: PTLUsuarioModel = new PTLUsuarioModel()
    navSettings: NavSettings = new NavSettings()
    form: undefined
    isSubmit: boolean = false
    menuItems!: Observable<NavigationItem[]>
    modoEdicion: boolean = false
    isAsociarRoles: boolean = false
    codeRegistro = uuidv4()
    claveUsuario: string = ''
    selectedFile: File | null = null
    previewUrl: string | ArrayBuffer | null = null
    userPhotoUrl: string = ''
    fileName: string = ''
    selectedFileUrl: string | null = null
    isClaveActual: boolean = true
    claveActual: string = ''
    tipoEditorTexto = 'basica'
    lockScreenSubscription: Subscription | undefined
    isLocked: boolean = false
    isUserRole: boolean = true
    lockMessage: string = ''
    suscPlataforma: string = ''
    codAplicacion: string = ''
    codSuscriptor: string = ''
    codEmpresaSC: string = ''
    codSuite: string = ''
    roles: PTLRoleAPModel[] = []
    rolesFiltrado: PTLRoleAPModel[] = []
    userRoles: any[] = []
    todosLosRoles: any[] = []
    tipoRolSeleccionado: string = ''
    rolesAsignadosAlUsuario: any[] = []
    usuarios: PTLUsuarioModel[] = []
    aplicaciones: PTLAplicacionModel[] = []
    aplicacionesSub?: Subscription
    suitesSub?: Subscription
    suites: PTLSuiteAPModel[] = []
    suscriptores: PTLSuscriptorModel[] = []
    suitesApp: PTLSuiteAPModel[] = []
    usuariosSC: PTLUsuarioSCModel[] = []
    empresaSC: PTLEmpresaSCModel[] = []
    empresaSCFiltradas: PTLEmpresaSCModel[] = []
    usuariosRoles: PTLUsuarioRoleAPModel[] = []
    mostrarSeleccionRoles: boolean = false
    empresasSC: PTLEmpresaSCModel[] = []
    usuarioEmpresaSC: PTLUsuaioEmpresasSCModel[] = []
    nombreUsuario: string = ''

    constructor(
        private router: Router,
        private route: ActivatedRoute,
        private translate: TranslateService,
        private _logActividadesService: PtllogActividadesService,
        private _navigationService: NavigationService,
        private _registrosService: PTLUsuariosService,
        private _authService: AuthenticationService,
        private _swalAlertService: SwalAlertService,
        private _translate: TranslateService,
        private _aplicacionesService: PtlAplicacionesService,
        private _suitesService: PtlSuitesAPService,
        private _suscriptoresService: PTLSuscriptoresService,
        private _localStorageService: LocalStorageService,
        private _usuariosRolesService: PtlusuariosRolesApService,
        private _usuariosSCService: PtlusuariosScService,
        private _empresasSCService: PtlEmpresasScService,
        private _usuariosEmpresasSCService: PtlusuariosEmpresasScService,
        private _rolesService: PTLRolesAPService,
        private _rolesUsuariosService: PtlusuariosRolesApService,
        private _uploadService: UploadFilesService
    ) {
        this.isSubmit = false
        this.suscPlataforma = this._localStorageService.getSuscriptorPlataformaLocalStorage()
        this.navSettings = this._localStorageService.getNavSettingsLocalStorage()
        const registroId = this._localStorageService.getObject<string>('regId') || ''
        if (registroId != 'nuevo') {
            // console.log('me llena el Id', registroId);
            this.modoEdicion = true
            this._registrosService.getUsuarioById(registroId).subscribe({
                next: (resp: any) => {
                    this.usuario = resp.usuario
                    this.FormRegistro = resp.usuario

                    this.claveUsuario = resp.usuario.claveUsuario
                    this.selectedFileUrl = this._uploadService.getFilePath(this.suscPlataforma, 'usuarios', resp.usuario.fotoUsuario)
                    this.FormRegistro.claveUsuario = ''
                    this.FormRegistro.claveNew = ''
                    this.FormRegistro.claveConfirm = ''
                    // CC-134 (decisión del usuario): los roles se asignan solo en Suscriptores › Usuarios › Roles; aquí ya no se consultan
                },
                error: () => {
                    Swal.fire(traducir('COMMON.ERROR'), traducir('COMMON.COULD_NOT_GET_APPLICATION'), 'error')
                }
            })
        } else {
            // console.log('no llena el Id', registroId);
            this.modoEdicion = false
            this.consultarRoles()
        }
    }

    ngOnInit() {
        this._navigationService.getNavigationItems()
        this.suites = this._suitesService.getSuitesActuales()
        this.aplicaciones = this._aplicacionesService.getBAplicacionesActuales()
        this.suscriptores = this._suscriptoresService.getSuscriptoresActuales()
        this.usuariosSC = this._usuariosSCService.getUsuariosSCActuales()
        this.empresaSC = this._empresasSCService.getEmpresasSCActuales()
        this.menuItems = this._navigationService.menuItems$
        this.usuariosRoles = this._rolesUsuariosService.getUsuairosRolesActuales()
        this.usuariosSC = this._usuariosSCService.getUsuariosSCActuales()
        this.usuarioEmpresaSC = this._usuariosEmpresasSCService.getUsuariosEmpresasSCActuales()
        this.suscriptores = this._suscriptoresService.getSuscriptoresActuales()
        this.consultarRoles()
        this.lockScreenSubscription = this._navigationService.lockScreenEvent$.subscribe({
            next: (message: string) => {
                this._localStorageService.setFormRegistro(this.FormRegistro)
                this.isLocked = true
                this.lockMessage = message
            },
            error: err => console.error('Error al suscribirse al evento de bloqueo:', err)
        })
        const form = this._localStorageService.getFormRegistro()
        if (form != undefined) {
            this.FormRegistro = form
            this._localStorageService.removeFormRegistro()
        }
        if (!this.modoEdicion) {
            this.FormRegistro.codigoUsuario = uuidv4()
            this.FormRegistro.fotoUsuario = 'no-imagen.jpg'
            this.FormRegistro.usuarioAdministrador = false
            //   console.log('formRegistro original', this.FormRegistro);
        }
    }

    ngOnDestroy(): void {
        this.aplicacionesSub?.unsubscribe()
        this.suitesSub?.unsubscribe()
    }

    validarClaveActual(claveActual: any) {
        const userName = this.FormRegistro.userNameUsuario || ''
        this.FormRegistro.claveActual = claveActual;
    }

    actualizarDescripcionRegistro(nuevoContenido: string): void {
        this.FormRegistro.descripcionUsuario = nuevoContenido
        // console.log('Descripción de versión actualizada:', this.FormRegistro.descripcionUsuario);
        // if (this.validationForm && this.isSubmit) {
        // }
    }

    consultarRolesUsuario(codUsuario: string) {
        let rolesUsuarioFinal: any[] = []
        const usuarioSC = this.usuariosSC.filter(ru => ru.codigoUsuario == codUsuario && ru.estadoUsuarioSC == true)[0]
        const suscriptor = this.suscriptores.filter(ru => ru.codigoSuscriptor === usuarioSC.codigoSuscriptor && ru.estadoSuscriptor == true)[0]
        const empresasSC = this.empresasSC.filter(ru => ru.codigoSuscriptor == suscriptor.codigoSuscriptor && ru.estadoEmpresa == true)
        const usuariosEmpresaSC = this.usuarioEmpresaSC.filter(ru => ru.codigoUsuarioSC == usuarioSC.codigoUsuarioSC && ru.estadoUsuarioEmpresaSC == true)
        // console.log('rolesUsuario', rolesUsuario)
        let rolesUsuario: PTLUsuarioRoleAPModel[] = []
        usuariosEmpresaSC.forEach(usuEmp => {
            const roles = this.usuariosRoles.filter(ue => ue.codigoUsuarioSC === usuEmp.codigoUsuarioEmpresaSC && ue.estadoUsuarioRole == true)
            roles.forEach(role => {
                const emp = empresasSC.filter(x => x.codigoEmpresaSC == usuEmp.codigoEmpresaSC)[0]
                role.codigoEmpresaSC = emp.codigoEmpresaSC
            });
            rolesUsuario.push(...roles)
        });
        rolesUsuarioFinal = rolesUsuario.map(ru => {
            //   console.log('******** roleUsuario', ru)
            const role = this.roles.find(r => r.codigoRole === ru.codigoRole && r.estadoRole == true)
            const suite = this.suites.find(s => s.codigoSuite === ru?.codigoSuite)
            const aplicacion = this.aplicaciones.find(a => a.codigoAplicacion === ru?.codigoAplicacion)
            const empresa = empresasSC.find(a => a.codigoEmpresaSC === ru.codigoEmpresaSC)
            return {
                suscriptor: suscriptor ? suscriptor.nombreSuscriptor : 'Sin Suscriptor',
                empresa: empresa ? empresa.nombreEmpresa : 'Sin Empresa',
                aplicacion: aplicacion ? aplicacion.nombreAplicacion : 'Sin Aplicación',
                suite: suite ? suite.nombreSuite : 'Sin Suite',
                role: role ? role.nombreRole : 'Rol Desconocido'
            }
        })

        return rolesUsuarioFinal
    }

    onAplicacionchangeClick(event: any) {
        console.log('codAplicacion', event)
        this.codAplicacion = event
        const app = this.aplicaciones.filter(x => x.codigoAplicacion == event)[0]
        this.suitesApp = this.suites.filter(x => x.codigoAplicacion == app.codigoAplicacion)
        // this.consultarRoles(this.codAplicacion, this.codSuite)
        // this.codAplicacion = ''
        this.codSuite = '' // Resetear suite al cambiar app
        this.roles = []
    }

    onSuiteChangeClick(event: any) {
        console.log('codSuite', event)
        this.codSuite = event
        // const suite = this.suites.filter(x => x.codigoSuite == event)[0]
        // this.consultarRoles(this.codAplicacion, this.codSuite)
        // this.codSuite = ''
        if (this.codAplicacion && this.codSuite) {
            this.consultarRoles(this.codAplicacion, this.codSuite)
        }
    }

    onSuscriptorhangeClick(event: any) {
        this.FormRegistro.codigoSuscriptor = event.target.value
        console.log('codigoSuscrioptor', this.FormRegistro.codigoSuscriptor)
        this.codSuscriptor = event.target.value
        this.empresaSCFiltradas = this.empresaSC.filter(x => x.codigoSuscriptor == event.target.value)
    }

    onEmpresaSCChangeClick(event: any) {
        this.FormRegistro.codigoEmpresaSC = event.target.value
        this.codEmpresaSC = event.target.value
        console.log('codigoEmpresaSC', this.FormRegistro.codigoEmpresaSC)
    }

    cambiarTipoRoleRoles(tipo: string) {
        console.log('tipo seleccionado', tipo)
        this.tipoRolSeleccionado = tipo
        if (tipo === 'plataforma') {
            this.codAplicacion = ''
            this.codSuite = ''
            this.consultarRoles()
        } else {
            this.roles = [] // Esperar a que seleccione App y Suite
        }
    }

    consultarRoles(codigoAplicacion?: string, codigoSuite?: string) {
        // this._rolesService.getRoles().subscribe((resp: any) => {
        //     if (resp.ok) {
        this.roles = this._rolesService.getRolesActuales()
        this.todosLosRoles = this.roles

        // Filtrado Lógico
        if (this.tipoRolSeleccionado === 'plataforma') {
            this.roles = this.todosLosRoles.filter(
                (r: any) => (!r.codigoAplicacion || r.codigoAplicacion === '') && (!r.codigoSuite || r.codigoSuite === '')
            )
        } else if (this.tipoRolSeleccionado === 'suscriptor') {
            this.roles = this.todosLosRoles.filter((r: any) => r.codigoAplicacion === codigoAplicacion && r.codigoSuite === codigoSuite)
        }

        // Marcar los que ya están asignados (para edición)
        this.roles = this.roles.map((r: any) => ({
            ...r,
            checked: this.rolesAsignadosAlUsuario.includes(r.codigoRole)
        }))
        //     }
        // });
    }

    onFileSelectedClick(event: any) {
        const file: File = event.target.files[0]
        const codigo =
            this._localStorageService.getSuscriptorLocalStorage()?.codigoSuscriptor ||
            this._localStorageService.getSuscriptorPlataformaLocalStorage()
        const objUpload = {
            susc: codigo,
            tipo: 'usuarios',
            id: '0'
        }
        // console.log('objUpload', objUpload);
        if (file) {
            const reader = new FileReader()
            reader.onload = (e: any) => {
                this.selectedFileUrl = e.target.result
            }
            reader.readAsDataURL(file)
            this._uploadService.uploadUserPhoto(file, objUpload).subscribe({
                next: (path: any) => {
                    //   console.log('resultado++++++++++++++++', path);
                    this.fileName = path.nombreArchivo
                    this.FormRegistro.fotoUsuario = path.nombreArchivo
                },
                error: () => {
                    this._swalAlertService.getAlertError(this._translate.instant('COMMON.ERROR_UPLOADING_IMAGE'))
                }
            })
        } else {
            this.selectedFileUrl = null
            this.userPhotoUrl = ''
        }
    }

    // CC-134: retirado (los roles se asignan en Suscriptores › Usuarios › Roles; copia en _respaldos/2026-11-07_roles-gestion-usuario)

    btnAsociarTodosRolesClick() {
        const todosSeleccionados = this.roles.every((r: any) => r.checked)
        this.roles.forEach((r: any) => {
            r.checked = !todosSeleccionados
            this.toggleRolSeleccionado(r)
        })
    }

    btnGestionarUsuarioClick(form: any) {
        this.isSubmit = true

        const registroData = form.value as PTLUsuarioModel
        this.codSuscriptor = this.navSettings.suscriptor?.codigoSuscriptor || ''
        registroData.codigoSuscriptor = this.codSuscriptor
        registroData.isOnline = false;
        registroData.ultimaConexion = '';
        console.log('clave actual', this.FormRegistro.claveActual);
        console.log('clave usuario', this.claveUsuario);
        console.log('nombre usuario', this.FormRegistro.nombreUsuario);

        if (this.modoEdicion) {
            // MODIFICAR REGISTRO
            if (this.FormRegistro.claveUsuario == '') {
                this.FormRegistro.claveUsuario = this.claveUsuario
            }
            console.log('************* fotoUsuario', this.FormRegistro.fotoUsuario)
            registroData.claveUsuario = this.FormRegistro.claveUsuario || ''
            registroData.fotoUsuario = this.FormRegistro.fotoUsuario
            registroData.codigoUsuarioModificacion = this._localStorageService.getUsuarioLocalStorage().codigoUsuario
            registroData.fechaModificacion = new Date().toISOString()
            this._registrosService.actualizarUsuarioDatos(registroData).subscribe({
                next: (resp: any) => {
                    // this.procesarUsuarioSuscriptor(usuarioSC, 1)
                    if (resp.ok) {
                        const logData = {
                            codigoTipoLog: '',
                            codigoRespuesta: '201',
                            descripcionLog: this.translate.instant('COMMON.RECORD_UPDATED_SUCCESSFULLY')
                        }
                        this._logActividadesService.postCrearRegistro(logData).subscribe(() => console.log('log creado exitosamente'))
                        this._swalAlertService.getAlertSuccess(this._translate.instant('COMMON.USER_UPDATED_SUCCESSFULLY'))
                        this.router.navigate(['/usuarios/usuarios'])
                    }
                },
                error: (err: any) => {
                    console.error(err)
                    const logData = {
                        codigoTipoLog: '',
                        codigoRespuesta: '501',
                        descripcionLog: this.translate.instant('COMMON.COULD_NOT_UPDATE_RECORD') + ', ' + err.mensaje
                    }
                    this._logActividadesService.postCrearRegistro(logData).subscribe(() => console.log('log creado error'))
                    this._swalAlertService.getAlertError(this._translate.instant('COMMON.COULD_NOT_UPDATE_USER'))
                }
            })
        } else {
            // INSERTAR REGISTRO
            registroData.claveUsuario = this.FormRegistro.claveActual || ''
            registroData.codigoUsuario = uuidv4()
            registroData.fotoUsuario = this.fileName !== '' ? this.fileName : 'no-imagen.png'
            registroData.fechaCreacion = new Date().toISOString()
            registroData.codigoUsuarioCreacion = this._localStorageService.getUsuarioLocalStorage().codigoUsuario
            const usuarioSC = {
                codigoSuscriptor: this.FormRegistro.codigoSuscriptor,
                codigoUsuario: registroData.codigoUsuario
            }
            this._registrosService.crearUsuario(registroData).subscribe({
                next: (resp: any) => {
                    if (resp.ok) {
                        this.procesarUsuarioSuscriptor(usuarioSC, 2)
                        // const logData = {
                        //     codigoTipoLog: '',
                        //     codigoRespuesta: '201',
                        //     descripcionLog: this.translate.instant('COMMON.RECORD_INSERTED_SUCCESSFULLY')
                        // }
                        // this._logActividadesService.postCrearRegistro(logData).subscribe(() => console.log('log creado exitosamente'))
                        this._swalAlertService.getAlertSuccess(this._translate.instant('USUARIOS.GESTION.USER_CREATED_SUCCESSFULLY'))
                        form.resetForm()
                        this.isSubmit = false
                        this.router.navigate(['/usuarios/usuarios'])
                    }
                },
                error: (err: any) => {
                    console.error(err)
                    const logData = {
                        codigoTipoLog: '',
                        codigoRespuesta: '501',
                        descripcionLog: this.translate.instant('COMMON.COULD_NOT_INSERT_RECORD') + ', ' + err.mensaje
                    }
                    this._logActividadesService.postCrearRegistro(logData).subscribe(() => console.log('log creado error'))
                    const objUpload = {
                        susc: this._localStorageService.getSuscriptorLocalStorage()?.codigoSuscriptor,
                        tipo: 'usuarios',
                        file: this.fileName
                    }
                    this._uploadService.deleteFilePath(objUpload).subscribe(() => console.log('Foto eliminada'))
                    this._swalAlertService.getAlertError(this._translate.instant('USUARIOS.GESTION.COULD_NOT_CREATE_USER'))
                }
            })
        }
    }

    procesarUsuarioSuscriptor(usuarioSC: any, tipo: number) {
        console.log('procesar el usuario suscriptor', usuarioSC)
        const existe = this.usuariosSC.filter(
            x => x.codigoSuscriptor == usuarioSC.codigoSuscriptor && x.codigoUsuario == usuarioSC.codigoUsuario && x.estadoUsuarioSC == true
        )
        if (tipo == 1) {
            if (existe.length === 0) {
                usuarioSC.codigoUsuarioSC = uuidv4()
                usuarioSC.estadoUsuario = true
                usuarioSC.fechaCreacion = new Date().toISOString()
                usuarioSC.codigoUsuarioCreacion = this._localStorageService.getUsuarioLocalStorage().codigoUsuario
                this._usuariosSCService.crearUsuarioSC(usuarioSC).subscribe(data => console.log('usuarioSC creado correctamente', usuarioSC))
            } else {
                usuarioSC.codigoUsuarioSC = existe[0].codigoUsuarioSC
                usuarioSC.estadoUsuario = true
                usuarioSC.fechaModificacion = new Date().toISOString()
                usuarioSC.codigoUsuarioModificacion = this._localStorageService.getUsuarioLocalStorage().codigoUsuario
                this._usuariosSCService.actualizarUsuario(usuarioSC).subscribe(data => console.log('usuarioSC creado correctamente', usuarioSC))
            }
        } else if (tipo == 2) {
            if (existe.length === 0) {
                usuarioSC.codigoUsuarioSC = uuidv4()
                usuarioSC.estadoUsuarioSC = true
                usuarioSC.fechaCreacion = new Date().toISOString()
                usuarioSC.codigoUsuarioCreacion = this._localStorageService.getUsuarioLocalStorage().codigoUsuario
                this._usuariosSCService.crearUsuarioSC(usuarioSC).subscribe(data => console.log('usuarioSC creado correctamente', usuarioSC))
            } else {
                console.log('ya existe el usuario para el suscriptor', usuarioSC)
            }
        }
    }

    // CC-134: retirado (los roles se asignan en Suscriptores › Usuarios › Roles; copia en _respaldos/2026-11-07_roles-gestion-usuario)

    toggleRolSeleccionado(rol: any) {
        if (rol.checked) {
            // Si lo marca y no estaba en la lista, lo agregamos
            if (!this.rolesAsignadosAlUsuario.includes(rol.codigoRole)) {
                this.rolesAsignadosAlUsuario.push(rol.codigoRole)
                console.log('roles asignados', this.rolesAsignadosAlUsuario)
            }
        } else {
            // Si lo desmarca, lo quitamos de la lista global
            this.rolesAsignadosAlUsuario = this.rolesAsignadosAlUsuario.filter(id => id !== rol.codigoRole)
        }
    }

    get rolesSeleccionadosDetalle() {
        // Filtramos todos los roles para obtener solo los que el usuario ha marcado
        return this.todosLosRoles.filter(r => this.rolesAsignadosAlUsuario.includes(r.codigoRole))
    }

    get rolesSeleccionadosPlataforma() {
        return this.rolesSeleccionadosDetalle.filter(
            r => (!r.codigoAplicacion || r.codigoAplicacion === '') && (!r.codigoSuite || r.codigoSuite === '')
        )
    }

    get rolesSeleccionadosSuscriptor() {
        return this.rolesSeleccionadosDetalle.filter(r => r.codigoAplicacion && r.codigoAplicacion !== '')
    }

    obtenerNombreApp(codigoApp: string): string {
        const app = this.aplicaciones.find(a => a.codigoAplicacion === codigoApp)
        return app ? app.nombreAplicacion || '' : ''
    }

    obtenerNombreSuite(codigoSuite: string): string {
        const suite = this.suites.find(a => a.codigoSuite === codigoSuite)
        return suite ? suite.nombreSuite || '' : ''
    }

    eliminarRolDesdeResumen(rol: any) {
        this.rolesAsignadosAlUsuario = this.rolesAsignadosAlUsuario.filter(id => id !== rol.codigoRole)

        // Si el rol que eliminamos está actualmente visible en la lista de checkboxes, lo desmarcamos
        const rolEnLista = this.roles.find(r => r.codigoRole === rol.codigoRole)
        if (rolEnLista) {
            rolEnLista.checked = false
        }
    }

    btnAsociarMasClick() {
        this.isAsociarRoles = true
        this.mostrarSeleccionRoles = !this.mostrarSeleccionRoles
    }

    btnRegresarClick() {
        this.router.navigate(['/usuarios/usuarios'])
    }

    onDeleteRole(role: any) {
        console.log('eliminar role de la lista', role);
    }

    toggleNav(): void {
        this.toggleSidebar.emit()
    }
}
