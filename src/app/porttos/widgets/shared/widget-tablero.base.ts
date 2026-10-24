/* eslint-disable @typescript-eslint/no-explicit-any */
/*
    Author: German Valencia
    Pattern: PORTTOS Smart Widget base - widgets de las pestañas Granel, Carga suelta, Capacidad y Noticias
    Description: Cada widget se conecta al tablero de su pestaña (TablerosPestanasService: una consulta por pestaña y
      puerto, compartida y en vivo) y solo elige su parte con alRecibir(). Maneja carga, error (p. ej. falta la
      migración 013), cambio de puerto (nuevo widgetConfig) y modo enfoque (el modal recibe el puerto y se conecta
      al mismo flujo). Los KPIs no usan esta base: van por kpi-card-tcl.
*/
import { ChangeDetectorRef, Directive, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { Subscription } from 'rxjs';
import { DashboardService } from 'src/app/theme/shared/service/tablero-control/dashboard.service';
import { EstadoTablero, ModuloTablero, TablerosPestanasService } from 'src/app/theme/shared/service/tablero-control/tableros-pestanas.service';

@Directive()
export abstract class WidgetTableroBase<T> implements OnInit, OnChanges, OnDestroy {
    @Input() widgetConfig: any;
    @Input() isEnfoque = false;
    @Input() mostrarTabla = false;
    @Input() datosVivos: any;

    /** Pestaña a la que pertenece el widget. */
    abstract readonly modulo: ModuloTablero;
    /** Título y subtítulo por defecto (el catálogo de widgets los puede cambiar). */
    abstract readonly tituloDefecto: string;
    readonly subtituloDefecto: string = '';
    readonly iconoDefecto: string = 'feather icon-activity';

    public datos: T | null = null;
    public error: string | null = null;
    public cargando = true;
    private sub?: Subscription;

    constructor(protected tableros: TablerosPestanasService, protected torre: DashboardService, protected cdr: ChangeDetectorRef) { }

    get puerto(): string {
        return (this.widgetConfig?.puerto || this.widgetConfig?.data?.puerto || 'BUENAVENTURA').trim().toUpperCase();
    }
    get titulo(): string {
        return this.widgetConfig?.titulo || this.widgetConfig?.data?.titulo || this.tituloDefecto;
    }
    get subtitulo(): string {
        const base = this.widgetConfig?.subtitulo || this.widgetConfig?.data?.subtitulo || this.subtituloDefecto;
        return (this.datos as any)?.simulado ? `${base} · datos simulados` : base;
    }

    /**
     * Origen del dato para el pie de la vista ampliada (2026-10-24): fuente del módulo, si es simulado y la hora en
     * que el API armó el tablero.
     */
    get origenTablero(): { fuente: string; simulado: boolean; periodo: string; generadoEn: string | null } | null {
        const d: any = this.datos;
        if (!d) return null;
        const fuentes: Record<string, [string, string]> = {
            granel: ['TCL_OperacionesBuque, TCL_AvanceOperacionBuque, TCL_EquiposPortuarios, TCL_MaestroBodegas, Supertransporte', 'Operación activa · avance de las últimas 24 h'],
            'carga-suelta': ['TCL_CargaSuelta, TCL_OperacionesBuque (Ro-Ro), TCL_InventarioVehiculos, Supertransporte', 'Folios activos y despachados en 24 h'],
            capacidad: ['TCL_CapacidadNodos, TCL_OcupacionNodos, TCL_MaestroBodegas', 'Última foto de ocupación (≤ 6 h)'],
            noticias: ['Google News RSS, GNews, TRM (datos.gov.co), eventos viales y alertas climáticas', 'Noticias de 7 días · eventos activos']
        };
        const [fuente, periodo] = fuentes[this.modulo] || ['Tablero de la pestaña', ''];
        return { fuente, periodo, simulado: !!d.simulado, generadoEn: d.generadoEn || null };
    }

    ngOnInit(): void {
        this.conectar();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['widgetConfig'] && !changes['widgetConfig'].firstChange) this.conectar();
        if (changes['isEnfoque'] && !changes['isEnfoque'].firstChange) setTimeout(() => this.alCambiarTamano(), 60);
    }

    ngOnDestroy(): void {
        this.sub?.unsubscribe();
    }

    private conectar(): void {
        this.sub?.unsubscribe();
        this.cargando = !this.datos;
        this.sub = this.tableros.tablero<T>(this.modulo, this.puerto).subscribe((e: EstadoTablero<T>) => {
            this.error = e.error;
            this.datos = e.datos;
            this.cargando = false;
            this.alRecibir(e.datos);
            this.cdr.detectChanges();
        });
    }

    /** Toma la parte del tablero que muestra el widget. */
    protected abstract alRecibir(datos: T | null): void;
    /** Para widgets con gráfica: redibujar al entrar o salir del modo enfoque. */
    protected alCambiarTamano(): void { }

    public maximizarDesdeShell(): void {
        if (this.isEnfoque) {
            this.torre.cerrarModoEnfoque();
        } else {
            const codigo = this.widgetConfig?.type || this.widgetConfig?.codigoWidget;
            this.torre.abrirModoEnfoque(codigo, { puerto: this.puerto, titulo: this.titulo, subtitulo: this.widgetConfig?.subtitulo });
        }
    }
}
