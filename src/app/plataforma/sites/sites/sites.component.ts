/*
    Author: German Valencia
    Pattern: PLATAFORMA Componente - Sitios (OT-036 fase 2, CC-207; patrón de los módulos de administración, regla 19)
    Description: catálogo de los websites de cada aplicación (porttos.co de Porttos…). Por fila: «V» abre el sitio y «A» va a la pantalla
    donde su aplicación administra el contenido (rutaAdministracion; el núcleo no conoce ese contenido, regla 26). Retirar = inactivar.
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
import { PTLSitiosAPService } from 'src/app/theme/shared/service/ptlsitios-ap.service';
import { PtlAplicacionesService } from 'src/app/theme/shared/service/ptlaplicaciones.service';
import { traducir } from 'src/app/theme/shared/i18n/traducir';
import { Sitio, accionesDeSitio, filtrarSitios } from './sitios-nucleo';

@Component({
  selector: 'app-sites',
  imports: [CommonModule, SharedModule, TranslateModule, NavBarComponent, NavContentComponent, DataLoaderComponent, TableDataComponent],
  templateUrl: './sites.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './sites.component.scss'
})
export class SitesComponent implements OnInit, OnDestroy {
  @Output() toggleSidebar = new EventEmitter<void>();
  activeTab: 'menu' | 'filters' = 'menu';
  menuItems!: Observable<NavigationItem[]>;
  cargando = true;
  aplicaciones: { codigoAplicacion: string; nombreAplicacion: string }[] = [];

  readonly columnas: ColumnMetadata[] = [
    { name: 'nombreAplicacion', header: 'COMMON.APPLICATION', type: 'text' },
    { name: 'nombreSitio', header: 'COMMON.NAME', type: 'text' },
    { name: 'urlSitio', header: 'SITES.URL', type: 'text' },
    { name: 'nomEstado', header: 'COMMON.STATUS', type: 'text' }
  ];
  readonly metadataDetalle: ColumnMetadata[] = [
    { name: 'descripcionSitio', header: 'COMMON.DESCRIPTION', type: 'text' },
    { name: 'rutaAdministracion', header: 'SITES.ADMINISTRATION_PATH', type: 'text' }
  ];

  private readonly sitios$ = new BehaviorSubject<Sitio[]>([]);
  readonly filtro$ = new BehaviorSubject<{ aplicacion: string; estado: string; texto: string }>({ aplicacion: '', estado: 'todos', texto: '' });
  filtrados$: Observable<any[]> = of([]);
  private subs: Subscription[] = [];

  constructor(
    private readonly router: Router,
    private readonly translate: TranslateService,
    private readonly navegacion: NavigationService,
    private readonly avisos: SwalAlertService,
    private readonly sitios: PTLSitiosAPService,
    private readonly apps: PtlAplicacionesService
  ) {}

  ngOnInit(): void {
    this.navegacion.getNavigationItems();
    this.menuItems = this.navegacion.menuItems$;
    this.filtrados$ = combineLatest([this.sitios$, this.filtro$]).pipe(
      map(([lista, f]) =>
        filtrarSitios(lista, f).map((s) => ({
          ...s,
          nomEstado: s.estadoSitio ? traducir('COMMON.ACTIVE') : traducir('COMMON.INACTIVE'),
          _acciones: accionesDeSitio(s).map((a) => ({ ...a, tooltip: traducir(a.tooltip) }))
        }))
      )
    );
    this.subs.push(
      this.apps.getAplicaciones().subscribe({
        next: (r: any) => (this.aplicaciones = (r?.aplicaciones || []).map((a: any) => ({ codigoAplicacion: a.codigoAplicacion, nombreAplicacion: a.nombreAplicacion }))),
        error: () => (this.aplicaciones = [])
      })
    );
    this.cargar();
  }

  ngOnDestroy(): void {
    this.subs.forEach((s) => s.unsubscribe());
  }

  cargar(): void {
    this.cargando = this.sitios$.value.length === 0;
    this.sitios.listar().subscribe({
      next: (l) => {
        this.sitios$.next(l);
        this.cargando = false;
      },
      error: () => {
        this.cargando = false;
        this.avisos.getAlertError(traducir('SITES.COULD_NOT_GET_SITE'));
      }
    });
  }

  alFiltrar(campo: 'aplicacion' | 'estado' | 'texto', e: any): void {
    this.filtro$.next({ ...this.filtro$.value, [campo]: e?.target?.value || (campo === 'estado' ? 'todos' : '') });
  }

  nuevo(): void {
    this.router.navigate(['/sites/gestion-site']);
  }
  editar(codigo: any): void {
    this.router.navigate(['/sites/gestion-site'], { queryParams: { sitio: codigo } });
  }

  alAccion(e: { accion: string; row: any }): void {
    if (e?.accion === 'VER' && /^https?:\/\//.test(e.row?.urlSitio || '')) window.open(e.row.urlSitio, '_blank', 'noopener');
    if (e?.accion === 'ADMINISTRAR' && e.row?.rutaAdministracion) this.router.navigateByUrl(e.row.rutaAdministracion);
  }

  inactivar(codigo: any): void {
    Swal.fire({
      title: this.translate.instant('SITES.DEACTIVATE_SITE'),
      text: this.translate.instant('SITES.SITE_WITH_ACTIVE_LINKS_CANNOT_BE'),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: this.translate.instant('COMMON.YES'),
      cancelButtonText: this.translate.instant('COMMON.CANCEL')
    }).then((r) => {
      if (!r.isConfirmed) return;
      this.sitios.inactivar(String(codigo)).subscribe({
        next: () => {
          this.avisos.getAlertConfirmSuccess(traducir('SITES.SITE_DEACTIVATED'));
          this.cargar();
        },
        error: (e) => this.avisos.getAlertError(e?.error?.msg || traducir('SITES.COULD_NOT_DELETE_SITE'))
      });
    });
  }

  toggleNav(): void {
    this.toggleSidebar.emit();
  }
}
