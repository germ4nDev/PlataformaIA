/*
    Author: German Valencia
    Pattern: PORTTOS Componente - Portal porttos.co dentro de la web (OT-010)
    Description: Formulario de Contáctenos → POST /api/portal/mensajes. Motivo (los del API; «Solicitar acceso» reemplaza el
      registro abierto), plan opcional, datos de contacto, puerto (texto libre), mensaje y aceptación de datos. Lee ?motivo= y
      ?plan= para llegar desde «Solicitar este plan». Valida con revisarFormulario (mismas reglas que el Joi) y el campo trampa
      `sitioWeb` va oculto para personas (sin foco, sin lector). Al lado: correo y tiempo de respuesta de la configuración.
*/
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ConfigPortal, MOTIVOS, MensajePortal, PlanPortal, mensajeDeError, motivosDe, revisarFormulario } from 'src/app/plataforma/websites/porttos/nucleo';
import { PortalPorttosService } from 'src/app/theme/shared/service/portal-porttos.service';
import { IconoComponent } from './icono.component';

@Component({
  selector: 'pp-contacto',
  standalone: true,
  imports: [FormsModule, IconoComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="bloque">
      <div class="contenedor contacto">
        <div class="panel contacto__formulario">
          @if (enviado) {
            <div class="exito" role="status">
              <span class="exito__icono"><pp-icono nombre="check" [tamano]="32" /></span>
              <h2>Recibimos su mensaje</h2>
              @if (config?.tiempoRespuesta) { <p>{{ config?.tiempoRespuesta }}.</p> }
              <button type="button" class="boton boton--secundario" (click)="nuevo()">Enviar otro mensaje</button>
            </div>
          } @else {
            <form (ngSubmit)="enviar()" novalidate>
              <div class="campo">
                <label for="motivo">Motivo <span aria-hidden="true">*</span></label>
                <select id="motivo" name="motivo" [(ngModel)]="m.motivo" required [attr.aria-invalid]="!!errores['motivo']"
                        [attr.aria-describedby]="errores['motivo'] ? 'error-motivo' : null">
                  <option value="" disabled>Escoja una opción</option>
                  @for (o of motivos; track o.clave) { <option [value]="o.clave">{{ o.etiqueta }}</option> }
                </select>
                @if (errores['motivo']) { <p class="campo__error" id="error-motivo">{{ errores['motivo'] }}</p> }
              </div>
              @if (planes.length) {
                <div class="campo">
                  <label for="plan">Plan de interés</label>
                  <select id="plan" name="plan" [(ngModel)]="m.codigoPlan">
                    <option value="">Ninguno en particular</option>
                    @for (p of planes; track p.codigo) { <option [value]="p.codigo">{{ p.nombre }}</option> }
                  </select>
                </div>
              }
              <div class="campos-dos">
                <div class="campo">
                  <label for="nombre">Nombre <span aria-hidden="true">*</span></label>
                  <input id="nombre" name="nombre" [(ngModel)]="m.nombre" autocomplete="name" required maxlength="120"
                         [attr.aria-invalid]="!!errores['nombre']" [attr.aria-describedby]="errores['nombre'] ? 'error-nombre' : null" />
                  @if (errores['nombre']) { <p class="campo__error" id="error-nombre">{{ errores['nombre'] }}</p> }
                </div>
                <div class="campo">
                  <label for="empresa">Empresa</label>
                  <input id="empresa" name="empresa" [(ngModel)]="m.empresa" autocomplete="organization" maxlength="160" />
                </div>
                <div class="campo">
                  <label for="correo">Correo <span aria-hidden="true">*</span></label>
                  <input id="correo" name="correo" type="email" [(ngModel)]="m.correo" autocomplete="email" required maxlength="160"
                         [attr.aria-invalid]="!!errores['correo']" [attr.aria-describedby]="errores['correo'] ? 'error-correo' : null" />
                  @if (errores['correo']) { <p class="campo__error" id="error-correo">{{ errores['correo'] }}</p> }
                </div>
                <div class="campo">
                  <label for="telefono">Teléfono</label>
                  <input id="telefono" name="telefono" type="tel" [(ngModel)]="m.telefono" autocomplete="tel" maxlength="40"
                         [attr.aria-invalid]="!!errores['telefono']" [attr.aria-describedby]="errores['telefono'] ? 'error-telefono' : null" />
                  @if (errores['telefono']) { <p class="campo__error" id="error-telefono">{{ errores['telefono'] }}</p> }
                </div>
              </div>
              <div class="campo">
                <label for="puerto">Puerto o zona de operación</label>
                <input id="puerto" name="puerto" [(ngModel)]="m.puerto" maxlength="60" />
              </div>
              <div class="campo">
                <label for="mensaje">Mensaje <span aria-hidden="true">*</span></label>
                <textarea id="mensaje" name="mensaje" rows="5" [(ngModel)]="m.mensaje" required maxlength="4000"
                          [attr.aria-invalid]="!!errores['mensaje']" [attr.aria-describedby]="errores['mensaje'] ? 'error-mensaje' : null"></textarea>
                @if (errores['mensaje']) { <p class="campo__error" id="error-mensaje">{{ errores['mensaje'] }}</p> }
              </div>
              <!-- Campo trampa: las personas no lo ven ni lo alcanzan con el teclado; un robot lo llena -->
              <div class="trampa" aria-hidden="true">
                <label for="sitioWeb">Sitio web</label>
                <input id="sitioWeb" name="sitioWeb" [(ngModel)]="m.sitioWeb" tabindex="-1" autocomplete="off" />
              </div>
              <div class="campo campo--casilla">
                <input id="aceptaDatos" name="aceptaDatos" type="checkbox" [(ngModel)]="m.aceptaDatos"
                       [attr.aria-invalid]="!!errores['aceptaDatos']" [attr.aria-describedby]="errores['aceptaDatos'] ? 'error-acepta' : null" />
                <label for="aceptaDatos">Autorizo el tratamiento de mis datos personales para responder esta solicitud.</label>
              </div>
              @if (errores['aceptaDatos']) { <p class="campo__error" id="error-acepta">{{ errores['aceptaDatos'] }}</p> }
              @if (error) { <p class="alerta" role="alert">{{ error }}</p> }
              <button type="submit" class="boton boton--primario boton--ancho" [disabled]="enviando">
                {{ enviando ? 'Enviando…' : 'Enviar mensaje' }}
              </button>
            </form>
          }
        </div>
        <aside class="contacto__lado">
          @if (config?.correoContacto) {
            <div class="panel dato-contacto">
              <span class="dato-contacto__icono"><pp-icono nombre="correo" /></span>
              <div><p class="dato-contacto__etiqueta">Correo</p>
                <a [href]="'mailto:' + config?.correoContacto">{{ config?.correoContacto }}</a></div>
            </div>
          }
          @if (config?.tiempoRespuesta) {
            <div class="panel dato-contacto">
              <span class="dato-contacto__icono"><pp-icono nombre="reloj" /></span>
              <div><p class="dato-contacto__etiqueta">Tiempo de respuesta</p><p>{{ config?.tiempoRespuesta }}</p></div>
            </div>
          }
        </aside>
      </div>
    </section>`,
})
export class ContactoComponent implements OnInit {
  @Input() config: ConfigPortal | null = null;
  @Input() planes: PlanPortal[] = [];
  private readonly api = inject(PortalPorttosService);
  private readonly ruta = inject(ActivatedRoute);
  private readonly cd = inject(ChangeDetectorRef);
  get motivos() { return motivosDe(this.config); }   // con los planes apagados, «Solicitar acceso» (CC-106)
  m: MensajePortal = this.vacio();
  errores: Record<string, string> = {};
  error: string | null = null;
  enviando = false;
  enviado = false;

  ngOnInit(): void {
    const q = this.ruta.snapshot.queryParamMap;
    const motivo = String(q.get('motivo') || '').toUpperCase();
    if (MOTIVOS.some((x) => x.clave === motivo)) this.m.motivo = motivo;
    const plan = String(q.get('plan') || '').toUpperCase();
    if (/^[A-Z0-9_]{1,40}$/.test(plan)) this.m.codigoPlan = plan;
  }

  private vacio(): MensajePortal {
    return { motivo: '', codigoPlan: '', nombre: '', empresa: '', correo: '', telefono: '', puerto: '', mensaje: '', aceptaDatos: false, sitioWeb: '' };
  }

  enviar(): void {
    this.error = null;
    this.errores = revisarFormulario(this.m);
    if (Object.keys(this.errores).length) {
      setTimeout(() => document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus());
      return;
    }
    this.enviando = true;
    this.api.enviarMensaje({ ...this.m, aceptaDatos: true }).subscribe({
      next: () => { this.enviando = false; this.enviado = true; this.cd.markForCheck(); },
      error: (e) => { this.enviando = false; this.error = mensajeDeError(e); this.cd.markForCheck(); },
    });
  }

  nuevo(): void {
    const motivo = this.m.motivo;
    this.m = { ...this.vacio(), motivo };
    this.enviado = false;
    this.errores = {};
  }
}
