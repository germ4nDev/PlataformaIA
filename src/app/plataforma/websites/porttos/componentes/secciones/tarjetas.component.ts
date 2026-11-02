/*
    Author: German Valencia
    Pattern: PORTTOS Componente de sección - Portal (OT-010)
    Description: Sección «tarjetas»: encabezado y tarjetas con ícono, etiqueta (valor), título y texto; el color pinta el acento.
*/
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { SeccionPortal } from 'src/app/plataforma/websites/porttos/nucleo';
import { IconoComponent } from '../icono.component';
import { EncabezadoSeccionComponent } from './encabezado-seccion.component';

@Component({
  selector: 'pp-seccion-tarjetas',
  standalone: true,
  imports: [IconoComponent, EncabezadoSeccionComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="bloque">
      <div class="contenedor">
        <pp-encabezado-seccion [s]="s" />
        <div class="rejilla rejilla--tarjetas">
          @for (e of s.elementos; track $index) {
            <article class="tarjeta" [style.--acento]="e.color || null">
              @if (e.icono) { <span class="tarjeta__icono"><pp-icono [nombre]="e.icono" /></span> }
              @if (e.valor) { <p class="tarjeta__etiqueta">{{ e.valor }}</p> }
              @if (e.titulo) { <h3 class="tarjeta__titulo">{{ e.titulo }}</h3> }
              @if (e.texto) { <p class="tarjeta__texto">{{ e.texto }}</p> }
            </article>
          }
        </div>
      </div>
    </section>`,
})
export class SeccionTarjetasComponent {
  @Input({ required: true }) s!: SeccionPortal;
}
