/* eslint-disable @typescript-eslint/no-explicit-any */
import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { DataTablesModule } from 'angular-datatables';
import { Subscription, Observable, tap, catchError, of, BehaviorSubject, combineLatest } from 'rxjs';
import { map, startWith, switchMap } from 'rxjs/operators';
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
import { PTLAplicacionModel } from 'src/app/theme/shared/_helpers/models/PTLAplicacion.model';
import { PTLItemPaquete } from 'src/app/theme/shared/_helpers/models/PTLItemPaquete.model';
import { PTLTipoItemModel } from '../../../../theme/shared/_helpers/models/PTLTipoItem.model';
import { PTLItems } from 'src/app/theme/shared/_helpers/models/PTLItem.model';

import {
    NavigationService, SwalAlertService, LocalStorageService,
    PtllogActividadesService, PtlAplicacionesService, PtltiposItemsService,
    PtlvaloresUnitariosService
} from 'src/app/theme/shared/service';
import { PtlItemsPaqueteService } from 'src/app/theme/shared/service/ptlitems-paquete.service';
import { PtlPermisosService } from 'src/app/theme/shared/service/ptlpermisos.service';

@Component({
    selector: 'app-items-paquete',
    standalone: true,
    imports: [
        CommonModule, DataTablesModule, SharedModule, TranslateModule,
        NavBarComponent, NavContentComponent, TableDataComponent, DataLoaderComponent
    ],
    templateUrl: './items-paquete.component.html',
    styleUrl: './items-paquete.component.scss'
})
export class ItemsPaqueteComponent implements OnInit, OnDestroy {
    @Output() toggleSidebar = new EventEmitter<void>();

    registros: PTLItemPaquete[] = [];
    registroId: string = '';
    moduloTituloExcel: string = '';
    hasFiltersSlot: boolean = false;
    gradientConfig = GradientConfig;
    lang = localStorage.getItem('lang');
    menuItems$!: Observable<NavigationItem[]>;
    activeTab: 'menu' | 'filters' | 'main' = 'menu';

    tiposValor: PTLTipoItemModel[] = [];
    listaPrecios: PTLItems[] = [];
    suscriptor: string = '';

    subscriptions = new Subscription();
    filtroValorSubject = new BehaviorSubject<string>('todos');
    filtroNombreSubject = new BehaviorSubject<string>('todos');
    filtroDescripcionSubject = new BehaviorSubject<string>('');
    filtroEstadoSubject = new BehaviorSubject<string>('todos');

    itemsPaqueteTransformados$: Observable<PTLItemPaquete[]> = of([]);
    itemsPaqueteFiltrados$: Observable<PTLItemPaquete[]> = of([]);

    constructor(
        private router: Router,
        private route: ActivatedRoute,
        private cdr: ChangeDetectorRef,
        private translate: TranslateService,
        private _navigationService: NavigationService,
        private _swalService: SwalAlertService,
        private _localStorageService: LocalStorageService,
        private _logActividadesService: PtllogActividadesService,
        private _registrosService: PtlItemsPaqueteService,
        private _tiposItemsService: PtltiposItemsService,
        private _listaPreciosService: PtlvaloresUnitariosService,
        private _permisosService: PtlPermisosService
    ) {
        this.suscriptor = this._localStorageService.getSuscriptorPlataformaLocalStorage();
        this.registroId = this._localStorageService.getObject<string>('regId') || '';
    }

    ngOnInit(): void {
        this._navigationService.getNavigationItems();
        this.menuItems$ = this._navigationService.menuItems$;
        this.hasFiltersSlot = true;
        this.moduloTituloExcel = this.lang == 'es' ? 'Listado de Ítems' : 'List of Items';

        this.consultarTiposValor();
        this.setupItemsPaquetesStream();

        this.subscriptions.add(
            this._registrosService.cargarRegistros().subscribe({
                next: () => console.log('✅ Ítems cargados en el servicio'),
                error: err => console.error('Error al cargar ítems:', err)
            })
        );
    }

    ngOnDestroy(): void {
        this.subscriptions.unsubscribe();
    }

    consultarTiposValor() {
        this.subscriptions.add(
            this._tiposItemsService.getRegistros().subscribe({
                next: (resp: any) => {
                    if (resp.ok) this.tiposValor = resp.tiposValor.filter((x: any) => x.estadoTipo == true);
                },
                error: err => console.log('Error tipos valor', err)
            })
        );
    }

    onTipoValorChangeClick(evento: any) {
        const tipoValor = this.tiposValor.find(x => x.codigoTipoItem == evento.target.value);
        if (tipoValor) this.consultarListaPrecios(tipoValor.codigoTipoItem || '');
    }

    consultarListaPrecios(tipoId: string) {
        this.subscriptions.add(
            this._listaPreciosService.getRegistros().subscribe({
                next: (resp: any) => {
                    if (resp.ok) {
                        const activos = resp.valoresUnitarios.filter((x: any) => x.estadoValor == true);
                        this.listaPrecios = activos.filter((x: any) => x.codigoTipo == tipoId);
                    }
                },
                error: err => console.log('Error lista precios', err)
            })
        );
    }

    setupItemsPaquetesStream(): void {
        this.itemsPaqueteTransformados$ = combineLatest([
            this._registrosService.itemsPaquetes$,
            this._permisosService.actividadesAutorizadas$
        ]).pipe(
            map(([paqs, permisos]: [PTLItemPaquete[], string[]]) => {
                if (!paqs || paqs.length === 0) return [];

                const transformedPacks = paqs.map((paq: any) => {
                    const newPaq = { ...paq };
                    newPaq.nomEstado = newPaq.estadoItem ? 'Activo' : 'Inactivo';

                    // 🟢 Construcción Dinámica de Botones
                    const accionesPermitidas: any[] = [];

                    if (permisos.includes('ACT_ITEMPQ_MODIFICAR')) {
                        accionesPermitidas.push({
                            accion: 'MODIFICAR', letra: 'M', color: '#2a5dbd',
                            tooltip: this.translate.instant('PLATAFORMA.EDITAR')
                        });
                    }
                    if (permisos.includes('ACT_ITEMPQ_ELIMINAR')) {
                        accionesPermitidas.push({
                            accion: 'ELIMINAR', letra: 'E', color: '#dd1717',
                            tooltip: this.translate.instant('PLATAFORMA.DELETE')
                        });
                    }

                    newPaq._acciones = accionesPermitidas;
                    return newPaq as PTLItemPaquete;
                });

                return transformedPacks;
            }),
            tap((regs) => {
                this.registros = regs;
                this.cdr.detectChanges();
            }),
            catchError(err => {
                console.error('Error en el stream de ítems paquete:', err);
                return of([]);
            })
        );

        this.itemsPaqueteFiltrados$ = combineLatest([
            this.itemsPaqueteTransformados$.pipe(startWith([])),
            this.filtroValorSubject,
            this.filtroNombreSubject,
            this.filtroDescripcionSubject,
            this.filtroEstadoSubject
        ]).pipe(
            map(([paqs, codigo, nombre, descripcion, estado]) => {
                let filteredItems = paqs;
                if (codigo !== 'todos') filteredItems = filteredItems.filter(app => app.codigoValor === codigo);
                if (nombre !== 'todos') filteredItems = filteredItems.filter((mod: any) => (mod.nombreItem || '').toLowerCase().includes(nombre.toLowerCase()));
                if (estado !== 'todos') filteredItems = filteredItems.filter((mod: any) => mod.estadoItem === (estado === 'true'));
                if (descripcion) filteredItems = filteredItems.filter((mod: any) => (mod.descripcionItem || '').toLowerCase().includes(descripcion.toLowerCase()));
                return filteredItems;
            })
        );
    }

    // ==========================================
    // 🟢 ENRUTADOR CENTRAL DE ACCIONES
    // ==========================================
    onAccionPrincipal(evento: { accion: string, row: any }) {
        const { accion, row } = evento;
        const id = row.codigoItem;

        switch (accion) {
            case 'MODIFICAR':
                this._localStorageService.setObject('regId', id);
                this._localStorageService.setObject('regPQ', this.registroId);
                this.router.navigate(['aplicaciones/gestion-itempq']);
                break;
            case 'ELIMINAR':
                this.eliminarItem(row);
                break;
            default:
                break;
        }
    }

    eliminarItem(row: any): void {
        this._swalService.getAlertQuestionRequest(
            this.translate.instant('APLICACIONES.ELIMINARTEXTO') + ` "${row.nombreItem}".`,
            this.translate.instant('APLICACIONES.ELIMINARTITULO')
        ).subscribe(result => {
            if (result) {
                this._registrosService.deleteEliminarRegistro(row.codigoItem).subscribe({
                    next: (resp: any) => {
                        const logData = { codigoTipoLog: '', codigoRespuesta: '201', descripcionLog: this.translate.instant('APLICACIONES.ELIMINAREXITOSA') };
                        this._logActividadesService.postCrearRegistro(logData).subscribe();
                        this._swalService.getAlertSuccess(resp.mensaje);
                    },
                    error: err => {
                        this._swalService.getAlertError(this.translate.instant('APLICACIONES.ELIMINARERROR'));
                    }
                });
            }
        });
    }

    OnNuevoRegistroClick(): void {
        this._localStorageService.setObject('regId', 'nuevo');
        this._localStorageService.setObject('regPQ', this.registroId);
        this.router.navigate(['aplicaciones/gestion-itempq']);
    }

    OnRegresarClick() {
        this.router.navigate(['aplicaciones/paquetes']);
    }

    onFiltroValorChangeClick(evento: any) { this.filtroValorSubject.next(evento.target.value); }
    onFiltroNombreChangeClick(evento: any) { this.filtroNombreSubject.next(evento.target.value); }
    onFiltroDescripcionChangeClick(evento: any) { this.filtroDescripcionSubject.next(evento.target.value); }
    onFiltroEstadoChangeClick(evento: any) { this.filtroEstadoSubject.next(evento.target.value); }
    toggleNav(): void { this.toggleSidebar.emit(); }

    columnasPaquetes: ColumnMetadata[] = [
        { name: 'nombreItem', header: 'ITEMS.NAME', type: 'text' },
        { name: 'cantidad', header: 'ITEMS.CANTIDAD', type: 'number' },
        { name: 'valorUnitario', header: 'ITEMS.VALOR', type: 'price' },
        { name: 'valoresAdicionales', header: 'ITEMS.ADICIONALES', type: 'price' },
        { name: 'valorTotal', header: 'ITEMS.TOTAL', type: 'price' },
        { name: 'nomEstado', header: 'ITEMS.STATUS', type: 'estado' }
    ];

    columnasDetailRegistros: ColumnMetadata[] = [
        { name: 'codigoItem', header: 'ITEMS.CODE', type: 'text' },
        { name: 'codigoPaquete', header: 'ITEMS.CODEPAQUETE', type: 'text' },
        { name: 'codigoValor', header: 'ITEMS.CODEVALOR', type: 'text' },
        { name: 'descripcionItem', header: 'ITEMS.DESCRIPCION', type: 'text' }
    ];
}
