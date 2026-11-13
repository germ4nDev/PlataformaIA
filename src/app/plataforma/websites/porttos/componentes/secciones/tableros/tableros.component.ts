import { TranslateModule } from '@ngx-translate/core';
/*
    Author: German Valencia
    Pattern: PORTTOS Componente de sección - Portal (OT-010)
    Description: Sección «tableros»: los tableros de la torre de control con su ícono y color, y el enlace de la sección.
*/
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { SeccionPortal } from 'src/app/plataforma/websites/porttos/nucleo';
import { IconoComponent } from '../../icono/icono.component';
import { EnlaceComponent } from '../../enlace/enlace.component';
import { EncabezadoSeccionComponent } from '../encabezado-seccion/encabezado-seccion.component';

@Component({
  selector: 'pp-seccion-tableros',
  imports: [TranslateModule, IconoComponent, EnlaceComponent, EncabezadoSeccionComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './tableros.component.html',
  styleUrl: './tableros.component.scss'
})
export class SeccionTablerosComponent {
  @Input({ required: true }) s!: SeccionPortal;
}
