/* eslint-disable @typescript-eslint/no-explicit-any */
import { Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { GradientConfig } from 'src/app/app-config';
import { TextEditorComponent } from 'src/app/theme/shared/components/text-editor/text-editor.component';
import { SharedModule } from 'src/app/theme/shared/shared.module';
import {
    LocalStorageService,
    PtllogActividadesService,
    SwalAlertService,
    UploadFilesService,
    PtlActividadesService,
    PtlAplicacionesService,
    PtlmodulosApService,
    PtlSuitesAPService
} from 'src/app/theme/shared/service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { NavigationItem } from 'src/app/theme/shared/_helpers/models/Navigation.model';
import { PTLLogActividadAPModel } from 'src/app/theme/shared/_helpers/models/PTLlogActividadAP.model';
import { NavigationService } from 'src/app/theme/shared/service/navigation.service';
import { NavBarComponent } from 'src/app/theme/layout/admin/nav-bar/nav-bar.component';
import { NavContentComponent } from 'src/app/theme/layout/admin/navigation/nav-content/nav-content.component';
import { catchError, Observable, of, Subscription, tap } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';
import Swal from 'sweetalert2';
import { PTLActividadModel } from 'src/app/theme/shared/_helpers/models/PTLActividades.model';
import { PTLAplicacionModel } from 'src/app/theme/shared/_helpers/models/PTLAplicacion.model';
import { PTLModuloAP } from 'src/app/theme/shared/_helpers/models/PTLModuloAP.model';
import { PTLSuiteAPModel } from 'src/app/theme/shared/_helpers/models/PTLSuiteAP.model';
import { PtltiposActividadService } from 'src/app/theme/shared/service/ptltipos-actividad.service';
import { PTLTipoActividadModel } from 'src/app/theme/shared/_helpers/models/PTLTipoActividad.model';
// import { BaseSessionModel } from 'src/app/theme/shared/_helpers/models/BaseSession.model';
// import { PTLLogActividadAPModel } from 'src/app/theme/shared/_helpers/models/PTLlogActividadAP.model';

@Component({
    selector: 'app-gestiion-actividad',
    standalone: true,
    imports: [CommonModule, SharedModule, TranslateModule, NavBarComponent, NavContentComponent, TextEditorComponent],
    templateUrl: './gestiion-actividad.component.html',
    styleUrl: './gestiion-actividad.component.scss'
})
export class GestiionActividadComponent implements OnInit, OnDestroy {
    @Output() toggleSidebar = new EventEmitter<void>();
    FormRegistro: PTLActividadModel = new PTLActividadModel();
    logActividad: PTLLogActividadAPModel = new PTLLogActividadAPModel();
    menuItems$!: Observable<NavigationItem[]>;
    gradientConfig: any;
    navCollapsed: boolean = false;
    navCollapsedMob: boolean = false;
    windowWidth: number = 0;
    selectedFile: File | null = null;
    previewUrl: string | ArrayBuffer | null = null;
    userPhotoUrl: string = '';
    fileName: string | null = null;
    selectedFileUrl: string | null = null;

    form: undefined;
    isSubmit: boolean = false;
    modoEdicion: boolean = false;
    codeActividad = uuidv4();
    tipoEditorTexto = 'basica';
    lockScreenSubscription: Subscription | undefined;
    isLocked: boolean = false;
    lockMessage: string = '';
    registrosSub?: Subscription

    subscriptions = new Subscription();
    tiposActividad: PTLTipoActividadModel[] = [];
    aplicaciones: PTLAplicacionModel[] = [];
    suites: PTLSuiteAPModel[] = [];
    suitesFiltro: PTLSuiteAPModel[] = [];
    modulos: PTLModuloAP[] = [];
    modulosPadre: PTLModuloAP[] = [];
    modulosFiltro: PTLModuloAP[] = [];

    constructor(
        private router: Router,
        private route: ActivatedRoute,
        private translate: TranslateService,
        private _navigationService: NavigationService,
        private _localStorageService: LocalStorageService,
        private _logActividadesService: PtllogActividadesService,
        private _actividadesService: PtlActividadesService,
        private _aplicacionesService: PtlAplicacionesService,
        private _suitesService: PtlSuitesAPService,
        private _modulosService: PtlmodulosApService,
        private _tiposActividadService: PtltiposActividadService,
        private _swalService: SwalAlertService,
        private _translate: TranslateService,
        private _uploadService: UploadFilesService
    ) {
        this.isSubmit = false;
        GradientConfig.header_fixed_layout = true;
        this.gradientConfig = GradientConfig;
        this.navCollapsed = this.windowWidth >= 992 ? GradientConfig.isCollapse_menu : false;
        this.navCollapsedMob = false;
        const registroId = this._localStorageService.getObject<string>('regId') || 'nuevo'
        if (registroId !== 'nuevo') {
            this.modoEdicion = true;
            console.log('consultar registro', registroId);
            this._actividadesService.getRegistroById(registroId).subscribe({
                next: (resp: any) => {
                    console.log('respuesta load', resp);

                    this.FormRegistro = resp.actividad;
                    this.suitesFiltro = this.suites.filter(x => x.codigoAplicacion == resp.actividad.codigoAplicacion)
                    this.modulosPadre = this.modulos.filter(x => x.codigoPadre != '0')
                    this.modulosFiltro = this.modulosPadre.filter(x => x.codigoSuite == resp.actividad.codigoSuite)

                    this.codeActividad = resp.actividad.codigoActividad;
                },
                error: () => {
                    this._swalService.getAlertConfirmError('No se pudo obtener la Aplicación')
                }
            });
        }
    }

    ngOnInit() {
        this._navigationService.getNavigationItems();
        this.consultarTiposActividad();
        this.menuItems$ = this._navigationService.menuItems$;
        this.aplicaciones = this._aplicacionesService.getBAplicacionesActuales();
        this.suites = this._suitesService.getSuitesActuales();
        this.modulos = this._modulosService.getModulosActuales();
        this.lockScreenSubscription = this._navigationService.lockScreenEvent$.subscribe({
            next: (message: string) => {
                this._localStorageService.setFormRegistro(this.FormRegistro);
                this.isLocked = true;
                this.lockMessage = message;
            },
            error: (err) => console.error('Error al suscribirse al evento de bloqueo:', err)
        });
        const form = this._localStorageService.getFormRegistro();
        if (form != undefined) {
            this.FormRegistro = form;
            this._localStorageService.removeFormRegistro();
        }
        if (this.modoEdicion == false) {
            this.FormRegistro.codigoActividad = uuidv4();
            this.FormRegistro.codigoAplicacion = '';
            this.FormRegistro.codigoSuite = '';
            this.FormRegistro.codigoModulo = '';
            this.FormRegistro.codigoTipoActividad = '';
            console.log('FormRegistro loading', this.FormRegistro);
        }
        console.log('Inicial formregistro', this.FormRegistro);
    }

    ngOnDestroy(): void {
        this.subscriptions.unsubscribe();
    }

    consultarTiposActividad() {
        this.registrosSub = this._tiposActividadService
            .getRegistros()
            .pipe(
                tap((resp: any) => {
                    if (resp.ok) {
                        this.tiposActividad = resp.tiposActividades
                        console.log('Todos las tiposActividad', this.tiposActividad)
                        return
                    }
                }),
                catchError(err => {
                    console.log('Ha ocurrido un error', err)
                    return of(null)
                })
            )
            .subscribe()
    }

    actualizarDescripcionVersion(nuevoContenido: string): void {
        this.FormRegistro.descripcion = nuevoContenido;
        console.log('Descripción de versión actualizada:', this.FormRegistro.descripcion);
        // if (this.validationForm && this.isSubmit) {
        // }
    }

    onAplicacionchangeClick(evento: any) {
        if (evento.target.value != '') {
            this.suitesFiltro = this.suites.filter(x => x.codigoAplicacion == evento.target.value)
        } else {
            this.suitesFiltro = [];
            this.modulosFiltro = [];
        }
    }

    onSuiteChangeClick(evento: any) {
        this.modulosPadre = this.modulos.filter(x => x.codigoPadre != '0')
        if (evento.target.value != '') {
            this.modulosFiltro = this.modulosPadre.filter(x => x.codigoSuite == evento.target.value)
        } else {
            this.modulosFiltro = [];
        }
    }

    onModuloChangeClick(evento: any) {
        console.log('evento', evento);
    }

    btnGestionarActividadClick(form: any) {
        // this.isSubmit = true;
        this.isSubmit = true;
        if (!form.valid) return;
        this.FormRegistro = form.value as PTLActividadModel
        const registroData = form.value as PTLActividadModel;
        registroData.codigoUsuarioCreacion = this._localStorageService.getUsuarioLocalStorage().codigoUsuario;
        registroData.fechaCreacion = new Date().toISOString();

        if (this.modoEdicion) {
            registroData.codigoUsuarioModificacion = this._localStorageService.getUsuarioLocalStorage().codigoUsuario;
            registroData.fechaModificacion = new Date().toISOString();
            console.log('modificar registro', registroData);

            this._actividadesService.putModificarRegistro(registroData).subscribe({
                next: (resp: any) => {
                    console.log('respuesta', resp);

                    if (resp.ok) {
                        const logData = {
                            codigoTipoLog: '',
                            codigoRespuesta: '201',
                            descripcionLog: this.translate.instant('ACTIVIDADES.UPDATESUCCSESSFULLY')
                        };
                        this._logActividadesService.postCrearRegistro(logData).subscribe(() => console.log('log creado exitosamente'));
                        this._swalService.getAlertSuccess(this.translate.instant('ACTIVIDADES.UPDATESUCCSESSFULLY'));
                        form.resetForm();
                        this.router.navigate(['/actividades/actividades']);
                    }
                },
                error: (err: any) => {
                    console.error(err);
                    const logData = {
                        codigoTipoLog: '',
                        codigoRespuesta: '501',
                        descripcionLog: this.translate.instant('ACTIVIDADES.UPDATEERROR')
                    };
                    this._logActividadesService.postCrearRegistro(logData).subscribe(() => console.log('log creado exitosamente'));
                    this._swalService.getAlertError('No se pudo actualizar la Actividad');
                }
            });
        } else {
            form.actividadId = 0;
            registroData.codigoActividad = uuidv4();
            console.log('crear registro', registroData);

            this._actividadesService.postCrearRegistro(registroData).subscribe({
                next: (resp: any) => {
                    console.log('resp', resp);
                    if (resp.ok) {
                        const logData = {
                            codigoTipoLog: '',
                            codigoRespuesta: '201',
                            descripcionLog: this.translate.instant('ACTIVIDADES.ELIMINAREXITOSA')
                        };
                        this._logActividadesService.postCrearRegistro(logData).subscribe(() => console.log('log creado exitosamente'));
                        this._swalService.getAlertSuccess(this.translate.instant('ACTIVIDADES.CREATESUCCESSFULLY'));
                        form.resetForm();
                        this.router.navigate(['/actividades/actividades']);
                    }
                },
                error: (err: any) => {
                    console.error(err);
                    const logData = {
                        codigoTipoLog: '',
                        codigoRespuesta: '500',
                        descripcionLog: this.translate.instant('ACTIVIDADES.CREATEERROR')
                    };
                    this._logActividadesService.postCrearRegistro(logData).subscribe(() => console.log('log creado exitosamente'));
                    this._swalService.getAlertError('No se pudo crear la Actividad');
                }
            });
        }
    }

    btnRegresarClick() {
        this.router.navigate(['/actividades/actividades']);
    }

    navMobClick() {
        if (this.windowWidth < 992) {
            if (this.navCollapsedMob && !document.querySelector('app-navigation.pcoded-navbar')?.classList.contains('mob-open')) {
                this.navCollapsedMob = !this.navCollapsedMob;
                setTimeout(() => {
                    this.navCollapsedMob = !this.navCollapsedMob;
                }, 100);
            } else {
                this.navCollapsedMob = !this.navCollapsedMob;
            }
        }
    }

    toggleNav(): void {
        this.toggleSidebar.emit();
    }
}
