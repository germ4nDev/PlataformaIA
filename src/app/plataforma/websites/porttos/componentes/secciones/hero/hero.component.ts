import { TranslateModule } from '@ngx-translate/core';
/*
    Author: German Valencia
    Pattern: PORTTOS Componente de sección - Portal (OT-010)
    Description: Sección «hero»: antetítulo, título, subtítulo, enlace principal y los elementos con dirección como botones
      secundarios. Fondo: la imagen de la sección o, si no trae, la ilustración del puerto.
*/
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { SeccionPortal } from 'src/app/plataforma/websites/porttos/nucleo';
import { EnlaceComponent } from '../../enlace/enlace.component';

@Component({
  selector: 'pp-seccion-hero',
  imports: [TranslateModule, EnlaceComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './hero.component.html',
  styleUrl: './hero.component.scss'
})
export class SeccionHeroComponent {
  @Input({ required: true }) s!: SeccionPortal;
  @Input() grande = false;
  readonly fondo = 'assets/images/porttos/fondo-puerto.svg';
  /** url("…") con comillas escapadas: una dirección de la base con espacios o paréntesis no rompe el estilo. */
  get fondoCss(): string {
    return `url("${String(this.s?.imagen || this.fondo).replace(/["\\\n\r]/g, (c) => encodeURIComponent(c))}")`;
  }
}
