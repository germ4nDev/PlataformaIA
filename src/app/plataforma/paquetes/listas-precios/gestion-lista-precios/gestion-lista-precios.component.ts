/*
    Author: German Valencia
    Pattern: PLATAFORMA Componente - Paquetes › Listas de precios › gestión (OT-029)
    Description: Datos de la lista (código, nombre, moneda, país, vigencia, estado) y, ya creada, sus precios: un paquete o item por fila
    con valor mensual, anual e instalación (se agregan desde los catálogos, se editan en la fila y se quitan). «Duplicar» copia la lista y
    sus precios con otra vigencia y un ajuste en % (la del año siguiente). El API no deja dos listas activas del mismo país y moneda con
    fechas que se crucen.
*/
import { Component, EventEmitter, OnInit, Output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { Observable, forkJoin, of, catchError } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';
import { SharedModule } from 'src/app/theme/shared/shared.module';
import { NavBarComponent } from 'src/app/theme/layout/admin/nav-bar/nav-bar.component';
import { NavContentComponent } from 'src/app/theme/layout/admin/navigation/nav-content/nav-content.component';
import { NavigationService } from 'src/app/theme/shared/service/navigation.service';
import { NavigationItem } from 'src/app/theme/shared/_helpers/models/Navigation.model';
import { SwalAlertService } from 'src/app/theme/shared/service/swal-alert.service';
import { AppPermisoDirective } from 'src/app/theme/shared/directive/app-permiso.directive';
import { SelectorFechaComponent } from 'src/app/theme/shared/components/selector-fecha/selector-fecha.component';
import { PTLListasPreciosService, ListaPrecios, PrecioLista } from 'src/app/theme/shared/service/ptllistas-precios.service';
import { PTLPaquetesService } from 'src/app/theme/shared/service/ptlpaquetes.service';
import { PTLItemsService } from 'src/app/theme/shared/service/ptlitems.service';
import { traducir } from 'src/app/theme/shared/i18n/traducir';
import { PtlPaisesService, Pais } from 'src/app/theme/shared/service/ptlpaises.service';
import { TranslateService } from '@ngx-translate/core';

interface Referencia {
  codigo: string;
  nombre: string;
}

@Component({
  selector: 'app-gestion-lista-precios',
  imports: [
    CommonModule,
    FormsModule,
    SharedModule,
    TranslateModule,
    NavBarComponent,
    NavContentComponent,
    AppPermisoDirective,
    SelectorFechaComponent
  ],
  templateUrl: './gestion-lista-precios.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './gestion-lista-precios.component.scss'
})
export class GestionListaPreciosComponent implements OnInit {
  @Output() toggleSidebar = new EventEmitter<void>();
  menuItems!: Observable<NavigationItem[]>;

  modoEdicion = false;
  enviado = false;
  guardando = false;
  lista: ListaPrecios = this.listaNueva();
  precios: PrecioLista[] = [];
  paquetes: Referencia[] = [];
  items: Referencia[] = [];

  nuevo: Partial<PrecioLista> = this.precioNuevo();
  copia = { codigoLista: '', nombreLista: '', fechaInicio: '', fechaFin: '', porcentajeAjuste: 0 };
  mostrarCopia = false;
  /** Países activos de Utilidades › Países (la lista elige uno o ninguno = todos) */
  paisesActivos: Pais[] = [];

  constructor(
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly navegacion: NavigationService,
    private readonly avisos: SwalAlertService,
    private readonly servicio: PTLListasPreciosService,
    private readonly paquetesService: PTLPaquetesService,
    private readonly itemsService: PTLItemsService,
    private readonly paisesService: PtlPaisesService,
    private readonly translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.navegacion.getNavigationItems();
    this.menuItems = this.navegacion.menuItems$;
    forkJoin([
      this.paquetesService.cargarRegistros().pipe(catchError(() => of(this.paquetesService.getPaquetesActuales()))),
      this.itemsService.cargarRegistros().pipe(catchError(() => of(this.itemsService.getItemsActuales())))
    ]).subscribe(([paquetes, items]) => {
      this.paquetes = (paquetes || [])
        .filter((p: any) => p.estadoPaquete !== false)
        .map((p: any) => ({ codigo: p.codigoPaquete, nombre: p.nombrePaquete }));
      this.items = (items || [])
        .filter((i: any) => i.estadoItem !== false)
        .map((i: any) => ({ codigo: i.codigoItem, nombre: i.nombreItem }));
    });
    this.paisesService.listar().subscribe({
      next: (l) => {
        this.paisesActivos = l.filter((p) => p.estadoPais);
        this.alCambiarPais();
      },
      error: () => (this.paisesActivos = [])
    });
    const codigo = this.route.snapshot.queryParamMap.get('lista');
    if (codigo) {
      this.modoEdicion = true;
      this.cargar(codigo);
    }
  }

  private listaNueva(): ListaPrecios {
    const h = new Date();
    // fecha sin hora = medianoche UTC en ISO (selector de fecha)
    return {
      codigoLista: '',
      nombreLista: '',
      moneda: 'COP',
      paisAplica: 'CO',
      fechaInicio: new Date(Date.UTC(h.getFullYear(), h.getMonth(), h.getDate())).toISOString(),
      fechaFin: null,
      estadoLista: true
    };
  }

  private precioNuevo(): Partial<PrecioLista> {
    return { tipoReferencia: 'PAQUETE', codigoReferencia: '', valorMensual: 0, valorAnual: 0, precioSetup: 0 };
  }

  dia(f: string | null | undefined): string {
    return f ? String(f).slice(0, 10) : '';
  }

  cargar(codigo: string): void {
    this.servicio.obtener(codigo).subscribe({
      next: ({ lista, detalles }) => {
        this.lista = { ...lista, paisAplica: lista.paisAplica ? String(lista.paisAplica).trim() : '' };
        this.alCambiarPais();
        this.precios = detalles.map((d) => ({
          ...d,
          valorMensual: Number(d.valorMensual),
          valorAnual: Number(d.valorAnual),
          precioSetup: Number(d.precioSetup || 0)
        }));
      },
      error: () => this.avisos.getAlertError(traducir('PAQUETES.LISTAS_PRECIOS.COULD_NOT_GET_PRICE_LISTS'))
    });
  }

  readonly monedaEjemplo = 'COP'; // i18n-contrato: código ISO 4217 de ejemplo, no se traduce

  get fechaFinInvalida(): boolean {
    return !!this.lista.fechaFin && this.dia(this.lista.fechaFin) < this.dia(this.lista.fechaInicio);
  }

  nombrePais(p: Pais): string {
    return this.paisesService.nombreEn(p, this.translate.currentLang || 'es');
  }

  /** Con país, la moneda de la lista es la del país (no se edita); sin país (lista general) se escribe. */
  alCambiarPais(): void {
    const p = this.paisesActivos.find((x) => x.codigoPais === this.lista.paisAplica);
    if (p) this.lista.moneda = p.moneda;
  }

  get valida(): boolean {
    const l = this.lista;
    return !!(
      l.codigoLista?.trim() &&
      l.nombreLista?.trim() &&
      /^[A-Za-z]{3}$/.test(l.moneda || '') &&
      l.fechaInicio &&
      !this.fechaFinInvalida
    );
  }

  guardar(): void {
    this.enviado = true;
    if (!this.valida || this.guardando) return;
    this.guardando = true;
    const datos = {
      ...this.lista,
      codigoLista: this.lista.codigoLista.trim().toUpperCase(),
      moneda: this.lista.moneda.toUpperCase(),
      fechaFin: this.lista.fechaFin || null
    };
    const peticion = this.modoEdicion ? this.servicio.modificar(datos.codigoLista, datos) : this.servicio.crear(datos);
    peticion.subscribe({
      next: () => {
        this.guardando = false;
        this.avisos.getAlertConfirmSuccess(
          traducir(
            this.modoEdicion
              ? 'PAQUETES.LISTAS_PRECIOS.PRICE_LIST_UPDATED'
              : 'PAQUETES.LISTAS_PRECIOS.GESTION.PRICE_LIST_CREATED_NOW_ADD_PRICES'
          )
        );
        if (!this.modoEdicion)
          this.router.navigate([], { queryParams: { lista: datos.codigoLista } }).then(() => {
            this.modoEdicion = true;
            this.cargar(datos.codigoLista);
          });
      },
      error: (e) => {
        this.guardando = false;
        this.avisos.getAlertError(e?.error?.msg || traducir('PAQUETES.LISTAS_PRECIOS.COULD_NOT_UPDATE_PRICE_LIST'));
      }
    });
  }

  get referencias(): Referencia[] {
    const usadas = new Set(this.precios.filter((p) => p.tipoReferencia === this.nuevo.tipoReferencia).map((p) => p.codigoReferencia));
    return (this.nuevo.tipoReferencia === 'ITEM' ? this.items : this.paquetes).filter((r) => !usadas.has(r.codigo));
  }

  alCambiarTipo(): void {
    this.nuevo.codigoReferencia = '';
  }

  /** Al escribir el mensual, propone el anual (× 12) si todavía no tiene. */
  proponerAnual(p: Partial<PrecioLista>): void {
    if (!Number(p.valorAnual)) p.valorAnual = Math.round(Number(p.valorMensual || 0) * 12 * 100) / 100;
  }

  agregar(): void {
    if (!this.nuevo.codigoReferencia) {
      this.avisos.getAlertConfirmWarning(traducir('PAQUETES.LISTAS_PRECIOS.GESTION.SELECT_PACKAGE_OR_ITEM'));
      return;
    }
    this.servicio.agregarPrecio(this.lista.codigoLista, { ...this.nuevo, codigoDetalle: uuidv4() }).subscribe({
      next: () => {
        this.nuevo = this.precioNuevo();
        this.cargar(this.lista.codigoLista);
      },
      error: (e) => this.avisos.getAlertError(e?.error?.msg || traducir('PAQUETES.LISTAS_PRECIOS.GESTION.COULD_NOT_SAVE_PRICE'))
    });
  }

  guardarPrecio(p: PrecioLista): void {
    this.servicio
      .modificarPrecio(p.codigoDetalle, {
        valorMensual: Number(p.valorMensual),
        valorAnual: Number(p.valorAnual),
        precioSetup: Number(p.precioSetup || 0),
        estadoDetalle: !!p.estadoDetalle
      })
      .subscribe({
        next: () => this.avisos.getAlertSuccess(traducir('PAQUETES.LISTAS_PRECIOS.GESTION.PRICE_SAVED')),
        error: (e) => this.avisos.getAlertError(e?.error?.msg || traducir('PAQUETES.LISTAS_PRECIOS.GESTION.COULD_NOT_SAVE_PRICE'))
      });
  }

  quitar(p: PrecioLista): void {
    this.servicio.eliminarPrecio(p.codigoDetalle).subscribe({
      next: () => this.cargar(this.lista.codigoLista),
      error: (e) => this.avisos.getAlertError(e?.error?.msg || traducir('PAQUETES.LISTAS_PRECIOS.GESTION.COULD_NOT_SAVE_PRICE'))
    });
  }

  duplicar(): void {
    const c = this.copia;
    if (!c.codigoLista.trim() || !c.nombreLista.trim() || !c.fechaInicio) {
      this.avisos.getAlertConfirmWarning(traducir('PAQUETES.LISTAS_PRECIOS.GESTION.FILL_IN_CODE_NAME_START_DATE'));
      return;
    }
    this.servicio
      .duplicar(this.lista.codigoLista, {
        ...c,
        codigoLista: c.codigoLista.trim().toUpperCase(),
        fechaFin: c.fechaFin || null,
        porcentajeAjuste: Number(c.porcentajeAjuste) || 0
      })
      .subscribe({
        next: () => {
          this.avisos.getAlertConfirmSuccess(traducir('PAQUETES.LISTAS_PRECIOS.GESTION.LIST_DUPLICATED'));
          const codigo = c.codigoLista.trim().toUpperCase();
          this.mostrarCopia = false;
          this.router.navigate([], { queryParams: { lista: codigo } }).then(() => this.cargar(codigo));
        },
        error: (e) => this.avisos.getAlertError(e?.error?.msg || traducir('PAQUETES.LISTAS_PRECIOS.GESTION.COULD_NOT_DUPLICATE_LIST'))
      });
  }

  volver(): void {
    this.router.navigate(['paquetes/listas-precios']);
  }

  toggleNav(): void {
    this.toggleSidebar.emit();
  }
}
