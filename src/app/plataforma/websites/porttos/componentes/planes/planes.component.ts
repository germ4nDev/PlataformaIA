import { TranslateModule } from '@ngx-translate/core';
/*
    Author: German Valencia
    Pattern: PORTTOS Componente - Portal porttos.co dentro de la web (OT-010)
    Description: Planes y precios: selector mensual/anual, una tarjeta por plan (precio con precioDePlan, características y
      «Solicitar este plan» → Contáctenos con motivo ACCESO), comparativo con desplazamiento horizontal y, mientras algún plan
      sea simulado, el rótulo SIMULADO y el aviso de valores de referencia (datos honestos).
*/
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Periodo, PlanPortal, PlanesPortal, RUTA_PORTAL, precioDePlan } from 'src/app/plataforma/websites/porttos/nucleo';
import { IconoComponent } from '../icono/icono.component';

@Component({
  selector: 'pp-planes',
  standalone: true,
  imports: [TranslateModule, RouterLink, IconoComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './planes.component.html',
  styleUrl: './planes.component.scss',
})
export class PlanesComponent {
  @Input({ required: true }) datos!: PlanesPortal;
  periodo: Periodo = 'mensual';
  readonly contacto = `${RUTA_PORTAL}/contacto`;
  precio(p: PlanPortal) { return precioDePlan(p, this.periodo); }
  nombre(codigo: string): string { return this.datos.planes.find((p) => p.codigo === codigo)?.nombre || codigo; }
}
