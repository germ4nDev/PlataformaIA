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
import { TextEditorComponent } from 'src/app/theme/shared/components/text-editor/text-editor.component';
import {
    LocalStorageService,
    PtllogActividadesService,
    PtlusuariosRolesApService,
    PTLUsuariosService,
    SwalAlertService
} from 'src/app/theme/shared/service';
import { PTLUsuarioModel } from 'src/app/theme/shared/_helpers/models/PTLUsuario.model';
import { PTLUsuarioRoleAPModel } from 'src/app/theme/shared/_helpers/models/PTLUsuarioRole.model';
import { PTLTiposRolesService } from 'src/app/theme/shared/service/ptltipos-roles.service';
import { PTLSuiteAPModel } from 'src/app/theme/shared/_helpers/models/PTLSuiteAP.model';
import { PTLTiposRoleModel } from 'src/app/theme/shared/_helpers/models/PTLTiposRole.model';
//#endregion IMPORTS

@Component({
    selector: 'app-gestion-roles',
    standalone: true,
    imports: [CommonModule, SharedModule, TranslateModule, NavBarComponent, NavContentComponent, TextEditorComponent],
    templateUrl: './gestion-roles.component.html',
    styleUrl: './gestion-roles.component.scss'
})
export class GestionRolesComponent implements OnInit {
    @Output() toggleSidebar = new EventEmitter<void>();
    menuItems!: Observable<NavigationItem[]>;
    lockScreenSubscription: Subscription | undefined;
    isLocked: boolean = false;
    lockMessage: string = '';
    tipoRolSeleccionado: string = '';
    codigoRole: string = '';

    FormRegistro: PTLRoleAPModel = new PTLRoleAPModel();
    usuarios: PTLUsuarioModel[] = [];
    aplicaciones: PTLAplicacionModel[] = [];
    registrosSub?: Subscription;
    suitesSub?: Subscription;
    suites: PTLSuiteAPModel[] = [];
    suitesApp: PTLSuiteAPModel[] = [];
    tiposRole: PTLTiposRoleModel[] = [];
    form: undefined;
    isSubmit: boolean = false;
    modoEdicion: boolean = false;
    isTipoRole: boolean = false;
    codeRole = uuidv4();
    tipoEditorTexto = 'basica';

    constructor(
        private router: Router,
        private route: ActivatedRoute,
        private translate: TranslateService,
        private _logActividadesService: PtllogActividadesService,
        private _navigationService: NavigationService,
        private _registrosService: PTLRolesAPService,
        private _aplicacionesService: PtlAplicacionesService,
        private _suitesService: PtlSuitesAPService,
        private _usuariosService: PTLUsuariosService,
        private _usuariosRolesService: PtlusuariosRolesApService,
        private _tiposRolesService: PTLTiposRolesService,
        private _localStorageService: LocalStorageService,
        private _swalAlertService: SwalAlertService
    ) {
        this.isSubmit = false;
        const registroId = this._localStorageService.getObject<string>('regId') || ''
        if (registroId != 'nuevo') {
            this.modoEdicion = true
            this._registrosService.getRegistroById(registroId).subscribe({
                next: (resp: any) => {
                    console.log('resp', resp);
                    this.FormRegistro = resp.role;
                    this.codigoRole = resp.role.codigoRole;
                },
                error: (err) => {
                    const logData = {
                        codigoTipoLog: '',
                        codigoRespuesta: '501',
                        descripcionLog: this.translate.instant('PLATAFORMA.NOMODIFICO') + err.mensaje
                    };
                    this._logActividadesService.postCrearRegistro(logData).subscribe(() => console.log('log creado exitosamente'));
                    this._swalAlertService.getAlertError(this.translate.instant('PLATAFORMA.NOEXISTE') + err);
                }
            });
        } else {
            // console.log('no llena el Id', registroId);
            this.modoEdicion = false
        }
    }

    ngOnInit() {
        this._navigationService.getNavigationItems();
        this.menuItems = this._navigationService.menuItems$;
        this.aplicaciones = this._aplicacionesService.getBAplicacionesActuales();
        this.usuarios = this._usuariosService.getUsuariosActuales();
        this.tiposRole = this._tiposRolesService.getTiposRolesActuales();
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
        if (!this.modoEdicion) {
            this.FormRegistro.codigoTipoRole = '';
            this.FormRegistro.codigoAplicacion = '';
            this.FormRegistro.codigoSuite = '';
            this.FormRegistro.codigoRole = uuidv4();
            this.FormRegistro.nombreRole = '';
        }
    }

    onAplicacionchangeClick(event: any) {
        const value = event.target.value;
        const app = this.aplicaciones.filter((x) => x.codigoAplicacion == value)[0];
        this.FormRegistro.codigoAplicacion = value;
        const suites = this._suitesService.getSuitesActuales();
        this.suites = suites.filter((x) => x.codigoAplicacion == app.codigoAplicacion);
    }

    onTipoRoleChangeClick(event: any) {
        const value = event.target.value;
        this.isTipoRole = value != '661b4eff-c9e6-43ad-b6bb-c47db2b26rn8' ? true : false;
    }

    onSuiteChangeClick(event: any) {
        const value = event.target.value;
        const suite = this.suites.filter((x) => x.codigoSuite == value)[0];
        this.FormRegistro.codigoSuite = suite.codigoSuite || '';
    }

    actualizarDescripcionVersion(nuevoContenido: string): void {
        this.FormRegistro.descripcionRole = nuevoContenido;
        // console.log('Descripción de versión actualizada:', this.FormRegistro.descripcionRole);
    }

    btnGestionarRegistroClick(form: any) {
        this.isSubmit = true;

        // const usuariosSeleccionados = this.usuarios.filter((u) => u.checked);
        // const usuariosAProcesar = this.usuarios.filter((u) => u.checked);
        // console.log('------------QUE ME TRAE USUARIO A PROCESAR------', usuariosAProcesar);

        if (!form.valid) return;

        // if (usuariosAProcesar.length === 0) {
        //     this._swalAlertService.getAlertError('Debe seleccionar al menos un usuario.');
        //     return;
        // }

        const registroData = form.value as PTLRoleAPModel;

        if (!this.isTipoRole) {
            registroData.codigoAplicacion = '';
            registroData.codigoSuite = '';
        }
        // const datosParaRelacion = {
        //     ...registroData,
        //     codigoTipoRole: this.FormRegistro.codigoTipoRole
        // };
        // console.log('usuariosAProcesar', usuariosAProcesar);
        // console.log('datosParaRelacion', datosParaRelacion);

        if (this.modoEdicion) {
            registroData.codigoRole = this.codigoRole;
            registroData.codigoUsuarioModificacion = this._localStorageService.getUsuarioLocalStorage().codigoUsuario;
            registroData.fechaModificacion = new Date().toISOString();

            console.log('registroData', registroData);
            this._registrosService.putModificarRegistro(registroData).subscribe({
                next: (resp: any) => {
                    if (resp.ok) {
                        // this.procesarRelaciones(registroData.codigoRole!);
                        // this.procesarRelaciones(registroData.codigoRole!, usuariosAProcesar, datosParaRelacion);
                        const logData = {
                            codigoTipoLog: '',
                            codigoRespuesta: '201',
                            descripcionLog: this.translate.instant('PLATAFORMA.INSERTAR')
                        };
                        this._logActividadesService.postCrearRegistro(logData).subscribe(() => console.log('log creado exitosamente'));
                        this._swalAlertService.getAlertSuccess(this.translate.instant('PLATAFORMA.INSERTAR'));
                        this.router.navigate(['/usuarios/roles']);
                    }
                },
                error: (err: any) => {
                    console.error(err);
                    const logData = {
                        codigoTipoLog: '',
                        codigoRespuesta: '501',
                        descripcionLog: this.translate.instant('PLATAFORMA.NOMODIFICO') + err.mensaje
                    };
                    this._logActividadesService.postCrearRegistro(logData).subscribe(() => console.log('log creado exitosamente'));
                    this._swalAlertService.getAlertError(this.translate.instant('PLATAFORMA.NOMODIFICO') + err);
                }
            });
        } else {
            // --- LÓGICA DE CREACIÓN ---
            registroData.codigoRole = uuidv4();
            registroData.codigoTipoRole = this.FormRegistro.codigoTipoRole;
            registroData.codigoAplicacion = this.FormRegistro.codigoAplicacion;
            registroData.codigoSuite = this.FormRegistro.codigoSuite;
            registroData.nombreRole = this.FormRegistro.nombreRole;
            registroData.descripcionRole = this.FormRegistro.descripcionRole;
            registroData.estadoRole = this.FormRegistro.estadoRole;
            registroData.fechaCreacion = new Date().toISOString();
            registroData.codigoUsuarioCreacion = this._localStorageService.getUsuarioLocalStorage().codigoUsuario;
            console.log('datos para insertar', registroData);

            this._registrosService.postCrearRegistro(registroData).subscribe({
                next: (resp: any) => {
                    if (resp.ok) {
                        // this.procesarRelaciones(registroData.codigoRole || '');
                        // this.procesarRelaciones(registroData.codigoRole || '', usuariosAProcesar, datosParaRelacion);
                        const logData = {
                            codigoTipoLog: '',
                            codigoRespuesta: '201',
                            descripcionLog: this.translate.instant('PLATAFORMA.MODIFICAR')
                        };
                        this._logActividadesService.postCrearRegistro(logData).subscribe(() => console.log('log creado exitosamente'));
                        this._swalAlertService.getAlertSuccess(this.translate.instant('PLATAFORMA.INSERTAR'));
                        form.resetForm();
                        this.isSubmit = false;
                        this.router.navigate(['/usuarios/roles']);
                    }
                },
                error: (err: any) => {
                    const logData = {
                        codigoTipoLog: '',
                        codigoRespuesta: '501',
                        descripcionLog: this.translate.instant('PLATAFORMA.NOMODIFICO')
                    };
                    this._logActividadesService.postCrearRegistro(logData).subscribe(() => console.log('log creado error'));
                    this._swalAlertService.getAlertError(this.translate.instant('PLATAFORMA.NOMODIFICO') + err);
                }
            });
        }
    }

    procesarRelaciones(codigoRole: string, usuariosSeleccionados: any[], datosCompletos: any) {
        console.log('usuarios seleccionados', usuariosSeleccionados);

        // this._usuariosRolesService.deleteTodosUsuarioRole(codigoRole).subscribe({
        //   next: (resp: any) => {
        //     // console.log('++++++QUEMETRAEEUSAURIOSESELECCIONADOS++++', usuariosSeleccionados)
        //     usuariosSeleccionados.forEach((usuario) => {
        //       const nuevaRelacion = {
        //         codigoUsuarioSC: usuario.codigoUsuario,
        //         codigoEmpresaSC: '',
        //         codigoRole: codigoRole,
        //         codigoAplicacion: datosCompletos.codigoAplicacion || '',
        //         codigoSuite: datosCompletos.codigoSuite || '',
        //         tipoRol: datosCompletos.tipoRol,
        //         estadoUsuarioRole: true,
        //         // Auditoría
        //         codigoUsuarioCreacion: this._localStorageService.getUsuarioLocalStorage().codigoUsuario,
        //         fechaCreacion: new Date().toISOString(),
        //         codigoUsuarioModificacion: this._localStorageService.getUsuarioLocalStorage().codigoUsuario,
        //         fechaModificacion: new Date().toISOString()
        //       };

        //       // Enviamos la inserción al servicio
        //       this._usuariosRolesService.postUsuarioRole(nuevaRelacion).subscribe({
        //         next: () => console.log(`Usuario ${usuario.nombreUsuario} asociado correctamente`),
        //         error: (err) => console.error('Error asociando usuario', err)
        //       });
        //     });
        //   },
        //   error: (err) => {
        //     console.error('Error al intentar limpiar relaciones previas', err);
        //   }
        // });
    }

    btnRegresarClick() {
        this.router.navigate(['/usuarios/roles']);
    }

    toggleNav(): void {
        this.toggleSidebar.emit();
    }
}
