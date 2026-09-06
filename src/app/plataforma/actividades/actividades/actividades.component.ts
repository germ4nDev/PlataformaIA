/* eslint-disable @typescript-eslint/no-explicit-any */
import { Component, EventEmitter, OnInit, OnDestroy, Output } from '@angular/core'
import { CommonModule } from '@angular/common'
import { DataTablesModule } from 'angular-datatables'
import { Router } from '@angular/router'
import { SharedModule } from 'src/app/theme/shared/shared.module'
import { TranslateModule, TranslateService } from '@ngx-translate/core'
import { Observable, Subscription, of, BehaviorSubject, combineLatest } from 'rxjs' // Importación de BehaviorSubject y combineLatest
import { catchError, map, startWith, switchMap } from 'rxjs/operators'
import { GradientConfig } from 'src/app/app-config'

import { NavContentComponent } from 'src/app/theme/layout/admin/navigation/nav-content/nav-content.component'
import { NavBarComponent } from '../../../theme/layout/admin/nav-bar/nav-bar.component'
import { DatatableComponent } from 'src/app/theme/shared/components/data-table/data-table.component'
import { PtlActividadesService } from 'src/app/theme/shared/service/ptlactividades.service'
import { NavigationService } from 'src/app/theme/shared/service/navigation.service'
import { ColumnMetadata } from 'src/app/theme/shared/_helpers/models/ColumnMetadata.model'
import { PTLLogActividadAPModel } from 'src/app/theme/shared/_helpers/models/PTLlogActividadAP.model'
import {
    LocalStorageService,
    PtlAplicacionesService,
    PtllogActividadesService,
    PtlmodulosApService,
    PtlSuitesAPService,
    SwalAlertService
} from 'src/app/theme/shared/service'
import { BaseSessionModel } from 'src/app/theme/shared/_helpers/models/BaseSession.model'
import { NavigationItem } from 'src/app/theme/shared/_helpers/models/Navigation.model'
import Swal from 'sweetalert2'
import { PTLActividadModel } from 'src/app/theme/shared/_helpers/models/PTLActividades.model'
import { PTLAplicacionModel } from 'src/app/theme/shared/_helpers/models/PTLAplicacion.model'
import { PTLSuiteAPModel } from 'src/app/theme/shared/_helpers/models/PTLSuiteAP.model'
import { PTLModuloAP } from 'src/app/theme/shared/_helpers/models/PTLModuloAP.model'
import { PTLRoleAPModel } from 'src/app/theme/shared/_helpers/models/PTLRoleAP.model'
import { PtlactividadesRolesService } from '../../../theme/shared/service/ptlactividades-roles.service';
import { PTLActividadRoleModel } from 'src/app/theme/shared/_helpers/models/PTLActividadesRoles.model'
import { PTLRolesAPService } from '../../../theme/shared/service/ptlroles-ap.service';
import { TableDataComponent } from 'src/app/theme/shared/components/table-data/table-data.component'
import { DataLoaderComponent } from "src/app/theme/shared/components/data-loader/data-loader.component";

@Component({
    selector: 'app-actividades',
    standalone: true,
    imports: [CommonModule, DataTablesModule, SharedModule, TranslateModule, NavBarComponent, NavContentComponent, TableDataComponent, DataLoaderComponent],
    templateUrl: './actividades.component.html',
    styleUrl: './actividades.component.scss'
})
export class ActividadesComponent implements OnInit, OnDestroy {
    @Output() toggleSidebar = new EventEmitter<void>()
    DataModel: BaseSessionModel = new BaseSessionModel()
    DataLogActividad: PTLLogActividadAPModel = new PTLLogActividadAPModel()
    moduloTituloExcel: string = ''
    hasFiltersSlot: boolean = false
    gradientConfig
    lang = localStorage.getItem('lang')
    menuItems$!: Observable<NavigationItem[]>
    activeTab: 'menu' | 'filters' | 'main' = 'menu'

    subscriptions = new Subscription()
    filtroCodigoAplicacionSubject = new BehaviorSubject<string>('todos')
    filtroCodigoSuiteSubject = new BehaviorSubject<string>('todos')
    filtroCodigoModuloSubject = new BehaviorSubject<string>('todos')
    filtroActividadSubject = new BehaviorSubject<string>('')
    filtroDescripcionSubject = new BehaviorSubject<string>('')
    filtroEstadoSubject = new BehaviorSubject<string>('')

    actividadesTransformadas$: Observable<PTLActividadModel[]> = of([])
    actividadesFiltradas$: Observable<PTLActividadModel[]> = of([])
    actividades: PTLActividadModel[] = []
    registros: PTLActividadModel[] = []
    aplicaciones: PTLAplicacionModel[] = []
    suites: PTLSuiteAPModel[] = []
    modulos: PTLModuloAP[] = []
    roles: PTLRoleAPModel[] = []
    actividadesRoles: PTLActividadRoleModel[] = []

    colorOpcion1 = '#28a745'
    letraOpcion1 = 'R'

    constructor(
        private router: Router,
        private translate: TranslateService,
        private _navigationService: NavigationService,
        private _aplicacionesService: PtlAplicacionesService,
        private _suitesService: PtlSuitesAPService,
        private _modulosService: PtlmodulosApService,
        private _logActividadesService: PtllogActividadesService,
        private _localStorageService: LocalStorageService,
        private _swalAlertService: SwalAlertService,
        private _actividadesService: PtlActividadesService,
        private _actividadesRolesService: PtlactividadesRolesService,
        private _rolesService: PTLRolesAPService
    ) {
        this.gradientConfig = GradientConfig
    }

    ngOnInit(): void {
        this._navigationService.getNavigationItems()
        this.menuItems$ = this._navigationService.menuItems$
        this.hasFiltersSlot = true
        this.aplicaciones = this._aplicacionesService.getBAplicacionesActuales();
        this.suites = this._suitesService.getSuitesActuales();
        this.modulos = this._modulosService.getModulosActuales();
        this.subscriptions.add(this._actividadesService.cargarRegistros().subscribe());
        this.subscriptions.add(this._actividadesRolesService.cargarRegistros().subscribe());
        this.subscriptions.add(this._rolesService.cargarRegistros().subscribe());

        setTimeout(() => {
            this.setupActividadesStream()
        }, 500)
        this.subscriptions.add(
            this._actividadesService.cargarRegistros().subscribe(
                () => console.log('Actividades cargadas y guardadas en el servicio'),
                err => console.error('Error al cargar actividades:', err)
            )
        )
    }

    ngOnDestroy(): void {
        this.subscriptions.unsubscribe()
    }

    setupActividadesStream(): void {
        this.actividadesTransformadas$ = combineLatest([
            this._actividadesService.actividades$,
            this._actividadesRolesService.actividadesRoles$ // Escuchamos la tabla puente
        ]).pipe(
            switchMap(([actividades, actividadesRoles]) => {
                if (!actividades || actividades.length === 0) return of([]);

                this.actividades = actividades;
                this.actividadesRoles = actividadesRoles || [];
                this.roles = this._rolesService.getRolesActuales();


                const transformedActividades = actividades.map((actividad: any) => {
                    // 1. Tus mapeos actuales (estados, botones dinámicos, aplicación, suite, etc.)
                    actividad.nomEstado = actividad.estadoActividad ? 'Activo' : 'Inactivo';
                    actividad.nomAplicacion = actividad && actividad.codigoAplicacion
                        ? this.aplicaciones.find(t => t.codigoAplicacion === actividad.codigoAplicacion)?.nombreAplicacion || 'N/A'
                        : 'N/A';
                    actividad.nomSuite = actividad && actividad.codigoSuite
                        ? this.suites.find(t => t.codigoSuite === actividad.codigoSuite)?.nombreSuite || 'N/A'
                        : 'N/A';
                    actividad.nomModulo = actividad && actividad.codigoModulo
                        ? this.modulos.find(t => t.codigoModulo === actividad.codigoModulo)?.nombreModulo || 'N/A'
                        : 'N/A';

                    const asignacionesDeLaActividad = this.actividadesRoles.filter(
                        ar => ar.codigoActividad === actividad.codigoActividad
                    );

                    actividad.roles = asignacionesDeLaActividad.map(ar => {
                        const rolInfo = this.roles.find(r => r.codigoRole === ar.codigoRole);

                        return {
                            '_idRelacion': ar.codigoActividadRole,
                            'Nombre Rol': rolInfo ? rolInfo.nombreRole : 'Rol Desconocido',
                            'Permiso Otorgado': ar.permiso ? 'Sí' : 'No',
                            'Fecha Asignación': ar.fechaCreacion ? new Date(ar.fechaCreacion).toLocaleDateString() : 'N/A',
                            '_acciones': [
                                { accion: 'EDITAR', letra: 'E', color: '#dc3545', tooltip: 'Editar' }, // Rojo
                                { accion: 'REMOVER', letra: 'R', color: '#28a745', tooltip: 'Remover' } // Verde
                            ]
                        };
                    });

                    return {
                        ...actividad,
                        '_acciones': [
                            { accion: 'ROLES', letra: 'R', color: '#28a745', tooltip: (this.translate.instant('ACTIVIDADES.ROLES')) }
                        ],
                    };
                });

                this.registros = transformedActividades;
                return of(transformedActividades);
            }),
            catchError(err => {
                console.error('Error en el stream de actividades:', err);
                return of([]);
            })
        );

        this.actividadesFiltradas$ = combineLatest([
            this.actividadesTransformadas$.pipe(startWith([])),
            this.filtroCodigoAplicacionSubject,
            this.filtroCodigoSuiteSubject,
            this.filtroCodigoModuloSubject,
            this.filtroActividadSubject,
            this.filtroDescripcionSubject,
            this.filtroEstadoSubject
        ]).pipe(
            map(([acts, codigoAplicacion, codigoSuite, codigoModulo, descripcion, estado]) => {
                let filteredActs = acts
                if (codigoAplicacion !== 'todos') {
                    filteredActs = filteredActs.filter(act => act.codigoAplicacion === codigoAplicacion)
                }

                if (codigoSuite !== 'todos') {
                    filteredActs = filteredActs.filter(act => act.codigoSuite === codigoSuite)
                }

                if (codigoModulo !== 'todos') {
                    filteredActs = filteredActs.filter(act => act.codigoModulo === codigoModulo)
                }

                if (estado) {
                    const estadoBoolean = estado === 'true'
                    filteredActs = filteredActs.filter(act => act.estadoActividad === estadoBoolean)
                }

                if (descripcion) {
                    const textoFiltro = descripcion.toLowerCase()
                    filteredActs = filteredActs.filter(act => (act.descripcion || '').toLowerCase().includes(textoFiltro))
                }
                return filteredActs
            })
        )
    }

    onFiltroCodigoAplicacionChangeClick(evento: any): void {
        const value = evento.target.value
        this.filtroCodigoAplicacionSubject.next(value)
    }

    onFiltroCodigoSuiteChangeClick(evento: any): void {
        const value = evento.target.value
        this.filtroCodigoSuiteSubject.next(value)
    }

    onFiltroCodigoModuloChangeClick(evento: any): void {
        const value = evento.target.value
        this.filtroCodigoModuloSubject.next(value)
    }

    onFiltroNombreChangeClick(evento: any): void {
        const value = evento.target.value
        this.filtroCodigoSuiteSubject.next(value)
    }

    onFiltroDescripcionChangeClick(evento: any): void {
        const value = evento.target.value
        this.filtroCodigoModuloSubject.next(value)
    }

    onFiltroEstadoChangeClick(evento: any): void {
        const value = evento.target.value
        this.filtroEstadoSubject.next(value)
    }

    columnasAplicaciopnes: ColumnMetadata[] = [
        {
            name: 'actividad',
            header: 'ACTIVIDADES.ACTIVIDAD',
            type: 'text'
        },
        {
            name: 'nomModulo',
            header: 'ACTIVIDADES.NOMMODULO',
            type: 'text'
        },
        {
            name: 'nomSuite',
            header: 'ACTIVIDADES.NOMSUITE',
            type: 'text'
        },
        {
            name: 'nomAplicacion',
            header: 'ACTIVIDADES.NOMAPLICACION',
            type: 'text',
            isSortable: false
        }
    ]

    columnasDetailRegistros: ColumnMetadata[] = [
        {
            name: 'codigoActividad',
            header: 'ACTIVIDADES.CODIGOACTIVIDAD',
            type: 'text'
        },
        {
            name: 'llavePermiso',
            header: 'ACTIVIDADES.LLAVEPERMISO',
            type: 'text'
        },
        {
            name: 'nomEstado',
            header: 'ACTIVIDADES.NOMESTADO',
            type: 'text'
        },
        {
            name: 'descripcion',
            header: 'ACTIVIDADES.DESCRIPCION',
            type: 'text'
        },
        {
            name: 'roles',
            header: 'ACTIVIDADES.ROLES_ASIGNADOS',
            type: 'json-tabla'
        }
    ]

    OnNuevoRegistroClick(): void {
        this._localStorageService.setObject('regId', 'nuevo')
        this.router.navigate(['actividades/gestion-actividad'])
    }

    OnEditarRegistroClick(id: string): void {
        this._localStorageService.setObject('regId', id)
        this.router.navigate(['actividades/gestion-actividad'])
    }

    OnEliminarRegistroClick(id: any): void {
        console.log('id aplicacion', id)
        this._swalAlertService.getAlertQuestionRequest(
            this.translate.instant('ACTIVIDADES.ELIMINARTEXTO'),
            this.translate.instant('ACTIVIDADES.ELIMINARTITULO'),
            this.translate.instant('PLATAFORMA.DELETE'),
            this.translate.instant('PLATAFORMA.CANCEL')
        ).subscribe(result => {
            if (result) {
                const actividad = this.actividades.filter(x => x.codigoActividad == id.id)[0];
                const acti: any = {};
                //acti.actividadId = actividad.actividadId;
                acti.codigoActividad = actividad.codigoActividad;
                acti.codigoAplicacion = actividad.codigoAplicacion;
                acti.codigoSuite = actividad.codigoSuite;
                acti.codigoModulo = actividad.codigoModulo;
                acti.codigoTipoActividad = actividad.codigoTipoActividad;
                acti.llavePermiso = actividad.llavePermiso;
                acti.actividad = actividad.actividad;
                acti.descripcion = actividad.descripcion;
                acti.codigoUsuarioCreacion = actividad.codigoUsuarioCreacion;
                acti.fechaCreacion = actividad.fechaCreacion;
                acti.estadoActividad = false;
                acti.codigoUsuarioModificacion = this._localStorageService.getUsuarioLocalStorage().codigoUsuario;
                acti.fechaModificacion = new Date().toISOString();
                console.log('inactivar actividad', acti);
                this._actividadesService.putModificarRegistro(acti).subscribe({
                    next: (resp: any) => {
                        console.log('respuesta', resp);
                        if (resp.ok) {
                            const logData = {
                                codigoTipoLog: '',
                                codigoRespuesta: '201',
                                descripcionLog: this.translate.instant('ACTIVIDADES.UPDATESUCCSESSFULLY')
                            };
                            this._logActividadesService.postCrearRegistro(logData).subscribe(() => console.log('log creado exitosamente'));
                            this._swalAlertService.getAlertSuccess(this.translate.instant('ACTIVIDADES.UPDATESUCCSESSFULLY'));
                        }
                    },
                    error: (err: any) => {
                        console.error(err);
                        const logData = {
                            codigoTipoLog: '',
                            codigoRespuesta: '501',
                            descripcionLog: this.translate.instant('ACTIVIDADES.UPDATEERROR')
                        };
                        this._logActividadesService.postCrearRegistro(logData).subscribe(() => console.log('log creado exitosamente'));
                        this._swalAlertService.getAlertError('No se pudo actualizar la Actividad');
                    }
                });
            }
        })
    }

    OnViewRegistroClick(id: any) {
        this._localStorageService.setObject('regId', id)
        this.router.navigate(['actividades/gestion-actividad'])
    }

    abrirModalEditar(row: any) {
        console.log('Abriendo modal de edición para:', row);
        // Tu lógica para abrir el modal o navegar a la vista de edición
    }

    confirmarEliminacion(id: any) {
        // Tu lógica de alerta (ej. usando _swalService) para borrar el registro
    }

    onAccionPrincipal(evento: { accion: string, row: any }) {
        const { accion, row } = evento;
        const idRegistro = row.codigoActividad || row.id;

        console.log(`Acción ejecutada: [${accion}] sobre el registro ID:`, idRegistro);

        switch (accion) {
            case 'ROLES':
                console.log('abrir roles');
                console.log('ejecutando actividades roles', event)
                this._localStorageService.setObject('regId', idRegistro)
                this.router.navigate(['actividades/actividades-roles'])
                break;

            default:
                console.warn(`Acción no reconocida: ${accion}`);
                break;
        }
    }

    onAccionSubtabla(evento: { accion: string, filaSubtabla: any, filaPadre: any }) {
        const accion = evento.accion;
        const idRelacion = evento.filaSubtabla._idRelacion;
        const codigo = evento.filaPadre.codigoActividad;

        switch (accion) {
            case 'EDITAR':
                console.log('abrir enlace subtabla detalle registro', idRelacion);
                console.log('abrir enlace subtabla detalle padre', codigo);
                break;
            case 'REMOVER':
                console.log('abrir enlace subtabla detalle registro', idRelacion);
                console.log('abrir enlace subtabla detalle padre', codigo);
                break;
            default:
                break;
        }
    }

    toggleNav(): void {
        this.toggleSidebar.emit()
    }
}
