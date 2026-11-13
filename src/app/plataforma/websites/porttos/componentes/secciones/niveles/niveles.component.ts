import { TranslateModule } from '@ngx-translate/core';
/*
    Author: German Valencia
    Pattern: PORTTOS Componente de sección - Portal (OT-011)
    Description: Sección «niveles» (Sector público): formas de participar, de menor a mayor alcance. Del elemento: titulo,
      detalle = qué hace el Gobierno, texto = qué recibe, valor = instrumento; icono 'destacado' = el de mayor valor (insignia).
*/
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { SeccionPortal } from 'src/app/plataforma/websites/porttos/nucleo';
import { EncabezadoSeccionComponent } from '../encabezado-seccion/encabezado-seccion.component';

@Component({
  selector: 'pp-seccion-niveles',
  imports: [TranslateModule, EncabezadoSeccionComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './niveles.component.html',
  styleUrl: './niveles.component.scss'
})
export class SeccionNivelesComponent {
  @Input({ required: true }) s!: SeccionPortal;
}
