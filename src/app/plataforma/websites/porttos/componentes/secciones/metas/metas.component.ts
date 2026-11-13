import { TranslateModule } from '@ngx-translate/core';
/*
    Author: German Valencia
    Pattern: PORTTOS Componente de sección - Portal (OT-011)
    Description: Sección «metas» (Sector público): metas de la política logística. Del elemento: titulo = indicador, detalle = línea
      base de la política (tachada y rotulada: no es un valor de hoy), valor = meta, texto = qué mide Porttos. El cuerpo de la
      sección es la fuente y se muestra debajo.
*/
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { SeccionPortal } from 'src/app/plataforma/websites/porttos/nucleo';
import { IconoComponent } from '../../icono/icono.component';
import { EncabezadoSeccionComponent } from '../encabezado-seccion/encabezado-seccion.component';

@Component({
  selector: 'pp-seccion-metas',
  imports: [TranslateModule, IconoComponent, EncabezadoSeccionComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './metas.component.html',
  styleUrl: './metas.component.scss'
})
export class SeccionMetasComponent {
  @Input({ required: true }) s!: SeccionPortal;
}
