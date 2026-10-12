// /* eslint-disable @typescript-eslint/no-explicit-any */
// /* eslint-disable @typescript-eslint/no-explicit-any */
// /*
//     Author: German Valencia
//     Pattern: PORTTOS Generic Widget - KPI Card Inteligente (Dumb Component)
// */
// import { Component, Input } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { DashboardService } from 'src/app/theme/shared/service/tablero-control/dashboard.service';

// import { KpiShellComponent } from 'src/app/theme/shared/components/kpi-shell/kpi-shell.component';
// import { KpiFormatPipe } from '../../../theme/shared/pipes/kpi-format.pipe';

// @Component({
//     selector: 'app-kpi-card-tcl',
//     standalone: true,
//     imports: [CommonModule, KpiShellComponent, KpiFormatPipe],
//     templateUrl: './kpi-card-tcl.component.html',
//     styleUrl: './kpi-card-tcl.component.scss'
// })
// export class KpiCardTclComponent {

//     @Input() widgetConfig: any;
//     @Input() isEnfoque: boolean = false;
//     @Input() mostrarTabla: boolean = false;

//     // 🟢 LA NUEVA COMPUERTA: Recibe los datos vivos directo de la pestaña. ¡Cero suscripciones!
//     @Input() datosVivos: any;

//     constructor(
//         private _torreService: DashboardService
//     ) { }

//     get data() {
//         if (!this.widgetConfig) return {};

//         const configBase = this.widgetConfig.data || {};

//         const valorVivo = this.datosVivos?.valor;
//         const subtituloVivo = this.datosVivos?.subtitulo;

//         return {
//             ...configBase,
//             valor: valorVivo !== undefined && valorVivo !== null ? valorVivo : (configBase.valor || 0),
//             subtitulo: subtituloVivo ? subtituloVivo : configBase.subtitulo
//         };
//     }

//     get isLoading(): boolean {
//         return !this.widgetConfig;
//     }

//     maximizarDesdeShell(): void {
//         if (this.isEnfoque) {
//             this._torreService.cerrarModoEnfoque();
//         } else {
//             this._torreService.abrirModoEnfoque(this.widgetConfig?.type || 'PTT_MAE_KPI_CAMIONES', this.data);
//         }
//     }
// }
/* eslint-disable @typescript-eslint/no-explicit-any */
/*
    Author: German Valencia
    Pattern: PORTTOS Smart Widget - KPI Card Inteligente (Autónomo + Retrocompatible)
*/
import { Component, Input, OnInit, OnChanges, OnDestroy, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { DashboardService } from 'src/app/theme/shared/service/tablero-control/dashboard.service';
import { MaritimoService } from 'src/app/theme/shared/service/tablero-control/maritimo.service';
import { KpiShellComponent } from 'src/app/theme/shared/components/kpi-shell/kpi-shell.component';
import { BodegasService } from 'src/app/theme/shared/service/tablero-control/bodegas.service';
import { KpiFormatPipe } from 'src/app/theme/shared/pipes/kpi-format.pipe';
@Component({
    selector: 'app-kpi-card-tcl',
    standalone: true,
    imports: [CommonModule, KpiShellComponent, KpiFormatPipe],
    templateUrl: './kpi-card-tcl.component.html',
    styleUrl: './kpi-card-tcl.component.scss'
})
export class KpiCardTclComponent implements OnInit, OnChanges, OnDestroy {
    @Input() widgetConfig: any;
    @Input() isEnfoque: boolean = false;
    @Input() mostrarTabla: boolean = false;

    // Retrocompatibilidad para pestañas pendientes de migrar y modo Enfoque
    @Input() datosVivos: any;

    private datosAutonomosSQL: any = null;
    public cargandoKpi: boolean = false;
    private readonly destroy$ = new Subject<void>();

    constructor(
        private _maritimoService: MaritimoService,
        private _torreService: DashboardService,
        private _bodegasService: BodegasService,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit(): void {
        this.resolverDatosKpi();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (
            (changes['widgetConfig'] && !changes['widgetConfig'].firstChange) ||
            (changes['datosVivos'] && this.datosVivos)
        ) {
            this.resolverDatosKpi();
        }
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    private resolverDatosKpi(): void {
        // 1. Si recibió datos por modo Enfoque o desde una pestaña aún no migrada
        if (this.datosVivos && this.datosVivos.valor !== undefined) {
            this.datosAutonomosSQL = this.datosVivos;
            this.cargandoKpi = false;
            this.cdr.detectChanges();
            return;
        }

        if (!this.widgetConfig) return;

        const codigoWidget = (this.widgetConfig.type || this.widgetConfig.codigoWidget || '').trim().toUpperCase();
        const puerto = (this.widgetConfig.puerto || 'BUENAVENTURA').trim().toUpperCase();

        // 2. Consumo autónomo para KPIs de la Pestaña Marítimo (Fase 1)
        if (codigoWidget.startsWith('PTT_MAE_KPI_')) {
            this.cargandoKpi = true;
            this._maritimoService
                .obtenerDatosWidgetMaritimo(puerto, codigoWidget)
                .pipe(takeUntil(this.destroy$))
                .subscribe({
                    next: (kpiData: any) => {
                        if (kpiData) {
                            this.datosAutonomosSQL = kpiData;
                        }
                        this.cargandoKpi = false;
                        this.cdr.detectChanges();
                    },
                    error: (err) => {
                        console.error(`❌ [SmartWidget KPI] Error en ${codigoWidget}:`, err);
                        this.cargandoKpi = false;
                        this.cdr.detectChanges();
                    }
                });
        }

        if (
            codigoWidget.startsWith('PTT_BOD_') ||
            codigoWidget.includes('_BOD_')
        ) {
            this.cargandoKpi = true;

            this._bodegasService
                .obtenerDatosWidgetBodegas(puerto, codigoWidget)
                .pipe(takeUntil(this.destroy$))
                .subscribe({
                    next: (kpiData: any) => {
                        if (kpiData) {
                            this.datosAutonomosSQL = kpiData;
                        }
                        this.cargandoKpi = false;
                        this.cdr.detectChanges();
                    },
                    error: () => {
                        this.cargandoKpi = false;
                        this.cdr.detectChanges();
                    }
                });
            return;
        }
    }

    get data(): any {
        if (!this.widgetConfig) return {};

        const configBase = this.widgetConfig.data || this.widgetConfig || {};
        const fuenteViva = this.datosAutonomosSQL || this.datosVivos || {};

        return {
            ...configBase,
            ...fuenteViva,
            titulo: fuenteViva.titulo || configBase.titulo || 'Métrica Clave',
            valor:
                fuenteViva.valor !== undefined && fuenteViva.valor !== null
                    ? fuenteViva.valor
                    : configBase.valor || 0,
            subtitulo: fuenteViva.subtitulo || configBase.subtitulo || '',
            colorBorde: fuenteViva.colorBorde || configBase.colorBorde || configBase.color || 'info'
        };
    }

    get valorCompletoMuted(): string | null {
        const origen = this.datosAutonomosSQL || this.widgetConfig?.data || this.widgetConfig || {};

        // 1. Si el backend o servicio ya envió explícitamente el texto completo:
        if (origen.valorCompleto) {
            return String(origen.valorCompleto);
        }

        const valorBruto = origen.valor ?? origen.value ?? '';
        if (valorBruto === null || valorBruto === undefined || valorBruto === '') return null;

        const texto = String(valorBruto).trim();
        if (texto.includes('%')) return null;

        // 2. Si viene como "19.440,5 Ton" o "85.250 Ton", verificamos si es >= 1000
        const match = texto.match(/^([+-]?[\d.,]+)\s*([a-zA-Z/]+)?$/);
        if (!match) return null;

        const num = parseFloat(match[1].replace(/\./g, '').replace(',', '.'));
        if (isNaN(num) || Math.abs(num) < 1000) {
            return null; // Menor a 1000 no necesita subtítulo porque ya se ve completo arriba
        }

        const unidad = match[2] || origen.unidad || '';
        const numeroFormateado = num.toLocaleString('es-CO', {
            minimumFractionDigits: num % 1 !== 0 ? 1 : 0,
            maximumFractionDigits: 1
        });

        return unidad ? `${numeroFormateado} ${unidad}` : numeroFormateado;
    }

    get isLoading(): boolean {
        return !this.widgetConfig || (this.cargandoKpi && !this.datosAutonomosSQL && !this.datosVivos);
    }

    maximizarDesdeShell(): void {
        if (this.isEnfoque) {
            this._torreService.cerrarModoEnfoque();
        } else {
            this._torreService.abrirModoEnfoque(
                this.widgetConfig?.type || 'PTT_MAE_KPI_CAMIONES',
                this.data
            );
        }
    }
}
