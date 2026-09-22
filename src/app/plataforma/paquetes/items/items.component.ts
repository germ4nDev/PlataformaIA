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
import { PTLItemModel } from 'src/app/theme/shared/_helpers/models/PTLItem.model';
import { PTLItemsService } from 'src/app/theme/shared/service/ptlitems.service';
import { PTLTipoItemModel } from 'src/app/theme/shared/_helpers/models/PTLTipoItem.model';

@Component({
    selector: 'app-items',
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
    templateUrl: './items.component.html',
    styleUrl: './items.component.scss'
})
export class ItemsComponent implements OnInit, OnDestroy {
    @Output() toggleSidebar = new EventEmitter<void>();

    hasFiltersSlot: boolean = true;
    gradientConfig;
    menuItems$!: Observable<NavigationItem[]>;
    activeTab: 'menu' | 'filters' = 'menu';
    suscriptor: string = '';

    subscriptions = new Subscription();
    filtroNombreSubject = new BehaviorSubject<string>('');
    filtroEstadoSubject = new BehaviorSubject<string>('todos');

    _itemsTransformados$: Observable<any[]> = of([]);
    _itemsFiltrados$: Observable<any[]> = of([]);
    itemsCatologo: PTLItemModel[] = [];
    tiposItems: PTLTipoItemModel[] = [];

    constructor(
        private router: Router,
        private cdr: ChangeDetectorRef,
        private translate: TranslateService,
        private _navigationService: NavigationService,
        private _localStorageService: LocalStorageService,
        private _logActividadesService: PtllogActividadesService,
        private _permisosService: PtlPermisosService,
        private _tiposItemsService: PtltiposItemsService,
        private _swalService: SwalAlertService,
        private _registrosService: PTLItemsService // 👈 Descomenta esto
    ) {
        this.gradientConfig = GradientConfig;
        this.suscriptor = this._localStorageService.getSuscriptorPlataformaLocalStorage();
    }

    ngOnInit(): void {
        this._localStorageService.removeObject('regId');
        this._navigationService.getNavigationItems();
        this.menuItems$ = this._navigationService.menuItems$;
        this.tiposItems = this._tiposItemsService.getTiposItemsActuales();
        this.setupItemsStream();

        this.subscriptions.add(
            this._registrosService.cargarRegistros().subscribe({
                next: () => console.log('✅ Ítems cargados en el servicio'),
                error: (err) => console.error('❌ Error al cargar ítems:', err)
            })
        );
    }

    ngOnDestroy(): void {
        this.subscriptions.unsubscribe();
    }

    setupItemsStream(): void {
        this._itemsTransformados$ = combineLatest([
            this._registrosService.items$,
            this._permisosService.actividadesAutorizadas$
        ]).pipe(
            map(([itemsBD, permisos]: [any[], string[]]) => {
                if (!itemsBD || itemsBD.length === 0) return [];

                return itemsBD.map((item: any) => {
                    const newItem: any = { ...item };
                    newItem.nomEstado = newItem.estadoItem ? 'Activo' : 'Inactivo';
                    const tipo = this.tiposItems.find(x => x.codigoTipoItem == newItem.codigoTipoItem);
                    newItem.nomTipoItem = tipo?.nombreTipo;

                    const accionesPermitidas: any[] = [];

                    if (permisos.includes('ACT_ITEMS_MODIFICAR')) {
                        accionesPermitidas.push({
                            accion: 'MODIFICAR', letra: 'M', color: '#2a5dbd',
                            tooltip: this.translate.instant('PLATAFORMA.EDITAR')
                        });
                    }

                    if (permisos.includes('ACT_ITEMS_ELIMINAR')) {
                        accionesPermitidas.push({
                            accion: 'ELIMINAR', letra: 'E', color: '#dd1717',
                            tooltip: this.translate.instant('PLATAFORMA.DELETE')
                        });
                    }

                    newItem._acciones = accionesPermitidas;
                    return newItem;
                });
            }),
            tap((regs) => {
                this.itemsCatologo = regs;
                this.cdr.detectChanges();
            }),
            catchError(err => {
                console.error('Error en el stream de ítems:', err);
                return of([]);
            })
        );

        this._itemsFiltrados$ = combineLatest([
            this._itemsTransformados$.pipe(startWith([])),
            this.filtroNombreSubject,
            this.filtroEstadoSubject
        ]).pipe(
            map(([items, nombre, estado]) => {
                let listado = items;

                if (nombre) {
                    const txt = nombre.toLowerCase();
                    listado = listado.filter(i => (i.nombreValor || '').toLowerCase().includes(txt));
                }

                if (estado !== 'todos') {
                    const bEstado = estado === 'true';
                    listado = listado.filter(i => i.estadoValor === bEstado);
                }

                return listado;
            })
        );
    }

    onAccionPrincipal(evento: { accion: string, row: any }) {
        const { accion, row } = evento;
        const id = row.codigoItem;

        switch (accion) {
            case 'MODIFICAR':
                console.log('modificar registro', id);
                this._localStorageService.setObject('regId', id);
                this.router.navigate(['paquetes/gestion-item']);
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
        this.router.navigate(['paquetes/gestion-item']);
    }

    eliminarRegistro(row: any): void {
        this._swalService.getAlertQuestionRequest(
            this.translate.instant('APLICACIONES.ELIMINARTEXTO') + ` "${row.nombreValor}".`,
            this.translate.instant('APLICACIONES.ELIMINARTITULO')
        ).subscribe(result => {
            if (result) {
                this._registrosService.deleteEliminarRegistro(row.codigoValor).subscribe({
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

    columnasItems: ColumnMetadata[] = [
        { name: 'nombreItem', header: 'Nombre del Ítem', type: 'text' },
        { name: 'nomTipoItem', header: 'Tipo', type: 'text' },
        { name: 'costoItem', header: 'Costo', type: 'price' },
        { name: 'valorUnitario', header: 'Precio Unitario', type: 'price' },
        { name: 'nomEstado', header: 'PLATAFORMA.STATUS', type: 'estado' }
    ];

    columnasDetailRegistros: ColumnMetadata[] = [
        { name: 'codigoValor', header: 'Código Interno', type: 'text' },
        { name: 'descripcionValor', header: 'Descripción', type: 'text' }
    ];
}
