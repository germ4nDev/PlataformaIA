import { TranslateModule } from '@ngx-translate/core';
/*
    Author: German Valencia
    Pattern: PORTTOS Componente - Portal porttos.co dentro de la web (OT-010)
    Description: Pie del portal: logo, texto del pie y correo de contacto (de la configuración), botones de las tiendas de la app,
      menú, «Iniciar sesión» (solo en escritorio, CC-103) y año.
*/
import { ChangeDetectionStrategy, Component, Input, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ConfigPortal, menuDe } from 'src/app/plataforma/websites/porttos/nucleo';
import { MENU } from '../encabezado/encabezado.component';
import { EnlaceComponent } from '../enlace/enlace.component';
import { TiendasComponent } from '../tiendas/tiendas.component';
import { DispositivoPortalService } from '../../dispositivo-portal.service';

@Component({
  selector: 'pp-pie',
  imports: [TranslateModule, RouterLink, EnlaceComponent, TiendasComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './pie.component.html',
  styleUrl: './pie.component.scss'
})
export class PieComponent {
  @Input() config: ConfigPortal | null = null;
  get menu() {
    return menuDe(MENU, this.config);
  } // Planes solo con planesActivos = '1' (CC-106)
  readonly anio = new Date().getFullYear();
  readonly movil = inject(DispositivoPortalService).movil;
}
