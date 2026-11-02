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
  template: `
    @if (s.elementos.length) {
      <section class="cifras" [attr.aria-label]="s.titulo || null">
        <div class="contenedor cifras__rejilla">
          @for (e of s.elementos; track $index) {
            <div class="cifra"><span class="cifra__valor">{{ e.valor }}</span><span class="cifra__texto">{{ e.texto }}</span></div>
          }
        </div>
      </section>
    }`,
})
export class SeccionCifrasComponent {
  @Input({ required: true }) s!: SeccionPortal;
}
