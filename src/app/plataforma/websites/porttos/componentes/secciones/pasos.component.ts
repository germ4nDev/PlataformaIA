/*
    Author: German Valencia
    Pattern: PORTTOS Componente de sección - Portal (OT-010, OT-011)
    Description: Sección «pasos»: pasos numerados unidos por una línea. Dos formas, según el valor del elemento (esNumeroDePaso):
      - número («01») o vacío: el número en el recuadro (o su posición);
      - fecha («Ene a mar 2027», la ruta del Gobierno): la fecha arriba, la fase numerada desde 0 y el texto «a · b · c» como
        lista de puntos. Icono 'destacado' = la fase resaltada. El cuerpo de la sección es una nota al pie.
*/
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { SeccionPortal, esNumeroDePaso, puntosDe } from 'src/app/plataforma/websites/porttos/nucleo';
import { EncabezadoSeccionComponent } from './encabezado-seccion.component';

@Component({
  selector: 'pp-seccion-pasos',
  standalone: true,
  imports: [EncabezadoSeccionComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="bloque">
      <div class="contenedor">
        <pp-encabezado-seccion [s]="s" />
        <ol class="pasos" [class.pasos--fechas]="conFechas" role="list">
          @for (e of s.elementos; track $index) {
            @if (conFechas) {
              <li class="fase" [class.fase--destacada]="e.icono === 'destacado'">
                @if (e.valor) { <p class="fase__fecha">{{ e.valor }}</p> }
                @if (e.titulo) { <h3 class="fase__titulo">{{ $index }}. {{ e.titulo }}</h3> }
                @if (puntos(e.texto).length > 1) {
                  <ul class="fase__puntos">@for (p of puntos(e.texto); track $index) { <li>{{ p }}</li> }</ul>
                } @else if (e.texto) { <p class="paso__texto">{{ e.texto }}</p> }
              </li>
            } @else {
              <li class="paso">
                <span class="paso__numero" aria-hidden="true">{{ e.valor || ($index + 1) }}</span>
                @if (e.titulo) { <h3 class="paso__titulo">{{ e.titulo }}</h3> }
                @if (e.texto) { <p class="paso__texto">{{ e.texto }}</p> }
              </li>
            }
          }
        </ol>
        @if (s.cuerpo) { <p class="nota-fuente">{{ s.cuerpo }}</p> }
      </div>
    </section>`,
})
export class SeccionPasosComponent {
  @Input({ required: true }) s!: SeccionPortal;
  /** Fechas si algún paso trae un valor que no es número. */
  get conFechas(): boolean { return this.s.elementos.some((e) => !!e.valor && !esNumeroDePaso(e.valor)); }
  puntos(t: string | null) { return puntosDe(t); }
}
