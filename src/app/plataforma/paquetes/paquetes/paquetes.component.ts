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
import { PTLListasPreciosService } from 'src/app/theme/shared/service/ptllistas-precios.service';
import { ColumnMetadata } from 'src/app/theme/shared/_helpers/models/ColumnMetadata.model';
import { PTLPaqueteModel } from 'src/app/theme/shared/_helpers/models/PTLPaquete.model';
import { NavigationItem } from 'src/app/theme/shared/_helpers/models/Navigation.model';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-paquetes',
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
    private _swalService: SwalAlertService,
    private _listasPrecios: PTLListasPreciosService
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
    // OT-029: el precio sale de la lista de precios vigente (mensual), no del paquete
    const vigente$ = this._listasPrecios.vigente().pipe(
      catchError(() => of({ lista: null, detalles: [] as any[] })),
      startWith({ lista: null, detalles: [] as any[] })
    );
    this.paquetesTransformados$ = combineLatest([
      this._registrosService.paquetes$,
      this._permisosService.actividadesAutorizadas$,
      vigente$
    ]).pipe(
      map(([paqs, permisos, vigente]: [PTLPaqueteModel[], string[], any]) => {
        if (!paqs || paqs.length === 0) return [];

        return paqs.map((paq: any) => {
          const newPaq: any = { ...paq };
          newPaq.nomEstado = newPaq.estadoPaquete ? 'Activo' : 'Inactivo';
          newPaq.nomPromocion = newPaq.promocion ? 'Si' : 'No';
          const precio = (vigente?.detalles || []).find(
            (d: any) => d.tipoReferencia === 'PAQUETE' && d.codigoReferencia === paq.codigoPaquete
          );
          newPaq.precioPaquete = precio ? Number(precio.valorMensual) : null;

          const accionesPermitidas: any[] = [];

          if (permisos.includes('ACT_PAQS_MODIFICAR')) {
            accionesPermitidas.push({
              accion: 'MODIFICAR',
              letra: 'M',
              color: '#2a5dbd',
              tooltip: this.translate.instant('COMMON.EDIT')
            });
          }

          if (permisos.includes('ACT_PAQS_ELIMINAR')) {
            accionesPermitidas.push({
              accion: 'ELIMINAR',
              letra: 'E',
              color: '#dd1717',
              tooltip: this.translate.instant('COMMON.DELETE')
            });
          }

          if (permisos.includes('ACT_PAQS_MODULOS')) {
            accionesPermitidas.push({
              accion: 'MODULOS',
              letra: 'M',
              color: '#6f42c1',
              tooltip: this.translate.instant('COMMON.MODULES')
            });
          }

          if (permisos.includes('ACT_PAQS_ITEMS')) {
            accionesPermitidas.push({
              accion: 'ITEMS',
              letra: 'I',
              color: '#4279c1',
              tooltip: this.translate.instant('PAQUETES.PACKAGE_ITEMS')
            });
          }

          if (permisos.includes('ACT_PAQS_PRECIOS')) {
            accionesPermitidas.push({
              accion: 'PRECIOS',
              letra: 'P',
              color: '#28a745',
              tooltip: this.translate.instant('PAQUETES.PRICES')
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
      catchError((err) => {
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
          filteredPaquetes = filteredPaquetes.filter((p) => (p.nombrePaquete || '').toLowerCase().includes(textoFiltro));
        }

        if (descripcion) {
          const textoFiltro = descripcion.toLowerCase();
          filteredPaquetes = filteredPaquetes.filter((p) => (p.descripcionPaquete || '').toLowerCase().includes(textoFiltro));
        }

        if (estado !== 'todos') {
          const estadoBoolean = estado === 'true';
          filteredPaquetes = filteredPaquetes.filter((p) => p.estadoPaquete === estadoBoolean);
        }

        return filteredPaquetes;
      })
    );
  }

  onAccionPrincipal(evento: { accion: string; row: any }) {
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
    this._swalService
      .getAlertQuestionRequest(
        this.translate.instant('COMMON.APPLICATION_WILL_BE_DELETED') + ` "${row.nombrePaquete}".`,
        this.translate.instant('COMMON.ARE_YOU_SURE_YOU_WANT_DELETE')
      )
      .subscribe((result) => {
        if (result) {
          this._registrosService.deleteEliminarRegistro(row.codigoPaquete).subscribe({
            next: (resp: any) => {
              const logData = {
                codigoTipoLog: '',
                codigoRespuesta: '201',
                descripcionLog: this.translate.instant('COMMON.APPLICATION_WAS_DELETED_SUCCESSFULLY') + ' ' + resp.mensaje
              };
              this._logActividadesService.postCrearRegistro(logData).subscribe();
              this._swalService.getAlertSuccess(resp.mensaje);
              // El stream se actualiza solo si el backend responde por sockets, sino recargamos
            },
            error: (err: any) => {
              const logData = {
                codigoTipoLog: '',
                codigoRespuesta: '501',
                descripcionLog: this.translate.instant('COMMON.COULD_NOT_DELETE_APPLICATION') + ' ' + err.mensaje
              };
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

  onFiltroNombreChangeClick(evento: any) {
    this.filtroNombreSubject.next(evento.target.value);
  }
  onFiltroDescripcionChangeClick(evento: any) {
    this.filtroDescripcionSubject.next(evento.target.value);
  }
  onFiltroEstadoChangeClick(evento: any) {
    this.filtroEstadoSubject.next(evento.target.value);
  }
  toggleNav(): void {
    this.toggleSidebar.emit();
  }

  columnasPaquetes: ColumnMetadata[] = [
    { name: 'nombrePaquete', header: 'COMMON.NAME', type: 'text' },
    { name: 'costoPaquete', header: 'PAQUETES.COST', type: 'price' },
    { name: 'precioPaquete', header: 'PAQUETES.MONTHLY_PRICE_CURRENT_LIST', type: 'price' },
    { name: 'nomPromocion', header: 'PAQUETES.PROMOTION', type: 'estado' },
    { name: 'nomEstado', header: 'COMMON.STATUS', type: 'estado' }
  ];

  columnasDetailRegistros: ColumnMetadata[] = [
    { name: 'codigoPaquete', header: 'COMMON.CODE', type: 'text' },
    { name: 'precioPromocion', header: 'PAQUETES.PROMOTIONAL_PRICE', type: 'price' },
    { name: 'descripcionPaquete', header: 'COMMON.DESCRIPTION', type: 'text' },
    { name: 'acuerdoLicencia', header: 'PAQUETES.LICENSE_AGREEMENT', type: 'text' },
    { name: 'iconoPaquete', header: 'COMMON.ICON', type: 'avatar' },
    { name: 'imagenPaquete', header: 'COMMON.IMAGE', type: 'image' }
  ];
}
