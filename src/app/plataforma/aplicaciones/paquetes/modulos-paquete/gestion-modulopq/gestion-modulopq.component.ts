import { CommonModule } from '@angular/common'
import { Component, EventEmitter, Output } from '@angular/core'
import { Router, ActivatedRoute } from '@angular/router'
import { TranslateModule, TranslateService } from '@ngx-translate/core'
import { Observable, Subscription, tap, catchError, of } from 'rxjs'
import { GradientConfig } from 'src/app/app-config'
import { NavBarComponent } from 'src/app/theme/layout/admin/nav-bar/nav-bar.component'
import { NavContentComponent } from 'src/app/theme/layout/admin/navigation/nav-content/nav-content.component'
import { NavigationItem } from 'src/app/theme/shared/_helpers/models/Navigation.model'
import { PTLAplicacionModel } from 'src/app/theme/shared/_helpers/models/PTLAplicacion.model'
import { PTLModuloAP } from 'src/app/theme/shared/_helpers/models/PTLModuloAP.model'
import { PTLModuloPQModel, PTLModuloPQModelAdm } from 'src/app/theme/shared/_helpers/models/PTLModuloPQ.model'
import { PTLSuiteAPModel } from 'src/app/theme/shared/_helpers/models/PTLSuiteAP.model'
import {
    PtlAplicacionesService,
    PtlSuitesAPService,
    PtlmodulosApService,
    PtllogActividadesService,
    SwalAlertService,
    LocalStorageService,
    NavigationService
} from 'src/app/theme/shared/service'
import { LayoutInitializerService } from 'src/app/theme/shared/service/layout-initializer.service'
import { LoadingService } from 'src/app/theme/shared/service/loading.service'
import { PTLModulosPaqueteService } from 'src/app/theme/shared/service/ptlmodulos-paquete.service'
import { SharedModule } from 'src/app/theme/shared/shared.module'
import { v4 as uuidv4 } from 'uuid'

@Component({
    selector: 'app-gestion-modulopq',
    standalone: true,
    imports: [CommonModule, SharedModule, TranslateModule, NavBarComponent, NavContentComponent],
    templateUrl: './gestion-modulopq.component.html',
    styleUrl: './gestion-modulopq.component.scss'
})
export class GestionModulopqComponent {
    // #region VARIABLES
    @Output() toggleSidebar = new EventEmitter<void>()
    FormRegistro: PTLModuloPQModel = new PTLModuloPQModel()
    menuItems$!: Observable<NavigationItem[]>
    gradientConfig: any
    navCollapsed: boolean = false
    navCollapsedMob: boolean = false
    windowWidth: number = 0
    form: undefined
    isSubmit: boolean
    moduloId: string = ''
    modoEdicion: boolean = false
    aplicacionesSub?: Subscription
    aplicaciones: PTLAplicacionModel[] = []
    suitesSub?: Subscription
    modulosSub?: Subscription
    suites: PTLSuiteAPModel[] = []
    suitesFiltradas: PTLSuiteAPModel[] = []
    modulos: PTLModuloAP[] = []
    modulosPadre: PTLModuloAP[] = []
    modulosPQ: PTLModuloPQModel[] = []
    codigoPaquete: string = ''
    codigoAplicacion: string = ''
    codigoSuite: string = ''
    tipoEditorTexto = 'basica'
    lockScreenSubscription: Subscription | undefined
    isLocked: boolean = false
    lockMessage: string = ''
    suscriptor: string = ''
    // #endregion VARIABLES

    // constructor
    constructor(
        private router: Router,
        private route: ActivatedRoute,
        private translate: TranslateService,
        private _aplicacionesService: PtlAplicacionesService,
        private _suitesService: PtlSuitesAPService,
        private _registrosService: PTLModulosPaqueteService,
        private _modulosService: PtlmodulosApService,
        private _layoutInitializer: LayoutInitializerService,
        private _logActividadesService: PtllogActividadesService,
        private _swalAlertService: SwalAlertService,
        private _localStorageService: LocalStorageService,
        private _loadingService: LoadingService,
        private _navigationService: NavigationService
    ) {
        this.isSubmit = false
        GradientConfig.header_fixed_layout = true
        this.gradientConfig = GradientConfig
        this.navCollapsed = this.windowWidth >= 992 ? GradientConfig.isCollapse_menu : false
        this.navCollapsedMob = false
        this.suscriptor = this._localStorageService.getSuscriptorPlataformaLocalStorage()
        // this.moduloId = this._localStorageService.getObject<string>('regId') || ''
        this.codigoPaquete = this._localStorageService.getObject<string>('regPQ') || ''

    }

    ngOnInit() {
        this._layoutInitializer.applyLayout()
        this._navigationService.getNavigationItems()
        this.menuItems$ = this._navigationService.menuItems$
        // TODO Replicar en todos los modulos de gestion de datos
        this.lockScreenSubscription = this._navigationService.lockScreenEvent$.subscribe({
            next: (message: string) => {
                this._localStorageService.setFormRegistro(this.FormRegistro)
                this.isLocked = true
                this.lockMessage = message
            },
            error: err => console.error('Error al suscribirse al evento de bloqueo:', err)
        })
        const form = this._localStorageService.getFormRegistro()
        this.aplicaciones = this._aplicacionesService.getBAplicacionesActuales();
        this.suites = this._suitesService.getSuitesActuales();
        this.suitesFiltradas = this._suitesService.getSuitesActuales();
        this.modulos = this._modulosService.getModulosActuales();
        this.modulosPQ = this._registrosService.getModulosPQActuales();

        if (form != undefined) {
            this.FormRegistro = form
            this._localStorageService.removeFormRegistro()
        }
        // if (!this.modoEdicion) {
        //     console.log('modo edicion', this.modoEdicion)
        //     this.FormRegistro.codigoAplicacion = ''
        //     this.FormRegistro.codigoSuite = ''
        //     this.FormRegistro.codigoModulo = ''
        //     this.FormRegistro.codigoModuloPQ = uuidv4()
        //     console.log('FormRegistro', this.FormRegistro)
        // } else {
        //     this.codigoPaquete = uuidv4();
        // }
    }

    consultarModulos(codSuite?: string) {
        console.log('todos los modulos', this.modulosPQ)
        if (codSuite) {
            const modulosPadreSuite = this.modulos.filter(x => x.codigoSuite == codSuite && x.hijos == true)
            const modulosPQSuite = this.modulosPQ.filter(x => x.codigoSuite == codSuite)
            modulosPadreSuite.forEach((modulo: any) => {
                const existe = modulosPQSuite.find((sel: any) => sel.codigoModulo == modulo.codigoModulo)
                modulo.checked = existe ? true : false
            })
            this.modulosPadre = modulosPadreSuite
        } else {
            this.modulosPadre = []
        }
        console.log('Todos las modulos padre', this.modulosPadre)
    }

    btnAsociarTodosClick() {
        this.modulosPadre.forEach(modu => {
            modu.checked = true;
        })
        console.log('modulos seleccionados', this.modulosPadre)
    }

    onAplicacionChangeClick(value: any) {
        const app = this.aplicaciones.filter(x => x.codigoAplicacion == value.target.value)[0]
        this.FormRegistro.codigoAplicacion = app.codigoAplicacion || ''
        this.codigoAplicacion = app.codigoAplicacion || ''
        this.suitesFiltradas = this.suites.filter(x => x.codigoAplicacion == this.codigoAplicacion)
    }

    onSuiteChangeClick(value: any) {
        const suite = this.suites.filter(x => x.codigoSuite == value.target.value)[0]
        console.log('suite seleccionada', suite)
        this.FormRegistro.codigoSuite = suite.codigoSuite || ''
        this.codigoSuite = suite.codigoSuite || ''
        this.consultarModulos(suite.codigoSuite)
    }

    onModuloCheckChange(evento: any, modu: PTLModuloAP) {
        modu.checked = evento.target.checked
        const idx = this.modulosPadre.findIndex(x => x.codigoModulo === modu.codigoModulo)
        this.modulosPadre[idx].checked = evento.target.checked
    }

    btnGestionarRegistroClick(codigo: string) {
        this._loadingService.show()
        if (this.modulosPadre.length > 0) {
            let modulosFinal: any[] = []
            const seleccionados = this.modulosPadre.filter(x => x.checked === true)
            console.log('seleccionados', seleccionados);
            seleccionados.forEach(modulo => {
                const registroData: PTLModuloPQModel = new PTLModuloPQModel()
                registroData.codigoModuloPQ = uuidv4()
                registroData.codigoModulo = modulo.codigoModulo
                registroData.codigoAplicacion = this.codigoAplicacion
                registroData.codigoSuite = this.codigoSuite
                registroData.codigoPaquete = this.codigoPaquete
                registroData.estadoModuloPQ = true
                registroData.codigoUsuarioCreacion = this._localStorageService.getUsuarioLocalStorage().codigoUsuario
                registroData.fechaCreacion = new Date().toISOString()
                registroData.codigoUsuarioModificacion = ''
                registroData.fechaModificacion = ''
                console.log('insertar registro', registroData)
                modulosFinal.push(registroData)
            })
            const dataCrear: PTLModuloPQModelAdm = {
                codigoPaquete: this.codigoPaquete,
                codigoAplicacion: this.codigoAplicacion,
                codigoSuite: this.codigoSuite,
                modulos: modulosFinal
            }
            console.log('procesar data', dataCrear)
            this._registrosService.postCrearRegistro(dataCrear).subscribe({
                next: (resp: any) => {
                    console.log('reesp', resp)
                    if (resp.ok) {
                        const logData = {
                            codigoTipoLog: '',
                            codigoRespuesta: '201',
                            descripcionLog: this.translate.instant('PLATAFORMA.INSERTAR')
                        }
                        this._logActividadesService.postCrearRegistro(logData).subscribe(() => console.log('log creado exitosamente'))
                        this._swalAlertService.getAlertConfirmSuccess(this.translate.instant('PLATAFORMA.INSERTAR'))
                        this._loadingService.hide()
                        this.router.navigate(['aplicaciones/modulos-paquete'], { queryParams: { regId: this.codigoPaquete } })
                    }
                },
                error: (err: any) => {
                    console.error(err)
                    const logData = {
                        codigoTipoLog: '',
                        codigoRespuesta: '501',
                        descripcionLog: this.translate.instant('PLATAFORMA.NOINSERTO') + ', ' + err.message
                    }
                    this._loadingService.hide()
                    this._logActividadesService.postCrearRegistro(logData).subscribe(() => console.log('log creado exitosamente'))
                    this._swalAlertService.getAlertError(this.translate.instant('PLATAFORMA.NOINSERTO') + ', ' + err)
                }
            })
        } else {
            this._loadingService.hide()
            this._swalAlertService.getAlertError(this.translate.instant('PLATAFORMA.NOREGISTROS'))
        }

        // if (this.modoEdicion) {
        //     this._registrosService.putModificarRegistro(registroData, this.moduloId).subscribe({
        //         next: (resp: any) => {
        //             if (resp.ok) {
        //                 const logData = {
        //                     codigoTipoLog: '',
        //                     codigoRespuesta: '201',
        //                     descripcionLog: this.translate.instant('PLATAFORMA.MODIFICAR')
        //                 };
        //                 this._logActividadesService.postCrearRegistro(logData).subscribe(() => console.log('log creado exitosamente'));
        //                 this._swalAlertService.getAlertSuccess(this.translate.instant('PLATAFORMA.MODIFICAR'));
        //                 this.router.navigate(['/aplicaciones/modulos']);
        //             } else {
        //                 const logData = {
        //                     codigoTipoLog: '',
        //                     codigoRespuesta: '501',
        //                     descripcionLog: this.translate.instant('PLATAFORMA.NOMODIFICO')
        //                 };
        //                 this._logActividadesService.postCrearRegistro(logData).subscribe(() => console.log('log creado exitosamente'));
        //                 this._swalAlertService.getAlertError(resp.message || this.translate.instant('PLATAFORMA.NOMODIFICO'));
        //             }
        //         },
        //         error: (err: any) => {
        //             console.error(err);
        //             const logData = {
        //                 codigoTipoLog: '',
        //                 codigoRespuesta: '501',
        //                 descripcionLog: this.translate.instant('PLATAFORMA.NOMODIFICO') + ', ' + err.message
        //             };
        //             this._logActividadesService.postCrearRegistro(logData).subscribe(() => console.log('log creado exitosamente'));
        //             this._swalAlertService.getAlertError(this.translate.instant('PLATAFORMA.NOMODIFICO'));
        //         }
        //     });
        // } else {
        //     //   const registroData = form.value as PTLModuloAP;
        //     registroData.codigoModulo = uuidv4();
        //     registroData.codigoUsuarioCreacion = this._localStorageService.getUsuarioLocalStorage().codigoUsuario;
        //     registroData.fechaCreacion = new Date().toISOString();
        //     registroData.codigoUsuarioModificacion = '';
        //     registroData.fechaModificacion = '';
        //     console.log('insertar registro', registroData);
        //     this._registrosService.postCrearRegistro(registroData).subscribe({
        //         next: (resp: any) => {
        //             console.log('reesp', resp.modulo);
        //             if (resp.ok) {
        //                 const logData = {
        //                     codigoTipoLog: '',
        //                     codigoRespuesta: '201',
        //                     descripcionLog: this.translate.instant('PLATAFORMA.INSERTAR')
        //                 };
        //                 this._logActividadesService.postCrearRegistro(logData).subscribe(() => console.log('log creado exitosamente'));
        //                 this._swalAlertService.getAlertSuccess(this.translate.instant('PLATAFORMA.INSERTAR'));
        //                 form.resetForm();
        //                 this.isSubmit = false;
        //                 this.router.navigate(['/aplicaciones/modulos']);
        //             }
        //         },
        //         error: (err: any) => {
        //             console.error(err);
        //             const logData = {
        //                 codigoTipoLog: '',
        //                 codigoRespuesta: '501',
        //                 descripcionLog: this.translate.instant('PLATAFORMA.NOINSERTO') + ', ' + err.message
        //             };
        //             this._logActividadesService.postCrearRegistro(logData).subscribe(() => console.log('log creado exitosamente'));
        //             this._swalAlertService.getAlertError(this.translate.instant('PLATAFORMA.NOINSERTO') + ', ' + err);
        //         }
        //     });
        // }
    }

    btnRegresarClick() {
        this.router.navigate(['aplicaciones/modulos-paquete'], { queryParams: { regId: this.codigoPaquete } })
    }

    toggleNav(): void {
        this.toggleSidebar.emit()
    }
}
