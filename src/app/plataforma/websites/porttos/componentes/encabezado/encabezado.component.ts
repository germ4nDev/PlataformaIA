import { TranslateModule } from '@ngx-translate/core';
/*
    Author: German Valencia
    Pattern: PORTTOS Componente - Portal porttos.co dentro de la web (OT-010, OT-011)
    Description: Encabezado del portal (no el menú de la plataforma): logo, las ocho páginas (menú del lienzo, OT-011), «Iniciar
      sesión» (rutaIngreso de la configuración: el login que ya existe; sin ella no se muestra) y «Solicitar acceso» (Contáctenos
      con motivo ACCESO: no hay registro abierto). Por debajo de 1440 px (nueve páginas desde CC-105) el menú se abre con un botón y se cierra al navegar.
      En un teléfono o una tableta (CC-103) no hay «Iniciar sesión»: en su lugar va el botón de la app (accionMovil: la tienda
      del equipo o, sin enlace aún, la página «App móvil», CC-105).
*/
import { ChangeDetectionStrategy, Component, Input, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { ConfigPortal, RUTA_PORTAL, SECCION_APP, accionMovil, menuDe } from 'src/app/plataforma/websites/porttos/nucleo';
import { DispositivoPortalService } from '../../dispositivo-portal.service';
import { IconoComponent } from '../icono/icono.component';
import { EnlaceComponent } from '../enlace/enlace.component';

export const MENU: readonly { ruta: string; etiqueta: string }[] = [
  { ruta: RUTA_PORTAL, etiqueta: 'COMMON.HOME' },
  { ruta: `${RUTA_PORTAL}/solucion`, etiqueta: 'WEBSITES.PORTTOS.COMPONENTES.ENCABEZADO.SOLUTION' },
  { ruta: `${RUTA_PORTAL}/app`, etiqueta: 'WEBSITES.PORTTOS.MOBILE_APP' },
  { ruta: `${RUTA_PORTAL}/perfiles`, etiqueta: 'WEBSITES.PORTTOS.COMPONENTES.ENCABEZADO.WHO_ITS' },
  { ruta: `${RUTA_PORTAL}/puertos`, etiqueta: 'WEBSITES.PORTTOS.COMPONENTES.ENCABEZADO.LIVE_PORTS' },
  { ruta: `${RUTA_PORTAL}/gobierno`, etiqueta: 'WEBSITES.PORTTOS.COMPONENTES.ENCABEZADO.PUBLIC_SECTOR' },
  { ruta: `${RUTA_PORTAL}/planes`, etiqueta: 'WEBSITES.PORTTOS.COMPONENTES.ENCABEZADO.PLANS' },
  { ruta: `${RUTA_PORTAL}/mision`, etiqueta: 'WEBSITES.PORTTOS.COMPONENTES.ENCABEZADO.ABOUT_US' },
  { ruta: `${RUTA_PORTAL}/contacto`, etiqueta: 'WEBSITES.PORTTOS.COMPONENTES.ENCABEZADO.CONTACT_US' }
];

@Component({
  selector: 'pp-encabezado',
  imports: [TranslateModule, RouterLink, RouterLinkActive, IconoComponent, EnlaceComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './encabezado.component.html',
  styleUrl: './encabezado.component.scss'
})
export class EncabezadoComponent {
  private readonly dispositivo = inject(DispositivoPortalService);
  readonly movil = this.dispositivo.movil;
  readonly seccionApp = SECCION_APP;
  accion = accionMovil(null, this.dispositivo.sistema);
  private c: ConfigPortal | null = null;
  @Input() set config(v: ConfigPortal | null) {
    this.c = v;
    this.accion = accionMovil(v, this.dispositivo.sistema);
    this.menu = menuDe(MENU, v);
  }
  get config(): ConfigPortal | null {
    return this.c;
  }
  menu = menuDe(MENU, null); // Planes solo con planesActivos = '1' (CC-106)
  readonly inicio = RUTA_PORTAL;
  readonly contacto = `${RUTA_PORTAL}/contacto`;
  abierto = false;
}
