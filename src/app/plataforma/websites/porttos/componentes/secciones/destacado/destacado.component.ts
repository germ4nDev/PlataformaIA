import { TranslateModule } from '@ngx-translate/core';
/*
    Author: German Valencia
    Pattern: PORTTOS Componente de sección - Portal (OT-010, OT-011)
    Description: Sección «destacado». Los elementos sin dirección son la lista de puntos y van con las tres pantallas al lado
      (dibujo decorativo, sin datos); los que traen dirección son botones secundarios. Sin lista de puntos es una banda
      (p. ej. «Sector público» en Inicio): texto a la izquierda y botones a la derecha, sin pantallas.
*/
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { SeccionPortal } from 'src/app/plataforma/websites/porttos/nucleo';
import { IconoComponent } from '../../icono/icono.component';
import { EnlaceComponent } from '../../enlace/enlace.component';

@Component({
  selector: 'pp-seccion-destacado',
  standalone: true,
  imports: [TranslateModule, IconoComponent, EnlaceComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './destacado.component.html',
  styleUrl: './destacado.component.scss',
})
export class SeccionDestacadoComponent {
  @Input({ required: true }) s!: SeccionPortal;
  get puntos() { return this.s.elementos.filter((e) => !e.url && (e.titulo || e.texto)); }
  get botones() { return this.s.elementos.filter((e) => !!e.url && !!e.titulo); }
}
