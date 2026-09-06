/* eslint-disable @angular-eslint/use-lifecycle-interface */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { CommonModule } from '@angular/common';
import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { TextEditorComponent } from 'src/app/theme/shared/components/text-editor/text-editor.component';
import { Observable, Subscription } from 'rxjs';
import {
    LocalStorageService,
    PTLHistorialFacturacionService,
    PtllogActividadesService,
    PTLPaquetesSCService,
    PTLPaquetesService,
    PtlusuariosScService,
    PTLUsuariosService,
    SwalAlertService,
    UploadFilesService
} from 'src/app/theme/shared/service';
import { TranslateService } from '@ngx-translate/core';
import { NavigationItem } from 'src/app/theme/shared/_helpers/models/Navigation.model';
import { NarikCustomValidatorsModule } from '@narik/custom-validators';
import { PTLSuscriptorModel } from 'src/app/theme/shared/_helpers/models/PTLSuscriptor.model';
import { PTLSuscriptoresService } from 'src/app/theme/shared/service/ptlsuscriptores.service';
import { SharedModule } from 'src/app/theme/shared/shared.module';
import { NavBarComponent } from 'src/app/theme/layout/admin/nav-bar/nav-bar.component';
import { NavContentComponent } from 'src/app/theme/layout/admin/navigation/nav-content/nav-content.component';
import { NavigationService } from 'src/app/theme/shared/service/navigation.service';
import { v4 as uuidv4 } from 'uuid';
import Swal from 'sweetalert2';
import { PTLUsuarioSCModel } from 'src/app/theme/shared/_helpers/models/PTLUsuarioSC.model';
import { PTLUsuarioModel } from 'src/app/theme/shared/_helpers/models/PTLUsuario.model';
import log from 'video.js/dist/types/utils/log';
import { PTLPaqueteModel } from 'src/app/theme/shared/_helpers/models/PTLPaquete.model';
import { PTLPaquetesSCModel } from 'src/app/theme/shared/_helpers/models/PTLPaquetesSC.model';
import { PTLHistorialFacturacionModel } from 'src/app/theme/shared/_helpers/models/PTLHistorialFacturacion.model';
import { PTLTiposPaqueteService } from '../../../../theme/shared/service/ptltipos-paquete.service';
import { PTLTipoPaqueteModel } from 'src/app/theme/shared/_helpers/models/PTLTiposPaquete.model';
import { PTLTiposPagoService } from 'src/app/theme/shared/service/ptltipos-pago.service';
import { PTLTipoPagoModel } from 'src/app/theme/shared/_helpers/models/PTLTiposPago.model';

@Component({
    selector: 'app-gestion-suscriptor',
    standalone: true,
    imports: [CommonModule, SharedModule, NarikCustomValidatorsModule, NavBarComponent, NavContentComponent, TextEditorComponent],
    templateUrl: './gestion-suscriptor.component.html',
    styleUrl: './gestion-suscriptor.component.scss'
})
export class GestionSuscriptorComponent implements OnInit {
    // private props
    @Output() toggleSidebar = new EventEmitter<void>();
    FormRegistro: PTLSuscriptorModel = new PTLSuscriptorModel();
    dataSuscriptor: PTLSuscriptorModel = new PTLSuscriptorModel();
    classList!: { toggle: (arg0: string) => void };
    menuItems!: Observable<NavigationItem[]>;
    gradientConfig: any;
    navCollapsed: boolean = false;
    navCollapsedMob: boolean = false;
    windowWidth: number = 0;
    form: undefined;
    isSubmit: boolean;
    modoEdicion: boolean = false;
    isClaveActual: boolean = true;
    verificarHabilitado: boolean = true;
    isClaveValida: boolean = false;
    codigoSusucriptor = uuidv4();
    tipoEditorTexto = 'basica';
    lockScreenSubscription: Subscription | undefined;
    isLocked: boolean = false;
    usuarios: PTLUsuarioModel[] = [];
    suscriptores: PTLSuscriptorModel[] = [];
    paquetes: PTLPaqueteModel[] = [];
    tiposPaquete: PTLTipoPaqueteModel[] = [];
    tiposPago: PTLTipoPagoModel[] = [];
    paquetesSC: PTLPaquetesSCModel[] = [];
    historiales: PTLHistorialFacturacionModel[] = [];
    lockMessage: string = '';
    suscriptor: string = '';

    selectedFile: File | null = null;
    previewUrl: string | ArrayBuffer | null = null;
    userPhotoUrl: string = '';
    fileName: string | null = null;
    selectedFileUrl: string | null = null;

    constructor(
        private router: Router,
        private route: ActivatedRoute,
        private translate: TranslateService,
        private _suscriptoresService: PTLSuscriptoresService,
        private _navigationService: NavigationService,
        private _localStorageService: LocalStorageService,
        private _uploadService: UploadFilesService,
        private _usuariosService: PTLUsuariosService,
        private _usuariosSCService: PtlusuariosScService,
        private _paquetesService: PTLPaquetesService,
        private _tiposPaqueteService: PTLTiposPaqueteService,
        private _tiposPagoService: PTLTiposPagoService,
        private _paquetesSCService: PTLPaquetesSCService,
        private _historialFacturacionService: PTLHistorialFacturacionService,
        private _logActividadesService: PtllogActividadesService,
        private _swalAlertService: SwalAlertService
    ) {
        this.isSubmit = false;
        this.suscriptor = this._localStorageService.getSuscriptorPlataformaLocalStorage()
        const id = this._localStorageService.getObject<string>('regId') || ''
        this.suscriptores = this._suscriptoresService.getSuscriptoresActuales();
        if (id != 'nuevo') {
            this.modoEdicion = true;
            this.verificarHabilitado = false;
            const susc = this.suscriptores.find(x => x.codigoSuscriptor == id) || new PTLSuscriptorModel();
            this.FormRegistro = susc;
            this.dataSuscriptor = susc;

            const pqtsSuscriptor = this.paquetesSC.filter(x => x.codigoSuscriptor == this.dataSuscriptor.codigoSuscriptor);

            this.paquetes.forEach(paqueteGlobal => {
                const tieneElPaquete = pqtsSuscriptor.some(miPqt => miPqt.codigoPaquete === paqueteGlobal.codigoPaquete);
                paqueteGlobal.checked = tieneElPaquete;
            });

            this.paquetesSC = pqtsSuscriptor;
            this.userPhotoUrl = susc.logoSuscriptor || '';
            this.selectedFileUrl = this._uploadService.getFilePath(this.suscriptor, 'suscriptores', susc.logoSuscriptor || '')

            console.log('respuesta componente', this.FormRegistro);
            console.log('paquetes SC del suscriptor', pqtsSuscriptor);
            console.log('paquetes globales listos para HTML', this.paquetes);
        } else {
            this.verificarHabilitado = true;
            this.modoEdicion = false;
            this.FormRegistro.codigoSuscriptor = uuidv4();
            this.paquetes.forEach(p => p.checked = false);
        }
        this.route.queryParams.subscribe((params) => {
            const id = params['regId'];
            console.log('me llena el Id', id);

        });
    }

    get clavesCoinciden(): boolean {
        const clave = this.FormRegistro.claveNew;
        const confirmacion = this.FormRegistro.claveConfirm;

        // Si ambos están vacíos, no mostramos error de "no coinciden"
        if (!clave && !confirmacion) {
            return true;
        }

        return clave === confirmacion;
    }

    ngOnInit() {
        this._navigationService.getNavigationItems();
        this.menuItems = this._navigationService.menuItems$;
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
        this.usuarios = this._usuariosService.getUsuariosActuales();
        this.paquetes = this._paquetesService.getPaquetesActuales();
        this.paquetesSC = this._paquetesSCService.getPaquetesSCActuales();
        this.historiales = this._historialFacturacionService.getHistorialesActuales();
        this.tiposPaquete = this._tiposPaqueteService.getTiposPaqueteActuales();
        this.tiposPago = this._tiposPagoService.getTiposPagoActuales();
        console.log('tenemos todos los paquetes', this.paquetes);
        const togglePassword = document.querySelector('#togglePassword');
        const password = document.querySelector('#claveAdministrador');
        togglePassword?.addEventListener('click', () => {
            const type = password?.getAttribute('type') === 'password' ? 'text' : 'password';
            password?.setAttribute('type', type);
            this.classList.toggle('icon-eye-off');
        });
        if (!this.modoEdicion) {
            console.log('modo edicion', this.modoEdicion);
            this.FormRegistro = {
                codigoSuscriptor: uuidv4(),
                nombreSuscriptor: '',
                identificacionSuscriptor: '',
                direccionSuscriptor: '',
                telefonoContacto: '',
                numeroEmpresas: 0,
                numeroUsuarios: 0,
                usuarioAdministrador: '',
                descripcionSuscriptor: '',
                paquete: '',
                envioCorreosSuscriptor: false,
                envioMensajesSuscriptor: false,
                envioPublicidadSuscriptor: false,
                estadoSuscriptor: false
            };
            this.isClaveActual = false;
            console.log('FormRegistro', this.FormRegistro);
        }
    }

    actualizarDescripcionSuscriptor(nuevoContenido: string): void {
        this.FormRegistro.descripcionSuscriptor = nuevoContenido;
        console.log('Descripción de versión actualizada:', this.FormRegistro.descripcionSuscriptor);
        // if (this.validationForm && this.isSubmit) {
        // }
    }

    validarClaveActual(claveActual: any) {
        const codigo = this.FormRegistro.codigoAdministrador || '';
        this._usuariosService.verificarClaveActual(codigo, claveActual).subscribe((data: any) => {
            if (data.ok == true) {
                if (this.FormRegistro.codigoAdministrador === data.suscriptor.codigoAdministrador) {
                    this.isClaveActual = false;
                    this.isClaveValida = true;
                }
            } else {
                this.FormRegistro.claveNew = '';
                this.FormRegistro.claveConfirm = '';
                this.isClaveValida = false;
                this.isClaveActual = true;
                this._swalAlertService.getAlertError(this.translate.instant('PLATAFORMA.PASSWORDNOTMATCH'));
            }
        });
    }

    onPaquetechangeClick(event: any) {
        console.log('Paquete seeleccionado', event);
        const paquete = this.paquetes.filter(x => x.codigoPaquete == event.target.value)[0];
        console.log('datos del Paquete seeleccionado', paquete);
    }

    btnAsociarTodosClick() {
        this.paquetesSC.forEach(paque => {
            const indx = this.paquetesSC.findIndex(x => x.codigoPaquete == paque.codigoPaquete);
            if (indx == -1) {
                this.paquetesSC.push(paque);
            }
        });
    }

    onPaqueteCheckChange(event: any, paque: PTLPaqueteModel) {
        // console.log('evento', event.target.checked);
        // console.log('paque', paque);
        // const checked = event.target.checked;
        // if (checked) {
        //     this.paquetesSC.push(paque);
        // } else {
        //     const indx = this.paquetesSC.findIndex(x => x.codigoPaquete == paque.codigoPaquete);
        //     this.paquetesSC.splice(indx, 1);
        // }
        // console.log('paquetes del suscriptor', this.paquetesSC);
    }

    onFileSelectedClick(event: any) {
        const file: File = event.target.files[0];
        this.FormRegistro.logoSuscriptor = '';
        const objUpload = {
            susc: this.suscriptor,
            tipo: 'suscriptores'
        };
        if (file) {
            const reader = new FileReader();
            reader.onload = (e: any) => {
                this.selectedFileUrl = e.target.result;
            };
            reader.readAsDataURL(file);
            this._uploadService.uploadUserPhoto(file, objUpload).subscribe({
                next: (path: any) => {
                    this.userPhotoUrl = path.data.respuesta.fileName;
                    this.FormRegistro.logoSuscriptor = path.data.respuesta.fileName;
                },
                error: () => {
                    this._swalAlertService.getAlertError(this.translate.instant('PLATAFORMA.UPLOADPHOTOERROR'));
                }
            });
        } else {
            this.selectedFileUrl = null;
            this.userPhotoUrl = '';
        }
    }

    btnGestionarRegistroClick(form: any) {
        this.isSubmit = true;
        if (!form.valid) return;
        this.FormRegistro = form.value as PTLSuscriptorModel
        const registroData = new PTLSuscriptorModel() as PTLSuscriptorModel
        registroData.identificacionSuscriptor = this.FormRegistro.identificacionSuscriptor
        registroData.nombreSuscriptor = this.FormRegistro.nombreSuscriptor
        registroData.correoSuscriptor = this.FormRegistro.correoSuscriptor
        registroData.direccionSuscriptor = this.FormRegistro.direccionSuscriptor
        registroData.telefonoContacto = this.FormRegistro.telefonoContacto
        registroData.logoSuscriptor = this.userPhotoUrl != '' ? this.userPhotoUrl : 'no-imagen.png'
        registroData.numeroEmpresas = this.FormRegistro.numeroEmpresas
        registroData.numeroUsuarios = this.FormRegistro.numeroUsuarios
        registroData.codigoAdministrador = this.FormRegistro.codigoAdministrador || ''
        registroData.usuarioAdministrador = this.FormRegistro.usuarioAdministrador
        registroData.usuarioAdministrador = this.FormRegistro.usuarioAdministrador
        registroData.claveNew = this.FormRegistro.claveNew
        registroData.descripcionSuscriptor = this.FormRegistro.descripcionSuscriptor
        registroData.envioCorreosSuscriptor = this.FormRegistro.envioCorreosSuscriptor
        registroData.envioMensajesSuscriptor = this.FormRegistro.envioMensajesSuscriptor
        registroData.envioPublicidadSuscriptor = this.FormRegistro.envioPublicidadSuscriptor
        registroData.estadoSuscriptor = this.FormRegistro.estadoSuscriptor
        console.log('nueva suscriptor', registroData);

        //this.GestionarPaquetes();

        if (this.modoEdicion) {
            registroData.codigoSuscriptor = this.FormRegistro.codigoSuscriptor
            registroData.codigoUsuarioModificacion = this._localStorageService.getUsuarioLocalStorage().codigoUsuario
            registroData.fechaModificacion = new Date().toISOString()
            this._suscriptoresService.actualizarSuscriptor(registroData).subscribe({
                next: (resp: any) => {
                    if (resp.ok) {
                        this.GestionarUsuario(registroData);
                        this._swalAlertService.getAlertSuccess(this.translate.instant('SUSCRIPTORES.UPDATESUCCSESSFULLY'))
                        form.resetForm()
                    }
                },
                error: (err: any) => {
                    console.error(err)
                    const logData = {
                        codigoTipoLog: '',
                        codigoRespuesta: '501',
                        descripcionLog: this.translate.instant('SUSCRIPTORES.CREATEERROR')
                    }
                    this._logActividadesService.postCrearRegistro(logData).subscribe(() => console.log('log creado exitosamente'))
                    this._swalAlertService.getAlertError('No se pudo actualizar el Suscriptor')
                }
            });
        } else {
            registroData.codigoSuscriptor = uuidv4()
            registroData.codigoUsuarioCreacion = this._localStorageService.getUsuarioLocalStorage().codigoUsuario || ''
            registroData.fechaCreacion = new Date().toISOString()
            this.dataSuscriptor = registroData;
            this._suscriptoresService.crearSuscriptor(registroData).subscribe({
                next: (resp: any) => {
                    if (resp.ok) {
                        this.GestionarUsuario(registroData);
                        this._swalAlertService.getAlertSuccess(this.translate.instant('SUSCRIPTORES.CREATESUCCSESSFULLY'))
                        form.resetForm()
                    }
                },
                error: (err) => {
                    const error = err.error?.msg || 'Error al validar datos'
                    const rutaTraduccion = `SUSCRIPTORES.CREATEERROR`;
                    this._swalAlertService.getAlertConfirmWarning(this.translate.instant(`rutaTraduccion ${error}`));
                }
            });
        }
    }

    private GestionarUsuario(rawData: any) {
        rawData.codigoUsuarioCreacion = this._localStorageService.getUsuarioLocalStorage().codigoUsuario || ''
        rawData.fechaCreacion = new Date().toISOString()
        const usuarioAdministrador: PTLUsuarioModel = {
            identificacionUsuario: rawData.identificacionSuscriptor,
            nombreUsuario: 'adm_' + rawData.nombreSuscriptor,
            correoUsuario: rawData.correoSuscriptor,
            userNameUsuario: rawData.usuarioAdministrador,
            claveUsuario: rawData.claveNew,
            descripcionUsuario: '',
            fotoUsuario: 'no-imagen.png',
            usuarioAdministrador: true,
            estadoUsuario: true,
            codigoUsuarioCreacion: rawData.codigoUsuarioCreacion,
            fechaCreacion: new Date().toISOString()
        };
        // console.log('usuario administrador', usuarioAdministrador);
        const indexExiste = this.usuarios.findIndex(x => x.userNameUsuario?.trim().toLocaleLowerCase() == rawData.usuarioAdministrador.trim().toLocaleLowerCase());
        console.log('existe usuario', indexExiste);
        if (indexExiste == -1) {
            usuarioAdministrador.codigoUsuario = uuidv4()
            this._usuariosService.postCrearUsuario(usuarioAdministrador).subscribe({
                next: (data: any) => {
                    console.log('usuario CREADO', data.usuario);
                    this.crearUsuarioSC(data.usuario)
                },
                error: (err) => {
                    const rutaTraduccion = `SUSCRIPTORES.GESTION.${err}`;
                }
            });
        } else {
            const usuario = this.usuarios[indexExiste];
            usuarioAdministrador.codigoUsuario = usuario.codigoUsuario,
                this._usuariosService.actualizarUsuario(usuarioAdministrador).subscribe({
                    next: (data: any) => this.crearUsuarioSC(usuario.codigoUsuario),
                    error: (err) => {
                        const rutaTraduccion = `SUSCRIPTORES.GESTION.${err}`;
                    }
                });
        }
    }

    private crearUsuarioSC(dataUsuario: any) {
        console.log('data usuario', dataUsuario);
        const codigoSusucriptor = this.dataSuscriptor.codigoSuscriptor || uuidv4()
        const usuarioSC: PTLUsuarioSCModel = {
            codigoUsuarioSC: uuidv4(),
            codigoUsuario: dataUsuario.codigoUsuario,
            codigoSuscriptor: codigoSusucriptor,
            estadoUsuarioSC: true,
            codigoUsuarioCreacion: this._localStorageService.getUsuarioLocalStorage().codigoUsuario,
            fechaCreacion: new Date().toISOString(),
            codigoUsuarioModificacion: '',
            fechaModificacion: ''
        };
        console.log('usuario suscriptor', usuarioSC);

        this._usuariosSCService.postCrearUsuario(usuarioSC).subscribe({
            next: () => {
                //this.GestionarPaquetes();
                this.finalizarRegistro(codigoSusucriptor)
            },
            error: (err) => {
                const error = err.error?.msg || 'Error al validar datos'
                console.log('Error: ', error);
            }
        });
    }

    private finalizarRegistro(codigoSuscriptor: string) {
        this._uploadService.createFolder(codigoSuscriptor).subscribe();
        this._swalAlertService.getAlertSuccess(this.translate.instant('PLATAFORMA.INSERTAR'));
        this.router.navigate(['/suscriptor/suscriptores']);
    }

    btnRegresarClick() {
        this.router.navigate(['/suscriptor/suscriptores']);
    }

    toggleNav(): void {
        this.toggleSidebar.emit();
    }
}
