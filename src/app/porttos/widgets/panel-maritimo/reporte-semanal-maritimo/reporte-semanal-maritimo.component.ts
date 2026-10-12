// /*
//     Author: German Valencia
//     Pattern: PORTTOS Generic Widget - Resumen Semanal Marítimo (Refactorizado Dumb Component)
// */
// import { Component, Input, ViewEncapsulation } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { DashboardService } from 'src/app/theme/shared/service/tablero-control/dashboard.service';

// // 🟢 Importamos el Shell maestro
// import { WidgetShellComponent } from 'src/app/theme/shared/components/widget-shell/widget-shell.component';

// @Component({
//     selector: 'app-reporte-semanal-maritimo',
//     standalone: true,
//     imports: [CommonModule, WidgetShellComponent],
//     templateUrl: './reporte-semanal-maritimo.component.html',
//     styleUrls: ['./reporte-semanal-maritimo.component.scss'],
//     encapsulation: ViewEncapsulation.None
// })
// export class ReporteSemanalMaritimoComponent {

//     // 🟢 NUEVO ESTÁNDAR: Inputs requeridos por el selector dinámico
//     @Input() widgetConfig: any;
//     @Input() isEnfoque: boolean = false;
//     @Input() mostrarTabla: boolean = false;

//     // 🟢 LA NUEVA COMPUERTA: Recibe la data inyectada directamente desde el HTML de la pestaña
//     @Input() datosVivos: any;

//     constructor(private _torreService: DashboardService) { }

//     // 🟢 EL CEREBRO REACTIVO: Calcula la data en tiempo real
//     get data() {
//         if (!this.widgetConfig) return {};

//         const configBase = this.widgetConfig.data || {};

//         // Fusión limpia: combina la configuración visual con los datos vivos (si llegaron)
//         return {
//             ...configBase,
//             ...(this.datosVivos || {})
//         };
//     }

//     // El HTML usa ahora este getter en su *ngFor en lugar de una variable fija
//     get metricas() {
//         return this.data.metricas || [];
//     }

//     get isLoading(): boolean {
//         return !this.widgetConfig && !this.datosVivos;
//     }

//     // 🟢 Toggle de enfoque: Abre o cierra el modal
//     maximizarDesdeShell() {
//         if (this.isEnfoque) {
//             this._torreService.cerrarModoEnfoque();
//         } else {
//             // Mandamos la data fusionada para que el modal la dibuje con los mismos valores
//             this._torreService.abrirModoEnfoque(this.widgetConfig?.type || 'WDG_PORT_RESUMEN_SEMANAL', this.data);
//         }
//     }
// }
/* eslint-disable @typescript-eslint/no-explicit-any */
/*
    Author: German Valencia
    Pattern: PORTTOS Smart Widget - Resumen Semanal Marítimo (Consumo Autónomo SQL)
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
import { MaritimoService } from 'src/app/theme/shared/service/tablero-control/maritimo.service';
import { WidgetShellComponent } from 'src/app/theme/shared/components/widget-shell/widget-shell.component';

export interface IMetricaSemanal {
    label: string;
    valor: string | number;
    tendencia?: string;
    claseTendencia?: string;
}

@Component({
    selector: 'app-reporte-semanal-maritimo',
    standalone: true,
    imports: [CommonModule, WidgetShellComponent],
    templateUrl: './reporte-semanal-maritimo.component.html',
    styleUrls: ['./reporte-semanal-maritimo.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class ReporteSemanalMaritimoComponent implements OnInit, OnChanges, OnDestroy {
    @Input() widgetConfig: any;
    @Input() isEnfoque: boolean = false;
    @Input() mostrarTabla: boolean = false;

    // Respaldo cuando se abre en el modal de Modo Enfoque
    @Input() datosVivos: any;

    public cargandoResumen: boolean = true;
    private datosAutonomosSQL: any = null;
    private readonly destroy$ = new Subject<void>();

    constructor(
        private _maritimoService: MaritimoService,
        private _torreService: DashboardService,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit(): void {
        this.cargarResumenSemanal();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (
            (changes['widgetConfig'] && !changes['widgetConfig'].firstChange) ||
            (changes['datosVivos'] && this.datosVivos)
        ) {
            this.cargarResumenSemanal();
        }
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    /**
     * Consulta autónoma a SQL Server (TCL_HistoricoProductividad + TCL_Naves_Zarpadas)
     */
    private cargarResumenSemanal(): void {
        // 1. Si viene precargado desde el modal de Modo Enfoque
        if (this.datosVivos && (Array.isArray(this.datosVivos.metricas) || Array.isArray(this.datosVivos))) {
            this.datosAutonomosSQL = this.normalizarResumenSemanal(this.datosVivos);
            this.cargandoResumen = false;
            this.cdr.detectChanges();
            return;
        }

        const puerto = (this.widgetConfig?.puerto || 'BUENAVENTURA').trim().toUpperCase();
        const codigoWidget = (this.widgetConfig?.type || this.widgetConfig?.codigoWidget || 'PTT_MAE_PANEL_RESUMEN')
            .trim()
            .toUpperCase();

        this.cargandoResumen = true;

        this._maritimoService
            .obtenerDatosWidgetMaritimo(puerto, codigoWidget)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (respuestaSQL: any) => {
                    this.datosAutonomosSQL = this.normalizarResumenSemanal(respuestaSQL);
                    this.cargandoResumen = false;
                    this.cdr.detectChanges();
                },
                error: (err) => {
                    console.error('❌ [SmartWidget ReporteSemanal] Error consultando resumen 7 días:', err);
                    this.datosAutonomosSQL = { metricas: [] };
                    this.cargandoResumen = false;
                    this.cdr.detectChanges();
                }
            });
    }

    /**
     * Soporta:
     * - Estructura directa { metricas: [{ label, valor, tendencia, claseTendencia }] }
     * - Filas o consolidado SQL de TCL_HistoricoProductividad (motonaves_atendidas, toneladas_movilizadas, etc.)
     */
    private normalizarResumenSemanal(raw: any): any {
        if (!raw) return { metricas: [] };

        // Caso A: Ya trae el arreglo 'metricas' estructurado
        if (Array.isArray(raw.metricas) && raw.metricas.length > 0) {
            return {
                ...raw,
                metricas: raw.metricas.map((m: any) => ({
                    label: m.label || m.titulo || '--',
                    valor: m.valor ?? '--',
                    tendencia: m.tendencia || m.subtitulo || 'Últimos 7 días',
                    claseTendencia: m.claseTendencia || this.resolverClaseTendencia(m.tendencia)
                }))
            };
        }

        // Caso B: Viene como arreglo de filas diarias de TCL_HistoricoProductividad o un objeto plano SQL
        const filas: any[] = Array.isArray(raw) ? raw : raw.rows || raw.data || [raw];
        const tieneCamposSQL = filas.some(
            (f: any) => f && (f.motonaves_atendidas !== undefined || f.toneladas_movilizadas !== undefined)
        );

        if (!tieneCamposSQL) {
            return { ...raw, metricas: [] };
        }

        const totalMotonaves = filas.reduce((acc, f) => acc + Number(f.motonaves_atendidas || 0), 0);
        const totalToneladas = filas.reduce((acc, f) => acc + Number(f.toneladas_movilizadas || 0), 0);
        const totalTeus = filas.reduce((acc, f) => acc + Number(f.teus_movilizados || 0), 0);
        const totalVehiculos = filas.reduce((acc, f) => acc + Number(f.vehiculos_movilizados || 0), 0);

        const metricasConstruidas: IMetricaSemanal[] = [
            {
                label: 'Motonaves atendidas',
                valor: totalMotonaves.toLocaleString('es-CO'),
                tendencia: 'Acumulado 7 días',
                claseTendencia: 'text-info'
            },
            {
                label: 'Toneladas movilizadas',
                valor: totalToneladas >= 1000 ? `${(totalToneladas / 1000).toFixed(1)}k TM` : `${totalToneladas} TM`,
                tendencia: 'Volumen semanal',
                claseTendencia: 'text-success'
            }
        ];

        if (totalTeus > 0) {
            metricasConstruidas.push({
                label: 'TEU movilizados',
                valor: totalTeus >= 1000 ? `${(totalTeus / 1000).toFixed(1)}k` : totalTeus.toLocaleString('es-CO'),
                tendencia: 'Contenedores 7d',
                claseTendencia: 'text-success'
            });
        }

        if (totalVehiculos > 0) {
            metricasConstruidas.push({
                label: 'Vehículos (unid.)',
                valor: totalVehiculos.toLocaleString('es-CO'),
                tendencia: 'Operación Ro-Ro',
                claseTendencia: 'text-warning'
            });
        }

        return {
            ...(Array.isArray(raw) ? {} : raw),
            titulo: raw.titulo || 'RESUMEN SEMANAL MARÍTIMO',
            subtitulo: raw.subtitulo || 'Indicadores clave de los últimos 7 días',
            icono: raw.icono || 'feather icon-calendar',
            metricas: metricasConstruidas
        };
    }

    private resolverClaseTendencia(tendencia?: string): string {
        if (!tendencia) return 'text-muted';
        if (tendencia.includes('+') || tendencia.toLowerCase().includes(' récord')) return 'text-success';
        if (tendencia.includes('-')) return 'text-warning';
        return 'text-info';
    }

    get data(): any {
        const configBase = this.widgetConfig?.data || {};
        return {
            ...configBase,
            ...(this.datosVivos || {}),
            ...(this.datosAutonomosSQL || {})
        };
    }

    get metricas(): IMetricaSemanal[] {
        return this.data?.metricas || [];
    }

    get isLoading(): boolean {
        return this.cargandoResumen && !this.datosAutonomosSQL && !this.datosVivos;
    }

    trackByMetrica(index: number, item: IMetricaSemanal): string {
        return item.label || index.toString();
    }

    maximizarDesdeShell(): void {
        if (this.isEnfoque) {
            this._torreService.cerrarModoEnfoque();
        } else {
            this._torreService.abrirModoEnfoque(
                this.widgetConfig?.type || 'PTT_MAE_PANEL_RESUMEN',
                this.data
            );
        }
    }
}
