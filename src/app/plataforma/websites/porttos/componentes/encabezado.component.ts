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
import { DispositivoPortalService } from '../dispositivo-portal.service';
import { IconoComponent } from './icono.component';
import { EnlaceComponent } from './enlace.component';

export const MENU: readonly { ruta: string; etiqueta: string }[] = [
    { ruta: RUTA_PORTAL, etiqueta: 'Inicio' },
    { ruta: `${RUTA_PORTAL}/solucion`, etiqueta: 'La solución' },
    { ruta: `${RUTA_PORTAL}/app`, etiqueta: 'App móvil' },
    { ruta: `${RUTA_PORTAL}/perfiles`, etiqueta: 'Para quién' },
    { ruta: `${RUTA_PORTAL}/puertos`, etiqueta: 'Puertos en vivo' },
    { ruta: `${RUTA_PORTAL}/gobierno`, etiqueta: 'Sector público' },
    { ruta: `${RUTA_PORTAL}/planes`, etiqueta: 'Planes' },
    { ruta: `${RUTA_PORTAL}/mision`, etiqueta: 'Nosotros' },
    { ruta: `${RUTA_PORTAL}/contacto`, etiqueta: 'Contáctenos' },
];

@Component({
    selector: 'pp-encabezado',
    standalone: true,
    imports: [RouterLink, RouterLinkActive, IconoComponent, EnlaceComponent],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
    <header class="encabezado">
      <div class="contenedor encabezado__barra">
        <a [routerLink]="inicio" class="encabezado__logo" aria-label="Porttos, ir al inicio">
          <img src="assets/images/porttos/porttos-principal-negativo.png" alt="Porttos" width="132" height="36" />
        </a>
        <button type="button" class="encabezado__menu-boton" [attr.aria-label]="abierto ? 'Cerrar menú' : 'Abrir menú'" [attr.aria-expanded]="abierto" aria-controls="menu-principal"
                (click)="abierto = !abierto">
          <pp-icono [nombre]="abierto ? 'cerrar' : 'menu'" />
        </button>
        <nav id="menu-principal" class="encabezado__nav" [class.abierto]="abierto" aria-label="Principal">
          <ul role="list">
            @for (i of menu; track i.ruta) {
              <li><a [routerLink]="i.ruta" routerLinkActive="activo" [routerLinkActiveOptions]="{ exact: i.ruta === inicio }"
                     ariaCurrentWhenActive="page" (click)="abierto = false">{{ i.etiqueta }}</a></li>
            }
          </ul>
          <div class="encabezado__acciones">
            @if (movil) {
              @if (accion; as a) {
                @if (a.tienda) {
                  <a class="boton boton--acento" [href]="a.tienda" target="_blank" rel="noopener">{{ a.texto }}</a>
                } @else {
                  <a class="boton boton--acento" [routerLink]="seccionApp.ruta" (click)="abierto = false">{{ a.texto }}</a>
                }
              }
            } @else if (config?.rutaIngreso) {
              <pp-enlace [url]="config?.rutaIngreso" base="" clase="boton boton--fantasma">Iniciar sesión</pp-enlace>
            }
            <a class="boton boton--primario" [routerLink]="contacto" [queryParams]="{ motivo: 'ACCESO' }" (click)="abierto = false">Solicitar acceso</a>
          </div>
        </nav>
      </div>
    </header>`,
})
export class EncabezadoComponent {
    private readonly dispositivo = inject(DispositivoPortalService);
    readonly movil = this.dispositivo.movil;
    readonly seccionApp = SECCION_APP;
    accion = accionMovil(null, this.dispositivo.sistema);
    private c: ConfigPortal | null = null;
    @Input() set config(v: ConfigPortal | null) { this.c = v; this.accion = accionMovil(v, this.dispositivo.sistema); this.menu = menuDe(MENU, v); }
    get config(): ConfigPortal | null { return this.c; }
    menu = menuDe(MENU, null);   // Planes solo con planesActivos = '1' (CC-106)
    readonly inicio = RUTA_PORTAL;
    readonly contacto = `${RUTA_PORTAL}/contacto`;
    abierto = false;
}
