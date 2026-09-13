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
import { LocalStorageService, NavigationService, PtlactividadesRolesService, PtlActividadesService, PtllogActividadesService, PTLRolesAPService, SocketManagerService, SwalAlertService } from 'src/app/theme/shared/service';
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
    gradientConfig: any = GradientConfig
    lang = localStorage.getItem('lang')
    menuItems$!: Observable<NavigationItem[]>
    activeTab: 'menu' | 'filters' | 'main' = 'menu'

    socketSubscription = new Subscription()
    subscriptions = new Subscription()
    filtroCodigoActividadSubject = new BehaviorSubject<string>('todos')
    filtroCodigoRoleSubject = new BehaviorSubject<string>('todos')
    filtroEstadoSubject = new BehaviorSubject<string>('')

    actividadesRolesTransformadas$: Observable<PTLActividadRoleModel[]> = of([])
    actividadesRolesFiltradas$: Observable<PTLActividadRoleModel[]> = of([])
    actividadesRoles: PTLActividadRoleModel[] = []
    actividades: PTLActividadModel[] = []
    roles: PTLRoleAPModel[] = []

    columnasAplicaciopnes: ColumnMetadata[] = [
        { name: 'nomActividad', header: 'ACTIVIDADES.NOMMODULO', type: 'text' },
        { name: 'nomRole', header: 'ACTIVIDADES.NOMSUITE', type: 'text' },
        { name: 'nomEstado', header: 'ACTIVIDADES.NOMAPLICACION', type: 'estado' }
    ]

    columnasDetailRegistros: ColumnMetadata[] = [
        { name: 'codigoActividadRole', header: 'ACTIVIDADES.CODIGOACTIVIDAD', type: 'text' }
    ]

    constructor(
        private router: Router,
        private translate: TranslateService,
        private _navigationService: NavigationService,
        private _actividadesRolesService: PtlactividadesRolesService,
        private _actividadesService: PtlActividadesService,
        private _rolesService: PTLRolesAPService,
        private _logActividadesService: PtllogActividadesService,
        private _localStorageService: LocalStorageService,
        private _socketManager: SocketManagerService,
        private _swalAlertService: SwalAlertService
    ) {
        this.codigoActividad = this._localStorageService.getObject<string>('regId') || 'nuevo';

        this.socketSubscription = this._socketManager.actividadesRolesActualizadas$.subscribe(() => {
            console.log('Actualización detectada, refrescando tabla...');
            this.setupActividadesRolesStream();
        });
    }

    ngOnInit(): void {
        this._navigationService.getNavigationItems()
        this.menuItems$ = this._navigationService.menuItems$
        this.hasFiltersSlot = true

        this.actividades = this._actividadesService.getActividadesActuales();
        this.roles = this._rolesService.getRolesActuales();

        this.setupActividadesRolesStream();

        this.subscriptions.add(
            this._actividadesRolesService.cargarRegistros().subscribe()
        )
    }

    ngOnDestroy(): void {
        this.subscriptions.unsubscribe()
        if (this.socketSubscription) {
            this.socketSubscription.unsubscribe();
        }
    }

    setupActividadesRolesStream(): void {
        this.actividadesRolesTransformadas$ = this._actividadesRolesService.actividadesRoles$.pipe(
            switchMap((actsRole: PTLActividadRoleModel[]) => {
                if (!actsRole) return of([])

                const filtradas = actsRole.filter(x => x.codigoActividad == this.codigoActividad);
                this.actividadesRoles = filtradas; // Mantener copia limpia para búsquedas por ID

                const transformedActs = filtradas.map((actRole: any) => {
                    const isActivo = actRole.permiso;
                    return {
                        ...actRole,
                        nomEstado: isActivo ? 'Activo' : 'Inactivo',
                        nomActividad: this.actividades.find(app => app.codigoActividad === actRole.codigoActividad)?.actividad || '',
                        nomRole: this.roles.find(role => role.codigoRole === actRole.codigoRole)?.nombreRole || '',
                        '_acciones': [{
                            accion: 'ESTADO',
                            letra: isActivo ? 'I' : 'A',
                            color: isActivo ? '#dc3545' : '#13af2d',
                            tooltip: isActivo ? this.translate.instant('ACTIVIDADESROLES.INACTIVAR') : this.translate.instant('ACTIVIDADESROLES.ACTIVAR')
                        }],
                    };
                })

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
                if (codigoActividad !== 'todos') filteredActs = filteredActs.filter(act => act.codigoActividad === codigoActividad)
                if (codigoRole !== 'todos') filteredActs = filteredActs.filter(act => act.codigoRole === codigoRole)
                if (estado) filteredActs = filteredActs.filter(act => act.permiso === (estado === 'true'))
                return filteredActs
            })
        )
    }

    onFiltroCodigoActividadChangeClick(evento: any): void {
        this.filtroCodigoActividadSubject.next(evento.target.value)
    }

    onFiltroCodigoRoleChangeClick(evento: any): void {
        this.filtroCodigoRoleSubject.next(evento.target.value)
    }

    OnNuevoRegistroClick(): void {
        this._localStorageService.setObject('regId', this.codigoActividad)
        this.router.navigate(['actividades/gestion-actividad-roles'])
    }

    OnEliminarRegistroClick(idData: any): void {
        this._swalAlertService.getAlertQuestionRequest(
            this.translate.instant('ACTIVIDADES.ELIMINARTEXTO'),
            this.translate.instant('ACTIVIDADES.ELIMINARTITULO'),
            this.translate.instant('PLATAFORMA.DELETE'),
            this.translate.instant('PLATAFORMA.CANCEL')
        ).subscribe(result => {
            if (result) {
                this._actividadesRolesService.deleteEliminarRegistro(idData.id).subscribe({
                    next: (resp: any) => {
                        if (resp.ok) {
                            this.registrarLog('201', 'ACTIVIDADES.UPDATESUCCSESSFULLY');
                            this._swalAlertService.getAlertSuccess(this.translate.instant('ACTIVIDADES.UPDATESUCCSESSFULLY'));
                        }
                    },
                    error: (err: any) => {
                        this.registrarLog('501', 'ACTIVIDADES.UPDATEERROR');
                        this._swalAlertService.getAlertError('No se pudo eliminar la Actividad');
                    }
                });
            }
        })
    }

    onAccionPrincipal(evento: { accion: string, row: any }) {
        const idRegistro = evento.row.codigoActividadRole || evento.row.id;

        if (evento.accion === 'ESTADO') {
            this._swalAlertService.getAlertQuestionRequest(
                this.translate.instant('ACTIVIDADES.REVOCARTEXTO'),
                this.translate.instant('ACTIVIDADES.REVOCARTITULO'),
                this.translate.instant('PLATAFORMA.DELETE'),
                this.translate.instant('PLATAFORMA.CANCEL')
            ).subscribe(result => {
                if (result) {
                    const actividad = this.actividadesRoles.find(x => x.codigoActividadRole == idRegistro);
                    if (!actividad) return;

                    const actRole = {
                        codigoActividadRole: actividad.codigoActividadRole,
                        codigoActividad: actividad.codigoActividad,
                        codigoRole: actividad.codigoRole,
                        permiso: !actividad.permiso,
                        codigoUsuarioModificacion: this._localStorageService.getUsuarioLocalStorage()?.codigoUsuario || '',
                        fechaModificacion: new Date().toISOString()
                    }

                    this._actividadesRolesService.putModificarRegistro(actRole).subscribe({
                        next: (resp: any) => {
                            if (resp.ok) {
                                this.registrarLog('201', 'ACTIVIDADES.UPDATESUCCSESSFULLY');
                                this._swalAlertService.getAlertSuccess(this.translate.instant('ACTIVIDADES.UPDATESUCCSESSFULLY'));
                            }
                        },
                        error: (err: any) => {
                            this.registrarLog('501', 'ACTIVIDADES.UPDATEERROR');
                            this._swalAlertService.getAlertError('No se pudo actualizar la Actividad');
                        }
                    });
                }
            })
        }
    }

    private registrarLog(codigoRespuesta: string, descripcionTranslateKey: string) {
        const logData = {
            codigoTipoLog: '',
            codigoRespuesta: codigoRespuesta,
            descripcionLog: this.translate.instant(descripcionTranslateKey)
        };
        this._logActividadesService.postCrearRegistro(logData).subscribe();
    }

    OnRegresarClick(event: any) {
        this._localStorageService.removeObject('regId');
        this.router.navigate(['actividades/actividades'])
    }

    toggleNav(): void {
        this.toggleSidebar.emit()
    }
}
