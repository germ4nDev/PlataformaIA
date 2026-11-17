/*
    Author: German Valencia
    Pattern: PLATAFORMA Componente - Utilidades › Dominios (CC-224; patrón de los módulos de administración, regla 19)
    Description: Qué abre cada dominio de la plataforma (consola o una aplicación), con su portal, su inicio y su marca (PTL_DominiosAP).
      Filtros por tipo, aplicación, estado y texto. «Probar» (barra de la tabla) abre la web de aquí con ?dominio= para ver qué abre.
      Eliminar = inactivar: un dominio nunca se borra.
*/
import { Component, EventEmitter, OnInit, Output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { BehaviorSubject, Observable, combineLatest, map, of } from 'rxjs';
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
import { PtlDominiosService, Dominio } from 'src/app/theme/shared/service/ptldominios.service';
import { traducir } from 'src/app/theme/shared/i18n/traducir';

@Component({
  selector: 'app-dominios',
  imports: [CommonModule, SharedModule, TranslateModule, NavBarComponent, NavContentComponent, DataLoaderComponent, TableDataComponent],
  templateUrl: './dominios.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './dominios.component.scss'
})
export class DominiosComponent implements OnInit {
  @Output() toggleSidebar = new EventEmitter<void>();
  activeTab: 'menu' | 'filters' = 'menu';
  menuItems!: Observable<NavigationItem[]>;
  cargando = true;
  aplicaciones: { codigo: string; nombre: string }[] = [];

  readonly columnas: ColumnMetadata[] = [
    { name: 'dominio', header: 'UTILIDADES.DOMINIOS.DOMAIN', type: 'text' },
    { name: 'nomTipo', header: 'COMMON.TYPE', type: 'text' },
    { name: 'nomAplicacion', header: 'COMMON.APPLICATION', type: 'text' },
    { name: 'nomSuite', header: 'COMMON.SUITE', type: 'text' },
    { name: 'nomPortal', header: 'UTILIDADES.DOMINIOS.PORTAL_ROUTE', type: 'text' },
    { name: 'nomEstado', header: 'COMMON.STATUS', type: 'text' }
  ];

  private readonly dominios$ = new BehaviorSubject<Dominio[]>([]);
  readonly filtroTipo$ = new BehaviorSubject<string>('');
  readonly filtroApp$ = new BehaviorSubject<string>('');
  readonly filtroEstado$ = new BehaviorSubject<string>('todos');
  readonly filtroTexto$ = new BehaviorSubject<string>('');
  filtrados$: Observable<any[]> = of([]);

  constructor(
    private readonly router: Router,
    private readonly translate: TranslateService,
    private readonly navegacion: NavigationService,
    private readonly avisos: SwalAlertService,
    private readonly dominios: PtlDominiosService
  ) {}

  ngOnInit(): void {
    this.navegacion.getNavigationItems();
    this.menuItems = this.navegacion.menuItems$;
    this.filtrados$ = combineLatest([this.dominios$, this.filtroTipo$, this.filtroApp$, this.filtroEstado$, this.filtroTexto$]).pipe(
      map(([lista, tipo, app, estado, texto]) => {
        const t = texto.trim().toLowerCase();
        return lista
          .filter((d) => !tipo || d.tipo === tipo)
          .filter((d) => !app || d.codigoAplicacion === app)
          .filter((d) => estado === 'todos' || (estado === 'activos') === d.estado)
          .filter((d) => !t || `${d.dominio} ${d.nombreAplicacion || ''} ${d.nombreMarca || ''} ${d.rutaPortal || ''}`.toLowerCase().includes(t))
          .map((d) => ({
            ...d,
            id: d.dominioId,
            nomTipo: traducir(d.tipo === 'consola' ? 'UTILIDADES.DOMINIOS.CONSOLE' : 'COMMON.APPLICATION'),
            nomAplicacion: d.nombreAplicacion || '—',
            nomSuite: d.nombreSuite || '—',
            nomPortal: d.rutaPortal || '—',
            nomEstado: d.estado ? traducir('COMMON.ACTIVE') : traducir('COMMON.INACTIVE')
          }));
      })
    );
    this.cargar();
  }

  cargar(): void {
    this.cargando = true;
    this.dominios.listar().subscribe({
      next: (l) => {
        const apps = new Map<string, string>();
        for (const d of l) if (d.codigoAplicacion) apps.set(d.codigoAplicacion, d.nombreAplicacion || d.codigoAplicacion);
        this.aplicaciones = [...apps].map(([codigo, nombre]) => ({ codigo, nombre })).sort((a, b) => a.nombre.localeCompare(b.nombre));
        this.dominios$.next(l);
        this.cargando = false;
      },
      error: () => {
        this.cargando = false;
        this.avisos.getAlertError(traducir('UTILIDADES.DOMINIOS.COULD_NOT_GET_DOMAINS'));
      }
    });
  }

  alFiltrar(filtro: BehaviorSubject<string>, e: any): void {
    filtro.next(e?.target?.value || '');
  }

  nuevo(): void {
    this.router.navigate(['utilidades/gestion-dominio']);
  }

  editar(id: any): void {
    this.router.navigate(['utilidades/gestion-dominio'], { queryParams: { id: id?.id ?? id } });
  }

  /** Abre la web de aquí como si se entrara por ese dominio (?dominio=, solo en desarrollo; se quita con ?dominio=localhost) */
  probar(): void {
    const primero = this.dominios$.getValue().find((d) => d.estado);
    const dominio = primero?.dominio || '';
    Swal.fire({
      title: this.translate.instant('UTILIDADES.DOMINIOS.TRY_DOMAIN'),
      text: this.translate.instant('UTILIDADES.DOMINIOS.OPENS_WEB_AS_IF_ENTERED_BY_DOMAIN'),
      input: 'select',
      inputOptions: Object.fromEntries(this.dominios$.getValue().filter((d) => d.estado).map((d) => [d.dominio, d.dominio])),
      inputValue: dominio,
      showCancelButton: true,
      confirmButtonText: this.translate.instant('UTILIDADES.DOMINIOS.TRY'),
      cancelButtonText: this.translate.instant('COMMON.CANCEL')
    }).then((r) => {
      if (r.isConfirmed && r.value) window.open(`/?dominio=${encodeURIComponent(r.value)}`, '_blank', 'noopener');
    });
  }

  eliminar(id: any): void {
    Swal.fire({
      title: this.translate.instant('UTILIDADES.DOMINIOS.INACTIVATE_DOMAIN'),
      text: this.translate.instant('UTILIDADES.DOMINIOS.INACTIVE_DOMAIN_OPENS_NOTHING'),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: this.translate.instant('COMMON.YES'),
      cancelButtonText: this.translate.instant('COMMON.CANCEL')
    }).then((r) => {
      if (!r.isConfirmed) return;
      this.dominios.eliminar(id?.id ?? id).subscribe({
        next: () => {
          this.avisos.getAlertConfirmSuccess(traducir('UTILIDADES.DOMINIOS.DOMAIN_INACTIVATED'));
          this.cargar();
        },
        error: (e) => this.avisos.getAlertError(e?.error?.msg || traducir('UTILIDADES.DOMINIOS.COULD_NOT_INACTIVATE_DOMAIN'))
      });
    });
  }

  toggleNav(): void {
    this.toggleSidebar.emit();
  }
}
