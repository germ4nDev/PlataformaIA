import { TranslateModule } from '@ngx-translate/core';
/*
    Author: German Valencia
    Pattern: PORTTOS Componente de sección - Portal (OT-010)
    Description: Sección «tarjetas»: encabezado y tarjetas con ícono, etiqueta (valor), título y texto; el color pinta el acento.
*/
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { SeccionPortal } from 'src/app/plataforma/websites/porttos/nucleo';
import { IconoComponent } from '../../icono/icono.component';
import { EncabezadoSeccionComponent } from '../encabezado-seccion/encabezado-seccion.component';

@Component({
  selector: 'pp-seccion-tarjetas',
  imports: [TranslateModule, IconoComponent, EncabezadoSeccionComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './tarjetas.component.html',
  styleUrl: './tarjetas.component.scss'
})
export class SeccionTarjetasComponent {
  @Input({ required: true }) s!: SeccionPortal;
}
