/* eslint-disable @typescript-eslint/no-explicit-any */
import { Component, EventEmitter, OnDestroy, OnInit, Output, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataTablesModule } from 'angular-datatables';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { BehaviorSubject, Observable, Subscription, combineLatest, of } from 'rxjs';
import { catchError, map, startWith, tap } from 'rxjs/operators';
import { SharedModule } from 'src/app/theme/shared/shared.module';
import { GradientConfig } from 'src/app/app-config';
import { NavContentComponent } from 'src/app/theme/layout/admin/navigation/nav-content/nav-content.component';
import { NavBarComponent } from '../../../theme/layout/admin/nav-bar/nav-bar.component';
import { TableDataComponent } from 'src/app/theme/shared/components/table-data/table-data.component';
import { DataLoaderComponent } from 'src/app/theme/shared/components/data-loader/data-loader.component';

import { NavigationService } from 'src/app/theme/shared/service/navigation.service';
import { LocalStorageService, PtllogActividadesService, PtltiposItemsService, SwalAlertService } from 'src/app/theme/shared/service';
import { PtlPermisosService } from 'src/app/theme/shared/service/ptlpermisos.service';
import { ColumnMetadata } from 'src/app/theme/shared/_helpers/models/ColumnMetadata.model';
import { NavigationItem } from 'src/app/theme/shared/_helpers/models/Navigation.model';
import { PTLTipoItemModel } from 'src/app/theme/shared/_helpers/models/PTLTipoItem.model';

@Component({
    selector: 'app-tipos-item',
    standalone: true,
    imports: [
        CommonModule,
        DataTablesModule,
        SharedModule,
        TranslateModule,
        NavBarComponent,
        NavContentComponent,
        TableDataComponent,
        DataLoaderComponent
    ],
    templateUrl: './tipos-item.component.html',
    styleUrl: './tipos-item.component.scss'
})
export class TiposItemComponent implements OnInit, OnDestroy {
    @Output() toggleSidebar = new EventEmitter<void>();

    hasFiltersSlot: boolean = true;
    gradientConfig;
    menuItems$!: Observable<NavigationItem[]>;
    activeTab: 'menu' | 'filters' = 'menu';
    suscriptor: string = '';

    subscriptions = new Subscription();
    filtroNombreSubject = new BehaviorSubject<string>('');
    filtroEstadoSubject = new BehaviorSubject<string>('todos');

    _tiposTransformados$: Observable<any[]> = of([]);
    _tiposFiltrados$: Observable<any[]> = of([]);
    tiposCatalogo: PTLTipoItemModel[] = [];

    constructor(
        private router: Router,
        private cdr: ChangeDetectorRef,
        private translate: TranslateService,
        private _navigationService: NavigationService,
        private _localStorageService: LocalStorageService,
        private _logActividadesService: PtllogActividadesService,
        private _permisosService: PtlPermisosService,
        private _swalService: SwalAlertService,
        private _registrosService: PtltiposItemsService // Inyección de Tipos
    ) {
        this.gradientConfig = GradientConfig;
        this.suscriptor = this._localStorageService.getSuscriptorPlataformaLocalStorage();
    }

    ngOnInit(): void {
        this._localStorageService.removeObject('regId');
        this._navigationService.getNavigationItems();
        this.menuItems$ = this._navigationService.menuItems$;

        this.setupTiposStream();

        this.subscriptions.add(
            this._registrosService.cargarRegistros().subscribe({
                next: () => console.log('✅ Tipos de Ítem cargados en el servicio'),
                error: (err) => console.error('❌ Error al cargar tipos de ítem:', err)
            })
        );
    }

    ngOnDestroy(): void {
        this.subscriptions.unsubscribe();
    }

    setupTiposStream(): void {
        this._tiposTransformados$ = combineLatest([
            this._registrosService.tiposItems$,
            this._permisosService.actividadesAutorizadas$
        ]).pipe(
            map(([tiposBD, permisos]: [any[], string[]]) => {
                if (!tiposBD || tiposBD.length === 0) return [];

                return tiposBD.map((tipo: any) => {
                    const newTipo: any = { ...tipo };
                    newTipo.nomEstado = newTipo.estadoTipo ? 'Activo' : 'Inactivo';

                    let claseBase = newTipo.iconoTipo || 'feather icon-more-horizontal';
                    if (claseBase.startsWith('icon-')) {
                        claseBase = `feather ${claseBase}`; // Si es Feather, le agregamos la familia
                    }

                    newTipo.claseIconoTabla = claseBase;
                    const accionesPermitidas: any[] = [];

                    if (permisos.includes('ACT_TIPOS_ITEM_MODIFICAR')) {
                        accionesPermitidas.push({
                            accion: 'MODIFICAR', letra: 'M', color: '#2a5dbd',
                            tooltip: this.translate.instant('PLATAFORMA.EDITAR')
                        });
                    }

                    if (permisos.includes('ACT_TIPOS_ITEM_ELIMINAR')) {
                        accionesPermitidas.push({
                            accion: 'ELIMINAR', letra: 'E', color: '#dd1717',
                            tooltip: this.translate.instant('PLATAFORMA.DELETE')
                        });
                    }

                    newTipo._acciones = accionesPermitidas;
                    return newTipo;
                });
            }),
            tap((regs) => {
                this.tiposCatalogo = regs;
                this.cdr.detectChanges();
            }),
            catchError(err => {
                console.error('Error en el stream de tipos de ítems:', err);
                return of([]);
            })
        );

        // 2. Aplicación de filtros en tiempo real
        this._tiposFiltrados$ = combineLatest([
            this._tiposTransformados$.pipe(startWith([])),
            this.filtroNombreSubject,
            this.filtroEstadoSubject
        ]).pipe(
            map(([tipos, nombre, estado]) => {
                let listado = tipos;

                if (nombre) {
                    const txt = nombre.toLowerCase();
                    listado = listado.filter(t => (t.nombreTipo || '').toLowerCase().includes(txt));
                }

                if (estado !== 'todos') {
                    const bEstado = estado === 'true';
                    listado = listado.filter(t => t.estadoTipo === bEstado);
                }

                return listado;
            })
        );
    }

    onAccionPrincipal(evento: { accion: string, row: any }) {
        const { accion, row } = evento;
        const id = row.codigoTipoItem;

        switch (accion) {
            case 'MODIFICAR':
                this._localStorageService.setObject('regId', id);
                this.router.navigate(['paquetes/gestion-tipo-item']);
                break;

            case 'ELIMINAR':
                this.eliminarRegistro(row);
                break;

            default:
                console.warn(`Acción no reconocida: ${accion}`);
                break;
        }
    }

    OnNuevoRegistroClick(): void {
        this._localStorageService.setObject('regId', 'nuevo');
        this.router.navigate(['paquetes/gestion-tipo-item']);
    }

    eliminarRegistro(row: any): void {
        this._swalService.getAlertQuestionRequest(
            this.translate.instant('APLICACIONES.ELIMINARTEXTO') + ` "${row.nombreTipo}".`,
            this.translate.instant('APLICACIONES.ELIMINARTITULO')
        ).subscribe(result => {
            if (result) {
                this._registrosService.deleteEliminarRegistro(row.codigoTipoItem).subscribe({
                    next: (resp: any) => {
                        const logData = { codigoTipoLog: '', codigoRespuesta: '201', descripcionLog: this.translate.instant('APLICACIONES.ELIMINAREXITOSA') + ' ' + resp.mensaje };
                        this._logActividadesService.postCrearRegistro(logData).subscribe();
                        this._swalService.getAlertSuccess(resp.mensaje);
                        this._registrosService.cargarRegistros().subscribe();
                    },
                    error: (err: any) => {
                        const logData = { codigoTipoLog: '', codigoRespuesta: '501', descripcionLog: this.translate.instant('APLICACIONES.ELIMINARERROR') + ' ' + err.mensaje };
                        this._logActividadesService.postCrearRegistro(logData).subscribe();
                        this._swalService.getAlertError(err.mensaje);
                        this._registrosService.cargarRegistros().subscribe();
                    }
                });
            }
        });
    }

    onFiltroNombreChangeClick(evento: any) { this.filtroNombreSubject.next(evento.target.value); }
    onFiltroEstadoChangeClick(evento: any) { this.filtroEstadoSubject.next(evento.target.value); }
    toggleNav(): void { this.toggleSidebar.emit(); }

    columnasTipos: ColumnMetadata[] = [
        { name: 'claseIconoTabla', header: 'Ícono', type: 'icon' },
        { name: 'nombreTipo', header: 'Nombre del Tipo', type: 'text' },
        { name: 'nomEstado', header: 'PLATAFORMA.STATUS', type: 'estado' }
    ];

    columnasDetailRegistros: ColumnMetadata[] = [
        { name: 'codigoTipoItem', header: 'Código Interno', type: 'text' },
        { name: 'descripcionTipo', header: 'Descripción', type: 'text' }
    ];
}
