/* eslint-disable @typescript-eslint/no-explicit-any */
import { CommonModule } from '@angular/common';
import { Component, OnInit, Output, EventEmitter, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { DataTablesModule } from 'angular-datatables';
import { Subscription, catchError, of, Observable, BehaviorSubject, switchMap, startWith, combineLatest, map, tap } from 'rxjs';
import { PTLSuscriptorModel } from 'src/app/theme/shared/_helpers/models/PTLSuscriptor.model';
import { PTLSuscriptoresService } from 'src/app/theme/shared/service/ptlsuscriptores.service';
import { SharedModule } from 'src/app/theme/shared/shared.module';
import { DatatableComponent } from 'src/app/theme/shared/components/data-table/data-table.component';
import { NavBarComponent } from 'src/app/theme/layout/admin/nav-bar/nav-bar.component';
import { GradientConfig } from 'src/app/app-config';
import { NavigationService } from 'src/app/theme/shared/service/navigation.service';
import { NavContentComponent } from 'src/app/theme/layout/admin/navigation/nav-content/nav-content.component';
import { ColumnMetadata } from 'src/app/theme/shared/_helpers/models/ColumnMetadata.model';
import { NavigationItem } from 'src/app/theme/shared/_helpers/models/Navigation.model';
import { LocalStorageService, PTLHistorialFacturacionService, PTLPaquetesSCService, PTLPaquetesService, SwalAlertService, UploadFilesService } from 'src/app/theme/shared/service';
import Swal from 'sweetalert2';
import { PTLPaquetesSCModel } from 'src/app/theme/shared/_helpers/models/PTLPaquetesSC.model';
import { PTLPaqueteModel } from 'src/app/theme/shared/_helpers/models/PTLPaquete.model';
import { v4 as uuidv4 } from 'uuid';
import { PTLTipoPaqueteModel } from 'src/app/theme/shared/_helpers/models/PTLTiposPaquete.model';
import { PTLTiposPaqueteService } from 'src/app/theme/shared/service/ptltipos-paquete.service';
import { PTLHistorialFacturacionModel } from 'src/app/theme/shared/_helpers/models/PTLHistorialFacturacion.model';
import { PTLTiposPagoService } from 'src/app/theme/shared/service/ptltipos-pago.service';
import { PTLTipoPagoModel } from 'src/app/theme/shared/_helpers/models/PTLTiposPago.model';

@Component({
    selector: 'app-suscriptores',
    standalone: true,
    imports: [CommonModule, DataTablesModule, SharedModule, TranslateModule, NavBarComponent, NavContentComponent, DatatableComponent],
    templateUrl: './suscriptores.component.html',
    styleUrl: './suscriptores.component.scss'
})
export class SuscriptoresComponent implements OnInit, OnDestroy {
    @Output() toggleSidebar = new EventEmitter<void>();
    //#region VARIABLES
    subscriptions = new Subscription();
    paquetes: PTLPaqueteModel[] = [];
    paquetesSC: PTLPaquetesSCModel[] = [];
    tiposPaquete: PTLTipoPaqueteModel[] = [];
    tiposPago: PTLTipoPagoModel[] = [];

    //   filtroCodigoSubject = new BehaviorSubject<string>('todos');
    filtroNombreSubject = new BehaviorSubject<string>('');
    filtroIdentificacionSubject = new BehaviorSubject<string>('');
    filtroEstadoSubject = new BehaviorSubject<string>('todos');

    registrosTransformadas$: Observable<PTLSuscriptorModel[]> = of([]);
    registrosFiltrados$: Observable<PTLSuscriptorModel[]> = of([]);
    registros: PTLSuscriptorModel[] = [];
    suscriptor: string = ''
    lang: string = localStorage.getItem('lang') || '';
    tituloPagina: string = '';
    gradientConfig;
    hasFiltersSlot: boolean = false;
    menuItems!: Observable<NavigationItem[]>;
    activeTab: 'menu' | 'filters' | 'main' = 'menu';

    colorOpcion1 = '#0BD9D2';
    letraOpcion1 = 'E';

    colorOpcion2 = '#e08815';
    letraOpcion2 = 'U';

    colorOpcion3 = '#970fc0';
    letraOpcion3 = 'P';
    //#endregion VARIABLES

    constructor(
        private router: Router,
        private translate: TranslateService,
        private _suscriptoresService: PTLSuscriptoresService,
        private _navigationService: NavigationService,
        private _localStorageService: LocalStorageService,
        private _paquetesService: PTLPaquetesService,
        private _paquetesSCService: PTLPaquetesSCService,
        private _tiposPaqueteService: PTLTiposPaqueteService,
        private _historialFacturacionService: PTLHistorialFacturacionService,
        private _tiposPagoService: PTLTiposPagoService,
        private _uploadService: UploadFilesService,
        private _swalService: SwalAlertService
    ) {
        this.gradientConfig = GradientConfig;
        this.suscriptor = this._localStorageService.getSuscriptorPlataformaLocalStorage()
    }

    ngOnInit() {
        this._navigationService.getNavigationItems();
        this.menuItems = this._navigationService.menuItems$;
        this.hasFiltersSlot = true;
        this.setupRegistrosStream();
        this.paquetes = this._paquetesService.getPaquetesActuales();
        this.paquetesSC = this._paquetesSCService.getPaquetesSCActuales();
        this.tiposPaquete = this._tiposPaqueteService.getTiposPaqueteActuales();
        this.tiposPago = this._tiposPagoService.getTiposPagoActuales();
        this.subscriptions.add(
            this._suscriptoresService.getRegistros().subscribe(
                () => console.log('Suscriptores cargados y guardadas en el servicio'),
                (err) => console.error('Error al cargar los Suscriptores:', err)
            )
        );
    }

    ngOnDestroy(): void {
        this.subscriptions.unsubscribe();
    }

    setupRegistrosStream(): void {
        // 1. Intentamos obtener el suscriptor
        const suscriptor = this._localStorageService.getSuscriptorLocalStorage();
        const codigoSuscriptor = this._localStorageService.getSuscriptorPlataformaLocalStorage()

        this.registrosTransformadas$ = this._suscriptoresService.suscriptores$.pipe(
            map((regs: PTLSuscriptorModel[]) => {
                if (!regs || regs.length === 0) return [];

                return regs.map((reg: any) => {
                    const newReg = { ...reg };
                    console.log('datos suscriptor', newReg);

                    newReg.nomEstado = newReg.estadoSuscriptor ? 'Activo' : 'Inactivo';
                    newReg.logoSuscriptor = this._uploadService.getFilePath(this.suscriptor, 'suscriptores', newReg.logoSuscriptor)
                    newReg.capture = newReg.logoSuscriptor
                    newReg.tipo = 'capture'
                    // if (codigoSuscriptor) {
                    //     newReg.logoSuscriptor = this._uploadService.getFilePath(
                    //         codigoSuscriptor,
                    //         'suscriptores',
                    //         newReg.logoSuscriptor || 'no-imagen.png'
                    //     );
                    // }
                    return newReg as PTLSuscriptorModel;
                });
            }),
            tap((regs) => (this.registros = regs)),
            catchError((err) => {
                console.error('Error en el stream de datos:', err);
                return of([]);
            })
        );

        this.registrosFiltrados$ = combineLatest([
            this.registrosTransformadas$.pipe(startWith([])),
            this.filtroNombreSubject,
            this.filtroIdentificacionSubject,
            this.filtroEstadoSubject
        ]).pipe(
            map(([regs, nombre, identificacion, estado]) => {
                return regs.filter((reg) => {
                    const cumpleNombre = !nombre || (reg.nombreSuscriptor || '').toLowerCase().includes(nombre.toLowerCase());
                    const cumpleIdent = !identificacion || (reg.identificacionSuscriptor || '').includes(identificacion);
                    const cumpleEstado = estado === 'todos' || reg.estadoSuscriptor === (estado === 'true');
                    return cumpleNombre && cumpleIdent && cumpleEstado;
                });
            })
        );

        if (!codigoSuscriptor) {
            console.warn('Advertencia: No hay código de suscriptor en LocalStorage. Los logos podrían no cargar correctamente.');
        }
    }

    onFiltroNombreChangeClick(evento: any) {
        console.log('filtrar el NOMBRE ', evento.target.value);
        this.filtroNombreSubject.next(evento.target.value);
    }

    onFiltroIdentificacionChangeClick(evento: any) {
        console.log('filtrar el descripcion ', evento.target.value);
        this.filtroIdentificacionSubject.next(evento.target.value);
    }

    onFiltroEstadoChangeClick(evento: any) {
        console.log('filtrar el estado ', evento.target.value);
        this.filtroEstadoSubject.next(evento.target.value);
    }

    columnasRegistros: any[] = [
        {
            name: 'logoSuscriptor',
            header: 'SUSCRIPTOR.SUSCRIPTORES.LOGO',
            type: 'image',
            isSortable: false,
            searchable: false
        },
        {
            name: 'nombreSuscriptor',
            header: 'SUSCRIPTOR.SUSCRIPTORES.NAME',
            type: 'text',
            isSortable: true,
            searchable: false
        },
        {
            name: 'identificacionSuscriptor',
            header: 'SUSCRIPTOR.SUSCRIPTORES.IDENTIFICATION',
            type: 'text',
            isSortable: true,
            searchable: false
        },
        {
            name: 'nomEstado',
            header: 'SUSCRIPTOR.SUSCRIPTORES.STATUS',
            type: 'estado',
            isSortable: true,
            searchable: false
        }
    ];

    columnasDetailRegistros: ColumnMetadata[] = [
        {
            name: 'codigoSuscriptor',
            header: 'SUSCRIPTOR.SUSCRIPTORES.CODE',
            type: 'text'
        },
        {
            name: 'direccionSuscriptor',
            header: 'SUSCRIPTOR.SUSCRIPTORES.DIRECCION',
            type: 'text'
        },
        {
            name: 'telefonoContacto',
            header: 'SUSCRIPTOR.SUSCRIPTORES.TELEFONO',
            type: 'text'
        },
        {
            name: 'numeroEmpresas',
            header: 'SUSCRIPTOR.SUSCRIPTORES.NUMEROEMPRESA',
            type: 'text'
        },
        {
            name: 'numeroUsuarios',
            header: 'SUSCRIPTOR.SUSCRIPTORES.NUMEROUSUARIO',
            type: 'text'
        },
        {
            name: 'usuarioAdministrador',
            header: 'SUSCRIPTOR.SUSCRIPTORES.USUARIOADMIN',
            type: 'text'
        },
        {
            name: 'descripcionSuscriptor',
            header: 'SUSCRIPTOR.SUSCRIPTORES.DESCRIPTION',
            type: 'text'
        },
        {
            name: 'capture',
            header: 'SUSCRIPTOR.SUSCRIPTORES.LOGO',
            type: 'capture'
        }
    ];

    OnNuevoRegistroClick() {
        this.router.navigate(['/suscriptor/gestion-suscriptor'], { queryParams: { regId: 'nuevo' } });
    }

    OnEditarRegistroClick(id: number) {
        this.router.navigate(['/suscriptor/gestion-suscriptor'], { queryParams: { regId: id } });
    }

    OnOption1Click(event: any) {
        console.log('ejecutando opcion 1 empresas Suscriptor', event);
        this.router.navigate(['/suscriptor/empresas'], { queryParams: { regId: event } });
    }

    OnOption2Click(event: any) {
        console.log('ejecutando opcion 2 UsuariosSuscriptor', event);
        this.router.navigate(['/suscriptor/usuarios-suscriptor'], { queryParams: { regId: event } });
    }

    OnOption3Click(event: any) {
        console.log('ejecutando opcion 3 paquetesSuscriptor', event);
        this._localStorageService.setObject('regId', event)
        this.router.navigate(['/suscriptor/paquetes-suscriptor']);
    }

    // OnRenovarPaqueteSuscriptor(codigoSusucriptor: string, paqueteSC: PTLPaquetesSCModel) {
    //     const paquete = this.paquetes.find(x => x.codigoPaquete === paqueteSC.codigoPaquete);
    //     const tipoPaquete = this.tiposPaquete.find(x => x.codigoTipoPaquete === paquete?.codigoTipoPaquete);
    //     const fechaVencimiento = new Date().toISOString()

    //     console.log('paquete', paquete);
    //     console.log('tipo de paquete', tipoPaquete);

    //     if (!paquete || !tipoPaquete) {
    //         console.warn('Datos incompletos para procesar el paquete:', paqueteSC.codigoPaquete);
    //         return;
    //     }

    //     const precio = paquete?.precioPaquete || 0;
    //     const desc = tipoPaquete?.descuentoMeses || 0;
    //     const numMeses = tipoPaquete?.numMeses || 0;

    //     const valorDescuento = (precio * desc) / 100;
    //     const precioFinalPorMes = precio - valorDescuento;
    //     const valorFactura = precioFinalPorMes * numMeses;

    //     console.log('Valor a facturar:', valorFactura);

    //     const objHistorial: PTLHistorialFacturacionModel = {
    //         codigoHistorial: uuidv4(),
    //         codigoSuscriptor: codigoSusucriptor,
    //         codigoLicencia: paqueteSC.codigoLicencia,
    //         codigoTipoPago: this.tiposPago[0].codigoTipoPago,
    //         codigoPaquete: paquete.codigoPaquete,
    //         fechaPago: new Date().toISOString(),
    //         numFactura: '001',
    //         montoPagado: valorFactura,
    //         estadoPago: true,
    //         codigoUsuarioCreacion: this._localStorageService.getUsuarioLocalStorage().codigoUsuario || '',
    //         fechaCreacion: new Date().toISOString()
    //     }
    //     console.log('historial facturacion:', objHistorial);

    //     this._historialFacturacionService.postCrearRegistroManual(objHistorial).subscribe({
    //         next: (data: any) => {
    //             console.log('historial CREADO', data.historial);
    //             const dataHistorial = data.historial
    //             const fechaVencimiento = new Date(dataHistorial.fechaPago);
    //             fechaVencimiento.setMonth(fechaVencimiento.getMonth() + Number(numMeses));
    //             const fechaVencimientoStr = fechaVencimiento.toISOString();
    //             this.OnGestionarPaqueteSuscriptor(codigoSusucriptor, paquete, fechaVencimientoStr, paqueteSC.codigoLicencia || '');
    //         },
    //         error: (err) => {
    //             const rutaTraduccion = `SUSCRIPTORES.GESTION.${err}`;
    //         }
    //     });

    // }

    // OnGestionarPaqueteSuscriptor(codigoSusucriptor: string, paqueteSC: PTLPaquetesSCModel, fecha: string) {
    //     const pqtIdx = this.paquetesSC.findIndex(x => x.codigoPaquete == paqueteSC.codigoPaquete);
    //     let numRen = 0;
    //     let fechaInicio = new Date().toISOString();
    //     if (pqtIdx == -1) {
    //         numRen = 1;
    //     } else {
    //         let num = this.paquetesSC[pqtIdx].numRenovaciones || 0;
    //         numRen = num++;
    //         fechaInicio = this.paquetesSC[pqtIdx].fechaInicio || new Date().toISOString();
    //     }

    //     const paqueteSuscriptor: PTLPaquetesSCModel = {
    //         codigoSuscriptorPaquete: uuidv4(),
    //         codigoSuscriptor: codigoSusucriptor,
    //         codigoPaquete: paqueteSC.codigoPaquete,
    //         codigoLicencia: paqueteSC.codigoLicencia,
    //         fechaInicio: paqueteSC.fechaInicio,
    //         fechaVencimiento: fecha,
    //         fechaRenovacion: new Date().toISOString(),
    //         numRenovaciones: numRen,
    //         estadoLicencia: true,
    //         codigoUsuarioCreacion: this._localStorageService.getUsuarioLocalStorage().codigoUsuario || '',
    //         fechaCreacion: new Date().toISOString()
    //     };

    //     console.log('nueva paquete', paqueteSuscriptor);
    //     this._paquetesSCService.postCrearRegistro(paqueteSuscriptor).subscribe({
    //         next: (data: any) => {
    //             console.log('paqueteSC CREADO', data.paqueteSC);
    //         },
    //         error: (err) => {
    //             const rutaTraduccion = `SUSCRIPTORES.GESTION.${err}`;
    //         }
    //     });

    // }

    OnEliminarRegistroClick(id: any) {
        const suscriptor = this.registros.filter((x) => x.codigoSuscriptor == id.id)[0];
        const titulo = this.translate.instant('SUSCRIPTOR.SUSCRIPTORES.ELIMINARTITULO');
        const confirmText = this.translate.instant('PLATAFORMA.DELETE');
        const cancelText = this.translate.instant('PLATAFORMA.CANCEL');
        const htmlBody = `
        <div style="margin-bottom: 10px;">
            ${this.translate.instant('SUSCRIPTOR.SUSCRIPTORES.ELIMINARTEXTO')}
        </div>
        <small><b>"${suscriptor?.nombreSuscriptor}"</b></small>
    `;
        // this._swalService.getAlertConfirmDelete(titulo, htmlBody, confirmText, cancelText)
        //     .then((confirmado) => {
        //         if (confirmado) {
        //             this._suscriptoresService.eliminarSuscripctor(id.id).subscribe({
        //             next: (resp: any) => {
        //                 Swal.fire(this.translate.instant('SUSCRIPTOR.SUSCRIPTORES.ELIMINAREXITOSA'), resp.mensaje, 'success');
        //                 this.subscriptions.add(
        //                         this._suscriptoresService.getRegistros().subscribe(
        //                             () => console.log('Suscriptores cargados y guardadas en el servicio'),
        //                             err => console.error('Error al cargar los Suscriptores:', err)
        //                         )
        //                     )
        //             },
        //             error: (err: any) => {
        //                 Swal.fire('Error', this.translate.instant('SUSCRIPTOR.SUSCRIPTORES.ELIMINARERROR'), 'error');
        //                 console.error('Error eliminando', err);
        //             }
        //             });
        //         }
        //     });
    }

    toggleNav(): void {
        this.toggleSidebar.emit();
    }
}
