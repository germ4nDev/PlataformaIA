/* eslint-disable @typescript-eslint/no-explicit-any */
import { Component, EventEmitter, Output, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Observable, Subscription } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';

import { GradientConfig } from 'src/app/app-config';
import { SharedModule } from 'src/app/theme/shared/shared.module';
import { NavBarComponent } from 'src/app/theme/layout/admin/nav-bar/nav-bar.component';
import { NavContentComponent } from 'src/app/theme/layout/admin/navigation/nav-content/nav-content.component';

// 🟢 Asegúrate de importar el componente IconPickerComponent
import { IconPickerComponent } from 'src/app/theme/shared/components/icon-picker/icon-picker.component';

import { NavigationItem } from 'src/app/theme/shared/_helpers/models/Navigation.model';
import { PTLTipoItemModel } from 'src/app/theme/shared/_helpers/models/PTLTipoItem.model';
import {
    PtllogActividadesService,
    SwalAlertService,
    LocalStorageService,
    NavigationService,
    PtltiposItemsService
} from 'src/app/theme/shared/service';
import { LayoutInitializerService } from 'src/app/theme/shared/service/layout-initializer.service';
import { TextEditorComponent } from 'src/app/theme/shared/components/text-editor/text-editor.component';

@Component({
    selector: 'app-gestion-tipo-item',
    standalone: true,
    imports: [
        CommonModule,
        SharedModule,
        TranslateModule,
        NavBarComponent,
        NavContentComponent,
        IconPickerComponent, // 👈 Inyectado
        ReactiveFormsModule,
        TextEditorComponent
    ],
    templateUrl: './gestion-tipo-item.component.html',
    styleUrl: './gestion-tipo-item.component.scss'
})
export class GestionTipoItemComponent implements OnInit, OnDestroy {
    @Output() toggleSidebar = new EventEmitter<void>();

    // Variables de UI
    formularioRegistro!: FormGroup;
    menuItems$!: Observable<NavigationItem[]>;
    tipoItem: PTLTipoItemModel = new PTLTipoItemModel()
    gradientConfig: any;
    navCollapsed: boolean = false;
    windowWidth: number = 0;

    // Estados
    isSubmit: boolean = false;
    isSaving: boolean = false;
    modoEdicion: boolean = false;
    registroId: string = '';

    // Seguridad
    lockScreenSubscription: Subscription | undefined;
    isLocked: boolean = false;

    constructor(
        private router: Router,
        private translate: TranslateService,
        private fb: FormBuilder,
        private _layoutInitializer: LayoutInitializerService,
        private _tiposItemService: PtltiposItemsService,
        private _logActividadesService: PtllogActividadesService,
        private _swalAlertService: SwalAlertService,
        private _localStorageService: LocalStorageService,
        private _navigationService: NavigationService
    ) {
        GradientConfig.header_fixed_layout = true;
        this.gradientConfig = GradientConfig;
        this.navCollapsed = this.windowWidth >= 992 ? GradientConfig.isCollapse_menu : false;

        this.inicializarFormulario();

        this.registroId = this._localStorageService.getObject<string>('regId') || 'nuevo';
        this.modoEdicion = this.registroId !== 'nuevo';
        if (this.modoEdicion) {
            this._tiposItemService.getRegistroById(this.registroId).subscribe({
                next: (resp: any) => {
                    if (resp.ok && resp.tipoItem) {
                        this.formularioRegistro.patchValue(resp.tipoItem);
                        this.tipoItem = resp.tipoItem;
                    }
                },
                error: () => {
                    this._swalAlertService.getAlertError('No se pudo obtener la categoría con ese código');
                    this.btnRegresarClick();
                }
            });
        }
    }

    get f() { return this.formularioRegistro.controls; }

    inicializarFormulario() {
        this.formularioRegistro = this.fb.group({
            codigoTipoItem: [uuidv4(), Validators.required],
            nombreTipo: ['', [Validators.required, Validators.maxLength(100)]],
            descripcionTipo: [''],
            iconoTipo: ['', Validators.required],
            estadoTipo: [true, Validators.required]
        });
    }

    ngOnInit() {
        this._layoutInitializer.applyLayout();
        this._navigationService.getNavigationItems();
        this.menuItems$ = this._navigationService.menuItems$;

        this.lockScreenSubscription = this._navigationService.lockScreenEvent$.subscribe({
            next: () => {
                this._localStorageService.setFormRegistro(this.formularioRegistro.value);
                this.isLocked = true;
            }
        });
        const savedForm = this._localStorageService.getFormRegistro();
        if (savedForm) {
            this.formularioRegistro.patchValue(savedForm);
            this._localStorageService.removeFormRegistro();
        }
    }

    ngOnDestroy() {
        if (this.lockScreenSubscription) this.lockScreenSubscription.unsubscribe();
    }

    btnGestionarRegistroClick() {
        this.isSubmit = true;

        if (this.formularioRegistro.invalid) {
            this._swalAlertService.getAlertError(this.translate.instant('PLATAFORMA.FORMULARIOINVALIDO'));
            return;
        }

        this.isSaving = true;
        const registroData = this.formularioRegistro.getRawValue() as PTLTipoItemModel;
        const usuarioActual = this._localStorageService.getUsuarioLocalStorage().codigoUsuario;

        if (this.modoEdicion) {
            registroData.codigoUsuarioCreacion = this.tipoItem.codigoUsuarioCreacion;
            registroData.fechaCreacion = this.tipoItem.fechaCreacion;
            registroData.codigoUsuarioModificacion = usuarioActual;
            registroData.fechaModificacion = new Date().toISOString();
            this._tiposItemService.putModificarRegistro(registroData).subscribe({
                next: (resp: any) => {
                    if (resp.ok) {
                        this.registrarLogYSalir('PLATAFORMA.MODIFICAR', '201');
                    } else {
                        this.manejarErrorGuardado(resp.mensaje);
                    }
                },
                error: (err: any) => this.manejarErrorGuardado(err.mensaje)
            });
        } else {
            registroData.codigoUsuarioCreacion = usuarioActual;
            registroData.fechaCreacion = new Date().toISOString();
            registroData.codigoUsuarioModificacion = '';
            registroData.fechaModificacion = '';
            this._tiposItemService.postCrearRegistro(registroData).subscribe({
                next: (resp: any) => {
                    if (resp.ok) {
                        this.registrarLogYSalir('PLATAFORMA.INSERTAR', '201');
                    } else {
                        this.manejarErrorGuardado(resp.mensaje);
                    }
                },
                error: (err: any) => this.manejarErrorGuardado(err.mensaje)
            });
        }
    }

    private registrarLogYSalir(mensajeTra: string, codigoResp: string) {
        this.isSaving = false;
        const logData = {
            codigoTipoLog: '',
            codigoRespuesta: codigoResp,
            descripcionLog: this.translate.instant(mensajeTra)
        };
        this._logActividadesService.postCrearRegistro(logData).subscribe();

        this._swalAlertService.getAlertConfirmSuccess(this.translate.instant(mensajeTra));
        this.btnRegresarClick();
    }

    private manejarErrorGuardado(mensaje: string) {
        this.isSaving = false;
        const msjCompleto = this.translate.instant('PLATAFORMA.NOINSERTO') + ' ' + (mensaje || '');

        const logData = {
            codigoTipoLog: '',
            codigoRespuesta: '501',
            descripcionLog: msjCompleto
        };
        this._logActividadesService.postCrearRegistro(logData).subscribe();
        this._swalAlertService.getAlertError(msjCompleto);
    }

    actualizarDescripcionValor(htmlContent: string) {
        this.formularioRegistro.get('descripcionTipo')?.setValue(htmlContent);
        this.formularioRegistro.get('descripcionTipo')?.markAsDirty();
    }

    btnRegresarClick() {
        this.router.navigate(['/paquetes/tipos-item']);
    }

    toggleNav(): void {
        this.toggleSidebar.emit();
    }
}
