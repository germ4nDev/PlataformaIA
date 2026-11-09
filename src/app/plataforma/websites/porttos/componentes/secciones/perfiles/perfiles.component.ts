import { TranslateModule } from '@ngx-translate/core';
/*
    Author: German Valencia
    Pattern: PORTTOS Componente de sección - Portal (OT-011)
    Description: Sección «perfiles» (Para quién): una tarjeta por actor del puerto. Del elemento: titulo = perfil, detalle = lo que
      le preocupa, texto = lo que ve en Porttos, color = borde superior, valor = plan recomendado (código de TCL_PortalPlanes) o la
      propuesta que le toca, url = destino (accionDePerfil).
*/
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { PlanPortal, SeccionPortal, accionDePerfil } from 'src/app/plataforma/websites/porttos/nucleo';
import { IconoComponent } from '../../icono/icono.component';
import { EnlaceComponent } from '../../enlace/enlace.component';
import { EncabezadoSeccionComponent } from '../encabezado-seccion/encabezado-seccion.component';

@Component({
  selector: 'pp-seccion-perfiles',
  standalone: true,
  imports: [TranslateModule, IconoComponent, EnlaceComponent, EncabezadoSeccionComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './perfiles.component.html',
  styleUrl: './perfiles.component.scss',
})
export class SeccionPerfilesComponent {
  @Input({ required: true }) s!: SeccionPortal;
  @Input() planes: readonly PlanPortal[] = [];
  accion(e: SeccionPortal['elementos'][number]) { return accionDePerfil(e, this.planes); }
}
