import { TranslateModule } from '@ngx-translate/core';
/*
    Author: German Valencia
    Pattern: PORTTOS Componente de sección - Portal (OT-010)
    Description: Sección «cta»: llamado a la acción en un panel, con el enlace principal y los elementos como botones secundarios.
*/
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { SeccionPortal } from 'src/app/plataforma/websites/porttos/nucleo';
import { EnlaceComponent } from '../../enlace/enlace.component';

@Component({
  selector: 'pp-seccion-cta',
  imports: [TranslateModule, EnlaceComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './cta.component.html',
  styleUrl: './cta.component.scss'
})
export class SeccionCtaComponent {
  @Input({ required: true }) s!: SeccionPortal;
}
