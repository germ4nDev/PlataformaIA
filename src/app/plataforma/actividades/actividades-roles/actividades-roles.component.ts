import { CommonModule } from '@angular/common';
import { Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { DataTablesModule } from 'angular-datatables';
import { BehaviorSubject, catchError, combineLatest, map, Observable, of, startWith, Subscription, switchMap } from 'rxjs';
import { GradientConfig } from 'src/app/app-config';
import { NavBarComponent } from "src/app/theme/layout/admin/nav-bar/nav-bar.component";
import { NavContentComponent } from "src/app/theme/layout/admin/navigation/nav-content/nav-content.component";
import { BaseSessionModel } from 'src/app/theme/shared/_helpers/models/BaseSession.model';
import { ColumnMetadata } from 'src/app/theme/shared/_helpers/models/ColumnMetadata.model';
import { NavigationItem } from 'src/app/theme/shared/_helpers/models/Navigation.model';
import { PTLActividadModel } from 'src/app/theme/shared/_helpers/models/PTLActividades.model';
import { PTLActividadRoleModel } from 'src/app/theme/shared/_helpers/models/PTLActividadesRoles.model';
import { PTLLogActividadAPModel } from 'src/app/theme/shared/_helpers/models/PTLlogActividadAP.model';
import { PTLRoleAPModel } from 'src/app/theme/shared/_helpers/models/PTLRoleAP.model';
import { DatatableComponent } from "src/app/theme/shared/components/data-table/data-table.component";
import { LocalStorageService, NavigationService, PtlactividadesRolesService, PtlActividadesService, PtllogActividadesService, PTLRolesAPService, SwalAlertService } from 'src/app/theme/shared/service';
import { SharedModule } from 'src/app/theme/shared/shared.module';
import { TableDataComponent } from "src/app/theme/shared/components/table-data/table-data.component";
import { DataLoaderComponent } from "src/app/theme/shared/components/data-loader/data-loader.component";

@Component({
    selector: 'app-actividadesRoles-roles',
    standalone: true,
    imports: [CommonModule, DataTablesModule, SharedModule, TranslateModule, NavBarComponent, NavContentComponent, DatatableComponent, TableDataComponent, DataLoaderComponent],
    templateUrl: './actividades-roles.component.html',
    styleUrl: './actividades-roles.component.scss'
})
export class ActividadesRolesComponent implements OnInit, OnDestroy {
    @Output() toggleSidebar = new EventEmitter<void>()
    DataModel: BaseSessionModel = new BaseSessionModel()
    DataLogActividad: PTLLogActividadAPModel = new PTLLogActividadAPModel()
    moduloTituloExcel: string = ''
    codigoActividad: string = ''
    hasFiltersSlot: boolean = false
    gradientConfig: any
    lang = localStorage.getItem('lang')
    menuItems$!: Observable<NavigationItem[]>
    activeTab: 'menu' | 'filters' | 'main' = 'menu'

    subscriptions = new Subscription()
    filtroCodigoActividadSubject = new BehaviorSubject<string>('todos')
    filtroCodigoRoleSubject = new BehaviorSubject<string>('todos')
    filtroEstadoSubject = new BehaviorSubject<string>('')

    actividadesRolesTransformadas$: Observable<PTLActividadRoleModel[]> = of([])
    actividadesRolesFiltradas$: Observable<PTLActividadRoleModel[]> = of([])
    actividadesRoles: PTLActividadRoleModel[] = []
    actividades: PTLActividadModel[] = []
    roles: PTLRoleAPModel[] = []

    colorOpcion1 = '#269740'
    letraOpcion1 = 'R'

    constructor(
        private router: Router,
        private translate: TranslateService,
        private _navigationService: NavigationService,
        private _actividadesRolesService: PtlactividadesRolesService,
        private _actividadesService: PtlActividadesService,
        private _rolesService: PTLRolesAPService,
        private _logActividadesService: PtllogActividadesService,
        private _localStorageService: LocalStorageService,
        private _swalAlertService: SwalAlertService
    ) {
        this.gradientConfig = GradientConfig
        this.codigoActividad = this._localStorageService.getObject<string>('regId') || 'nuevo'
    }

    ngOnInit(): void {
        this._navigationService.getNavigationItems()
        this.menuItems$ = this._navigationService.menuItems$
        this.hasFiltersSlot = true
        this.actividades = this._actividadesService.getActividadesActuales();
        this.actividadesRoles = this._actividadesRolesService.getActividadesRolesActuales();
        this.roles = this._rolesService.getRolesActuales()
        this.setupActividadesRolesStream()
        this.subscriptions.add(
            this._actividadesRolesService.cargarRegistros().subscribe(
                () => console.log('ActividadesRoles cargadas y guardadas en el servicio'),
                err => console.error('Error al cargar ActividadesRoles:', err)
            )
        )
    }

    ngOnDestroy(): void {
        this.subscriptions.unsubscribe()
    }

    setupActividadesRolesStream(): void {
        this.actividadesRolesTransformadas$ = this._actividadesRolesService.actividadesRoles$.pipe(
            switchMap((actsRole: PTLActividadRoleModel[]) => {
                if (!actsRole) return of([])
                const filtradas = actsRole.filter(x => x.codigoActividad == this.codigoActividad);
                const transformedActs = filtradas.map((actRole: any) => {
                    actRole.nomEstado = actRole.permiso ? 'Activo' : 'Inactivo'
                    actRole.nomActividad = this.actividades.find(app => app.codigoActividad === actRole.codigoActividad)?.actividad || ''
                    actRole.nomRole = this.roles.find(role => role.codigoRole === actRole.codigoRole)?.nombreRole || ''

                    const estadoActividadRole = actRole.permiso ? 'I' : 'A';
                    const colorActividadRole = actRole.permiso ? '#dc3545' : '#13af2d';
                    const tooltipActividadRole = actRole.permiso ? this.translate.instant('ACTIVIDADESROLES.INACTIVAR') : this.translate.instant('ACTIVIDADESROLES.ACTIVAR');

                    return {
                        ...actRole,
                        '_acciones': [
                            {
                                accion: 'ESTADO',
                                letra: estadoActividadRole,
                                color: colorActividadRole,
                                tooltip: tooltipActividadRole
                            }
                        ],
                    };
                })

                this.actividadesRoles = transformedActs;
                console.log('*** actividades roles', this.actividadesRoles);

                return of(transformedActs);
            }),
            catchError(err => {
                console.error('Error en el stream de actividadesRoles:', err)
                return of([])
            })
        )

        this.actividadesRolesFiltradas$ = combineLatest([
            this.actividadesRolesTransformadas$.pipe(startWith([])),
            this.filtroCodigoActividadSubject,
            this.filtroCodigoRoleSubject,
            this.filtroEstadoSubject
        ]).pipe(
            map(([actsRole, codigoActividad, codigoRole, estado]) => {
                let filteredActs = actsRole
                if (codigoActividad !== 'todos') {
                    filteredActs = filteredActs.filter(act => act.codigoActividad === codigoActividad)
                }

                if (codigoRole !== 'todos') {
                    filteredActs = filteredActs.filter(act => act.codigoRole === codigoRole)
                }

                if (estado) {
                    const estadoBoolean = estado === 'true'
                    filteredActs = filteredActs.filter(act => act.permiso === estadoBoolean)
                }

                return filteredActs
            })
        )
    }

    onFiltroCodigoActividadChangeClick(evento: any): void {
        const value = evento.target.value
        this.filtroCodigoActividadSubject.next(value)
    }

    onFiltroCodigoRoleChangeClick(evento: any): void {
        const value = evento.target.value
        this.filtroCodigoRoleSubject.next(value)
    }

    columnasAplicaciopnes: ColumnMetadata[] = [
        {
            name: 'nomActividad',
            header: 'ACTIVIDADES.NOMMODULO',
            type: 'text'
        },
        {
            name: 'nomRole',
            header: 'ACTIVIDADES.NOMSUITE',
            type: 'text'
        },
        {
            name: 'nomEstado',
            header: 'ACTIVIDADES.NOMAPLICACION',
            type: 'estado'
        }
    ]

    columnasDetailRegistros: ColumnMetadata[] = [
        {
            name: 'codigoActividadRole',
            header: 'ACTIVIDADES.CODIGOACTIVIDAD',
            type: 'text'
        }
    ]

    OnNuevoRegistroClick(): void {
        this._localStorageService.setObject('regId', this.codigoActividad)
        this.router.navigate(['actividades/gestion-actividad-roles'])
    }

    OnEliminarRegistroClick(id: any): void {
        console.log('id actividad role', id.id)
        this._swalAlertService.getAlertQuestionRequest(
            this.translate.instant('ACTIVIDADES.ELIMINARTEXTO'),
            this.translate.instant('ACTIVIDADES.ELIMINARTITULO'),
            this.translate.instant('PLATAFORMA.DELETE'),
            this.translate.instant('PLATAFORMA.CANCEL')
        ).subscribe(result => {
            if (result) {
                this._actividadesRolesService.deleteEliminarRegistro(id.id).subscribe({
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

    onAccionPrincipal(evento: { accion: string, row: any }) {
        const { accion, row } = evento;
        const idRegistro = row.codigoActividadRole || row.id;

        console.log(`Acción ejecutada: [${accion}] sobre el registro ID:`, idRegistro);

        switch (accion) {
            case 'ESTADO':
                console.log('gestionar estado', idRegistro)
                console.log('ejecutando opcion Regresar Actividades', idRegistro);
                this._swalAlertService.getAlertQuestionRequest(
                    this.translate.instant('ACTIVIDADES.REVOCARTEXTO'),
                    this.translate.instant('ACTIVIDADES.REVOCARTITULO'),
                    this.translate.instant('PLATAFORMA.DELETE'),
                    this.translate.instant('PLATAFORMA.CANCEL')
                ).subscribe(result => {
                    if (result) {
                        const actividad = this.actividadesRoles.filter(x => x.codigoActividadRole == idRegistro)[0];
                        const actRole = {
                            codigoActividadRole: actividad.codigoActividadRole,
                            codigoActividad: actividad.codigoActividad,
                            codigoRole: actividad.codigoRole,
                            permiso: actividad.permiso ? false : true,
                            codigoUsuarioModificacion: this._localStorageService.getUsuarioLocalStorage().codigoUsuario,
                            fechaModificacion: new Date().toISOString()
                        }
                        console.log('inactivar actividad', actRole);
                        this._actividadesRolesService.putModificarRegistro(actRole).subscribe({
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
                break;

            default:
                console.warn(`Acción no reconocida: ${accion}`);
                break;
        }
    }

    OnOption1Click(event: any) {
        console.log('ejecutando opcion Regresar Actividades', event);
        this._swalAlertService.getAlertQuestionRequest(
            this.translate.instant('ACTIVIDADES.REVOCARTEXTO'),
            this.translate.instant('ACTIVIDADES.REVOCARTITULO'),
            this.translate.instant('PLATAFORMA.DELETE'),
            this.translate.instant('PLATAFORMA.CANCEL')
        ).subscribe(result => {
            if (result) {
                const actividad = this.actividadesRoles.filter(x => x.codigoActividadRole == event)[0];
                const actRole = {
                    codigoActividadRole: actividad.codigoActividadRole,
                    codigoActividad: actividad.codigoActividad,
                    codigoRole: actividad.codigoRole,
                    permiso: actividad.permiso ? false : true,
                    codigoUsuarioModificacion: this._localStorageService.getUsuarioLocalStorage().codigoUsuario,
                    fechaModificacion: new Date().toISOString()
                }
                console.log('inactivar actividad', actRole);
                this._actividadesRolesService.putModificarRegistro(actRole).subscribe({
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

    OnRegresarClick(event: any) {
        console.log('ejecutando opcion Regresar Actividades', event);
        this._localStorageService.removeObject('regId');
        this.router.navigate(['actividades/actividades'])
    }

    toggleNav(): void {
        this.toggleSidebar.emit()
    }
}


