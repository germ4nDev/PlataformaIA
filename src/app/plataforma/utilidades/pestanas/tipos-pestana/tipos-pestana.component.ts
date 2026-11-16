/*
    Author: German Valencia
    Pattern: PLATAFORMA Componente - Utilidades › Tipos de pestaña (CC-203; patrón de los módulos de administración, regla 19)
    Description: catálogo de tipos de pestaña (PTL_TiposPestana) y su estrategia del motor de tableros. Una estrategia por tipo; un
    tipo con pestañas activas no se inactiva (el API lo impide y lo dice). Se refresca solo con el socket tipos-pestanas-actualizados.
*/
import { Component, EventEmitter, OnDestroy, OnInit, Output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
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
import { PtlPestanasAdminService } from 'src/app/theme/shared/service/ptlpestanas-admin.service';
import { traducir } from 'src/app/theme/shared/i18n/traducir';
import { TipoPestana } from '../nucleo';

@Component({
  selector: 'app-tipos-pestana',
  imports: [CommonModule, SharedModule, TranslateModule, NavBarComponent, NavContentComponent, DataLoaderComponent, TableDataComponent],
  templateUrl: './tipos-pestana.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './tipos-pestana.component.scss'
})
export class TiposPestanaComponent implements OnInit, OnDestroy {
  @Output() toggleSidebar = new EventEmitter<void>();
  activeTab: 'menu' | 'filters' = 'menu';
  menuItems!: Observable<NavigationItem[]>;
  cargando = true;

  readonly columnas: ColumnMetadata[] = [
    { name: 'codigoTipo', header: 'COMMON.CODE', type: 'text' },
    { name: 'estrategia', header: 'UTILIDADES.PESTANAS.STRATEGY', type: 'text' },
    { name: 'nomEstado', header: 'COMMON.STATUS', type: 'text' }
  ];
  readonly metadataDetalle: ColumnMetadata[] = [{ name: 'descripcion', header: 'COMMON.DESCRIPTION', type: 'text' }];

  private readonly tipos$ = new BehaviorSubject<TipoPestana[]>([]);
  readonly filtroEstado$ = new BehaviorSubject<string>('todos');
  readonly filtroTexto$ = new BehaviorSubject<string>('');
  filtrados$: Observable<any[]> = of([]);
  private socket?: Subscription;

  constructor(
    private readonly router: Router,
    private readonly translate: TranslateService,
    private readonly navegacion: NavigationService,
    private readonly avisos: SwalAlertService,
    private readonly sockets: SocketManagerService,
    private readonly pestanas: PtlPestanasAdminService
  ) {}

  ngOnInit(): void {
    this.navegacion.getNavigationItems();
    this.menuItems = this.navegacion.menuItems$;
    this.filtrados$ = combineLatest([this.tipos$, this.filtroEstado$, this.filtroTexto$]).pipe(
      map(([lista, estado, texto]) => {
        const t = texto.trim().toLowerCase();
        return lista
          .map((x) => ({ ...x, nomEstado: x.estado ? traducir('COMMON.ACTIVE') : traducir('COMMON.INACTIVE') }))
          .filter((x) => estado === 'todos' || (estado === 'activos') === x.estado)
          .filter((x) => !t || `${x.codigoTipo} ${x.estrategia} ${x.descripcion || ''}`.toLowerCase().includes(t));
      })
    );
    this.socket = this.sockets.tiposPestanasActualizados$.subscribe(() => this.cargar());
    this.cargar();
  }

  ngOnDestroy(): void {
    this.socket?.unsubscribe();
  }

  cargar(): void {
    this.cargando = this.tipos$.value.length === 0;
    this.pestanas.listarTipos().subscribe({
      next: (l) => {
        this.tipos$.next(l);
        this.cargando = false;
      },
      error: () => {
        this.cargando = false;
        this.avisos.getAlertError(traducir('UTILIDADES.PESTANAS.TIPOS_PESTANA.COULD_NOT_GET_TAB_TYPES'));
      }
    });
  }

  alFiltrarEstado(e: any): void {
    this.filtroEstado$.next(e.target.value);
  }
  alFiltrarTexto(e: any): void {
    this.filtroTexto$.next(e.target.value || '');
  }

  nuevo(): void {
    this.router.navigate(['utilidades/gestion-tipo-pestana']);
  }
  editar(codigo: string): void {
    this.router.navigate(['utilidades/gestion-tipo-pestana'], { queryParams: { tipo: codigo } });
  }

  inactivar(codigo: string): void {
    Swal.fire({
      title: this.translate.instant('UTILIDADES.PESTANAS.TIPOS_PESTANA.DEACTIVATE_TAB_TYPE'),
      text: this.translate.instant('UTILIDADES.PESTANAS.TIPOS_PESTANA.TYPE_IN_USE_CANNOT_BE_DEACTIVATED'),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: this.translate.instant('COMMON.YES'),
      cancelButtonText: this.translate.instant('COMMON.CANCEL')
    }).then((r) => {
      if (!r.isConfirmed) return;
      this.pestanas.inactivarTipo(codigo).subscribe({
        next: () => {
          this.avisos.getAlertConfirmSuccess(traducir('UTILIDADES.PESTANAS.TIPOS_PESTANA.TAB_TYPE_DEACTIVATED'));
          this.cargar();
        },
        error: (e) => this.avisos.getAlertError(e?.error?.msg || traducir('UTILIDADES.PESTANAS.TIPOS_PESTANA.COULD_NOT_DEACTIVATE_TAB_TYPE'))
      });
    });
  }

  toggleNav(): void {
    this.toggleSidebar.emit();
  }
}
