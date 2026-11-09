import { TranslateModule } from '@ngx-translate/core';
/*
    Author: German Valencia
    Pattern: PORTTOS Componente de sección - Portal (OT-010, OT-011)
    Description: Sección «lista»: encabezado y una lista de puntos en forma de fichas (fuentes, beneficios) y, si la sección
      trae enlace, el botón debajo (p. ej. «En la plataforma, además» de Puertos en vivo).
*/
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { SeccionPortal } from 'src/app/plataforma/websites/porttos/nucleo';
import { IconoComponent } from '../../icono/icono.component';
import { EnlaceComponent } from '../../enlace/enlace.component';
import { EncabezadoSeccionComponent } from '../encabezado-seccion/encabezado-seccion.component';

@Component({
  selector: 'pp-seccion-lista',
  standalone: true,
  imports: [TranslateModule, IconoComponent, EnlaceComponent, EncabezadoSeccionComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './lista.component.html',
  styleUrl: './lista.component.scss',
})
export class SeccionListaComponent {
  @Input({ required: true }) s!: SeccionPortal;
}
