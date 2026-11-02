/*
    Author: German Valencia
    Pattern: PORTTOS Componente - Portal porttos.co (CC-103)
    Description: Botones de las tiendas de la app móvil (Google Play y App Store), la del equipo primero. El enlace sale de la
      configuración (urlAndroid, urlIos); sin enlace la tienda se muestra como «Próximamente en…», sin enlace (nada inventado).
      No usa los logotipos de las marcas: ícono propio y el nombre de la tienda.
*/
import { ChangeDetectionStrategy, Component, Input, inject } from '@angular/core';
import { ConfigPortal, TiendaApp, tiendasDe } from 'src/app/plataforma/websites/porttos/nucleo';
import { DispositivoPortalService } from '../dispositivo-portal.service';
import { IconoComponent } from './icono.component';

@Component({
  selector: 'pp-tiendas',
  standalone: true,
  imports: [IconoComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ul class="tiendas" [class.tiendas--compactas]="compactas" role="list">
      @for (t of tiendas; track t.sistema) {
        <li>
          @if (t.url) {
            <a class="tienda" [class.tienda--propia]="t.propia" [href]="t.url" target="_blank" rel="noopener">
              <pp-icono nombre="descargar" [tamano]="compactas ? 18 : 22" />
              <span><small>Disponible en</small>{{ t.nombre }}</span>
            </a>
          } @else {
            <span class="tienda tienda--proxima" [class.tienda--propia]="t.propia">
              <pp-icono nombre="telefono" [tamano]="compactas ? 18 : 22" />
              <span><small>Próximamente en</small>{{ t.nombre }}</span>
            </span>
          }
        </li>
      }
    </ul>`,
})
export class TiendasComponent {
  private readonly sistema = inject(DispositivoPortalService).sistema;
  @Input() compactas = false;
  tiendas: TiendaApp[] = tiendasDe(null, this.sistema);
  @Input() set config(c: ConfigPortal | null | undefined) { this.tiendas = tiendasDe(c, this.sistema); }
}
