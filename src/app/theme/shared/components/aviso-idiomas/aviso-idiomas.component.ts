/*
    Author: German Valencia
    Pattern: PLATAFORMA Componente compartido - Aviso de idiomas activos sin textos (CC-215, regla única de idiomas)
    Description: Lo usan Utilidades › Traducciones y el editor del portal (Porttos). Muestra los idiomas activos en el maestro que no
      tienen archivo de traducción; con permiso ACT_TRAD_MODIFICAR los crea traducidos por la IA (en segundo plano) y muestra el avance
      cada 4 s. Sin traductor ofrece crearlos copiando el español. Emite (cambio) cuando un idioma termina o se crea.
*/
import { Component, EventEmitter, OnDestroy, OnInit, Output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { AppPermisoDirective } from 'src/app/theme/shared/directive/app-permiso.directive';
import { SwalAlertService } from 'src/app/theme/shared/service/swal-alert.service';
import { EstadoIdiomas, PtlTraduccionesService, hayTraduccionEnCurso } from 'src/app/theme/shared/service/ptltraducciones.service';
import { traducir } from 'src/app/theme/shared/i18n/traducir';

@Component({
  selector: 'app-aviso-idiomas',
  imports: [CommonModule, TranslateModule, AppPermisoDirective],
  templateUrl: './aviso-idiomas.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './aviso-idiomas.component.scss'
})
export class AvisoIdiomasComponent implements OnInit, OnDestroy {
  @Output() cambio = new EventEmitter<EstadoIdiomas>();
  estado: EstadoIdiomas | null = null;
  enviando = false;
  private sub?: Subscription;

  constructor(
    private readonly traducciones: PtlTraduccionesService,
    private readonly avisos: SwalAlertService
  ) {}

  ngOnInit(): void {
    this.seguir();
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  get pendientes() {
    return this.estado?.sinArchivo || [];
  }

  get enCurso(): boolean {
    return hayTraduccionEnCurso(this.estado);
  }

  get nombresPendientes(): string {
    return this.pendientes.map((x) => x.nombre || x.sigla.toUpperCase()).join(', ');
  }

  porcentaje(hechas: number, total: number): number {
    return total ? Math.round((100 * hechas) / total) : 0;
  }

  private seguir(): void {
    this.sub?.unsubscribe();
    this.sub = this.traducciones.seguirTraduccion().subscribe({
      next: (e) => {
        const antes = this.estado;
        this.estado = e;
        if (hayTraduccionEnCurso(antes) && !hayTraduccionEnCurso(e)) this.terminado(antes as EstadoIdiomas, e);
      },
      error: () => (this.estado = null)
    });
  }

  /** Solo los idiomas que se estaban traduciendo en la vuelta anterior */
  private terminado(antes: EstadoIdiomas, e: EstadoIdiomas): void {
    const seguian = new Set(antes.sinArchivo.filter((x) => x.trabajo?.estado === 'traduciendo').map((x) => x.sigla));
    const listos = Object.entries(e.trabajos || {}).filter(([sigla, t]) => seguian.has(sigla) && t?.estado === 'listo');
    if (listos.length) {
      const texto = listos
        .map(([sigla, t]) =>
          traducir('SHARED.AVISO_IDIOMAS.LANGUAGE_CREATED_TRANSLATED', { idioma: e.nombres[sigla] || sigla.toUpperCase(), traducidas: t.total - t.sinTraducir, sinTraducir: t.sinTraducir })
        )
        .join(' ');
      this.avisos.getAlertSuccess(texto);
    }
    this.cambio.emit(e);
  }

  crear(modo?: 'espanol'): void {
    if (this.enviando) return;
    this.enviando = true;
    this.traducciones.sincronizarIdiomas(modo).subscribe({
      next: (r) => {
        this.enviando = false;
        if (r.creados.length) {
          this.avisos.getAlertConfirmSuccess(traducir('SHARED.AVISO_IDIOMAS.LANGUAGE_FILES_CREATED', { idiomas: r.creados.join(', ') }));
          this.seguir();
          this.cambio.emit(this.estado as EstadoIdiomas);
          return;
        }
        if (r.enCurso.length) this.avisos.getAlertInfo(traducir('SHARED.AVISO_IDIOMAS.AI_TRANSLATION_STARTED'));
        this.seguir();
      },
      error: (e) => {
        this.enviando = false;
        this.avisos.getAlertError(e?.error?.msg || traducir('SHARED.AVISO_IDIOMAS.COULD_NOT_CREATE_LANGUAGE_FILES'));
      }
    });
  }
}
