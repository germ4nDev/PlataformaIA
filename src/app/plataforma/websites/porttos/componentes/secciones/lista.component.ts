/*
    Author: German Valencia
    Pattern: PORTTOS Componente de sección - Portal (OT-010, OT-011)
    Description: Sección «lista»: encabezado y una lista de puntos en forma de fichas (fuentes, beneficios) y, si la sección
      trae enlace, el botón debajo (p. ej. «En la plataforma, además» de Puertos en vivo).
*/
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { SeccionPortal } from 'src/app/plataforma/websites/porttos/nucleo';
import { IconoComponent } from '../icono.component';
import { EnlaceComponent } from '../enlace.component';
import { EncabezadoSeccionComponent } from './encabezado-seccion.component';

@Component({
  selector: 'pp-seccion-lista',
  standalone: true,
  imports: [IconoComponent, EnlaceComponent, EncabezadoSeccionComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="bloque bloque--alterno">
      <div class="contenedor">
        <pp-encabezado-seccion [s]="s" />
        <ul class="fichas" role="list">
          @for (e of s.elementos; track $index) {
            <li class="ficha"><pp-icono [nombre]="e.icono || 'check'" [tamano]="18" />{{ e.titulo || e.texto }}</li>
          }
        </ul>
        @if (s.enlace) {
          <div class="acciones acciones--arriba"><pp-enlace [url]="s.enlace.url" clase="boton boton--acento">{{ s.enlace.texto }}</pp-enlace></div>
        }
      </div>
    </section>`,
})
export class SeccionListaComponent {
  @Input({ required: true }) s!: SeccionPortal;
}
