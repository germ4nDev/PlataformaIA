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
    PtlEmpresasScService,
    PTLPaquetesSCService,
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
    retorno: number = 0

    suscriptores: PTLSuscriptorModel[] = []
    suitesApp: PTLSuiteAPModel[] = []
    empresaSC: PTLEmpresaSCModel[] = []
    empresaSCFiltradas: PTLEmpresaSCModel[] = []
    usuariosRoles: PTLUsuarioRoleAPModel[] = []
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
        private _usuariosSCService: PtlusuariosScService,
        private _empresasSCService: PtlEmpresasScService,
        private _usuariosEmpresasSCService: PtlusuariosEmpresasScService,
        private _paquetesSCService: PTLPaquetesSCService,
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

    // onLoginUserClick(): void {
    //     this.submitted = true;

    //     if (this.loginForm.invalid) {
    //         return;
    //     }

    //     this.error = '';
    //     this.loading = true;
    //     const userName = this.formValues?.['username']?.value;
    //     const password = this.formValues?.['password']?.value;

    //     this.loginSub = this._authenticationService.login(userName, password)
    //         .pipe(
    //             switchMap((respLogin: any) => {

    //                 if (!respLogin.ok) {
    //                     this._swalService.getAlertError(this.translate.instant('PLATAFORMA.USERNOTFOUND'));
    //                     return of(null);
    //                 }

    //                 this._localstorageService.setTokenLocalStorage(respLogin.token);
    //                 this.currentUser = this._localstorageService.getCurrentUserLocalStorage();
    //                 console.log('++++++++ usuario activo', this.currentUser);

    //                 return forkJoin({
    //                     respLogin: of(respLogin),
    //                     currentUser: of(this.currentUser),
    //                     // usuariosSC: this._usuariosSCService.cargarRegistros(),
    //                     // usuariosEmpresasSC: this._usuariosEmpresasSCService.cargarRegistros(),
    //                     // empresasSC: this._empresasSCService.cargarRegistros(),
    //                     // suscriptores: this._suscriptoresService.getRegistros(),
    //                     // paquetesSC: this._paquetesSCService.getPaquetesSCActuales()
    //                     usuariosSC: this._usuariosSCService.cargarRegistros().pipe(take(1)),
    //                     usuariosEmpresasSC: this._usuariosEmpresasSCService.cargarRegistros().pipe(take(1)),
    //                     empresasSC: this._empresasSCService.cargarRegistros().pipe(take(1)),
    //                     suscriptores: this._suscriptoresService.getRegistros().pipe(take(1)),
    //                     paquetesSC: this._paquetesSCService.cargarRegistros().pipe(take(1))
    //                 });
    //             }),
    //             tap((data: any) => {
    //                 this.loading = false;
    //                 console.log('++++++++ datos forkjoin', data);

    //                 if (!data) return;

    //                 const listaUsuariosSC = data.usuariosSC.usuariosSC || data.usuariosSC.usuarios || data.usuariosSC;
    //                 const listaUsuariosEmpresasSC = data.usuariosEmpresasSC.usuariosEmpresasSC || data.usuariosEmpresasSC;
    //                 const listaEmpresasSC = data.empresasSC.empresasSC || data.empresasSC.empresas || data.empresasSC;
    //                 const listaSuscriptores = data.suscriptores.suscriptores || data.suscriptores;
    //                 const listaPaquetesSC = data.paquetesSC;

    //                 const suscUsu = listaUsuariosSC.filter((x: any) => x.codigoUsuario === data.currentUser.usuario?.codigoUsuario);

    //                 if (suscUsu.length > 0) {
    //                     suscUsu.forEach((usuSC: any) => {

    //                         const suscs = listaSuscriptores.filter((x: any) => x.codigoSuscriptor === usuSC.codigoSuscriptor);
    //                         const usuEmps = listaUsuariosEmpresasSC.filter((x: any) => x.codigoUsuarioSC === usuSC.codigoUsuarioSC);

    //                         usuEmps.forEach((usuEmp: any) => {
    //                             const emp = listaEmpresasSC.find((x: any) => x.codigoEmpresaSC === usuEmp.codigoEmpresaSC);
    //                             usuEmp.empresa = emp || null;
    //                         });

    //                         suscs.forEach((susc: any) => {
    //                             susc.empresasAsignadas = usuEmps;
    //                         });

    //                         usuSC.suscriptores = suscs;
    //                     });
    //                 }

    //                 this.currentUser.usuariosSC = suscUsu;
    //                 this._localstorageService.setCurrentUserLocalStorage(this.currentUser);

    //                 console.log('¡Estructura anidada en Suscriptores exitosamente!', this.currentUser);
    //                 this.router.navigate(['/starter/inicio-suscriptores']);
    //             }),
    //             catchError(err => {
    //                 this.loading = false;
    //                 this.error = err;
    //                 this._swalService.getAlertError(this.translate.instant('PLATAFORMA.LOGINFAILED'));
    //                 return of(null);
    //             })
    //         )
    //         .subscribe();
    // }
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
                        paquetesSC: this._paquetesSCService.cargarRegistros().pipe(take(1))
                    });
                }),
                tap((data: any) => {
                    this.loading = false;
                    console.log('++++++++ datos forkjoin', data);

                    if (!data) return;

                    const listaUsuariosSC = data.usuariosSC.usuariosSC || data.usuariosSC.usuarios || data.usuariosSC;
                    const listaUsuariosEmpresasSC = data.usuariosEmpresasSC.usuariosEmpresasSC || data.usuariosEmpresasSC;
                    const listaEmpresasSC = data.empresasSC.empresasSC || data.empresasSC.empresas || data.empresasSC;
                    const listaSuscriptores = data.suscriptores.suscriptores || data.suscriptores;
                    const listaPaquetesSC = data.paquetesSC;

                    const suscUsu = listaUsuariosSC.filter((x: any) => x.codigoUsuario === data.currentUser.usuario?.codigoUsuario);


                    if (suscUsu.length > 0) {
                        suscUsu.forEach((usuSC: any) => {
                            const usuEmps = listaUsuariosEmpresasSC.filter((x: any) => x.codigoUsuarioSC === usuSC.codigoUsuarioSC);

                            usuEmps.forEach((usuEmp: any) => {
                                const emp = listaEmpresasSC.find((x: any) => x.codigoEmpresaSC === usuEmp.codigoEmpresaSC);
                                usuEmp.empresa = emp || null;
                            });

                            usuSC.empresasAsignadas = usuEmps;
                            const suscs = listaSuscriptores.filter((x: any) => x.codigoSuscriptor === usuSC.codigoSuscriptor);

                            suscs.forEach((susc: any) => {
                                // 1. Anidamos las empresas

                                // 🟢 2. AQUÍ FILTRAMOS Y ANIDAMOS LOS PAQUETES ACTIVOS
                                susc.paquetesActivos = listaPaquetesSC.filter((paq: any) =>
                                    paq.codigoSuscriptor === susc.codigoSuscriptor &&
                                    paq.estadoLicencia === true
                                );
                            });

                            usuSC.suscriptores = suscs;
                        });
                    }

                    this.currentUser.usuariosSC = suscUsu;
                    this._localstorageService.setCurrentUserLocalStorage(this.currentUser);

                    console.log('¡Estructura anidada en Suscriptores exitosamente!', this.currentUser);
                    this.router.navigate(['/starter/inicio-suscriptores']);
                }),
                catchError(err => {
                    this.loading = false;
                    this.error = err;
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
