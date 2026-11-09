/*
    Author: German Valencia
    Pattern: PORTTOS Componente de sección - Portal (OT-010)
    Description: Sección «cifras»: valor grande y su texto. Las cifras calculadas (tableros, puertos) ya llegan del maestro
      o no llegan (el API omite el elemento): aquí no se completa nada.
*/
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { SeccionPortal } from 'src/app/plataforma/websites/porttos/nucleo';

@Component({
  selector: 'pp-seccion-cifras',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './cifras.component.html',
  styleUrl: './cifras.component.scss',
})
export class SeccionCifrasComponent {
  @Input({ required: true }) s!: SeccionPortal;
}
