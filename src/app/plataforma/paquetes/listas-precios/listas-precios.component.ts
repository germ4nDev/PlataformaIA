/*
    Author: German Valencia
    Pattern: PLATAFORMA Componente - Paquetes › Listas de precios (OT-029, patrón de los módulos de administración, regla 19)
    Description: La lista de precios es el único lugar del precio de venta de paquetes e items. Esta pantalla lista las listas con su
    vigencia y cuántos precios tienen; filtros por estado, moneda y texto; crear, editar (con su detalle y «Duplicar») e inactivar.
*/
import { Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
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
import { PTLListasPreciosService, ListaPrecios } from 'src/app/theme/shared/service/ptllistas-precios.service';
import { traducir } from 'src/app/theme/shared/i18n/traducir';
import { PtlPaisesService } from 'src/app/theme/shared/service/ptlpaises.service';

@Component({
  selector: 'app-listas-precios',
  imports: [CommonModule, SharedModule, TranslateModule, NavBarComponent, NavContentComponent, DataLoaderComponent, TableDataComponent],
  templateUrl: './listas-precios.component.html',
  styleUrl: './listas-precios.component.scss'
})
export class ListasPreciosComponent implements OnInit, OnDestroy {
  @Output() toggleSidebar = new EventEmitter<void>();
  activeTab: 'menu' | 'filters' = 'menu';
  menuItems!: Observable<NavigationItem[]>;
  cargando = true;
  listas: ListaPrecios[] = [];
  monedas: string[] = [];

  readonly columnas: ColumnMetadata[] = [
    { name: 'codigoLista', header: 'COMMON.CODE', type: 'text' },
    { name: 'nombreLista', header: 'COMMON.NAME', type: 'text' },
    { name: 'moneda', header: 'COMMON.CURRENCY', type: 'text' },
    { name: 'nomPais', header: 'PAQUETES.LISTAS_PRECIOS.COUNTRY', type: 'text' },
    { name: 'vigencia', header: 'PAQUETES.LISTAS_PRECIOS.VALIDITY', type: 'text' },
    { name: 'numPrecios', header: 'PAQUETES.PRICES', type: 'number' },
    { name: 'nomEstado', header: 'COMMON.STATUS', type: 'text' }
  ];

  private readonly listas$ = new BehaviorSubject<ListaPrecios[]>([]);
  /** código ISO → nombre en el idioma del usuario (Utilidades › Países) */
  private readonly nombresPais$ = new BehaviorSubject<Record<string, string>>({});
  readonly filtroEstado$ = new BehaviorSubject<string>('activas');
  readonly filtroMoneda$ = new BehaviorSubject<string>('');
  readonly filtroTexto$ = new BehaviorSubject<string>('');
  filtradas$: Observable<any[]> = of([]);
  private sub = new Subscription();

  constructor(
    private readonly router: Router,
    private readonly translate: TranslateService,
    private readonly navegacion: NavigationService,
    private readonly avisos: SwalAlertService,
    private readonly precios: PTLListasPreciosService,
    private readonly paises: PtlPaisesService
  ) {}

  ngOnInit(): void {
    this.navegacion.getNavigationItems();
    this.menuItems = this.navegacion.menuItems$;
    this.paises
      .listar()
      .subscribe({
        next: (l) =>
          this.nombresPais$.next(
            Object.fromEntries(l.map((p) => [p.codigoPais, this.paises.nombreEn(p, this.translate.currentLang || 'es')]))
          )
      });
    this.filtradas$ = combineLatest([this.listas$, this.filtroEstado$, this.filtroMoneda$, this.filtroTexto$, this.nombresPais$]).pipe(
      map(([listas, estado, moneda, texto, nombres]) => {
        const t = texto.trim().toLowerCase();
        return listas
          .filter((l) => estado === 'todas' || (estado === 'activas') === !!l.estadoLista)
          .filter((l) => !moneda || l.moneda === moneda)
          .filter((l) => !t || `${l.codigoLista} ${l.nombreLista} ${l.paisAplica || ''}`.toLowerCase().includes(t))
          .map((l) => ({
            ...l,
            nomPais: l.paisAplica
              ? nombres[String(l.paisAplica).trim()] || l.paisAplica
              : traducir('PAQUETES.LISTAS_PRECIOS.ALL_COUNTRIES'),
            vigencia: `${this.dia(l.fechaInicio)} – ${l.fechaFin ? this.dia(l.fechaFin) : traducir('PAQUETES.LISTAS_PRECIOS.NO_END_DATE')}`,
            nomEstado: l.estadoLista ? traducir('COMMON.ACTIVE') : traducir('COMMON.INACTIVE')
          }));
      })
    );
    this.sub.add(this.precios.cambios$.subscribe(() => this.cargar()));
    this.cargar();
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  dia(f: string | null | undefined): string {
    return f ? String(f).slice(0, 10) : '';
  }

  cargar(): void {
    this.cargando = true;
    this.precios.listar().subscribe({
      next: (listas) => {
        this.listas = listas;
        this.monedas = [...new Set(listas.map((l) => l.moneda))].sort();
        this.listas$.next(listas);
        this.cargando = false;
      },
      error: () => {
        this.cargando = false;
        this.avisos.getAlertError(traducir('PAQUETES.LISTAS_PRECIOS.COULD_NOT_GET_PRICE_LISTS'));
      }
    });
  }

  alFiltrarEstado(e: any): void {
    this.filtroEstado$.next(e.target.value);
  }
  alFiltrarMoneda(e: any): void {
    this.filtroMoneda$.next(e.target.value);
  }
  alFiltrarTexto(e: any): void {
    this.filtroTexto$.next(e.target.value || '');
  }

  nueva(): void {
    this.router.navigate(['paquetes/gestion-lista-precios']);
  }

  editar(codigoLista: string): void {
    this.router.navigate(['paquetes/gestion-lista-precios'], { queryParams: { lista: codigoLista } });
  }

  /** Las listas no se borran (las ventas guardan su código): se activan o inactivan. */
  cambiarEstado(codigoLista: string): void {
    const l = this.listas.find((x) => x.codigoLista === codigoLista);
    if (!l) return;
    Swal.fire({
      title: this.translate.instant(
        l.estadoLista ? 'PAQUETES.LISTAS_PRECIOS.DEACTIVATE_PRICE_LIST' : 'PAQUETES.LISTAS_PRECIOS.ACTIVATE_PRICE_LIST'
      ),
      text: this.translate.instant('PAQUETES.LISTAS_PRECIOS.SALES_ALREADY_MADE_KEEP_THEIR_PRICE', { lista: l.nombreLista }),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: this.translate.instant('COMMON.YES'),
      cancelButtonText: this.translate.instant('COMMON.CANCEL')
    }).then((r) => {
      if (!r.isConfirmed) return;
      this.precios
        .modificar(l.codigoLista, {
          ...l,
          fechaInicio: this.dia(l.fechaInicio),
          fechaFin: l.fechaFin ? this.dia(l.fechaFin) : null,
          estadoLista: !l.estadoLista
        })
        .subscribe({
          next: () => {
            this.avisos.getAlertConfirmSuccess(traducir('PAQUETES.LISTAS_PRECIOS.PRICE_LIST_UPDATED'));
            this.cargar();
          },
          error: (e) => this.avisos.getAlertError(e?.error?.msg || traducir('PAQUETES.LISTAS_PRECIOS.COULD_NOT_UPDATE_PRICE_LIST'))
        });
    });
  }

  toggleNav(): void {
    this.toggleSidebar.emit();
  }
}
