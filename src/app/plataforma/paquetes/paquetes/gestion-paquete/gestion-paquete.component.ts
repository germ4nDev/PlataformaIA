/* eslint-disable @typescript-eslint/no-explicit-any */
import { Component, EventEmitter, Output, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Observable, Subscription, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { v4 as uuidv4 } from 'uuid';

import { GradientConfig } from 'src/app/app-config';
import { SharedModule } from 'src/app/theme/shared/shared.module';

// Componentes QPLUS
import { NavBarComponent } from 'src/app/theme/layout/admin/nav-bar/nav-bar.component';
import { NavContentComponent } from 'src/app/theme/layout/admin/navigation/nav-content/nav-content.component';
import { TextEditorComponent } from 'src/app/theme/shared/components/text-editor/text-editor.component';

// Servicios y Modelos
import { NavigationItem } from 'src/app/theme/shared/_helpers/models/Navigation.model';
import {
    PtllogActividadesService,
    SwalAlertService,
    LocalStorageService,
    UploadFilesService,
    NavigationService,
    PTLPaquetesService,
    PtlAplicacionesService
} from 'src/app/theme/shared/service';
import { LayoutInitializerService } from 'src/app/theme/shared/service/layout-initializer.service';

@Component({
    selector: 'app-gestion-paquete',
    standalone: true,
    imports: [
        CommonModule,
        SharedModule,
        TranslateModule,
        NavBarComponent,
        NavContentComponent,
        TextEditorComponent,
        ReactiveFormsModule
    ],
    templateUrl: './gestion-paquete.component.html',
    styleUrl: './gestion-paquete.component.scss'
})
export class GestionPaqueteComponent implements OnInit, OnDestroy {
    @Output() toggleSidebar = new EventEmitter<void>();

    // 🟢 1. Formulario Reactivo
    formularioRegistro!: FormGroup;

    menuItems$!: Observable<NavigationItem[]>;
    gradientConfig: any;
    navCollapsed: boolean = false;
    windowWidth: number = 0;

    // 🟢 2. Controladores de Estado UX
    isSubmit: boolean = false;
    isSaving: boolean = false;
    modoEdicion: boolean = false;
    paqueteId: string = '';

    // Manejo de Imágenes
    selectedFileImagenUrl: string | ArrayBuffer | null = null;
    selectedFileIconoUrl: string | ArrayBuffer | null = null;

    lockScreenSubscription: Subscription | undefined;
    isLocked: boolean = false;
    lockMessage: string = '';
    suscriptor: string = '';
    tipoEditorTexto: string = 'basica';

    constructor(
        private router: Router,
        private route: ActivatedRoute,
        private translate: TranslateService,
        private fb: FormBuilder,
        private _registrosService: PTLPaquetesService,
        private _layoutInitializer: LayoutInitializerService,
        private _logActividadesService: PtllogActividadesService,
        private _swalAlertService: SwalAlertService,
        private _localStorageService: LocalStorageService,
        private _uploadService: UploadFilesService,
        private _navigationService: NavigationService
    ) {
        GradientConfig.header_fixed_layout = true;
        this.gradientConfig = GradientConfig;
        this.navCollapsed = this.windowWidth >= 992 ? GradientConfig.isCollapse_menu : false;
        this.suscriptor = this._localStorageService.getSuscriptorPlataformaLocalStorage();

        this.inicializarFormulario();

        // Recuperamos el ID guardado por el botón 'Nuevo' o 'Modificar'
        this.paqueteId = this._localStorageService.getObject<string>('regId') || 'nuevo';
        this.modoEdicion = this.paqueteId !== 'nuevo';

        if (this.modoEdicion) {
            this.cargarDatosEdicion();
        } else {
            // Inicializar valores para un nuevo paquete
            this.formularioRegistro.patchValue({
                codigoPaquete: uuidv4(),
                imagenPaquete: 'no-image.png',
                iconoPaquete: 'no-image.png'
            });
        }
    }

    get f() { return this.formularioRegistro.controls; }

    inicializarFormulario() {
        this.formularioRegistro = this.fb.group({
            codigoPaquete: ['', Validators.required],
            nombrePaquete: ['', [Validators.required, Validators.maxLength(150)]],
            descripcionPaquete: ['', Validators.required],
            acuerdoLicencia: ['', Validators.required],
            estadoPaquete: [true, Validators.required],
            imagenPaquete: [''],
            iconoPaquete: ['']
        });
    }

    ngOnInit() {
        this._layoutInitializer.applyLayout();
        this._navigationService.getNavigationItems();
        this.menuItems$ = this._navigationService.menuItems$;

        this.lockScreenSubscription = this._navigationService.lockScreenEvent$.subscribe({
            next: (message: string) => {
                this._localStorageService.setFormRegistro(this.formularioRegistro.value);
                this.isLocked = true;
                this.lockMessage = message;
            }
        });

        const savedForm = this._localStorageService.getFormRegistro();
        if (savedForm) {
            this.formularioRegistro.patchValue(savedForm);
            this._localStorageService.removeFormRegistro();
        }
    }

    ngOnDestroy() {
        if (this.lockScreenSubscription) {
            this.lockScreenSubscription.unsubscribe();
        }
    }

    cargarDatosEdicion() {
        this._registrosService.getRegistroById(this.paqueteId).subscribe({
            next: (resp: any) => {
                if (resp.paquete) {
                    this.formularioRegistro.patchValue(resp.paquete);

                    // Cargar previsualización de imágenes si existen
                    if (resp.paquete.imagenPaquete && resp.paquete.imagenPaquete !== 'no-image.png') {
                        this.selectedFileImagenUrl = this._uploadService.getFilePath('paquetes', 'paquetes', resp.paquete.imagenPaquete);
                    }
                    if (resp.paquete.iconoPaquete && resp.paquete.iconoPaquete !== 'no-image.png') {
                        this.selectedFileIconoUrl = this._uploadService.getFilePath('paquetes', 'paquetes', resp.paquete.iconoPaquete);
                    }
                }
            },
            error: () => this.manejarError('No se pudo obtener la información del paquete', 'PLATAFORMA.ERROR')
        });
    }

    actualizarDescripcionPaquete(htmlContent: string) {
        this.formularioRegistro.get('descripcionPaquete')?.setValue(htmlContent);
        this.formularioRegistro.get('descripcionPaquete')?.markAsDirty();
    }

    actualizarAcuerdoLicencia(htmlContent: string) {
        this.formularioRegistro.get('acuerdoLicencia')?.setValue(htmlContent);
        this.formularioRegistro.get('acuerdoLicencia')?.markAsDirty();
    }

    onFileSelectedClick(event: any, tipo: 'imagen' | 'icono') {
        const file: File = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e: any) => {
                if (tipo === 'imagen') {
                    this.selectedFileImagenUrl = e.target.result;
                    // Aquí iría la llamada a tu _uploadService real si lo guardas al vuelo
                    // this.formularioRegistro.patchValue({ imagenPaquete: path.nombreArchivo });
                } else {
                    this.selectedFileIconoUrl = e.target.result;
                    // this.formularioRegistro.patchValue({ iconoPaquete: path.nombreArchivo });
                }
            };
            reader.readAsDataURL(file);
        }
    }

    btnGestionarRegistroClick() {
        this.isSubmit = true;

        if (this.formularioRegistro.invalid) {
            this._swalAlertService.getAlertError(this.translate.instant('PLATAFORMA.FORMULARIOINVALIDO'));
            return;
        }

        this.isSaving = true;
        const formValues = this.formularioRegistro.getRawValue();

        const usuarioActual = this._localStorageService.getUsuarioLocalStorage()?.codigoUsuario || '';

        const dataGuardar = {
            ...formValues,
            codigoUsuarioModificacion: this.modoEdicion ? usuarioActual : '',
            fechaModificacion: this.modoEdicion ? new Date().toISOString() : '',
            codigoUsuarioCreacion: !this.modoEdicion ? usuarioActual : undefined,
            fechaCreacion: !this.modoEdicion ? new Date().toISOString() : undefined,
            colorPaquete: '' // Mantener por retrocompatibilidad con BD si aplica
        };

        if (!this.modoEdicion) {
            this._registrosService.postCrearRegistro(dataGuardar).subscribe({
                next: (resp: any) => this.manejarExito(resp, 'PLATAFORMA.INSERTAR'),
                error: (err: any) => this.manejarError(err, 'PLATAFORMA.NOINSERTO')
            });
        } else {
            this._registrosService.putModificarRegistro(dataGuardar).subscribe({
                next: (resp: any) => this.manejarExito(resp, 'PLATAFORMA.MODIFICAR'),
                error: (err: any) => this.manejarError(err, 'PLATAFORMA.NOMODIFICO')
            });
        }
    }

    private manejarExito(resp: any, mensajeTra: string) {
        this.isSaving = false;
        if (resp.ok) {
            const logData = { codigoTipoLog: '', codigoRespuesta: '201', descripcionLog: this.translate.instant(mensajeTra) };
            this._logActividadesService.postCrearRegistro(logData).subscribe();

            this._swalAlertService.getAlertConfirmSuccess(resp.mensaje || this.translate.instant(mensajeTra));
            this.btnRegresarClick();
        } else {
            // Manejo si el backend devuelve 200 pero con ok: false
            this.manejarError(resp, 'PLATAFORMA.NOMODIFICO');
        }
    }

    private manejarError(err: any, mensajeTra: string) {
        this.isSaving = false;
        console.error(err);

        const logData = { codigoTipoLog: '', codigoRespuesta: '501', descripcionLog: this.translate.instant(mensajeTra) };
        this._logActividadesService.postCrearRegistro(logData).subscribe();

        this._swalAlertService.getAlertError(err.error?.msg || err.message || this.translate.instant(mensajeTra));
    }

    btnRegresarClick() {
        this.router.navigate(['/aplicaciones/paquetes']);
    }

    toggleNav(): void {
        this.toggleSidebar.emit();
    }
}
