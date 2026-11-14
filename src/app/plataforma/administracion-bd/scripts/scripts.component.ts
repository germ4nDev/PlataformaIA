import { traducir } from '../../../theme/shared/i18n/traducir';
/* eslint-disable @typescript-eslint/no-explicit-any */
import { CommonModule } from '@angular/common';
import { Component, EventEmitter, OnInit, Output, ViewChild, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { DataTablesModule, DataTableDirective } from 'src/app/theme/shared/directive/datatable/datatable.module';
import { Subscription, tap, catchError, of, Observable } from 'rxjs';
import { GradientConfig } from 'src/app/app-config';

// Componentes de Layout
import { NavBarComponent } from 'src/app/theme/layout/admin/nav-bar/nav-bar.component';
import { NavContentComponent } from 'src/app/theme/layout/admin/navigation/nav-content/nav-content.component';
import { SharedModule } from 'src/app/theme/shared/shared.module';

// Modelos y Servicios
import { NavigationItem } from 'src/app/theme/shared/_helpers/models/Navigation.model';
import { ColumnMetadata } from 'src/app/theme/shared/_helpers/models/ColumnMetadata.model';
import { PTLScriptsModel } from 'src/app/theme/shared/_helpers/models/PTLScripts.model';
import { NavigationService } from 'src/app/theme/shared/service/navigation.service';
import { PTLScriptsService } from 'src/app/theme/shared/service/ptlscripts.service';
import { LocalStorageService, PtllogActividadesService } from 'src/app/theme/shared/service';

import Swal from 'sweetalert2';
import { TableDataComponent } from 'src/app/theme/shared/components/table-data/table-data.component';

@Component({
  selector: 'app-scripts',
  imports: [
    CommonModule,
    DataTablesModule,
    SharedModule,
    TranslateModule,
    NavBarComponent,
    NavContentComponent,
    TableDataComponent
  ],
  templateUrl: './scripts.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './scripts.component.scss'
})
export class ScriptsComponent implements OnInit {
  @ViewChild(DataTableDirective, { static: false })
  @Output()
  toggleSidebar = new EventEmitter<void>();

  //#region VARIABLES
  registrosSub?: Subscription;
  registros: PTLScriptsModel[] = [];
  registrosFiltrado: PTLScriptsModel[] = [];
  lang: string = localStorage.getItem('lang') || '';
  tituloPagina: string = '';
  gradientConfig;
  hasFiltersSlot: boolean = false;
  menuItems$!: Observable<NavigationItem[]>;
  activeTab: 'menu' | 'filters' | 'main' = 'menu';
  datatableElement!: DataTableDirective;

  constructor(
    private router: Router,
    private translate: TranslateService,
    private _scriptsService: PTLScriptsService,
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
    this.registrosSub = this._scriptsService
      .getRegistros()
      .pipe(
        tap((resp: any) => {
          if (resp.ok) {
            resp.scripts.forEach((script: any) => {
              script.nomEstado = script.estadoScript == true ? 'Activo' : 'Inactivo';
            });
            this.registros = resp.scripts;
            this.registrosFiltrado = resp.scripts;
            console.log('Todos los scripts', this.registros);
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

  columnasScripts: ColumnMetadata[] = [
    {
      name: 'codigoScript',
      header: 'COMMON.CODE',
      type: 'text'
    },
    {
      name: 'nombreScript',
      header: 'COMMON.NAME',
      type: 'text'
    },
    {
      name: 'codigoAplicacion',
      header: 'COMMON.APPLICATION',
      type: 'text'
    },
    {
      name: 'codigoTipo',
      header: 'ADMINISTRACION_BD.SCRIPTS.SCRIPT_TYPE',
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
      name: 'descripcionScript',
      header: 'COMMON.DESCRIPTION',
      type: 'text'
    }
  ];

  OnNuevoRegistroClick() {
    this._localStorageService.setObject('regId', 'nuevo');
    this.router.navigate(['/administracion-bd/gestion-script']);
  }

  OnEditarRegistroClick(id: any) {
    this._localStorageService.setObject('regId', id);
    this.router.navigate(['/administracion-bd/gestion-script']);
  }

  OnEliminarRegistroClick(evento: any) {
    const id = typeof evento === 'string' ? evento : evento?.codigoScript || evento?.id;
    Swal.fire({
      title: this.translate.instant('ADMINISTRACION_BD.SCRIPTS.ARE_YOU_SURE'),
      text: this.translate.instant('ADMINISTRACION_BD.SCRIPTS.ACTION_WILL_PERMANENTLY_DELETE_SCRIPT_YOU'),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: this.translate.instant('COMMON.DELETE'),
      cancelButtonText: this.translate.instant('COMMON.CANCEL')
    }).then((result: any) => {
      if (result.isConfirmed) {
        this._scriptsService.deleteEliminarRegistro(id).subscribe({
          next: (resp: any) => {
            const logData = {
              codigoTipoLog: '',
              codigoRespuesta: '201',
              descripcionLog: this.translate.instant('ADMINISTRACION_BD.SCRIPTS.SCRIPT_HAS_BEEN_SUCCESSFULLY_DELETED') + ' ' + resp.mensaje
            };
            this._logActividadesService.postCrearRegistro(logData).subscribe(() => console.log('log creado exitosamente'));
            Swal.fire(this.translate.instant('ADMINISTRACION_BD.SCRIPTS.SCRIPT_HAS_BEEN_SUCCESSFULLY_DELETED'), resp.mensaje, 'success');

            // Refresca la grilla localmente
            this.registros = this.registros.filter((s) => s.codigoScript !== id);
            this.registrosFiltrado = this.registrosFiltrado.filter((s) => s.codigoScript !== id);
          },
          error: (err: any) => {
            const logData = {
              codigoTipoLog: '',
              codigoRespuesta: '501',
              descripcionLog:
                this.translate.instant('ADMINISTRACION_BD.SCRIPTS.ERROR_OCCURRED_WHILE_TRYING_DELETE_SCRIPT') + ' ' + err.mensaje
            };
            this._logActividadesService.postCrearRegistro(logData).subscribe(() => console.log('log creado exitosamente'));
            Swal.fire(
              traducir('COMMON.ERROR'),
              this.translate.instant('ADMINISTRACION_BD.SCRIPTS.ERROR_OCCURRED_WHILE_TRYING_DELETE_SCRIPT'),
              'error'
            );
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
      this.registrosFiltrado = this.registros.filter((script) => (script.nombreScript || '').toLowerCase().includes(textoFiltro));
    }
  }

  onFiltroDescripcionChangeClick(evento: any) {
    console.log('filtrar la descripcion ', evento.target.value);
    const textoFiltro = evento.target.value.toLowerCase();
    if (!textoFiltro) {
      this.registrosFiltrado = [...this.registros];
    } else {
      this.registrosFiltrado = this.registros.filter((script) => (script.descripcionScript || '').toLowerCase().includes(textoFiltro));
    }
  }

  onFiltroEstadoChangeClick(evento: any) {
    console.log('filtrar el estado ', evento.target.value);
    if (evento.target.value == 'todos') {
      this.registrosFiltrado = this.registros;
    } else {
      const estado = evento.target.value == 'true' ? true : false;
      this.registrosFiltrado = this.registros.filter((x) => x.estadoScript == estado);
    }
  }

  toggleNav(): void {
    this.toggleSidebar.emit();
  }
}
