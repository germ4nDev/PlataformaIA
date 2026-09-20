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

// Componentes QPLUS
import { NavContentComponent } from 'src/app/theme/layout/admin/navigation/nav-content/nav-content.component';
import { NavBarComponent } from '../../../theme/layout/admin/nav-bar/nav-bar.component';
import { TableDataComponent } from 'src/app/theme/shared/components/table-data/table-data.component';
import { DataLoaderComponent } from 'src/app/theme/shared/components/data-loader/data-loader.component';

// Servicios y Modelos
import { NavigationService } from 'src/app/theme/shared/service/navigation.service';
import { LocalStorageService, PtllogActividadesService, SwalAlertService } from 'src/app/theme/shared/service';
import { PtlPermisosService } from 'src/app/theme/shared/service/ptlpermisos.service';
import { ColumnMetadata } from 'src/app/theme/shared/_helpers/models/ColumnMetadata.model';
import { NavigationItem } from 'src/app/theme/shared/_helpers/models/Navigation.model';
import Swal from 'sweetalert2';

// 🟢 ASUME QUE TIENES ESTE SERVICIO CREADO PARA CONSUMIR LOS ITEMS
// import { PTLItemsService } from 'src/app/theme/shared/service/ptl-items.service';

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

    // Filtros
    filtroNombreSubject = new BehaviorSubject<string>('');
    filtroEstadoSubject = new BehaviorSubject<string>('todos');

    // Observables de la tabla
    itemsTransformados$: Observable<any[]> = of([]);
    itemsFiltrados$: Observable<any[]> = of([]);
    itemsCatologo: any[] = []; // Reemplazar 'any' por tu PTLItemsModel si lo tienes

    constructor(
        private router: Router,
        private cdr: ChangeDetectorRef,
        private translate: TranslateService,
        private _navigationService: NavigationService,
        private _localStorageService: LocalStorageService,
        private _logActividadesService: PtllogActividadesService,
        private _permisosService: PtlPermisosService,
        private _swalService: SwalAlertService,
        // private _registrosService: PTLItemsService // 👈 Descomenta esto
    ) {
        this.gradientConfig = GradientConfig;
        this.suscriptor = this._localStorageService.getSuscriptorPlataformaLocalStorage();
    }

    ngOnInit(): void {
        this._navigationService.getNavigationItems();
        this.menuItems$ = this._navigationService.menuItems$;

        this.setupItemsStream();

        // 🟢 Carga inicial de datos
        /*
        this.subscriptions.add(
            this._registrosService.cargarRegistros().subscribe({
                next: () => console.log('✅ Ítems cargados en el servicio'),
                error: (err) => console.error('❌ Error al cargar ítems:', err)
            })
        );
        */
    }

    ngOnDestroy(): void {
        this.subscriptions.unsubscribe();
    }

    setupItemsStream(): void {
        // 1. Mapeo de datos y cálculo de acciones según permisos
        this.itemsTransformados$ = combineLatest([of([]), // 👈 Reemplazar 'of([])' por 'this._registrosService.items$'
        this._permisosService.actividadesAutorizadas$
        ]).pipe(
            map(([itemsBD, permisos]: [any[], string[]]) => {
                if (!itemsBD || itemsBD.length === 0) return [];

                return itemsBD.map((item: any) => {
                    const newItem: any = { ...item };
                    newItem.nomEstado = newItem.estadoValor ? 'Activo' : 'Inactivo';

                    // Asignación de botones de acción
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

        // 2. Aplicación de filtros en tiempo real
        this.itemsFiltrados$ = combineLatest([
            this.itemsTransformados$.pipe(startWith([])),
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

    // 🟢 Manejo centralizado de clics en la tabla
    onAccionPrincipal(evento: { accion: string, row: any }) {
        const { accion, row } = evento;
        const id = row.codigoValor;

        switch (accion) {
            case 'MODIFICAR':
                this._localStorageService.setObject('regId', id);
                this.router.navigate(['aplicaciones/gestion-item']);
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
        this.router.navigate(['aplicaciones/gestion-item']);
    }

    eliminarRegistro(row: any): void {
        this._swalService.getAlertQuestionRequest(
            this.translate.instant('APLICACIONES.ELIMINARTEXTO') + ` "${row.nombreValor}".`,
            this.translate.instant('APLICACIONES.ELIMINARTITULO')
        ).subscribe(result => {
            if (result) {
                /*
                this._registrosService.deleteEliminarRegistro(row.codigoValor).subscribe({
                    next: (resp: any) => {
                        const logData = { codigoTipoLog: '', codigoRespuesta: '201', descripcionLog: this.translate.instant('APLICACIONES.ELIMINAREXITOSA') + ' ' + resp.mensaje };
                        this._logActividadesService.postCrearRegistro(logData).subscribe();
                        this._swalService.getAlertSuccess(resp.mensaje);
                    },
                    error: (err: any) => {
                        const logData = { codigoTipoLog: '', codigoRespuesta: '501', descripcionLog: this.translate.instant('APLICACIONES.ELIMINARERROR') + ' ' + err.mensaje };
                        this._logActividadesService.postCrearRegistro(logData).subscribe();
                        this._swalService.getAlertError(err.mensaje);
                    }
                });
                */
                console.log("Mock eliminar:", row.codigoValor);
            }
        });
    }

    // Eventos de los inputs de filtro
    onFiltroNombreChangeClick(evento: any) { this.filtroNombreSubject.next(evento.target.value); }
    onFiltroEstadoChangeClick(evento: any) { this.filtroEstadoSubject.next(evento.target.value); }
    toggleNav(): void { this.toggleSidebar.emit(); }

    // 🟢 Definición de Columnas para app-table-data
    columnasItems: ColumnMetadata[] = [
        { name: 'nombreValor', header: 'Nombre del Ítem', type: 'text' },
        { name: 'costoValor', header: 'Costo', type: 'price' },
        { name: 'valorUnitario', header: 'Precio Unitario', type: 'price' },
        { name: 'nomEstado', header: 'PLATAFORMA.STATUS', type: 'estado' }
    ];

    columnasDetailRegistros: ColumnMetadata[] = [
        { name: 'codigoValor', header: 'Código Interno', type: 'text' },
        { name: 'descripcionValor', header: 'Descripción', type: 'text' }
    ];
}
