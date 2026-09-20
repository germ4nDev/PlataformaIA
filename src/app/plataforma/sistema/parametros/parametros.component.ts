/* eslint-disable @typescript-eslint/no-explicit-any */
import { Component, EventEmitter, OnDestroy, OnInit, Output, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataTablesModule } from 'angular-datatables';
import { Router } from '@angular/router';
import { SharedModule } from 'src/app/theme/shared/shared.module';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { BehaviorSubject, Observable, Subscription, combineLatest, of } from 'rxjs';
import { catchError, map, startWith, tap } from 'rxjs/operators';
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
import { PTLParametrosSistemaService } from 'src/app/theme/shared/service/ptlparametros-sistema.service'; // 🟢 Servicio de Parámetros
import { ColumnMetadata } from 'src/app/theme/shared/_helpers/models/ColumnMetadata.model';
import { PTLParametroSistemaModel } from 'src/app/theme/shared/_helpers/models/PTLParametroSistema.model'; // 🟢 Modelo de Parámetros
import { NavigationItem } from 'src/app/theme/shared/_helpers/models/Navigation.model';

@Component({
    selector: 'app-parametros',
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
    templateUrl: './parametros.component.html',
    styleUrl: './parametros.component.scss'
})
export class ParametrosComponent implements OnInit, OnDestroy {
    @Output() toggleSidebar = new EventEmitter<void>();

    moduloTituloExcel: string = '';
    hasFiltersSlot: boolean = false;
    gradientConfig: any;
    lang = localStorage.getItem('lang');
    menuItems$!: Observable<NavigationItem[]>;
    activeTab: 'menu' | 'filters' | 'main' = 'menu';
    suscriptor: string = '';

    subscriptions = new Subscription();

    // 🟢 Filtros específicos de Parámetros
    filtroLlaveSubject = new BehaviorSubject<string>('');
    filtroNombreSubject = new BehaviorSubject<string>('');
    filtroTipoSubject = new BehaviorSubject<string>('todos');

    parametrosTransformados$: Observable<PTLParametroSistemaModel[]> = of([]);
    parametrosFiltrados$: Observable<PTLParametroSistemaModel[]> = of([]);
    parametros: PTLParametroSistemaModel[] = [];

    constructor(
        private router: Router,
        private cdr: ChangeDetectorRef,
        private translate: TranslateService,
        private _navigationService: NavigationService,
        private _localStorageService: LocalStorageService,
        private _logActividadesService: PtllogActividadesService,
        private _registrosService: PTLParametrosSistemaService, // 🟢 Inyección del servicio
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
        this.moduloTituloExcel = this.lang == 'es' ? 'Listado de Parámetros' : 'List of Parameters';

        this.setupParametrosStream();

        // 🟢 Carga inicial de datos usando el nuevo patrón
        this.subscriptions.add(
            this._registrosService.cargarRegistros().subscribe({
                next: () => console.log('✅ Parámetros cargados en el servicio'),
                error: (err) => console.error('❌ Error al cargar parámetros:', err)
            })
        );
    }

    ngOnDestroy(): void {
        this.subscriptions.unsubscribe();
    }

    setupParametrosStream(): void {
        // 🟢 Stream 1: Transformación e Inyección de Permisos
        this.parametrosTransformados$ = combineLatest([
            this._registrosService.parametros$, // Observable expuesto en PTLParametrosSistemaService
            this._permisosService.actividadesAutorizadas$
        ]).pipe(
            map(([params, permisos]: [PTLParametroSistemaModel[], string[]]) => {
                if (!params || params.length === 0) return [];

                return params.map((param: any) => {
                    const newParam: any = { ...param };
                    newParam.nomEstado = newParam.estadoParametro ? 'Activo' : 'Inactivo';

                    const accionesPermitidas: any[] = [];

                    // 🟢 Validación de Permisos (Ajustados a Parámetros)
                    if (permisos.includes('ACT_SYST_ACTUALIZAR')) {
                        accionesPermitidas.push({
                            accion: 'MODIFICAR', letra: 'M', color: '#2a5dbd',
                            tooltip: this.translate.instant('PLATAFORMA.EDITAR')
                        });
                    }

                    if (permisos.includes('ACT_SYST_ELIMINAR')) {
                        accionesPermitidas.push({
                            accion: 'ELIMINAR', letra: 'E', color: '#dd1717',
                            tooltip: this.translate.instant('PLATAFORMA.DELETE')
                        });
                    }

                    newParam._acciones = accionesPermitidas;
                    return newParam as PTLParametroSistemaModel;
                });
            }),
            tap((regs) => {
                this.parametros = regs;
                this.cdr.detectChanges(); // Forzamos el renderizado para evitar errores de ciclo de vida
            }),
            catchError(err => {
                console.error('Error en el stream de parámetros:', err);
                return of([]);
            })
        );

        // 🟢 Stream 2: Aplicación de Filtros Reactivos en Caliente
        this.parametrosFiltrados$ = combineLatest([
            this.parametrosTransformados$.pipe(startWith([])),
            this.filtroLlaveSubject,
            this.filtroNombreSubject,
            this.filtroTipoSubject
        ]).pipe(
            map(([params, llave, nombre, tipo]) => {
                let filteredParams = params;

                if (llave) {
                    const textoFiltro = llave.toLowerCase();
                    filteredParams = filteredParams.filter(p => (p.llaveParametro || '').toLowerCase().includes(textoFiltro));
                }

                if (nombre) {
                    const textoFiltro = nombre.toLowerCase();
                    filteredParams = filteredParams.filter(p => (p.nombreParametro || '').toLowerCase().includes(textoFiltro));
                }

                if (tipo !== 'todos') {
                    filteredParams = filteredParams.filter(p => p.tipoDato === tipo);
                }

                return filteredParams;
            })
        );
    }

    onAccionPrincipal(evento: { accion: string, row: any }) {
        const { accion, row } = evento;
        const id = row.codigoParametro;

        switch (accion) {
            case 'MODIFICAR':
                this._localStorageService.setObject('regId', id);
                this.router.navigate(['sistema/gestion-parametro']);
                break;

            case 'ELIMINAR':
                this.eliminarParametro(row);
                break;

            default:
                console.warn(`Acción no reconocida: ${accion}`);
                break;
        }
    }

    eliminarParametro(row: any): void {
        this._swalService.getAlertQuestionRequest(
            this.translate.instant('APLICACIONES.ELIMINARTEXTO') + ` "${row.nombreParametro}".`,
            this.translate.instant('APLICACIONES.ELIMINARTITULO')
        ).subscribe(result => {
            if (result) {
                this._registrosService.eliminarParametro(row.codigoParametro).subscribe({
                    next: (resp: any) => {
                        const logData = {
                            codigoTipoLog: '',
                            codigoRespuesta: '201',
                            descripcionLog: this.translate.instant('APLICACIONES.ELIMINAREXITOSA') + ' ' + resp.msg
                        };
                        this._logActividadesService.postCrearRegistro(logData).subscribe();
                        this._swalService.getAlertSuccess(resp.msg);
                        // Refrescamos llamando al servicio si no está conectado vía sockets automáticos
                        this._registrosService.cargarRegistros().subscribe();
                    },
                    error: (err: any) => {
                        const logData = {
                            codigoTipoLog: '',
                            codigoRespuesta: '501',
                            descripcionLog: this.translate.instant('APLICACIONES.ELIMINARERROR') + ' ' + (err.error?.msg || err.message)
                        };
                        this._logActividadesService.postCrearRegistro(logData).subscribe();
                        this._swalService.getAlertError(err.error?.msg || err.message);
                    }
                });
            }
        });
    }

    OnNuevoRegistroClick(): void {
        this._localStorageService.setObject('regId', 'nuevo');
        this.router.navigate(['sistema/gestion-parametro']);
    }

    // 🟢 Eventos del Sidebar
    onFiltroLlaveChangeClick(evento: any) { this.filtroLlaveSubject.next(evento.target.value); }
    onFiltroNombreChangeClick(evento: any) { this.filtroNombreSubject.next(evento.target.value); }
    onFiltroTipoChangeClick(evento: any) { this.filtroTipoSubject.next(evento.target.value); }
    toggleNav(): void { this.toggleSidebar.emit(); }

    // 🟢 Columnas de la Tabla Principal
    columnasRegistros: ColumnMetadata[] = [
        { name: 'llaveParametro', header: 'Llave Lógica (ID)', type: 'text' },
        { name: 'nombreParametro', header: 'Nombre Visible', type: 'text' },
        { name: 'valorParametro', header: 'Valor Asignado', type: 'text' },
        { name: 'tipoDato', header: 'Tipo de Dato', type: 'text' },
        { name: 'nomEstado', header: 'Estado', type: 'estado' }
    ];

    // 🟢 Columnas del Detalle (Opcional si enciendes el showDetail="true" en el HTML)
    columnasDetailRegistros: ColumnMetadata[] = [
        { name: 'descripcionParametro', header: 'Descripción Detallada', type: 'text' }
    ];
}
