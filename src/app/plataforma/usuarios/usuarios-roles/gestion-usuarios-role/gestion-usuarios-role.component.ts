/* eslint-disable @typescript-eslint/no-explicit-any */
//#region IMPORTS
import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { SharedModule } from 'src/app/theme/shared/shared.module';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { NavBarComponent } from 'src/app/theme/layout/admin/nav-bar/nav-bar.component';
import { NavContentComponent } from 'src/app/theme/layout/admin/navigation/nav-content/nav-content.component';
import { v4 as uuidv4 } from 'uuid';
import { Observable, Subscription } from 'rxjs';
import {
    NavigationService,
    LocalStorageService,
    PtllogActividadesService,
    PtlusuariosRolesApService,
    SwalAlertService,
    PTLUsuariosService,
    PtlusuariosScService,
    PTLSuscriptoresService,
    PtlEmpresasScService,
    PTLRolesAPService,
    PtlusuariosEmpresasScService
} from 'src/app/theme/shared/service';
import { LoadingService } from 'src/app/theme/shared/service/loading.service';
import { NavigationItem } from 'src/app/theme/shared/_helpers/models/Navigation.model';
import { PTLUsuarioRoleAPModel } from 'src/app/theme/shared/_helpers/models/PTLUsuarioRole.model';
import { PTLUsuarioModel } from 'src/app/theme/shared/_helpers/models/PTLUsuario.model';
import { PTLUsuarioSCModel } from 'src/app/theme/shared/_helpers/models/PTLUsuarioSC.model';
import { PTLSuscriptorModel } from 'src/app/theme/shared/_helpers/models/PTLSuscriptor.model';
import { PTLEmpresaSCModel } from 'src/app/theme/shared/_helpers/models/PTLEmpresaSC.model';
import { PTLRoleAPModel } from 'src/app/theme/shared/_helpers/models/PTLRoleAP.model';
import { PTLUsuaioEmpresasSCModel } from 'src/app/theme/shared/_helpers/models/PTLUsuarioEmpresaSC.model';
//#endregion IMPORTS

@Component({
    selector: 'app-gestion-usuarios-role',
    standalone: true,
    imports: [CommonModule, SharedModule, TranslateModule, NavBarComponent, NavContentComponent],
    templateUrl: './gestion-usuarios-role.component.html',
    styleUrl: './gestion-usuarios-role.component.scss'
})
export class GestionUsuariosRoleComponent implements OnInit {
    @Output() toggleSidebar = new EventEmitter<void>();
    menuItems!: Observable<NavigationItem[]>;

    lockScreenSubscription: Subscription | undefined;
    isLocked: boolean = false;
    lockMessage: string = '';
    tituloPagina: string = '';

    // Variables de pivote y datos base
    codigoRoleBase: string = '';
    rolActual: PTLRoleAPModel = new PTLRoleAPModel();

    usuarios: PTLUsuarioModel[] = [];
    usuariosSC: PTLUsuarioSCModel[] = [];
    empresasSC: PTLEmpresaSCModel[] = [];
    usuariosEmpresasSC: PTLUsuaioEmpresasSCModel[] = [];
    usuariosRoles: PTLUsuarioRoleAPModel[] = [];
    suscriptores: PTLSuscriptorModel[] = [];
    roles: PTLRoleAPModel[] = [];

    usuariosMostrados: any[] = []; // Lista dinámica cruzada con .checked

    isSubmit: boolean = false;
    codigoSuscriptor: string = '';
    codigoEmpresaSC: string = '';

    constructor(
        private router: Router,
        private route: ActivatedRoute,
        private translate: TranslateService,
        private _logActividadesService: PtllogActividadesService,
        private _navigationService: NavigationService,
        private _localStorageService: LocalStorageService,
        private _swalAlertService: SwalAlertService,
        private _registrosService: PtlusuariosRolesApService,
        private _usuariosService: PTLUsuariosService,
        private _usuariosSCService: PtlusuariosScService,
        private _usuariosEmpresasSCService: PtlusuariosEmpresasScService,
        private _suscriptoresService: PTLSuscriptoresService,
        private _empresasSCService: PtlEmpresasScService,
        private _rolesService: PTLRolesAPService,
        private _loadingService: LoadingService,
    ) {
        this.isSubmit = false;
        this.codigoRoleBase = this._localStorageService.getObject<string>('regId') || '';
    }

    ngOnInit() {
        this._navigationService.getNavigationItems();
        this.menuItems = this._navigationService.menuItems$;

        // Carga de Data Maestra
        this.usuarios = this._usuariosService.getUsuariosActuales();
        this.usuariosSC = this._usuariosSCService.getUsuariosSCActuales();
        this.usuariosEmpresasSC = this._usuariosEmpresasSCService.getUsuariosEmpresasSCActuales();
        this.usuariosRoles = this._registrosService.getUsuairosRolesActuales();
        this.suscriptores = this._suscriptoresService.getSuscriptoresActuales();
        this.roles = this._rolesService.getRolesActuales();
        this.empresasSC = [];

        // Configurar Título con el Rol Base
        this.rolActual = this.roles.find(x => x.codigoRole === this.codigoRoleBase) || new PTLRoleAPModel();
        this.tituloPagina = `Asignar Usuarios al Rol: ${this.rolActual.nombreRole || 'Desconocido'}`;

        this.lockScreenSubscription = this._navigationService.lockScreenEvent$.subscribe({
            next: (message: string) => {
                this.isLocked = true;
                this.lockMessage = message;
            }
        });
    }

    onSuscriptorChangeClick(event: any) {
        const codSuscriptor = event.target.value;
        this.codigoSuscriptor = codSuscriptor;

        // Filtrar empresas del suscriptor
        const allEmpresas = this._empresasSCService.getEmpresasSCActuales();
        this.empresasSC = allEmpresas.filter(x => x.codigoSuscriptor === this.codigoSuscriptor);

        this.codigoEmpresaSC = ''; // Reiniciar empresa al cambiar suscriptor
        this.consultarUsuariosPorFiltro();
    }

    onEmpresaSCChangeClick(event: any) {
        this.codigoEmpresaSC = event.target.value;
        this.consultarUsuariosPorFiltro();
    }

    consultarUsuariosPorFiltro() {
        if (!this.codigoSuscriptor) {
            this.usuariosMostrados = [];
            return;
        }

        // 1. Filtrar los perfiles de usuario (usuariosSC) por el Suscriptor
        let usuariosSCFiltrados = this.usuariosSC.filter(u => u.codigoSuscriptor === this.codigoSuscriptor);
        console.log('usuarios suscriptor', usuariosSCFiltrados);
        console.log('usuarios empresasSC', this.usuariosEmpresasSC);

        // 2. Filtrar por Empresa usando la tabla relacional (Triangulación de datos)
        if (this.codigoEmpresaSC) {
            // Encontramos todos los registros puente que pertenecen a la empresa seleccionada
            const relacionesDeLaEmpresa = this.usuariosEmpresasSC.filter(
                ue => ue.codigoEmpresaSC === this.codigoEmpresaSC
            );

            console.log('relaciones De La Empresa', relacionesDeLaEmpresa);
            // Extraemos solo los IDs (codigoUsuarioSC) de esos registros
            const idsUsuariosDeEmpresa = relacionesDeLaEmpresa.map(ue => ue.codigoUsuarioSC);

            console.log('ids Usuarios De Empresa', idsUsuariosDeEmpresa);
            // Filtramos la lista de usuariosSC dejando solo los que existan en ese arreglo de IDs
            usuariosSCFiltrados = usuariosSCFiltrados.filter(u =>
                idsUsuariosDeEmpresa.includes(u.codigoUsuarioSC)
            );
            console.log('usuariosSC Filtrados', usuariosSCFiltrados);
        }

        // 3. Extraer qué usuarios ya tienen este rol asignado en la BD
        const asignacionesDeEsteRol = this.usuariosRoles.filter(ur => ur.codigoRole === this.codigoRoleBase);
        const idsUsuariosConRol = asignacionesDeEsteRol.map(ur => ur.codigoUsuarioSC);

        // 4. Cruzar los datos para la interfaz (agregar check, nombre de usuario y correo)
        this.usuariosMostrados = usuariosSCFiltrados.map((usc: any) => {
            const dataBase = this.usuarios.find(u => u.codigoUsuario === usc.codigoUsuario);
            return {
                ...usc,
                nombreUsuario: dataBase ? dataBase.nombreUsuario : 'Desconocido',
                correoElectronico: dataBase ? dataBase.correoUsuario : 'Sin Correo',
                checked: idsUsuariosConRol.includes(usc.codigoUsuarioSC)
            };
        });
    }

    btnAsociarTodosClick() {
        const todosSeleccionados = this.usuariosMostrados.every((usu) => usu.checked);
        this.usuariosMostrados.forEach((usu) => (usu.checked = !todosSeleccionados));
    }

    onUsuarioCheckChange(event: any, usuario: any) {
        console.log(`Usuario ${usuario.nombreUsuario} cambiado a: ${usuario.checked}`);
    }

    btnGestionarRegistroClick() {
        this.isSubmit = true;

        if (!this.codigoRoleBase) {
            this._swalAlertService.getAlertConfirmWarning('No hay un rol base seleccionado.');
            return;
        }

        const usuariosSeleccionados = this.usuariosMostrados.filter(u => u.checked);

        if (usuariosSeleccionados.length === 0 && this.usuariosMostrados.length === 0) {
            this._swalAlertService.getAlertConfirmWarning('Debe buscar y seleccionar al menos un usuario.');
            return;
        }

        this._loadingService.show();

        // 1. Contexto visual: todos los usuarios listados tras el filtro
        const usuariosContexto = this.usuariosMostrados.map(u => u.codigoUsuarioSC);

        // 2. Limpiar y estructurar el payload para BulkInsert
        const relacionesParaGuardar = usuariosSeleccionados.map(usu => ({
            codigoUsuarioRole: uuidv4(),
            codigoRole: this.codigoRoleBase,
            codigoUsuarioSC: usu.codigoUsuarioSC,
            codigoEmpresaSC: this.codigoEmpresaSC || null,
            // Aplicación y Suite se heredan de lo que tiene el rol base configurado, o null si es general
            codigoAplicacion: this.rolActual.codigoAplicacion || null,
            codigoSuite: this.rolActual.codigoSuite || null,
            estadoUsuarioRole: true,
            codigoUsuarioCreacion: this._localStorageService.getUsuarioLocalStorage().codigoUsuario,
            fechaCreacion: new Date().toISOString()
        }));

        const payloadSync = {
            codigoRole: this.codigoRoleBase,
            usuariosContexto: usuariosContexto,
            relaciones: relacionesParaGuardar
        };

        // 3. Ejecutar sincronización
        // NOTA: Asegúrate de tener declarado postSincronizarUsuariosRol en tu servicio
        this._registrosService.postSincronizarUsuariosRol(payloadSync).subscribe({
            next: (resp: any) => {
                if (resp.ok) {
                    this._swalAlertService.getAlertConfirmSuccess(this.translate.instant('PLATAFORMA.INSERTAR'));
                    this._loadingService.hide();
                    this.router.navigate(['/usuarios/usuarios-roles']);
                }
            },
            error: (err: any) => {
                this._loadingService.hide();
                this._swalAlertService.getAlertError(this.translate.instant('PLATAFORMA.NOINSERTO'));
            }
        });
    }

    btnRegresarClick() {
        this.router.navigate(['/usuarios/usuarios-roles']);
    }

    toggleNav(): void {
        this.toggleSidebar.emit();
    }
}
