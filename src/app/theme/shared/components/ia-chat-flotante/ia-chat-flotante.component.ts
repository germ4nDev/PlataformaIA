/*
    Author: German Valencia
    Componente: Asistente de Porttos (capa de análisis con IA, fase 5)
    Reemplaza la consola anterior (POST /api/ia/ask, que exponía tablas administrativas al modelo).
    Ahora pregunta a POST /api/analisis-ia/asistente/preguntar:
      - solo responde dentro del marco de alcance (proceso logístico portuario); lo de fuera se rechaza con ejemplos
      - responde con herramientas de solo lectura de Porttos y muestra las fuentes que usó
      - avisa las cifras que no pudo respaldar con los datos consultados
      - usa el puerto del filtro del tablero (DashboardService.puertoSeleccionado$) y los últimos 4 turnos como contexto
      - «Útil / No era» por respuesta
    Mismo lugar en el menú lateral (cortina) y misma consola modal que antes.
*/
import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';
import { MarkdownPipe } from '../../pipes/markdown.pipe';
import { DashboardService } from '../../service/tablero-control/dashboard.service';
import { AnalisisIAService, RespuestaAsistenteIA } from '../../service/tablero-control/analisis-ia.service';

interface InteraccionAsistente {
    pregunta: string;
    puerto: string | null;
    fecha: Date;
    cargando: boolean;
    resultado: RespuestaAsistenteIA | null;
    error: string | null;
    voto: boolean | null;
}

const ETIQUETA_HERRAMIENTA: Record<string, string> = {
    listar_puertos: 'Puertos', foto_operativa: 'Situación actual', serie_kpi: 'Serie de KPI', tendencias: 'Tendencias',
    alertas_tempranas: 'Alertas tempranas', resumenes_turno: 'Cierres de turno', estado_maritimo: 'Operación marítima (AIS)',
    llegadas_buques: 'Llegadas DIMAR',
};

@Component({
    selector: 'app-ia-chat-flotante',
    standalone: true,
    imports: [CommonModule, FormsModule, TranslateModule, MarkdownPipe],
    templateUrl: './ia-chat-flotante.component.html',
    styleUrl: './ia-chat-flotante.component.scss'
})
export class IaChatFlotanteComponent implements OnInit, OnDestroy {
    @ViewChild('cuerpo') cuerpo?: ElementRef<HTMLDivElement>;

    public promptUsuario = '';
    public cargando = false;
    public modalAbierto = false;
    public sidebarAbierto = false;
    public puerto: string | null = null;
    public historialInteracciones: InteraccionAsistente[] = [];
    public readonly ejemplos = [
        '¿Cuántas naves hay en fondeo y cuánto llevan esperando?',
        '¿Qué indicadores empeoraron esta semana?',
        '¿Cómo cerró el último turno?',
        '¿Qué es el free time de un contenedor?'
    ];

    private subs = new Subscription();

    constructor(private ia: AnalisisIAService, private dashboard: DashboardService) { }

    ngOnInit(): void {
        this.subs.add(this.dashboard.puertoSeleccionado$.subscribe((p) => {
            const clave = String(p || '').trim();
            this.puerto = !clave || /^(TODOS|ALL)$/i.test(clave) ? null : clave;
        }));
    }

    ngOnDestroy(): void {
        this.subs.unsubscribe();
    }

    public alternarSidebar(): void {
        this.sidebarAbierto = !this.sidebarAbierto;
    }

    public abrirModal(): void {
        this.modalAbierto = true;
    }

    public cerrarModal(): void {
        this.modalAbierto = false;
    }

    public usarSugerencia(texto: string): void {
        this.promptUsuario = texto;
        this.enviarConsulta();
    }

    public nuevaConversacion(): void {
        this.historialInteracciones = [];
    }

    public etiqueta(h: string): string {
        return ETIQUETA_HERRAMIENTA[h] || h;
    }

    public mensajeEstado(i: InteraccionAsistente): string | null {
        const e = i.resultado?.estado;
        if (!e || e === 'RESPONDIDA') return null;
        const textos: Record<string, string> = { OMITIDA_APAGADA: 'Asistente apagado', RECHAZADA: 'Fuera del alcance de Porttos', SIN_DATOS: 'Sin datos suficientes', APAGADO: 'Asistente apagado', TOPE_USUARIO: 'Cupo diario agotado',
            OMITIDA_PRESUPUESTO: 'Presupuesto del día agotado', CORTACIRCUITO: 'Servicio en pausa', ERROR: 'Error del servicio', INVALIDA: 'Sin respuesta confiable' };
        return textos[e] || e;
    }

    public votar(i: InteraccionAsistente, util: boolean): void {
        if (!i.resultado?.id || i.voto !== null) return;
        i.voto = util;
        this.subs.add(this.ia.calificarRespuesta(i.resultado.id, util).subscribe({ error: () => (i.voto = null) }));
    }

    public enviarConsulta(): void {
        const texto = this.promptUsuario.trim();
        if (!texto || this.cargando) return;
        this.promptUsuario = '';
        this.cargando = true;
        this.sidebarAbierto = false;
        this.modalAbierto = true;

        // Contexto: los últimos turnos respondidos (las rechazadas no aportan)
        const historial = this.historialInteracciones
            .filter((i) => i.resultado && ['RESPONDIDA', 'SIN_DATOS'].includes(i.resultado.estado))
            .slice(-4).map((i) => ({ pregunta: i.pregunta, respuesta: i.resultado!.respuesta }));
        const turno: InteraccionAsistente = { pregunta: texto, puerto: this.puerto, fecha: new Date(), cargando: true, resultado: null, error: null, voto: null };
        this.historialInteracciones.push(turno);
        this.bajar();

        this.subs.add(this.ia.preguntar(texto, { puerto: this.puerto, historial }).subscribe({
            next: (r) => {
                turno.resultado = r;
                turno.cargando = false;
                this.cargando = false;
                this.bajar();
            },
            error: (e) => {
                turno.error = e?.error?.msg || (e?.status === 0 ? 'El API no responde.' : 'No se pudo consultar al asistente.');
                turno.cargando = false;
                this.cargando = false;
            }
        }));
    }

    private bajar(): void {
        setTimeout(() => {
            const el = this.cuerpo?.nativeElement;
            if (el) el.scrollTop = el.scrollHeight;
        });
    }
}
