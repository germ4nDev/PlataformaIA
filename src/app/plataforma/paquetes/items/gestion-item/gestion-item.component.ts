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
    NavigationService,
    PtltiposItemsService
} from 'src/app/theme/shared/service';
import { LayoutInitializerService } from 'src/app/theme/shared/service/layout-initializer.service';
import { PTLTipoItemModel } from 'src/app/theme/shared/_helpers/models/PTLTipoItem.model';
import { PTLItemsService } from 'src/app/theme/shared/service/ptlitems.service';
import { PTLItemModel } from 'src/app/theme/shared/_helpers/models/PTLItem.model';

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

    formularioRegistro!: FormGroup;
    item: PTLItemModel = new PTLItemModel();
    menuItems$!: Observable<NavigationItem[]>;
    gradientConfig: any;
    navCollapsed: boolean = false;
    windowWidth: number = 0;
    isSubmit: boolean = false;
    isSaving: boolean = false;
    modoEdicion: boolean = false;
    registroId: string = '';
    tiposItem: PTLTipoItemModel[] = [];

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
        private _navigationService: NavigationService,
        private _itemsService: PTLItemsService
    ) {
        GradientConfig.header_fixed_layout = true;
        this.gradientConfig = GradientConfig;
        this.navCollapsed = this.windowWidth >= 992 ? GradientConfig.isCollapse_menu : false;

        this.inicializarFormulario();

        this.registroId = this._localStorageService.getObject<string>('regId') || 'nuevo';
        this.modoEdicion = this.registroId !== 'nuevo';

        if (this.modoEdicion) {
            this._itemsService.getRegistroById(this.registroId).subscribe({
                next: (resp: any) => {
                    console.log('resp', resp);

                    if (resp.ok && resp.item) {
                        this.formularioRegistro.patchValue(resp.item);
                        this.item = resp.item;
                    }
                },
                error: () => {
                    this._swalAlertService.getAlertConfirmError('No se pudo obtener el item con ese codigo');
                }
            });
        }
    }

    get f() { return this.formularioRegistro.controls; }

    inicializarFormulario() {
        this.formularioRegistro = this.fb.group({
            codigoItem: [uuidv4(), Validators.required],
            codigoTipoItem: ['', Validators.required],
            nombreItem: ['', [Validators.required, Validators.maxLength(100)]],
            valorUnitario: [0, [Validators.required, Validators.min(0)]],
            costoItem: [0, [Validators.required, Validators.min(0)]],
            descripcionItem: [''], // Opcional, con HTML
            estadoItem: [true, Validators.required]
        });
    }

    ngOnInit() {
        this._layoutInitializer.applyLayout();
        this._navigationService.getNavigationItems();
        this.menuItems$ = this._navigationService.menuItems$;
        this.tiposItem = this._tiposItemService.getTiposItemsActuales();

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

    actualizarDescripcionValor(htmlContent: string) {
        this.formularioRegistro.get('descripcionItem')?.setValue(htmlContent);
        this.formularioRegistro.get('descripcionItem')?.markAsDirty();
    }

    btnGestionarRegistroClick() {
        this.isSubmit = true;

        if (this.formularioRegistro.invalid) {
            this._swalAlertService.getAlertError(this.translate.instant('PLATAFORMA.FORMULARIOINVALIDO'));
            return;
        }

        this.isSaving = true;
        const registroData = this.formularioRegistro.getRawValue() as PTLItemModel;
        if (this.modoEdicion) {
            registroData.codigoUsuarioCreacion = this.item.codigoUsuarioCreacion;
            registroData.fechaCreacion = this.item.fechaCreacion;
            registroData.codigoUsuarioModificacion = this._localStorageService.getUsuarioLocalStorage().codigoUsuario
            registroData.fechaModificacion = new Date().toISOString()
            console.log('gestionar registro', registroData);
            this._itemsService.putModificarRegistro(registroData).subscribe({
                next: (resp: any) => {
                    if (resp.ok) {
                        this.registrarLogYSalir('PLATAFORMA.MODIFICAR', '201');
                    } else {
                        this.manejarErrorGuardado(resp.mensaje);
                    }
                }
            })
        } else {
            registroData.codigoItem = uuidv4()
            registroData.codigoUsuarioCreacion = this._localStorageService.getUsuarioLocalStorage().codigoUsuario
            registroData.fechaCreacion = new Date().toISOString()
            registroData.codigoUsuarioModificacion = ''
            registroData.fechaModificacion = ''
            console.log('insertar registro', registroData)
            this._itemsService.postCrearRegistro(registroData).subscribe({
                next: (resp: any) => {
                    if (resp.ok) {
                        this.registrarLogYSalir('PLATAFORMA.CREAR', '201');
                    } else {
                        this.manejarErrorGuardado(resp.mensaje);
                    }
                }
            })
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

    btnRegresarClick() {
        this.router.navigate(['/paquetes/items']);
    }

    toggleNav(): void {
        this.toggleSidebar.emit();
    }
}
