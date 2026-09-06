/* eslint-disable @typescript-eslint/no-explicit-any */
import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, EventEmitter, OnInit, Output } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { DataTablesModule } from 'angular-datatables';
import { Subscription, tap, catchError, of, Observable, BehaviorSubject, startWith, combineLatest, switchMap, map } from 'rxjs';
import { SharedModule } from 'src/app/theme/shared/shared.module';
import { DatatableComponent } from 'src/app/theme/shared/components/data-table/data-table.component';
import { NavContentComponent } from 'src/app/theme/layout/admin/navigation/nav-content/nav-content.component';
import { NavBarComponent } from 'src/app/theme/layout/admin/nav-bar/nav-bar.component';
import { GradientConfig } from 'src/app/app-config';
import { ColumnMetadata } from 'src/app/theme/shared/_helpers/models/ColumnMetadata.model';
import { PTLUsuarioModel } from 'src/app/theme/shared/_helpers/models/PTLUsuario.model';
import {
    NavigationService,
    PtllogActividadesService,
    SwalAlertService,
    LocalStorageService,
    PTLSuscriptoresService,
    PtlEmpresasScService
} from 'src/app/theme/shared/service';
import { environment } from 'src/environments/environment';

const base_url = environment.apiUrl;
import Swal from 'sweetalert2';
import { NavigationItem } from 'src/app/theme/shared/_helpers/models/Navigation.model';
import { PTLEmpresaSCModel } from 'src/app/theme/shared/_helpers/models/PTLEmpresaSC.model';
import { PTLSuscriptorModel } from '../../../theme/shared/_helpers/models/PTLSuscriptor.model';
import { TableDataComponent } from "src/app/theme/shared/components/table-data/table-data.component";
import { PtlPermisosService } from 'src/app/theme/shared/service/ptlpermisos.service';
import { DataLoaderComponent } from "src/app/theme/shared/components/data-loader/data-loader.component";

@Component({
    selector: 'app-empresas',
    standalone: true,
    imports: [CommonModule, DataTablesModule, SharedModule, TranslateModule, DatatableComponent, NavContentComponent, NavBarComponent, TableDataComponent, DataLoaderComponent],
    templateUrl: './empresas.component.html',
    styleUrl: './empresas.component.scss'
})
export class EmpresasComponent implements OnInit {
    @Output() toggleSidebar = new EventEmitter<void>();

    subscriptions = new Subscription();
    // Subjects para filtros
    filtroSuscriptorSubject = new BehaviorSubject<string>('todos');
    filtroNombreSubject = new BehaviorSubject<string>('');
    filtroDescripcionSubject = new BehaviorSubject<string>('');
    filtroEstadoSubject = new BehaviorSubject<string>('todos');

    //#region VARIABLES
    registrosTransformados$: Observable<PTLEmpresaSCModel[]> = of([]);
    registrosFiltrado$: Observable<PTLEmpresaSCModel[]> = of([]);
    empresaSC: PTLEmpresaSCModel[] = [];
    registros: PTLEmpresaSCModel[] = [];
    lang: string = localStorage.getItem('lang') || '';
    registrosSub?: Subscription;
    usuariosSub?: Subscription;
    suscriptoresSub?: Subscription;
    suscriptores: PTLSuscriptorModel[] = [];
    usuarios: PTLUsuarioModel[] = [];
    tituloPagina: string = '';
    stId: string = '';
    //#endregion VARIABLES
    gradientConfig;
    hasFiltersSlot: boolean = false;
    menuItems!: Observable<NavigationItem[]>;
    activeTab: 'menu' | 'filters' | 'main' = 'menu';
    suscPlataforma: string = '';
    codigoRegistro: string = '';

    constructor(
        private router: Router,
        private route: ActivatedRoute,
        private cdr: ChangeDetectorRef,
        private translate: TranslateService,
        private _navigationService: NavigationService,
        private _swalService: SwalAlertService,
        private _logActividadesService: PtllogActividadesService,
        private _empresasScService: PtlEmpresasScService,
        private _suscriptoresService: PTLSuscriptoresService,
        private _localStorageService: LocalStorageService,
        private _permisosService: PtlPermisosService
    ) {
        this.gradientConfig = GradientConfig;
        this.stId = this._localStorageService.getObject<string>('regId') || ''
        if (this.stId) {
            this.filtroSuscriptorSubject.next(this.stId);
        }
        this.suscPlataforma = this._localStorageService.getSuscriptorPlataformaLocalStorage();
    }

    ngOnInit() {
        this._navigationService.getNavigationItems();
        this.menuItems = this._navigationService.menuItems$;
        this.hasFiltersSlot = true;
        this.registros = this._empresasScService.getEmpresasSCActuales()
        this.suscriptores = this._suscriptoresService.getSuscriptoresActuales();

        setTimeout(() => {
            this.setupRegistrosStream();
        }, 100);
        this.subscriptions.add(
            this._empresasScService.cargarRegistros().subscribe(
                () => console.log('Empresas cargadas y guardadas en el servicio'),
                (err) => console.error('Error al cargar la Empresa:', err)
            )
        );
    }

    columnasRegistros: ColumnMetadata[] = [
        {
            name: 'nombreEmpresa',
            header: 'SUSCRIPTOR.EMPRESAS.NOMBREEMPRESA',
            type: 'text'
        },
        {
            name: 'nomEstado',
            header: 'SUSCRIPTOR.EMPRESAS.ESTADOEMPRESA',
            type: 'estado'
        }
    ];

    columnasDetailRegistros: ColumnMetadata[] = [
        {
            name: 'codigoEmpresaSC',
            header: 'SUSCRIPTOR.EMPRESAS.CODIGOEMPRESA',
            type: 'text'
        },
        {
            name: 'nomSuscriptor',
            header: 'SUSCRIPTOR.EMPRESAS.CODIGOSUSCRIPTOR',
            type: 'text'
        },
        {
            name: 'descripcionEmpresa',
            header: 'SUSCRIPTOR.EMPRESAS.DESCRIPCION',
            type: 'text'
        },
    ];

    setupRegistrosStream(): void {
        this.suscPlataforma = this._localStorageService.getSuscriptorPlataformaLocalStorage();

        this.registrosTransformados$ = combineLatest([
            this._empresasScService.empresasSC$,
            this._permisosService.actividadesAutorizadas$
        ]).pipe(
            map(([empresas, permisos]: [PTLEmpresaSCModel[], string[]]) => {
                if (!empresas) return [];

                this.empresaSC = empresas.filter(x => x.codigoSuscriptor == this.stId);

                return this.empresaSC.map((empresa: any) => {
                    // Clonamos el objeto para no mutar el original
                    const newEmpresa = { ...empresa };

                    newEmpresa.nomEstado = newEmpresa.estadoEmpresa === true ? 'Activo' : 'Inactivo';

                    // Mejoramos la búsqueda del suscriptor para evitar errores si no existe
                    const suscriptorEncontrado = this.suscriptores.find((x) => x.codigoSuscriptor == newEmpresa.codigoSuscriptor);
                    newEmpresa.nomSuscriptor = suscriptorEncontrado ? suscriptorEncontrado.nombreSuscriptor : '';

                    const accionesPermitidas: any[] = [];

                    const puedeModificar = permisos.includes('ACT_SUSCPAQ_MODIFICAR');
                    if (puedeModificar) {
                        accionesPermitidas.push({
                            accion: 'MODIFICAR',
                            letra: 'M',
                            color: '#007bff',
                            tooltip: (this.translate.instant('SUSCRIPTOR.EMPRESAS.MODIFICAR'))
                        });
                    }

                    const estadoEmpresa = newEmpresa.estadoEmpresa ? 'I' : 'A';
                    const colorEmpresa = newEmpresa.estadoEmpresa ? '#dc3545' : '#13af2d';
                    const tooltipEmpresa = newEmpresa.estadoEmpresa ? this.translate.instant('SUSCRIPTOR.EMPRESAS.INACTIVAR') : this.translate.instant('SUSCRIPTOR.EMPRESAS.ACTIVAR');

                    const puedeEliminar = permisos.includes('ACT_SUSCPAQ_ELIMINAR');
                    if (puedeEliminar) {
                        accionesPermitidas.push({
                            accion: 'ELIMINAR',
                            letra: estadoEmpresa,
                            color: colorEmpresa,
                            tooltip: tooltipEmpresa
                        });
                    }

                    return {
                        ...newEmpresa,
                        '_acciones': accionesPermitidas
                    } as PTLEmpresaSCModel;
                });
            }),
            tap((regs) => {
                this.registros = regs;
                this.cdr.detectChanges();
            }),
            catchError((err) => {
                console.error('Error en el stream de empresas:', err);
                return of([]);
            })
        );

        this.registrosFiltrado$ = combineLatest([
            this.registrosTransformados$.pipe(startWith([])),
            this.filtroSuscriptorSubject,
            this.filtroNombreSubject,
            this.filtroDescripcionSubject,
            this.filtroEstadoSubject
        ]).pipe(
            map(([empresas, suscriptor, nombre, descripcion, estado]) => {
                let filteredRegistros = empresas;

                if (suscriptor !== 'todos') {
                    filteredRegistros = filteredRegistros.filter((reg: any) => reg.codigoSuscriptor === suscriptor);
                }
                if (nombre) {
                    filteredRegistros = filteredRegistros.filter((reg: any) => (reg.nombreEmpresa?.toString() || '').toLowerCase().includes(nombre.toLowerCase()));
                }
                if (descripcion) {
                    const textoFiltro = descripcion.toLowerCase();
                    filteredRegistros = filteredRegistros.filter((reg: any) => (reg.descripcionEmpresa || '').toLowerCase().includes(textoFiltro));
                }
                if (estado !== 'todos') {
                    const estadoBoolean = estado === 'true';
                    filteredRegistros = filteredRegistros.filter((reg: any) => reg.estadoEmpresa === estadoBoolean);
                }

                return filteredRegistros;
            })
        );
    }

    onFiltroSuscriptorChangeClick(evento: any) {
        const value = evento.target.value;
        this.filtroSuscriptorSubject.next(value);
    }

    onFiltroNombreChangeClick(evento: any) {
        const value = evento.target.value;
        this.filtroNombreSubject.next(value);
    }
    onFiltroDescripcionChangeClick(evento: any) {
        const value = evento.target.value;
        this.filtroDescripcionSubject.next(value);
    }

    onFiltroEstadoChangeClick(evento: any) {
        const value = evento.target.value;
        this.filtroEstadoSubject.next(value);
    }

    OnNuevoRegistroClick() {
        this.router.navigate(['suscriptor/gestion-empresa'], { queryParams: { regId: 'nuevo', stId: this.stId } });
        // console.log('+++++ME MANDA EL ID en NUEVO', { queryParams: { regId: 'nuevo', stId: this.stId }});
    }

    onAccionPrincipal(evento: { accion: string, row: any }) {
        const { accion, row } = evento;
        const id = row.codigoEmpresaSC || row.id;

        console.log(`Acción ejecutada: [${accion}] sobre el registro ID:`, id);

        switch (accion) {
            case 'MODIFICAR':
                console.log('inactivar usuario codigo', id);
                console.log('ejecutando opcion 1 empresas Suscriptor', this.stId);
                this._localStorageService.setObject('regId', id);
                this._localStorageService.setObject('stId', this.stId);
                this.router.navigate(['suscriptor/gestion-empresa']);
                break;
            case 'ELIMINAR':
                const value = id;
                console.log('opcion 1 click', value);
                console.log('ejecutando opcion 2 UsuariosSuscriptor', id);
                console.log('cancelar el empresaSC', value);

                const empresaSCToCancel = this.empresaSC.find(x => x.codigoEmpresaSC == value);

                if (!empresaSCToCancel) {
                    console.error('No se encontró el empresaSC a cancelar');
                    return;
                }

                const empresaSCInfo = this.empresaSC.find(x => x.codigoEmpresaSC == empresaSCToCancel.codigoEmpresaSC);

                const titulo = this.translate.instant('SUSCRIPTOR.EMPRESAS.ELIMINARTITULO');
                const confirmText = this.translate.instant('SUSCRIPTOR.EMPRESAS.ACCEPTTEXT');
                const cancelText = this.translate.instant('SUSCRIPTOR.EMPRESAS.CANCEL');
                const placeholder = this.translate.instant('SUSCRIPTOR.EMPRESAS.PLACEHOLDERCANCEL');
                const errorobs = this.translate.instant('SUSCRIPTOR.EMPRESAS.ERROROBSERVACION');

                const htmlBody = `
                        <div style="margin-bottom: 10px;">
                            ${this.translate.instant('SUSCRIPTOR.EMPRESAS.CONFIRMTEXT')}
                        </div>
                        <small><b>"${empresaSCInfo?.nombreEmpresa || empresaSCToCancel.codigoEmpresaSC}"</b></small>
                        `;

                this._swalService.getAlertConfirmWithTextarea(titulo, htmlBody, placeholder, confirmText, cancelText, errorobs)
                    .then((resultado) => {

                        if (resultado.isConfirmed) {

                            const empresaSCActualizado: PTLEmpresaSCModel = {
                                ...empresaSCToCancel,
                                estadoEmpresa: empresaSCInfo?.estadoEmpresa ? false : true,
                                observaciones: resultado.value,
                                codigoUsuarioModificacion: this._localStorageService.getUsuarioLocalStorage().codigoUsuario || '',
                                fechaModificacion: new Date().toISOString()
                            };

                            this.subscriptions.add(
                                this._empresasScService.actualizarEmpresa(empresaSCActualizado).subscribe({
                                    next: (resp: any) => {
                                        this._swalService.getAlertConfirmSuccess(this.translate.instant('SUSCRIPTOR.EMPRESAS.SUCCESSTEXT'));
                                    },
                                    error: (err: any) => {
                                        this._swalService.getAlertConfirmError(this.translate.instant('SUSCRIPTOR.EMPRESAS.ERRORTEXT'));
                                        console.error('Error cancelando empresaSC', err);
                                    }
                                })
                            );
                        }
                    });

                break;
            default:
                console.warn(`Acción no reconocida: ${accion}`);
                break;
        }
    }

    OnEditarRegistroClick(id: number) {
        this.router.navigate(['suscriptor/gestion-empresa'], { queryParams: { regId: id } });
        // console.log('+++++ME MANDA EL ID', id);
    }

    OnEliminarRegistroClick(id: any) {
        const empresa = this.empresaSC.filter((x) => x.codigoEmpresaSC == id.id)[0];
        console.log('empresa', empresa);
        const titulo = this.translate.instant('SUSCRIPTOR.EMPRESAS.ELIMINARTITULO');
        const confirmText = this.translate.instant('PLATAFORMA.DELETE');
        const cancelText = this.translate.instant('PLATAFORMA.CANCEL');
        const htmlBody = `
        <div style="margin-bottom: 10px;">
            ${this.translate.instant('SUSCRIPTOR.EMPRESAS.ELIMINARTEXTO')}
        </div>
        <small><b>"${empresa?.nombreEmpresa}"</b></small>
    `;
        // this._swalService.getAlertConfirmDelete(titulo, htmlBody, confirmText, cancelText)
        //     .then((confirmado) => {
        //         if (confirmado) {
        //             console.log('id', id.id);
        //             this._empresasScService.eliminarEmpresa(empresa.codigoEmpresaSC || '').subscribe({
        //                 next: (resp: any) => {
        //                     const logData = {
        //                         codigoTipoLog: '',
        //                         codigoRespuesta: '201',
        //                         descripcionLog: this.translate.instant('SUSCRIPTOR.EMPRESAS.ELIMINAREXITOSA') + ' ' + resp.mensaje
        //                     };
        //                     this._logActividadesService.postCrearRegistro(logData).subscribe(() => console.log('log creado exitosamente'));
        //                     this._swalService.getAlertSuccess(this.translate.instant('SUSCRIPTOR.EMPRESAS.ELIMINAREXITOSA') + ' ' + resp.mensaje);
        //                     this.subscriptions.add(
        //                     this._empresasScService.cargarRegistros().subscribe(
        //                             () => console.log('Empresas cargadas y guardadas en el servicio'),
        //                             (err) => console.error('Error al cargar las Empresas:', err)
        //                         )
        //                     );
        //                 },
        //                 error: (err: any) => {
        //                     const logData = {
        //                         codigoTipoLog: '',
        //                         codigoRespuesta: '501',
        //                         descripcionLog: this.translate.instant('SUSCRIPTOR.EMPRESAS.ELIMINARERROR') + ' ' + err.mensaje
        //                     };
        //                     this._logActividadesService.postCrearRegistro(logData).subscribe(() => console.log('log creado exitosamente'));
        //                     this._swalService.getAlertError(this.translate.instant('SUSCRIPTOR.EMPRESAS.ELIMINARERROR') + ' ' + err.mensaje);
        //                     console.error('Error eliminando', err);
        //                 }
        //             });
        //         }
        //     });
    }

    toggleNav(): void {
        this.toggleSidebar.emit();
    }

    OnRegresarClick(event: any) {
        console.log('ejecutando opcion Regresar Suscriptor', event);
        this.router.navigate(['suscriptor/suscriptores']);
    }
}
