/* eslint-disable @typescript-eslint/no-explicit-any */
import { Component, EventEmitter, Output, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Observable, Subscription } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';

import { GradientConfig } from 'src/app/app-config';
import { SharedModule } from 'src/app/theme/shared/shared.module';
import { NavBarComponent } from 'src/app/theme/layout/admin/nav-bar/nav-bar.component';
import { NavContentComponent } from 'src/app/theme/layout/admin/navigation/nav-content/nav-content.component';
import { TextEditorComponent } from 'src/app/theme/shared/components/text-editor/text-editor.component';

import { NavigationItem } from 'src/app/theme/shared/_helpers/models/Navigation.model';
import {
    PtllogActividadesService,
    SwalAlertService,
    LocalStorageService,
    NavigationService
} from 'src/app/theme/shared/service';
import { LayoutInitializerService } from 'src/app/theme/shared/service/layout-initializer.service';

// 🟢 ASUME QUE TIENES ESTOS SERVICIOS CREADOS, AJÚSTALOS A TUS NOMBRES REALES
// import { PTLItemsService } from 'src/app/theme/shared/service/ptl-items.service';
// import { PTLTiposItemService } from 'src/app/theme/shared/service/ptl-tipos-item.service';

@Component({
    selector: 'app-gestion-item',
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
    templateUrl: './gestion-item.component.html',
    styleUrl: './gestion-item.component.scss'
})
export class GestionItemComponent implements OnInit, OnDestroy {
    @Output() toggleSidebar = new EventEmitter<void>();

    // Variables de UI
    formularioRegistro!: FormGroup;
    menuItems$!: Observable<NavigationItem[]>;
    gradientConfig: any;
    navCollapsed: boolean = false;
    windowWidth: number = 0;

    // Estados
    isSubmit: boolean = false;
    isSaving: boolean = false;
    modoEdicion: boolean = false;
    registroId: string = '';

    // Datos Maestros
    tiposItem: any[] = []; // Se llenará con PTLTiposItem

    // Seguridad
    lockScreenSubscription: Subscription | undefined;
    isLocked: boolean = false;

    constructor(
        private router: Router,
        private translate: TranslateService,
        private fb: FormBuilder,
        private _layoutInitializer: LayoutInitializerService,
        private _logActividadesService: PtllogActividadesService,
        private _swalAlertService: SwalAlertService,
        private _localStorageService: LocalStorageService,
        private _navigationService: NavigationService,
        // private _itemsService: PTLItemsService,          // 👈 Descomenta esto con tu servicio real
        // private _tiposItemService: PTLTiposItemService   // 👈 Descomenta esto con tu servicio real
    ) {
        GradientConfig.header_fixed_layout = true;
        this.gradientConfig = GradientConfig;
        this.navCollapsed = this.windowWidth >= 992 ? GradientConfig.isCollapse_menu : false;

        this.inicializarFormulario();

        // 🟢 ID para edición
        this.registroId = this._localStorageService.getObject<string>('regId') || 'nuevo';
        this.modoEdicion = this.registroId !== 'nuevo';
    }

    get f() { return this.formularioRegistro.controls; }

    inicializarFormulario() {
        this.formularioRegistro = this.fb.group({
            codigoValor: [uuidv4(), Validators.required],
            tipoValorId: ['', Validators.required],
            nombreValor: ['', [Validators.required, Validators.maxLength(100)]],
            valorUnitario: [0, [Validators.required, Validators.min(0)]],
            costoValor: [0, [Validators.required, Validators.min(0)]],
            descripcionValor: [''], // Opcional, con HTML
            estadoValor: [true, Validators.required]
        });
    }

    ngOnInit() {
        this._layoutInitializer.applyLayout();
        this._navigationService.getNavigationItems();
        this.menuItems$ = this._navigationService.menuItems$;

        this.cargarTiposItem();

        if (this.modoEdicion) {
            this.cargarDatosEdicion();
        }

        // Protección de pantalla bloqueada
        this.lockScreenSubscription = this._navigationService.lockScreenEvent$.subscribe({
            next: () => {
                this._localStorageService.setFormRegistro(this.formularioRegistro.value);
                this.isLocked = true;
            }
        });

        // Restaurar si venimos de un bloqueo
        const savedForm = this._localStorageService.getFormRegistro();
        if (savedForm) {
            this.formularioRegistro.patchValue(savedForm);
            this._localStorageService.removeFormRegistro();
        }
    }

    ngOnDestroy() {
        if (this.lockScreenSubscription) this.lockScreenSubscription.unsubscribe();
    }

    cargarTiposItem() {
        // MOCK: Reemplázalo por tu servicio real -> this._tiposItemService.getTiposItem()
        // this.tiposItem = [{ tipoItemId: 1, nombreTipo: 'Infraestructura' }, { tipoItemId: 2, nombreTipo: 'Soporte' }];
    }

    cargarDatosEdicion() {
        /*
        this._itemsService.getRegistroById(this.registroId).subscribe({
            next: (resp: any) => {
                if (resp.item) {
                    this.formularioRegistro.patchValue(resp.item);
                }
            },
            error: () => this._swalAlertService.getAlertError('No se pudo cargar el ítem.')
        });
        */
    }

    // 🟢 PUENTE TEXT EDITOR -> REACTIVE FORMS
    actualizarDescripcionValor(htmlContent: string) {
        this.formularioRegistro.get('descripcionValor')?.setValue(htmlContent);
        this.formularioRegistro.get('descripcionValor')?.markAsDirty();
    }

    btnGestionarRegistroClick() {
        this.isSubmit = true;

        if (this.formularioRegistro.invalid) {
            this._swalAlertService.getAlertError(this.translate.instant('PLATAFORMA.FORMULARIOINVALIDO'));
            return;
        }

        this.isSaving = true;
        const formValues = this.formularioRegistro.getRawValue();
        const usuarioActual = this._localStorageService.getUsuarioLocalStorage()?.codigoUsuario || 'SISTEMA';

        // Estructuramos el DTO exactamente como tu base de datos lo requiere
        const dataGuardar = {
            ...formValues,
            // Aseguramos que el ID numérico se asigne limpio (Angular lo puede devolver como string desde el select)
            tipoValorId: Number(formValues.tipoValorId),
            codigoUsuarioModificacion: this.modoEdicion ? usuarioActual : '',
            fechaModificacion: this.modoEdicion ? new Date().toISOString() : '',
            codigoUsuarioCreacion: !this.modoEdicion ? usuarioActual : undefined,
            fechaCreacion: !this.modoEdicion ? new Date().toISOString() : undefined
        };

        /*
        const peticion$ = this.modoEdicion
            ? this._itemsService.putModificarRegistro(dataGuardar)
            : this._itemsService.postCrearRegistro(dataGuardar);

        peticion$.subscribe({
            next: (resp: any) => this.manejarExito(resp, this.modoEdicion ? 'PLATAFORMA.MODIFICAR' : 'PLATAFORMA.INSERTAR'),
            error: (err: any) => this.manejarError(err, this.modoEdicion ? 'PLATAFORMA.NOMODIFICO' : 'PLATAFORMA.NOINSERTO')
        });
        */

        // MOCK TEMPORAL PARA QUE NO TIRE ERROR HASTA QUE CONECTES EL SERVICIO
        console.log('Datos listos para la BD:', dataGuardar);
        setTimeout(() => this.isSaving = false, 1000);
    }

    private manejarExito(resp: any, mensajeTra: string) {
        this.isSaving = false;
        if (resp.ok) {
            const logData = { codigoTipoLog: '', codigoRespuesta: '201', descripcionLog: this.translate.instant(mensajeTra) };
            this._logActividadesService.postCrearRegistro(logData).subscribe();

            this._swalAlertService.getAlertConfirmSuccess(this.translate.instant(mensajeTra));
            this.btnRegresarClick();
        }
    }

    private manejarError(err: any, mensajeTra: string) {
        this.isSaving = false;
        console.error(err);

        const logData = { codigoTipoLog: '', codigoRespuesta: '501', descripcionLog: this.translate.instant(mensajeTra) };
        this._logActividadesService.postCrearRegistro(logData).subscribe();

        this._swalAlertService.getAlertError(this.translate.instant(mensajeTra));
    }

    btnRegresarClick() {
        this.router.navigate(['/aplicaciones/items']);
    }

    toggleNav(): void {
        this.toggleSidebar.emit();
    }
}
