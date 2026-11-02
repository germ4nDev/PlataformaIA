/*
    Author: German Valencia
    Pattern: PORTTOS Componente de sección - Portal (OT-010)
    Description: Encabezado común de las secciones: antetítulo, título (h2) y subtítulo, si vienen.
*/
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { SeccionPortal } from 'src/app/plataforma/websites/porttos/nucleo';

@Component({
  selector: 'pp-encabezado-seccion',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (s.antetitulo || s.titulo || s.subtitulo) {
      <header class="encabezado-seccion">
        @if (s.antetitulo) { <p class="antetitulo">{{ s.antetitulo }}</p> }
        @if (s.titulo) { <h2 class="titulo-seccion">{{ s.titulo }}</h2> }
        @if (s.subtitulo) { <p class="subtitulo-seccion">{{ s.subtitulo }}</p> }
      </header>
    }`,
})
export class EncabezadoSeccionComponent {
  @Input({ required: true }) s!: SeccionPortal;
}
