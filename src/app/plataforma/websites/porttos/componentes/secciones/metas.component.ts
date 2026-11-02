/*
    Author: German Valencia
    Pattern: PORTTOS Componente de sección - Portal (OT-011)
    Description: Sección «metas» (Sector público): metas de la política logística. Del elemento: titulo = indicador, detalle = línea
      base de la política (tachada y rotulada: no es un valor de hoy), valor = meta, texto = qué mide Porttos. El cuerpo de la
      sección es la fuente y se muestra debajo.
*/
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { SeccionPortal } from 'src/app/plataforma/websites/porttos/nucleo';
import { IconoComponent } from '../icono.component';
import { EncabezadoSeccionComponent } from './encabezado-seccion.component';

@Component({
  selector: 'pp-seccion-metas',
  standalone: true,
  imports: [IconoComponent, EncabezadoSeccionComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="bloque">
      <div class="contenedor">
        <pp-encabezado-seccion [s]="s" />
        <div class="rejilla rejilla--metas">
          @for (e of s.elementos; track $index) {
            <article class="meta">
              @if (e.titulo) { <h3 class="meta__indicador">{{ e.titulo }}</h3> }
              <div class="meta__cifras">
                @if (e.detalle) {
                  <p class="meta__par"><span class="meta__rotulo">Línea base</span><span class="meta__desde">{{ e.detalle }}</span></p>
                  <span class="meta__flecha" aria-hidden="true"><pp-icono nombre="flecha" [tamano]="22" /></span>
                }
                @if (e.valor) { <p class="meta__par"><span class="meta__rotulo">Meta</span><strong class="meta__hasta">{{ e.valor }}</strong></p> }
              </div>
              @if (e.texto) { <p class="meta__mide">{{ e.texto }}</p> }
            </article>
          }
        </div>
        @if (s.cuerpo) { <p class="nota-fuente">{{ s.cuerpo }}</p> }
      </div>
    </section>`,
})
export class SeccionMetasComponent {
  @Input({ required: true }) s!: SeccionPortal;
}
