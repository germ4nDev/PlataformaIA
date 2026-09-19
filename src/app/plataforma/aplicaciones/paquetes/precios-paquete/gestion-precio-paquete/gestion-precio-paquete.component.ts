/* eslint-disable @typescript-eslint/no-explicit-any */
import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Observable, Subscription } from 'rxjs';
import { GradientConfig } from 'src/app/app-config';
import { SharedModule } from 'src/app/theme/shared/shared.module';
import { v4 as uuidv4 } from 'uuid';

// Componentes QPLUS
import { NavBarComponent } from 'src/app/theme/layout/admin/nav-bar/nav-bar.component';
import { NavContentComponent } from 'src/app/theme/layout/admin/navigation/nav-content/nav-content.component';

// Servicios y Modelos
import { NavigationItem } from 'src/app/theme/shared/_helpers/models/Navigation.model';
import {
    PtllogActividadesService,
    SwalAlertService,
    LocalStorageService,
    NavigationService
} from 'src/app/theme/shared/service';
import { LayoutInitializerService } from 'src/app/theme/shared/service/layout-initializer.service';
import { LoadingService } from 'src/app/theme/shared/service/loading.service';
import { PTLListasPreciosService } from 'src/app/theme/shared/service/ptllistas-precios.service';

@Component({
    selector: 'app-gestion-precio-paquete',
    standalone: true,
    imports: [CommonModule, SharedModule, TranslateModule, NavBarComponent, NavContentComponent],
    templateUrl: './gestion-precio-paquete.component.html',
    styleUrl: './gestion-precio-paquete.component.scss'
})
export class GestionPrecioPaqueteComponent implements OnInit, OnDestroy {
    // #region VARIABLES
    @Output() toggleSidebar = new EventEmitter<void>();

    // 🟢 Objeto base actualizado para el formulario (Costo y Precio)
    FormRegistro: any = {
        costoBaseMensual: null, // Para análisis financiero interno
        valorBaseMensual: null, // Lo que se le cobra al cliente
        precioSetup: 0          // Cobro de única vez (Opcional)
    };

    menuItems$!: Observable<NavigationItem[]>;
    gradientConfig: any;
    navCollapsed: boolean = false;
    navCollapsedMob: boolean = false;
    windowWidth: number = 0;
    isSubmit: boolean;

    modoEdicion: boolean = false;
    codigoPaquete: string = '';
    listaId: string = '';
    detalleId: string = '';

    lockScreenSubscription: Subscription | undefined;
    isLocked: boolean = false;
    lockMessage: string = '';
    suscriptor: string = '';
    // #endregion VARIABLES

    constructor(
        private router: Router,
        private route: ActivatedRoute,
        private translate: TranslateService,
        private _registrosService: PTLListasPreciosService,
        private _layoutInitializer: LayoutInitializerService,
        private _logActividadesService: PtllogActividadesService,
        private _swalAlertService: SwalAlertService,
        private _localStorageService: LocalStorageService,
        private _loadingService: LoadingService,
        private _navigationService: NavigationService
    ) {
        this.isSubmit = false;
        GradientConfig.header_fixed_layout = true;
        this.gradientConfig = GradientConfig;
        this.navCollapsed = this.windowWidth >= 992 ? GradientConfig.isCollapse_menu : false;
        this.navCollapsedMob = false;
        this.suscriptor = this._localStorageService.getSuscriptorPlataformaLocalStorage();

        // Recuperamos los IDs de la pantalla anterior
        this.codigoPaquete = this._localStorageService.getObject<string>('regId') || '';
        this.listaId = this._localStorageService.getObject<string>('listaId') || '';
        this.detalleId = this._localStorageService.getObject<string>('detalleId') || 'nuevo';

        this.modoEdicion = this.detalleId !== 'nuevo';
    }

    ngOnInit() {
        this._layoutInitializer.applyLayout();
        this._navigationService.getNavigationItems();
        this.menuItems$ = this._navigationService.menuItems$;

        this.lockScreenSubscription = this._navigationService.lockScreenEvent$.subscribe({
            next: (message: string) => {
                this._localStorageService.setFormRegistro(this.FormRegistro);
                this.isLocked = true;
                this.lockMessage = message;
            },
            error: err => console.error('Error al suscribirse al evento de bloqueo:', err)
        });

        const form = this._localStorageService.getFormRegistro();
        if (form != undefined) {
            this.FormRegistro = form;
            this._localStorageService.removeFormRegistro();
        }
    }

    ngOnDestroy() {
        if (this.lockScreenSubscription) {
            this.lockScreenSubscription.unsubscribe();
        }
    }

    btnGestionarRegistroClick(formulario: any) {
        this.isSubmit = true;

        if (formulario.invalid) {
            this._swalAlertService.getAlertError(this.translate.instant('PLATAFORMA.FORMULARIOINVALIDO'));
            return;
        }

        this._loadingService.show();

        // 🟢 Data homologada al nuevo modelo de rentabilidad
        const dataGuardar = {
            tipoReferencia: 'PAQUETE',
            codigoReferencia: this.codigoPaquete,
            costoBaseMensual: this.FormRegistro.costoBaseMensual,
            valorBaseMensual: this.FormRegistro.valorBaseMensual,
            precioSetup: this.FormRegistro.precioSetup || 0,
            estadoDetalle: true
        };

        if (!this.modoEdicion) {
            const payloadCrear = {
                ...dataGuardar,
                codigoDetalle: uuidv4(),
                codigoLista: this.listaId
            };

            this._registrosService.agregarPrecioDetalle(this.listaId, payloadCrear).subscribe({
                next: (resp: any) => {
                    if (resp.ok) {
                        const logData = { codigoTipoLog: '', codigoRespuesta: '201', descripcionLog: this.translate.instant('PLATAFORMA.INSERTAR') };
                        this._logActividadesService.postCrearRegistro(logData).subscribe();
                        this._swalAlertService.getAlertConfirmSuccess(this.translate.instant('PLATAFORMA.INSERTAR'));
                        this._loadingService.hide();
                        this.btnRegresarClick();
                    }
                },
                error: (err: any) => {
                    console.error(err);
                    const logData = { codigoTipoLog: '', codigoRespuesta: '501', descripcionLog: this.translate.instant('PLATAFORMA.NOINSERTO') };
                    this._loadingService.hide();
                    this._logActividadesService.postCrearRegistro(logData).subscribe();
                    this._swalAlertService.getAlertError(this.translate.instant('PLATAFORMA.NOINSERTO'));
                }
            });
        } else {
            this._registrosService.actualizarPrecioDetalle(this.detalleId, dataGuardar).subscribe({
                next: (resp: any) => {
                    if (resp.ok) {
                        const logData = { codigoTipoLog: '', codigoRespuesta: '201', descripcionLog: this.translate.instant('PLATAFORMA.MODIFICAR') };
                        this._logActividadesService.postCrearRegistro(logData).subscribe();
                        this._swalAlertService.getAlertSuccess(this.translate.instant('PLATAFORMA.MODIFICAR'));
                        this._loadingService.hide();
                        this.btnRegresarClick();
                    }
                },
                error: (err: any) => {
                    console.error(err);
                    const logData = { codigoTipoLog: '', codigoRespuesta: '501', descripcionLog: this.translate.instant('PLATAFORMA.NOMODIFICO') };
                    this._loadingService.hide();
                    this._logActividadesService.postCrearRegistro(logData).subscribe();
                    this._swalAlertService.getAlertError(this.translate.instant('PLATAFORMA.NOMODIFICO'));
                }
            });
        }
    }

    btnRegresarClick() {
        this.router.navigate(['aplicaciones/precios-paquete']);
    }

    toggleNav(): void {
        this.toggleSidebar.emit();
    }
}
