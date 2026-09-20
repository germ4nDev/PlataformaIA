/* eslint-disable @typescript-eslint/no-explicit-any */
import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { DataTablesModule } from 'angular-datatables';
import { Subscription, Observable, of, BehaviorSubject, combineLatest } from 'rxjs';
import { catchError, map, startWith, tap } from 'rxjs/operators';
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
import { PTLModuloAP } from 'src/app/theme/shared/_helpers/models/PTLModuloAP.model';
import { PTLModuloPQModel } from 'src/app/theme/shared/_helpers/models/PTLModuloPQ.model';
import { PTLSuiteAPModel } from 'src/app/theme/shared/_helpers/models/PTLSuiteAP.model';

import {
    NavigationService, SwalAlertService, LocalStorageService,
    PtllogActividadesService, PtlAplicacionesService, PtlSuitesAPService,
    PtlmodulosApService
} from 'src/app/theme/shared/service';
import { PTLModulosPaqueteService } from 'src/app/theme/shared/service/ptlmodulos-paquete.service';
import { PtlPermisosService } from 'src/app/theme/shared/service/ptlpermisos.service';

@Component({
    selector: 'app-modulos-paquete',
    standalone: true,
    imports: [
        CommonModule, DataTablesModule, SharedModule, TranslateModule,
        NavBarComponent, NavContentComponent, TableDataComponent, DataLoaderComponent
    ],
    templateUrl: './modulos-paquete.component.html',
    styleUrl: './modulos-paquete.component.scss'
})
export class ModulosPaqueteComponent implements OnInit, OnDestroy {
    @Output() toggleSidebar = new EventEmitter<void>();

    registros: PTLModuloPQModel[] = [];
    registroId: string = '';
    aplicaciones: PTLAplicacionModel[] = [];
    suites: PTLSuiteAPModel[] = [];
    modulosPadre: PTLModuloAP[] = [];
    suscriptor: string = '';
    moduloTituloExcel: string = '';
    hasFiltersSlot: boolean = false;
    gradientConfig = GradientConfig;
    lang = localStorage.getItem('lang');
    menuItems$!: Observable<NavigationItem[]>;
    activeTab: 'menu' | 'filters' | 'main' = 'menu';

    subscriptions = new Subscription();
    filtroCodigoSubject = new BehaviorSubject<string>('todos');
    filtroEstadoSubject = new BehaviorSubject<string>('todos');

    modulosPaqueteTransformados$: Observable<PTLModuloPQModel[]> = of([]);
    modulosPaqueteFiltrados$: Observable<PTLModuloPQModel[]> = of([]);

    constructor(
        private router: Router,
        private route: ActivatedRoute,
        private cdr: ChangeDetectorRef,
        private translate: TranslateService,
        private _navigationService: NavigationService,
        private _swalService: SwalAlertService,
        private _localStorageService: LocalStorageService,
        private _logActividadesService: PtllogActividadesService,
        private _aplicacionesService: PtlAplicacionesService,
        private _suitesService: PtlSuitesAPService,
        private _modulosService: PtlmodulosApService,
        private _registrosService: PTLModulosPaqueteService,
        private _permisosService: PtlPermisosService
    ) {
        this.suscriptor = this._localStorageService.getSuscriptorPlataformaLocalStorage();
        this.registroId = this._localStorageService.getObject<string>('regId') || '';
    }

    ngOnInit(): void {
        this._navigationService.getNavigationItems();
        this.menuItems$ = this._navigationService.menuItems$;
        this.hasFiltersSlot = true;
        this.moduloTituloExcel = this.lang == 'es' ? 'Listado de Módulos' : 'List of Modules';

        this.consultarAplicaciones();
        this.consultarSuites();
        this.consultarModulos();

        // Damos un pequeño timeout para asegurar que las dependencias estén listas
        setTimeout(() => {
            this.setupModulosPaquetesStream();
        }, 100);

        this.subscriptions.add(
            this._registrosService.cargarRegistros().subscribe({
                next: () => console.log('✅ Módulos cargados en el servicio'),
                error: err => console.error('Error al cargar módulos:', err)
            })
        );
    }

    ngOnDestroy(): void {
        this.subscriptions.unsubscribe();
    }

    consultarAplicaciones() {
        this.subscriptions.add(
            this._aplicacionesService.getAplicaciones().subscribe((resp: any) => {
                if (resp.ok) this.aplicaciones = resp.aplicaciones;
            })
        );
    }

    consultarSuites() {
        this.subscriptions.add(
            this._suitesService.geSuitesAP().subscribe((resp: any) => {
                if (resp.ok) this.suites = resp.suites;
            })
        );
    }

    consultarModulos() {
        this.subscriptions.add(
            this._modulosService.getRegistros().subscribe((resp: any) => {
                if (resp.ok) {
                    this.modulosPadre = resp.modulos.filter((x: any) => x.hijos == true && x.estadoModulo == true);
                }
            })
        );
    }

    setupModulosPaquetesStream(): void {
        this.modulosPaqueteTransformados$ = combineLatest([
            this._registrosService.modulosPQ$,
            this._permisosService.actividadesAutorizadas$
        ]).pipe(
            map(([paqs, permisos]: [PTLModuloPQModel[], string[]]) => {
                if (!paqs || paqs.length === 0) return [];

                return paqs.map((paq: any) => {
                    const newPaq = { ...paq };
                    newPaq.nomEstado = newPaq.estadoModuloPQ ? 'Activo' : 'Inactivo';

                    const app = this.aplicaciones.find(x => x.codigoAplicacion == paq.codigoAplicacion);
                    const sui = this.suites.find(x => x.codigoSuite == paq.codigoSuite);
                    const mod = this.modulosPadre.find(x => x.codigoModulo == paq.codigoModulo);

                    newPaq.nomAplicacion = app?.nombreAplicacion || '';
                    newPaq.nomSuite = sui?.nombreSuite || '';
                    newPaq.nomModulo = mod?.nombreModulo || '';

                    // 🟢 Construcción Dinámica de Botones
                    const accionesPermitidas: any[] = [];
                    if (permisos.includes('ACT_MODPQ_ELIMINAR')) {
                        accionesPermitidas.push({
                            accion: 'ELIMINAR', letra: 'E', color: '#dd1717',
                            tooltip: this.translate.instant('PLATAFORMA.DELETE')
                        });
                    }

                    newPaq._acciones = accionesPermitidas;
                    return newPaq as PTLModuloPQModel;
                });
            }),
            tap((regs) => {
                this.registros = regs;
                this.cdr.detectChanges();
            }),
            catchError(err => {
                console.error('Error en stream de módulos:', err);
                return of([]);
            })
        );

        this.modulosPaqueteFiltrados$ = combineLatest([
            this.modulosPaqueteTransformados$.pipe(startWith([])),
            this.filtroCodigoSubject,
            this.filtroEstadoSubject
        ]).pipe(
            map(([paqs, codigo, estado]) => {
                let filteredItems = paqs;
                if (codigo !== 'todos') filteredItems = filteredItems.filter(app => app.codigoModuloPQ === codigo);
                if (estado !== 'todos') filteredItems = filteredItems.filter((mod: any) => mod.estadoModuloPQ === (estado === 'true'));
                return filteredItems;
            })
        );
    }

    // ==========================================
    // 🟢 ENRUTADOR CENTRAL DE ACCIONES
    // ==========================================
    onAccionPrincipal(evento: { accion: string, row: any }) {
        const { accion, row } = evento;
        if (accion === 'ELIMINAR') this.eliminarModulo(row);
    }

    eliminarModulo(row: any): void {
        this._swalService.getAlertQuestionRequest(
            this.translate.instant('APLICACIONES.ELIMINARTEXTO'),
            this.translate.instant('APLICACIONES.ELIMINARTITULO')
        ).subscribe(result => {
            if (result) {
                this._registrosService.deleteEliminarRegistro(row.codigoModuloPQ).subscribe({
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
        this._localStorageService.setObject('regPQ', this.registroId);
        this.router.navigate(['aplicaciones/gestion-modulopq']);
    }

    OnRegresarClick() {
        this.router.navigate(['aplicaciones/paquetes']);
    }

    onFiltroCodigoChangeClick(evento: any) { this.filtroCodigoSubject.next(evento.target.value); }
    onFiltroEstadoChangeClick(evento: any) { this.filtroEstadoSubject.next(evento.target.value); }
    toggleNav(): void { this.toggleSidebar.emit(); }

    columnasPaquetes: ColumnMetadata[] = [
        { name: 'nomModulo', header: 'MODULOSPQ.MODULO', type: 'text' },
        { name: 'nomSuite', header: 'MODULOSPQ.SUITE', type: 'text' },
        { name: 'nomAplicacion', header: 'MODULOSPQ.APLICACION', type: 'text' },
        { name: 'nomEstado', header: 'MODULOSPQ.STATUS', type: 'estado' }
    ];

    columnasDetailRegistros: ColumnMetadata[] = [];
}
