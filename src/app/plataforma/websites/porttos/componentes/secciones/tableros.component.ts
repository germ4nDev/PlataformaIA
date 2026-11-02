/*
    Author: German Valencia
    Pattern: PORTTOS Componente de sección - Portal (OT-010)
    Description: Sección «tableros»: los tableros de la torre de control con su ícono y color, y el enlace de la sección.
*/
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { SeccionPortal } from 'src/app/plataforma/websites/porttos/nucleo';
import { IconoComponent } from '../icono.component';
import { EnlaceComponent } from '../enlace.component';
import { EncabezadoSeccionComponent } from './encabezado-seccion.component';

@Component({
  selector: 'pp-seccion-tableros',
  standalone: true,
  imports: [IconoComponent, EnlaceComponent, EncabezadoSeccionComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="bloque bloque--alterno">
      <div class="contenedor">
        <pp-encabezado-seccion [s]="s" />
        <ul class="rejilla rejilla--tableros" role="list">
          @for (e of s.elementos; track $index) {
            <li class="tablero" [style.--acento]="e.color || null">
              <span class="tablero__icono"><pp-icono [nombre]="e.icono" /></span>
              <div>
                @if (e.titulo) { <h3 class="tablero__titulo">{{ e.titulo }}</h3> }
                @if (e.texto) { <p class="tablero__texto">{{ e.texto }}</p> }
              </div>
            </li>
          }
        </ul>
        @if (s.enlace) {
          <p class="bloque__pie"><pp-enlace [url]="s.enlace.url" clase="enlace-flecha">{{ s.enlace.texto }} →</pp-enlace></p>
        }
      </div>
    </section>`,
})
export class SeccionTablerosComponent {
  @Input({ required: true }) s!: SeccionPortal;
}
