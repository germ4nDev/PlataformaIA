/*
    Author: German Valencia
    Pattern: PORTTOS Componente de sección - Portal (OT-010)
    Description: Encabezado común de las secciones: antetítulo, título (h2) y subtítulo, si vienen.
*/
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { SeccionPortal } from 'src/app/plataforma/websites/porttos/nucleo';

@Component({
  selector: 'pp-encabezado-seccion',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './encabezado-seccion.component.html',
  styleUrl: './encabezado-seccion.component.scss',
})
export class EncabezadoSeccionComponent {
  @Input({ required: true }) s!: SeccionPortal;
}
