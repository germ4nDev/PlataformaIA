/*
    Author: German Valencia
    Pattern: PORTTOS Componente de sección - Portal (OT-011)
    Description: Sección «niveles» (Sector público): formas de participar, de menor a mayor alcance. Del elemento: titulo,
      detalle = qué hace el Gobierno, texto = qué recibe, valor = instrumento; icono 'destacado' = el de mayor valor (insignia).
*/
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { SeccionPortal } from 'src/app/plataforma/websites/porttos/nucleo';
import { EncabezadoSeccionComponent } from './encabezado-seccion.component';

@Component({
  selector: 'pp-seccion-niveles',
  standalone: true,
  imports: [EncabezadoSeccionComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="bloque">
      <div class="contenedor">
        <pp-encabezado-seccion [s]="s" />
        <ol class="rejilla rejilla--niveles" role="list">
          @for (e of s.elementos; track $index) {
            <li class="nivel" [class.nivel--destacado]="e.icono === 'destacado'">
              @if (e.icono === 'destacado') { <span class="nivel__insignia">El de mayor valor</span> }
              <p class="nivel__numero">Nivel {{ $index + 1 }}</p>
              @if (e.titulo) { <h3 class="nivel__titulo">{{ e.titulo }}</h3> }
              @if (e.detalle) { <div><p class="perfil__rotulo">El Gobierno</p><p class="nivel__texto">{{ e.detalle }}</p></div> }
              @if (e.texto) { <div><p class="perfil__rotulo">Recibe</p><p class="nivel__texto">{{ e.texto }}</p></div> }
              @if (e.valor) { <p class="nivel__instrumento">{{ e.valor }}</p> }
            </li>
          }
        </ol>
        @if (s.cuerpo) { <p class="nota-fuente">{{ s.cuerpo }}</p> }
      </div>
    </section>`,
})
export class SeccionNivelesComponent {
  @Input({ required: true }) s!: SeccionPortal;
}
