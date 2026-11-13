import { TranslateModule } from '@ngx-translate/core';
/*
    Author: German Valencia
    Pattern: PORTTOS Componente - Portal porttos.co (CC-103)
    Description: Botones de las tiendas de la app móvil (Google Play y App Store), la del equipo primero. El enlace sale de la
      configuración (urlAndroid, urlIos); sin enlace la tienda se muestra como «Próximamente en…», sin enlace (nada inventado).
      No usa los logotipos de las marcas: ícono propio y el nombre de la tienda.
*/
import { ChangeDetectionStrategy, Component, Input, inject } from '@angular/core';
import { ConfigPortal, TiendaApp, tiendasDe } from 'src/app/plataforma/websites/porttos/nucleo';
import { DispositivoPortalService } from '../../dispositivo-portal.service';
import { IconoComponent } from '../icono/icono.component';

@Component({
  selector: 'pp-tiendas',
  imports: [TranslateModule, IconoComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './tiendas.component.html',
  styleUrl: './tiendas.component.scss'
})
export class TiendasComponent {
  private readonly sistema = inject(DispositivoPortalService).sistema;
  @Input() compactas = false;
  tiendas: TiendaApp[] = tiendasDe(null, this.sistema);
  @Input() set config(c: ConfigPortal | null | undefined) {
    this.tiendas = tiendasDe(c, this.sistema);
  }
}
