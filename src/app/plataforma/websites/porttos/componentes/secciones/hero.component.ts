/*
    Author: German Valencia
    Pattern: PORTTOS Componente de sección - Portal (OT-010)
    Description: Sección «hero»: antetítulo, título, subtítulo, enlace principal y los elementos con dirección como botones
      secundarios. Fondo: la imagen de la sección o, si no trae, la ilustración del puerto.
*/
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { SeccionPortal } from 'src/app/plataforma/websites/porttos/nucleo';
import { EnlaceComponent } from '../enlace.component';

@Component({
  selector: 'pp-seccion-hero',
  standalone: true,
  imports: [EnlaceComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="hero" [class.hero--grande]="grande" [style.--hero-fondo]="fondoCss">
      <div class="contenedor hero__contenido">
        @if (s.antetitulo) { <p class="antetitulo">{{ s.antetitulo }}</p> }
        @if (s.titulo) { <h1 class="hero__titulo">{{ s.titulo }}</h1> }
        @if (s.subtitulo) { <p class="hero__subtitulo">{{ s.subtitulo }}</p> }
        <div class="acciones">
          @if (s.enlace) { <pp-enlace [url]="s.enlace.url" clase="boton boton--primario">{{ s.enlace.texto }}</pp-enlace> }
          @for (e of s.elementos; track $index) {
            @if (e.url && e.titulo) { <pp-enlace [url]="e.url" clase="boton boton--secundario">{{ e.titulo }}</pp-enlace> }
          }
        </div>
      </div>
    </section>`,
})
export class SeccionHeroComponent {
  @Input({ required: true }) s!: SeccionPortal;
  @Input() grande = false;
  readonly fondo = 'assets/images/porttos/fondo-puerto.svg';
  /** url("…") con comillas escapadas: una dirección de la base con espacios o paréntesis no rompe el estilo. */
  get fondoCss(): string { return `url("${String(this.s?.imagen || this.fondo).replace(/["\\\n\r]/g, (c) => encodeURIComponent(c))}")`; }
}
