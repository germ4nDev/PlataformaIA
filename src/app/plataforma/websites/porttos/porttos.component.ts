import { TranslateModule } from '@ngx-translate/core';
/*
    Author: German Valencia
    Pattern: PORTTOS Componente - Portal público porttos.co dentro de la web (OT-010, CC-095)
    Description: Contenedor del portal en la ruta pública websites/porttos (bajo GuestComponent, sin el layout de administración):
      encabezado y pie del portal alrededor de la página activa (rutas hijas en porttos.routes.ts). La configuración (correo,
      rutaIngreso, pie) se pide una vez; si falla, encabezado y pie salen sin esos datos (nada inventado).
      Estilos: porttos.component.scss, todos bajo la clase .pp (no tocan los estilos globales de la plataforma).
*/
import { ChangeDetectionStrategy, Component, ElementRef, ViewChild, ViewEncapsulation, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { catchError, filter, of } from 'rxjs';
import { PortalPorttosService } from 'src/app/theme/shared/service/portal-porttos.service';
import { EncabezadoComponent } from './componentes/encabezado/encabezado.component';
import { PieComponent } from './componentes/pie/pie.component';

@Component({
  selector: 'app-porttos',
  standalone: true,
  imports: [TranslateModule, AsyncPipe, RouterOutlet, EncabezadoComponent, PieComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  templateUrl: './porttos.component.html',
  styleUrl: './porttos.component.scss'
})
export class PorttosComponent {
  readonly config$ = inject(PortalPorttosService).config().pipe(catchError(() => of(null)));
  @ViewChild('contenedor', { static: true }) contenedor!: ElementRef<HTMLElement>;

  constructor() {
    // La plataforma deja html y body sin desplazamiento: el portal se desplaza en su contenedor y vuelve arriba al cambiar de página.
    // Solo si cambia la ruta: elegir otro puerto en Puertos en vivo cambia la consulta (?puerto=) y no debe subir la página.
    let anterior = '';
    inject(Router).events.pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd), takeUntilDestroyed())
      .subscribe((e) => {
        const ruta = e.urlAfterRedirects.split(/[?#]/)[0];
        if (ruta !== anterior) this.contenedor?.nativeElement.scrollTo({ top: 0 });
        anterior = ruta;
      });
  }

  /** «Saltar al contenido» sin navegar: con <base href="/"> el ancla iría a /#… y sacaría al visitante del portal. */
  saltar(evento: Event): void {
    evento.preventDefault();
    this.contenedor?.nativeElement.querySelector<HTMLElement>('#contenido-portal')?.focus();
  }
}
