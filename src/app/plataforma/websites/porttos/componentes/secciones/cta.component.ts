/*
    Author: German Valencia
    Pattern: PORTTOS Componente de sección - Portal (OT-010)
    Description: Sección «cta»: llamado a la acción en un panel, con el enlace principal y los elementos como botones secundarios.
*/
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { SeccionPortal } from 'src/app/plataforma/websites/porttos/nucleo';
import { EnlaceComponent } from '../enlace.component';

@Component({
  selector: 'pp-seccion-cta',
  standalone: true,
  imports: [EnlaceComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="bloque">
      <div class="contenedor">
        <div class="cta">
          @if (s.antetitulo) { <p class="antetitulo">{{ s.antetitulo }}</p> }
          @if (s.titulo) { <h2 class="cta__titulo">{{ s.titulo }}</h2> }
          @if (s.subtitulo) { <p class="cta__texto">{{ s.subtitulo }}</p> }
          <div class="acciones acciones--centro">
            @if (s.enlace) { <pp-enlace [url]="s.enlace.url" clase="boton boton--primario">{{ s.enlace.texto }}</pp-enlace> }
            @for (e of s.elementos; track $index) {
              @if (e.url && e.titulo) { <pp-enlace [url]="e.url" clase="boton boton--secundario">{{ e.titulo }}</pp-enlace> }
            }
          </div>
        </div>
      </div>
    </section>`,
})
export class SeccionCtaComponent {
  @Input({ required: true }) s!: SeccionPortal;
}
