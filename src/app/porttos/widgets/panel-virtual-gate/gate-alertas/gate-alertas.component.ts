/* eslint-disable @typescript-eslint/no-explicit-any */
/*
    Author: German Valencia
    Pattern: PORTTOS Smart Widget - Gate Alertas Operativas (Consumo Autónomo SQL)
*/
import {
    Component,
    Input,
    OnInit,
    OnChanges,
    OnDestroy,
    SimpleChanges,
    ViewEncapsulation,
    ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { DashboardService } from 'src/app/theme/shared/service/tablero-control/dashboard.service';
import { VirtualGateService } from 'src/app/theme/shared/service/tablero-control/virtual-gate.service';
import { WidgetShellComponent } from 'src/app/theme/shared/components/widget-shell/widget-shell.component';

export interface IAlertaGate {
    id?: string | number;
    tipo: 'danger' | 'warning' | 'info' | 'success';
    icono: string;
    titulo: string;
    descripcion: string;
}

@Component({
    selector: 'app-gate-alertas',
    standalone: true,
    imports: [CommonModule, WidgetShellComponent],
    templateUrl: './gate-alertas.component.html',
    styleUrls: ['./gate-alertas.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class GateAlertasComponent implements OnInit, OnChanges, OnDestroy {
    @Input() widgetConfig: any;
    @Input() isEnfoque: boolean = false;
    @Input() mostrarTabla: boolean = false;

    // Respaldo cuando se abre en el modal de Modo Enfoque
    @Input() datosVivos: any;

    public cargandoAlertas: boolean = true;
    public listaAlertas: IAlertaGate[] = [];

    private datosAutonomosSQL: any = null;
    private readonly destroy$ = new Subject<void>();

    constructor(
        private _virtualGateService: VirtualGateService,
        private _torreService: DashboardService,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit(): void {
        this.cargarAlertasGate();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (
            (changes['widgetConfig'] && !changes['widgetConfig'].firstChange) ||
            (changes['datosVivos'] && this.datosVivos)
        ) {
            this.cargarAlertasGate();
        }
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    /**
     * Consulta autónoma a VirtualGateService (TCL_CitasGate) filtrada por puerto
     */
    private cargarAlertasGate(): void {
        // 1. Si viene precargado desde el modal de Modo Enfoque
        if (
            this.datosVivos &&
            (Array.isArray(this.datosVivos.alertas) ||
                Array.isArray(this.datosVivos.citas) ||
                Array.isArray(this.datosVivos))
        ) {
            this.procesarPayloadAlertas(this.datosVivos);
            return;
        }

        const puerto = (this.widgetConfig?.puerto || 'BUENAVENTURA').trim().toUpperCase();
        const codigoWidget = (this.widgetConfig?.type || this.widgetConfig?.codigoWidget || 'PTT_GATE_PANEL_ALERTAS')
            .trim()
            .toUpperCase();

        this.cargandoAlertas = true;

        this._virtualGateService
            .obtenerDatosWidgetGate(codigoWidget, puerto) // Corregido 2026-10-17: antes (puerto, codigo)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (respuestaSQL: any) => {
                    this.procesarPayloadAlertas(respuestaSQL);
                },
                error: (err) => {
                    console.error('❌ [SmartWidget GateAlertas] Error consultando alertas de Virtual Gate:', err);
                    this.listaAlertas = [];
                    this.cargandoAlertas = false;
                    this.cdr.detectChanges();
                }
            });
    }

    /**
     * Soporta:
     * 1. Arreglo directo de alertas [{ tipo/severidad, icono, titulo, descripcion }]
     * 2. Derivación automática desde las filas de dbo.TCL_CitasGate (sin cita, demoras, congestión por terminal)
     */
    private procesarPayloadAlertas(raw: any): void {
        if (!raw) {
            this.listaAlertas = [];
            this.datosAutonomosSQL = { alertas: [] };
            this.cargandoAlertas = false;
            this.cdr.detectChanges();
            return;
        }

        const alertasCrudas: any[] = Array.isArray(raw.alertas)
            ? raw.alertas
            : Array.isArray(raw) && raw[0]?.titulo
                ? raw
                : [];

        if (alertasCrudas.length > 0) {
            this.listaAlertas = alertasCrudas.map((a: any, idx: number) => {
                // Backend: { severidad: 'CRITICA', tipo: 'TIEMPO DE ESPERA EXCEDIDO', mensaje, placa, terminal }
                const tipo = this.normalizarTipo(a.severidad || a.tipo_color || a.tipo);
                return {
                    id: a.id ?? idx,
                    tipo,
                    icono: a.icono || this.resolverIcono(tipo),
                    titulo: a.titulo || (a.tipo ? `${a.tipo}${a.terminal ? ' · ' + a.terminal : ''}` : 'Incidencia en Gate'),
                    descripcion: a.descripcion || a.mensaje || a.detalle || ''
                };
            });
        } else {
            // Derivación directa desde filas de dbo.TCL_CitasGate
            const citas: any[] = Array.isArray(raw.citas)
                ? raw.citas
                : Array.isArray(raw)
                    ? raw
                    : [];
            this.listaAlertas = this.derivarAlertasDesdeCitasSQL(citas);
        }

        this.datosAutonomosSQL = {
            ...(Array.isArray(raw) ? {} : raw),
            titulo: raw.titulo || '⚠ Alertas Operativas',
            subtitulo: raw.subtitulo || 'Monitoreo de incidencias en tiempo real',
            icono: raw.icono || 'feather icon-alert-triangle',
            alertas: this.listaAlertas
        };

        this.cargandoAlertas = false;
        this.cdr.detectChanges();
    }

    private derivarAlertasDesdeCitasSQL(citas: any[]): IAlertaGate[] {
        if (!citas || citas.length === 0) return [];

        const generadas: IAlertaGate[] = [];

        // 1. Camiones sin cita o retenidos en TCL_CitasGate
        const sinCita = citas.filter((c) => /sin cita|retenid|rechaz/i.test(c.estado || ''));
        sinCita.slice(0, 2).forEach((c, idx) => {
            generadas.push({
                id: `sc-${c.id_cita || idx}`,
                tipo: 'danger',
                icono: '🛑',
                titulo: `Camión ${c.placa} — ${c.estado || 'Sin cita'}`,
                descripcion: `${c.ubicacion || 'Pre-gate'} · ${c.transportador || 'Transportador'} (${c.terminal || 'Terminal'})`
            });
        });

        // 2. Terminales con tiempo_espera_minutos elevado (>= 25 min)
        const demorasAltas = citas.filter((c) => Number(c.tiempo_espera_minutos || 0) >= 25);
        if (demorasAltas.length > 0) {
            const maxEspera = Math.max(...demorasAltas.map((c) => Number(c.tiempo_espera_minutos || 0)));
            const terminalCritica = demorasAltas[0].terminal || 'Terminal';
            generadas.push({
                id: 'demora-gate',
                tipo: 'warning',
                icono: '⚠️',
                titulo: `Cola activa en gate ${terminalCritica} (máx. ${maxEspera} min)`,
                descripcion: `${demorasAltas.length} camiones superan los 25 min de espera virtual`
            });
        }

        // 3. balance informativo de flujo en cola
        const enCola = citas.filter((c) => /cola|pre-?gate/i.test(c.estado || ''));
        if (enCola.length > 0) {
            generadas.push({
                id: 'flujo-info',
                tipo: 'info',
                icono: 'ℹ️',
                titulo: `${enCola.length} unidades en enturnamiento Pre-Gate`,
                descripcion: 'Dosificación activa por ventana horaria hacia terminales'
            });
        }

        return generadas;
    }

    private normalizarTipo(rawTipo?: string): 'danger' | 'warning' | 'info' | 'success' {
        const t = (rawTipo || '').toLowerCase();
        if (t.includes('danger') || t.includes('crit') || t.includes('roj')) return 'danger';
        if (t.includes('warn') || t.includes('amarill') || t.includes('demor') || t.includes('atenci')) return 'warning';
        if (t.includes('succ') || t.includes('verd') || t.includes('ok')) return 'success';
        return 'info';
    }

    private resolverIcono(tipo: 'danger' | 'warning' | 'info' | 'success'): string {
        switch (tipo) {
            case 'danger':
                return '🛑';
            case 'warning':
                return '⚠️';
            case 'success':
                return '✅';
            default:
                return 'ℹ️';
        }
    }

    get data(): any {
        return {
            ...(this.widgetConfig?.data || {}),
            ...(this.datosVivos || {}),
            ...(this.datosAutonomosSQL || {}),
            alertas: this.listaAlertas
        };
    }

    /** Alertas críticas (≥ 45 min) y total, aunque la lista venga recortada a 20 (corregido 2026-10-23). */
    get criticas(): number {
        const raw = this.datosAutonomosSQL || this.datosVivos || {};
        if (typeof raw.alertasCriticas === 'number') return raw.alertasCriticas;
        return this.alertas.filter((a: any) => /CRIT|PELIGRO|DANGER|ROJO/i.test(String(a.severidad || a.tipo || ''))).length;
    }

    get totalAlertas(): number {
        const raw = this.datosAutonomosSQL || this.datosVivos || {};
        return Number(raw.totalAlertas ?? this.alertas.length);
    }

    get alertas(): IAlertaGate[] {
        return this.listaAlertas;
    }

    get isLoading(): boolean {
        return this.cargandoAlertas && !this.datosAutonomosSQL && !this.datosVivos;
    }

    trackByAlerta(index: number, item: IAlertaGate): string | number {
        return item.id ?? `${item.titulo}-${index}`;
    }

    maximizarDesdeShell(): void {
        if (this.isEnfoque) {
            this._torreService.cerrarModoEnfoque();
        } else {
            this._torreService.abrirModoEnfoque(
                this.widgetConfig?.type || 'PTT_GATE_PANEL_ALERTAS',
                this.data
            );
        }
    }
}
