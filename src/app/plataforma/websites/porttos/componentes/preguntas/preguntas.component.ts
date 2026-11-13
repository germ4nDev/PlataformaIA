import { TranslateModule } from '@ngx-translate/core';
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
  imports: [TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './preguntas.component.html',
  styleUrl: './preguntas.component.scss'
})
export class PreguntasComponent {
  @Input() preguntas: PreguntaPortal[] = [];
}
