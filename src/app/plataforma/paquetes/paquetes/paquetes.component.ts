/* eslint-disable @typescript-eslint/no-explicit-any */
import { Component, EventEmitter, OnDestroy, OnInit, Output, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataTablesModule } from 'angular-datatables';
import { Router } from '@angular/router';
import { SharedModule } from 'src/app/theme/shared/shared.module';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { BehaviorSubject, Observable, Subscription, combineLatest, of } from 'rxjs';
import { catchError, map, startWith, switchMap, tap } from 'rxjs/operators';
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
import { PTLPaquetesService } from 'src/app/theme/shared/service/ptlpaquetes.service';
import { ColumnMetadata } from 'src/app/theme/shared/_helpers/models/ColumnMetadata.model';
import { PTLPaqueteModel } from 'src/app/theme/shared/_helpers/models/PTLPaquete.model';
import { NavigationItem } from 'src/app/theme/shared/_helpers/models/Navigation.model';
import Swal from 'sweetalert2';

@Component({
    selector: 'app-paquetes',
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
    templateUrl: './paquetes.component.html',
    styleUrl: './paquetes.component.scss'
})
export class PaquetesComponent implements OnInit, OnDestroy {
    @Output() toggleSidebar = new EventEmitter<void>();

    moduloTituloExcel: string = '';
    hasFiltersSlot: boolean = false;
    gradientConfig;
    lang = localStorage.getItem('lang');
    menuItems$!: Observable<NavigationItem[]>;
    activeTab: 'menu' | 'filters' | 'main' = 'menu';
    suscriptor: string = '';

    subscriptions = new Subscription();
    filtroNombreSubject = new BehaviorSubject<string>('');
    filtroDescripcionSubject = new BehaviorSubject<string>('');
    filtroEstadoSubject = new BehaviorSubject<string>('todos');

    paquetesTransformados$: Observable<PTLPaqueteModel[]> = of([]);
    paquetesFiltrados$: Observable<PTLPaqueteModel[]> = of([]);
    paquetes: PTLPaqueteModel[] = [];

    constructor(
        private router: Router,
        private cdr: ChangeDetectorRef,
        private translate: TranslateService,
        private _navigationService: NavigationService,
        private _localStorageService: LocalStorageService,
        private _logActividadesService: PtllogActividadesService,
        private _registrosService: PTLPaquetesService,
        private _permisosService: PtlPermisosService,
        private _swalService: SwalAlertService
    ) {
        this.gradientConfig = GradientConfig;
        this.suscriptor = this._localStorageService.getSuscriptorPlataformaLocalStorage();
    }

    ngOnInit(): void {
        this._navigationService.getNavigationItems();
        this.menuItems$ = this._navigationService.menuItems$;
        this.hasFiltersSlot = true;
        this.moduloTituloExcel = this.lang == 'es' ? 'Listado de Paquetes' : 'List of Packages';

        this.setupPaquetesStream();

        this.subscriptions.add(
            this._registrosService.cargarRegistros().subscribe({
                next: () => console.log('✅ Paquetes cargados en el servicio'),
                error: (err) => console.error('❌ Error al cargar paquetes:', err)
            })
        );
    }

    ngOnDestroy(): void {
        this.subscriptions.unsubscribe();
    }

    setupPaquetesStream(): void {
        this.paquetesTransformados$ = combineLatest([
            this._registrosService.paquetes$,
            this._permisosService.actividadesAutorizadas$
        ]).pipe(
            map(([paqs, permisos]: [PTLPaqueteModel[], string[]]) => {
                if (!paqs || paqs.length === 0) return [];

                return paqs.map((paq: any) => {
                    const newPaq: any = { ...paq };
                    newPaq.nomEstado = newPaq.estadoPaquete ? 'Activo' : 'Inactivo';
                    newPaq.nomPromocion = newPaq.promocion ? 'Si' : 'No';

                    const accionesPermitidas: any[] = [];

                    if (permisos.includes('ACT_PAQS_MODIFICAR')) {
                        accionesPermitidas.push({
                            accion: 'MODIFICAR', letra: 'M', color: '#2a5dbd',
                            tooltip: this.translate.instant('PLATAFORMA.EDITAR')
                        });
                    }

                    if (permisos.includes('ACT_PAQS_ELIMINAR')) {
                        accionesPermitidas.push({
                            accion: 'ELIMINAR', letra: 'E', color: '#dd1717',
                            tooltip: this.translate.instant('PLATAFORMA.DELETE')
                        });
                    }

                    if (permisos.includes('ACT_PAQS_MODULOS')) {
                        accionesPermitidas.push({
                            accion: 'MODULOS', letra: 'M', color: '#6f42c1',
                            tooltip: this.translate.instant('PAQUETES.MODULOS')
                        });
                    }

                    if (permisos.includes('ACT_PAQS_ITEMS')) {
                        accionesPermitidas.push({
                            accion: 'ITEMS', letra: 'I', color: '#4279c1',
                            tooltip: this.translate.instant('PAQUETES.ITEMS')
                        });
                    }

                    if (permisos.includes('ACT_PAQS_PRECIOS')) {
                        accionesPermitidas.push({
                            accion: 'PRECIOS', letra: 'P', color: '#28a745',
                            tooltip: this.translate.instant('PAQUETES.PRECIOS')
                        });
                    }

                    newPaq._acciones = accionesPermitidas;
                    return newPaq as PTLPaqueteModel;
                });
            }),
            tap((regs) => {
                this.paquetes = regs;
                this.cdr.detectChanges();
            }),
            catchError(err => {
                console.error('Error en el stream de paquetes:', err);
                return of([]);
            })
        );

        this.paquetesFiltrados$ = combineLatest([
            this.paquetesTransformados$.pipe(startWith([])),
            this.filtroNombreSubject,
            this.filtroDescripcionSubject,
            this.filtroEstadoSubject
        ]).pipe(
            map(([paqs, nombre, descripcion, estado]) => {
                let filteredPaquetes = paqs;

                if (nombre) {
                    const textoFiltro = nombre.toLowerCase();
                    filteredPaquetes = filteredPaquetes.filter(p => (p.nombrePaquete || '').toLowerCase().includes(textoFiltro));
                }

                if (descripcion) {
                    const textoFiltro = descripcion.toLowerCase();
                    filteredPaquetes = filteredPaquetes.filter(p => (p.descripcionPaquete || '').toLowerCase().includes(textoFiltro));
                }

                if (estado !== 'todos') {
                    const estadoBoolean = estado === 'true';
                    filteredPaquetes = filteredPaquetes.filter(p => p.estadoPaquete === estadoBoolean);
                }

                return filteredPaquetes;
            })
        );
    }

    onAccionPrincipal(evento: { accion: string, row: any }) {
        const { accion, row } = evento;
        const id = row.codigoPaquete;

        switch (accion) {
            case 'MODIFICAR':
                this._localStorageService.setObject('regId', id);
                this.router.navigate(['aplicaciones/gestion-paquete']);
                break;

            case 'MODULOS':
                this._localStorageService.setObject('regId', id);
                this.router.navigate(['aplicaciones/modulos-paquete']);
                break;

            case 'ITEMS':
                this._localStorageService.setObject('regId', id);
                this.router.navigate(['aplicaciones/items-paquete']);
                break;

            case 'PRECIOS':
                // 🟢 Aquí navegaremos al nuevo componente de Listas de Precios
                this._localStorageService.setObject('regId', id);
                this.router.navigate(['aplicaciones/precios-paquete']);
                break;

            case 'ELIMINAR':
                this.eliminarPaquete(row);
                break;

            default:
                console.warn(`Acción no reconocida: ${accion}`);
                break;
        }
    }

    eliminarPaquete(row: any): void {
        this._swalService.getAlertQuestionRequest(
            this.translate.instant('APLICACIONES.ELIMINARTEXTO') + ` "${row.nombrePaquete}".`,
            this.translate.instant('APLICACIONES.ELIMINARTITULO')
        ).subscribe(result => {
            if (result) {
                this._registrosService.deleteEliminarRegistro(row.codigoPaquete).subscribe({
                    next: (resp: any) => {
                        const logData = { codigoTipoLog: '', codigoRespuesta: '201', descripcionLog: this.translate.instant('APLICACIONES.ELIMINAREXITOSA') + ' ' + resp.mensaje };
                        this._logActividadesService.postCrearRegistro(logData).subscribe();
                        this._swalService.getAlertSuccess(resp.mensaje);
                        // El stream se actualiza solo si el backend responde por sockets, sino recargamos
                    },
                    error: (err: any) => {
                        const logData = { codigoTipoLog: '', codigoRespuesta: '501', descripcionLog: this.translate.instant('APLICACIONES.ELIMINARERROR') + ' ' + err.mensaje };
                        this._logActividadesService.postCrearRegistro(logData).subscribe();
                        this._swalService.getAlertError(err.mensaje);
                    }
                });
            }
        });
    }

    OnNuevoRegistroClick(): void {
        this._localStorageService.setObject('regId', 'nuevo');
        this.router.navigate(['aplicaciones/gestion-paquete']);
    }

    onFiltroNombreChangeClick(evento: any) { this.filtroNombreSubject.next(evento.target.value); }
    onFiltroDescripcionChangeClick(evento: any) { this.filtroDescripcionSubject.next(evento.target.value); }
    onFiltroEstadoChangeClick(evento: any) { this.filtroEstadoSubject.next(evento.target.value); }
    toggleNav(): void { this.toggleSidebar.emit(); }

    columnasPaquetes: ColumnMetadata[] = [
        { name: 'nombrePaquete', header: 'PAQUETES.NAME', type: 'text' },
        { name: 'costoPaquete', header: 'PAQUETES.COSTE', type: 'price' },
        { name: 'precioPaquete', header: 'PAQUETES.PRECIO', type: 'price' },
        { name: 'nomPromocion', header: 'PAQUETES.PROMOCION', type: 'estado' },
        { name: 'nomEstado', header: 'PAQUETES.STATUS', type: 'estado' }
    ];

    columnasDetailRegistros: ColumnMetadata[] = [
        { name: 'codigoPaquete', header: 'PAQUETES.CODE', type: 'text' },
        { name: 'precioPromocion', header: 'PAQUETES.PRECIOPROMOCION', type: 'price' },
        { name: 'descripcionPaquete', header: 'PAQUETES.DESCRIPTION', type: 'text' },
        { name: 'acuerdoLicencia', header: 'PAQUETES.ACUERDOLICENCIA', type: 'text' },
        { name: 'iconoPaquete', header: 'PAQUETES.ICONO', type: 'avatar' },
        { name: 'imagenPaquete', header: 'PAQUETES.IMAGEN', type: 'image' }
    ];
}
