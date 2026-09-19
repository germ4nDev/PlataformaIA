/* eslint-disable @typescript-eslint/no-explicit-any */
import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { DataTablesModule } from 'angular-datatables';
import { Subscription, Observable, of, BehaviorSubject, combineLatest } from 'rxjs';
import { catchError, map, startWith, switchMap, tap } from 'rxjs/operators';
import { GradientConfig } from 'src/app/app-config';
import { SharedModule } from 'src/app/theme/shared/shared.module';

// Componentes QPLUS
import { NavBarComponent } from 'src/app/theme/layout/admin/nav-bar/nav-bar.component';
import { NavContentComponent } from 'src/app/theme/layout/admin/navigation/nav-content/nav-content.component';
import { TableDataComponent } from 'src/app/theme/shared/components/table-data/table-data.component';
import { DataLoaderComponent } from 'src/app/theme/shared/components/data-loader/data-loader.component';

// Servicios y Modelos
import { ColumnMetadata } from 'src/app/theme/shared/_helpers/models/ColumnMetadata.model';
import { NavigationItem } from 'src/app/theme/shared/_helpers/models/Navigation.model';

import {
    NavigationService, SwalAlertService, LocalStorageService,
    PtllogActividadesService
} from 'src/app/theme/shared/service';
import { PtlPermisosService } from 'src/app/theme/shared/service/ptlpermisos.service';
import { PTLListasPreciosService } from 'src/app/theme/shared/service/ptllistas-precios.service';

@Component({
    selector: 'app-precios-paquete',
    standalone: true,
    imports: [
        CommonModule, DataTablesModule, SharedModule, TranslateModule,
        NavBarComponent, NavContentComponent, TableDataComponent, DataLoaderComponent
    ],
    templateUrl: './precios-paquete.component.html',
    styleUrl: './precios-paquete.component.scss'
})
export class PreciosPaqueteComponent implements OnInit, OnDestroy {
    @Output() toggleSidebar = new EventEmitter<void>();

    registros: any[] = [];
    paqueteId: string = ''; // Aquí guardaremos el código del paquete actual
    moduloTituloExcel: string = '';
    hasFiltersSlot: boolean = false;
    gradientConfig = GradientConfig;
    lang = localStorage.getItem('lang');
    menuItems$!: Observable<NavigationItem[]>;
    activeTab: 'menu' | 'filters' | 'main' = 'menu';
    suscriptor: string = '';

    subscriptions = new Subscription();

    // Subject para recargar la tabla tras eliminar un precio sin recargar toda la vista
    refreshListas$ = new BehaviorSubject<boolean>(true);

    filtroNombreSubject = new BehaviorSubject<string>('');
    filtroMonedaSubject = new BehaviorSubject<string>('todos');
    filtroEstadoPrecioSubject = new BehaviorSubject<string>('todos');

    listasTransformadas$: Observable<any[]> = of([]);
    listasFiltradas$: Observable<any[]> = of([]);

    constructor(
        private router: Router,
        private cdr: ChangeDetectorRef,
        private translate: TranslateService,
        private _navigationService: NavigationService,
        private _swalService: SwalAlertService,
        private _localStorageService: LocalStorageService,
        private _logActividadesService: PtllogActividadesService,
        private _permisosService: PtlPermisosService,
        private _listasPreciosService: PTLListasPreciosService
    ) {
        this.suscriptor = this._localStorageService.getSuscriptorPlataformaLocalStorage();
        // Obtenemos el ID del paquete sobre el que dimos click en la pantalla maestra de Paquetes
        this.paqueteId = this._localStorageService.getObject<string>('regId') || '';
    }

    ngOnInit(): void {
        this._navigationService.getNavigationItems();
        this.menuItems$ = this._navigationService.menuItems$;
        this.hasFiltersSlot = true;
        this.moduloTituloExcel = this.lang == 'es' ? 'Precios del Paquete' : 'Package Prices';

        this.setupPreciosStream();
    }

    ngOnDestroy(): void {
        this.subscriptions.unsubscribe();
    }

    setupPreciosStream(): void {
        this.listasTransformadas$ = combineLatest([
            this.refreshListas$.pipe(switchMap(() => this._listasPreciosService.cargarRegistros())),
            this._permisosService.actividadesAutorizadas$
        ]).pipe(
            map(([resp, permisos]: [any, string[]]) => {
                if (!resp.ok || !resp.data) return [];

                const listasAPI = resp.data;

                return listasAPI.map((lista: any) => {
                    const newRow = { ...lista };

                    // Buscamos si dentro de los detalles de esta lista, ya hay un precio para ESTE paquete
                    const detallePrecio = lista.detalles?.find((d: any) => d.codigoReferencia === this.paqueteId);
                    const tienePrecio = !!detallePrecio;

                    // 🟢 Mapeo de la nueva estrategia financiera (Costo Base y Valor Venta)
                    newRow.codigoDetalle = detallePrecio ? detallePrecio.codigoDetalle : null;
                    newRow.costoBaseMensual = detallePrecio ? detallePrecio.costoBaseMensual : 0;
                    newRow.valorBaseMensual = detallePrecio ? detallePrecio.valorBaseMensual : 0;
                    newRow.precioSetup = detallePrecio ? detallePrecio.precioSetup : 0;

                    newRow.estadoPrecio = tienePrecio;
                    newRow.nomEstadoPrecio = tienePrecio ? 'Configurado' : 'Sin Configurar';

                    // 🟢 Construcción Dinámica de Botones (_acciones)
                    const accionesPermitidas: any[] = [];

                    // Solo inyectamos los botones si el rol del usuario tiene el permiso
                    if (permisos.includes('ACT_PRECIO_MODIFICAR')) {
                        if (tienePrecio) {
                            // Si ya tiene precio, mostramos Modificar (M) y Eliminar (E)
                            accionesPermitidas.push({
                                accion: 'MODIFICAR', letra: 'M', color: '#2a5dbd',
                                tooltip: this.translate.instant('PLATAFORMA.EDITAR')
                            });
                            accionesPermitidas.push({
                                accion: 'ELIMINAR', letra: 'E', color: '#dd1717',
                                tooltip: this.translate.instant('PLATAFORMA.DELETE')
                            });
                        } else {
                            // Si NO tiene precio, mostramos Agregar (+)
                            accionesPermitidas.push({
                                accion: 'AGREGAR', letra: '+', color: '#28a745',
                                tooltip: this.translate.instant('PLATAFORMA.ADD')
                            });
                        }
                    }

                    newRow._acciones = accionesPermitidas;
                    return newRow;
                });
            }),
            tap((regs) => {
                this.registros = regs;
                this.cdr.detectChanges();
            }),
            catchError(err => {
                console.error('Error en stream de precios:', err);
                return of([]);
            })
        );

        this.listasFiltradas$ = combineLatest([
            this.listasTransformadas$.pipe(startWith([])),
            this.filtroNombreSubject,
            this.filtroMonedaSubject,
            this.filtroEstadoPrecioSubject
        ]).pipe(
            map(([listas, nombre, moneda, estado]) => {
                let filteredListas = listas;

                if (nombre) filteredListas = filteredListas.filter((l: any) => (l.nombreLista || '').toLowerCase().includes(nombre.toLowerCase()));
                if (moneda !== 'todos') filteredListas = filteredListas.filter((l: any) => l.moneda === moneda);
                if (estado !== 'todos') filteredListas = filteredListas.filter((l: any) => l.estadoPrecio === (estado === 'true'));

                return filteredListas;
            })
        );
    }

    // ==========================================
    // 🟢 ENRUTADOR CENTRAL DE ACCIONES
    // ==========================================
    onAccionPrincipal(evento: { accion: string, row: any }) {
        const { accion, row } = evento;

        switch (accion) {
            case 'AGREGAR':
            case 'MODIFICAR':
                // Guardamos la lista destino y el id del detalle (si es modificar)
                this._localStorageService.setObject('listaId', row.codigoLista);
                this._localStorageService.setObject('detalleId', row.codigoDetalle || 'nuevo');
                // Navegamos al formulario gestion-preciopq
                this.router.navigate(['aplicaciones/gestion-preciopq']);
                break;
            case 'ELIMINAR':
                this.eliminarPrecio(row);
                break;
            default:
                break;
        }
    }

    eliminarPrecio(row: any): void {
        this._swalService.getAlertQuestionRequest(
            this.translate.instant('APLICACIONES.ELIMINARTEXTO'),
            this.translate.instant('APLICACIONES.ELIMINARTITULO')
        ).subscribe(result => {
            if (result && row.codigoDetalle) {
                this.subscriptions.add(
                    this._listasPreciosService.eliminarPrecioDetalle(row.codigoDetalle).subscribe({
                        next: (resp: any) => {
                            const logData = { codigoTipoLog: '', codigoRespuesta: '201', descripcionLog: 'Precio eliminado' };
                            this._logActividadesService.postCrearRegistro(logData).subscribe();
                            this._swalService.getAlertSuccess(resp.msg || 'Precio eliminado exitosamente');
                            this.refreshListas$.next(true); // Recargamos la data de la tabla
                        },
                        error: err => {
                            this._swalService.getAlertError('Error al eliminar el precio.');
                        }
                    })
                );
            }
        });
    }

    OnRegresarClick() {
        this.router.navigate(['aplicaciones/paquetes']);
    }

    onFiltroNombreChangeClick(evento: any) { this.filtroNombreSubject.next(evento.target.value); }
    onFiltroMonedaChangeClick(evento: any) { this.filtroMonedaSubject.next(evento.target.value); }
    onFiltroEstadoPrecioChangeClick(evento: any) { this.filtroEstadoPrecioSubject.next(evento.target.value); }
    toggleNav(): void { this.toggleSidebar.emit(); }

    // 🟢 Columnas actualizadas con la estrategia Costo vs Valor Venta
    columnasPrecios: ColumnMetadata[] = [
        { name: 'nombreLista', header: 'PRECIOS.LISTA', type: 'text' },
        { name: 'moneda', header: 'PRECIOS.MONEDA', type: 'text' },
        { name: 'costoBaseMensual', header: 'PRECIOS.COSTOMES', type: 'price' },
        { name: 'valorBaseMensual', header: 'PRECIOS.VALORMES', type: 'price' },
        { name: 'nomEstadoPrecio', header: 'PRECIOS.CONFIGURADO', type: 'estado' }
    ];

    columnasDetailRegistros: ColumnMetadata[] = [
        { name: 'codigoLista', header: 'PRECIOS.CODELISTA', type: 'text' },
        { name: 'paisAplica', header: 'PRECIOS.PAIS', type: 'text' },
        { name: 'precioSetup', header: 'PRECIOS.SETUP', type: 'price' }
    ];
}
