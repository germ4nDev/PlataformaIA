/* eslint-disable @typescript-eslint/no-explicit-any */
import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { GradientConfig } from 'src/app/app-config';

// project import
import { SharedModule } from 'src/app/theme/shared/shared.module';
import { LocalStorageService, PtlColoresSettingsService, SwalAlertService } from 'src/app/theme/shared/service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { NavigationItem } from 'src/app/theme/shared/_helpers/models/Navigation.model';
import { NavigationService } from 'src/app/theme/shared/service/navigation.service';
import { NavBarComponent } from 'src/app/theme/layout/admin/nav-bar/nav-bar.component';
import { NavContentComponent } from 'src/app/theme/layout/admin/navigation/nav-content/nav-content.component';
import { LayoutInitializerService } from 'src/app/theme/shared/service/layout-initializer.service';
import { Observable, Subscription } from 'rxjs';
import { PTLColorSettingModel } from 'src/app/theme/shared/_helpers/models/PTLColorSetting.model';
import { ColorSelectorComponent } from 'src/app/theme/shared/components/color-selector/color-selector.component';
import { v4 as uuidv4 } from 'uuid'

@Component({
    selector: 'app-gestion-color',
    standalone: true,
    imports: [CommonModule, SharedModule, TranslateModule, NavBarComponent, NavContentComponent, ColorSelectorComponent],
    templateUrl: './gestion-color.component.html',
    styleUrl: './gestion-color.component.scss'
})
export class GestionColorComponent implements OnInit {
    // private props
    @Output() toggleSidebar = new EventEmitter<void>();
    FormRegistro: PTLColorSettingModel = new PTLColorSettingModel();
    menuItems!: Observable<NavigationItem[]>;
    gradientConfig: any;
    navCollapsed: boolean = false;
    navCollapsedMob: boolean = false;
    windowWidth: number = 0;
    form: undefined;
    isSubmit: boolean;
    colorNavId: string = '';
    modoEdicion: boolean = false;
    slidersInicioSub?: Subscription;
    slidersInicio: PTLColorSettingModel[] = [];
    tipoEditorTexto = 'basica';

    navbarColor: string = 'navbar';
    textoColor: string = 'texto';
    iconosColor: string = 'icons';
    buttonsHoverColor: string = 'hover';
    estadoColor: boolean = false;

    nColor: string = '';
    tColor: string = '';
    iColor: string = '';
    bHColor: string = '';
    lockScreenSubscription: Subscription | undefined;
    isLocked: boolean = false;
    lockMessage: string = '';

    // constructor
    constructor(
        private router: Router,
        private route: ActivatedRoute,
        private translate: TranslateService,
        private _registrosService: PtlColoresSettingsService,
        private _layoutInitializer: LayoutInitializerService,
        private _swalAlertService: SwalAlertService,
        private _localStorageService: LocalStorageService,
        private _navigationService: NavigationService
    ) {
        this.isSubmit = false;
        GradientConfig.header_fixed_layout = true;
        this.gradientConfig = GradientConfig;
        this.navCollapsed = this.windowWidth >= 992 ? GradientConfig.isCollapse_menu : false;
        this.navCollapsedMob = false;
        this.colorNavId = this._localStorageService.getObject<string>('regId') || 'nuevo';
        if (this.colorNavId != 'nuevo') {
            this.modoEdicion = true;
            this._registrosService.getRegistroById(this.colorNavId).subscribe({
                next: (resp: any) => {
                    this.FormRegistro = resp.colorNav;
                    this.nColor = this.FormRegistro.navbarColor || '#1e3a8a';
                    this.tColor = this.FormRegistro.textoColor || '#1e3a8a';
                    this.iColor = this.FormRegistro.iconosColor || '#1e3a8a';
                    this.bHColor = this.FormRegistro.buttonsHoverColor || '#1e3a8a';
                    console.log('formRegistro', this.FormRegistro);
                    this.colorNavId = this.FormRegistro.codigoColorSetting || '';
                },
                error: (err) => {
                    this._swalAlertService.getAlertError('No se pudo obtener el colorSetting por ' + err);
                }
            });
        } else {
            this.modoEdicion = false;
        }
    }

    ngOnInit() {
        this._navigationService.getNavigationItems();
        this.menuItems = this._navigationService.menuItems$;
        this._layoutInitializer.applyLayout();
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
            this.FormRegistro.codigoColorSetting = uuidv4()
            console.log('FormRegistro loading', this.FormRegistro)
        }
    }

    OnColorSelectedClick(evento: any) {
        console.log('evento', evento);
        switch (evento.id) {
            case 'navbar':
                this.FormRegistro.navbarColor = evento.color;
                break;
            case 'texto':
                this.FormRegistro.textoColor = evento.color;
                break;
            case 'icons':
                this.FormRegistro.iconosColor = evento.color;
                break;
            case 'hover':
                this.FormRegistro.buttonsHoverColor = evento.color;
                break;
        }
        console.log('formRegistro', this.FormRegistro);
    }

    btnGestionarRegistroClick(form: any) {
        this.isSubmit = true;
        if (!form.valid) {
            return;
        }

        const registroData = form.value as PTLColorSettingModel
        registroData.navbarColor = this.FormRegistro.navbarColor;
        registroData.textoColor = this.FormRegistro.textoColor;
        registroData.iconosColor = this.FormRegistro.iconosColor;
        registroData.estadoColor = this.FormRegistro.estadoColor;
        registroData.buttonsHoverColor = this.FormRegistro.buttonsHoverColor;
        console.log('datos del registro', registroData);
        if (this.modoEdicion) {
            if (this.colorNavId != '') {
                registroData.codigoColorSetting = this.FormRegistro.codigoColorSetting;
                registroData.codigoUsuarioCreacion = this.FormRegistro.codigoUsuarioCreacion;
                registroData.fechaCreacion = this.FormRegistro.fechaCreacion;
                registroData.codigoUsuarioModificacion = this._localStorageService.getUsuarioLocalStorage().codigoUsuario
                registroData.fechaModificacion = new Date().toISOString()
                this._registrosService.putModificarRegistro(registroData, registroData.codigoColorSetting || '').subscribe({
                    next: (resp: any) => {
                        if (resp.ok) {
                            this._swalAlertService.getAlertSuccess(this.translate.instant('COMMON.RECORD_UPDATED_SUCCESSFULLY'));
                            this.router.navigate(['/utilidades/colores-nav']);
                        } else {
                            this._swalAlertService.getAlertError(resp.message || this.translate.instant('COMMON.COULD_NOT_UPDATE_RECORD'));
                        }
                    },
                    error: (err: any) => {
                        console.error(err);
                        this._swalAlertService.getAlertError(this.translate.instant('COMMON.COULD_NOT_UPDATE_RECORD'));
                    }
                });
            } else {
                this._swalAlertService.getAlertError(this.translate.instant('UTILIDADES.COLORES_NAV.GESTION.RECORD_NOT_FOUND'));
            }
        } else {
            console.log('formRegistro a insertar', this.FormRegistro);
            registroData.codigoColorSetting = uuidv4();
            registroData.codigoUsuarioCreacion = this._localStorageService.getUsuarioLocalStorage().codigoUsuario || ''
            registroData.fechaCreacion = new Date().toISOString()
            registroData.codigoUsuarioModificacion = this._localStorageService.getUsuarioLocalStorage().codigoUsuario || ''
            registroData.fechaModificacion = new Date().toISOString()
            this._registrosService.postCrearRegistro(registroData).subscribe({
                next: (resp: any) => {
                    if (resp.ok) {
                        this._swalAlertService.getAlertSuccess(this.translate.instant('COMMON.RECORD_INSERTED_SUCCESSFULLY'));
                        form.resetForm();
                        this.isSubmit = false;
                        this.router.navigate(['/utilidades/colores-nav']);
                    }
                },
                error: (err: any) => {
                    console.error(err);
                    this._swalAlertService.getAlertError(this.translate.instant('COMMON.COULD_NOT_INSERT_RECORD'));
                }
            });
        }
    }

    btnRegresarClick() {
        this.router.navigate(['/utilidades/colores-nav']);
    }

    toggleNav(): void {
        this.toggleSidebar.emit();
    }
}
