import { TranslateModule } from '@ngx-translate/core';
/*
    Author: German Valencia
    Pattern: PORTTOS Componente de sección - Portal (OT-010)
    Description: Sección «texto»: título y párrafos del cuerpo (cada salto de línea es un párrafo). Misión, visión, textos largos.
*/
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { SeccionPortal } from 'src/app/plataforma/websites/porttos/nucleo';
import { EnlaceComponent } from '../../enlace/enlace.component';

@Component({
  selector: 'pp-seccion-texto',
  imports: [TranslateModule, EnlaceComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './texto.component.html',
  styleUrl: './texto.component.scss'
})
export class SeccionTextoComponent {
  parrafos: string[] = [];
  private seccion!: SeccionPortal;
  get s(): SeccionPortal {
    return this.seccion;
  }
  @Input({ required: true }) set s(v: SeccionPortal) {
    this.seccion = v;
    this.parrafos = String(v?.cuerpo || '')
      .split(/\n+/)
      .map((x) => x.trim())
      .filter(Boolean);
  }
}
