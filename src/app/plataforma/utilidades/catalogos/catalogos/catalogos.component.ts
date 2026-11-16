/*
    Author: German Valencia
    Pattern: PLATAFORMA Componente - Utilidades › Catálogos (CC-204; patrón de los módulos de administración, regla 19)
    Description: una sola pantalla para los catálogos simples (regla 10): el catálogo sale de la ruta (/utilidades/catalogos/<clave>) y se
    cambia con el filtro «Catálogo». Columnas, permisos y campos los da la definición (catalogos-nucleo.ts). Retirar = inactivar en los
    catálogos con estado; los estados se eliminan. El API no deja retirar lo que otras tablas usan y lo dice. Se refresca solo con el
    socket catalogos-actualizados.
*/
import { Component, EventEmitter, OnDestroy, OnInit, Output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { BehaviorSubject, Observable, Subscription, combineLatest, map, of } from 'rxjs';
import Swal from 'sweetalert2';
import { SharedModule } from 'src/app/theme/shared/shared.module';
import { NavBarComponent } from 'src/app/theme/layout/admin/nav-bar/nav-bar.component';
import { NavContentComponent } from 'src/app/theme/layout/admin/navigation/nav-content/nav-content.component';
import { NavigationService } from 'src/app/theme/shared/service/navigation.service';
import { NavigationItem } from 'src/app/theme/shared/_helpers/models/Navigation.model';
import { ColumnMetadata } from 'src/app/theme/shared/_helpers/models/ColumnMetadata.model';
import { DataLoaderComponent } from 'src/app/theme/shared/components/data-loader/data-loader.component';
import { TableDataComponent } from 'src/app/theme/shared/components/table-data/table-data.component';
import { SwalAlertService } from 'src/app/theme/shared/service/swal-alert.service';
import { SocketManagerService } from 'src/app/theme/shared/service/socket-manager.service';
import { PtlCatalogosService } from 'src/app/theme/shared/service/ptlcatalogos.service';
import { traducir } from 'src/app/theme/shared/i18n/traducir';
import { CATALOGOS, DefCatalogo, activo, catalogo, filtrar } from '../catalogos-nucleo';

@Component({
  selector: 'app-catalogos',
  imports: [CommonModule, SharedModule, TranslateModule, NavBarComponent, NavContentComponent, DataLoaderComponent, TableDataComponent],
  templateUrl: './catalogos.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './catalogos.component.scss'
})
export class CatalogosComponent implements OnInit, OnDestroy {
  @Output() toggleSidebar = new EventEmitter<void>();
  activeTab: 'menu' | 'filters' = 'menu';
  menuItems!: Observable<NavigationItem[]>;
  cargando = true;
  readonly catalogos = CATALOGOS;
  def: DefCatalogo = CATALOGOS[0];
  columnas: ColumnMetadata[] = [];
  metadataDetalle: ColumnMetadata[] = [];

  private readonly filas$ = new BehaviorSubject<any[]>([]);
  readonly filtroEstado$ = new BehaviorSubject<string>('todos');
  readonly filtroTexto$ = new BehaviorSubject<string>('');
  filtrados$: Observable<any[]> = of([]);
  private subs: Subscription[] = [];

  constructor(
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly translate: TranslateService,
    private readonly navegacion: NavigationService,
    private readonly avisos: SwalAlertService,
    private readonly sockets: SocketManagerService,
    private readonly servicio: PtlCatalogosService
  ) {}

  ngOnInit(): void {
    this.navegacion.getNavigationItems();
    this.menuItems = this.navegacion.menuItems$;
    this.filtrados$ = combineLatest([this.filas$, this.filtroEstado$, this.filtroTexto$]).pipe(
      map(([lista, estado, texto]) =>
        filtrar(this.def, lista, { estado, texto }).map((x) => ({
          ...x,
          nomEstado: activo(this.def, x) ? traducir('COMMON.ACTIVE') : traducir('COMMON.INACTIVE')
        }))
      )
    );
    this.subs.push(
      this.route.paramMap.subscribe((p) => {
        const d = catalogo(p.get('catalogo'));
        if (!d) {
          this.router.navigate(['utilidades/catalogos', CATALOGOS[0].clave]);
          return;
        }
        this.usar(d);
      }),
      this.sockets.catalogosActualizados$.subscribe((e) => {
        if (!e?.catalogo || e.catalogo === this.def.clave) this.cargar();
      })
    );
  }

  ngOnDestroy(): void {
    this.subs.forEach((s) => s.unsubscribe());
  }

  private usar(d: DefCatalogo): void {
    this.def = d;
    this.columnas = [
      ...d.campos.filter((c) => c.enLista).map((c) => ({ name: c.nombre, header: c.etiqueta, type: 'text' }) as ColumnMetadata),
      ...(d.estado ? [{ name: 'nomEstado', header: 'COMMON.STATUS', type: 'text' } as ColumnMetadata] : [])
    ];
    this.metadataDetalle = d.campos.filter((c) => !c.enLista).map((c) => ({ name: c.nombre, header: c.etiqueta, type: 'text' }) as ColumnMetadata);
    this.filas$.next([]);
    this.filtroEstado$.next('todos');
    this.cargar();
  }

  cargar(): void {
    const d = this.def;
    this.cargando = this.filas$.value.length === 0;
    this.servicio.listar(d).subscribe({
      next: (l) => {
        if (d !== this.def) return;
        this.filas$.next(l);
        this.cargando = false;
      },
      error: () => {
        this.cargando = false;
        this.avisos.getAlertError(traducir('UTILIDADES.CATALOGOS.COULD_NOT_LOAD_CATALOG'));
      }
    });
  }

  alCambiarCatalogo(e: any): void {
    this.router.navigate(['utilidades/catalogos', e.target.value]);
  }
  alFiltrarEstado(e: any): void {
    this.filtroEstado$.next(e.target.value);
  }
  alFiltrarTexto(e: any): void {
    this.filtroTexto$.next(e.target.value || '');
  }

  nuevo(): void {
    this.router.navigate(['utilidades/gestion-catalogo', this.def.clave]);
  }
  editar(id: any): void {
    this.router.navigate(['utilidades/gestion-catalogo', this.def.clave], { queryParams: { id } });
  }

  retirar(id: any): void {
    const d = this.def;
    Swal.fire({
      title: this.translate.instant(d.estado ? 'UTILIDADES.CATALOGOS.DEACTIVATE_RECORD' : 'UTILIDADES.CATALOGOS.DELETE_RECORD'),
      text: this.translate.instant('UTILIDADES.CATALOGOS.NOT_POSSIBLE_IF_OTHER_TABLES_USE'),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: this.translate.instant('COMMON.YES'),
      cancelButtonText: this.translate.instant('COMMON.CANCEL')
    }).then((r) => {
      if (!r.isConfirmed) return;
      this.servicio.eliminar(d, String(id)).subscribe({
        next: () => {
          this.avisos.getAlertConfirmSuccess(traducir(d.estado ? 'UTILIDADES.CATALOGOS.RECORD_DEACTIVATED' : 'UTILIDADES.CATALOGOS.RECORD_DELETED'));
          this.cargar();
        },
        error: (e) => this.avisos.getAlertError(e?.error?.msg || traducir('UTILIDADES.CATALOGOS.COULD_NOT_COMPLETE_ACTION'))
      });
    });
  }

  toggleNav(): void {
    this.toggleSidebar.emit();
  }
}
