/* eslint-disable @typescript-eslint/no-explicit-any */
import { Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core'
import { CommonModule } from '@angular/common'
import { Router, ActivatedRoute } from '@angular/router'
import { SharedModule } from 'src/app/theme/shared/shared.module'
import { PTLUsuarioModel } from 'src/app/theme/shared/_helpers/models/PTLUsuario.model'
import { TranslateModule, TranslateService } from '@ngx-translate/core'
import { UploadFilesService } from 'src/app/theme/shared/service/upload-files.service'
import { NavBarComponent } from 'src/app/theme/layout/admin/nav-bar/nav-bar.component'
import { NavContentComponent } from 'src/app/theme/layout/admin/navigation/nav-content/nav-content.component'
import { NavigationService } from 'src/app/theme/shared/service/navigation.service'
import {
    PtllogActividadesService,
    PTLRolesAPService,
    PtlusuariosRolesApService
} from 'src/app/theme/shared/service'
import { SwalAlertService } from 'src/app/theme/shared/service/swal-alert.service'
import { LocalStorageService } from 'src/app/theme/shared/service/local-storage.service'
import { v4 as uuidv4 } from 'uuid'
import Swal from 'sweetalert2'
import { TextEditorComponent } from 'src/app/theme/shared/components/text-editor/text-editor.component'
import { NavigationItem } from 'src/app/theme/shared/_helpers/models/Navigation.model'
import { PTLRoleAPModel } from 'src/app/theme/shared/_helpers/models/PTLRoleAP.model'
import { PTLWidgetMaestroModel } from 'src/app/theme/shared/_helpers/models/PTLWidgetMaestro.model'
import { PTLWidgetsMaestroService } from 'src/app/theme/shared/service/ptlwidgets-maestro.service'
import { PtlWidgetsRolesService } from 'src/app/theme/shared/service/ptlwidgets-roles.service'
import { Observable, Subscription } from 'rxjs'

@Component({
    selector: 'app-gestion-widget',
    standalone: true,
    imports: [CommonModule, SharedModule, TranslateModule, NavBarComponent, NavContentComponent, TextEditorComponent],
    templateUrl: './gestion-widget.component.html',
    styleUrl: './gestion-widget.component.scss'
})
export class GestionWidgetComponent implements OnInit, OnDestroy {
    @Output() toggleSidebar = new EventEmitter<void>()
    usuario: PTLUsuarioModel = new PTLUsuarioModel()
    FormRegistro: PTLWidgetMaestroModel = new PTLWidgetMaestroModel()
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
    widgetRoles: any[] = []
    todosLosRoles: any[] = []
    tipoRolSeleccionado: string = ''
    rolesAsignadosAlUsuario: any[] = []
    nombreUsuario: string = ''

    constructor(
        private router: Router,
        private translate: TranslateService,
        private _logActividadesService: PtllogActividadesService,
        private _navigationService: NavigationService,
        private _registrosService: PTLWidgetsMaestroService,
        private _swalAlertService: SwalAlertService,
        private _translate: TranslateService,
        private _localStorageService: LocalStorageService,
        private _uploadService: UploadFilesService
    ) {
        this.isSubmit = false
        this.suscPlataforma = this._localStorageService.getSuscriptorPlataformaLocalStorage()
        const registroId = this._localStorageService.getObject<string>('regId') || ''
        if (registroId != 'nuevo') {
            // console.log('me llena el Id', registroId);
            this.modoEdicion = true
            this._registrosService.getWidgetById(registroId).subscribe({
                next: (resp: any) => {
                    // console.log('respuesta carga widget', resp);
                    this.usuario = resp.widget
                    this.FormRegistro = resp.widget
                    this.selectedFileUrl = this._uploadService.getFilePath(this.suscPlataforma, 'widgets', resp.widget.imagenWidget)
                    this.fileName = resp.widget.imagenWidget;
                },
                error: () => {
                    Swal.fire('Error', 'No se pudo obtener la Aplicación', 'error')
                }
            })
        } else {
            this.modoEdicion = false
        }
    }

    ngOnInit() {
        this._navigationService.getNavigationItems()
        this.menuItems = this._navigationService.menuItems$
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
            //   console.log('formRegistro original', this.FormRegistro);
        }
    }

    ngOnDestroy(): void {
    }

    actualizarDescripcionRegistro(nuevoContenido: string): void {
        this.FormRegistro.descripcionWidget = nuevoContenido
    }

    onFileSelectedClick(event: any) {
        const file: File = event.target.files[0]
        const codigo =
            this._localStorageService.getSuscriptorLocalStorage()?.codigoSuscriptor ||
            this._localStorageService.getSuscriptorPlataformaLocalStorage()
        const objUpload = {
            susc: codigo,
            tipo: 'widgets',
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
                    this.FormRegistro.imagenWidget = path.nombreArchivo
                },
                error: () => {
                    this._swalAlertService.getAlertError(this._translate.instant('PLATAFORMA.UPLOADPHOTOERROR'))
                }
            })
        } else {
            this.selectedFileUrl = null
            this.userPhotoUrl = ''
        }
    }

    btnGestionarRegistroClick(form: any) {
        this.isSubmit = true
        // if (!form.valid) {
        //   return;
        // }
        const registroData = form.value as PTLWidgetMaestroModel
        // console.log('gestionar widget', registroData);

        if (this.modoEdicion) {
            // MODIFICAR REGISTRO
            registroData.imagenWidget = this.fileName
            registroData.codigoUsuarioModificacion = this._localStorageService.getUsuarioLocalStorage().codigoUsuario
            registroData.fechaModificacion = new Date().toISOString()
            this._registrosService.actualizarWidget(registroData.codigoWidget || '', registroData).subscribe({
                next: (resp: any) => {
                    if (resp.ok) {
                        const logData = {
                            codigoTipoLog: '',
                            codigoRespuesta: '201',
                            descripcionLog: this.translate.instant('PLATAFORMA.MODIFICAR') + ', ' + resp.mensaje
                        }
                        this._logActividadesService.postCrearRegistro(logData).subscribe(() => console.log('log creado exitosamente'))
                        this._swalAlertService.getAlertSuccess(this._translate.instant('PLATAFORMA.UPDATEUSERSUCCESS'))
                        this.router.navigate(['/utilidades/widgets'])
                    } else {
                        const logData = {
                            codigoTipoLog: '',
                            codigoRespuesta: '501',
                            descripcionLog: this.translate.instant('PLATAFORMA.NOMODIFICO') + ', ' + resp.mensaje
                        }
                        this._logActividadesService.postCrearRegistro(logData).subscribe(() => console.log('log creado exitosamente'))
                        this._swalAlertService.getAlertError(resp.message || this._translate.instant('PLATAFORMA.UPDATEUSERERROR'))
                    }
                },
                error: (err: any) => {
                    console.error(err)
                    const logData = {
                        codigoTipoLog: '',
                        codigoRespuesta: '501',
                        descripcionLog: this.translate.instant('PLATAFORMA.NOMODIFICO') + ', ' + err.mensaje
                    }
                    this._logActividadesService.postCrearRegistro(logData).subscribe(() => console.log('log creado exitosamente'))
                    this._swalAlertService.getAlertError(this._translate.instant('PLATAFORMA.UPDATEUSERERROR'))
                }
            })
        } else {
            // INSERTAR REGISTRO
            registroData.imagenWidget = this.fileName !== '' ? this.fileName : 'no-imagen.png'
            registroData.fechaCreacion = new Date().toISOString()
            registroData.codigoUsuarioCreacion = this._localStorageService.getUsuarioLocalStorage().codigoUsuario
            this._registrosService.crearWidget(registroData).subscribe({
                next: (resp: any) => {
                    if (resp.ok) {
                        const logData = {
                            codigoTipoLog: '',
                            codigoRespuesta: '201',
                            descripcionLog: this.translate.instant('PLATAFORMA.INSERTAR')
                        }
                        this._logActividadesService.postCrearRegistro(logData).subscribe(() => console.log('log creado exitosamente'))
                        this._swalAlertService.getAlertSuccess(this._translate.instant('PLATAFORMA.INSERTUSERSUCCESS'))
                        form.resetForm()
                        this.isSubmit = false
                        this.router.navigate(['/utilidades/widgets'])
                    }
                },
                error: (err: any) => {
                    console.error(err)
                    const logData = {
                        codigoTipoLog: '',
                        codigoRespuesta: '501',
                        descripcionLog: this.translate.instant('PLATAFORMA.NOINSERTO') + ', ' + err.mensaje
                    }
                    this._logActividadesService.postCrearRegistro(logData).subscribe(() => console.log('log creado error'))
                    const objUpload = {
                        susc: this._localStorageService.getSuscriptorLocalStorage()?.codigoSuscriptor,
                        tipo: 'usuarios',
                        file: this.fileName
                    }
                    this._uploadService.deleteFilePath(objUpload).subscribe(() => console.log('Foto eliminada'))
                    this._swalAlertService.getAlertError(this._translate.instant('PLATAFORMA.INSERTUSERERROR'))
                }
            })
        }
    }

    btnRegresarClick() {
        this.router.navigate(['/utilidades/widgets'])
    }

    toggleNav(): void {
        this.toggleSidebar.emit()
    }
}
