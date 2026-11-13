/*
    Author: German Valencia
    Pattern: PLATAFORMA Componente - Utilidades › Países (patrón de los módulos de administración, regla 19)
    Description: Países que usa la plataforma con su código ISO, moneda y datos regionales (indicativo, zona horaria, idioma). Listas de
    precios los usa. Un país con listas de precios no se elimina: se inactiva.
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
import { PtlPaisesService, Pais } from 'src/app/theme/shared/service/ptlpaises.service';
import { traducir } from 'src/app/theme/shared/i18n/traducir';

@Component({
  selector: 'app-paises',
  imports: [CommonModule, SharedModule, TranslateModule, NavBarComponent, NavContentComponent, DataLoaderComponent, TableDataComponent],
  templateUrl: './paises.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './paises.component.scss'
})
export class PaisesComponent implements OnInit {
  @Output() toggleSidebar = new EventEmitter<void>();
  activeTab: 'menu' | 'filters' = 'menu';
  menuItems!: Observable<NavigationItem[]>;
  cargando = true;

  readonly columnas: ColumnMetadata[] = [
    { name: 'codigoPais', header: 'COMMON.CODE', type: 'text' },
    { name: 'nomPais', header: 'COMMON.NAME', type: 'text' },
    { name: 'moneda', header: 'COMMON.CURRENCY', type: 'text' },
    { name: 'simboloMoneda', header: 'UTILIDADES.PAISES.SYMBOL', type: 'text' },
    { name: 'indicativo', header: 'UTILIDADES.PAISES.DIALING_CODE', type: 'text' },
    { name: 'zonaHoraria', header: 'UTILIDADES.PAISES.TIME_ZONE', type: 'text' },
    { name: 'nomEstado', header: 'COMMON.STATUS', type: 'text' }
  ];

  private readonly paises$ = new BehaviorSubject<Pais[]>([]);
  readonly filtroEstado$ = new BehaviorSubject<string>('todos');
  readonly filtroTexto$ = new BehaviorSubject<string>('');
  filtrados$: Observable<any[]> = of([]);

  constructor(
    private readonly router: Router,
    private readonly translate: TranslateService,
    private readonly navegacion: NavigationService,
    private readonly avisos: SwalAlertService,
    private readonly paises: PtlPaisesService
  ) {}

  ngOnInit(): void {
    this.navegacion.getNavigationItems();
    this.menuItems = this.navegacion.menuItems$;
    this.filtrados$ = combineLatest([this.paises$, this.filtroEstado$, this.filtroTexto$]).pipe(
      map(([lista, estado, texto]) => {
        const t = texto.trim().toLowerCase();
        const idioma = this.translate.currentLang || 'es';
        return lista
          .map((p) => ({
            ...p,
            nomPais: this.paises.nombreEn(p, idioma),
            nomEstado: p.estadoPais ? traducir('COMMON.ACTIVE') : traducir('COMMON.INACTIVE')
          }))
          .filter((p) => estado === 'todos' || (estado === 'activos') === p.estadoPais)
          .filter((p) => !t || `${p.codigoPais} ${p.codigoIso3} ${p.nombrePais} ${p.nomPais} ${p.moneda}`.toLowerCase().includes(t));
      })
    );
    this.cargar();
  }

  cargar(): void {
    this.cargando = true;
    this.paises.listar().subscribe({
      next: (l) => {
        this.paises$.next(l);
        this.cargando = false;
      },
      error: () => {
        this.cargando = false;
        this.avisos.getAlertError(traducir('UTILIDADES.PAISES.COULD_NOT_GET_COUNTRIES'));
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
    this.router.navigate(['utilidades/gestion-pais']);
  }
  editar(codigo: string): void {
    this.router.navigate(['utilidades/gestion-pais'], { queryParams: { pais: codigo } });
  }

  eliminar(codigo: string): void {
    Swal.fire({
      title: this.translate.instant('UTILIDADES.PAISES.DELETE_COUNTRY'),
      text: this.translate.instant('UTILIDADES.PAISES.COUNTRY_WITH_PRICE_LISTS_CANNOT_BE_DELETED'),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: this.translate.instant('COMMON.YES'),
      cancelButtonText: this.translate.instant('COMMON.CANCEL')
    }).then((r) => {
      if (!r.isConfirmed) return;
      this.paises.eliminar(codigo).subscribe({
        next: () => {
          this.avisos.getAlertConfirmSuccess(traducir('UTILIDADES.PAISES.COUNTRY_DELETED'));
          this.cargar();
        },
        error: (e) => this.avisos.getAlertError(e?.error?.msg || traducir('UTILIDADES.PAISES.COULD_NOT_DELETE_COUNTRY'))
      });
    });
  }

  toggleNav(): void {
    this.toggleSidebar.emit();
  }
}
