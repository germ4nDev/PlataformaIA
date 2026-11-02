/*
    Author: German Valencia
    Pattern: PORTTOS Componente - Portal porttos.co dentro de la web (OT-010)
    Description: Preguntas frecuentes de la página (TCL_PortalPreguntas), como acordeón nativo (details/summary: teclado y
      lector de pantalla sin código extra). Sin preguntas no se pinta nada.
*/
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { PreguntaPortal } from 'src/app/plataforma/websites/porttos/nucleo';

@Component({
  selector: 'pp-preguntas',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (preguntas.length) {
      <section class="bloque bloque--alterno">
        <div class="contenedor contenedor--angosto">
          <h2 class="titulo-seccion titulo-seccion--centro">Preguntas frecuentes</h2>
          @for (p of preguntas; track $index) {
            <details class="pregunta"><summary>{{ p.pregunta }}</summary><p>{{ p.respuesta }}</p></details>
          }
        </div>
      </section>
    }`,
})
export class PreguntasComponent {
  @Input() preguntas: PreguntaPortal[] = [];
}
