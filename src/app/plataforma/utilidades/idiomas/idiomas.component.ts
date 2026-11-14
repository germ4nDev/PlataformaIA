/* eslint-disable @angular-eslint/use-lifecycle-interface */
/* eslint-disable @typescript-eslint/no-explicit-any */
//#region IMPORTS
import { Component, EventEmitter, OnDestroy, OnInit, Output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataTablesModule } from 'src/app/theme/shared/directive/datatable/datatable.module';
import { Router } from '@angular/router';
import { SharedModule } from 'src/app/theme/shared/shared.module';
import { TranslateModule } from '@ngx-translate/core';
import { TranslateService } from '@ngx-translate/core';
import { PTLUsuarioModel } from 'src/app/theme/shared/_helpers/models/PTLUsuario.model';
import { LanguageService } from 'src/app/theme/shared/service/lenguage.service';
import { BehaviorSubject, catchError, combineLatest, map, Observable, startWith, switchMap, tap } from 'rxjs';
import { NavBarComponent } from 'src/app/theme/layout/admin/nav-bar/nav-bar.component';
import { NavContentComponent } from 'src/app/theme/layout/admin/navigation/nav-content/nav-content.component';
import { NavigationService } from 'src/app/theme/shared/service/navigation.service';
import { of, Subscription } from 'rxjs';
import Swal from 'sweetalert2';
import { SwalAlertService } from '../../../theme/shared/service/swal-alert.service';
import { PtlSlidersInicioService } from 'src/app/theme/shared/service/ptlsliders-inicio.service';
import { ColumnMetadata } from 'src/app/theme/shared/_helpers/models/ColumnMetadata.model';
import { environment } from 'src/environments/environment';
import { NavigationItem } from 'src/app/theme/shared/_helpers/models/Navigation.model';
import { LocalStorageService, PtlidiomasService, UploadFilesService } from 'src/app/theme/shared/service';
import { PTLIdioma } from 'src/app/theme/shared/_helpers/models/PTLIdioma.model';
import { DataLoaderComponent } from 'src/app/theme/shared/components/data-loader/data-loader.component';
import { TableDataComponent } from 'src/app/theme/shared/components/table-data/table-data.component';

const base_url = environment.apiUrl;
//#endregion IMPORTS

@Component({
  selector: 'app-idiomas',
  imports: [
    CommonModule,
    DataTablesModule,
    SharedModule,
    TranslateModule,
    NavBarComponent,
    NavContentComponent,
    DataLoaderComponent,
    TableDataComponent
  ],
  templateUrl: './idiomas.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './idiomas.component.scss'
})
export class IdiomasComponent implements OnInit, OnDestroy {
  //#region VARIABLES
  @Output() toggleSidebar = new EventEmitter<void>();
  activeTab: 'menu' | 'filters' | 'main' = 'menu';
  menuItems!: Observable<NavigationItem[]>;
  registrosSub?: Subscription;
  registros: PTLIdioma[] = [];
  registrosFiltrado: PTLIdioma[] = [];
  lang: string = localStorage.getItem('lang') || '';
  tituloPagina: string = '';
  //#endregion VARIABLES
  hasFiltersSlot: boolean = false;

  suscPlataforma: string = '';
  subscriptions = new Subscription();

  filtroCodigoSubject = new BehaviorSubject<string>('todos');
  filtroNombreSubject = new BehaviorSubject<string>('todos');
  filtroEstadoSubject = new BehaviorSubject<string>('todos');

  idiomasTransformadas$: Observable<PTLIdioma[]> = of([]);
  idiomasFiltradas$: Observable<PTLIdioma[]> = of([]);
  idiomas: PTLIdioma[] = [];

  constructor(
    private router: Router,
    private translate: TranslateService,
    private _navigationService: NavigationService,
    private _swalService: SwalAlertService,
    private _registrosService: PtlidiomasService,
    private _languageService: LanguageService,
    private _localStorageService: LocalStorageService,
    private _uploadService: UploadFilesService
  ) {
    this.suscPlataforma = this._localStorageService.getSuscriptorPlataformaLocalStorage();
  }

  ngOnInit() {
    this._navigationService.getNavigationItems();
    this.menuItems = this._navigationService.menuItems$;
    console.log('elementos menu componente', this.menuItems);
    // this.consultarRegistros()
    this.hasFiltersSlot = true;
    this.consultarRegistros();
    this.setupRegistrosStream();
    this.subscriptions.add(
      this._registrosService.getRegistros().subscribe(
        () => console.log('Idiomas cargadas y guardadas en el servicio'),
        (err: any) => console.error('Error al cargar Idiomas:', err)
      )
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  consultarRegistros() {
    this.idiomas = this._languageService.getRegistrosActuales();
    this.registrosFiltrado = this.idiomas;
    console.log('registrosFiltrado', this.registrosFiltrado);
  }

  setupRegistrosStream(): void {
    // const suscriptor = this._localStorageService.getSuscriptorLocalStorage() ? this._localStorageService.getSuscriptorLocalStorage()  : {};
    // if (!suscriptor || !suscriptor.codigoSuscriptor) {
    //   console.error('Error: No se pudo obtener el suscriptor o su código. Operación de carga de registros abortada.');
    //   return;
    // }
    this.idiomasTransformadas$ = this._languageService.idiomas$.pipe(
      switchMap((idioms: PTLIdioma[]) => {
        if (!idioms) return of([]);
        const transformedIdiomas = idioms.map((idio: any) => {
          idio.nomEstado = idio.estadoIdioma ? 'Activo' : 'Inactivo';
          idio.capture = this._uploadService.getFilePath(this.suscPlataforma, 'idiomas', idio.flagIdioma);
          idio.tipo = 'capture';
          return idio as PTLIdioma;
        });
        this.idiomas = transformedIdiomas;
        console.log('todas las idiomas', transformedIdiomas);
        return of(transformedIdiomas);
      }),
      catchError((err) => {
        console.error('Error en el stream de idiomas:', err);
        return of([]);
      })
    );

    this.idiomasFiltradas$ = combineLatest([
      this.idiomasTransformadas$.pipe(startWith([])),
      this.filtroCodigoSubject,
      this.filtroNombreSubject,
      this.filtroEstadoSubject
    ]).pipe(
      map(([idioms, codigo, nombre, estado]) => {
        let filteredIdioms = idioms;

        if (codigo !== 'todos') {
          filteredIdioms = filteredIdioms.filter((idio) => idio.codigoIdioma === codigo);
        }

        if (nombre !== 'todos') {
          filteredIdioms = filteredIdioms.filter((idio) => idio.nombreIdioma === nombre);
        }

        if (estado !== 'todos') {
          const estadoBoolean = estado === 'true';
          filteredIdioms = filteredIdioms.filter((idio) => idio.estadoIdioma === estadoBoolean);
        }

        console.log('**************data de los idiomas', filteredIdioms);

        return filteredIdioms;
      })
    );
  }

  columnasRegistros: ColumnMetadata[] = [
    {
      name: 'capture',
      header: 'COMMON.FLAG',
      type: 'image'
    },
    {
      name: 'nombreIdioma',
      header: 'COMMON.NAME',
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
      name: 'codigoIdioma',
      header: 'COMMON.CODE',
      type: 'text'
    },
    {
      name: 'capture',
      header: 'COMMON.FLAG',
      type: 'capture'
    }
  ];

  onFiltroCodigoChangeClick(evento: any): void {
    const value = evento.target.value;
    this.filtroCodigoSubject.next(value);
  }

  onFiltroNombreChangeClick(evento: any): void {
    const value = evento.target.value;
    this.filtroNombreSubject.next(value);
  }

  onFiltroEstadoChangeClick(evento: any): void {
    const value = evento.target.value;
    this.filtroEstadoSubject.next(value);
  }

  getEstado(estado: boolean): string {
    return estado ? 'Activo' : 'Inactivo';
  }

  OnNuevoRegistroClick() {
    this._localStorageService.setObject('regId', 'nuevo');
    this.router.navigate(['utilidades/gestion-idioma']);
  }

  OnEditarRegistroClick(id: string) {
    this._localStorageService.setObject('regId', id);
    this.router.navigate(['utilidades/gestion-idioma']);
  }

  OnEliminarRegistroClick(id: string) {
    const idioma = this.registrosFiltrado.filter((x) => x.codigoIdioma == id)[0];
    Swal.fire({
      title: this.translate.instant('COMMON.ARE_YOU_SURE_YOU_WANT_DELETE'),
      text: `this.translate.instant('UTILIDADES.USER_WILL_BE_DELETED') + "${idioma.nombreIdioma}".`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: this.translate.instant('COMMON.DELETE'),
      cancelButtonText: this.translate.instant('COMMON.CANCEL')
    }).then((result: any) => {
      if (result.isConfirmed) {
        this._registrosService.deleteEliminarRegistro(id).subscribe({
          next: (resp: any) => {
            this._swalService.getAlertSuccess(
              this.translate.instant('UTILIDADES.IDIOMAS.LANGUAGE_DELETED_SUCCESSFULLY') + ', ' + resp.mensaje
            );
            const objUpload = {
              susc: this.suscPlataforma,
              tipo: 'idiomas',
              file: idioma.flagIdioma
            };
            console.log('borrar imagen', objUpload);
            this._uploadService.deleteFilePath(objUpload).subscribe(() => console.log('imagen eliminada correctamente'));
            this.setupRegistrosStream();
          },
          error: (err: any) => {
            this._swalService.getAlertError(this.translate.instant('UTILIDADES.IDIOMAS.COULD_NOT_DELETE_LANGUAGE') + ', ' + err);
            console.error('Error eliminando', err);
          }
        });
      }
    });
  }

  toggleNav(): void {
    this.toggleSidebar.emit();
  }
}
