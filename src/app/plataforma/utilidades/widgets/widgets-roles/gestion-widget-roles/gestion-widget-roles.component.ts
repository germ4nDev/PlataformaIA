/* eslint-disable @typescript-eslint/no-explicit-any */
import { Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { GradientConfig } from 'src/app/app-config';
import { SharedModule } from 'src/app/theme/shared/shared.module';
import {
    LocalStorageService,
    PtllogActividadesService,
    PTLRolesAPService,
    SwalAlertService
} from 'src/app/theme/shared/service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { NavigationItem } from 'src/app/theme/shared/_helpers/models/Navigation.model';
import { PTLLogActividadAPModel } from 'src/app/theme/shared/_helpers/models/PTLlogActividadAP.model';
import { NavigationService } from 'src/app/theme/shared/service/navigation.service';
import { NavBarComponent } from 'src/app/theme/layout/admin/nav-bar/nav-bar.component';
import { NavContentComponent } from 'src/app/theme/layout/admin/navigation/nav-content/nav-content.component';
import { Observable, Subscription } from 'rxjs';
import { PTLWidgetMaestroModel } from 'src/app/theme/shared/_helpers/models/PTLWidgetMaestro.model';
import { PTLRoleAPModel } from 'src/app/theme/shared/_helpers/models/PTLRoleAP.model';
import { PtlWidgetsRolesService } from 'src/app/theme/shared/service/ptlwidgets-roles.service';
import { PTLWidgetsMaestroService } from 'src/app/theme/shared/service/ptlwidgets-maestro.service';
import { v4 as uuidv4 } from 'uuid';

@Component({
    selector: 'app-gestion-widget-roles',
    standalone: true,
    imports: [CommonModule, SharedModule, TranslateModule, NavBarComponent, NavContentComponent],
    templateUrl: './gestion-widget-roles.component.html',
    styleUrl: './gestion-widget-roles.component.scss'
})
export class GestionWidgetRolesComponent implements OnInit, OnDestroy {
    @Output() toggleSidebar = new EventEmitter<void>();
    logActividad: PTLLogActividadAPModel = new PTLLogActividadAPModel();
    widgetMaestro: PTLWidgetMaestroModel = new PTLWidgetMaestroModel();
    menuItems$!: Observable<NavigationItem[]>;
    gradientConfig: any;
    navCollapsed: boolean = false;
    navCollapsedMob: boolean = false;
    windowWidth: number = 0;

    isSubmit: boolean = false;
    modoEdicion: boolean = false;
    codigoWidget: string = '';

    lockScreenSubscription: Subscription | undefined;
    isLocked: boolean = false;
    lockMessage: string = '';

    subscriptions = new Subscription();
    widgetsRoles: any[] = []; // Asignaciones actuales del backend
    widgetsRolesGestion: any[] = []; // Control temporal de cambios
    widgetsMaestros: PTLWidgetMaestroModel[] = [];
    roles: PTLRoleAPModel[] = [];
    public rolesConCheck: any[] = [];

    constructor(
        private router: Router,
        private route: ActivatedRoute,
        private translate: TranslateService,
        private _navigationService: NavigationService,
        private _localStorageService: LocalStorageService,
        private _logActividadesService: PtllogActividadesService,
        private _widgetsRolesService: PtlWidgetsRolesService,
        private _widgetsMaestroService: PTLWidgetsMaestroService,
        private _rolesService: PTLRolesAPService,
        private _swalAlertService: SwalAlertService
    ) {
        this.isSubmit = false;
        GradientConfig.header_fixed_layout = true;
        this.gradientConfig = GradientConfig;
        this.navCollapsed = this.windowWidth >= 992 ? GradientConfig.isCollapse_menu : false;
        this.navCollapsedMob = false;

        this.codigoWidget = this._localStorageService.getObject<string>('regId') || 'nuevo';
        console.log('roles pal widget', this.codigoWidget);

        if (this.codigoWidget !== 'nuevo') {
            this.modoEdicion = true;
            console.log('Consultar registro widget:', this.codigoWidget);
        }
    }

    ngOnInit() {
        this._navigationService.getNavigationItems();
        this.menuItems$ = this._navigationService.menuItems$;

        // Cargamos catálogos de memoria
        this.roles = this._rolesService.getRolesActuales();
        this.widgetsMaestros = this._widgetsMaestroService.getWidgetsActuales() || [];
        this.widgetMaestro = this.widgetsMaestros.find(x => x.codigoWidget === this.codigoWidget) || new PTLWidgetMaestroModel();
        this.widgetsRoles = this._widgetsRolesService.getWidgetRolesActuales() || [];

        this.cargarRegistros(this.codigoWidget);

        this.lockScreenSubscription = this._navigationService.lockScreenEvent$.subscribe({
            next: (message: string) => {
                this.isLocked = true;
                this.lockMessage = message;
            },
            error: (err) => console.error('Error al suscribirse al evento de bloqueo:', err)
        });
    }

    ngOnDestroy(): void {
        this.subscriptions.unsubscribe();
        if (this.lockScreenSubscription) {
            this.lockScreenSubscription.unsubscribe();
        }
    }

    cargarRegistros(codigoWidgetActual: string) {
        console.log('Datos del Widget Maestro:', this.widgetMaestro);

        if (!this.roles?.length || !codigoWidgetActual || !this.widgetMaestro) return;

        this.rolesConCheck = this.roles
            // 🟢 1. Soporte para booleanos (true) y bits de SQL (1)
            .filter(rol => rol.estadoRole === true)
            .map(rol => {

                // 🟢 2. Búsqueda flexible (usamos == para ignorar conflictos de string/number)
                const relacionPuente = this.widgetsRoles.find(wr =>
                    // Validamos ambos nombres por si el backend lo devuelve diferente
                    (wr.codigoRol == rol.codigoRole || wr.codigoRole == rol.codigoRole) &&
                    wr.codigoWidget == codigoWidgetActual
                );

                // 🟢 3. Asignación segura del checkbox
                let isChecked = false;
                if (relacionPuente) {
                    // Si la relación existe, verificamos que esté activa (true o 1).
                    // Si el backend no envía el 'estadoRelacion', asumimos true solo porque la relación existe.
                    if (relacionPuente.estadoRelacion === true || relacionPuente.estadoRelacion === 1 || relacionPuente.estadoRelacion === undefined) {
                        isChecked = true;
                    }
                }

                return {
                    ...rol,
                    checked: isChecked
                };
            });

        console.log('✅ Roles procesados para los checkboxes del widget:', this.rolesConCheck);
    }

    btnGestionarWidgetRoleClick() {
        const rolesSeleccionados = this.rolesConCheck.filter(rol => rol.checked === true);

        const payloadSincronizacion = rolesSeleccionados.map(rol => {
            return {
                codigoWidgetRole: uuidv4(),
                codigoWidget: this.codigoWidget,
                codigoRol: rol.codigoRole,
                estadoRelacion: true,
                codigoUsuarioCreacion: this._localStorageService.getUsuarioLocalStorage()?.codigoUsuario || 'SISTEMA',
                fechaCreacion: new Date().toISOString()
            };
        });

        console.log('📦 Payload a enviar al backend (Masivo):', payloadSincronizacion);

        this._widgetsRolesService.postCrearBulkRegistro(this.codigoWidget, payloadSincronizacion)
            .subscribe({
                next: (resp: any) => {
                    console.log('Sincronización exitosa', resp);
                    this._swalAlertService.getAlertSuccess(this.translate.instant('WIDGETS.CREATESUCCESSFULLY'));
                    this._localStorageService.setObject('regId', this.codigoWidget)
                    this.router.navigate(['/utilidades/widgets-roles']);
                },
                error: (err: any) => console.error('Error al sincronizar roles de widget', err)
            });
    }

    btnRegresarClick() {
        this._localStorageService.setObject('regId', this.codigoWidget)
        this.router.navigate(['/utilidades/widgets-roles']);
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

    btnAsociarTodosClick() {
        this.widgetsRolesGestion = [];
        this.rolesConCheck.forEach((role: any) => {
            role.checked = true;
            const widgetRole = {
                codigoWidgetRole: uuidv4(),
                codigoWidget: this.codigoWidget,
                codigoRol: role.codigoRole,
                estadoRelacion: true,
                codigoUsuarioCreacion: this._localStorageService.getUsuarioLocalStorage()?.codigoUsuario || 'SISTEMA',
                fechaCreacion: new Date().toISOString()
            };
            this.widgetsRolesGestion.push(widgetRole);
        });
    }

    onRoleCheckChange(event: any, role: any) {
        const isChecked = event.target.checked;

        const widgetRole = {
            codigoWidgetRole: uuidv4(),
            codigoWidget: this.codigoWidget,
            codigoRol: role.codigoRole,
            estadoRelacion: isChecked,
            codigoUsuarioCreacion: this._localStorageService.getUsuarioLocalStorage()?.codigoUsuario || 'SISTEMA',
            fechaCreacion: new Date().toISOString()
        };

        if (isChecked) {
            this.widgetsRolesGestion.push(widgetRole);
        } else {
            const idx = this.widgetsRolesGestion.findIndex(x => x.codigoRol === role.codigoRole);
            const idxChk = this.rolesConCheck.findIndex(x => x.codigoRole === role.codigoRole);

            if (idx !== -1) this.widgetsRolesGestion.splice(idx, 1);
            this.rolesConCheck[idxChk].checked = isChecked;
        }
    }

    toggleNav(): void {
        this.toggleSidebar.emit();
    }
}
