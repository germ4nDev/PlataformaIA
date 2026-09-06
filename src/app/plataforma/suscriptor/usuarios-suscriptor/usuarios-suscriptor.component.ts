import { ChangeDetectorRef, Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject, Observable, Subscription, combineLatest, of } from 'rxjs';
import { map, startWith, catchError, tap, switchMap, filter } from 'rxjs/operators';
import { SharedModule } from 'src/app/theme/shared/shared.module';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { PTLUsuariosService } from 'src/app/theme/shared/service/ptlusuarios.service';
import { DatatableComponent } from 'src/app/theme/shared/components/data-table/data-table.component';
import { NavBarComponent } from 'src/app/theme/layout/admin/nav-bar/nav-bar.component';
import { NavContentComponent } from 'src/app/theme/layout/admin/navigation/nav-content/nav-content.component';
import { NavigationService } from 'src/app/theme/shared/service/navigation.service';
import { NavigationItem } from 'src/app/theme/shared/_helpers/models/Navigation.model';
import { PTLSuscriptorModel } from 'src/app/theme/shared/_helpers/models/PTLSuscriptor.model';
import { GradientConfig } from 'src/app/app-config';
import { LocalStorageService } from 'src/app/theme/shared/service/local-storage.service';
import { DataTablesModule } from 'angular-datatables/src/angular-datatables.module';
import { PTLUsuarioSCModel } from 'src/app/theme/shared/_helpers/models/PTLUsuarioSC.model';
import { PtllogActividadesService } from 'src/app/theme/shared/service/ptllog-actividades.service';
import { SwalAlertService } from 'src/app/theme/shared/service/swal-alert.service';
import { ColumnMetadata } from 'src/app/theme/shared/_helpers/models/ColumnMetadata.model';
import { PTLSuscriptoresService, PtlusuariosScService, UploadFilesService } from 'src/app/theme/shared/service';
import { PTLUsuarioModel } from 'src/app/theme/shared/_helpers/models/PTLUsuario.model';
import { DataLoaderComponent } from "src/app/theme/shared/components/data-loader/data-loader.component";
import { TableDataComponent } from "src/app/theme/shared/components/table-data/table-data.component";
import { PtlPermisosService } from 'src/app/theme/shared/service/ptlpermisos.service';

@Component({
    selector: 'app-usuarios-suscriptor',
    standalone: true,
    imports: [CommonModule, DataTablesModule, SharedModule, TranslateModule, NavContentComponent, NavBarComponent, DataLoaderComponent, TableDataComponent],
    templateUrl: './usuarios-suscriptor.component.html',
    styleUrl: './usuarios-suscriptor.component.scss'
})
export class UsuariosSuscriptorComponent implements OnInit {

    @Output() toggleSidebar = new EventEmitter<void>();
    // Estado de la UI
    gradientConfig;
    hasFiltersSlot: boolean = false;
    menuItems!: Observable<NavigationItem[]>;
    activeTab: 'menu' | 'filters' | 'main' = 'menu';
    suscPlataforma: string = '';
    lang: string = localStorage.getItem('lang') || '';

    // Fuente de datos principal
    private usuariosSubject = new BehaviorSubject<any[]>([]);
    usuariosFiltrados$!: Observable<any[]>;

    // Subjects para filtros
    subscriptions = new Subscription()
    filtroSuscriptorSubject = new BehaviorSubject<string>('')
    filtroIdentificacionSubject = new BehaviorSubject<string>('')
    filtroNombreSubject = new BehaviorSubject<string>('')
    filtroCorreoSubject = new BehaviorSubject<string>('')
    filtroUsernameSubject = new BehaviorSubject<string>('')
    filtroDescripcionSubject = new BehaviorSubject<string>('')
    filtroEstadoSubject = new BehaviorSubject<string>('todos')

    //#region VARIABLES
    registrosTransformadas$: Observable<PTLUsuarioSCModel[]> = of([]);
    registrosFiltrado$: Observable<PTLUsuarioSCModel[]> = of([]);
    registros: PTLUsuarioSCModel[] = [];
    usuariosSC: PTLUsuarioSCModel[] = [];
    suscriptoresSub?: Subscription;
    suscriptores: PTLSuscriptorModel[] = [];
    usuarios: PTLUsuarioModel[] = [];
    stId: string = '';
    cargandoExcel: boolean = false;

    //#endregion VARIABLES

    constructor(
        private router: Router,
        private route: ActivatedRoute,
        private cdr: ChangeDetectorRef,
        private translate: TranslateService,
        private _swalService: SwalAlertService,
        private _logActividadesService: PtllogActividadesService,
        private _usuariosService: PTLUsuariosService,
        private _usuariosSCService: PtlusuariosScService,
        private _suscriptoresService: PTLSuscriptoresService,
        private _navigationService: NavigationService,
        private _localStorageService: LocalStorageService,
        private _permisosService: PtlPermisosService,
        private _uploadService: UploadFilesService
    ) {
        this.gradientConfig = GradientConfig;
        this.stId = this._localStorageService.getObject<string>('regId') || ''
        if (this.stId) {
            this.filtroSuscriptorSubject.next(this.stId);
        }
        this.suscPlataforma = this._localStorageService.getSuscriptorPlataformaLocalStorage();
    }

    ngOnInit() {
        this._navigationService.getNavigationItems();
        this.menuItems = this._navigationService.menuItems$;
        this.hasFiltersSlot = true;
        // this.consultarSuscriptores();
        // this.consultarUsuarios();
        // this.consultarRegistros();
        setTimeout(() => {
            this.setupRegistrosStream();
        }, 100);
        this.subscriptions.add(
            this._usuariosSCService.cargarRegistros().subscribe(
                () => console.log('UsuariosSC cargados y guardados en el servicio'),
                (err) => console.error('Error al cargar los UsuariosSC:', err)
            )
        );
    }

    columnasRegistros: ColumnMetadata[] = [
        {
            name: 'avatarUsuario',
            header: 'USUARIOS.USUARIOS.FOTO',
            type: 'avatar',
            isSortable: false
        },
        {
            name: 'identificacionUsuario',
            header: 'USUARIOS.USUARIOS.IDENTIFICACION',
            type: 'text'
        },
        {
            name: 'nombreUsuario',
            header: 'USUARIOS.USUARIOS.NAME',
            type: 'text'
        },
        {
            name: 'userNameUsuario',
            header: 'USUARIOS.USUARIOS.USERNAME',
            type: 'text'
        },
        {
            name: 'nomEstado',
            header: 'USUARIOS.USUARIOS.STATUS',
            type: 'estado'
        }
    ]

    columnasDetailRegistros: ColumnMetadata[] = [
        {
            name: 'correoUsuario',
            header: 'USUARIOS.USUARIOS.CORREO',
            type: 'text'
        },
        {
            name: 'descripcionUsuario',
            header: 'USUARIOS.USUARIOS.DESCRIPCION',
            type: 'text'
        },
        {
            name: 'roles',
            header: 'USUARIOS.USUARIOS.ROLES',
            type: 'json-tabla'
        }
    ]

    setupRegistrosStream(): void {
        this.suscPlataforma = this._localStorageService.getSuscriptorPlataformaLocalStorage();
        let codigo = this.suscPlataforma;

        // =========================================================================
        // 1. STREAM TRANSFORMADO (Cruza Usuarios, UsuariosSC y Permisos)
        // =========================================================================
        this.registrosTransformadas$ = combineLatest([
            this._usuariosService.usuarios$,          // [0] Catálogo maestro de usuarios (PTLUsuarioModel[])
            this._usuariosSCService.usuariosSC$,      // [1] Tabla puente de relación
            this._permisosService.actividadesAutorizadas$ // [2] Permisos en tiempo real por socket
        ]).pipe(
            map(([usuariosMaster, usuariosSC, permisos]: [PTLUsuarioModel[], any[], string[]]) => {
                if (!usuariosMaster || usuariosMaster.length === 0 || !usuariosSC || usuariosSC.length === 0) return [];

                this.usuarios = usuariosMaster;
                this.usuariosSC = usuariosSC;

                // Filtramos la tabla puente por el suscriptor actual
                const relacionesDeEsteSuscriptor = usuariosSC.filter(x => x.codigoSuscriptor === this.stId);

                // Mapeamos para retornar estrictamente PTLUsuarioModel[]
                const transformedUsuarios: PTLUsuarioModel[] = relacionesDeEsteSuscriptor.map((relacionSC: any) => {
                    const user = usuariosMaster.find(u => u.codigoUsuario === relacionSC.codigoUsuario);
                    if (!user) return null;

                    // 🟢 Solución: Casteamos a 'any' para asignarle propiedades visuales dinámicas
                    const newReg: any = { ...user };

                    console.log('********usuario sc fila', newReg);


                    newReg.nomEstado = newReg.estadoUsuario ? 'Activo' : 'Inactivo';
                    newReg.avatarUsuario = this._uploadService.getFilePath(codigo, 'usuarios', newReg.fotoUsuario);

                    newReg.letraDinamica1 = newReg.estadoUsuario ? 'I' : 'A';
                    newReg.colorDinamico1 = newReg.estadoUsuario ? '#ff0000' : '#28a745';
                    newReg.tooltipDinamico1 = newReg.estadoUsuario ? 'Inactivar Usuario' : 'Activar Usuario';

                    // Construcción dinámica de acciones basadas en permisos en tiempo real
                    const accionesPermitidas: any[] = [];

                    if (permisos.includes('ACT_USUARIOS_INACTIVAR')) {
                        accionesPermitidas.push({
                            accion: 'INACTIVAR',
                            letra: 'I',
                            color: '#ff0000',
                            tooltip: this.translate.instant('USUARIOS.INACTIVAR')
                        });
                    }
                    if (permisos.includes('ACT_USUARIOS_CAMBIAR')) {
                        accionesPermitidas.push({
                            accion: 'CAMBIAR',
                            letra: 'C',
                            color: '#25a042',
                            tooltip: this.translate.instant('USUARIOS.CAMBIAR')
                        });
                    }
                    if (permisos.includes('ACT_USUARIOS_RESETEAR')) {
                        accionesPermitidas.push({
                            accion: 'RESETEAR',
                            letra: 'R',
                            color: '#d3751d',
                            tooltip: this.translate.instant('USUARIOS.RESERTEAR')
                        });
                    }
                    if (permisos.includes('ACT_USUARIOS_ROLES')) {
                        accionesPermitidas.push({
                            accion: 'ROLES',
                            letra: 'R',
                            color: '#c41dd3',
                            tooltip: this.translate.instant('USUARIOS.ROLES')
                        });
                    }

                    return {
                        ...newReg,
                        '_acciones': accionesPermitidas
                    } as PTLUsuarioModel;

                }).filter((item): item is PTLUsuarioModel => item !== null);
                console.log('*******USUARIOS SC', transformedUsuarios);

                return transformedUsuarios;
            }),
            tap((regs) => {
                this.registros = regs;
                this.cdr.detectChanges(); // Repinta la UI en vivo al recibir eventos de sockets
            }),
            catchError(err => {
                console.error('Error en el stream de usuarios:', err);
                return of([]);
            })
        );

        // =========================================================================
        // 2. STREAM DE FILTRADO VISUAL (Para los inputs del Datatable)
        // =========================================================================
        this.registrosFiltrado$ = combineLatest([
            this.registrosTransformadas$.pipe(startWith([])),
            this.filtroIdentificacionSubject,
            this.filtroNombreSubject,
            this.filtroCorreoSubject,
            this.filtroUsernameSubject,
            this.filtroDescripcionSubject,
            this.filtroEstadoSubject
        ]).pipe(
            map(([usuarios, identificacion, nombre, correo, username, descripcion, estado]) => {
                let filteredRegistros: PTLUsuarioModel[] = usuarios;

                if (identificacion) {
                    const text = identificacion.toLowerCase();
                    filteredRegistros = filteredRegistros.filter(reg =>
                        (reg.identificacionUsuario?.toString() || '').toLowerCase().includes(text)
                    );
                }
                if (nombre) {
                    const text = nombre.toLowerCase();
                    filteredRegistros = filteredRegistros.filter(reg =>
                        (reg.nombreUsuario || '').toLowerCase().includes(text)
                    );
                }
                if (correo) {
                    const text = correo.toLowerCase();
                    filteredRegistros = filteredRegistros.filter(reg =>
                        (reg.correoUsuario || '').toLowerCase().includes(text)
                    );
                }
                if (username) {
                    const text = username.toLowerCase();
                    filteredRegistros = filteredRegistros.filter(reg =>
                        (reg.userNameUsuario || '').toLowerCase().includes(text)
                    );
                }
                if (estado !== 'todos') {
                    const estadoBoolean = estado === 'true';
                    filteredRegistros = filteredRegistros.filter(reg => reg.estadoUsuario === estadoBoolean);
                }
                if (descripcion) {
                    const textoFiltro = descripcion.toLowerCase();
                    filteredRegistros = filteredRegistros.filter(reg =>
                        (reg.descripcionUsuario || '').toLowerCase().includes(textoFiltro)
                    );
                }

                return filteredRegistros;
            })
        );
    }

    onFiltroSuscriptorChangeClick(evento: any) {
        const value = evento.target.value;
        this.filtroSuscriptorSubject.next(value);
    }

    onFiltroNombreChangeClick(evento: any) {
        const value = evento.target.value;
        this.filtroNombreSubject.next(value);
    }

    onFiltroEstadoChangeClick(evento: any) {
        const value = evento.target.value;
        this.filtroEstadoSubject.next(value);
    }

    OnNuevoRegistroClick() {
        this.router.navigate(['suscriptor/gestion-usuario-suscriptor'], { queryParams: { regId: 'nuevo', stId: this.stId } });
    }

    onAccionPrincipal(evento: { accion: string, row: any }) {
        const { accion, row } = evento;
        const id = row.codigoUsuario || row.id;

        console.log(`Acción ejecutada: [${accion}] sobre el registro ID:`, id);

        // switch (accion) {
        //     case 'INACTIVAR':
        //         console.log('inactivar usuario codigo', id);
        //         const usuario = this.usuarios.find(x => x.codigoUsuario === id);
        //         if (!usuario) return;
        //         this._swalService.getAlertQuestionRequest(
        //             this.translate.instant('USUARIOS.INACTIVAR'),
        //             this.translate.instant('USUARIOS.INACTIVARTITULO'),
        //             this.translate.instant('USUARIOS.INACTIVARBTN'),
        //             this.translate.instant('PLATAFORMA.CANCEL')
        //         ).subscribe(result => {
        //             if (result) {
        //                 usuario.estadoUsuario = usuario.estadoUsuario == true ? false : true;
        //                 console.log('usuario a inactivar', usuario);
        //                 this._usuariosService.actualizarUsuario(usuario).subscribe({
        //                     next: (resp: any) => {
        //                         const logData = {
        //                             codigoTipoLog: '',
        //                             codigoRespuesta: '201',
        //                             descripcionLog: this.translate.instant('USUARIOS.ELIMINAREXITOSA') + ' ' + resp.mensaje
        //                         }
        //                         this._logActividadesService.postCrearRegistro(logData).subscribe(() => console.log('log creado exitosamente'))
        //                         this._swalService.getAlertSuccess(this.translate.instant('USUARIOS.ROLES.ELIMINARERROR'));
        //                         this.setupRegistrosStream()
        //                     },
        //                     error: (err: any) => {
        //                         // const logData = {
        //                         //     codigoTipoLog: '',
        //                         //     codigoRespuesta: '201',
        //                         //     descripcionLog: this.translate.instant('USUARIOS.ROLES.ELIMINARERROR') + ' ' + err.mensaje
        //                         // }
        //                         // this._logActividadesService.postCrearRegistro(logData).subscribe(() => console.log('log creado exitosamente'))
        //                         this._swalService.getAlertSuccess(this.translate.instant('USUARIOS.ROLES.ELIMINARERROR') + ' ' + err.mensaje)
        //                         // this.setupRegistrosStream()
        //                         console.error('Error eliminando', err)
        //                     }
        //                 })
        //             }
        //         });
        //         break;
        //     case 'CAMBIAR':
        //         const value = id;
        //         console.log('opcion 1 click', value);
        //         this.registroSeleccionado = id;
        //         //this._prepararDatosDeRenovacion(event);
        //         this.mostrarModalPassword = true;
        //         this.FormRegistro = {}
        //         this.usuarioSeleccionadoParaClave = this.usuarios.find(x => x.codigoUsuario === id);
        //         this.claveActual = '';
        //         this.claveNueva = '';
        //         this.confirmarClave = '';
        //         break;
        //     case 'RESETEAR':
        //         this.registroSeleccionado = id;
        //         const nuevaClave = this._utilidadesService.generarClaveSegura();
        //         console.log('La nueva clave generada es:', nuevaClave);
        //         this.procesarCambioClave(id, nuevaClave);
        //         break;
        //     case 'ROLES':
        //         console.log('Redirigirse a la pagina de roles:', id);
        //         this._localStorageService.setObject('regId', id)
        //         this.router.navigate(['usuarios/roles-usuario'])
        //         break;
        //     default:
        //         console.warn(`Acción no reconocida: ${accion}`);
        //         break;
        // }
    }

    onFileExcelSelected(event: any) {
        const file: File = event.target.files[0];

        if (file) {
            // 1. Validación rápida de formato en el frontend
            const extension = file.name.split('.').pop()?.toLowerCase();
            if (extension !== 'xlsx' && extension !== 'xls') {
                console.error('El archivo seleccionado no es un formato de Excel válido.');
                // Aquí puedes lanzar una alerta (ej. SweetAlert o Toast)
                return;
            }

            this.cargandoExcel = true;

            // 2. Obtener el ID del usuario actual (reemplaza esto con tu variable de sesión)
            const usuarioLogueado = 'SISTEMA_O_ID_USUARIO';

            // 3. Llamar al servicio
            this._usuariosService.cargueMasivoExcel(file, usuarioLogueado).subscribe({
                next: (resp) => {
                    this.cargandoExcel = false;
                    console.log('✅ Éxito:', resp.msg);

                    // Refrescar la tabla de usuarios
                    // this.cargarUsuarios();

                    // Limpiar el input para permitir subir el mismo archivo si hubo correcciones
                    event.target.value = '';
                },
                error: (err) => {
                    this.cargandoExcel = false;
                    console.error('❌ Error en el cargue:', err);

                    // Si tu backend devolvió la lista de filas con error, puedes mostrarla aquí
                    if (err.error && err.error.errores) {
                        console.log('Detalle de filas con error:', err.error.errores);
                    }

                    event.target.value = '';
                }
            });
        }
    }

    procesarArchivoExcel(file: File): void {
        if (!file) return;

        const extension = file.name.split('.').pop()?.toLowerCase();
        if (extension !== 'xlsx' && extension !== 'xls') {
            console.error('Por favor, selecciona un archivo de Excel válido.');
            return;
        }

        this.cargandoExcel = true;

        const usuarioLogueado = 'ADMIN_SISTEMA';

        this._usuariosService.cargueMasivoExcel(file, usuarioLogueado).subscribe({
            next: (resp: any) => {
                this.cargandoExcel = false;

                console.log('✅ Éxito:', resp.msg);
                this.setupRegistrosStream();
            },
            error: (err: any) => {
                this.cargandoExcel = false;

                const mensajePrincipal = err.error?.msg || 'Error interno al procesar el archivo.';
                console.error('❌ Error de cargue:', mensajePrincipal);

                if (err.error?.errores) {
                    console.warn('Detalle de validación de Joi:', err.error.errores);
                }
            }
        });
    }

    OnBackButtonClic(event: any) {
        this.router.navigate(['/suscriptor/suscriptores']);
    }

    OnEditarRegistroClick(event: any) {
        const id = event.id || event;
        this.router.navigate(['/suscriptor/gestion-usuario-suscriptor'], { queryParams: { regId: id } });
    }

    OnEliminarRegistroClick(event: any) {
        console.log('Eliminar usuario:', event.id || event);
    }

    toggleNav(): void {
        this.toggleSidebar.emit();
    }

    OnRegresarClick(event: any) {
        console.log('ejecutando opcion Regresar Suscriptor', event);
        this.router.navigate(['suscriptor/suscriptores']);
    }
}
