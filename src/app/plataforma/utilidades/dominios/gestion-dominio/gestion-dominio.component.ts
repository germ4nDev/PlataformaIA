/*
    Author: German Valencia
    Pattern: PLATAFORMA Componente - Utilidades › Dominios › gestión (CC-224, regla 19)
    Description: dominio (sin https:// ni ruta; único), tipo (consola o aplicación), aplicación y suite (la suite según la aplicación),
      ruta del portal (raíz sin sesión), ruta de inicio, nombre y logo de la marca (imagen subida: upload/<suscriptor>/dominios/<archivo>),
      descripción y estado. El API valida las reglas (núcleo utils/dominios); al guardar, el API toma el cambio al instante (caché y CORS).
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
import { LocalStorageService } from 'src/app/theme/shared/service/local-storage.service';
import { UploadFilesService } from 'src/app/theme/shared/service/upload-files.service';
import { PtlAplicacionesService } from 'src/app/theme/shared/service/ptlaplicaciones.service';
import { PtlSuitesAPService } from 'src/app/theme/shared/service/ptlsuites-ap.service';
import { PtlDominiosService, Dominio } from 'src/app/theme/shared/service/ptldominios.service';
import { TextEditorComponent } from 'src/app/theme/shared/components/text-editor/text-editor.component';
import { traducir } from 'src/app/theme/shared/i18n/traducir';
import { logoDeMarca } from 'src/app/plataforma/dominios/nucleo';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-gestion-dominio',
  imports: [CommonModule, FormsModule, SharedModule, TranslateModule, NavBarComponent, NavContentComponent, AppPermisoDirective, TextEditorComponent],
  templateUrl: './gestion-dominio.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './gestion-dominio.component.scss'
})
export class GestionDominioComponent implements OnInit {
  @Output() toggleSidebar = new EventEmitter<void>();
  menuItems!: Observable<NavigationItem[]>;
  modoEdicion = false;
  guardando = false;
  subiendo = false;
  id: number | null = null;
  aplicaciones: { codigoAplicacion: string; nombreAplicacion: string }[] = [];
  private suites: { codigoSuite: string; codigoAplicacion: string; nombreSuite: string }[] = [];
  d: Dominio = {
    dominio: '', tipo: 'aplicacion', codigoAplicacion: null, codigoSuite: null, rutaPortal: null, rutaInicio: null,
    nombreMarca: null, logoMarca: null, descripcion: '', estado: true
  };

  constructor(
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly navegacion: NavigationService,
    private readonly avisos: SwalAlertService,
    private readonly almacen: LocalStorageService,
    private readonly archivos: UploadFilesService,
    private readonly aplicacionesService: PtlAplicacionesService,
    private readonly suitesService: PtlSuitesAPService,
    private readonly dominios: PtlDominiosService
  ) {}

  ngOnInit(): void {
    this.navegacion.getNavigationItems();
    this.menuItems = this.navegacion.menuItems$;
    this.aplicacionesService.cargarAplicaciones().subscribe({
      next: (l: any[]) => (this.aplicaciones = (l || []).map((a) => ({ codigoAplicacion: a.codigoAplicacion, nombreAplicacion: a.nombreAplicacion }))),
      error: () => (this.aplicaciones = [])
    });
    this.suitesService.cargarRegistros().subscribe({ next: (l: any[]) => (this.suites = l || []), error: () => (this.suites = []) });
    const id = this.route.snapshot.queryParamMap.get('id');
    if (id) {
      this.modoEdicion = true;
      this.id = Number(id);
      this.dominios.obtener(id).subscribe({
        next: (d) => (this.d = { ...d, descripcion: d.descripcion || '' }),
        error: () => this.avisos.getAlertError(traducir('UTILIDADES.DOMINIOS.COULD_NOT_GET_DOMAINS'))
      });
    }
  }

  /** Las suites de la aplicación elegida */
  get suitesDeApp() {
    return this.suites.filter((s) => s.codigoAplicacion === this.d.codigoAplicacion);
  }

  get esAplicacion(): boolean {
    return this.d.tipo === 'aplicacion';
  }

  /** Cómo se verá el logo en el login del dominio (la misma regla del núcleo) */
  get logoVista(): string | null {
    return logoDeMarca(this.d.logoMarca, environment.apiUrl);
  }

  alCambiarAplicacion(): void {
    if (!this.suitesDeApp.some((s) => s.codigoSuite === this.d.codigoSuite)) this.d.codigoSuite = null;
    if (!this.d.nombreMarca) this.d.nombreMarca = this.aplicaciones.find((a) => a.codigoAplicacion === this.d.codigoAplicacion)?.nombreAplicacion || null;
  }

  alSubirLogo(ev: any): void {
    const archivo: File | undefined = ev?.target?.files?.[0];
    if (!archivo) return;
    const susc = this.almacen.getSuscriptorPlataformaLocalStorage();
    this.subiendo = true;
    this.archivos.uploadUserPhoto(archivo, { susc, tipo: 'dominios' } as any).subscribe({
      next: (r: any) => {
        this.subiendo = false;
        const nombre = r?.data?.respuesta?.fileName;
        if (nombre) this.d.logoMarca = `upload/${susc}/dominios/${nombre}`;
      },
      error: () => {
        this.subiendo = false;
        this.avisos.getAlertError(traducir('COMMON.ERROR_UPLOADING_IMAGE'));
      }
    });
  }

  quitarLogo(): void {
    this.d.logoMarca = null;
  }

  alCambiarDescripcion(html: string): void {
    this.d.descripcion = html;
  }

  guardar(): void {
    if (this.guardando) return;
    this.guardando = true;
    const datos: Partial<Dominio> = { ...this.d, codigoAplicacion: this.esAplicacion ? this.d.codigoAplicacion : null, codigoSuite: this.esAplicacion ? this.d.codigoSuite : null };
    const pedido = this.modoEdicion && this.id ? this.dominios.modificar(this.id, datos) : this.dominios.crear(datos);
    pedido.subscribe({
      next: () => {
        this.guardando = false;
        this.avisos.getAlertSuccess(traducir(this.modoEdicion ? 'UTILIDADES.DOMINIOS.GESTION.DOMAIN_UPDATED' : 'UTILIDADES.DOMINIOS.GESTION.DOMAIN_CREATED'));
        this.volver();
      },
      error: (e) => {
        this.guardando = false;
        this.avisos.getAlertError(e?.error?.msg || traducir('UTILIDADES.DOMINIOS.GESTION.COULD_NOT_SAVE_DOMAIN'));
      }
    });
  }

  volver(): void {
    this.router.navigate(['utilidades/dominios']);
  }

  toggleNav(): void {
    this.toggleSidebar.emit();
  }
}
