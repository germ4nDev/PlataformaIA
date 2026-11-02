/*
    Author: German Valencia
    Pattern: PORTTOS Componente de sección - Portal porttos.co (CC-103)
    Description: Sección «app»: la aplicación móvil y sus ventajas. Texto y botones de las tiendas a un lado, un teléfono dibujado
      (decorativo, sin datos) al otro y las ventajas en tarjetas (ícono, título, texto; `valor` es la etiqueta, p. ej. «Próximamente»
      para lo que la app aún no hace). Lleva el ancla #app: el botón «App móvil» del encabezado llega aquí.
*/
import { AfterViewInit, ChangeDetectionStrategy, Component, DestroyRef, ElementRef, Input, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { ConfigPortal, SECCION_APP, SeccionPortal } from 'src/app/plataforma/websites/porttos/nucleo';
import { IconoComponent } from '../icono.component';
import { EnlaceComponent } from '../enlace.component';
import { TiendasComponent } from '../tiendas.component';

@Component({
  selector: 'pp-seccion-app',
  standalone: true,
  imports: [IconoComponent, EnlaceComponent, TiendasComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="bloque bloque--app" [attr.id]="ancla" tabindex="-1">
      <div class="contenedor">
        <div class="app">
          <div class="app__texto">
            @if (s.antetitulo) { <p class="antetitulo">{{ s.antetitulo }}</p> }
            @if (s.titulo) { <h2 class="titulo-seccion">{{ s.titulo }}</h2> }
            @if (s.subtitulo) { <p class="subtitulo-seccion">{{ s.subtitulo }}</p> }
            <pp-tiendas [config]="config" />
            @if (s.cuerpo) { <p class="app__nota">{{ s.cuerpo }}</p> }
            @if (s.enlace) { <pp-enlace [url]="s.enlace.url" clase="boton boton--secundario">{{ s.enlace.texto }}</pp-enlace> }
          </div>
          <div class="app__telefono" aria-hidden="true">
            <div class="telefono">
              <span class="telefono__barra"></span>
              <span class="telefono__kpi"></span><span class="telefono__kpi"></span>
              <span class="telefono__grafica"></span>
              <span class="telefono__lista"></span>
              <span class="telefono__menu"><i></i><i></i><i></i><i></i></span>
            </div>
          </div>
        </div>
        @if (s.elementos.length) {
          <div class="rejilla rejilla--ventajas">
            @for (e of s.elementos; track $index) {
              <article class="tarjeta tarjeta--ventaja" [class.tarjeta--proxima]="!!e.valor" [style.--acento]="e.color || null">
                @if (e.icono) { <span class="tarjeta__icono"><pp-icono [nombre]="e.icono" /></span> }
                @if (e.valor) { <p class="tarjeta__etiqueta">{{ e.valor }}</p> }
                @if (e.titulo) { <h3 class="tarjeta__titulo">{{ e.titulo }}</h3> }
                @if (e.texto) { <p class="tarjeta__texto">{{ e.texto }}</p> }
              </article>
            }
          </div>
        }
      </div>
    </section>`,
})
export class SeccionAppComponent implements AfterViewInit {
  @Input({ required: true }) s!: SeccionPortal;
  @Input() config: ConfigPortal | null = null;
  readonly ancla = SECCION_APP.ancla;
  private readonly ruta = inject(ActivatedRoute);
  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);

  private readonly destruir = inject(DestroyRef);

  /**
   * Con #app en la dirección se baja hasta aquí (el portal se desplaza en su contenedor, no en la ventana). Se escucha el
   * fragmento y no solo el de llegada: el botón «App móvil» del encabezado puede tocarse estando ya en la página.
   */
  ngAfterViewInit(): void {
    this.ruta.fragment.pipe(takeUntilDestroyed(this.destruir)).subscribe((f) => {
      if (f !== this.ancla) return;
      setTimeout(() => {
        const seccion = (this.el.nativeElement as HTMLElement).querySelector('section');
        seccion?.scrollIntoView({ block: 'start' });
        seccion?.focus({ preventScroll: true });
      });
    });
  }
}
