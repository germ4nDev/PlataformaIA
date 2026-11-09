import { TranslateModule } from '@ngx-translate/core';
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
import { IconoComponent } from '../../icono/icono.component';
import { EnlaceComponent } from '../../enlace/enlace.component';
import { TiendasComponent } from '../../tiendas/tiendas.component';

@Component({
  selector: 'pp-seccion-app',
  standalone: true,
  imports: [TranslateModule, IconoComponent, EnlaceComponent, TiendasComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
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
