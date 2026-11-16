/*
    Author: German Valencia
    Pattern: PLATAFORMA Componente - Utilidades › Catálogos › gestión (CC-204; regla 19)
    Description: formulario de cualquier catálogo simple, armado con sus campos (catalogos-nucleo.ts): código (no cambia al editar),
    textos, números y estado. Se envía el registro limpio (camposDe); el API dice si el código o el valor único ya existen, o si el
    registro lo usan otras tablas y no se puede inactivar. En los estados, el número del tipo se sugiere de los tipos de estado.
*/
import { Component, EventEmitter, OnInit, Output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { Observable } from 'rxjs';
import { SharedModule } from 'src/app/theme/shared/shared.module';
import { NavBarComponent } from 'src/app/theme/layout/admin/nav-bar/nav-bar.component';
import { NavContentComponent } from 'src/app/theme/layout/admin/navigation/nav-content/nav-content.component';
import { NavigationService } from 'src/app/theme/shared/service/navigation.service';
import { NavigationItem } from 'src/app/theme/shared/_helpers/models/Navigation.model';
import { SwalAlertService } from 'src/app/theme/shared/service/swal-alert.service';
import { AppPermisoDirective } from 'src/app/theme/shared/directive/app-permiso.directive';
import { PtlCatalogosService } from 'src/app/theme/shared/service/ptlcatalogos.service';
import { PtllogActividadesService } from 'src/app/theme/shared/service/ptllog-actividades.service';
import { traducir } from 'src/app/theme/shared/i18n/traducir';
import { CATALOGOS, CampoCatalogo, DefCatalogo, camposDe, catalogo, codigoLimpio, faltantes, registroVacio } from '../../catalogos-nucleo';

@Component({
  selector: 'app-gestion-catalogo',
  imports: [CommonModule, FormsModule, SharedModule, TranslateModule, NavBarComponent, NavContentComponent, AppPermisoDirective],
  templateUrl: './gestion-catalogo.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './gestion-catalogo.component.scss'
})
export class GestionCatalogoComponent implements OnInit {
  @Output() toggleSidebar = new EventEmitter<void>();
  menuItems!: Observable<NavigationItem[]>;
  def: DefCatalogo = CATALOGOS[0];
  modoEdicion = false;
  guardando = false;
  id = '';
  registro: Record<string, any> = {};
  tiposEstado: { numero: number; nombre: string }[] = [];

  constructor(
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly navegacion: NavigationService,
    private readonly avisos: SwalAlertService,
    private readonly servicio: PtlCatalogosService,
    private readonly logs: PtllogActividadesService
  ) {}

  ngOnInit(): void {
    this.navegacion.getNavigationItems();
    this.menuItems = this.navegacion.menuItems$;
    const d = catalogo(this.route.snapshot.paramMap.get('catalogo'));
    if (!d) {
      this.router.navigate(['utilidades/catalogos', CATALOGOS[0].clave]);
      return;
    }
    this.def = d;
    this.registro = registroVacio(d);
    if (d.campos.some((c) => c.deTiposEstado)) this.cargarTiposEstado();
    this.id = this.route.snapshot.queryParamMap.get('id') || '';
    if (this.id) {
      this.modoEdicion = true;
      this.servicio.obtener(d, this.id).subscribe({
        next: (r) => (this.registro = { ...this.registro, ...r }),
        error: () => this.avisos.getAlertError(traducir('UTILIDADES.CATALOGOS.COULD_NOT_LOAD_CATALOG'))
      });
    }
  }

  private cargarTiposEstado(): void {
    const tipos = catalogo('tipos-estado');
    if (!tipos) return;
    this.servicio.listar(tipos).subscribe({
      next: (l) => (this.tiposEstado = l.map((t) => ({ numero: Number(t.tipoEstado), nombre: String(t.nombreTipo || '') }))),
      error: () => (this.tiposEstado = [])
    });
  }

  esNumero(c: CampoCatalogo): boolean {
    return c.tipo === 'entero' || c.tipo === 'decimal';
  }

  soloLectura(c: CampoCatalogo): boolean {
    return c.tipo === 'codigo' && this.modoEdicion;
  }

  alEscribirCodigo(c: CampoCatalogo): void {
    this.registro[c.nombre] = codigoLimpio(this.registro[c.nombre]);
  }

  guardar(): void {
    if (this.guardando) return;
    const datos = camposDe(this.def, this.registro);
    const faltan = faltantes(this.def, datos, !this.modoEdicion);
    if (faltan.length) {
      this.avisos.getAlertError(`${traducir('COMMON.CHECK_FORM_SOME_REQUIRED_FIELDS_ARE')}: ${faltan.map((k) => traducir(k)).join(', ')}`);
      return;
    }
    this.guardando = true;
    const peticion = this.modoEdicion ? this.servicio.modificar(this.def, this.id, datos) : this.servicio.crear(this.def, datos);
    peticion.subscribe({
      next: () => {
        this.guardando = false;
        const msg = traducir(this.modoEdicion ? 'COMMON.RECORD_UPDATED_SUCCESSFULLY' : 'COMMON.RECORD_INSERTED_SUCCESSFULLY');
        this.logs.postCrearRegistro({ codigoTipoLog: '', codigoRespuesta: '201', descripcionLog: `${traducir(this.def.titulo)}: ${msg}` }).subscribe({ error: () => undefined });
        this.avisos.getAlertSuccess(msg);
        this.volver();
      },
      error: (e) => {
        this.guardando = false;
        const campos = (e?.error?.details || e?.error?.errores || []).map((x: any) => x.mensaje).filter(Boolean);
        this.avisos.getAlertError(
          campos.length && e?.status === 400
            ? campos.join(' ')
            : e?.error?.msg || traducir(this.modoEdicion ? 'COMMON.COULD_NOT_UPDATE_RECORD' : 'COMMON.COULD_NOT_INSERT_RECORD')
        );
      }
    });
  }

  volver(): void {
    this.router.navigate(['utilidades/catalogos', this.def.clave]);
  }

  toggleNav(): void {
    this.toggleSidebar.emit();
  }
}
