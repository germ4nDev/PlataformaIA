/*
    Author: German Valencia
    Pattern: PORTTOS Componente de sección - Portal (OT-010)
    Description: Sección «texto»: título y párrafos del cuerpo (cada salto de línea es un párrafo). Misión, visión, textos largos.
*/
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { SeccionPortal } from 'src/app/plataforma/websites/porttos/nucleo';
import { EnlaceComponent } from '../enlace.component';

@Component({
  selector: 'pp-seccion-texto',
  standalone: true,
  imports: [EnlaceComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="bloque bloque--texto">
      <div class="contenedor texto">
        @if (s.antetitulo) { <p class="antetitulo">{{ s.antetitulo }}</p> }
        @if (s.titulo) { <h2 class="texto__titulo">{{ s.titulo }}</h2> }
        @if (s.subtitulo) { <p class="subtitulo-seccion">{{ s.subtitulo }}</p> }
        @for (p of parrafos; track $index) { <p class="texto__parrafo">{{ p }}</p> }
        @if (s.enlace) { <pp-enlace [url]="s.enlace.url" clase="enlace-flecha">{{ s.enlace.texto }} →</pp-enlace> }
      </div>
    </section>`,
})
export class SeccionTextoComponent {
  parrafos: string[] = [];
  private seccion!: SeccionPortal;
  get s(): SeccionPortal { return this.seccion; }
  @Input({ required: true }) set s(v: SeccionPortal) {
    this.seccion = v;
    this.parrafos = String(v?.cuerpo || '').split(/\n+/).map((x) => x.trim()).filter(Boolean);
  }
}
