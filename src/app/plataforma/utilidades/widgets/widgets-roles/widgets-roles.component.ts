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
import { PTLWidgetMaestroModel } from 'src/app/theme/shared/_helpers/models/PTLWidgetMaestro.model';
import { PTLLogActividadAPModel } from 'src/app/theme/shared/_helpers/models/PTLlogActividadAP.model';
import { PTLRoleAPModel } from 'src/app/theme/shared/_helpers/models/PTLRoleAP.model';
import { DatatableComponent } from "src/app/theme/shared/components/data-table/data-table.component";
import { LocalStorageService, NavigationService, PtllogActividadesService, PTLRolesAPService, SocketManagerService, SwalAlertService } from 'src/app/theme/shared/service';
import { SharedModule } from 'src/app/theme/shared/shared.module';
import { TableDataComponent } from "src/app/theme/shared/components/table-data/table-data.component";
import { DataLoaderComponent } from "src/app/theme/shared/components/data-loader/data-loader.component";
import { PtlWidgetsRolesService } from 'src/app/theme/shared/service/ptlwidgets-roles.service';
import { PTLWidgetsMaestroService } from 'src/app/theme/shared/service/ptlwidgets-maestro.service';

@Component({
    selector: 'app-widgets-roles',
    standalone: true,
    imports: [CommonModule, DataTablesModule, SharedModule, TranslateModule, NavBarComponent, NavContentComponent, TableDataComponent, DataLoaderComponent],
    templateUrl: './widgets-roles.component.html',
    styleUrl: './widgets-roles.component.scss'
})
export class WidgetsRolesComponent implements OnInit, OnDestroy {
    @Output() toggleSidebar = new EventEmitter<void>()
    DataModel: BaseSessionModel = new BaseSessionModel()
    DataLogActividad: PTLLogActividadAPModel = new PTLLogActividadAPModel()
    codigoWidget: string = ''
    hasFiltersSlot: boolean = false
    gradientConfig: any = GradientConfig
    lang = localStorage.getItem('lang')
    menuItems$!: Observable<NavigationItem[]>
    activeTab: 'menu' | 'filters' | 'main' = 'menu'

    socketSubscription = new Subscription()
    subscriptions = new Subscription()
    filtroCodigoWidgetSubject = new BehaviorSubject<string>('todos')
    filtroCodigoRoleSubject = new BehaviorSubject<string>('todos')
    filtroEstadoSubject = new BehaviorSubject<string>('')

    widgetsRolesTransformados$: Observable<any[]> = of([])
    widgetsRolesFiltrados$: Observable<any[]> = of([])
    widgetsRoles: any[] = []
    widgetsMaestros: PTLWidgetMaestroModel[] = []
    roles: PTLRoleAPModel[] = []

    columnasAplicaciopnes: ColumnMetadata[] = [
        { name: 'nombreWidget', header: 'WIDGETS.NOMWIDGET', type: 'text' },
        { name: 'nomRole', header: 'WIDGETS.NOMROLE', type: 'text' },
        { name: 'nomEstado', header: 'WIDGETS.NOMESTADO', type: 'estado' }
    ]

    columnasDetailRegistros: ColumnMetadata[] = [
        { name: 'codigoRole', header: 'WIDGETS.CODIGOROLE', type: 'text' }
    ]

    constructor(
        private router: Router,
        private translate: TranslateService,
        private _navigationService: NavigationService,
        private _widgetsRolesService: PtlWidgetsRolesService,
        private _widgetsMaestroService: PTLWidgetsMaestroService,
        private _rolesService: PTLRolesAPService,
        private _logActividadesService: PtllogActividadesService,
        private _localStorageService: LocalStorageService,
        private _socketManager: SocketManagerService,
        private _swalAlertService: SwalAlertService
    ) {
        this.codigoWidget = this._localStorageService.getObject<string>('regId') || 'nuevo';

        // 🟢 Escuchamos el evento específico de Sockets para los Widgets Roles
        this.socketSubscription = this._socketManager.widgetsRolesActualizados$?.subscribe(() => {
            console.log('Actualización detectada en Widgets-Roles, refrescando tabla...');
            this.setupWidgetsRolesStream();
        });
    }

    ngOnInit(): void {
        this._navigationService.getNavigationItems()
        this.menuItems$ = this._navigationService.menuItems$
        this.hasFiltersSlot = true

        // Obtenemos los catálogos en memoria
        // NOTA: Asegúrate de que el servicio de widgets tenga el método getWidgetsActuales() o cámbialo a tu implementación
        this.widgetsMaestros = this._widgetsMaestroService.getWidgetsActuales() || [];
        this.roles = this._rolesService.getRolesActuales();

        this.setupWidgetsRolesStream();

        this.subscriptions.add(
            this._widgetsRolesService.cargarRegistros().subscribe()
        )
    }

    ngOnDestroy(): void {
        this.subscriptions.unsubscribe()
        if (this.socketSubscription) {
            this.socketSubscription.unsubscribe();
        }
    }

    setupWidgetsRolesStream(): void {
        this.widgetsRolesTransformados$ = this._widgetsRolesService.widgetsRoles$.pipe(
            switchMap((widgetsRoles: any[]) => {
                console.log('&&&&&&&&& registros tabla', widgetsRoles);

                if (!widgetsRoles) return of([])

                // 🟢 Filtramos solo los roles asignados al widget en el que hicimos clic en la pantalla anterior
                const filtradas = widgetsRoles.filter(x => x.codigoWidget === this.codigoWidget);
                this.widgetsRoles = filtradas;

                const transformedActs = filtradas.map((widgetRel: any) => {
                    const isActivo = widgetRel.estadoRelacion;

                    return {
                        ...widgetRel,
                        nomEstado: isActivo ? 'Activo' : 'Inactivo',
                        nombreWidget: this.widgetsMaestros.find(w => w.codigoWidget === widgetRel.codigoWidget)?.nombreWidget || widgetRel.codigoWidget,
                        nomRole: this.roles.find(role => role.codigoRole === widgetRel.codigoRole)?.nombreRole || widgetRel.codigoRole,
                        '_acciones': [{
                            accion: 'ESTADO',
                            letra: isActivo ? 'I' : 'A',
                            color: isActivo ? '#dc3545' : '#13af2d',
                            tooltip: isActivo ? this.translate.instant('WIDGETSROLES.INACTIVAR') : this.translate.instant('WIDGETSROLES.ACTIVAR')
                        }],
                    };
                })
                console.log('roles del widget', transformedActs);

                return of(transformedActs);
            }),
            catchError(err => {
                console.error('Error en el stream de widgetsRoles:', err)
                return of([])
            })
        )

        this.widgetsRolesFiltrados$ = combineLatest([
            this.widgetsRolesTransformados$.pipe(startWith([])),
            this.filtroCodigoWidgetSubject,
            this.filtroCodigoRoleSubject,
            this.filtroEstadoSubject
        ]).pipe(
            map(([widgetsRel, codWidget, codRole, estado]) => {
                let filteredActs = widgetsRel
                if (codWidget !== 'todos') filteredActs = filteredActs.filter(rel => rel.codigoWidget === codWidget)
                if (codRole !== 'todos') filteredActs = filteredActs.filter(rel => rel.codigoRol === codRole)
                if (estado) filteredActs = filteredActs.filter(rel => rel.estadoRelacion === (estado === 'true'))
                return filteredActs
            })
        )
    }

    onFiltroCodigoWidgetChangeClick(evento: any): void {
        this.filtroCodigoWidgetSubject.next(evento.target.value)
    }

    onFiltroCodigoRoleChangeClick(evento: any): void {
        this.filtroCodigoRoleSubject.next(evento.target.value)
    }

    OnNuevoRegistroClick(): void {
        this._localStorageService.setObject('regId', this.codigoWidget)
        this.router.navigate(['utilidades/gestion-widget-roles'])
    }

    OnEliminarRegistroClick(evento: any): void {
        this._swalAlertService.getAlertQuestionRequest(
            this.translate.instant('WIDGETS.ELIMINARTEXTO'),
            this.translate.instant('WIDGETS.ELIMINARTITULO'),
            this.translate.instant('PLATAFORMA.DELETE'),
            this.translate.instant('PLATAFORMA.CANCEL')
        ).subscribe(result => {
            if (result) {
                // 🟢 Se utilizan las llaves compuestas requeridas por nuestro backend
                this._widgetsRolesService.removerRolDeWidget(evento.row.codigoWidget, evento.row.codigoRol).subscribe({
                    next: (resp: any) => {
                        if (resp.ok) {
                            this.registrarLog('201', 'WIDGETS.DELETESUCCSESSFULLY');
                            this._swalAlertService.getAlertSuccess(this.translate.instant('WIDGETS.DELETESUCCSESSFULLY'));
                        }
                    },
                    error: (err: any) => {
                        this.registrarLog('501', 'WIDGETS.DELETEERROR');
                        this._swalAlertService.getAlertError('No se pudo eliminar el permiso del Widget');
                    }
                });
            }
        })
    }

    onAccionPrincipal(evento: { accion: string, row: any }) {
        if (evento.accion === 'ESTADO') {
            this._swalAlertService.getAlertQuestionRequest(
                this.translate.instant('WIDGETS.REVOCARTEXTO'),
                this.translate.instant('WIDGETS.REVOCARTITULO'),
                this.translate.instant('PLATAFORMA.CONTINUE'),
                this.translate.instant('PLATAFORMA.CANCEL')
            ).subscribe(result => {
                if (result) {
                    const relacion = this.widgetsRoles.find(x => x.codigoWidget === evento.row.codigoWidget && x.codigoRol === evento.row.codigoRol);
                    if (!relacion) return;

                    // 🟢 DTO adaptado a la tabla PTLWidgets_Roles
                    const payload = {
                        codigoWidget: relacion.codigoWidget,
                        codigoRol: relacion.codigoRol,
                        estadoRelacion: !relacion.estadoRelacion,
                        codigoUsuarioModificacion: this._localStorageService.getUsuarioLocalStorage()?.codigoUsuario || '',
                        fechaModificacion: new Date().toISOString()
                    }

                    this._widgetsRolesService.toggleEstadoRelacion(relacion.codigoWidget, relacion.codigoRol, payload).subscribe({
                        next: (resp: any) => {
                            if (resp.ok) {
                                this.registrarLog('201', 'WIDGETS.UPDATESUCCSESSFULLY');
                                this._swalAlertService.getAlertSuccess(this.translate.instant('WIDGETS.UPDATESUCCSESSFULLY'));
                            }
                        },
                        error: (err: any) => {
                            this.registrarLog('501', 'WIDGETS.UPDATEERROR');
                            this._swalAlertService.getAlertError('No se pudo actualizar el permiso del Widget');
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
        this.router.navigate(['utilidades/widgets'])
    }

    toggleNav(): void {
        this.toggleSidebar.emit()
    }
}
