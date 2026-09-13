/* eslint-disable @typescript-eslint/no-explicit-any */
import { Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { GradientConfig } from 'src/app/app-config';
import { SharedModule } from 'src/app/theme/shared/shared.module';
import {
    LocalStorageService,
    PtllogActividadesService,
    PtlActividadesService,
    PtlactividadesRolesService,
    PTLRolesAPService,
    SwalAlertService
} from 'src/app/theme/shared/service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { NavigationItem } from 'src/app/theme/shared/_helpers/models/Navigation.model';
import { PTLLogActividadAPModel } from 'src/app/theme/shared/_helpers/models/PTLlogActividadAP.model';
import { NavigationService } from 'src/app/theme/shared/service/navigation.service';
import { NavBarComponent } from 'src/app/theme/layout/admin/nav-bar/nav-bar.component';
import { NavContentComponent } from 'src/app/theme/layout/admin/navigation/nav-content/nav-content.component';
import { catchError, Observable, of, Subscription, tap } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';
import { PTLActividadModel } from 'src/app/theme/shared/_helpers/models/PTLActividades.model';
import { PTLActividadRoleModel } from 'src/app/theme/shared/_helpers/models/PTLActividadesRoles.model';
import { PTLRoleAPModel } from 'src/app/theme/shared/_helpers/models/PTLRoleAP.model';

@Component({
    selector: 'app-gestiion-actividad-role',
    standalone: true,
    imports: [CommonModule, SharedModule, TranslateModule, NavBarComponent, NavContentComponent],
    templateUrl: './gestion-actividad-role.component.html',
    styleUrl: './gestion-actividad-role.component.scss'
})
export class GestiionActividadRoleComponent implements OnInit, OnDestroy {
    @Output() toggleSidebar = new EventEmitter<void>();
    logActividad: PTLLogActividadAPModel = new PTLLogActividadAPModel();
    actividad: PTLActividadModel = new PTLActividadModel();
    menuItems$!: Observable<NavigationItem[]>;
    gradientConfig: any;
    navCollapsed: boolean = false;
    navCollapsedMob: boolean = false;
    windowWidth: number = 0;

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
    actividadesRoles: PTLActividadRoleModel[] = [];
    actividadesRolesGestion: PTLActividadRoleModel[] = [];
    actividades: PTLActividadModel[] = [];
    roles: PTLRoleAPModel[] = [];
    public rolesConCheck: any[] = [];

    constructor(
        private router: Router,
        private route: ActivatedRoute,
        private translate: TranslateService,
        private _navigationService: NavigationService,
        private _localStorageService: LocalStorageService,
        private _logActividadesService: PtllogActividadesService,
        private _actividadesRolesService: PtlactividadesRolesService,
        private _actividadesService: PtlActividadesService,
        private _rolesService: PTLRolesAPService,
        private _swalAlertService: SwalAlertService
    ) {
        this.isSubmit = false;
        GradientConfig.header_fixed_layout = true;
        this.gradientConfig = GradientConfig;
        this.navCollapsed = this.windowWidth >= 992 ? GradientConfig.isCollapse_menu : false;
        this.navCollapsedMob = false;
        this.codeActividad = this._localStorageService.getObject<string>('regId') || 'nuevo'
        if (this.codeActividad !== 'nuevo') {
            this.modoEdicion = true;
            console.log('consultar registro actividad', this.codeActividad);
        }
    }

    ngOnInit() {
        this._navigationService.getNavigationItems();
        this.menuItems$ = this._navigationService.menuItems$;
        this.roles = this._rolesService.getRolesActuales();
        this.actividades = this._actividadesService.getActividadesActuales();
        this.actividad = this.actividades.find(x => x.codigoActividad == this.codeActividad) || new PTLActividadModel()
        this.actividadesRoles = this._actividadesRolesService.getActividadesRolesActuales()
        this.cargarRegistros(this.codeActividad)
        this.lockScreenSubscription = this._navigationService.lockScreenEvent$.subscribe({
            next: (message: string) => {
                //this._localStorageService.setFormRegistro(this.FormRegistro);
                this.isLocked = true;
                this.lockMessage = message;
            },
            error: (err) => console.error('Error al suscribirse al evento de bloqueo:', err)
        });
    }

    ngOnDestroy(): void {
        this.subscriptions.unsubscribe();
    }

    cargarRegistros(codigoActividadActual: string) {
        console.log('Datos de la actividad:', this.actividad);

        if (!this.roles?.length || !codigoActividadActual || !this.actividad) return;

        this.rolesConCheck = this.roles
            .filter(rol =>
                rol.estadoRole === true &&
                rol.codigoAplicacion === this.actividad.codigoAplicacion &&
                rol.codigoSuite === this.actividad.codigoSuite
            )
            .map(rol => {
                const relacionPuente = this.actividadesRoles.find(ar =>
                    ar.codigoRole === rol.codigoRole &&
                    ar.codigoActividad === codigoActividadActual
                );

                return {
                    ...rol,
                    checked: relacionPuente?.permiso === true
                };
            });

        console.log('✅ Roles procesados para los checkboxes:', this.rolesConCheck);
    }

    btnGestionarActividadClick() {
        const rolesSeleccionados = this.rolesConCheck.filter(rol => rol.checked === true);

        const payloadSincronizacion = rolesSeleccionados.map(rol => {
            return {
                codigoActividadRole: crypto.randomUUID(),
                codigoActividad: this.actividad.codigoActividad,
                codigoRole: rol.codigoRole,
                permiso: true,

                codigoUsuarioCreacion: this._localStorageService.getUsuarioLocalStorage().codigoUsuario,
                fechaCreacion: new Date().toISOString()
            };
        });

        console.log('📦 Payload a enviar al backend:', payloadSincronizacion);

        this._actividadesRolesService.postCrearBulkRegistro(this.codeActividad, payloadSincronizacion)
            .subscribe({
                next: (resp) => {
                    console.log('Sincronización exitosa', resp);
                    this._swalAlertService.getAlertSuccess(this.translate.instant('ACTIVIDADES.CREATESUCCESSFULLY'));
                    this.router.navigate(['/actividades/actividades-roles']);
                },
                error: (err) => console.error('Error al sincronizar', err)
            });
    }

    btnRegresarClick() {
        this.router.navigate(['/actividades/actividades-roles']);
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
        this.actividadesRolesGestion = [];
        this.rolesConCheck.forEach((role: any) => {
            role.checked = true;
            const actRole = {
                codigoActividadRole: uuidv4(),
                codigoActividad: this.codeActividad,
                codigoRole: role.codigoRole,
                permiso: true,
                codigoUsuarioCreacion: this._localStorageService.getUsuarioLocalStorage().codigoUsuario,
                fechaCreacion: new Date().toISOString()
            }
            console.log('crear actRole', actRole);
            this.actividadesRolesGestion.push(actRole);
        });
    }

    onRoleCheckChange(event: any, role: any) {
        console.log('permiso', event.target.checked);
        console.log('role checkeado', role);
        const actRole = {
            codigoActividadRole: uuidv4(),
            codigoActividad: this.codeActividad,
            codigoRole: role.codigoRole,
            permiso: event.target.checked,
            codigoUsuarioCreacion: this._localStorageService.getUsuarioLocalStorage().codigoUsuario,
            fechaCreacion: new Date().toISOString()
        }

        if (event.target.checked) {
            console.log('crear actRole', actRole);
            this.actividadesRolesGestion.push(actRole);
        } else {
            const idx = this.actividadesRolesGestion.findIndex(x => x.codigoRole == role.codigoRole);
            const idxChk = this.rolesConCheck.findIndex(x => x.codigoRole == role.codigoRole);
            this.actividadesRolesGestion.splice(idx, 1);
            this.rolesConCheck[idxChk].checked = event.target.checked;
        }
    }

    toggleNav(): void {
        this.toggleSidebar.emit();
    }
}
