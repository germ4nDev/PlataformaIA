/*
    Author: German Valencia
    Pattern: PLATAFORMA Componente - Utilidades › Pestañas › gestión (CC-203; patrón de los módulos de administración, regla 19)
    Description: crea y edita una pestaña de tablero. El código no cambia al editar. La suite sale de la aplicación elegida; el tipo,
    de los tipos activos. Ícono = nombre neutro (barco, camion…) que cada aplicación dibuja; color en hexadecimal. Se envía el registro
    completo armado por el núcleo (camposDePestana); si falta algo se nombran los campos y no se llama al API.
*/
import { Component, EventEmitter, OnInit, Output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { Observable, catchError, forkJoin, map, of } from 'rxjs';
import { SharedModule } from 'src/app/theme/shared/shared.module';
import { NavBarComponent } from 'src/app/theme/layout/admin/nav-bar/nav-bar.component';
import { NavContentComponent } from 'src/app/theme/layout/admin/navigation/nav-content/nav-content.component';
import { NavigationService } from 'src/app/theme/shared/service/navigation.service';
import { NavigationItem } from 'src/app/theme/shared/_helpers/models/Navigation.model';
import { SwalAlertService } from 'src/app/theme/shared/service/swal-alert.service';
import { AppPermisoDirective } from 'src/app/theme/shared/directive/app-permiso.directive';
import { PtlAplicacionesService } from 'src/app/theme/shared/service/ptlaplicaciones.service';
import { PtlSuitesAPService } from 'src/app/theme/shared/service/ptlsuites-ap.service';
import { PtlPestanasAdminService } from 'src/app/theme/shared/service/ptlpestanas-admin.service';
import { PtllogActividadesService } from 'src/app/theme/shared/service/ptllog-actividades.service';
import { traducir } from 'src/app/theme/shared/i18n/traducir';
import { TextEditorComponent } from 'src/app/theme/shared/components/text-editor/text-editor.component';
import { ICONOS_SUGERIDOS, PestanaAdmin, TipoPestana, camposDePestana, faltantesPestana, pestanaNueva } from '../../nucleo';

@Component({
  selector: 'app-gestion-pestana',
  imports: [CommonModule, FormsModule, SharedModule, TranslateModule, NavBarComponent, NavContentComponent, AppPermisoDirective, TextEditorComponent],
  templateUrl: './gestion-pestana.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './gestion-pestana.component.scss'
})
export class GestionPestanaComponent implements OnInit {
  @Output() toggleSidebar = new EventEmitter<void>();
  menuItems!: Observable<NavigationItem[]>;
  modoEdicion = false;
  enviado = false;
  guardando = false;
  tipoEditorTexto = 'basica';
  readonly iconos = ICONOS_SUGERIDOS;

  pestana: PestanaAdmin = pestanaNueva();
  aplicaciones: { codigoAplicacion: string; nombreAplicacion: string }[] = [];
  private suites: { codigoSuite: string; codigoAplicacion: string; nombreSuite: string }[] = [];
  tipos: TipoPestana[] = [];

  constructor(
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly navegacion: NavigationService,
    private readonly avisos: SwalAlertService,
    private readonly aplicacionesSrv: PtlAplicacionesService,
    private readonly suitesSrv: PtlSuitesAPService,
    private readonly pestanas: PtlPestanasAdminService,
    private readonly logs: PtllogActividadesService
  ) {}

  ngOnInit(): void {
    this.navegacion.getNavigationItems();
    this.menuItems = this.navegacion.menuItems$;
    const codigo = this.route.snapshot.queryParamMap.get('pestana');
    forkJoin({
      apps: this.aplicacionesSrv.getAplicaciones().pipe(map((r: any) => r?.aplicaciones || []), catchError(() => of([]))),
      suites: this.suitesSrv.geSuitesAP().pipe(map((r: any) => r?.suites || []), catchError(() => of([]))),
      tipos: this.pestanas.listarTipos().pipe(catchError(() => of([] as TipoPestana[]))),
      pestana: codigo ? this.pestanas.obtener(codigo) : of(null)
    }).subscribe({
      next: ({ apps, suites, tipos, pestana }) => {
        this.aplicaciones = (apps as any[]).map((a) => ({ codigoAplicacion: a.codigoAplicacion, nombreAplicacion: a.nombreAplicacion }));
        this.suites = (suites as any[]).map((s) => ({ codigoSuite: s.codigoSuite, codigoAplicacion: s.codigoAplicacion, nombreSuite: s.nombreSuite }));
        this.tipos = tipos;
        if (pestana) {
          this.modoEdicion = true;
          this.pestana = { ...pestanaNueva(), ...pestana };
        }
      },
      error: () => this.avisos.getAlertError(traducir('UTILIDADES.PESTANAS.COULD_NOT_GET_TABS'))
    });
  }

  get suitesDeLaAplicacion() {
    return this.suites.filter((s) => s.codigoAplicacion === this.pestana.codigoAplicacion);
  }

  /** Tipos activos y, si está editando, también el que ya tiene aunque esté inactivo. */
  get tiposDisponibles(): TipoPestana[] {
    return this.tipos.filter((t) => t.estado || t.codigoTipo === this.pestana.codigoTipoPestana);
  }

  alCambiarAplicacion(): void {
    if (!this.suitesDeLaAplicacion.some((s) => s.codigoSuite === this.pestana.codigoSuite)) {
      const unica = this.suitesDeLaAplicacion.length === 1 ? this.suitesDeLaAplicacion[0].codigoSuite : '';
      this.pestana.codigoSuite = unica;
    }
  }

  alEscribirCodigo(): void {
    this.pestana.codigoPestana = (this.pestana.codigoPestana || '').toUpperCase().replace(/[^A-Z0-9_]/g, '_');
  }

  get colorValido(): string {
    return /^#([0-9a-f]{6})$/i.test(this.pestana.color || '') ? (this.pestana.color as string) : '#000000';
  }

  actualizarDescripcion(contenido: string): void {
    this.pestana.descripcion = contenido;
  }

  guardar(): void {
    this.enviado = true;
    if (this.guardando) return;
    const datos = camposDePestana(this.pestana);
    const faltan = faltantesPestana(datos);
    if (faltan.length) {
      this.avisos.getAlertError(`${traducir('COMMON.CHECK_FORM_SOME_REQUIRED_FIELDS_ARE')}: ${faltan.map((k) => traducir(k)).join(', ')}`);
      return;
    }
    this.guardando = true;
    const peticion = this.modoEdicion ? this.pestanas.modificar(datos.codigoPestana, datos) : this.pestanas.crear(datos);
    peticion.subscribe({
      next: () => {
        this.guardando = false;
        const msg = traducir(this.modoEdicion ? 'UTILIDADES.PESTANAS.GESTION.TAB_UPDATED' : 'UTILIDADES.PESTANAS.GESTION.TAB_CREATED');
        this.logs.postCrearRegistro({ codigoTipoLog: '', codigoRespuesta: '201', descripcionLog: msg }).subscribe({ error: () => undefined });
        this.avisos.getAlertSuccess(msg);
        this.volver();
      },
      error: (e) => {
        this.guardando = false;
        const campos = (e?.error?.details || e?.error?.errores || []).map((d: any) => d.mensaje).filter(Boolean);
        this.avisos.getAlertError(campos.length ? campos.join(' ') : e?.error?.msg || traducir('UTILIDADES.PESTANAS.GESTION.COULD_NOT_SAVE_TAB'));
      }
    });
  }

  volver(): void {
    this.router.navigate(['utilidades/pestanas']);
  }

  toggleNav(): void {
    this.toggleSidebar.emit();
  }
}
