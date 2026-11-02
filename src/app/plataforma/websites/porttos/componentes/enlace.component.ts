/*
    Author: German Valencia
    Pattern: PORTTOS Componente - Portal porttos.co dentro de la web (OT-010)
    Description: Enlace del contenido: interno con routerLink bajo la base del portal (y su query), externo con href en otra pestaña.
      Una dirección que no es ninguna de las dos (enlaceDe → null) no se pinta.
*/
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { RouterLink } from '@angular/router';
import { RUTA_PORTAL, enlaceDe } from 'src/app/plataforma/websites/porttos/nucleo';

@Component({
  selector: 'pp-enlace',
  standalone: true,
  imports: [RouterLink, NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (destino; as d) {
      @if (d.tipo === 'interno') {
        <a [class]="clase" [routerLink]="d.ruta" [queryParams]="d.query"><ng-container *ngTemplateOutlet="contenido" /></a>
      } @else {
        <a [class]="clase" [href]="d.href" target="_blank" rel="noopener"><ng-container *ngTemplateOutlet="contenido" /></a>
      }
    }
    <ng-template #contenido><ng-content /></ng-template>`,
  styles: [':host { display: contents; }'],
})
export class EnlaceComponent {
  @Input() clase = '';
  private u: string | null | undefined = null;
  private b: string = RUTA_PORTAL;
  /** Base de las rutas internas: la del portal por defecto; '' para rutas de la plataforma (el login). */
  @Input() set base(v: string) { this.b = v ?? RUTA_PORTAL; this.destino = enlaceDe(this.u, this.b); }
  destino: ReturnType<typeof enlaceDe> = null;
  @Input({ required: true }) set url(v: string | null | undefined) { this.u = v; this.destino = enlaceDe(v, this.b); }
}
