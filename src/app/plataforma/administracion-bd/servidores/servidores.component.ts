import { traducir } from '../../../theme/shared/i18n/traducir';
/* eslint-disable @typescript-eslint/no-explicit-any */
import { CommonModule } from '@angular/common';
import { Component, EventEmitter, OnInit, Output, ViewChild, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { DataTablesModule, DataTableDirective } from 'src/app/theme/shared/directive/datatable/datatable.module';
import { Subscription, tap, catchError, of, Observable } from 'rxjs';
import { GradientConfig } from 'src/app/app-config';
import { NavBarComponent } from 'src/app/theme/layout/admin/nav-bar/nav-bar.component';
import { NavContentComponent } from 'src/app/theme/layout/admin/navigation/nav-content/nav-content.component';
import { PTLServidorModel } from 'src/app/theme/shared/_helpers/models/PTLServidor.model';
import { NavigationService } from 'src/app/theme/shared/service/navigation.service';
import { PTLServidorService } from 'src/app/theme/shared/service/ptlservidor.service';
import { SharedModule } from 'src/app/theme/shared/shared.module';
import { DatatableComponent } from 'src/app/theme/shared/components/data-table/data-table.component';
import Swal from 'sweetalert2';
import { ColumnMetadata } from 'src/app/theme/shared/_helpers/models/ColumnMetadata.model';
import { LocalStorageService, PtllogActividadesService } from 'src/app/theme/shared/service';
import { NavigationItem } from 'src/app/theme/shared/_helpers/models/Navigation.model';
import { TableDataComponent } from 'src/app/theme/shared/components/table-data/table-data.component';

@Component({
  selector: 'app-servidores',
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
  templateUrl: './servidores.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './servidores.component.scss'
})
export class ServidoresComponent implements OnInit {
  @ViewChild(DataTableDirective, { static: false })
  @Output()
  toggleSidebar = new EventEmitter<void>();
  //#region VARIABLES
  registrosSub?: Subscription;
  registros: PTLServidorModel[] = [];
  registrosFiltrado: PTLServidorModel[] = [];
  lang: string = localStorage.getItem('lang') || '';
  tituloPagina: string = '';
  gradientConfig;
  hasFiltersSlot: boolean = false;
  menuItems$!: Observable<NavigationItem[]>;
  activeTab: 'menu' | 'filters' | 'main' = 'menu';
  datatableElement!: DataTableDirective;
  //#endregion VARIABLES

  constructor(
    private router: Router,
    private translate: TranslateService,
    private _servidorService: PTLServidorService,
    private _logActividadesService: PtllogActividadesService,
    private _localStorageService: LocalStorageService,
    private _navigationService: NavigationService
  ) {
    this.gradientConfig = GradientConfig;
  }

  ngOnInit() {
    this._navigationService.getNavigationItems();
    this.menuItems$ = this._navigationService.menuItems$;
    console.log('elementos menu componente', this.menuItems$);
    this.hasFiltersSlot = true;
    this.consultarRegistros();
  }

  consultarRegistros() {
    this.registrosSub = this._servidorService
      .getRegistros()
      .pipe(
        tap((resp: any) => {
          if (resp.ok) {
            resp.servidores.forEach((servidor: any) => {
              servidor.nomEstado = servidor.estadoServidor == true ? 'Activo' : 'Inactivo';
            });
            this.registros = resp.servidores;
            this.registrosFiltrado = resp.servidores;
            console.log('Todos las servidores', this.registros);
            return;
          }
        }),
        catchError((err) => {
          console.log('Ha ocurrido un error', err);
          return of(null);
        })
      )
      .subscribe();
  }

  columnasServidores: ColumnMetadata[] = [
    {
      name: 'nombreServidor',
      header: 'COMMON.SERVER',
      type: 'text'
    },
    {
      name: 'rutaServidor',
      header: 'COMMON.PATH',
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
      name: 'descripcionServidor',
      header: 'COMMON.DESCRIPTION',
      type: 'text'
    }
  ];

  OnNuevoRegistroClick() {
    this._localStorageService.setObject('regId', 'nuevo');
    this.router.navigate(['administracion-bd/gestion-servidor/']);
  }

  OnEditarRegistroClick(id: number) {
    this._localStorageService.setObject('regId', 'id');
    this.router.navigate(['administracion-bd/gestion-servidor/']);
  }

  OnEliminarRegistroClick(id: any) {
    Swal.fire({
      title: this.translate.instant('COMMON.ARE_YOU_SURE'),
      text: this.translate.instant('ADMINISTRACION_BD.SERVIDORES.WILL_DELETE_SERVER_YOU_WONT_BE'),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: this.translate.instant('COMMON.DELETE'),
      cancelButtonText: this.translate.instant('COMMON.CANCEL')
    }).then((result: any) => {
      if (result.isConfirmed) {
        this._servidorService.deleteEliminarRegistro(id.id).subscribe({
          next: (resp: any) => {
            const logData = {
              codigoTipoLog: '',
              codigoRespuesta: '201',
              descripcionLog: this.translate.instant('ADMINISTRACION_BD.SERVIDORES.SERVER_DELETED_SUCCESSFULLY') + ' ' + resp.mensaje
            };
            this._logActividadesService.postCrearRegistro(logData).subscribe(() => console.log('log creado exitosamente'));
            Swal.fire(this.translate.instant('ADMINISTRACION_BD.SERVIDORES.SERVER_DELETED_SUCCESSFULLY'), resp.mensaje, 'success');
            this.registros = this.registros.filter((s) => s.servidorId !== id.id);
          },
          error: (err: any) => {
            const logData = {
              codigoTipoLog: '',
              codigoRespuesta: '501',
              descripcionLog: this.translate.instant('ADMINISTRACION_BD.SERVIDORES.COULD_NOT_DELETE_SERVER') + ' ' + err.mensaje
            };
            this._logActividadesService.postCrearRegistro(logData).subscribe(() => console.log('log creado exitosamente'));
            Swal.fire(traducir('COMMON.ERROR'), this.translate.instant('ADMINISTRACION_BD.SERVIDORES.COULD_NOT_DELETE_SERVER'), 'error');
            console.error('Error eliminando', err);
          }
        });
      }
    });
  }

  onFiltroNombreChangeClick(evento: any) {
    console.log('filtrar el NOMBRE ', evento.target.value);
    const textoFiltro = evento.target.value.toLowerCase();
    if (!textoFiltro) {
      this.registrosFiltrado = [...this.registros];
    } else {
      this.registrosFiltrado = this.registrosFiltrado.filter((server) => (server.nombreServidor || '').toLowerCase().includes(textoFiltro));
      console.log('filtrados', this.registrosFiltrado);
    }
  }

  onFiltroDescripcionChangeClick(evento: any) {
    console.log('filtrar el descripcion ', evento.target.value);
    const textoFiltro = evento.target.value.toLowerCase();
    if (!textoFiltro) {
      this.registrosFiltrado = [...this.registros];
    } else {
      this.registrosFiltrado = this.registrosFiltrado.filter((server) =>
        (server.descripcionServidor || '').toLowerCase().includes(textoFiltro)
      );
      console.log('filtrados', this.registrosFiltrado);
    }
  }

  onFiltroEstadoChangeClick(evento: any) {
    console.log('filtrar el estado ', evento.target.value);
    if (evento.target.value == 'todos') {
      this.registrosFiltrado = this.registros;
    } else {
      const estado = evento.target.value == 'true' ? true : false;
      this.registrosFiltrado = this.registros.filter((x) => x.estadoServidor == estado);
    }
  }

  toggleNav(): void {
    this.toggleSidebar.emit();
  }
}
