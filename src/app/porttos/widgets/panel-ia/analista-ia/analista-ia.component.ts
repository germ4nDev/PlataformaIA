/* eslint-disable @typescript-eslint/no-explicit-any */
/*
    Author: German Valencia
    Pattern: PORTTOS Smart Widget - Analista IA (capa de análisis con IA, fase 3)
    Códigos: PTT_IA_ANALISTA_<PESTAÑA> (uno por pestaña del tablero, migración 016) → WIDGET_MAP lo resuelve por prefijo.
    Muestra, para el puerto del filtro:
      - el resumen del turno, las alertas tempranas vigentes (severidad, confianza, horizonte, explicación, acción y
        evidencia) y las tendencias;
      - «Útil» / «No era» en cada alerta (cierra el ciclo: CONFIRMADO / FALSO y la precisión por tipo);
      - el estado de la capa: apagada (IA_ENABLED=false), modo sombra, cortacircuito o sin migración.
    Filtra por los tipos de la pestaña (MARITIMO → muelles, buques, clima...). En Mapa, Noticias o una pestaña sin
    mapa propio, todos. widgetConfig.tiposIA (lista) reemplaza el filtro.
    Se refresca al iniciar, cada 2 min y con el aviso 'ia-hallazgo' del puerto (agrupado 2 s).
    Vista ampliada: historial de 7 días en tabla-tcl.
    Fase 4: tres vistas en el widget:
      Alertas      lo de la fase 3 (alertas tempranas, lecturas del analista, resumen del turno en curso)
      Tendencias   24 h · 7 días · 30 días por KPI de los módulos de la pestaña, con mini-gráfica y si empeora o mejora
                   (cálculo determinista del API, sin modelo; caché de 10 min)
      Turno        último cierre de turno y resumen del día operativo (lo que pasó, lo que viene, qué vigilar y las
                   tendencias que el analista explicó), con su origen: modelo o automático.
*/
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, inject, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { merge, of, Subscription, timer } from 'rxjs';
import { catchError, debounceTime, map, switchMap } from 'rxjs/operators';
import { WidgetShellComponent } from 'src/app/theme/shared/components/widget-shell/widget-shell.component';
import { DashboardService } from 'src/app/theme/shared/service/tablero-control/dashboard.service';
import {
    AnalisisIAService, HallazgoIA, PanelIA, ResumenIA, TendenciaKpi, TendenciaVentana, TendenciasIA, VentanaTendencia
} from 'src/app/theme/shared/service/tablero-control/analisis-ia.service';
import { ColumnaTabla, TablaTclComponent } from '../../shared/tabla-tcl/tabla-tcl.component';
import { mensajeError } from '../../panel-maritimo-vivo/shared/maritimo-vivo.util';

const PREFIJO = 'PTT_IA_ANALISTA';

/** Tipos de alerta y módulos de KPI que interesan a cada pestaña (sufijo de TLC_<PESTAÑA>_001). */
const FOCO_PESTANA: Record<string, { tipos: string[]; modulos: string[] }> = {
    MARITIMO: { tipos: ['saturacion_muelles', 'retraso_buque', 'riesgo_clima'], modulos: ['maritimo'] },
    VIRTUAL_GATE: { tipos: ['congestion_gate', 'corredor_vial'], modulos: ['gate', 'viales'] },
    GATE: { tipos: ['congestion_gate', 'corredor_vial'], modulos: ['gate', 'viales'] },
    TERRESTRE: { tipos: ['corredor_vial', 'congestion_gate', 'riesgo_clima'], modulos: ['viales', 'gate'] },
    CONTENEDORES: { tipos: ['saturacion_almacen', 'congestion_gate', 'saturacion_muelles'], modulos: ['contenedores'] },
    BODEGAS: { tipos: ['saturacion_almacen'], modulos: ['bodegas'] },
    GNL: { tipos: ['gnl', 'riesgo_clima'], modulos: [] },
    GRANEL: { tipos: ['saturacion_muelles', 'saturacion_almacen', 'retraso_buque'], modulos: ['granel'] },
    SUELTA: { tipos: ['saturacion_muelles', 'saturacion_almacen', 'retraso_buque'], modulos: ['suelta'] },
    CAPACIDAD: { tipos: ['saturacion_almacen', 'saturacion_muelles', 'congestion_gate'], modulos: ['capacidad', 'bodegas'] },
};
/** Siempre visibles: avisos sobre la calidad del dato y lo que el analista no supo encasillar. */
const TIPOS_COMUNES = ['calidad_dato', 'otro'];

export const NOMBRE_TIPO_IA: Record<string, string> = {
    congestion_gate: 'Congestión en gate', saturacion_muelles: 'Saturación de muelles', retraso_buque: 'Retraso de buque',
    saturacion_almacen: 'Saturación de almacenamiento', riesgo_clima: 'Riesgo por clima', gnl: 'GNL', corredor_vial: 'Corredor vial',
    calidad_dato: 'Calidad del dato', otro: 'Otro',
};
const NOMBRE_ESTADO: Record<string, string> = {
    PROPUESTO: 'EN REVISIÓN', PUBLICADO: 'PUBLICADA', CONFIRMADO: 'ÚTIL', FALSO: 'NO ERA', DESCARTADO: 'DESCARTADA',
};

@Component({
    selector: 'app-analista-ia',
    standalone: true,
    imports: [CommonModule, WidgetShellComponent, TablaTclComponent],
    templateUrl: './analista-ia.component.html',
    styleUrls: ['./analista-ia.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AnalistaIAComponent implements OnInit, OnChanges, OnDestroy {
    @Input() widgetConfig: any;
    @Input() isEnfoque: boolean = false;
    @Input() mostrarTabla: boolean = false;
    @Input() datosVivos: any;
    /** Alertas vigentes de la pestaña tras cada carga (el botón flotante del mapa muestra el número). */
    @Output() conteoAlertas = new EventEmitter<{ alertas: number; criticas: number }>();

    public datos: PanelIA | null = null;
    public cargando = true;
    public error: string | null = null;
    public ultimaActualizacion: Date | null = null;
    public puerto = '';
    public votando = new Set<number>();
    public vista: 'alertas' | 'tendencias' | 'turno' = 'alertas';
    public ventana: VentanaTendencia = '24h';
    public readonly ventanas: Array<{ codigo: VentanaTendencia; nombre: string }> = [
        { codigo: '24h', nombre: '24 h' }, { codigo: '7d', nombre: '7 días' }, { codigo: '30d', nombre: '30 días' }
    ];
    public tendenciasKpi: TendenciasIA | null = null;
    public cargandoTendencias = false;
    public resumenesTurno: ResumenIA[] = [];
    public resumenesDisponibles = true;
    public cargandoResumenes = false;
    public expandida: number | null = null;
    public readonly nombreTipo = (t: string) => NOMBRE_TIPO_IA[t] || t;
    public readonly nombreEstado = (e: string) => NOMBRE_ESTADO[e] || e;

    private readonly ia = inject(AnalisisIAService);
    private readonly torre = inject(DashboardService);
    private readonly cdr = inject(ChangeDetectorRef);
    private suscripcion?: Subscription;
    private subHistorial?: Subscription;
    private subTendencias?: Subscription;
    private subResumenes?: Subscription;

    ngOnInit(): void {
        this.iniciar();
    }

    ngOnChanges(cambios: SimpleChanges): void {
        const c = cambios['widgetConfig'];
        if (c && !c.firstChange && this.puertoDe(c.currentValue) !== this.puerto) this.iniciar();
        if (cambios['isEnfoque'] && this.isEnfoque && this.puerto) this.cargarHistorial();
    }

    ngOnDestroy(): void {
        this.suscripcion?.unsubscribe();
        this.subHistorial?.unsubscribe();
        this.subTendencias?.unsubscribe();
        this.subResumenes?.unsubscribe();
    }

    // ── vistas (fase 4) ─────────────────────────────────────────────────────────────────────────────

    public cambiarVista(v: 'alertas' | 'tendencias' | 'turno'): void {
        this.vista = v;
        if (v === 'tendencias' && !this.tendenciasKpi) this.cargarTendencias();
        if (v === 'turno' && !this.resumenesTurno.length) this.cargarResumenes();
    }

    public cambiarVentana(v: VentanaTendencia): void {
        this.ventana = v;
    }

    /** KPI de los módulos de la pestaña con dato en la ventana: primero los relevantes y los que más empeoran. */
    public get kpisVentana(): Array<{ kpi: TendenciaKpi; t: TendenciaVentana }> {
        const modulos = this.foco.modulos;
        return (this.tendenciasKpi?.kpis || [])
            .filter((k) => !modulos || modulos.includes(k.modulo))
            .map((kpi) => ({ kpi, t: kpi.ventanas[this.ventana] as TendenciaVentana }))
            .filter((x) => x.t && x.t.direccion !== 'sin_datos')
            .sort((a, b) => Number(b.t.relevante) - Number(a.t.relevante) || b.t.puntaje - a.t.puntaje);
    }

    public get sinDatosVentana(): number {
        const modulos = this.foco.modulos;
        return (this.tendenciasKpi?.kpis || []).filter((k) => (!modulos || modulos.includes(k.modulo)) && k.ventanas[this.ventana]?.direccion === 'sin_datos').length;
    }

    public get ultimoCierre(): ResumenIA | null {
        return this.resumenesTurno.find((r) => r.tipo === 'cierre_turno') || null;
    }

    public get ultimoDiario(): ResumenIA | null {
        return this.resumenesTurno.find((r) => r.tipo === 'resumen_diario') || null;
    }

    /** Trazo SVG (viewBox 0 0 100 28) de la mini-gráfica; los tramos sin dato cortan la línea. */
    public trazo(puntos: Array<number | null>): string {
        const validos = puntos.filter((v): v is number => v !== null && Number.isFinite(v));
        if (validos.length < 2) return '';
        const min = Math.min(...validos);
        const max = Math.max(...validos);
        const rango = max - min || 1;
        const paso = 100 / Math.max(1, puntos.length - 1);
        let d = '';
        let abierto = false;
        puntos.forEach((v, i) => {
            if (v === null || !Number.isFinite(v)) { abierto = false; return; }
            const x = (i * paso).toFixed(1);
            const y = (25 - ((v - min) / rango) * 22).toFixed(1);
            d += `${abierto ? 'L' : 'M'}${x} ${y} `;
            abierto = true;
        });
        return d.trim();
    }

    public valor(v: number | null, unidad: string): string {
        if (v === null || v === undefined) return '—';
        const n = Math.abs(v) >= 100 ? Math.round(v).toLocaleString() : (Math.round(v * 10) / 10).toLocaleString();
        return unidad === '%' ? `${n} %` : `${n} ${unidad || ''}`.trim();
    }

    public cambio(t: TendenciaVentana): string {
        if (t.cambioPct === null) return t.direccion === 'estable' ? 'estable' : t.direccion === 'sube' ? '↑' : '↓';
        return `${t.cambioPct > 0 ? '+' : ''}${t.cambioPct.toLocaleString()} %`;
    }

    public iconoDireccion(d: string): string {
        return d === 'sube' ? 'icon-trending-up' : d === 'baja' ? 'icon-trending-down' : 'icon-minus';
    }

    private cargarTendencias(): void {
        if (!this.puerto) return;
        this.subTendencias?.unsubscribe();
        this.cargandoTendencias = !this.tendenciasKpi;
        this.subTendencias = this.ia.tendencias(this.puerto).pipe(catchError(() => of(null))).subscribe((t) => {
            if (t) this.tendenciasKpi = t;
            this.cargandoTendencias = false;
            this.cdr.markForCheck();
        });
    }

    private cargarResumenes(): void {
        if (!this.puerto) return;
        this.subResumenes?.unsubscribe();
        this.cargandoResumenes = !this.resumenesTurno.length;
        this.subResumenes = this.ia.resumenes(this.puerto, 3).pipe(catchError(() => of(null))).subscribe((r) => {
            if (r) { this.resumenesTurno = r.resumenes; this.resumenesDisponibles = r.disponible; }
            this.cargandoResumenes = false;
            this.cdr.markForCheck();
        });
    }

    // ── filtro por pestaña ──────────────────────────────────────────────────────────────────────────

    /** Sufijo de la pestaña: PTT_IA_ANALISTA_MARITIMO → MARITIMO. */
    public get pestana(): string {
        const codigo = String(this.widgetConfig?.type || this.widgetConfig?.codigoWidget || PREFIJO).toUpperCase();
        return codigo.startsWith(`${PREFIJO}_`) ? codigo.slice(PREFIJO.length + 1) : '';
    }

    private get foco(): { tipos: string[] | null; modulos: string[] | null } {
        const propios = this.widgetConfig?.tiposIA;
        if (Array.isArray(propios) && propios.length) return { tipos: [...propios, ...TIPOS_COMUNES], modulos: null };
        const f = FOCO_PESTANA[this.pestana];
        return f ? { tipos: [...f.tipos, ...TIPOS_COMUNES], modulos: f.modulos.length ? f.modulos : null } : { tipos: null, modulos: null };
    }

    public get filtrado(): boolean {
        return !!this.foco.tipos;
    }

    public get alertas(): HallazgoIA[] {
        const tipos = this.foco.tipos;
        return (this.datos?.alertas || []).filter((a) => !tipos || tipos.includes(a.tipo));
    }

    public get tendencias(): HallazgoIA[] {
        const modulos = this.foco.modulos;
        return (this.datos?.tendencias || []).filter((t) => !modulos || modulos.some((m) => String(t.entidad || '').startsWith(`kpi.${m}.`)));
    }

    public get ocultas(): number {
        return (this.datos?.alertas.length || 0) - this.alertas.length;
    }

    // ── estado de la capa ───────────────────────────────────────────────────────────────────────────

    public get estadoCapa(): { texto: string; clase: string; detalle: string } {
        const e = this.datos?.estado;
        if (!e) return { texto: '', clase: '', detalle: '' };
        if (!e.disponible) return { texto: 'NO DISPONIBLE', clase: 'badge-secondary', detalle: e.motivo || 'Falta la migración 015.' };
        if (!e.habilitada) return {
            texto: 'APAGADA', clase: 'badge-secondary',
            detalle: e.apagadaPor === 'panel'
                ? 'El analista está apagado para este puerto (Administración IA). Se muestra lo último que dejó.'
                : 'El analista está apagado (IA_ENABLED=false). Se muestra lo último que dejó; las tendencias y los resúmenes automáticos siguen.'
        };
        if (e.cortacircuitoAbierto) return { texto: 'EN PAUSA', clase: 'badge-warning', detalle: `El modelo falló varias veces seguidas; se reintenta${e.cortacircuitoHasta ? ' a las ' + new Date(e.cortacircuitoHasta).toLocaleTimeString() : ''}.` };
        if (e.modoSombra) return { texto: 'MODO SOMBRA', clase: 'badge-info', detalle: 'Las alertas se proponen y se revisan; todavía no salen como notificaciones.' };
        return { texto: 'EN TURNO', clase: 'badge-success', detalle: `Analiza cada ${e.intervaloMin} min y publica las alertas en las notificaciones del mapa.` };
    }

    // ── presentación ────────────────────────────────────────────────────────────────────────────────

    public horizonte(a: HallazgoIA): string {
        if (a.horizonteMinH == null || a.horizonteMaxH == null) return '';
        const h = (v: number) => (v < 1 ? `${Math.round(v * 60)} min` : `${Number(v.toFixed(1))} h`);
        return a.horizonteMinH === 0 ? `ya · hasta ${h(a.horizonteMaxH)}` : `en ${h(a.horizonteMinH)}–${h(a.horizonteMaxH)}`;
    }

    public confianza(a: HallazgoIA): string {
        return a.confianza == null ? '' : `${Math.round(a.confianza * 100)} %`;
    }

    /** kpi.maritimo.ocupacion_muelles_pct → ocupacion muelles pct (maritimo). */
    public evidencia(id: string): string {
        const [fuente, ...resto] = String(id).split('.');
        const nombre = (resto.length > 1 ? resto.slice(1) : resto).join(' ').replace(/_/g, ' ');
        const etiqueta: Record<string, string> = { kpi: 'KPI', senal: 'Señal', alerta: 'Alerta', evento: 'Evento' };
        return `${etiqueta[fuente] || fuente} · ${nombre}`;
    }

    public flecha(t: HallazgoIA): string {
        return t.tipo === 'sube' ? 'icon-trending-up' : t.tipo === 'baja' ? 'icon-trending-down' : 'icon-minus';
    }

    public votable(a: HallazgoIA): boolean {
        return a.estado === 'PROPUESTO' || a.estado === 'PUBLICADO';
    }

    public alternar(a: HallazgoIA): void {
        this.expandida = this.expandida === a.id ? null : a.id;
    }

    public votar(a: HallazgoIA, util: boolean, evento?: Event): void {
        evento?.stopPropagation();
        if (this.votando.has(a.id)) return;
        this.votando.add(a.id);
        this.ia.feedback(a.id, util).subscribe({
            next: (r) => {
                a.estado = r.estado;
                this.votando.delete(a.id);
                this.cdr.markForCheck();
            },
            error: (e) => {
                this.votando.delete(a.id);
                this.error = mensajeError(e);
                this.cdr.markForCheck();
            }
        });
    }

    public trackId(_i: number, h: HallazgoIA): number {
        return h.id;
    }

    public get origenIA() {
        return {
            fuente: 'Analista IA de Porttos sobre las fotos de KPI, señales, alertas y eventos viales del puerto',
            periodo: 'Alertas vigentes hasta el fin de su horizonte · historial de 7 días',
            generadoEn: this.ultimaActualizacion,
            nota: this.error ? `Última consulta fallida: ${this.error}` : 'Cada alerta cita la evidencia que la sustenta; las cifras se verifican antes de mostrarla.'
        };
    }

    public maximizarDesdeShell(): void {
        if (this.isEnfoque) this.torre.cerrarModoEnfoque();
        else this.torre.abrirModoEnfoque(this.widgetConfig?.type || `${PREFIJO}_${this.pestana || 'MAPA'}`, this.widgetConfig);
    }

    public refrescar(): void {
        this.iniciar();
    }

    // ── vista ampliada: historial ───────────────────────────────────────────────────────────────────

    public readonly columnasHistorial: ColumnaTabla[] = [
        { campo: 'fechaTexto', titulo: 'Hora', tipo: 'texto', ancho: '120px' },
        { campo: 'claseTexto', titulo: 'Clase' },
        { campo: 'tipoTexto', titulo: 'Tipo' },
        { campo: 'titulo', titulo: 'Hallazgo', tipo: 'principal' },
        { campo: 'severidadTexto', titulo: 'Severidad', tipo: 'estado' },
        { campo: 'confianzaPct', titulo: 'Confianza', tipo: 'numero', decimales: 0, unidad: '%' },
        { campo: 'horizonteTexto', titulo: 'Horizonte' },
        { campo: 'estadoTexto', titulo: 'Estado', tipo: 'estado' },
        { campo: 'verificacion', titulo: 'Verificación / motivo' }
    ];
    public filasHistorial: any[] = [];

    private cargarHistorial(): void {
        this.subHistorial?.unsubscribe();
        this.subHistorial = this.ia.historial(this.puerto, 7).pipe(catchError(() => of([] as HallazgoIA[]))).subscribe((lista) => {
            const tipos = this.foco.tipos;
            const sev: Record<string, string> = { critica: 'CRÍTICA', atencion: 'ATENCIÓN', info: 'INFORMATIVA' };
            this.filasHistorial = lista
                .filter((h) => h.clase !== 'ALERTA' || !tipos || tipos.includes(h.tipo))
                .map((h) => ({
                    ...h,
                    fechaTexto: new Date(h.fecha).toLocaleString([], { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }),
                    claseTexto: h.clase === 'ALERTA' ? 'Alerta' : h.clase === 'TENDENCIA' ? 'Tendencia' : 'Resumen',
                    tipoTexto: h.clase === 'ALERTA' ? this.nombreTipo(h.tipo) : h.clase === 'TENDENCIA' ? `${h.tipo} · ${String(h.entidad || '').replace(/^kpi\./, '')}` : '—',
                    severidadTexto: h.severidad ? sev[h.severidad] || h.severidad : '',
                    confianzaPct: h.confianza != null ? Math.round(h.confianza * 100) : null,
                    horizonteTexto: h.clase === 'ALERTA' ? this.horizonte(h) : '',
                    estadoTexto: this.nombreEstado(h.estado),
                    verificacion: String(h.resultado || '').replace(/^VERIFICACION: /, '')
                }));
            this.cdr.markForCheck();
        });
    }

    // ── ciclo de vida ───────────────────────────────────────────────────────────────────────────────

    private puertoDe(config: any): string {
        const p = String(config?.puerto || '').trim();
        return !p || p.toUpperCase() === 'ALL' ? '' : p;
    }

    private iniciar(): void {
        this.suscripcion?.unsubscribe();
        this.puerto = this.puertoDe(this.widgetConfig);
        this.datos = null;
        this.tendenciasKpi = null;
        this.resumenesTurno = [];
        this.error = null;
        this.cargando = !!this.puerto;
        if (!this.puerto) {
            this.cdr.markForCheck();
            return;
        }
        this.suscripcion = merge(timer(0, 120_000), this.ia.cambios(this.puerto).pipe(debounceTime(2000)))
            .pipe(switchMap(() => this.ia.panel(this.puerto).pipe(
                map((datos) => ({ datos, error: null as unknown })),
                catchError((error: unknown) => of({ datos: null as PanelIA | null, error }))
            )))
            .subscribe(({ datos, error }) => {
                if (error) this.error = mensajeError(error);
                else {
                    this.datos = datos;
                    this.error = null;
                    this.ultimaActualizacion = new Date();
                    if (this.isEnfoque) this.cargarHistorial();
                    this.conteoAlertas.emit({ alertas: this.alertas.length, criticas: this.alertas.filter((a) => a.severidad === 'critica').length });
                    if (this.vista === 'tendencias') this.cargarTendencias();
                    if (this.vista === 'turno') this.cargarResumenes();
                }
                this.cargando = false;
                this.cdr.markForCheck();
            });
    }
}
