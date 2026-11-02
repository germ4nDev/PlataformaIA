/*
    Author: German Valencia
    Pattern: PORTTOS Componente de sección - Portal (OT-011)
    Description: Sección «perfiles» (Para quién): una tarjeta por actor del puerto. Del elemento: titulo = perfil, detalle = lo que
      le preocupa, texto = lo que ve en Porttos, color = borde superior, valor = plan recomendado (código de TCL_PortalPlanes) o la
      propuesta que le toca, url = destino (accionDePerfil).
*/
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { PlanPortal, SeccionPortal, accionDePerfil } from 'src/app/plataforma/websites/porttos/nucleo';
import { IconoComponent } from '../icono.component';
import { EnlaceComponent } from '../enlace.component';
import { EncabezadoSeccionComponent } from './encabezado-seccion.component';

@Component({
  selector: 'pp-seccion-perfiles',
  standalone: true,
  imports: [IconoComponent, EnlaceComponent, EncabezadoSeccionComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="bloque bloque--pegado">
      <div class="contenedor">
        <pp-encabezado-seccion [s]="s" />
        <div class="rejilla rejilla--perfiles">
          @for (e of s.elementos; track $index) {
            <article class="perfil" [style.--color-perfil]="e.color || null">
              <div class="perfil__cabeza">
                @if (e.icono) { <span class="perfil__icono"><pp-icono [nombre]="e.icono" /></span> }
                @if (e.titulo) { <h3 class="perfil__titulo">{{ e.titulo }}</h3> }
              </div>
              @if (e.detalle) {
                <div class="perfil__bloque"><p class="perfil__rotulo perfil__rotulo--preocupa">Lo que le preocupa</p><p>{{ e.detalle }}</p></div>
              }
              @if (e.texto) {
                <div class="perfil__bloque"><p class="perfil__rotulo">Lo que ve en Porttos</p><p>{{ e.texto }}</p></div>
              }
              @if (accion(e); as a) {
                <pp-enlace [url]="a.url" clase="perfil__accion">{{ a.texto }} <span aria-hidden="true">→</span></pp-enlace>
              }
            </article>
          }
        </div>
      </div>
    </section>`,
})
export class SeccionPerfilesComponent {
  @Input({ required: true }) s!: SeccionPortal;
  @Input() planes: readonly PlanPortal[] = [];
  accion(e: SeccionPortal['elementos'][number]) { return accionDePerfil(e, this.planes); }
}
