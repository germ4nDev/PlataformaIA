import { traducir } from '../../../../theme/shared/i18n/traducir';
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Component, EventEmitter, Output, OnInit, OnDestroy, ChangeDetectorRef, isDevMode } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataTablesModule } from 'src/app/theme/shared/directive/datatable/datatable.module';
import { Router } from '@angular/router';
import { SharedModule } from 'src/app/theme/shared/shared.module';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Observable, Subscription, of, BehaviorSubject, combineLatest } from 'rxjs'; // Importación de BehaviorSubject y combineLatest
import { catchError, map, startWith, switchMap, tap } from 'rxjs/operators';
import { GradientConfig } from 'src/app/app-config';
import { NavContentComponent } from 'src/app/theme/layout/admin/navigation/nav-content/nav-content.component';
import { NavigationService } from 'src/app/theme/shared/service/navigation.service';
import { ColumnMetadata } from 'src/app/theme/shared/_helpers/models/ColumnMetadata.model';
import { PTLLogActividadAPModel } from 'src/app/theme/shared/_helpers/models/PTLlogActividadAP.model';
import { NavigationItem } from 'src/app/theme/shared/_helpers/models/Navigation.model';
import { DataLoaderComponent } from 'src/app/theme/shared/components/data-loader/data-loader.component';
import { ExcelUploaderComponent } from 'src/app/theme/shared/components/excel-loader/excel-loader.component';
import { NavBarComponent } from 'src/app/theme/layout/admin/nav-bar/nav-bar.component';
import { BaseSessionModel } from 'src/app/theme/shared/_helpers/models/BaseSession.model';

import { Widget } from 'src/app/theme/shared/_helpers/models/tablero-control/widget.model';
import { WidgetsService } from 'src/app/theme/shared/service/tablero-control/widgets.service';
import { LocalStorageService, PtllogActividadesService, SwalAlertService, UploadFilesService } from 'src/app/theme/shared/service';

import Swal from 'sweetalert2';
import { TableDataComponent } from 'src/app/theme/shared/components/table-data/table-data.component';
import { PtlPermisosService } from 'src/app/theme/shared/service/ptlpermisos.service';
import { PTLWidgetsMaestroService } from 'src/app/theme/shared/service/ptlwidgets-maestro.service';
import { PTLWidgetMaestroModel } from 'src/app/theme/shared/_helpers/models/PTLWidgetMaestro.model';
import { camposDelWidget, canalDelFormulario, canalDelWidget } from '../nucleo';

@Component({
  selector: 'app-widgets',
  imports: [
    CommonModule,
    DataTablesModule,
    SharedModule,
    TranslateModule,
    NavContentComponent,
    DataLoaderComponent,
    ExcelUploaderComponent,
    NavBarComponent,
    TableDataComponent
  ],
  templateUrl: './widgets.component.html',
  styleUrl: './widgets.component.scss'
})
export class WidgetsComponent implements OnInit, OnDestroy {
  @Output() toggleSidebar = new EventEmitter<void>();
  widgetssTransformados$: Observable<PTLWidgetMaestroModel[]> = of([]);
  widgetssFiltradas$: Observable<PTLWidgetMaestroModel[]> = of([]);
  widgets: PTLWidgetMaestroModel[] = [];
  DataModel: BaseSessionModel = new BaseSessionModel();
  DataLogActividad: PTLLogActividadAPModel = new PTLLogActividadAPModel();

  moduloTituloExcel: string = '';
  gradientConfig;
  lang = localStorage.getItem('lang');
  menuItems$!: Observable<NavigationItem[]>;
  hasFiltersSlot: boolean = false;
  activeTab: 'menu' | 'filters' | 'main' = 'menu';
  subscriptions = new Subscription();

  filtroCodigoSubject = new BehaviorSubject<string>('');
  filtroNombreSubject = new BehaviorSubject<string>('');
  filtroColumnasSubject = new BehaviorSubject<string>('');
  filtroFilasSubject = new BehaviorSubject<string>('');
  filtroDescripcionSubject = new BehaviorSubject<string>('');
  filtroPestanaSubject = new BehaviorSubject<string>('');
  filtroEstadoSubject = new BehaviorSubject<string>('');
  filtroCanalSubject = new BehaviorSubject<string>('');
  suscriptor: string = '';
  tipoMedia: string = '';
  video: string = '';
  urlSubidaUsuarios: string = '';

  constructor(
    private router: Router,
    private cdr: ChangeDetectorRef,
    private translate: TranslateService,
    private _navigationService: NavigationService,
    private _logActividadesService: PtllogActividadesService,
    private _localStorageService: LocalStorageService,
    private _permisosService: PtlPermisosService,
    private _widgetsService: PTLWidgetsMaestroService,
    private _swalService: SwalAlertService,
    private _uploadService: UploadFilesService
  ) {
    this.gradientConfig = GradientConfig;
    this.suscriptor = this._localStorageService.getSuscriptorPlataformaLocalStorage();
  }

  ngOnInit(): void {
    this._navigationService.getNavigationItems();
    this.menuItems$ = this._navigationService.menuItems$;
    this.hasFiltersSlot = true;

    this.setupWidgetsStream();

    this.subscriptions.add(
      this._widgetsService.cargarRegistros().subscribe({
        next: () => console.log('✅ Widgets cargados y transmitidos exitosamente'),
        error: (err) => console.error('❌ Error al cargar widgets:', err)
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  get isDarkMode(): boolean {
    const mode = this._localStorageService.getThemeSettings();
    return mode.isDarkTheme;
  }

  getFileType(url: string): 'capture' | 'video' | 'documento' | 'desconocido' {
    if (!url) return 'desconocido';
    const cleanUrl = url.split(/[#?]/)[0];
    const extension = cleanUrl.split('.').pop()?.toLowerCase() || '';
    const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'bmp'];
    if (imageExts.includes(extension)) return 'capture';
    return 'desconocido';
  }

  setupWidgetsStream(): void {
    this.widgetssTransformados$ = combineLatest([this._widgetsService.widgets$, this._permisosService.actividadesAutorizadas$]).pipe(
      map(([wdgts, permisos]: [PTLWidgetMaestroModel[], string[]]) => {
        if (!wdgts || wdgts.length === 0) return [];

        return wdgts.map((wdgt: any) => {
          const newWdgt: any = { ...wdgt };

          newWdgt.nomInicial = newWdgt.inicial ? 'Por Defecto' : 'Seleccion';
          newWdgt.nomEstado = newWdgt.estadoWidget ? 'Activo' : 'Inactivo';
          newWdgt.nomCanal = canalDelWidget(newWdgt);
          newWdgt.capture = this._uploadService.getFilePath(this.suscriptor, 'widgets', newWdgt.imagenWidget_light);
          newWdgt.capture2 = this._uploadService.getFilePath(this.suscriptor, 'widgets', newWdgt.imagenWidget_dark);
          newWdgt.imagen = this.isDarkMode
            ? this._uploadService.getFilePath(this.suscriptor, 'widgets', newWdgt.imagenWidget_dark)
            : this._uploadService.getFilePath(this.suscriptor, 'widgets', newWdgt.imagenWidget_light);
          newWdgt.tipo = 'capture';

          const accionesPermitidas: any[] = [];

          if (permisos.includes('ACT_WDGT_MODIFICAR')) {
            accionesPermitidas.push({
              accion: 'MODIFICAR',
              letra: 'M',
              color: '#2a5dbd',
              tooltip: this.translate.instant('COMMON.EDIT_2')
            });
          }
          if (permisos.includes('ACT_WDGT_ELIMINAR')) {
            accionesPermitidas.push({
              accion: 'ELIMINAR',
              letra: 'R',
              color: '#dd1717',
              tooltip: this.translate.instant('UTILIDADES.WIDGETS.REMOVE_FROM_CATALOG')
            });
          }
          if (permisos.includes('ACT_WDGT_INACTIVAR')) {
            accionesPermitidas.push({
              accion: 'INACTIVAR',
              letra: newWdgt.estadoWidget ? 'I' : 'A',
              color: newWdgt.estadoWidget ? '#00ffdd' : '#3ca014',
              tooltip: this.translate.instant('COMMON.ACTIVATE_OR_DEACTIVATE')
            });
          }
          if (permisos.includes('ACT_WDGT_ROLES')) {
            accionesPermitidas.push({
              accion: 'ROLES',
              letra: 'R',
              color: '#c41dd3',
              tooltip: this.translate.instant('COMMON.ROLES')
            });
          }

          newWdgt._acciones = accionesPermitidas;

          return newWdgt as PTLWidgetMaestroModel;
        });
      }),
      tap((regs) => {
        this.widgets = regs;
        this.cdr.detectChanges();
      }),
      catchError((err) => {
        console.error('Error en el stream de widgets:', err);
        return of([]);
      })
    );

    this.widgetssFiltradas$ = combineLatest([
      this.widgetssTransformados$.pipe(startWith([])),
      this.filtroCodigoSubject,
      this.filtroNombreSubject,
      this.filtroColumnasSubject,
      this.filtroFilasSubject,
      this.filtroDescripcionSubject,
      this.filtroPestanaSubject,
      this.filtroEstadoSubject,
      this.filtroCanalSubject
    ]).pipe(
      map(([wdgts, codigo, nombre, columnas, filas, descripcion, pestana, estado, canal]) => {
        let filteredWidgets = wdgts;
        // Filtros de texto: contiene, sin distinguir mayúsculas (antes exigían el valor exacto).
        const contiene = (valor: any, texto: string) =>
          String(valor ?? '')
            .toLowerCase()
            .includes(texto.toLowerCase());

        if (codigo !== '') {
          filteredWidgets = filteredWidgets.filter((app) => contiene(app.codigoWidget, codigo));
        }

        if (nombre !== '') {
          filteredWidgets = filteredWidgets.filter((app) => contiene(app.nombreWidget, nombre));
        }

        if (columnas !== '') {
          filteredWidgets = filteredWidgets.filter((app) => app.defaultCols === Number(columnas));
        }

        if (filas !== '') {
          filteredWidgets = filteredWidgets.filter((app) => app.defaultRows === Number(filas));
        }

        if (estado !== '' && estado !== 'todos') {
          const estadoBoolean = estado === 'true';
          filteredWidgets = filteredWidgets.filter((app) => app.estadoWidget === estadoBoolean);
        }

        if (pestana !== '') {
          filteredWidgets = filteredWidgets.filter((app) => contiene(app.codigoPestana, pestana));
        }

        if (canal === 'web' || canal === 'telefono' || canal === 'ambos') {
          filteredWidgets = filteredWidgets.filter((app) => canalDelFormulario(app) === canal);
        }

        if (descripcion) {
          const textoFiltro = descripcion.toLowerCase();
          filteredWidgets = filteredWidgets.filter((app) => (app.descripcionWidget || '').toLowerCase().includes(textoFiltro));
        }

        return filteredWidgets;
      })
    );
  }

  onFiltroCodigoChangeClick(evento: any): void {
    const value = evento.target.value;
    this.filtroCodigoSubject.next(value);
  }

  onFiltroNombreChangeClick(evento: any): void {
    const value = evento.target.value;
    this.filtroNombreSubject.next(value);
  }

  onFiltroDescripcionChangeClick(evento: any): void {
    const value = evento.target.value;
    this.filtroDescripcionSubject.next(value);
  }

  onFiltroEstadoChangeClick(evento: any): void {
    const value = evento.target.value;
    this.filtroEstadoSubject.next(value);
  }

  onFiltroColumnasChangeClick(evento: any): void {
    const value = evento.target.value;
    this.filtroColumnasSubject.next(value);
  }

  onFiltroFilasChangeClick(evento: any): void {
    const value = evento.target.value;
    this.filtroFilasSubject.next(value);
  }

  onFiltroCanalChangeClick(evento: any): void {
    this.filtroCanalSubject.next(evento.target.value);
  }

  onFiltroPestanaChangeClick(evento: any): void {
    const value = evento.target.value;
    this.filtroPestanaSubject.next(value);
  }

  columnasRegistros: ColumnMetadata[] = [
    {
      name: 'imagen',
      header: 'COMMON.IMAGE',
      type: 'image',
      isSortable: false
    },
    {
      name: 'codigoWidget',
      header: 'COMMON.CODE',
      type: 'text'
    },
    {
      name: 'nombreWidget',
      header: 'COMMON.NAME',
      type: 'text'
    },
    {
      name: 'nomInicial',
      header: 'UTILIDADES.WIDGETS.INITIAL_LAYOUT',
      type: 'estado'
    },
    {
      name: 'nomCanal',
      header: 'UTILIDADES.WIDGETS.CHANNEL',
      type: 'text'
    },
    {
      name: 'nomEstado',
      header: 'COMMON.STATUS',
      type: 'estado'
    }
  ];

  columnasDetailRegistros: ColumnMetadata[] = [
    {
      name: 'descripcionWidget',
      header: 'COMMON.DESCRIPTION',
      type: 'text'
    },
    {
      name: 'defaultCols',
      header: 'UTILIDADES.WIDGETS.COLUMNS',
      type: 'text'
    },
    {
      name: 'defaultRows',
      header: 'UTILIDADES.WIDGETS.ROWS',
      type: 'text'
    },
    {
      name: 'pos_x',
      header: 'UTILIDADES.WIDGETS.X_POSITION',
      type: 'text'
    },
    {
      name: 'pos_y',
      header: 'UTILIDADES.WIDGETS.Y_POSITION',
      type: 'text'
    },
    {
      name: 'tipo',
      header: 'COMMON.TYPE',
      type: 'text'
    },
    {
      name: 'capture',
      header: 'UTILIDADES.WIDGETS.IMAGE_LIGHT_THEME',
      type: 'capture'
    },
    {
      name: 'capture2',
      header: 'UTILIDADES.WIDGETS.IMAGE_DARK_THEME',
      // 'capture2': la tabla pinta row.capture2 (la imagen oscura); con 'capture' repetía la clara (OT-015, CC-113)
      type: 'capture2'
    }
  ];

  OnNuevaWidgetClick(): void {
    this._localStorageService.setObject('regId', 'nuevo');
    this.router.navigate(['utilidades/gestion-widget']);
  }

  OnEditarWidgetClick(id: string): void {
    this._localStorageService.setObject('regId', id);
    this.router.navigate(['utilidades/gestion-widget']);
  }

  onAccionPrincipal(evento: { accion: string; row: any }) {
    const { accion, row } = evento;
    const id = row.codigoWidget || row.id;

    console.log(`Acción ejecutada: [${accion}] sobre el registro ID:`, id);

    switch (accion) {
      case 'MODIFICAR':
        console.log('modificar el widget', id);
        this._localStorageService.setObject('regId', id);
        this.router.navigate(['utilidades/gestion-widget']);
        break;
      case 'ELIMINAR':
        const value = id;
        console.log('eliminar el widget', value);
        Swal.fire({
          title: this.translate.instant('COMMON.REMOVE_WIDGET_FROM_CATALOG'),
          text: this.translate.instant('COMMON.WIDGET_BECOMES_INACTIVE_LEAVES_DASHBOARDS_USERS'),
          icon: 'warning',
          showCancelButton: true,
          confirmButtonText: this.translate.instant('UTILIDADES.WIDGETS.RETIRE'), // retira (inactiva), no borra (CC-114)
          cancelButtonText: this.translate.instant('COMMON.CANCEL')
        }).then((result) => {
          if (result.isConfirmed) {
            this._widgetsService.eliminarWidget(id).subscribe({
              next: (resp: any) => {
                const logData = {
                  codigoTipoLog: '',
                  codigoRespuesta: '201',
                  descripcionLog: this.translate.instant('COMMON.WIDGET_UPDATED')
                };
                this._logActividadesService.postCrearRegistro(logData).subscribe(() => console.log('log creado exitosamente'));
                Swal.fire(this.translate.instant('COMMON.WIDGET_UPDATED'), resp.mensaje, 'success');
                this.setupWidgetsStream();
              },
              error: () => {
                const logData = {
                  codigoTipoLog: '',
                  codigoRespuesta: '501',
                  descripcionLog: this.translate.instant('COMMON.WIDGET_COULD_NOT_BE_UPDATED')
                };
                this._logActividadesService.postCrearRegistro(logData).subscribe(() => console.log('log creado exitosamente'));
                Swal.fire(traducir('COMMON.ERROR'), this.translate.instant('COMMON.WIDGET_COULD_NOT_BE_UPDATED'), 'error');
              }
            });
          }
        });
        break;
      case 'INACTIVAR':
        console.log('inactivar usuario codigo', id);
        const widget = this.widgets.find((x) => x.codigoWidget === id);
        if (!widget) return;
        this._swalService
          .getAlertQuestionRequest(
            this.translate.instant('COMMON.ACTIVATE_OR_DEACTIVATE'),
            this.translate.instant('UTILIDADES.WIDGETS.CHANGE_WIDGETS_STATUS_IF_DEACTIVATED_IT'),
            this.translate.instant('COMMON.CHANGE_STATUS'),
            this.translate.instant('COMMON.CANCEL')
          )
          .subscribe((result) => {
            if (result) {
              // Registro completo: el API valida todos los campos obligatorios (antes faltaban tipo, pestaña,
              // aplicación, suite, posición y anclaje y el cambio de estado siempre fallaba).
              const widgt = {
                ...camposDelWidget(widget),
                estadoWidget: widget.estadoWidget == true ? false : true,
                codigoUsuarioModificacion: this._localStorageService.getCurrentUserLocalStorage().usuario.codigoUsuario,
                fechaModificacion: new Date().toISOString(),
                layoutVersion: Number(widget.layoutVersion) + 1
              };
              console.log('widget a inactivar', widgt);
              this._widgetsService.actualizarWidget(id, widgt).subscribe({
                next: (resp: any) => {
                  console.log('actualizado', resp);
                  const logData = {
                    codigoTipoLog: '',
                    codigoRespuesta: '201',
                    descripcionLog: this.translate.instant('COMMON.WIDGET_UPDATED') + ' ' + resp.mensaje
                  };
                  this._logActividadesService.postCrearRegistro(logData).subscribe(() => console.log('log creado exitosamente'));
                  // Éxito con su texto (antes mostraba «No se pudo actualizar el widget» aunque sí cambiaba; OT-015, CC-113)
                  this._swalService.getAlertSuccess(this.translate.instant('COMMON.WIDGET_UPDATED'));
                  this.setupWidgetsStream();
                },
                error: (err: any) => {
                  const logData = {
                    codigoTipoLog: '',
                    codigoRespuesta: '201',
                    descripcionLog: this.translate.instant('COMMON.WIDGET_COULD_NOT_BE_UPDATED') + ' ' + err.mensaje
                  };
                  this._logActividadesService.postCrearRegistro(logData).subscribe(() => console.log('log creado exitosamente'));
                  this._swalService.getAlertError(
                    this.translate.instant('COMMON.WIDGET_COULD_NOT_BE_UPDATED') + (err?.error?.msg ? ': ' + err.error.msg : '')
                  );
                  this.setupWidgetsStream();
                  console.error('Error eliminando', err);
                }
              });
            }
          });
        break;
      case 'ROLES':
        console.log('Redirigirse a la pagina de roles:', id);
        this._localStorageService.setObject('regId', id);
        this.router.navigate(['/utilidades/widgets-roles']);
        break;
      default:
        console.warn(`Acción no reconocida: ${accion}`);
        break;
    }
  }

  OnEliminarWidgetClick(id: string): void {
    console.log('id aplicacion', id);
    Swal.fire({
      title: this.translate.instant('COMMON.REMOVE_WIDGET_FROM_CATALOG'),
      text: this.translate.instant('COMMON.WIDGET_BECOMES_INACTIVE_LEAVES_DASHBOARDS_USERS'),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: this.translate.instant('UTILIDADES.WIDGETS.RETIRE'), // retira (inactiva), no borra (CC-114)
      cancelButtonText: this.translate.instant('COMMON.CANCEL')
    }).then((result) => {
      if (result.isConfirmed) {
        this._widgetsService.eliminarWidget(id).subscribe({
          next: (resp: any) => {
            const logData = {
              codigoTipoLog: '',
              codigoRespuesta: '201',
              descripcionLog: this.translate.instant('COMMON.WIDGET_UPDATED')
            };
            this._logActividadesService.postCrearRegistro(logData).subscribe(() => console.log('log creado exitosamente'));
            Swal.fire(this.translate.instant('COMMON.WIDGET_UPDATED'), resp.mensaje, 'success');
            this.setupWidgetsStream();
          },
          error: () => {
            const logData = {
              codigoTipoLog: '',
              codigoRespuesta: '501',
              descripcionLog: this.translate.instant('COMMON.WIDGET_COULD_NOT_BE_UPDATED')
            };
            this._logActividadesService.postCrearRegistro(logData).subscribe(() => console.log('log creado exitosamente'));
            Swal.fire(traducir('COMMON.ERROR'), this.translate.instant('COMMON.WIDGET_COULD_NOT_BE_UPDATED'), 'error');
          }
        });
      }
    });
  }

  mapeoColumnasExcel = {
    Cédula: 'identificacionUsuario',
    'Nombres Completos': 'nombreUsuario',
    'Correo Electrónico': 'emailUsuario',
    'Clave Temporal': 'claveUsuario'
  };

  datosAdicionales = {
    estadoUsuario: true,
    usuarioCreacion: 'admin-sistema'
  };

  toggleNav(): void {
    this.toggleSidebar.emit();
  }
}
