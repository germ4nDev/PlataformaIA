import { TranslateModule } from '@ngx-translate/core';
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
import {
  ConfigPortal,
  MOTIVOS,
  MensajePortal,
  PlanPortal,
  mensajeDeError,
  motivosDe,
  revisarFormulario
} from 'src/app/plataforma/websites/porttos/nucleo';
import { PortalPorttosService } from 'src/app/theme/shared/service/portal-porttos.service';
import { IconoComponent } from '../icono/icono.component';

@Component({
  selector: 'pp-contacto',
  imports: [TranslateModule, FormsModule, IconoComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './contacto.component.html',
  styleUrl: './contacto.component.scss'
})
export class ContactoComponent implements OnInit {
  @Input() config: ConfigPortal | null = null;
  @Input() planes: PlanPortal[] = [];
  private readonly api = inject(PortalPorttosService);
  private readonly ruta = inject(ActivatedRoute);
  private readonly cd = inject(ChangeDetectorRef);
  get motivos() {
    return motivosDe(this.config);
  } // con los planes apagados, «Solicitar acceso» (CC-106)
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
    return {
      motivo: '',
      codigoPlan: '',
      nombre: '',
      empresa: '',
      correo: '',
      telefono: '',
      puerto: '',
      mensaje: '',
      aceptaDatos: false,
      sitioWeb: ''
    };
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
      next: () => {
        this.enviando = false;
        this.enviado = true;
        this.cd.markForCheck();
      },
      error: (e) => {
        this.enviando = false;
        this.error = mensajeDeError(e);
        this.cd.markForCheck();
      }
    });
  }

  nuevo(): void {
    const motivo = this.m.motivo;
    this.m = { ...this.vacio(), motivo };
    this.enviado = false;
    this.errores = {};
  }
}
