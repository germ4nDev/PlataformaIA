import { TranslateModule } from '@ngx-translate/core';
/*
    Author: German Valencia
    Pattern: PORTTOS Componente de sección - Portal (OT-010, OT-011)
    Description: Sección «pasos»: pasos numerados unidos por una línea. Dos formas, según el valor del elemento (esNumeroDePaso):
      - número («01») o vacío: el número en el recuadro (o su posición);
      - fecha («Ene a mar 2027», la ruta del Gobierno): la fecha arriba, la fase numerada desde 0 y el texto «a · b · c» como
        lista de puntos. Icono 'destacado' = la fase resaltada. El cuerpo de la sección es una nota al pie.
*/
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { SeccionPortal, esNumeroDePaso, puntosDe } from 'src/app/plataforma/websites/porttos/nucleo';
import { EncabezadoSeccionComponent } from '../encabezado-seccion/encabezado-seccion.component';

@Component({
  selector: 'pp-seccion-pasos',
  imports: [TranslateModule, EncabezadoSeccionComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './pasos.component.html',
  styleUrl: './pasos.component.scss'
})
export class SeccionPasosComponent {
  @Input({ required: true }) s!: SeccionPortal;
  /** Fechas si algún paso trae un valor que no es número. */
  get conFechas(): boolean {
    return this.s.elementos.some((e) => !!e.valor && !esNumeroDePaso(e.valor));
  }
  puntos(t: string | null) {
    return puntosDe(t);
  }
}
