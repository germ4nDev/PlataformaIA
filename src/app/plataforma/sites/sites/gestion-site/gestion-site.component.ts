/*
    Author: German Valencia
    Pattern: PLATAFORMA Componente - Sitios › gestión (OT-036 fase 2, CC-207; regla 19)
    Description: código (no cambia al editar), aplicación, nombre, dirección pública, puerto, ruta donde la aplicación administra el
    contenido (la declara su manifiesto en websites[].administracion), descripción y estado. Se envía el registro limpio (camposDeSitio).
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
import { PTLSitiosAPService } from 'src/app/theme/shared/service/ptlsitios-ap.service';
import { PtlAplicacionesService } from 'src/app/theme/shared/service/ptlaplicaciones.service';
import { traducir } from 'src/app/theme/shared/i18n/traducir';
import { Sitio, camposDeSitio, faltantesSitio, sitioVacio } from '../sitios-nucleo';

@Component({
  selector: 'app-gestion-site',
  imports: [CommonModule, FormsModule, SharedModule, TranslateModule, NavBarComponent, NavContentComponent, AppPermisoDirective],
  templateUrl: './gestion-site.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './gestion-site.component.scss'
})
export class GestionSiteComponent implements OnInit {
  @Output() toggleSidebar = new EventEmitter<void>();
  menuItems!: Observable<NavigationItem[]>;
  modoEdicion = false;
  guardando = false;
  sitio: Sitio = sitioVacio();
  aplicaciones: { codigoAplicacion: string; nombreAplicacion: string }[] = [];

  constructor(
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly navegacion: NavigationService,
    private readonly avisos: SwalAlertService,
    private readonly sitios: PTLSitiosAPService,
    private readonly apps: PtlAplicacionesService
  ) {}

  ngOnInit(): void {
    this.navegacion.getNavigationItems();
    this.menuItems = this.navegacion.menuItems$;
    this.apps.getAplicaciones().subscribe({
      next: (r: any) => (this.aplicaciones = (r?.aplicaciones || []).map((a: any) => ({ codigoAplicacion: a.codigoAplicacion, nombreAplicacion: a.nombreAplicacion }))),
      error: () => (this.aplicaciones = [])
    });
    const codigo = this.route.snapshot.queryParamMap.get('sitio');
    if (codigo) {
      this.modoEdicion = true;
      this.sitios.obtener(codigo).subscribe({
        next: (s) => (this.sitio = { ...this.sitio, ...s, estadoSitio: s?.estadoSitio === true || (s?.estadoSitio as any) === 1 }),
        error: () => this.avisos.getAlertError(traducir('SITES.COULD_NOT_GET_SITE'))
      });
    }
  }

  alEscribirCodigo(): void {
    this.sitio.codigoSitio = (this.sitio.codigoSitio || '').toUpperCase().replace(/[^A-Z0-9_]/g, '_');
  }

  guardar(): void {
    if (this.guardando) return;
    const datos = camposDeSitio(this.sitio);
    const faltan = faltantesSitio(datos, !this.modoEdicion);
    if (faltan.length) {
      this.avisos.getAlertError(`${traducir('COMMON.CHECK_FORM_SOME_REQUIRED_FIELDS_ARE')}: ${faltan.map((k) => traducir(k)).join(', ')}`);
      return;
    }
    this.guardando = true;
    const peticion = this.modoEdicion ? this.sitios.modificar(this.sitio.codigoSitio, datos) : this.sitios.crear(datos);
    peticion.subscribe({
      next: () => {
        this.guardando = false;
        this.avisos.getAlertSuccess(traducir(this.modoEdicion ? 'COMMON.RECORD_UPDATED_SUCCESSFULLY' : 'COMMON.RECORD_INSERTED_SUCCESSFULLY'));
        this.volver();
      },
      error: (e) => {
        this.guardando = false;
        const campos = (e?.error?.details || []).map((d: any) => d.mensaje).filter(Boolean);
        this.avisos.getAlertError(
          campos.length && e?.status === 400 ? campos.join(' ') : e?.error?.msg || traducir(this.modoEdicion ? 'COMMON.COULD_NOT_UPDATE_RECORD' : 'COMMON.COULD_NOT_INSERT_RECORD')
        );
      }
    });
  }

  volver(): void {
    this.router.navigate(['/sites/sites']);
  }

  toggleNav(): void {
    this.toggleSidebar.emit();
  }
}
