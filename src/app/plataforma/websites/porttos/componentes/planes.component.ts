/*
    Author: German Valencia
    Pattern: PORTTOS Componente - Portal porttos.co dentro de la web (OT-010)
    Description: Planes y precios: selector mensual/anual, una tarjeta por plan (precio con precioDePlan, características y
      «Solicitar este plan» → Contáctenos con motivo ACCESO), comparativo con desplazamiento horizontal y, mientras algún plan
      sea simulado, el rótulo SIMULADO y el aviso de valores de referencia (datos honestos).
*/
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Periodo, PlanPortal, PlanesPortal, RUTA_PORTAL, precioDePlan } from 'src/app/plataforma/websites/porttos/nucleo';
import { IconoComponent } from './icono.component';

@Component({
  selector: 'pp-planes',
  standalone: true,
  imports: [RouterLink, IconoComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="bloque bloque--planes">
      <div class="contenedor">
        <div class="periodo" role="group" aria-label="Periodo de pago">
          <button type="button" [attr.aria-pressed]="periodo === 'mensual'" [class.activo]="periodo === 'mensual'"
                  (click)="periodo = 'mensual'">Mensual</button>
          <button type="button" [attr.aria-pressed]="periodo === 'anual'" [class.activo]="periodo === 'anual'"
                  (click)="periodo = 'anual'">Anual</button>
        </div>

        <div class="rejilla rejilla--planes">
          @for (p of datos.planes; track p.codigo) {
            <article class="plan" [class.plan--destacado]="p.destacado" [attr.aria-label]="'Plan ' + p.nombre">
              <div class="plan__cabeza">
                <h2 class="plan__nombre">{{ p.nombre }}</h2>
                @if (p.destacado) { <span class="insignia insignia--acento">Recomendado</span> }
                @if (p.simulado) { <span class="insignia insignia--simulado" title="Valor de referencia; se reemplaza por el real">SIMULADO</span> }
              </div>
              @if (p.descripcion) { <p class="plan__descripcion">{{ p.descripcion }}</p> }
              @if (precio(p); as pr) {
                <p class="plan__precio"><span class="plan__valor">{{ pr.principal }}</span>@if (pr.sufijo) {<span class="plan__sufijo">{{ pr.sufijo }}</span>}</p>
                <p class="plan__nota">{{ pr.nota || ' ' }}</p>
              }
              <ul class="lista-check" role="list">
                @for (c of p.caracteristicas; track $index) {
                  <li><span class="lista-check__marca"><pp-icono nombre="check" [tamano]="18" /></span>{{ c }}</li>
                }
              </ul>
              <a class="boton" [class.boton--primario]="p.destacado" [class.boton--secundario]="!p.destacado"
                 [routerLink]="contacto" [queryParams]="{ motivo: 'ACCESO', plan: p.codigo }">Solicitar este plan</a>
            </article>
          }
        </div>

        @if (datos.aviso) { <p class="aviso" role="note"><span class="insignia insignia--simulado">SIMULADO</span>{{ datos.aviso }}</p> }

        @if (datos.comparativo.filas.length) {
          <h2 class="titulo-seccion titulo-seccion--centro">Compare los planes</h2>
          <div class="tabla-desplazable" tabindex="0" role="region" aria-label="Comparativo de planes">
            <table class="comparativo">
              <thead>
                <tr><th scope="col"><span class="oculto">Concepto</span></th>
                  @for (c of datos.comparativo.columnas; track c) { <th scope="col">{{ nombre(c) }}</th> }
                </tr>
              </thead>
              <tbody>
                @for (f of datos.comparativo.filas; track $index) {
                  <tr><th scope="row">{{ f.concepto }}</th>
                    @for (c of datos.comparativo.columnas; track c) { <td>{{ f.valores[c] || '—' }}</td> }
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>
    </section>`,
})
export class PlanesComponent {
  @Input({ required: true }) datos!: PlanesPortal;
  periodo: Periodo = 'mensual';
  readonly contacto = `${RUTA_PORTAL}/contacto`;
  precio(p: PlanPortal) { return precioDePlan(p, this.periodo); }
  nombre(codigo: string): string { return this.datos.planes.find((p) => p.codigo === codigo)?.nombre || codigo; }
}
