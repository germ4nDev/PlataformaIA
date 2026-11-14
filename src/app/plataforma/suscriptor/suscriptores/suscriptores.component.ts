/* eslint-disable @typescript-eslint/no-explicit-any */
import { CommonModule } from '@angular/common';
import { Component, OnInit, Output, EventEmitter, OnDestroy, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { DataTablesModule } from 'src/app/theme/shared/directive/datatable/datatable.module';
import { Subscription, catchError, of, Observable, BehaviorSubject, switchMap, startWith, combineLatest, map, tap } from 'rxjs';
import { PTLSuscriptorModel } from 'src/app/theme/shared/_helpers/models/PTLSuscriptor.model';
import { PTLSuscriptoresService } from 'src/app/theme/shared/service/ptlsuscriptores.service';
import { SharedModule } from 'src/app/theme/shared/shared.module';
import { NavBarComponent } from 'src/app/theme/layout/admin/nav-bar/nav-bar.component';
import { GradientConfig } from 'src/app/app-config';
import { NavigationService } from 'src/app/theme/shared/service/navigation.service';
import { NavContentComponent } from 'src/app/theme/layout/admin/navigation/nav-content/nav-content.component';
import { ColumnMetadata } from 'src/app/theme/shared/_helpers/models/ColumnMetadata.model';
import { NavigationItem } from 'src/app/theme/shared/_helpers/models/Navigation.model';
import {
  LocalStorageService,
  PTLHistorialFacturacionService,
  PTLPaquetesSCService,
  PTLPaquetesService,
  SocketService,
  SwalAlertService,
  UploadFilesService
} from 'src/app/theme/shared/service';
import Swal from 'sweetalert2';
import { PTLPaquetesSCModel } from 'src/app/theme/shared/_helpers/models/PTLPaquetesSC.model';
import { PTLPaqueteModel } from 'src/app/theme/shared/_helpers/models/PTLPaquete.model';
import { v4 as uuidv4 } from 'uuid';
import { PTLTipoPaqueteModel } from 'src/app/theme/shared/_helpers/models/PTLTiposPaquete.model';
import { PTLTiposPaqueteService } from 'src/app/theme/shared/service/ptltipos-paquete.service';
import { PTLHistorialFacturacionModel } from 'src/app/theme/shared/_helpers/models/PTLHistorialFacturacion.model';
import { PTLTiposPagoService } from 'src/app/theme/shared/service/ptltipos-pago.service';
import { PTLTipoPagoModel } from 'src/app/theme/shared/_helpers/models/PTLTiposPago.model';
import { TableDataComponent } from 'src/app/theme/shared/components/table-data/table-data.component';
import { PtlPermisosService } from 'src/app/theme/shared/service/ptlpermisos.service';
import { DataLoaderComponent } from 'src/app/theme/shared/components/data-loader/data-loader.component';

@Component({
  selector: 'app-suscriptores',
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
  templateUrl: './suscriptores.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
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
  suscriptor: string = '';
  lang: string = localStorage.getItem('lang') || '';
  tituloPagina: string = '';
  gradientConfig;
  hasFiltersSlot: boolean = false;
  menuItems!: Observable<NavigationItem[]>;
  activeTab: 'menu' | 'filters' | 'main' = 'menu';
  //#endregion VARIABLES

  constructor(
    private router: Router,
    private cdr: ChangeDetectorRef,
    private translate: TranslateService,
    private _suscriptoresService: PTLSuscriptoresService,
    private _navigationService: NavigationService,
    private _localStorageService: LocalStorageService,
    private _paquetesService: PTLPaquetesService,
    private _paquetesSCService: PTLPaquetesSCService,
    private _tiposPaqueteService: PTLTiposPaqueteService,
    private _tiposPagoService: PTLTiposPagoService,
    private _uploadService: UploadFilesService,
    private _permisosService: PtlPermisosService
  ) {
    this.gradientConfig = GradientConfig;
    this.suscriptor = this._localStorageService.getSuscriptorPlataformaLocalStorage();
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
    const codigoSuscriptor = this._localStorageService.getSuscriptorPlataformaLocalStorage();

    this.registrosTransformadas$ = combineLatest([
      this._suscriptoresService.suscriptores$,
      this._permisosService.actividadesAutorizadas$
    ]).pipe(
      map(([regs, permisos]: [PTLSuscriptorModel[], string[]]) => {
        if (!regs || regs.length === 0) return [];

        return regs.map((reg: any) => {
          const newReg = { ...reg };

          newReg.nomEstado = newReg.estadoSuscriptor ? 'Activo' : 'Inactivo';
          newReg.logoSuscriptor = this._uploadService.getFilePath(this.suscriptor, 'suscriptores', newReg.logoSuscriptor);
          newReg.capture = newReg.logoSuscriptor;
          newReg.tipo = 'capture';

          const accionesPermitidas: any[] = [];

          const puedeModificar = permisos.includes('ACT_SUSC_MODIFICAR');
          if (puedeModificar) {
            accionesPermitidas.push({
              accion: 'MODIFICAR',
              letra: 'M',
              color: '#007bff',
              tooltip: this.translate.instant('COMMON.EDIT_2')
            });
          }

          const puedeEliminar = permisos.includes('ACT_SUSC_ELIMINAR');
          if (puedeEliminar) {
            accionesPermitidas.push({
              accion: 'ELIMINAR',
              letra: 'E',
              color: '#dc3545',
              tooltip: this.translate.instant('COMMON.DELETE')
            });
          }

          const puedeEmpresas = permisos.includes('ACT_SUSC_EMPRESAS');
          if (puedeEmpresas) {
            accionesPermitidas.push({
              accion: 'EMPRESAS',
              letra: 'E',
              color: '#0BD9D2',
              tooltip: this.translate.instant('SUSCRIPTOR.SUSCRIPTORES.SUBSCRIBER_COMPANIES')
            });
          }

          const puedeUsuarios = permisos.includes('ACT_SUSC_USUARIOS');
          if (puedeUsuarios) {
            accionesPermitidas.push({
              accion: 'USUARIOS',
              letra: 'U',
              color: '#e08815',
              tooltip: this.translate.instant('COMMON.USERS')
            });
          }

          const puedePaquetes = permisos.includes('ACT_SUSC_PAQUETES');
          if (puedePaquetes) {
            accionesPermitidas.push({
              accion: 'PAQUETES',
              letra: 'P',
              color: '#970fc0',
              tooltip: this.translate.instant('SUSCRIPTOR.SUSCRIPTORES.PACKAGES')
            });
          }

          return {
            ...newReg,
            _acciones: accionesPermitidas
          } as PTLSuscriptorModel;
        });
      }),
      tap((regs) => {
        this.registros = regs;
        this.cdr.detectChanges();
      }),
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
      header: 'COMMON.LOGO',
      type: 'image',
      isSortable: false,
      searchable: false
    },
    {
      name: 'nombreSuscriptor',
      header: 'COMMON.NAME',
      type: 'text',
      isSortable: true,
      searchable: false
    },
    {
      name: 'identificacionSuscriptor',
      header: 'COMMON.IDENTIFICATION',
      type: 'text',
      isSortable: true,
      searchable: false
    },
    {
      name: 'nomEstado',
      header: 'COMMON.STATUS',
      type: 'estado',
      isSortable: true,
      searchable: false
    }
  ];

  columnasDetailRegistros: ColumnMetadata[] = [
    {
      name: 'codigoSuscriptor',
      header: 'COMMON.CODE',
      type: 'text'
    },
    {
      name: 'direccionSuscriptor',
      header: 'SUSCRIPTOR.SUSCRIPTORES.ADDRESS',
      type: 'text'
    },
    {
      name: 'telefonoContacto',
      header: 'SUSCRIPTOR.SUSCRIPTORES.PHONE',
      type: 'text'
    },
    {
      name: 'numeroEmpresas',
      header: 'SUSCRIPTOR.SUSCRIPTORES.COMPANY_NUMBER',
      type: 'text'
    },
    {
      name: 'numeroUsuarios',
      header: 'SUSCRIPTOR.SUSCRIPTORES.USER_NUMBER',
      type: 'text'
    },
    {
      name: 'usuarioAdministrador',
      header: 'SUSCRIPTOR.SUSCRIPTORES.ADMIN_USER',
      type: 'text'
    },
    {
      name: 'descripcionSuscriptor',
      header: 'COMMON.DESCRIPTION',
      type: 'text'
    },
    {
      name: 'capture',
      header: 'COMMON.LOGO',
      type: 'capture'
    }
  ];

  OnNuevoRegistroClick() {
    this._localStorageService.setObject('regId', 'nuevo');
    this.router.navigate(['/suscriptor/gestion-suscriptor'], { queryParams: { regId: 'nuevo' } });
  }

  OnEditarRegistroClick(id: string) {
    this._localStorageService.setObject('regId', id);
    this.router.navigate(['/suscriptor/gestion-suscriptor']);
  }

  onAccionPrincipal(evento: { accion: string; row: any }) {
    const { accion, row } = evento;
    const id = row.codigoSuscriptor || row.id;

    console.log(`Acción ejecutada: [${accion}] sobre el registro ID:`, row);

    switch (accion) {
      case 'EMPRESAS':
        console.log('inactivar usuario codigo', id);
        console.log('ejecutando opcion 1 empresas Suscriptor', event);
        this._localStorageService.setObject('regId', id);
        this.router.navigate(['/suscriptor/empresas']);
        break;
      case 'USUARIOS':
        const value = id;
        console.log('opcion 1 click', value);
        console.log('ejecutando opcion 2 UsuariosSuscriptor', id);
        this._localStorageService.setObject('regId', id);
        this.router.navigate(['/suscriptor/usuarios-suscriptor']);
        break;
      case 'PAQUETES':
        console.log('ejecutando opcion 3 paquetesSuscriptor', id);
        this._localStorageService.setObject('regId', id);
        this.router.navigate(['/suscriptor/paquetes-suscriptor']);
        break;
      default:
        console.warn(`Acción no reconocida: ${accion}`);
        break;
    }
  }

  OnEliminarRegistroClick(id: any) {
    const suscriptor = this.registros.filter((x) => x.codigoSuscriptor == id.id)[0];
    const titulo = this.translate.instant('COMMON.ARE_YOU_SURE_YOU_WANT_DELETE_2');
    const confirmText = this.translate.instant('COMMON.DELETE');
    const cancelText = this.translate.instant('COMMON.CANCEL');
    const htmlBody = `
        <div style="margin-bottom: 10px;">
            ${this.translate.instant('SUSCRIPTOR.SUSCRIPTORES.YOU_ARE_ABOUT_DELETE_SUBSCRIBER')}
        </div>
        <small><b>"${suscriptor?.nombreSuscriptor}"</b></small>
    `;
    // this._swalService.getAlertConfirmDelete(titulo, htmlBody, confirmText, cancelText)
    //     .then((confirmado) => {
    //         if (confirmado) {
    //             this._suscriptoresService.eliminarSuscripctor(id.id).subscribe({
    //             next: (resp: any) => {
    //                 Swal.fire(this.translate.instant('SUSCRIPTOR.SUSCRIPTORES.DELETED_SUCCESSFULLY'), resp.mensaje, 'success');
    //                 this.subscriptions.add(
    //                         this._suscriptoresService.getRegistros().subscribe(
    //                             () => console.log('Suscriptores cargados y guardadas en el servicio'),
    //                             err => console.error('Error al cargar los Suscriptores:', err)
    //                         )
    //                     )
    //             },
    //             error: (err: any) => {
    //                 Swal.fire('Error', this.translate.instant('SUSCRIPTOR.SUSCRIPTORES.COULD_NOT_DELETE_SUBSCRIBER'), 'error');
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
