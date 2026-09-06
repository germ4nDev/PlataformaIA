/* eslint-disable @typescript-eslint/no-explicit-any */
//#region IMPORTS
import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { SharedModule } from 'src/app/theme/shared/shared.module';
import { PTLRoleAPModel } from '../../../../theme/shared/_helpers/models/PTLRoleAP.model';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { PTLRolesAPService } from 'src/app/theme/shared/service/ptlroles-ap.service';
import { PtlAplicacionesService } from 'src/app/theme/shared/service/ptlaplicaciones.service';
import { PTLAplicacionModel } from 'src/app/theme/shared/_helpers/models/PTLAplicacion.model';
import { PtlSuitesAPService } from 'src/app/theme/shared/service/ptlsuites-ap.service';
import { catchError, Observable, of, Subscription, tap } from 'rxjs';
import { NavBarComponent } from 'src/app/theme/layout/admin/nav-bar/nav-bar.component';
import { NavContentComponent } from 'src/app/theme/layout/admin/navigation/nav-content/nav-content.component';
import { NavigationService } from 'src/app/theme/shared/service/navigation.service';
import { v4 as uuidv4 } from 'uuid';
import { NavigationItem } from 'src/app/theme/shared/_helpers/models/Navigation.model';
import { PTLUsuarioRoleAPModel } from 'src/app/theme/shared/_helpers/models/PTLUsuarioRole.model';
import {
    LocalStorageService,
    PtllogActividadesService,
    PtlusuariosRolesApService,
    SwalAlertService,
    PTLUsuariosService,
    PtlusuariosScService,
    PTLSuscriptoresService,
    PtlEmpresasScService
} from 'src/app/theme/shared/service';
import { PTLUsuarioModel } from 'src/app/theme/shared/_helpers/models/PTLUsuario.model';
import { LoadingService } from 'src/app/theme/shared/service/loading.service';
import { PTLSuiteAPModel } from 'src/app/theme/shared/_helpers/models/PTLSuiteAP.model';
import { PTLTiposRoleModel } from '../../../../theme/shared/_helpers/models/PTLTiposRole.model';
import { PTLTiposRolesService } from 'src/app/theme/shared/service/ptltipos-roles.service';
import { PTLUsuarioSCModel } from 'src/app/theme/shared/_helpers/models/PTLUsuarioSC.model';
import { PTLSuscriptorModel } from 'src/app/theme/shared/_helpers/models/PTLSuscriptor.model';
import { PTLEmpresaSCModel } from 'src/app/theme/shared/_helpers/models/PTLEmpresaSC.model';
//#endregion IMPORTS

@Component({
    selector: 'app-gestion-roles-usuario',
    standalone: true,
    imports: [CommonModule, SharedModule, TranslateModule, NavBarComponent, NavContentComponent],
    templateUrl: './gestion-roles-usuario.component.html',
    styleUrl: './gestion-roles-usuario.component.scss'
})
export class GestionRolesUsuarioComponent implements OnInit {
    @Output() toggleSidebar = new EventEmitter<void>();
    menuItems!: Observable<NavigationItem[]>;
    FormRegistro: PTLUsuarioRoleAPModel = new PTLUsuarioRoleAPModel();
    lockScreenSubscription: Subscription | undefined;
    isLocked: boolean = false;
    lockMessage: string = '';
    tituloPagina: string = ''

    aplicaciones: PTLAplicacionModel[] = [];
    usuarios: PTLUsuarioModel[] = [];
    usuario: PTLUsuarioModel = new PTLUsuarioModel();
    usuariosSC: PTLUsuarioSCModel[] = [];
    empresasSC: PTLEmpresaSCModel[] = [];
    usuariosRoles: PTLUsuarioRoleAPModel[] = [];
    suites: PTLSuiteAPModel[] = [];
    suitesFiltradas: PTLSuiteAPModel[] = [];
    roles: any[] = [];
    tiposRoles: PTLTiposRoleModel[] = [];
    suscriptores: PTLSuscriptorModel[] = [];

    isSubmit: boolean = false;
    modoEdicion: boolean = false;
    codigoUsuarioSC: string = '';
    codigoAplicacion: string = '';
    codigoSuite: string = '';
    codigoUsuario: string = '';
    codigoSuscriptor: string = '';
    codigoEmpresaSC: string = '';
    tipoRol: string = '';

    constructor(
        private router: Router,
        private route: ActivatedRoute,
        private translate: TranslateService,
        private _logActividadesService: PtllogActividadesService,
        private _navigationService: NavigationService,
        private _rolesService: PTLRolesAPService,
        private _aplicacionesService: PtlAplicacionesService,
        private _suitesService: PtlSuitesAPService,
        private _localStorageService: LocalStorageService,
        private _swalAlertService: SwalAlertService,
        private _registrosService: PtlusuariosRolesApService,
        private _usuariosService: PTLUsuariosService,
        private _usuariosSCService: PtlusuariosScService,
        private _usuariosRolesService: PtlusuariosRolesApService,
        private _suscriptoresService: PTLSuscriptoresService,
        private _empresasSCService: PtlEmpresasScService,
        private _tiposRolesService: PTLTiposRolesService,
        private _loadingService: LoadingService,
    ) {
        this.isSubmit = false;
        this.codigoUsuario = this._localStorageService.getObject<string>('regId') || '';
        // this.route.queryParams.subscribe((params) => {
        //     const registroId = params['regId'];
        //     if (registroId) {
        //         this.modoEdicion = true;
        //         this._registrosService.getRegistroById(registroId).subscribe({
        //             next: (resp: any) => {
        //                 this.FormRegistro = resp.role;
        //                 this.tipoRol = this.FormRegistro.tipoRol || '';

        //                 if (this.FormRegistro.codigoAplicacion) {
        //                     const app = this.aplicaciones.find((x) => x.codigoAplicacion === this.FormRegistro.codigoAplicacion);
        //                     if (app) {
        //                         this.suitesFiltradas = this.suites.filter((x) => x.codigoAplicacion === app.codigoAplicacion);
        //                     }
        //                 }
        //             },
        //             error: (err) => {
        //                 this._swalAlertService.getAlertError(this.translate.instant('PLATAFORMA.NOEXISTE') + err);
        //             }
        //         });
        //     } else {
        //         this.modoEdicion = false;
        //     }
        // });
    }

    ngOnInit() {
        this._navigationService.getNavigationItems();
        this.menuItems = this._navigationService.menuItems$;
        this.aplicaciones = this._aplicacionesService.getBAplicacionesActuales();
        this.suites = this._suitesService.getSuitesActuales();
        this.usuarios = this._usuariosService.getUsuariosActuales();
        this.usuarios = this._usuariosService.getUsuariosActuales();
        console.log('datos usuarios', this.usuarios);
        this.usuario = this.usuarios.find(x => x.codigoUsuario == this.codigoUsuario) || {}
        console.log('datos usuario', this.usuario);
        this.tituloPagina = this.translate.instant('USUARIOS.USUARIOSROLES.GESTION.NEW') + ' ' + this.usuario.nombreUsuario;
        this.usuariosSC = this._usuariosSCService.getUsuariosSCActuales();
        this.usuariosRoles = this._usuariosRolesService.getUsuairosRolesActuales();
        // this.roles = this._rolesService.getRolesActuales().map(r => ({ ...r, checked: false }));
        this.tiposRoles = this._tiposRolesService.getTiposRolesActuales();
        this.suscriptores = this._suscriptoresService.getSuscriptoresActuales();
        // this.empresasSC = this._empresasSCService.getEmpresasSCActuales();
        this.empresasSC = [];
        this.roles = [];

        this.lockScreenSubscription = this._navigationService.lockScreenEvent$.subscribe({
            next: (message: string) => {
                this._localStorageService.setFormRegistro(this.FormRegistro);
                this.isLocked = true;
                this.lockMessage = message;
            }
        });

        const form = this._localStorageService.getFormRegistro();
        if (form != undefined) {
            this.FormRegistro = form;
            this._localStorageService.removeFormRegistro();
        }
        this.iniciarForm();
    }

    get esRolSuscriptor(): boolean {
        if (!this.tipoRol) return false;
        const tipo = this.tiposRoles.find(t => t.codigoTipoRole === this.tipoRol);

        return tipo?.nombreTipoRole?.toLowerCase().includes('suscriptor') ?? false;
    }

    iniciarForm() {
        this.FormRegistro.codigoSuscriptor = '';
        this.FormRegistro.codigoEmpresaSC = '';
        this.FormRegistro.codigoTipoRole = '';
        this.FormRegistro.codigoAplicacion = '';
        this.FormRegistro.codigoSuite = '';
        this.FormRegistro.codigoRole = '';
        console.log('formregistro', this.FormRegistro);

    }

    onSuscriptorChangeClick(event: any) {
        const codSuscriptor = event.target.value;
        console.log('codigo suscriptor', codSuscriptor);

        this.codigoSuscriptor = codSuscriptor;
        this.empresasSC = this._empresasSCService.getEmpresasSCActuales();
        const usuSC = this.usuariosSC.find(x => x.codigoSuscriptor == codSuscriptor && x.codigoUsuario == this.codigoUsuario);
        this.codigoUsuarioSC = usuSC?.codigoUsuarioSC || '';
        const empsSC = this.empresasSC.filter(x => x.codigoSuscriptor == this.codigoSuscriptor);
        this.empresasSC = empsSC;
        this.roles = [];
    }

    onEmpresaSCChangeClick(event: any) {
        const codEmpresaSC = event.target.value;
        this.codigoEmpresaSC = codEmpresaSC;
        console.log('empresas del suscriptor', codEmpresaSC);
    }

    onTipoRoleChangeClick(event: any) {
        this.FormRegistro.codigoAplicacion = '';
        this.FormRegistro.codigoSuite = '';
        this.codigoAplicacion = '';
        this.codigoSuite = '';
        this.roles = [];

        const codTipo = event.target.value;
        if (codTipo != 'todos') {
            this.tipoRol = codTipo;

            // Si el rol es global (Plataforma, no suscriptor), se consultan los roles de inmediato
            if (!this.esRolSuscriptor) {
                this.consultarRolesPorFiltro('', '', this.tipoRol);
            }
        }
    }

    onAplicacionchangeClick(event: any) {
        const codApp = event.target.value;
        this.FormRegistro.codigoSuite = '';
        this.codigoSuite = '';
        this.roles = [];

        if (codApp != '') {
            this.codigoAplicacion = codApp;
            this.suitesFiltradas = this.suites.filter(x => x.codigoAplicacion == codApp);
        } else {
            this.suitesFiltradas = this.suites;
        }
    }

    onSuiteChangeClick(event: any) {
        const codSuite = event.target.value;
        if (codSuite != '') {
            this.codigoSuite = codSuite;
            this.consultarRolesPorFiltro(this.codigoAplicacion, this.codigoSuite, this.tipoRol);
        } else {
            this.roles = [];
        }
    }

    consultarRolesPorFiltro(codApp: string, codSuite: string, codTipoId: string) {
        if (this.esRolSuscriptor && !this.codigoUsuarioSC) {
            this._swalAlertService.getAlertConfirmWarning('Debe seleccionar un suscriptor primero.');
            this.roles = [];
            return;
        }

        let rolesDisponibles = this._rolesService.getRolesActuales();

        // 1. Filtrar por UUID del Tipo de Role
        rolesDisponibles = rolesDisponibles.filter(r => r.codigoTipoRole === codTipoId);

        // 2. Filtrar por Aplicación y Suite (Solo si es requerido por el tipo de rol)
        if (this.esRolSuscriptor) {
            rolesDisponibles = rolesDisponibles.filter(r => r.codigoAplicacion === codApp && r.codigoSuite === codSuite);
        }

        // 3. Cruzar con roles existentes del usuario en memoria
        const rolesDelUsuario = this.usuariosRoles.filter((ur: any) => ur.codigoUsuarioSC === this.codigoUsuarioSC);
        const idsRolesAsignados = rolesDelUsuario.map((ur: any) => ur.codigoRole);

        // 4. Mapear y encender check
        this.roles = rolesDisponibles.map((rol: any) => {
            return {
                ...rol,
                checked: idsRolesAsignados.includes(rol.codigoRole)
            };
        });
    }

    btnAsociarTodosClick() {
        const todosSeleccionados = this.roles.every((rol) => rol.checked);
        this.roles.forEach((rol) => (rol.checked = !todosSeleccionados));
    }

    onRoleCheckChange(event: any, rol: any) {
        console.log(`Rol ${rol.nombreRole} cambiado a: ${rol.checked}`);
    }

    btnGestionarRegistroClick(form: any) {
        this.isSubmit = true;
        if (!form.valid) return;

        if (this.esRolSuscriptor && !this.codigoUsuarioSC) {
            this._swalAlertService.getAlertConfirmWarning('Debe seleccionar un suscriptor válido.');
            return;
        }

        const rolesSeleccionados = this.roles.filter(r => r.checked);

        if (rolesSeleccionados.length === 0) {
            this._swalAlertService.getAlertConfirmWarning('Debe seleccionar al menos un rol.');
            return;
        }

        this._loadingService.show();

        // 1. Extraemos TODOS los IDs de los roles actuales en pantalla (marcados y no marcados)
        // Esto le dirá al backend exactamente qué "grupo" de roles debe limpiar.
        const rolesContexto = this.roles.map(r => r.codigoRole);

        // 2. Limpiamos el objeto para que coincida exactamente con las columnas de PTLUsuariosRole

        const rolesParaGuardar = rolesSeleccionados.map(rol => ({
            codigoUsuarioRole: uuidv4(),
            codigoRole: rol.codigoRole,
            codigoUsuarioSC: this.codigoUsuarioSC,
            codigoEmpresaSC: this.codigoEmpresaSC,
            estadoUsuarioRole: true,
            codigoUsuarioCreacion: this._localStorageService.getUsuarioLocalStorage().codigoUsuario,
            fechaCreacion: new Date().toISOString()
        }));

        const payloadSync = {
            codigoUsuarioSC: this.codigoUsuarioSC,
            rolesContexto: rolesContexto,
            roles: rolesParaGuardar
        };

        this._registrosService.postSincronizarRoles(payloadSync).subscribe({
            next: (resp: any) => {
                if (resp.ok) {
                    this._swalAlertService.getAlertConfirmSuccess(this.translate.instant('PLATAFORMA.INSERTAR'));
                    this._loadingService.hide();
                    this.router.navigate(['/usuarios/roles-usuario']);
                }
            },
            error: (err: any) => {
                this._loadingService.hide();
                this._swalAlertService.getAlertError(this.translate.instant('PLATAFORMA.NOINSERTO'));
            }
        });
    }

    btnRegresarClick() {
        this.router.navigate(['/usuarios/roles-usuario']);
    }

    toggleNav(): void {
        this.toggleSidebar.emit();
    }
}
