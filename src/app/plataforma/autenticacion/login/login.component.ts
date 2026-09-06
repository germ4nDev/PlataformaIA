/* eslint-disable @typescript-eslint/no-explicit-any */
// Angular import
import { Component, OnInit, OnDestroy } from '@angular/core'
import { CommonModule } from '@angular/common'
import { RouterModule, Router, ActivatedRoute } from '@angular/router'
import { FormBuilder, FormGroup, FormsModule, Validators } from '@angular/forms'
import { TranslateModule, TranslateService } from '@ngx-translate/core'
import { SharedModule } from 'src/app/theme/shared/shared.module'
import { LanguageSelectorComponent } from 'src/app/theme/shared/components/language-selector/language-selector.component'
import { FullScreenSliderComponent } from 'src/app/theme/shared/components/fullscreen-slider/fullscreen-slider.component'
import { PTLSuscriptorModel } from 'src/app/theme/shared/_helpers/models/PTLSuscriptor.model'
import { PTLUsuarioSCModel } from 'src/app/theme/shared/_helpers/models/PTLUsuarioSC.model'
import { PTLEmpresaSCModel } from 'src/app/theme/shared/_helpers/models/PTLEmpresaSC.model'
import { PTLUsuarioModel } from 'src/app/theme/shared/_helpers/models/PTLUsuario.model'
import { Subscription } from 'rxjs'
import {
    AuthenticationService,
    LanguageService,
    LocalStorageService,
    PtlactividadesRolesService,
    PtlActividadesService,
    PtlEmpresasScService,
    PTLPaquetesSCService,
    PTLRolesAPService,
    PTLSuscriptoresService,
    PtlusuariosEmpresasScService,
    PtlusuariosScService,
    SwalAlertService,
    ThemeService
} from 'src/app/theme/shared/service'
import { SocialNetworksComponent } from 'src/app/theme/shared/components/social-networks/social-networks.component'
import { PTLIdioma } from 'src/app/theme/shared/_helpers/models/PTLIdioma.model'
import { PTLSuiteAPModel } from 'src/app/theme/shared/_helpers/models/PTLSuiteAP.model'
import { PTLUsuaioEmpresasSCModel } from 'src/app/theme/shared/_helpers/models/PTLUsuarioEmpresaSC.model'
import { PTLUsuarioRoleAPModel } from 'src/app/theme/shared/_helpers/models/PTLUsuarioRole.model'
import { PTLRoleAPModel } from 'src/app/theme/shared/_helpers/models/PTLRoleAP.model'
import { catchError, tap, switchMap, map } from 'rxjs/operators';
import { of, forkJoin, take } from 'rxjs';
import { CurrentUserModel } from 'src/app/theme/shared/_helpers/models/CurrentUser.model'
import { PTLModuloPQModel } from 'src/app/theme/shared/_helpers/models/PTLModuloPQ.model'
import { PTLModulosPaqueteService } from 'src/app/theme/shared/service/ptlmodulos-paquete.service'
import { PtlusuariosRolesApService } from '../../../theme/shared/service/ptlusuarios-roles-ap.service';
import { PtlPermisosService } from 'src/app/theme/shared/service/ptlpermisos.service'

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        RouterModule,
        LanguageSelectorComponent,
        SharedModule,
        TranslateModule,
        FullScreenSliderComponent,
        SocialNetworksComponent
    ],
    templateUrl: './login.component.html',
    styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit, OnDestroy {
    //#region VARIABLES
    currentUser: CurrentUserModel = new CurrentUserModel();
    registrosSub?: Subscription
    registros: PTLSuscriptorModel[] = []
    usuariosSCSub?: Subscription
    usuariosSC: PTLUsuarioSCModel[] = []
    usuariosSub?: Subscription
    usuarios: PTLUsuarioModel[] = []
    empresasSCSub?: Subscription
    empresasSC: PTLEmpresaSCModel[] = []
    modulosPQ: PTLModuloPQModel[] = []
    usuariosRoles: PTLUsuarioRoleAPModel[] = []
    retorno: number = 0

    suscriptores: PTLSuscriptorModel[] = []
    suitesApp: PTLSuiteAPModel[] = []
    empresaSC: PTLEmpresaSCModel[] = []
    empresaSCFiltradas: PTLEmpresaSCModel[] = []
    mostrarSeleccionRoles: boolean = false
    usuarioEmpresaSC: PTLUsuaioEmpresasSCModel[] = []
    roles: PTLRoleAPModel[] = []

    loginForm!: FormGroup
    loginSub?: Subscription
    usernameValue: string = ''
    userPassword: string = ''
    returnUrl!: string
    error: string = ''
    loading: boolean = false
    submitted: boolean = false
    remember: boolean = false
    idiomas: PTLIdioma[] = []
    showPassword = false // Variable reactiva para el ícono del ojo
    //#endregion VARIABLES

    constructor(
        private formBuilder: FormBuilder,
        private route: ActivatedRoute,
        private router: Router,
        private translate: TranslateService,
        private _localstorageService: LocalStorageService,
        private _swalService: SwalAlertService,
        private _themeService: ThemeService,
        private _suscriptoresService: PTLSuscriptoresService,
        private _localStorageService: LocalStorageService,
        private _actividadesService: PtlActividadesService,
        private _usuariosSCService: PtlusuariosScService,
        private _empresasSCService: PtlEmpresasScService,
        private _usuariosEmpresasSCService: PtlusuariosEmpresasScService,
        private _usuariosRolesService: PtlusuariosRolesApService,
        private _rolesService: PTLRolesAPService,
        private _paquetesSCService: PTLPaquetesSCService,
        private _modulosPaqueteService: PTLModulosPaqueteService,
        private _permisosService: PtlPermisosService,
        private _languagesService: LanguageService,
        private _authenticationService: AuthenticationService
    ) {
        this.translate.use(localStorage.getItem('lang') || 'es')
        if (this._authenticationService.currentUserValue) {
            //    this.router.navigate(['/dashboard/analytics']);
        }
    }

    ngOnInit() {
        this.loginForm = this.formBuilder.group({
            username: ['', Validators.required],
            password: ['', Validators.required]
        })
        this.returnUrl = this.route.snapshot.queryParams['returnUrl']
        this.idiomas = this._languagesService.getRegistrosActuales()
        console.log('idiomas actuales', this.idiomas)
    }

    ngOnDestroy() {
        this.loginSub?.unsubscribe()
    }

    get formValues() {
        return this.loginForm.controls
    }

    get usernameControl() {
        return this.loginForm.get('username')
    }

    get passwordControl() {
        return this.loginForm.get('password')
    }

    togglePasswordVisibility() {
        this.showPassword = !this.showPassword;
    }

    onLoginUserClick(): void {
        this.submitted = true;

        if (this.loginForm.invalid) {
            return;
        }

        this.error = '';
        this.loading = true;
        const userName = this.formValues?.['username']?.value;
        const password = this.formValues?.['password']?.value;

        this.loginSub = this._authenticationService.login(userName, password)
            .pipe(
                switchMap((respLogin: any) => {

                    if (!respLogin.ok) {
                        this._swalService.getAlertError(this.translate.instant('PLATAFORMA.USERNOTFOUND'));
                        return of(null);
                    }

                    this._localstorageService.setTokenLocalStorage(respLogin.token);
                    this.currentUser = this._localstorageService.getCurrentUserLocalStorage();
                    console.log('++++++++ usuario activo', this.currentUser);

                    return forkJoin({
                        respLogin: of(respLogin),
                        currentUser: of(this.currentUser),
                        usuariosSC: this._usuariosSCService.cargarRegistros().pipe(take(1)),
                        usuariosEmpresasSC: this._usuariosEmpresasSCService.cargarRegistros().pipe(take(1)),
                        empresasSC: this._empresasSCService.cargarRegistros().pipe(take(1)),
                        suscriptores: this._suscriptoresService.getRegistros().pipe(take(1)),
                        paquetesSC: this._paquetesSCService.cargarRegistros().pipe(take(1)),
                        modulosPQ: this._modulosPaqueteService.cargarRegistros().pipe(take(1)),
                        usuariosRoles: this._usuariosRolesService.cargarRegistros().pipe(take(1)),
                        rolesMaestros: this._rolesService.cargarRegistros().pipe(take(1))
                    });
                }),
                tap((data: any) => {
                    this.loading = false;
                    console.log('++++++++ datos forkjoin', data);

                    if (!data) return;

                    const listaUsuariosSC = data.usuariosSC.usuariosSC || data.usuariosSC.usuarios || data.usuariosSC || [];
                    const listaUsuariosEmpresasSC = data.usuariosEmpresasSC.usuariosEmpresasSC || data.usuariosEmpresasSC || [];
                    const listaEmpresasSC = data.empresasSC.empresasSC || data.empresasSC.empresas || data.empresasSC || [];
                    const listaSuscriptores = data.suscriptores.suscriptores || data.suscriptores || [];
                    const listaPaquetesSC = data.paquetesSC.paquetesSC || data.paquetesSC || [];
                    const listaModulosPQ = data.modulosPQ.modulosPQ || data.modulosPQ || [];
                    const listaUsuarioRoles = data.usuariosRoles.usuariosRoles || data.usuariosRoles.usuarioRole || data.usuariosRoles || [];
                    const listaRolesMaestros = data.rolesMaestros.roles || data.rolesMaestros.data || data.rolesMaestros || [];

                    const suscUsu = listaUsuariosSC.filter((x: any) => x.codigoUsuario === data.currentUser.usuario?.codigoUsuario);

                    if (suscUsu.length > 0) {
                        suscUsu.forEach((usuSC: any) => {

                            const suscs = listaSuscriptores.filter((x: any) => x.codigoSuscriptor === usuSC.codigoSuscriptor);

                            suscs.forEach((susc: any) => {

                                const usuEmps = listaUsuariosEmpresasSC.filter((x: any) => x.codigoUsuarioSC === usuSC.codigoUsuarioSC);
                                const empresasDeEsteSuscriptor: any[] = [];

                                usuEmps.forEach((usuEmp: any) => {
                                    const emp = listaEmpresasSC.find((x: any) => x.codigoEmpresaSC === usuEmp.codigoEmpresaSC);

                                    if (emp && emp.codigoSuscriptor === susc.codigoSuscriptor) {
                                        usuEmp.empresa = emp;

                                        const rolesDeEstaEmpresa = listaUsuarioRoles.filter((rol: any) =>
                                            rol.codigoUsuarioSC === usuSC.codigoUsuarioSC &&
                                            rol.codigoEmpresaSC === emp.codigoEmpresaSC &&
                                            rol.estadoUsuarioRole === true
                                        );

                                        const rolesEnriquecidos = rolesDeEstaEmpresa.map((rolUsuario: any) => {
                                            const detalleRol = listaRolesMaestros.find((r: any) => r.codigoRole === rolUsuario.codigoRole);

                                            return {
                                                ...rolUsuario,
                                                detalleRole: detalleRol || null,
                                                nombreRolLegible: detalleRol ? detalleRol.nombreRole : 'DESCONOCIDO'
                                            };
                                        });

                                        usuEmp.rolesAsignados = rolesEnriquecidos;
                                        empresasDeEsteSuscriptor.push(usuEmp);
                                    }
                                });

                                susc.empresasAsignadas = empresasDeEsteSuscriptor;

                                susc.paquetesActivos = listaPaquetesSC.filter((paq: any) =>
                                    paq.codigoSuscriptor === susc.codigoSuscriptor &&
                                    paq.estadoLicencia === true
                                );

                                susc.paquetesActivos.forEach((paq: any) => {
                                    const mods = listaModulosPQ.filter((mod: any) =>
                                        mod.codigoPaquete === paq.codigoPaquete
                                    );
                                    paq.modulosPaquete = mods;
                                });
                            });

                            usuSC.suscriptores = suscs;
                        });
                    }

                    this.currentUser.usuariosSC = suscUsu;
                    this._localstorageService.setCurrentUserLocalStorage(this.currentUser);

                    console.log('✅ ¡Estructura de memoria (Tenant/Roles/Paquetes) armada exitosamente!', this.currentUser);

                    this._permisosService.inicializarPermisosPorDefecto().subscribe({
                        next: (actividades) => {
                            console.log('🛡️ Permisos (UI/Rutas) cacheados exitosamente. Actividades:', actividades.length);
                            this.router.navigate(['/starter/inicio-suscriptores']);
                        },
                        error: (err) => {
                            console.error('⚠️ Error al cachear permisos, navegando con modo restringido.', err);
                            this.router.navigate(['/starter/inicio-suscriptores']);
                        }
                    });
                }),
                catchError(err => {
                    this.loading = false;
                    this.error = err;
                    console.error('Error en el Login:', err);
                    this._swalService.getAlertError(this.translate.instant('PLATAFORMA.LOGINFAILED'));
                    return of(null);
                })
            )
            .subscribe();
    }

    onChangePasswordClick() {
        this.router.navigate(['/autenticacion/change-password'])
    }

    onResetPasswordClick() {
        this.router.navigate(['/autenticacion/reset-password'])
    }

    toggleTheme() {
        this._themeService.toggleDarkTheme()
    }
}
