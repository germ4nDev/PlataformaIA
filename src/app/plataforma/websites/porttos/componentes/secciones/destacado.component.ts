/*
    Author: German Valencia
    Pattern: PORTTOS Componente de sección - Portal (OT-010, OT-011)
    Description: Sección «destacado». Los elementos sin dirección son la lista de puntos y van con las tres pantallas al lado
      (dibujo decorativo, sin datos); los que traen dirección son botones secundarios. Sin lista de puntos es una banda
      (p. ej. «Sector público» en Inicio): texto a la izquierda y botones a la derecha, sin pantallas.
*/
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { SeccionPortal } from 'src/app/plataforma/websites/porttos/nucleo';
import { IconoComponent } from '../icono.component';
import { EnlaceComponent } from '../enlace.component';

@Component({
  selector: 'pp-seccion-destacado',
  standalone: true,
  imports: [IconoComponent, EnlaceComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (puntos.length) {
      <section class="bloque">
        <div class="contenedor destacado">
          <div class="destacado__texto">
            @if (s.antetitulo) { <p class="antetitulo">{{ s.antetitulo }}</p> }
            @if (s.titulo) { <h2 class="titulo-seccion">{{ s.titulo }}</h2> }
            @if (s.subtitulo) { <p class="subtitulo-seccion">{{ s.subtitulo }}</p> }
            <ul class="lista-check" role="list">
              @for (e of puntos; track $index) {
                <li><span class="lista-check__marca"><pp-icono nombre="check" [tamano]="18" /></span>{{ e.titulo || e.texto }}</li>
              }
            </ul>
            <div class="acciones">
              @if (s.enlace) { <pp-enlace [url]="s.enlace.url" clase="boton boton--primario">{{ s.enlace.texto }}</pp-enlace> }
              @for (e of botones; track $index) { <pp-enlace [url]="e.url" clase="boton boton--secundario">{{ e.titulo }}</pp-enlace> }
            </div>
          </div>
          <div class="pantallas" aria-hidden="true">
            <div class="pantalla pantalla--web"><i></i><i></i><i></i><i></i><i></i><i></i></div>
            <div class="pantalla pantalla--tableta"><i></i><i></i><i></i><i></i></div>
            <div class="pantalla pantalla--telefono"><i></i><i></i><i></i></div>
          </div>
        </div>
      </section>
    } @else {
      <section class="bloque bloque--banda">
        <div class="contenedor">
          <div class="banda">
            <div class="banda__texto">
              @if (s.antetitulo) { <p class="antetitulo">{{ s.antetitulo }}</p> }
              @if (s.titulo) { <h2 class="titulo-seccion">{{ s.titulo }}</h2> }
              @if (s.subtitulo) { <p class="subtitulo-seccion">{{ s.subtitulo }}</p> }
            </div>
            <div class="acciones">
              @if (s.enlace) { <pp-enlace [url]="s.enlace.url" clase="boton boton--acento">{{ s.enlace.texto }}</pp-enlace> }
              @for (e of botones; track $index) { <pp-enlace [url]="e.url" clase="boton boton--secundario">{{ e.titulo }}</pp-enlace> }
            </div>
          </div>
        </div>
      </section>
    }`,
})
export class SeccionDestacadoComponent {
  @Input({ required: true }) s!: SeccionPortal;
  get puntos() { return this.s.elementos.filter((e) => !e.url && (e.titulo || e.texto)); }
  get botones() { return this.s.elementos.filter((e) => !!e.url && !!e.titulo); }
}
