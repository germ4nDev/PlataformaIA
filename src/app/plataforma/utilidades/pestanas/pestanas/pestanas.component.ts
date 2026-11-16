/*
    Author: German Valencia
    Pattern: PLATAFORMA Componente - Utilidades › Pestañas (CC-203; patrón de los módulos de administración, regla 19)
    Description: pestañas de los tableros de todas las aplicaciones (PTL_Pestanas): nombre, tipo, aplicación, suite, orden, ícono y
    color. Retirar = inactivar (la pestaña deja de salir en el tablero). Se refresca sola con el socket pestanas-actualizados.
*/
import { Component, EventEmitter, OnDestroy, OnInit, Output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { BehaviorSubject, Observable, Subscription, combineLatest, forkJoin, map, of, catchError } from 'rxjs';
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
import { PtlAplicacionesService } from 'src/app/theme/shared/service/ptlaplicaciones.service';
import { PtlSuitesAPService } from 'src/app/theme/shared/service/ptlsuites-ap.service';
import { PtlPestanasAdminService } from 'src/app/theme/shared/service/ptlpestanas-admin.service';
import { traducir } from 'src/app/theme/shared/i18n/traducir';
import { FiltrosPestanas, PestanaAdmin, filtrarPestanas } from '../nucleo';

@Component({
  selector: 'app-pestanas',
  imports: [CommonModule, SharedModule, TranslateModule, NavBarComponent, NavContentComponent, DataLoaderComponent, TableDataComponent],
  templateUrl: './pestanas.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './pestanas.component.scss'
})
export class PestanasComponent implements OnInit, OnDestroy {
  @Output() toggleSidebar = new EventEmitter<void>();
  activeTab: 'menu' | 'filters' = 'menu';
  menuItems!: Observable<NavigationItem[]>;
  cargando = true;
  aplicaciones: { codigoAplicacion: string; nombreAplicacion: string }[] = [];

  readonly columnas: ColumnMetadata[] = [
    { name: 'codigoPestana', header: 'COMMON.CODE', type: 'text' },
    { name: 'nombrePestana', header: 'COMMON.NAME', type: 'text' },
    { name: 'nomAplicacion', header: 'COMMON.APPLICATION', type: 'text' },
    { name: 'nomSuite', header: 'COMMON.SUITE', type: 'text' },
    { name: 'codigoTipoPestana', header: 'UTILIDADES.PESTANAS.TAB_TYPE', type: 'text' },
    { name: 'orden', header: 'UTILIDADES.PESTANAS.ORDER', type: 'text' },
    { name: 'icono', header: 'COMMON.ICON', type: 'text' },
    { name: 'color', header: 'COMMON.COLOR', type: 'text' },
    { name: 'nomEstado', header: 'COMMON.STATUS', type: 'text' }
  ];

  private readonly pestanas$ = new BehaviorSubject<PestanaAdmin[]>([]);
  private nombres = { apps: new Map<string, string>(), suites: new Map<string, string>() };
  readonly filtros$ = new BehaviorSubject<FiltrosPestanas>({ aplicacion: '', estado: 'todos', texto: '' });
  filtrados$: Observable<any[]> = of([]);
  private socket?: Subscription;

  constructor(
    private readonly router: Router,
    private readonly translate: TranslateService,
    private readonly navegacion: NavigationService,
    private readonly avisos: SwalAlertService,
    private readonly sockets: SocketManagerService,
    private readonly aplicacionesSrv: PtlAplicacionesService,
    private readonly suitesSrv: PtlSuitesAPService,
    private readonly pestanas: PtlPestanasAdminService
  ) {}

  ngOnInit(): void {
    this.navegacion.getNavigationItems();
    this.menuItems = this.navegacion.menuItems$;
    this.filtrados$ = combineLatest([this.pestanas$, this.filtros$]).pipe(
      map(([lista, f]) =>
        filtrarPestanas(
          lista.map((p) => ({
            ...p,
            nomAplicacion: this.nombres.apps.get(p.codigoAplicacion) || p.codigoAplicacion,
            nomSuite: this.nombres.suites.get(p.codigoSuite) || p.codigoSuite,
            nomEstado: p.estado ? traducir('COMMON.ACTIVE') : traducir('COMMON.INACTIVE')
          })),
          f,
          (p: any) => `${p.nomAplicacion} ${p.nomSuite}`
        )
      )
    );
    this.socket = this.sockets.pestanasActualizadoa$.subscribe(() => this.cargar());
    this.cargar();
  }

  ngOnDestroy(): void {
    this.socket?.unsubscribe();
  }

  cargar(): void {
    this.cargando = this.pestanas$.value.length === 0;
    forkJoin({
      pestanas: this.pestanas.listar(),
      apps: this.aplicacionesSrv.getAplicaciones().pipe(map((r: any) => r?.aplicaciones || []), catchError(() => of([]))),
      suites: this.suitesSrv.geSuitesAP().pipe(map((r: any) => r?.suites || []), catchError(() => of([])))
    }).subscribe({
      next: ({ pestanas, apps, suites }) => {
        this.aplicaciones = (apps as any[]).map((a) => ({ codigoAplicacion: a.codigoAplicacion, nombreAplicacion: a.nombreAplicacion }));
        this.nombres = {
          apps: new Map(this.aplicaciones.map((a) => [a.codigoAplicacion, a.nombreAplicacion])),
          suites: new Map((suites as any[]).map((s) => [s.codigoSuite, s.nombreSuite]))
        };
        this.pestanas$.next(pestanas);
        this.cargando = false;
      },
      error: () => {
        this.cargando = false;
        this.avisos.getAlertError(traducir('UTILIDADES.PESTANAS.COULD_NOT_GET_TABS'));
      }
    });
  }

  alFiltrar(campo: keyof FiltrosPestanas, e: any): void {
    this.filtros$.next({ ...this.filtros$.value, [campo]: e?.target?.value ?? '' });
  }

  nuevo(): void {
    this.router.navigate(['utilidades/gestion-pestana']);
  }
  editar(codigo: string): void {
    this.router.navigate(['utilidades/gestion-pestana'], { queryParams: { pestana: codigo } });
  }

  inactivar(codigo: string): void {
    Swal.fire({
      title: this.translate.instant('UTILIDADES.PESTANAS.DEACTIVATE_TAB'),
      text: this.translate.instant('UTILIDADES.PESTANAS.DEACTIVATED_TAB_HIDDEN'),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: this.translate.instant('COMMON.YES'),
      cancelButtonText: this.translate.instant('COMMON.CANCEL')
    }).then((r) => {
      if (!r.isConfirmed) return;
      this.pestanas.inactivar(codigo).subscribe({
        next: () => {
          this.avisos.getAlertConfirmSuccess(traducir('UTILIDADES.PESTANAS.TAB_DEACTIVATED'));
          this.cargar();
        },
        error: (e) => this.avisos.getAlertError(e?.error?.msg || traducir('UTILIDADES.PESTANAS.COULD_NOT_DEACTIVATE_TAB'))
      });
    });
  }

  toggleNav(): void {
    this.toggleSidebar.emit();
  }
}
