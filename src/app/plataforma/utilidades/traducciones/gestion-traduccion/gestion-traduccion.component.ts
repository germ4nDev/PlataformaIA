/*
    Author: German Valencia
    Pattern: PLATAFORMA Componente - Utilidades › Traducciones › gestión (OT-027)
    Description:
      Nueva: se elige el módulo (primer nivel del JSON) o se escribe uno nuevo, el submódulo si aplica (dentro del módulo) y el nombre de la
      llave; la llave queda MODULO[.SUBMODULO].LLAVE, en MAYÚSCULAS, y se escribe su texto en cada idioma (todos con las mismas llaves).
      Editar: la llave no cambia; se corrigen sus textos. El API revisa que no choque con el árbol (la llave ya existe, es un grupo, etc.).
*/
import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs';
import { SharedModule } from 'src/app/theme/shared/shared.module';
import { NavBarComponent } from 'src/app/theme/layout/admin/nav-bar/nav-bar.component';
import { NavContentComponent } from 'src/app/theme/layout/admin/navigation/nav-content/nav-content.component';
import { NavigationService } from 'src/app/theme/shared/service/navigation.service';
import { NavigationItem } from 'src/app/theme/shared/_helpers/models/Navigation.model';
import { SwalAlertService } from 'src/app/theme/shared/service/swal-alert.service';
import { PtlTraduccionesService, RamaTraduccion } from 'src/app/theme/shared/service/ptltraducciones.service';
import { traducir } from 'src/app/theme/shared/i18n/traducir';

const NUEVO = '__nuevo__';
const SEGMENTO = /^[A-Z][A-Z0-9_]*$/;
const aSegmento = (s: string) =>
  String(s || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9_]+/g, '_')
    .replace(/^_+|_+$/g, '');

@Component({
  selector: 'app-gestion-traduccion',
  imports: [CommonModule, FormsModule, SharedModule, TranslateModule, NavBarComponent, NavContentComponent],
  templateUrl: './gestion-traduccion.component.html',
  styleUrl: './gestion-traduccion.component.scss'
})
export class GestionTraduccionComponent implements OnInit {
  @Output() toggleSidebar = new EventEmitter<void>();
  menuItems!: Observable<NavigationItem[]>;
  readonly NUEVO = NUEVO;

  modoEdicion = false;
  idiomas: string[] = [];
  ramas: RamaTraduccion[] = [];
  modulo = '';
  moduloNuevo = '';
  submodulo = '';
  submoduloNuevo = '';
  nombre = '';
  llaveEditada = '';
  textos: Record<string, string> = {};
  guardando = false;
  enviado = false;

  constructor(
    private readonly router: Router,
    private readonly ruta: ActivatedRoute,
    private readonly translate: TranslateService,
    private readonly navegacion: NavigationService,
    private readonly avisos: SwalAlertService,
    private readonly traducciones: PtlTraduccionesService
  ) {}

  ngOnInit(): void {
    this.navegacion.getNavigationItems();
    this.menuItems = this.navegacion.menuItems$;
    const llave = this.ruta.snapshot.queryParamMap.get('llave') || '';
    this.traducciones.listar().subscribe({
      next: (r) => {
        this.idiomas = r.idiomas;
        this.ramas = [...r.ramas].sort((a, b) => a.modulo.localeCompare(b.modulo));
        this.textos = Object.fromEntries(this.idiomas.map((i) => [i, '']));
        if (llave) {
          const fila = r.filas.find((f) => f.llave === llave);
          if (!fila) {
            this.avisos.getAlertError(traducir('UTILIDADES.TRADUCCIONES.GESTION.THAT_KEY_DOES_NOT_EXIST'));
            this.volver();
            return;
          }
          this.modoEdicion = true;
          this.llaveEditada = llave;
          this.textos = Object.fromEntries(this.idiomas.map((i) => [i, String(fila.textos[i] ?? '')]));
        }
      },
      error: () => this.avisos.getAlertError(traducir('UTILIDADES.TRADUCCIONES.COULD_NOT_GET_TRANSLATIONS'))
    });
  }

  get submodulos(): string[] {
    return (this.ramas.find((r) => r.modulo === this.modulo)?.submodulos || []).slice().sort();
  }

  alCambiarModulo(): void {
    this.submodulo = '';
    this.submoduloNuevo = '';
  }

  /** MODULO[.SUBMODULO].LLAVE con lo elegido o escrito (en MAYÚSCULAS, sin tildes ni espacios). */
  get llave(): string {
    if (this.modoEdicion) return this.llaveEditada;
    const mod = this.modulo === NUEVO ? aSegmento(this.moduloNuevo) : this.modulo;
    const sub = this.submodulo === NUEVO ? aSegmento(this.submoduloNuevo) : this.submodulo;
    return [mod, sub, aSegmento(this.nombre)].filter(Boolean).join('.');
  }

  get llaveValida(): boolean {
    const partes = this.llave.split('.');
    return partes.length >= 2 && partes.every((p) => SEGMENTO.test(p)) && !!aSegmento(this.nombre || (this.modoEdicion ? 'X' : ''));
  }

  get textosCompletos(): boolean {
    return this.idiomas.every((i) => String(this.textos[i] || '').trim());
  }

  guardar(): void {
    this.enviado = true;
    if (!this.llaveValida || !this.textosCompletos || this.guardando) return;
    this.guardando = true;
    const peticion = this.modoEdicion
      ? this.traducciones.modificar(this.llave, this.textos)
      : this.traducciones.crear(this.llave, this.textos);
    peticion.subscribe({
      next: () => {
        this.guardando = false;
        this.translate.reloadLang(this.translate.currentLang || 'es').subscribe();
        this.avisos.getAlertConfirmSuccess(
          traducir(this.modoEdicion ? 'UTILIDADES.TRADUCCIONES.GESTION.KEY_UPDATED' : 'UTILIDADES.TRADUCCIONES.GESTION.KEY_CREATED')
        );
        this.volver();
      },
      error: (e) => {
        this.guardando = false;
        this.avisos.getAlertError(e?.error?.msg || traducir('UTILIDADES.TRADUCCIONES.GESTION.COULD_NOT_SAVE_KEY'));
      }
    });
  }

  volver(): void {
    this.router.navigate(['utilidades/traducciones']);
  }

  toggleNav(): void {
    this.toggleSidebar.emit();
  }
}
