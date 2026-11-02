/*
    Author: German Valencia
    Pattern: PORTTOS Componente - Portal porttos.co dentro de la web (OT-010)
    Description: Pie del portal: logo, texto del pie y correo de contacto (de la configuración), botones de las tiendas de la app,
      menú, «Iniciar sesión» (solo en escritorio, CC-103) y año.
*/
import { ChangeDetectionStrategy, Component, Input, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ConfigPortal, menuDe } from 'src/app/plataforma/websites/porttos/nucleo';
import { MENU } from './encabezado.component';
import { EnlaceComponent } from './enlace.component';
import { TiendasComponent } from './tiendas.component';
import { DispositivoPortalService } from '../dispositivo-portal.service';

@Component({
    selector: 'pp-pie',
    standalone: true,
    imports: [RouterLink, EnlaceComponent, TiendasComponent],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
    <footer class="pie">
      <div class="contenedor pie__rejilla">
        <div>
          <img src="assets/images/porttos/porttos-principal-negativo.png" alt="Porttos" width="132" height="36" loading="lazy" />
          @if (config?.textoPie) { <p class="pie__texto">{{ config?.textoPie }}</p> }
          @if (config?.correoContacto) { <a class="pie__correo" [href]="'mailto:' + config?.correoContacto">{{ config?.correoContacto }}</a> }
          <p class="pie__app">App móvil</p>
          <pp-tiendas [config]="config" [compactas]="true" />
        </div>
        <nav aria-label="Pie de página">
          <ul role="list" class="pie__menu">
            @for (i of menu; track i.ruta) { <li><a [routerLink]="i.ruta">{{ i.etiqueta }}</a></li> }
            @if (!movil && config?.rutaIngreso) { <li><pp-enlace [url]="config?.rutaIngreso" base="">Iniciar sesión</pp-enlace></li> }
          </ul>
        </nav>
      </div>
      <p class="contenedor pie__legal">© {{ anio }} Porttos</p>
    </footer>`,
})
export class PieComponent {
    @Input() config: ConfigPortal | null = null;
    get menu() { return menuDe(MENU, this.config); }   // Planes solo con planesActivos = '1' (CC-106)
    readonly anio = new Date().getFullYear();
    readonly movil = inject(DispositivoPortalService).movil;
}
