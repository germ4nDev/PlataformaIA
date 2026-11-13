import { traducir } from '../../../theme/shared/i18n/traducir';
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Component, EventEmitter, OnInit, Output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataTablesModule } from 'src/app/theme/shared/directive/datatable/datatable.module';
import { Router } from '@angular/router';
import { SharedModule } from 'src/app/theme/shared/shared.module';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Observable, Subscription, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { GradientConfig } from 'src/app/app-config';

import { NavContentComponent } from 'src/app/theme/layout/admin/navigation/nav-content/nav-content.component';
import { NavBarComponent } from '../../../theme/layout/admin/nav-bar/nav-bar.component';
import { DatatableComponent } from 'src/app/theme/shared/components/data-table/data-table.component';
import { NavigationService } from 'src/app/theme/shared/service/navigation.service';

import Swal from 'sweetalert2';
import { PTLAplicacionModel } from 'src/app/theme/shared/_helpers/models/PTLAplicacion.model';
import { PtlAplicacionesService } from 'src/app/theme/shared/service/ptlaplicaciones.service';
import { PTLVersionAP } from 'src/app/theme/shared/_helpers/models/PTLVersionAP.model';
import { PtlversionesApService } from 'src/app/theme/shared/service/ptlversiones-ap.service';
import { LocalStorageService } from 'src/app/theme/shared/service/local-storage.service';
import { ColumnMetadata } from 'src/app/theme/shared/_helpers/models/ColumnMetadata.model';
import { PtllogActividadesService } from 'src/app/theme/shared/service';
import { NavigationItem } from 'src/app/theme/shared/_helpers/models/Navigation.model';
import { TableDataComponent } from 'src/app/theme/shared/components/table-data/table-data.component';

@Component({
  selector: 'app-versiones',
  imports: [
    CommonModule,
    DataTablesModule,
    SharedModule,
    TranslateModule,
    NavBarComponent,
    NavContentComponent,
    DatatableComponent,
    TableDataComponent
  ],
  templateUrl: './versiones.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './versiones.component.scss'
})
export class VersionesComponent implements OnInit {
  @Output() toggleSidebar = new EventEmitter<void>();
  aplicaciones: PTLAplicacionModel[] = [];
  registros: PTLVersionAP[] = [];
  registrosFiltrado: PTLVersionAP[] = [];
  moduloTituloExcel: string = '';
  filtroPersonalizado: string = '';
  hasFiltersSlot: boolean = false;
  aplicacionesSub?: Subscription;
  registrosSub?: Subscription;
  gradientConfig;
  lang = localStorage.getItem('lang');
  menuItems$!: Observable<NavigationItem[]>;
  activeTab: 'menu' | 'filters' | 'main' = 'menu';

  constructor(
    private router: Router,
    private translate: TranslateService,
    private _navigationService: NavigationService,
    private _aplicacionesService: PtlAplicacionesService,
    private _logActividadesService: PtllogActividadesService,
    private _localStorageService: LocalStorageService,
    private _registrosService: PtlversionesApService
  ) {
    this.gradientConfig = GradientConfig;
  }

  ngOnInit(): void {
    this._navigationService.getNavigationItems();
    this.menuItems$ = this._navigationService.menuItems$;
    this.hasFiltersSlot = true;
    this.moduloTituloExcel = this.lang == 'es' ? 'Listado de Suitees' : 'List of Aplications';
    this.consultarAplicacines();
  }

  consultarAplicacines() {
    this.aplicacionesSub = this._aplicacionesService
      .getAplicaciones()
      .pipe(
        tap((resp: any) => {
          if (resp.ok) {
            this.aplicaciones = resp.aplicaciones;
            this.consultarRegistros();
          }
        }),
        catchError((err) => {
          console.error(err);
          return of([]);
        })
      )
      .subscribe();
  }

  consultarRegistros(): void {
    this.registrosSub = this._registrosService
      .getRegistros()
      .pipe(
        tap((resp: any) => {
          if (resp.ok) {
            resp.versiones.forEach((reg: any) => {
              reg.nomEstado = reg.estadoVersion ? 'Activo' : 'Inactivo';
              const app = this.aplicaciones.filter((x) => x.codigoAplicacion == reg.codigoAplicacion)[0] || '';
              reg.nomAplicacion = app.nombreAplicacion;
              const fechaVersion = new Date(reg.fechaVersion);
              console.log('fecha version', fechaVersion);
              const year = fechaVersion.getUTCFullYear(); // Obtiene el año UTC
              const month = fechaVersion.getUTCMonth() + 1; // Obtiene el mes UTC (0-indexado) + 1
              const day = fechaVersion.getUTCDate();
              reg.fechaVersion = year + '-' + month + '-' + day;
            });
            this.registros = resp.versiones;
            this.registrosFiltrado = resp.versiones;
          }
        }),
        catchError((err) => {
          console.error(err);
          return of([]);
        })
      )
      .subscribe();
  }

  columnasRegistros: ColumnMetadata[] = [
    {
      name: 'nomAplicacion',
      header: 'COMMON.APPLICATION',
      type: 'text'
    },
    {
      name: 'fechaVersion',
      header: 'COMMON.DATE',
      type: 'date'
    },
    {
      name: 'version',
      header: 'COMMON.VERSION',
      type: 'text'
    },
    {
      name: 'nombreVersion',
      header: 'COMMON.NAME',
      type: 'text'
    },
    {
      name: 'nomEstado',
      header: 'COMMON.STATUS',
      type: 'text'
    }
  ];

  columnasDetailRegistros: ColumnMetadata[] = [
    {
      name: 'codigoVersion',
      header: 'COMMON.CODE',
      type: 'text'
    },
    {
      name: 'descripcionVersion',
      header: 'COMMON.DESCRIPTION',
      type: 'text'
    }
  ];

  getLanguageUrl(): string {
    return this._localStorageService.getLanguageUrl();
  }

  onFiltroCodigoAplicacionChangeClick(evento: any) {
    console.log('filtrar el codigo ', evento.target.value);
    if (evento.target.value == 'todos') {
      this.registrosFiltrado = this.registros;
    } else {
      this.registrosFiltrado = this.registrosFiltrado.filter((x) => (x.codigoAplicacion = evento.target.value));
    }
  }

  onFiltroNombreChangeClick(evento: any) {
    console.log('filtrar el nombre ', evento.target.value);
    if (evento.target.value == 'todos') {
      this.registrosFiltrado = this.registros;
    } else {
      this.registrosFiltrado = this.registrosFiltrado.filter((x) => (x.nombreVersion = evento.target.value));
    }
  }

  onFiltroDescripcionChangeClick(evento: any) {
    console.log('filtrar el descripcion ', evento.target.value);
    const textoFiltro = evento.target.value.toLowerCase();
    if (!textoFiltro) {
      this.registrosFiltrado = [...this.registros];
    } else {
      this.registrosFiltrado = this.registrosFiltrado.filter((app) => (app.descripcionVersion || '').toLowerCase().includes(textoFiltro));
      console.log('filtrados', this.registrosFiltrado);
    }
  }

  onFiltroEstadoChangeClick(evento: any) {
    console.log('filtrar el estado ', evento.target.value);
    // const estado: boolean = evento.target.value || true;
    if (evento.target.value == 'todos') {
      this.registrosFiltrado = this.registros;
    } else {
      const estado = evento.target.value == 'true' ? true : false;
      console.log('Suitees', this.registrosFiltrado);
      this.registrosFiltrado = this.registros.filter((x) => x.estadoVersion == estado);
    }
  }

  OnNuevoRegistroClick(): void {
    this._localStorageService.setObject('regId', 'nuevo');
    this.router.navigate(['aplicaciones/gestion-version']);
  }

  OnEditarRegistroClick(id: number): void {
    console.log('regId', id);
    this._localStorageService.setObject('regId', id);
    this.router.navigate(['aplicaciones/gestion-version']);
  }

  OnEliminarRegistroClick(id: any): void {
    Swal.fire({
      title: this.translate.instant('COMMON.ARE_YOU_SURE'),
      text: this.translate.instant('APLICACIONES.VERSIONES.WILL_DELETE_VERSION_YOU_WONT_BE'),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: this.translate.instant('COMMON.DELETE'),
      cancelButtonText: this.translate.instant('COMMON.CANCEL')
    }).then((result) => {
      if (result.isConfirmed) {
        this._registrosService.deleteEliminarRegistro(id.id).subscribe({
          next: (resp: any) => {
            const logData = {
              codigoTipoLog: '',
              codigoRespuesta: '201',
              descripcionLog: this.translate.instant('APLICACIONES.VERSIONES.VERSION_DELETED_SUCCESSFULLY') + ' ' + resp.mensaje
            };
            this._logActividadesService.postCrearRegistro(logData).subscribe(() => console.log('log creado exitosamente'));
            Swal.fire(this.translate.instant('APLICACIONES.VERSIONES.VERSION_DELETED_SUCCESSFULLY'), resp.mensaje, 'success');
            this.registros = this.registros.filter((a) => a.versionId !== id.id);
            this.consultarRegistros();
          },
          error: (err) => {
            const logData = {
              codigoTipoLog: '',
              codigoRespuesta: '501',
              descripcionLog: this.translate.instant('APLICACIONES.VERSIONES.COULD_NOT_DELETE_VERSION') + ' ' + err.mensaje
            };
            this._logActividadesService.postCrearRegistro(logData).subscribe(() => console.log('log creado exitosamente'));
            Swal.fire(traducir('COMMON.ERROR'), this.translate.instant('APLICACIONES.VERSIONES.COULD_NOT_DELETE_VERSION'), 'error');
          }
        });
      }
    });
  }

  toggleNav(): void {
    this.toggleSidebar.emit();
  }
}
