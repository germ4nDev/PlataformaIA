/* eslint-disable @typescript-eslint/no-explicit-any */
import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Observable, Subscription } from 'rxjs';
import { GradientConfig } from 'src/app/app-config';
import { SharedModule } from 'src/app/theme/shared/shared.module';
import { v4 as uuidv4 } from 'uuid'
import { NavBarComponent } from 'src/app/theme/layout/admin/nav-bar/nav-bar.component';
import { NavContentComponent } from 'src/app/theme/layout/admin/navigation/nav-content/nav-content.component';
import { NavigationItem } from 'src/app/theme/shared/_helpers/models/Navigation.model';
import {
    PtllogActividadesService,
    SwalAlertService,
    LocalStorageService,
    NavigationService
} from 'src/app/theme/shared/service';
import { LayoutInitializerService } from 'src/app/theme/shared/service/layout-initializer.service';
import { PTLParametrosSistemaService } from 'src/app/theme/shared/service/ptlparametros-sistema.service';
import { TextEditorComponent } from 'src/app/theme/shared/components/text-editor/text-editor.component';

@Component({
    selector: 'app-gestion-parametro',
    standalone: true,
    imports: [
        CommonModule,
        SharedModule,
        TranslateModule,
        NavBarComponent,
        NavContentComponent,
        ReactiveFormsModule,
        TextEditorComponent
    ],
    templateUrl: './gestion-parametro.component.html',
    styleUrl: './gestion-parametro.component.scss'
})
export class GestionParametroComponent implements OnInit, OnDestroy {
    @Output() toggleSidebar = new EventEmitter<void>();

    formularioRegistro!: FormGroup;

    menuItems$!: Observable<NavigationItem[]>;
    gradientConfig: any;
    navCollapsed: boolean = false;
    windowWidth: number = 0;

    isSubmit: boolean = false;
    isSaving: boolean = false;

    modoEdicion: boolean = false;
    parametroId: string = '';
    tipoEditorTexto = 'basica'

    lockScreenSubscription: Subscription | undefined;
    isLocked: boolean = false;
    lockMessage: string = '';

    constructor(
        private router: Router,
        private route: ActivatedRoute,
        private translate: TranslateService,
        private fb: FormBuilder,
        private _registrosService: PTLParametrosSistemaService,
        private _layoutInitializer: LayoutInitializerService,
        private _logActividadesService: PtllogActividadesService,
        private _swalAlertService: SwalAlertService,
        private _localStorageService: LocalStorageService,
        private _navigationService: NavigationService
    ) {
        GradientConfig.header_fixed_layout = true;
        this.gradientConfig = GradientConfig;
        this.navCollapsed = this.windowWidth >= 992 ? GradientConfig.isCollapse_menu : false;

        this.inicializarFormulario();

        this.parametroId = this._localStorageService.getObject<string>('regId') || 'nuevo';
        this.modoEdicion = this.parametroId !== 'nuevo';

        if (this.modoEdicion) {
            this._registrosService.getParametroByCodigo(this.parametroId).subscribe({
                next: (resp: any) => {
                    if (resp.ok && resp.parametro) {
                        this.formularioRegistro.patchValue(resp.parametro);
                        this.formularioRegistro.get('llaveParametro')?.disable();
                    }
                },
                error: () => {
                    this._swalAlertService.getAlertConfirmError('No se pudo obtener el parámetro del sistema');
                }
            });
        }
    }

    get f() { return this.formularioRegistro.controls; }

    inicializarFormulario() {
        this.formularioRegistro = this.fb.group({
            llaveParametro: ['', [Validators.required, Validators.maxLength(200)]],
            nombreParametro: ['', [Validators.required, Validators.maxLength(100)]],
            valorParametro: ['', [Validators.required, Validators.maxLength(4000)]],
            tipoDato: ['', Validators.required],
            descripcionParametro: ['', Validators.maxLength(4000)],
            estadoParametro: [true, Validators.required]
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
        } else if (this.modoEdicion) {
            this.cargarDatosEdicion();
        }
    }

    cargarDatosEdicion() {
        this._registrosService.getParametroByCodigo(this.parametroId).subscribe({
            next: (resp: any) => {
                if (resp.ok && resp.parametro) {
                    this.formularioRegistro.patchValue(resp.parametro);
                    this.formularioRegistro.get('llaveParametro')?.disable();
                }
            },
            error: (err) => this.manejarError(err, 'Error al cargar el parámetro.')
        });
    }

    ngOnDestroy() {
        if (this.lockScreenSubscription) {
            this.lockScreenSubscription.unsubscribe();
        }
    }

    actualizarDescripcionRegistro(htmlContent: string) {
        this.formularioRegistro.get('descripcionParametro')?.setValue(htmlContent);
        this.formularioRegistro.get('descripcionParametro')?.markAsDirty();
    }

    btnGestionarRegistroClick() {
        this.isSubmit = true;

        if (this.formularioRegistro.invalid) {
            this._swalAlertService.getAlertError(this.translate.instant('PLATAFORMA.FORMULARIOINVALIDO'));
            return;
        }

        this.isSaving = true;

        const formValues = this.formularioRegistro.getRawValue();
        const codigoPar = formValues.codigoParametro ? formValues.codigoParametro : uuidv4()
        const dataGuardar = {
            codigoParametro: codigoPar,
            ...formValues,
            codigoUsuarioCreacion: this._localStorageService.getUsuarioLocalStorage()?.codigoUsuario || 'SISTEMA',
            fechaCreacion: new Date().toISOString()
        };

        if (!this.modoEdicion) {
            this._registrosService.crearParametro(dataGuardar).subscribe({
                next: (resp: any) => this.manejarExito(resp, 'PLATAFORMA.INSERTAR'),
                error: (err: any) => this.manejarError(err, 'PLATAFORMA.NOINSERTO')
            });
        } else {
            this._registrosService.actualizarParametro(this.parametroId, dataGuardar).subscribe({
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

            this._swalAlertService.getAlertConfirmSuccess(resp.msg || this.translate.instant(mensajeTra));
            this.btnRegresarClick();
        }
    }

    private manejarError(err: any, mensajeTra: string) {
        this.isSaving = false;
        console.error(err);

        const logData = { codigoTipoLog: '', codigoRespuesta: '501', descripcionLog: this.translate.instant(mensajeTra) };
        this._logActividadesService.postCrearRegistro(logData).subscribe();

        this._swalAlertService.getAlertError(err.error?.msg || this.translate.instant(mensajeTra));
    }

    btnRegresarClick() {
        this.router.navigate(['sistema/parametros']);
    }

    toggleNav(): void {
        this.toggleSidebar.emit();
    }
}
