// /* eslint-disable @typescript-eslint/no-explicit-any */
// import { CommonModule } from '@angular/common';
// import { Component, OnInit, Output, EventEmitter, OnDestroy } from '@angular/core';
// import { ActivatedRoute, Router } from '@angular/router';
// import { TranslateModule, TranslateService } from '@ngx-translate/core';
// import { DataTablesModule } from 'angular-datatables';
// import { Subscription, catchError, of, Observable, BehaviorSubject, switchMap, startWith, combineLatest, map, tap } from 'rxjs';
// import { PTLSuscriptorModel } from 'src/app/theme/shared/_helpers/models/PTLSuscriptor.model';
// import { PTLSuscriptoresService } from 'src/app/theme/shared/service/ptlsuscriptores.service';
// import { SharedModule } from 'src/app/theme/shared/shared.module';
// import { DatatableComponent } from 'src/app/theme/shared/components/data-table/data-table.component';
// import { NavBarComponent } from 'src/app/theme/layout/admin/nav-bar/nav-bar.component';
// import { GradientConfig } from 'src/app/app-config';
// import { NavigationService } from 'src/app/theme/shared/service/navigation.service';
// import { NavContentComponent } from 'src/app/theme/layout/admin/navigation/nav-content/nav-content.component';
// import { ColumnMetadata } from 'src/app/theme/shared/_helpers/models/ColumnMetadata.model';
// import { NavigationItem } from 'src/app/theme/shared/_helpers/models/Navigation.model';
// import { LanguageService, LocalStorageService, PTLHistorialFacturacionService, PTLPaquetesSCService, PTLPaquetesService, SwalAlertService, UploadFilesService } from 'src/app/theme/shared/service';
// import Swal from 'sweetalert2';
// import { PTLPaquetesSCModel } from 'src/app/theme/shared/_helpers/models/PTLPaquetesSC.model';
// import { PTLPaqueteModel } from 'src/app/theme/shared/_helpers/models/PTLPaquete.model';
// import { v4 as uuidv4 } from 'uuid';
// import { PTLTipoPaqueteModel } from 'src/app/theme/shared/_helpers/models/PTLTiposPaquete.model';
// import { PTLTiposPaqueteService } from 'src/app/theme/shared/service/ptltipos-paquete.service';
// import { PTLHistorialFacturacionModel } from 'src/app/theme/shared/_helpers/models/PTLHistorialFacturacion.model';
// import { PTLTiposPagoService } from 'src/app/theme/shared/service/ptltipos-pago.service';
// import { PTLTipoPagoModel } from 'src/app/theme/shared/_helpers/models/PTLTiposPago.model';

// @Component({
//     selector: 'app-paquetes-suscriptor',
//     standalone: true,
//     imports: [CommonModule, DataTablesModule, SharedModule, TranslateModule, NavBarComponent, NavContentComponent, DatatableComponent],
//     templateUrl: './paquetes-suscriptor.component.html',
//     styleUrl: './paquetes-suscriptor.component.scss'
// })
// export class PaquetesSuscriptorComponent implements OnInit, OnDestroy {
//     @Output() toggleSidebar = new EventEmitter<void>();
//     //#region VARIABLES
//     FormRegistro: PTLPaquetesSCModel = new PTLPaquetesSCModel();
//     historial: PTLHistorialFacturacionModel = new PTLHistorialFacturacionModel();
//     paqueteSC: PTLPaquetesSCModel = new PTLPaquetesSCModel();
//     isSubmit: boolean = false;
//     subscriptions = new Subscription();
//     suscriptores: PTLSuscriptorModel[] = [];
//     paquetes: PTLPaqueteModel[] = [];
//     paquetesSC: PTLPaquetesSCModel[] = [];
//     tiposPaquete: PTLTipoPaqueteModel[] = [];
//     tiposPago: PTLTipoPagoModel[] = [];
//     historiales: PTLHistorialFacturacionModel[] = [];
//     private socketSub!: Subscription;
//     private historialSocketSub!: Subscription;
//     mostrarModalRenovacion: boolean = false;
//     registroSeleccionado: any = null;
//     registrosTransformadas$: Observable<PTLPaquetesSCModel[]> = of([]);
//     registrosFiltrados$: Observable<PTLPaquetesSCModel[]> = of([]);
//     registros: PTLPaquetesSCModel[] = [];
//     suscriptor: string = ''

//     //   filtroCodigoSubject = new BehaviorSubject<string>('todos');
//     filtroPaqueteSubject = new BehaviorSubject<string>('todos');
//     filtroEstadoSubject = new BehaviorSubject<string>('todos');

//     lang: string = localStorage.getItem('lang') || 'es';
//     tituloPagina: string = '';
//     suscPlataforma: string = '';
//     codigoSuscriptor: string = '';
//     codigoTipoPago: string = '';

//     gradientConfig;
//     hasFiltersSlot: boolean = false;
//     menuItems!: Observable<NavigationItem[]>;
//     activeTab: 'menu' | 'filters' | 'main' = 'menu';

//     colorOpcion1 = '#ec5914';
//     letraOpcion1 = 'R';

//     //#endregion VARIABLES

//     constructor(
//         private router: Router,
//         private route: ActivatedRoute,
//         private translate: TranslateService,
//         private _suscriptoresService: PTLSuscriptoresService,
//         private _navigationService: NavigationService,
//         private _localStorageService: LocalStorageService,
//         private _languageService: LanguageService,
//         private _paquetesService: PTLPaquetesService,
//         private _paquetesSCService: PTLPaquetesSCService,
//         private _tiposPaqueteService: PTLTiposPaqueteService,
//         private _tiposPagoService: PTLTiposPagoService,
//         private _historialFacturacionService: PTLHistorialFacturacionService,
//         private _swalService: SwalAlertService
//     ) {
//         this.gradientConfig = GradientConfig;
//         this.codigoSuscriptor = this._localStorageService.getObject<string>('regId') || '';
//         this.suscPlataforma = this._localStorageService.getSuscriptorPlataformaLocalStorage();
//     }

//     ngOnInit() {
//         this._navigationService.getNavigationItems();
//         this.menuItems = this._navigationService.menuItems$;
//         this.hasFiltersSlot = true;
//         this.setupRegistrosStream();
//         this.socketSub = this._paquetesSCService.paquetesSCChange$.subscribe((payload) => {
//             // console.log('¡Aviso del socket recibido en el componente!', payload);
//             // this.setupRegistrosStream();
//             console.log('¡Aviso del socket recibido en el componente!', payload);

//             this.subscriptions.add(
//                 this._paquetesSCService.cargarRegistros().subscribe(() => {
//                     this._historialFacturacionService.getRegistros().subscribe((resp: any) => {
//                         this.paquetesSC = this._paquetesSCService.getPaquetesSCActuales();
//                         this.historiales = resp.historiales || resp;
//                         this.setupRegistrosStream();
//                     });
//                 })
//             );
//         });
//         this.historialSocketSub = this._historialFacturacionService.historialesChange$.subscribe((payload) => {
//             console.log('¡Aviso del socket facturación (historial) recibido!', payload);

//             // Vamos al backend por los datos frescos
//             this.subscriptions.add(
//                 this._historialFacturacionService.getRegistros().subscribe((resp: any) => {
//                     // Actualizamos la variable local con la data fresca
//                     this.historiales = resp.historiales;

//                     // Re-armamos la tabla (esto actualizará el detalle desplegable)
//                     this.setupRegistrosStream();
//                 })
//             );
//         });
//         this.subscriptions.add(
//             this._suscriptoresService.getRegistros().subscribe(
//                 () => console.log('Suscriptores cargados y guardadas en el servicio'),
//                 (err) => console.error('Error al cargar los Suscriptores:', err)
//             )
//         );
//         this.subscriptions.add(
//             this._languageService.currentLang$.subscribe(lang => {
//                 this.lang = lang;
//                 this.letraOpcion1 = lang == 'es' ? 'R' : 'R';
//             })
//         );

//         this.suscriptores = this._suscriptoresService.getSuscriptoresActuales();
//         this.paquetes = this._paquetesService.getPaquetesActuales();
//         this.paquetesSC = this._paquetesSCService.getPaquetesSCActuales();
//         this.tiposPaquete = this._tiposPaqueteService.getTiposPaqueteActuales();
//         this.tiposPago = this._tiposPagoService.getTiposPagoActuales();
//         this.historiales = this._historialFacturacionService.getHistorialesActuales();
//     }

//     ngOnDestroy(): void {
//         this.subscriptions.unsubscribe();
//         if (this.socketSub) {
//             this.socketSub.unsubscribe();
//         }
//     }

//     setupRegistrosStream(): void {
//         this.registrosTransformadas$ = this._paquetesSCService.paquetesSC$.pipe(
//             switchMap((paqs: PTLPaquetesSCModel[]) => {
//                 if (!paqs) return of([])
//                 const pqsSuscriptor = paqs.filter(x => x.codigoSuscriptor == this.codigoSuscriptor)
//                 const transformedPacks = pqsSuscriptor.map((reg: any) => {
//                     const newReg = { ...reg };
//                     newReg.nomSuscriptor = this.suscriptores.find(x => x.codigoSuscriptor == newReg.codigoSuscriptor)?.nombreSuscriptor;
//                     newReg.nomPaquete = this.paquetes.find(x => x.codigoPaquete == newReg.codigoPaquete)?.nombrePaquete;
//                     newReg.nomEstado = newReg.estadoLicencia ? 'Activo' : 'Inactivo';

//                     const rawHistoriales = this.historiales.filter(x => x.codigoPaquete == reg.codigoPaquete && x.codigoSuscriptor == newReg.codigoSuscriptor);
//                     let histos: any[] = [];
//                     if (rawHistoriales.length > 0) {
//                         rawHistoriales.forEach((histo: any) => {
//                             const tipoPago = this.tiposPago.find(x => x.codigoTipoPago == histo.codigoTipoPago)?.nombreTipoPago
//                             const item = {
//                                 fechaPago: new Date(histo.fechaPago).toLocaleDateString(),
//                                 numFactura: histo.numFactura,
//                                 tipoPago: tipoPago,
//                                 montoPagado: histo.montoPagado,
//                                 numeroCuota: histo.numeroCuota,
//                                 estadoPago: histo.estadoPago == true ? 'Pagado' : 'Pendiente'
//                             }
//                             histos.push(item)
//                         });
//                     }
//                     const historialesOrdenados = histos.sort((a, b) => {
//                         // return a.numeroCuota - b.numeroCuota; // Ascendente
//                         return b.numeroCuota - a.numeroCuota; // Para Descendente
//                     });
//                     newReg.historiales = historialesOrdenados || []
//                     return newReg as PTLPaquetesSCModel;
//                 });
//                 console.log('data paquetes', transformedPacks);

//                 return of(transformedPacks)
//             }),
//             catchError(err => {
//                 console.error('Error en el stream de aplicaciones:', err)
//                 return of([])
//             })
//         )

//         this.registrosFiltrados$ = combineLatest([
//             this.registrosTransformadas$.pipe(startWith([])),
//             this.filtroPaqueteSubject,
//             this.filtroEstadoSubject
//         ]).pipe(
//             map(([paqs, paquete, estado]) => {
//                 let filteredpaquetes = paqs

//                 if (paquete !== 'todos') {
//                     filteredpaquetes = filteredpaquetes.filter((mod: any) => mod.codigoPaquete === paquete)
//                 }

//                 if (estado !== 'todos') {
//                     const estadoBoolean = estado === 'true'
//                     filteredpaquetes = filteredpaquetes.filter((mod: any) => mod.estadoLicencia === estadoBoolean)
//                 }

//                 return filteredpaquetes
//             })
//         )
//     }

//     onFiltroPaqueteChangeClick(evento: any) {
//         console.log('filtrar el paquete ', evento.target.value);
//         this.filtroPaqueteSubject.next(evento.target.value);
//     }

//     onFiltroEstadoChangeClick(evento: any) {
//         console.log('filtrar el estado ', evento.target.value);
//         this.filtroEstadoSubject.next(evento.target.value);
//     }

//     columnasRegistros: any[] = [
//         {
//             name: 'nomSuscriptor',
//             header: 'SUSCRIPTOR.PAQUETESSC.SUSCRIPTOR',
//             type: 'text',
//             isSortable: true,
//             searchable: false
//         },
//         {
//             name: 'nomPaquete',
//             header: 'SUSCRIPTOR.PAQUETESSC.NAME',
//             type: 'text',
//             isSortable: true,
//             searchable: false
//         },
//         {
//             name: 'fechaInicio',
//             header: 'SUSCRIPTOR.PAQUETESSC.FECHAINICIO',
//             type: 'date',
//             isSortable: true,
//             searchable: false
//         },
//         {
//             name: 'fechaProximoPago',
//             header: 'SUSCRIPTOR.PAQUETESSC.FECHAVENCIMINETO',
//             type: 'date',
//             isSortable: true,
//             searchable: false
//         },
//         {
//             name: 'fechaRenovacion',
//             header: 'SUSCRIPTOR.PAQUETESSC.FECHARENOVACION',
//             type: 'date',
//             isSortable: true,
//             searchable: false
//         },
//         {
//             name: 'numRenovaciones',
//             header: 'SUSCRIPTOR.PAQUETESSC.RENOVACIONES',
//             type: 'estado',
//             isSortable: true,
//             searchable: false
//         },
//         {
//             name: 'nomEstado',
//             header: 'SUSCRIPTOR.PAQUETESSC.ESTADO',
//             type: 'estado',
//             isSortable: true,
//             searchable: false
//         }
//     ];

//     columnasDetailRegistros: ColumnMetadata[] = [
//         {
//             name: 'codigoPaquete',
//             header: 'SUSCRIPTOR.PAQUETESSC.PAQUETE',
//             type: 'text'
//         },
//         {
//             name: 'codigoLicencia',
//             header: 'SUSCRIPTOR.PAQUETESSC.LICENCIA',
//             type: 'text'
//         },
//         {
//             name: 'fechaRenovacion',
//             header: 'SUSCRIPTOR.PAQUETESSC.FECHARENOVACION',
//             type: 'date'
//         },
//         {
//             name: 'fechaProximoPago',
//             header: 'SUSCRIPTOR.PAQUETESSC.FECHAPROXIMOPAGO',
//             type: 'date'
//         },
//         {
//             name: 'historiales',
//             header: 'SUSCRIPTOR.PAQUETESSC.HISTORIALES',
//             type: 'json-tabla'
//         }
//     ];

//     OnNuevoRegistroClick() {
//         this._localStorageService.setObject('regId', this.codigoSuscriptor)
//         this._localStorageService.removeObject('paqId')
//         this.router.navigate(['/suscriptor/gestion-paquete-suscriptor']);
//     }

//     OnRegresarClick(event: any) {
//         this.router.navigate(['/suscriptor/suscriptores']);
//     }

//     OnEditarRegistroClick(id: number) {
//         this._localStorageService.setObject('regId', this.codigoSuscriptor)
//         this._localStorageService.setObject('paqId', event)
//         this.router.navigate(['/suscriptor/gestion-suscriptor'], { queryParams: { regId: id } });
//     }

//     OnOption1Click(event: any) {
//         console.log('ejecutando opcion 1 empresas Suscriptor', event);
//         // this._localStorageService.setObject('regId', this.codigoSuscriptor)
//         // this._localStorageService.setObject('paqId', event)
//         // this.router.navigate(['/suscriptor/gestion-paquete-suscriptor']);

//         this.registroSeleccionado = event;
//         let paSc = this.paquetesSC.find(x => x.codigoSuscriptorPaquete == event) || new PTLPaquetesSCModel()
//         let paquete = this.paquetes.find(x => x.codigoPaquete == paSc?.codigoPaquete)
//         let tipoPaquete = this.tiposPaquete.find(x => x.codigoTipoPaquete == paquete?.codigoTipoPaquete)
//         console.log('datros para renovar:', paSc);
//         console.log('datos paquete:', paquete);
//         console.log('datos tipoPaquete:', tipoPaquete);
//         this.FormRegistro.codigoTipoPago = '';
//         this.FormRegistro.codigoLicencia = paSc?.codigoLicencia;
//         this.FormRegistro.codigoTipoPaquete = paSc?.codigoTipoPaquete;
//         this.FormRegistro.precioPaquete = paquete?.precioPaquete;
//         this.FormRegistro.mesesCobertura = tipoPaquete?.numMeses;
//         this.FormRegistro.descuentoMeses = tipoPaquete?.descuentoMeses;

//         const precio = this.FormRegistro.precioPaquete || 0
//         const numMeses = tipoPaquete?.numMeses || 0
//         const desc = tipoPaquete?.descuentoMeses || 0

//         const valorDescuento = (precio * desc) / 100;
//         const precioFinalPorMes = precio - valorDescuento;
//         const valorFactura = precioFinalPorMes * numMeses;

//         this.FormRegistro.valorMes = precioFinalPorMes
//         this.FormRegistro.valorPago = valorFactura

//         const fechaVencimiento = new Date();
//         fechaVencimiento.setMonth(fechaVencimiento.getMonth() + Number(numMeses));
//         const fechaVencimientoStr = fechaVencimiento.toISOString();

//         this.FormRegistro.fechaProximoPagoDate = fechaVencimiento.toLocaleDateString();
//         this.FormRegistro.fechaProximoPago = fechaVencimientoStr

//         console.log('gestionar formulario paquete sc', this.FormRegistro);
//         console.log('todos los historiales', this.historiales);
//         const historial = this.historiales.filter(x => x.codigoSuscriptor == this.FormRegistro.codigoSuscriptor && x.codigoPaquete == this.FormRegistro.codigoPaquete)
//         const ultimHistorial = historial[historial.length - 1];
//         console.log('ultimHistorial', ultimHistorial);
//         let numeroCuota = this.historiales.length + 1;

//         const objHistorial: PTLHistorialFacturacionModel = {
//             codigoHistorial: uuidv4(),
//             codigoSuscriptor: paSc?.codigoSuscriptor,
//             codigoLicencia: paSc?.codigoLicencia,
//             codigoTipoPago: this.codigoTipoPago,
//             codigoPaquete: paquete?.codigoPaquete,
//             fechaPago: new Date().toISOString(),
//             numFactura: '',
//             numeroCuota: numeroCuota,
//             montoPagado: valorFactura,
//             estadoPago: true,
//             codigoUsuarioCreacion: this._localStorageService.getUsuarioLocalStorage().codigoUsuario || '',
//             fechaCreacion: new Date().toISOString()
//         }
//         console.log('historial facturacion:', objHistorial);
//         this.historial = objHistorial;
//         paSc.codigoUsuarioModificacion = this._localStorageService.getUsuarioLocalStorage().codigoUsuario || ''
//         paSc.fechaModificacion = new Date().toISOString()
//         paSc.fechaProximoPago = fechaVencimiento.toISOString()
//         paSc.fechaRenovacion = new Date().toISOString()
//         paSc.numRenovaciones = numeroCuota
//         this.paqueteSC = paSc;
//         console.log('paqueteSC renovar:', this.paqueteSC);

//         this.mostrarModalRenovacion = true;
//     }

//     onTipoPaqueteChangeClick(event: any) {
//         const tipoPaquete = this.tiposPaquete.find(x => x.codigoTipoPaquete == event.target.value);
//         this.FormRegistro.descuentoMeses = tipoPaquete?.descuentoMeses || 0
//         this.FormRegistro.mesesCobertura = tipoPaquete?.numMeses || 0
//     }

//     onTipoPagoChangeClick(event: any) {
//         console.log('asi va el form', this.FormRegistro);
//         this.codigoTipoPago = event.target.value;
//     }

//     gestionarPaqueteSuscriptor() {
//         console.log('GESTIONAR paquete', this.paqueteSC);
//         this._paquetesSCService.putModificarRegistro(this.paqueteSC).subscribe({
//             next: (data: any) => {
//                 console.log('paqueteSC MODIFICADO', data.paqueteSC);
//             },
//             error: (err) => {
//                 const rutaTraduccion = `SUSCRIPTORES.GESTION.${err}`;
//             }
//         });
//     }

//     procesarRenovacion() {
//         console.log('Procesando renovación para:', this.registroSeleccionado);
//         this.historial.codigoTipoPago = this.codigoTipoPago;
//         console.log('Crear el historial:', this.historial);
//         this._historialFacturacionService.postCrearRegistroManual(this.historial).subscribe({
//             next: (data: any) => {
//                 console.log('historial CREADO', data.historial);
//                 const dataHistorial = data.historial
//                 this.gestionarPaqueteSuscriptor();
//             },
//             error: (err) => {
//                 const rutaTraduccion = `SUSCRIPTORES.GESTION.${err}`;
//             }
//         });

//         // Al terminar exitosamente, cierras el modal
//         this.cerrarModal();
//     }

//     OnEliminarRegistroClick(id: any) {
//         const suscriptor = this.registros.filter((x) => x.codigoSuscriptor == id.id)[0];
//         const titulo = this.translate.instant('SUSCRIPTOR.PAQUETESSC.ELIMINARTITULO');
//         const confirmText = this.translate.instant('PLATAFORMA.DELETE');
//         const cancelText = this.translate.instant('PLATAFORMA.CANCEL');
//         const htmlBody = `
//         <div style="margin-bottom: 10px;">
//             ${this.translate.instant('SUSCRIPTOR.PAQUETESSC.ELIMINARTEXTO')}
//         </div>
//         <small><b>"${suscriptor?.codigoPaquete}"</b></small>
//     `;
//         // this._swalService.getAlertConfirmDelete(titulo, htmlBody, confirmText, cancelText)
//         //     .then((confirmado) => {
//         //         if (confirmado) {
//         //             this._suscriptoresService.eliminarSuscripctor(id.id).subscribe({
//         //             next: (resp: any) => {
//         //                 Swal.fire(this.translate.instant('SUSCRIPTOR.PAQUETESSC.ELIMINAREXITOSA'), resp.mensaje, 'success');
//         //                 this.subscriptions.add(
//         //                         this._suscriptoresService.getRegistros().subscribe(
//         //                             () => console.log('Suscriptores cargados y guardadas en el servicio'),
//         //                             err => console.error('Error al cargar los Suscriptores:', err)
//         //                         )
//         //                     )
//         //             },
//         //             error: (err: any) => {
//         //                 Swal.fire('Error', this.translate.instant('SUSCRIPTOR.PAQUETESSC.ELIMINARERROR'), 'error');
//         //                 console.error('Error eliminando', err);
//         //             }
//         //             });
//         //         }
//         //     });
//     }

//     toggleNav(): void {
//         this.toggleSidebar.emit();
//     }

//     cerrarModal() {
//         this.mostrarModalRenovacion = false;
//         this.registroSeleccionado = null;
//     }
// }
/* eslint-disable @typescript-eslint/no-explicit-any */
import { CommonModule } from '@angular/common';
import { Component, OnInit, Output, EventEmitter, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
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
import { LanguageService, LocalStorageService, PTLHistorialFacturacionService, PTLPaquetesSCService, PTLPaquetesService, SwalAlertService, UploadFilesService, UtilidadesService } from 'src/app/theme/shared/service';
import Swal from 'sweetalert2';
import { PTLPaquetesSCModel } from 'src/app/theme/shared/_helpers/models/PTLPaquetesSC.model';
import { PTLPaqueteModel } from 'src/app/theme/shared/_helpers/models/PTLPaquete.model';
import { v4 as uuidv4 } from 'uuid';
import { PTLTipoPaqueteModel } from 'src/app/theme/shared/_helpers/models/PTLTiposPaquete.model';
import { PTLTiposPaqueteService } from 'src/app/theme/shared/service/ptltipos-paquete.service';
import { PTLHistorialFacturacionModel } from 'src/app/theme/shared/_helpers/models/PTLHistorialFacturacion.model';
import { PTLTiposPagoService } from 'src/app/theme/shared/service/ptltipos-pago.service';
import { PTLTipoPagoModel } from 'src/app/theme/shared/_helpers/models/PTLTiposPago.model';
import { PtlPermisosService } from 'src/app/theme/shared/service/ptlpermisos.service';
import { TableDataComponent } from "src/app/theme/shared/components/table-data/table-data.component";
import { DataLoaderComponent } from "src/app/theme/shared/components/data-loader/data-loader.component";

@Component({
    selector: 'app-paquetes-suscriptor',
    standalone: true,
    imports: [CommonModule, DataTablesModule, SharedModule, TranslateModule, NavBarComponent, NavContentComponent, DatatableComponent, TableDataComponent, DataLoaderComponent],
    templateUrl: './paquetes-suscriptor.component.html',
    styleUrl: './paquetes-suscriptor.component.scss'
})
export class PaquetesSuscriptorComponent implements OnInit, OnDestroy {
    @Output() toggleSidebar = new EventEmitter<void>();

    //#region VARIABLES
    FormRegistro: PTLPaquetesSCModel = new PTLPaquetesSCModel();
    historial: PTLHistorialFacturacionModel = new PTLHistorialFacturacionModel();
    paqueteSC: PTLPaquetesSCModel = new PTLPaquetesSCModel();
    isSubmit: boolean = false;
    subscriptions = new Subscription();
    suscriptores: PTLSuscriptorModel[] = [];
    paquetes: PTLPaqueteModel[] = [];
    paquetesSC: PTLPaquetesSCModel[] = [];
    tiposPaquete: PTLTipoPaqueteModel[] = [];
    tiposPago: PTLTipoPagoModel[] = [];
    historiales: PTLHistorialFacturacionModel[] = [];
    private socketSub!: Subscription;
    private historialSocketSub!: Subscription;
    mostrarModalRenovacion: boolean = false;
    registroSeleccionado: any = null;
    registrosTransformadas$: Observable<PTLPaquetesSCModel[]> = of([]);
    registrosFiltrados$: Observable<PTLPaquetesSCModel[]> = of([]);
    registros: PTLPaquetesSCModel[] = [];
    suscriptor: string = ''

    //  filtroCodigoSubject = new BehaviorSubject<string>('todos');
    filtroPaqueteSubject = new BehaviorSubject<string>('todos');
    filtroEstadoSubject = new BehaviorSubject<string>('todos');

    lang: string = localStorage.getItem('lang') || 'es';
    tituloPagina: string = '';
    suscPlataforma: string = '';
    codigoSuscriptor: string = '';
    codigoTipoPago: string = '';

    gradientConfig;
    hasFiltersSlot: boolean = false;
    menuItems!: Observable<NavigationItem[]>;
    activeTab: 'menu' | 'filters' | 'main' = 'menu';

    colorOpcion1 = '#ec5914';
    letraOpcion1 = 'R';
    //#endregion VARIABLES

    constructor(
        private router: Router,
        private route: ActivatedRoute,
        private translate: TranslateService,
        private cdr: ChangeDetectorRef,
        private _suscriptoresService: PTLSuscriptoresService,
        private _navigationService: NavigationService,
        private _localStorageService: LocalStorageService,
        private _languageService: LanguageService,
        private _paquetesService: PTLPaquetesService,
        private _paquetesSCService: PTLPaquetesSCService,
        private _tiposPaqueteService: PTLTiposPaqueteService,
        private _tiposPagoService: PTLTiposPagoService,
        private _historialFacturacionService: PTLHistorialFacturacionService,
        private _utilidaddesService: UtilidadesService,
        private _swalService: SwalAlertService,
        private _permisosService: PtlPermisosService
    ) {
        this.gradientConfig = GradientConfig;
        this.codigoSuscriptor = this._localStorageService.getObject<string>('regId') || '';
        this.suscPlataforma = this._localStorageService.getSuscriptorPlataformaLocalStorage();
    }

    ngOnInit() {
        this._navigationService.getNavigationItems();
        this.menuItems = this._navigationService.menuItems$;
        this.hasFiltersSlot = true;

        this.cargarCatalogosEstaticos();
        this.iniciarEscuchasSockets();
        this.setupRegistrosStream();
    }

    ngOnDestroy(): void {
        this.subscriptions.unsubscribe();
        if (this.socketSub) {
            this.socketSub.unsubscribe();
        }
        if (this.historialSocketSub) {
            this.historialSocketSub.unsubscribe();
        }
    }

    // =========================================================================
    // INICIALIZACIÓN Y SOCKETS
    // =========================================================================
    private cargarCatalogosEstaticos(): void {
        this.subscriptions.add(
            this._suscriptoresService.getRegistros().subscribe(
                () => console.log('Suscriptores cargados y guardadas en el servicio'),
                (err) => console.error('Error al cargar los Suscriptores:', err)
            )
        );
        this.subscriptions.add(
            this._languageService.currentLang$.subscribe(lang => {
                this.lang = lang;
                this.letraOpcion1 = lang == 'es' ? 'R' : 'R';
            })
        );

        this.suscriptores = this._suscriptoresService.getSuscriptoresActuales();
        this.paquetes = this._paquetesService.getPaquetesActuales();
        this.paquetesSC = this._paquetesSCService.getPaquetesSCActuales();
        this.tiposPaquete = this._tiposPaqueteService.getTiposPaqueteActuales();
        this.tiposPago = this._tiposPagoService.getTiposPagoActuales();
        this.historiales = this._historialFacturacionService.getHistorialesActuales();
    }

    private iniciarEscuchasSockets(): void {
        this.socketSub = this._paquetesSCService.paquetesSCChange$.pipe(
            tap(payload => console.log('¡Aviso del socket paquetes recibido en el componente!', payload)),
            switchMap(() => this._paquetesSCService.cargarRegistros()),
            switchMap(() => this._historialFacturacionService.getRegistros())
        ).subscribe((resp: any) => {
            this.paquetesSC = this._paquetesSCService.getPaquetesSCActuales();
            this.historiales = resp.historiales || resp;
            this.setupRegistrosStream();
        });

        this.historialSocketSub = this._historialFacturacionService.historialesChange$.pipe(
            tap(payload => console.log('¡Aviso del socket facturación (historial) recibido!', payload)),
            switchMap(() => this._historialFacturacionService.getRegistros())
        ).subscribe((resp: any) => {
            this.historiales = resp.historiales;
            this.setupRegistrosStream();
        });
    }

    setupRegistrosStream(): void {
        this.registrosTransformadas$ = combineLatest([
            this._paquetesSCService.paquetesSC$,
            this._permisosService.actividadesAutorizadas$
        ]).pipe(
            map(([paqs, permisos]: [PTLPaquetesSCModel[], string[]]) => {
                if (!paqs || paqs.length === 0) return [];

                console.log('paquetes', paqs);
                const pqsSuscriptor = paqs.filter(x => x.codigoSuscriptor == this.codigoSuscriptor);
                console.log('paquetes suscriptor', pqsSuscriptor);

                return pqsSuscriptor.map((reg: any) => {

                    const newReg = this._estructurarPaqueteConHistorial(reg);

                    const accionesPermitidas: any[] = [];

                    const puedeModificar = permisos.includes('ACT_SUSCPAQ_MODIFICAR');
                    if (puedeModificar) {
                        accionesPermitidas.push({
                            accion: 'MODIFICAR',
                            letra: 'M',
                            color: '#007bff',
                            tooltip: (this.translate.instant('SUSCRIPTOR.PAQUETESSC.MODIFICAR'))
                        });
                    }

                    const puedeEliminar = permisos.includes('ACT_SUSCPAQ_ELIMINAR');
                    if (puedeEliminar) {
                        accionesPermitidas.push({
                            accion: 'ELIMINAR',
                            letra: 'E',
                            color: '#dc3545',
                            tooltip: (this.translate.instant('SUSCRIPTOR.PAQUETESSC.ELIMINAR'))
                        });
                    }

                    const puedeRenovar = permisos.includes('ACT_SUSCPAQ_RENOVAR');
                    if (puedeRenovar) {
                        accionesPermitidas.push({
                            accion: 'RENOVAR',
                            letra: 'R',
                            color: '#ec5914',
                            tooltip: (this.translate.instant('SUSCRIPTOR.PAQUETESSC.RENOVAR'))
                        });
                    }

                    return {
                        ...newReg,
                        '_acciones': accionesPermitidas
                    } as PTLPaquetesSCModel;
                });
            }),
            tap((regs) => {
                this.registros = regs;
                console.log('todos los registros', this.registros);
                this.cdr.detectChanges();
            }),
            catchError((err) => {
                console.error('Error en el stream de datos:', err);
                return of([]);
            })
        );

        this.registrosFiltrados$ = combineLatest([
            this.registrosTransformadas$.pipe(startWith([])),
            this.filtroPaqueteSubject,
            this.filtroEstadoSubject
        ]).pipe(
            map(([paqs, paquete, estado]) => {
                let filteredpaquetes = paqs;

                if (paquete !== 'todos') {
                    filteredpaquetes = filteredpaquetes.filter((mod: any) => mod.codigoPaquete === paquete);
                }

                if (estado !== 'todos') {
                    const estadoBoolean = estado === 'true';
                    filteredpaquetes = filteredpaquetes.filter((mod: any) => mod.estadoLicencia === estadoBoolean);
                }

                return filteredpaquetes;
            })
        );
    }

    private _estructurarPaqueteConHistorial(reg: any): PTLPaquetesSCModel {
        const newReg = { ...reg };
        newReg.nomSuscriptor = this.suscriptores.find(x => x.codigoSuscriptor == newReg.codigoSuscriptor)?.nombreSuscriptor;
        newReg.nomPaquete = this.paquetes.find(x => x.codigoPaquete == newReg.codigoPaquete)?.nombrePaquete;
        newReg.nomEstado = newReg.estadoLicencia ? 'Activo' : 'Inactivo';

        const rawHistoriales = this.historiales.filter(x =>
            x.codigoPaquete == reg.codigoPaquete && x.codigoSuscriptor == newReg.codigoSuscriptor
        );

        const histos = rawHistoriales.map((histo: any) => ({
            fechaPago: new Date(histo.fechaPago).toLocaleDateString(),
            numFactura: histo.numFactura,
            tipoPago: this.tiposPago.find(x => x.codigoTipoPago == histo.codigoTipoPago)?.nombreTipoPago,
            montoPagado: this._utilidaddesService.formatearMoneda(histo.montoPagado, 2),
            numeroCuota: histo.numeroCuota,
            estadoPago: histo.estadoPago == true ? 'Pagado' : 'Pendiente'
        }));

        newReg.historiales = histos.sort((a, b) => b.numeroCuota - a.numeroCuota) || [];
        return newReg as PTLPaquetesSCModel;
    }

    // =========================================================================
    // EVENTOS DE LA UI Y FILTROS
    // =========================================================================
    onFiltroPaqueteChangeClick(evento: any) {
        console.log('filtrar el paquete ', evento.target.value);
        this.filtroPaqueteSubject.next(evento.target.value);
    }

    onFiltroEstadoChangeClick(evento: any) {
        console.log('filtrar el estado ', evento.target.value);
        this.filtroEstadoSubject.next(evento.target.value);
    }

    onTipoPaqueteChangeClick(event: any) {
        const tipoPaquete = this.tiposPaquete.find(x => x.codigoTipoPaquete == event.target.value);
        this.FormRegistro.descuentoMeses = tipoPaquete?.descuentoMeses || 0;
        this.FormRegistro.mesesCobertura = tipoPaquete?.numMeses || 0;
    }

    onTipoPagoChangeClick(event: any) {
        console.log('asi va el form', this.FormRegistro);
        this.codigoTipoPago = event.target.value;
    }

    columnasRegistros: any[] = [
        { name: 'nomSuscriptor', header: 'SUSCRIPTOR.PAQUETESSC.SUSCRIPTOR', type: 'text', isSortable: true, searchable: false },
        { name: 'nomPaquete', header: 'SUSCRIPTOR.PAQUETESSC.NAME', type: 'text', isSortable: true, searchable: false },
        { name: 'fechaInicio', header: 'SUSCRIPTOR.PAQUETESSC.FECHAINICIO', type: 'date', isSortable: true, searchable: false },
        { name: 'fechaProximoPago', header: 'SUSCRIPTOR.PAQUETESSC.FECHAVENCIMINETO', type: 'date', isSortable: true, searchable: false },
        { name: 'fechaRenovacion', header: 'SUSCRIPTOR.PAQUETESSC.FECHARENOVACION', type: 'date', isSortable: true, searchable: false },
        { name: 'numRenovaciones', header: 'SUSCRIPTOR.PAQUETESSC.RENOVACIONES', type: 'estado', isSortable: true, searchable: false },
        { name: 'nomEstado', header: 'SUSCRIPTOR.PAQUETESSC.ESTADO', type: 'estado', isSortable: true, searchable: false }
    ];

    columnasDetailRegistros: ColumnMetadata[] = [
        { name: 'codigoPaquete', header: 'SUSCRIPTOR.PAQUETESSC.PAQUETE', type: 'text' },
        { name: 'codigoLicencia', header: 'SUSCRIPTOR.PAQUETESSC.LICENCIA', type: 'text' },
        { name: 'fechaRenovacion', header: 'SUSCRIPTOR.PAQUETESSC.FECHARENOVACION', type: 'date' },
        { name: 'fechaProximoPago', header: 'SUSCRIPTOR.PAQUETESSC.FECHAPROXIMOPAGO', type: 'date' },
        { name: 'historiales', header: 'SUSCRIPTOR.PAQUETESSC.HISTORIALES', type: 'json-tabla' }
    ];

    // =========================================================================
    // NAVEGACIÓN Y ACCIONES DE TABLA
    // =========================================================================
    OnNuevoRegistroClick() {
        this._localStorageService.setObject('regId', this.codigoSuscriptor);
        this._localStorageService.removeObject('paqId');
        this.router.navigate(['/suscriptor/gestion-paquete-suscriptor']);
    }

    OnRegresarClick(event: any) {
        this.router.navigate(['/suscriptor/suscriptores']);
    }

    toggleNav(): void {
        this.toggleSidebar.emit();
    }

    cerrarModal() {
        this.mostrarModalRenovacion = false;
        this.registroSeleccionado = null;
    }

    onAccionPrincipal(evento: { accion: string, row: any }) {
        const { accion, row } = evento;
        const id = row.codigoSuscriptorPaquete || row.id;

        console.log(`Acción ejecutada: [${accion}] sobre el registro ID:`, id);

        switch (accion) {
            case 'MODIFICAR':
                console.log('inactivar usuario codigo', id);
                console.log('ejecutando opcion 1 empresas Suscriptor', id);
                this._localStorageService.setObject('regId', id);
                this.router.navigate(['/suscriptor/gestion-suscriptor']);
                break;
            case 'ELIMINAR':
                const value = id;
                console.log('opcion 1 click', value);
                console.log('ejecutando opcion 2 UsuariosSuscriptor', id);
                console.log('cancelar el paquete', value);

                const paqueteToCancel = this.paquetesSC.find(x => x.codigoSuscriptorPaquete == value);

                if (!paqueteToCancel) {
                    console.error('No se encontró el paquete a cancelar');
                    return;
                }

                const paqueteInfo = this.paquetes.find(x => x.codigoPaquete == paqueteToCancel.codigoPaquete);

                const titulo = this.translate.instant('SUSCRIPTOR.PAQUETESSC.ELIMINARTITULO');
                const confirmText = this.translate.instant('SUSCRIPTOR.PAQUETESSC.ACCEPTTEXT');
                const cancelText = this.translate.instant('SUSCRIPTOR.PAQUETESSC.CANCEL');
                const placeholder = this.translate.instant('SUSCRIPTOR.PAQUETESSC.PLACEHOLDERCANCEL');
                const errorobs = this.translate.instant('SUSCRIPTOR.PAQUETESSC.ERROROBSERVACION');

                const htmlBody = `
                    <div style="margin-bottom: 10px;">
                        ${this.translate.instant('SUSCRIPTOR.PAQUETESSC.CONFIRMTEXT')}
                    </div>
                    <small><b>"${paqueteInfo?.nombrePaquete || paqueteToCancel.codigoPaquete}"</b></small>
                    `;

                this._swalService.getAlertConfirmWithTextarea(titulo, htmlBody, placeholder, confirmText, cancelText, errorobs)
                    .then((resultado) => {

                        if (resultado.isConfirmed) {

                            const paqueteActualizado: PTLPaquetesSCModel = {
                                ...paqueteToCancel,
                                estadoLicencia: false,
                                observaciones: resultado.value,
                                fechaCancelacion: new Date().toISOString(),
                                codigoUsuarioModificacion: this._localStorageService.getUsuarioLocalStorage().codigoUsuario || '',
                                fechaModificacion: new Date().toISOString()
                            };

                            this.subscriptions.add(
                                this._paquetesSCService.putModificarRegistro(paqueteActualizado).subscribe({
                                    next: (resp: any) => {
                                        this._swalService.getAlertConfirmSuccess(this.translate.instant('SUSCRIPTOR.PAQUETESSC.SUCCESSTEXT'));
                                    },
                                    error: (err: any) => {
                                        this._swalService.getAlertConfirmError(this.translate.instant('SUSCRIPTOR.PAQUETESSC.ERRORTEXT'));
                                        console.error('Error cancelando paquete', err);
                                    }
                                })
                            );
                        }
                    });

                break;
            case 'RENOVAR':
                console.log('ejecutando opcion 3 paquetesSuscriptor', id);
                this.registroSeleccionado = event;
                this._prepararDatosDeRenovacion(id);
                this.mostrarModalRenovacion = true;
                break;
            default:
                console.warn(`Acción no reconocida: ${accion}`);
                break;
        }
    }

    private _prepararDatosDeRenovacion(codigoSuscriptorPaquete: string): void {
        let paSc = this.paquetesSC.find(x => x.codigoSuscriptorPaquete == codigoSuscriptorPaquete) || new PTLPaquetesSCModel();
        let paquete = this.paquetes.find(x => x.codigoPaquete == paSc?.codigoPaquete);
        let tipoPaquete = this.tiposPaquete.find(x => x.codigoTipoPaquete == paquete?.codigoTipoPaquete);

        console.log('datros para renovar:', paSc);
        console.log('datos paquete:', paquete);
        console.log('datos tipoPaquete:', tipoPaquete);

        const precio = paquete?.precioPaquete || 0;
        const numMeses = tipoPaquete?.numMeses || 0;
        const desc = tipoPaquete?.descuentoMeses || 0;

        const valorDescuento = (precio * desc) / 100;
        const precioFinalPorMes = precio - valorDescuento;
        const valorFactura = precioFinalPorMes * numMeses;

        const fechaVencimiento = new Date();
        fechaVencimiento.setMonth(fechaVencimiento.getMonth() + Number(numMeses));
        const fechaVencimientoStr = fechaVencimiento.toISOString();

        this.FormRegistro = {
            ...this.FormRegistro,
            codigoTipoPago: '',
            codigoLicencia: paSc?.codigoLicencia,
            codigoTipoPaquete: paSc?.codigoTipoPaquete,
            precioPaquete: precio,
            mesesCobertura: numMeses,
            descuentoMeses: desc,
            valorMes: precioFinalPorMes,
            valorPago: valorFactura,
            fechaProximoPagoDate: fechaVencimiento.toLocaleDateString(),
            fechaProximoPago: fechaVencimientoStr
        };

        console.log('gestionar formulario paquete sc', this.FormRegistro);
        console.log('todos los historiales', this.historiales);

        const historialLocal = this.historiales.filter(x =>
            x.codigoSuscriptor == this.FormRegistro.codigoSuscriptor && x.codigoPaquete == this.FormRegistro.codigoPaquete
        );
        const ultimHistorial = historialLocal[historialLocal.length - 1];
        console.log('ultimHistorial', ultimHistorial);

        let numeroCuota = this.historiales.length + 1;
        const fechaActual = new Date().toISOString();
        const usuarioId = this._localStorageService.getUsuarioLocalStorage().codigoUsuario || '';

        this.historial = {
            codigoHistorial: uuidv4(),
            codigoSuscriptor: paSc?.codigoSuscriptor,
            codigoLicencia: paSc?.codigoLicencia,
            codigoTipoPago: this.codigoTipoPago,
            codigoPaquete: paquete?.codigoPaquete,
            fechaPago: fechaActual,
            numFactura: '',
            numeroCuota: numeroCuota,
            montoPagado: valorFactura,
            estadoPago: true,
            codigoUsuarioCreacion: usuarioId,
            fechaCreacion: fechaActual
        } as PTLHistorialFacturacionModel;

        console.log('historial facturacion:', this.historial);

        this.paqueteSC = {
            ...paSc,
            observaciones: '',
            fechaCancelacion: '',
            codigoUsuarioModificacion: usuarioId,
            fechaModificacion: fechaActual,
            fechaProximoPago: fechaVencimiento.toISOString(),
            fechaRenovacion: fechaActual,
            numRenovaciones: numeroCuota
        };

        console.log('paqueteSC renovar:', this.paqueteSC);
    }

    gestionarPaqueteSuscriptor() {
        console.log('GESTIONAR paquete', this.paqueteSC);
        this._paquetesSCService.putModificarRegistro(this.paqueteSC).subscribe({
            next: (data: any) => {
                console.log('paqueteSC MODIFICADO', data.paqueteSC);
            },
            error: (err) => {
                const rutaTraduccion = `SUSCRIPTORES.GESTION.${err}`;
                console.error(rutaTraduccion);
            }
        });
    }

    procesarRenovacion() {
        console.log('Procesando renovación para:', this.registroSeleccionado);
        this.historial.codigoTipoPago = this.codigoTipoPago;
        console.log('Crear el historial:', this.historial);

        this._historialFacturacionService.postCrearRegistroManual(this.historial).subscribe({
            next: (data: any) => {
                console.log('historial CREADO', data.historial);
                this.gestionarPaqueteSuscriptor();
            },
            error: (err) => {
                const rutaTraduccion = `SUSCRIPTORES.GESTION.${err}`;
                console.error(rutaTraduccion);
            }
        });

        this.cerrarModal();
    }
}
