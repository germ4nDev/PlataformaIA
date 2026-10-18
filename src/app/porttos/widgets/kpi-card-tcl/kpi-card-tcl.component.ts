// // /* eslint-disable @typescript-eslint/no-explicit-any */
// // /*
// //     Author: German Valencia
// //     Pattern: PORTTOS Smart Widget - KPI Card Inteligente (Autónomo + Retrocompatible)
// //     Description: Tarjeta universal que detecta su prefijo (PTT_MAE_, PTT_BOD_, PTT_GATE_, PTT_GNL_)
// //                  y se auto-conecta a su respectivo servicio en la Torre de Control.
// // */
// // import { Component, Input, OnInit, OnChanges, OnDestroy, SimpleChanges, ChangeDetectorRef } from '@angular/core';
// // import { CommonModule } from '@angular/common';
// // import { Subject } from 'rxjs';
// // import { takeUntil } from 'rxjs/operators';

// // import { DashboardService } from 'src/app/theme/shared/service/tablero-control/dashboard.service';
// // import { MaritimoService } from 'src/app/theme/shared/service/tablero-control/maritimo.service';
// // import { BodegasService } from 'src/app/theme/shared/service/tablero-control/bodegas.service';
// // import { VirtualGateService } from 'src/app/theme/shared/service/tablero-control/virtual-gate.service';
// // import { GnlStateService } from 'src/app/theme/shared/service/tablero-control/gnl-state.service';

// // import { KpiShellComponent } from 'src/app/theme/shared/components/kpi-shell/kpi-shell.component';
// // import { KpiFormatPipe } from 'src/app/theme/shared/pipes/kpi-format.pipe';

// // @Component({
// //     selector: 'app-kpi-card-tcl',
// //     standalone: true,
// //     imports: [CommonModule, KpiShellComponent, KpiFormatPipe],
// //     templateUrl: './kpi-card-tcl.component.html',
// //     styleUrl: './kpi-card-tcl.component.scss'
// // })
// // export class KpiCardTclComponent implements OnInit, OnChanges, OnDestroy {
// //     @Input() widgetConfig: any;
// //     @Input() isEnfoque: boolean = false;
// //     @Input() mostrarTabla: boolean = false;

// //     // Retrocompatibilidad para pestañas pendientes de migrar y modo Enfoque
// //     @Input() datosVivos: any;

// //     private datosAutonomosSQL: any = null;
// //     public cargandoKpi: boolean = false;
// //     private readonly destroy$ = new Subject<void>();

// //     constructor(
// //         private _maritimoService: MaritimoService,
// //         private _bodegasService: BodegasService,
// //         private _virtualGateService: VirtualGateService,
// //         private _gnlState: GnlStateService,
// //         private _torreService: DashboardService,
// //         private cdr: ChangeDetectorRef
// //     ) { }

// //     ngOnInit(): void {
// //         this.resolverDatosKpi();
// //     }

// //     ngOnChanges(changes: SimpleChanges): void {
// //         if (
// //             (changes['widgetConfig'] && !changes['widgetConfig'].firstChange) ||
// //             (changes['datosVivos'] && this.datosVivos)
// //         ) {
// //             this.resolverDatosKpi();
// //         }
// //     }

// //     ngOnDestroy(): void {
// //         this.destroy$.next();
// //         this.destroy$.complete();
// //     }

// //     private resolverDatosKpi(): void {
// //         // 1. Si recibió datos por modo Enfoque o desde una pestaña aún no migrada
// //         if (this.datosVivos && this.datosVivos.valor !== undefined) {
// //             this.datosAutonomosSQL = this.datosVivos;
// //             this.cargandoKpi = false;
// //             this.cdr.detectChanges();
// //             return;
// //         }

// //         if (!this.widgetConfig) return;

// //         const codigoWidget = (this.widgetConfig.type || this.widgetConfig.codigoWidget || '').trim().toUpperCase();
// //         const puerto = (this.widgetConfig.puerto || 'BUENAVENTURA').trim().toUpperCase();

// //         // 2. Consumo autónomo para KPIs Marítimos
// //         if (codigoWidget.startsWith('PTT_MAE_KPI_')) {
// //             this.cargandoKpi = true;
// //             this._maritimoService
// //                 .obtenerDatosWidgetMaritimo(puerto, codigoWidget)
// //                 .pipe(takeUntil(this.destroy$))
// //                 .subscribe({
// //                     next: (kpiData: any) => {
// //                         if (kpiData) this.datosAutonomosSQL = kpiData;
// //                         this.cargandoKpi = false;
// //                         this.cdr.detectChanges();
// //                     },
// //                     error: () => {
// //                         this.cargandoKpi = false;
// //                         this.cdr.detectChanges();
// //                     }
// //                 });
// //             return;
// //         }

// //         // 3. Consumo autónomo para KPIs de Bodegas
// //         if (codigoWidget.startsWith('PTT_BOD_') || codigoWidget.includes('_BOD_')) {
// //             this.cargandoKpi = true;
// //             this._bodegasService
// //                 .obtenerDatosWidgetBodegas(puerto, codigoWidget)
// //                 .pipe(takeUntil(this.destroy$))
// //                 .subscribe({
// //                     next: (kpiData: any) => {
// //                         if (kpiData) this.datosAutonomosSQL = kpiData;
// //                         this.cargandoKpi = false;
// //                         this.cdr.detectChanges();
// //                     },
// //                     error: () => {
// //                         this.cargandoKpi = false;
// //                         this.cdr.detectChanges();
// //                     }
// //                 });
// //             return;
// //         }

// //         // 4. Consumo autónomo para KPIs de Virtual Gate (Nuevo)
// //         if (codigoWidget.startsWith('PTT_GATE_KPI_')) {
// //             this.cargandoKpi = true;
// //             this._virtualGateService
// //                 .obtenerColaGate(puerto)
// //                 .pipe(takeUntil(this.destroy$))
// //                 .subscribe({
// //                     next: (res: any) => {
// //                         // Extraemos el resumen desde el objeto encapsulado virtualGate
// //                         const r = res?.virtualGate?.resumen || res?.data?.virtualGate?.resumen || {};

// //                         const mapaGateKpis: { [key: string]: any } = {
// //                             'PTT_GATE_KPI_OP': {
// //                                 titulo: 'CAMIONES EN PUERTO',
// //                                 valor: r.totalCamiones ?? 0,
// //                                 subtitulo: `ZONA LOGÍSTICA ${puerto}`,
// //                                 colorBorde: 'borde-cyan'
// //                             },
// //                             'PTT_GATE_KPI_CONT': {
// //                                 titulo: 'CONTENEDORES DÍA',
// //                                 valor: r.totalContenedores ?? 0,
// //                                 subtitulo: r.subtituloContenedores || 'FCL · LCL · Reefer',
// //                                 colorBorde: 'borde-amarillo'
// //                             },
// //                             'PTT_GATE_KPI_GRANEL': {
// //                                 titulo: 'GRANEL - TONS DÍA',
// //                                 valor: r.totalGranel ?? 0,
// //                                 subtitulo: r.subtituloGranel || 'Agrícola · Mineral · Líquido',
// //                                 colorBorde: 'borde-rojo'
// //                             },
// //                             'PTT_GATE_KPI_SUELTA': {
// //                                 titulo: 'CARGA SUELTA - TM',
// //                                 valor: r.totalCargaSuelta ?? 0,
// //                                 subtitulo: r.subtituloCargaSuelta || 'Break-bulk · Paletizada',
// //                                 colorBorde: 'borde-green'
// //                             },
// //                             'PTT_GATE_KPI_RORO': {
// //                                 titulo: 'VEHÍCULOS RO-RO',
// //                                 valor: r.totalRoro ?? 0,
// //                                 subtitulo: r.subtituloRoro || 'Importación · Exportación · PDI',
// //                                 colorBorde: 'borde-fucsia'
// //                             },
// //                             'PTT_GATE_KPI_BODEGAS': {
// //                                 titulo: 'SATURACIÓN BODEGAS',
// //                                 valor: r.saturacionBodegas ?? '0%',
// //                                 subtitulo: r.subtituloBodegas || 'Ocupación operativa en puerto',
// //                                 colorBorde: 'borde-purple'
// //                             },
// //                             'PTT_GATE_KPI_SUB_CONT': {
// //                                 titulo: 'SUB - CONTENEDORES',
// //                                 valor: r.subContenedores ?? 0,
// //                                 subtitulo: 'Retiros y devoluciones',
// //                                 colorBorde: 'borde-naranja'
// //                             },
// //                             'PTT_GATE_KPI_SUB_GRANEL': {
// //                                 titulo: 'SUB - GRANEL',
// //                                 valor: r.subGranel ?? 0,
// //                                 subtitulo: 'Flujo hacia silos',
// //                                 colorBorde: 'borde-indigo'
// //                             },
// //                             'PTT_GATE_KPI_SUB_SUELTA': {
// //                                 titulo: 'SUB - CARGA SUELTA',
// //                                 valor: r.subCargaSuelta ?? 0,
// //                                 subtitulo: 'Operación en bodega',
// //                                 colorBorde: 'borde-purple'
// //                             },
// //                             'PTT_GATE_KPI_SUB_NINERAS': {
// //                                 titulo: 'SUB - NIÑERAS',
// //                                 valor: r.subNineras ?? 0,
// //                                 subtitulo: 'Trasiego a patios',
// //                                 colorBorde: 'borde-cyan'
// //                             }
// //                         };

// //                         if (mapaGateKpis[codigoWidget]) {
// //                             this.datosAutonomosSQL = mapaGateKpis[codigoWidget];
// //                         }
// //                         this.cargandoKpi = false;
// //                         this.cdr.detectChanges();
// //                     },
// //                     error: () => {
// //                         this.cargandoKpi = false;
// //                         this.cdr.detectChanges();
// //                     }
// //                 });
// //             return;
// //         }

// //         // 5. Consumo autónomo para KPIs de GNL (Socket Reactivo)
// //         if (codigoWidget.startsWith('PTT_GNL_KPI_') || codigoWidget.includes('_GNL_')) {
// //             this.cargandoKpi = true;
// //             this._gnlState.telemetriaFiltrada$
// //                 .pipe(takeUntil(this.destroy$))
// //                 .subscribe((telemetria: any) => {
// //                     if (telemetria) {
// //                         const esConsolidado = telemetria.esConsolidado;
// //                         const brazoLabel = esConsolidado ? 'SISTEMA CONSOLIDADO' : `BRAZO ${telemetria.brazo_id}`;

// //                         const mapaGnlKpis: { [key: string]: any } = {
// //                             'PTT_GNL_KPI_FLUJO': {
// //                                 titulo: 'CAUDAL DE FLUJO',
// //                                 valor: telemetria.flujo || 0,
// //                                 unidad: 'm³/h',
// //                                 subtitulo: brazoLabel,
// //                                 colorBorde: 'borde-cyan'
// //                             },
// //                             'PTT_GNL_KPI_PRESION': {
// //                                 titulo: 'PRESIÓN',
// //                                 valor: telemetria.presion_psi || 0,
// //                                 unidad: 'psi',
// //                                 subtitulo: brazoLabel,
// //                                 colorBorde: 'borde-naranja'
// //                             },
// //                             'PTT_GNL_KPI_TEMP': {
// //                                 titulo: 'TEMPERATURA',
// //                                 valor: telemetria.temp_ducto || 0,
// //                                 unidad: '°C',
// //                                 subtitulo: brazoLabel,
// //                                 colorBorde: 'borde-rojo'
// //                             },
// //                             'PTT_GNL_KPI_BOG': {
// //                                 titulo: 'BOG',
// //                                 valor: telemetria.bog || 0,
// //                                 unidad: 'kg/h',
// //                                 subtitulo: 'Gas evaporado / Boil-off',
// //                                 colorBorde: 'borde-purple'
// //                             }
// //                         };

// //                         if (mapaGnlKpis[codigoWidget]) {
// //                             this.datosAutonomosSQL = mapaGnlKpis[codigoWidget];
// //                         }
// //                     } else {
// //                         // Limpiar KPI si no hay datos seleccionados
// //                         this.datosAutonomosSQL = null;
// //                     }
// //                     this.cargandoKpi = false;
// //                     this.cdr.detectChanges();
// //                 });
// //             return;
// //         }
// //     }

// //     get data(): any {
// //         if (!this.widgetConfig) return {};

// //         const configBase = this.widgetConfig.data || this.widgetConfig || {};
// //         const fuenteViva = this.datosAutonomosSQL || this.datosVivos || {};

// //         return {
// //             ...configBase,
// //             ...fuenteViva,
// //             titulo: fuenteViva.titulo || configBase.titulo || 'Métrica Clave',
// //             valor:
// //                 fuenteViva.valor !== undefined && fuenteViva.valor !== null
// //                     ? fuenteViva.valor
// //                     : configBase.valor || 0,
// //             subtitulo: fuenteViva.subtitulo || configBase.subtitulo || '',
// //             colorBorde: fuenteViva.colorBorde || configBase.colorBorde || configBase.color || 'info'
// //         };
// //     }

// //     get valorCompletoMuted(): string | null {
// //         const origen = this.datosAutonomosSQL || this.widgetConfig?.data || this.widgetConfig || {};

// //         if (origen.valorCompleto) {
// //             return String(origen.valorCompleto);
// //         }

// //         const valorBruto = origen.valor ?? origen.value ?? '';
// //         if (valorBruto === null || valorBruto === undefined || valorBruto === '') return null;

// //         const texto = String(valorBruto).trim();
// //         if (texto.includes('%')) return null;

// //         const match = texto.match(/^([+-]?[\d.,]+)\s*([a-zA-Z/]+)?$/);
// //         if (!match) return null;

// //         const num = parseFloat(match[1].replace(/\./g, '').replace(',', '.'));
// //         if (isNaN(num) || Math.abs(num) < 1000) {
// //             return null;
// //         }

// //         const unidad = match[2] || origen.unidad || '';
// //         const numeroFormateado = num.toLocaleString('es-CO', {
// //             minimumFractionDigits: num % 1 !== 0 ? 1 : 0,
// //             maximumFractionDigits: 1
// //         });

// //         return unidad ? `${numeroFormateado} ${unidad}` : numeroFormateado;
// //     }

// //     get isLoading(): boolean {
// //         return !this.widgetConfig || (this.cargandoKpi && !this.datosAutonomosSQL && !this.datosVivos);
// //     }

// //     maximizarDesdeShell(): void {
// //         if (this.isEnfoque) {
// //             this._torreService.cerrarModoEnfoque();
// //         } else {
// //             this._torreService.abrirModoEnfoque(
// //                 this.widgetConfig?.type || this.widgetConfig?.codigoWidget || 'PTT_MAE_KPI_CAMIONES',
// //                 this.data
// //             );
// //         }
// //     }
// // }
// /* eslint-disable @typescript-eslint/no-explicit-any */
// /*
//     Author: German Valencia
//     Pattern: PORTTOS Smart Widget - KPI Card Inteligente (Autónomo + Retrocompatible)
//     Description: Tarjeta universal que detecta su prefijo (PTT_MAE_, PTT_BOD_, PTT_GATE_, PTT_GNL_, PTT_CONT_)
//                  y se auto-conecta a su respectivo servicio en la Torre de Control.
// */
// import { Component, Input, OnInit, OnChanges, OnDestroy, SimpleChanges, ChangeDetectorRef } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { Subject } from 'rxjs';
// import { takeUntil } from 'rxjs/operators';

// import { DashboardService } from 'src/app/theme/shared/service/tablero-control/dashboard.service';
// import { MaritimoService } from 'src/app/theme/shared/service/tablero-control/maritimo.service';
// import { BodegasService } from 'src/app/theme/shared/service/tablero-control/bodegas.service';
// import { VirtualGateService } from 'src/app/theme/shared/service/tablero-control/virtual-gate.service';
// import { GnlStateService } from 'src/app/theme/shared/service/tablero-control/gnl-state.service';
// // 1. 🟢 IMPORTAMOS EL SERVICIO DE CONTENEDORES
// import { ContenedoresService } from 'src/app/theme/shared/service/tablero-control/contenedores.service';

// import { KpiShellComponent } from 'src/app/theme/shared/components/kpi-shell/kpi-shell.component';
// import { KpiFormatPipe } from 'src/app/theme/shared/pipes/kpi-format.pipe';

// @Component({
//     selector: 'app-kpi-card-tcl',
//     standalone: true,
//     imports: [CommonModule, KpiShellComponent, KpiFormatPipe],
//     templateUrl: './kpi-card-tcl.component.html',
//     styleUrl: './kpi-card-tcl.component.scss'
// })
// export class KpiCardTclComponent implements OnInit, OnChanges, OnDestroy {
//     @Input() widgetConfig: any;
//     @Input() isEnfoque: boolean = false;
//     @Input() mostrarTabla: boolean = false;

//     // Retrocompatibilidad para pestañas pendientes de migrar y modo Enfoque
//     @Input() datosVivos: any;

//     private datosAutonomosSQL: any = null;
//     public cargandoKpi: boolean = false;
//     private readonly destroy$ = new Subject<void>();

//     constructor(
//         private _maritimoService: MaritimoService,
//         private _bodegasService: BodegasService,
//         private _virtualGateService: VirtualGateService,
//         private _gnlState: GnlStateService,
//         private _contenedoresService: ContenedoresService, // 2. 🟢 LO INYECTAMOS AQUÍ
//         private _torreService: DashboardService,
//         private cdr: ChangeDetectorRef
//     ) { }

//     ngOnInit(): void {
//         this.resolverDatosKpi();
//     }

//     ngOnChanges(changes: SimpleChanges): void {
//         if (
//             (changes['widgetConfig'] && !changes['widgetConfig'].firstChange) ||
//             (changes['datosVivos'] && this.datosVivos)
//         ) {
//             this.resolverDatosKpi();
//         }
//     }

//     ngOnDestroy(): void {
//         this.destroy$.next();
//         this.destroy$.complete();
//     }

//     // private resolverDatosKpi(): void {
//     //     // 1. Si recibió datos por modo Enfoque o desde una pestaña aún no migrada
//     //     if (this.datosVivos && this.datosVivos.valor !== undefined) {
//     //         this.datosAutonomosSQL = this.datosVivos;
//     //         this.cargandoKpi = false;
//     //         this.cdr.detectChanges();
//     //         return;
//     //     }

//     //     if (!this.widgetConfig) return;

//     //     const codigoWidget = (this.widgetConfig.type || this.widgetConfig.codigoWidget || '').trim().toUpperCase();
//     //     const puerto = (this.widgetConfig.puerto || 'BUENAVENTURA').trim().toUpperCase();

//     //     if (!codigoWidget) {
//     //         this.cargandoKpi = false;
//     //         return;
//     //     }

//     //     this.cargandoKpi = true;

//     //     // 2. Consumo autónomo para KPIs Marítimos
//     //     if (codigoWidget.startsWith('PTT_MAE_KPI_')) {
//     //         this._maritimoService.obtenerDatosWidgetMaritimo(puerto, codigoWidget)
//     //             .pipe(takeUntil(this.destroy$)).subscribe({
//     //                 next: (kpiData: any) => {
//     //                     if (kpiData) this.datosAutonomosSQL = kpiData;
//     //                     this.cargandoKpi = false;
//     //                     this.cdr.detectChanges();
//     //                 },
//     //                 error: () => this.marcarError()
//     //             });
//     //         return;
//     //     }

//     //     // 3. Consumo autónomo para KPIs de Bodegas
//     //     if (codigoWidget.startsWith('PTT_BOD_') || codigoWidget.includes('_BOD_')) {
//     //         this._bodegasService.obtenerDatosWidgetBodegas(puerto, codigoWidget)
//     //             .pipe(takeUntil(this.destroy$)).subscribe({
//     //                 next: (kpiData: any) => {
//     //                     if (kpiData) this.datosAutonomosSQL = kpiData;
//     //                     this.cargandoKpi = false;
//     //                     this.cdr.detectChanges();
//     //                 },
//     //                 error: () => this.marcarError()
//     //             });
//     //         return;
//     //     }

//     //     // 4. Consumo autónomo para KPIs de Virtual Gate
//     //     if (codigoWidget.startsWith('PTT_GATE_KPI_')) {
//     //         this._virtualGateService.obtenerDatosWidgetGate(codigoWidget, puerto)
//     //             .pipe(takeUntil(this.destroy$)).subscribe({
//     //                 next: (kpiData: any) => {
//     //                     if (kpiData) this.datosAutonomosSQL = kpiData;
//     //                     this.cargandoKpi = false;
//     //                     this.cdr.detectChanges();
//     //                 },
//     //                 error: () => this.marcarError()
//     //             });
//     //         return;
//     //     }

//     //     // 5. 🟢 NUEVO: Consumo autónomo para KPIs de Contenedores
//     //     if (codigoWidget.startsWith('PTT_CONT_KPI_')) {
//     //         this._contenedoresService.obtenerDatosWidgetContenedores(codigoWidget, puerto)
//     //             .pipe(takeUntil(this.destroy$)).subscribe({
//     //                 next: (res: any) => {
//     //                     // Extraemos el valor y el subtítulo del servicio, y le sumamos los textos fijos
//     //                     const infoBase = this.obtenerTitulosContenedores(codigoWidget);
//     //                     this.datosAutonomosSQL = { ...infoBase, ...res };
//     //                     this.cargandoKpi = false;
//     //                     this.cdr.detectChanges();
//     //                 },
//     //                 error: () => this.marcarError()
//     //             });
//     //         return;
//     //     }

//     //     // 6. Consumo autónomo para KPIs de GNL (Socket Reactivo)
//     //     if (codigoWidget.startsWith('PTT_GNL_KPI_') || codigoWidget.includes('_GNL_')) {
//     //         this.cargandoKpi = true;
//     //         this._gnlState.telemetriaFiltrada$
//     //             .pipe(takeUntil(this.destroy$))
//     //             .subscribe((telemetria: any) => {
//     //                 const t = telemetria || {};
//     //                 const esConsolidado = t.esConsolidado;
//     //                 const brazoLabel = esConsolidado ? 'SISTEMA CONSOLIDADO' : `BRAZO ${t.brazo_id || 'GENERAL'}`;

//     //                 // Diccionario de todas las tarjetas GNL
//     //                 const mapaGnlKpis: { [key: string]: any } = {
//     //                     'PTT_GNL_KPI_FLUJO': {
//     //                         titulo: 'CAUDAL DE FLUJO',
//     //                         valor: t.flujo ?? t.caudal ?? 0,
//     //                         unidad: 'm³/h',
//     //                         subtitulo: brazoLabel,
//     //                         colorBorde: 'borde-cyan'
//     //                     },
//     //                     'PTT_GNL_KPI_PRESION': {
//     //                         titulo: 'PRESIÓN',
//     //                         valor: t.presion_psi ?? t.presion ?? 0,
//     //                         unidad: 'psi',
//     //                         subtitulo: brazoLabel,
//     //                         colorBorde: 'borde-naranja'
//     //                     },
//     //                     'PTT_GNL_KPI_TEMP': {
//     //                         titulo: 'TEMPERATURA',
//     //                         valor: t.temp_ducto ?? t.temperatura ?? 0,
//     //                         unidad: '°C',
//     //                         subtitulo: brazoLabel,
//     //                         colorBorde: 'borde-rojo'
//     //                     },
//     //                     'PTT_GNL_KPI_BOG': {
//     //                         titulo: 'BOG',
//     //                         valor: t.bog ?? 0,
//     //                         unidad: 'kg/h',
//     //                         subtitulo: 'Gas evaporado / Boil-off',
//     //                         colorBorde: 'borde-purple',
//     //                         icono: 'feather icon-wind'
//     //                     },
//     //                     'PTT_GNL_KPI_DESCARGA': {
//     //                         titulo: 'DESCARGA DE BUQUE',
//     //                         valor: t.descarga ?? 0,
//     //                         unidad: 'm³/h',
//     //                         subtitulo: 'Telemetría de entrada',
//     //                         colorBorde: 'borde-blue',
//     //                         icono: 'feather icon-anchor'
//     //                     },
//     //                     'PTT_GNL_KPI_INYECCION': {
//     //                         titulo: 'INYECCIÓN A RED',
//     //                         valor: t.inyeccion ?? 0,
//     //                         unidad: 'm³/h',
//     //                         subtitulo: 'Flujo de salida a red',
//     //                         colorBorde: 'borde-green',
//     //                         icono: 'feather icon-log-out'
//     //                     },
//     //                     'PTT_GNL_KPI_TNQ_OCUP': {
//     //                         titulo: 'OCUPACIÓN DE PLANTA',
//     //                         valor: t.ocupacion ?? 0,
//     //                         unidad: '%',
//     //                         subtitulo: 'Porcentaje de llenado de tanques',
//     //                         colorBorde: 'borde-amarillo',
//     //                         icono: 'feather icon-database'
//     //                     },
//     //                     'PTT_GNL_KPI_VOLUMEN': {
//     //                         titulo: 'ENERGÍA TRANSFERIDA',
//     //                         valor: t.energia ?? t.volumen ?? 0,
//     //                         unidad: 'MMBTU',
//     //                         subtitulo: 'Totalizador de energía',
//     //                         colorBorde: 'borde-indigo',
//     //                         icono: 'feather icon-zap'
//     //                     },
//     //                     'PTT_GNL_KPI_CALIDAD': {
//     //                         titulo: 'PODER CALORÍFICO',
//     //                         valor: t.calidad ?? t.calorifico ?? 0,
//     //                         unidad: 'BTU/ft³',
//     //                         subtitulo: 'Calidad de la mezcla GNL',
//     //                         colorBorde: 'borde-teal',
//     //                         icono: 'feather icon-thermometer'
//     //                     }
//     //                 };

//     //                 if (mapaGnlKpis[codigoWidget]) {
//     //                     this.datosAutonomosSQL = mapaGnlKpis[codigoWidget];
//     //                 } else {
//     //                     // Fallback si el código no está mapeado
//     //                     this.datosAutonomosSQL = {
//     //                         valor: 0,
//     //                         titulo: 'Métrica GNL',
//     //                         subtitulo: 'Código no reconocido',
//     //                         colorBorde: 'borde-secundario'
//     //                     };
//     //                 }
//     //                 this.cargandoKpi = false;
//     //                 this.cdr.detectChanges();
//     //             });
//     //         return;
//     //     }

//     //     // Si el código no matchea con nada, marcamos error
//     //     this.marcarError();
//     // }
//     private resolverDatosKpi(): void {
//         if (this.datosVivos && this.datosVivos.valor !== undefined) {
//             this.datosAutonomosSQL = this.datosVivos;
//             this.cargandoKpi = false;
//             this.cdr.detectChanges();
//             return;
//         }

//         if (!this.widgetConfig) return;

//         const codigoWidget = (this.widgetConfig.type || this.widgetConfig.codigoWidget || '').trim().toUpperCase();
//         const puerto = (this.widgetConfig.puerto || 'BUENAVENTURA').trim().toUpperCase();

//         if (!codigoWidget) {
//             this.cargandoKpi = false;
//             return;
//         }

//         // ... Lógica autónoma de Marítimo, Bodegas, Gate, Contenedores ...
//         // (Omito los if() de los otros módulos para mantenerlo conciso, pero deja los tuyos tal cual están en tu archivo)

//         // 6. 🟢 CONSUMO AUTÓNOMO PARA KPIs DE GNL (SCADA)
//         if (codigoWidget.startsWith('PTT_GNL_KPI_') || codigoWidget.includes('_GNL_')) {

//             // 🛑 PREVENCIÓN DE LOOP INFINITO: Si ya nos suscribimos, no lo hacemos otra vez al redimensionar la tarjeta
//             if (this.gnlSubscrito) return;
//             this.gnlSubscrito = true;

//             this.cargandoKpi = true;

//             this._gnlState.telemetriaFiltrada$
//                 .pipe(takeUntil(this.destroy$))
//                 .subscribe((telemetria: any) => {
//                     const t = telemetria || {};
//                     const esConsolidado = t.esConsolidado;
//                     const brazoLabel = esConsolidado ? 'SISTEMA CONSOLIDADO' : `BRAZO ${t.brazo_id || 'GENERAL'}`;

//                     // 🟢 CÁLCULO DE ENERGÍA DINÁMICO
//                     const flujoParaEnergia = Number(t.caudal_m3h ?? t.flujo_m3h ?? 0);
//                     const energiaCalculada = flujoParaEnergia > 0 ? ((flujoParaEnergia * 22.4) / 3600).toFixed(4) : 0;

//                     // 🟢 DICCIONARIO CALIBRADO EXACTAMENTE CON TU JSON DE SCADA
//                     const mapaGnlKpis: { [key: string]: any } = {
//                         'PTT_GNL_KPI_FLUJO': {
//                             titulo: 'CAUDAL DE FLUJO',
//                             valor: t.caudal_m3h ?? 0,
//                             unidad: 'm³/h',
//                             subtitulo: brazoLabel,
//                             colorBorde: 'borde-cyan'
//                         },
//                         'PTT_GNL_KPI_PRESION': {
//                             titulo: 'PRESIÓN',
//                             valor: t.presion ?? 0,
//                             unidad: 'psi',
//                             subtitulo: brazoLabel,
//                             colorBorde: 'borde-naranja'
//                         },
//                         'PTT_GNL_KPI_TEMP': {
//                             titulo: 'TEMPERATURA',
//                             valor: t.temp_ducto ?? 0,
//                             unidad: '°C',
//                             subtitulo: brazoLabel,
//                             colorBorde: 'borde-rojo'
//                         },
//                         'PTT_GNL_KPI_BOG': {
//                             titulo: 'BOG',
//                             valor: t.bog ?? 0, // <-- Llave exacta del JSON
//                             unidad: 'kg/h',
//                             subtitulo: 'Gas evaporado / Boil-off',
//                             colorBorde: 'borde-purple',
//                             icono: 'feather icon-wind'
//                         },
//                         'PTT_GNL_KPI_DESCARGA': {
//                             titulo: 'DESCARGA DE BUQUE',
//                             valor: t.descarga_buque ?? 0, // <-- Llave exacta del JSON
//                             unidad: 'm³/h',
//                             subtitulo: 'Telemetría de entrada',
//                             colorBorde: 'borde-blue',
//                             icono: 'feather icon-anchor'
//                         },
//                         'PTT_GNL_KPI_INYECCION': {
//                             titulo: 'INYECCIÓN A RED',
//                             valor: t.inyeccion ?? 0,
//                             unidad: 'm³/h',
//                             subtitulo: 'Flujo de salida a red',
//                             colorBorde: 'borde-green',
//                             icono: 'feather icon-log-out'
//                         },
//                         'PTT_GNL_KPI_TNQ_OCUP': {
//                             titulo: 'OCUPACIÓN DE PLANTA',
//                             valor: t.volumen_almacenado ?? 0, // <-- Llave exacta del JSON
//                             unidad: '%',
//                             subtitulo: 'Porcentaje de llenado de tanques',
//                             colorBorde: 'borde-amarillo',
//                             icono: 'feather icon-database'
//                         },
//                         // Según tu código anterior, aquí mapeabas Volumen hacia Energía.
//                         'PTT_GNL_KPI_VOLUMEN': {
//                             titulo: 'ENERGÍA TRANSFERIDA',
//                             valor: energiaCalculada, // <-- Fórmula aplicada
//                             unidad: 'MMBTU',
//                             subtitulo: 'Totalizador de energía',
//                             colorBorde: 'borde-indigo',
//                             icono: 'feather icon-zap'
//                         },
//                         'PTT_GNL_KPI_CALIDAD': {
//                             titulo: 'PODER CALORÍFICO',
//                             valor: t.poder_calorifico ?? 0, // <-- Llave exacta del JSON
//                             unidad: 'BTU/ft³',
//                             subtitulo: 'Calidad de la mezcla GNL',
//                             colorBorde: 'borde-teal',
//                             icono: 'feather icon-thermometer'
//                         }
//                     };

//                     if (mapaGnlKpis[codigoWidget]) {
//                         this.datosAutonomosSQL = mapaGnlKpis[codigoWidget];
//                     } else {
//                         this.datosAutonomosSQL = {
//                             valor: 0,
//                             titulo: 'Métrica GNL',
//                             subtitulo: 'Código no reconocido',
//                             colorBorde: 'borde-secundario'
//                         };
//                     }
//                     this.cargandoKpi = false;
//                     this.cdr.detectChanges();
//                 });
//             return;
//         }

//         // Si el código no matchea con nada, marcamos error
//         this.marcarError();
//     }

//     private marcarError(): void {
//         this.datosAutonomosSQL = { valor: 0, subtitulo: 'Sin conexión de datos' };
//         this.cargandoKpi = false;
//         this.cdr.detectChanges();
//     }

//     // 7. 🟢 DICCIONARIO VISUAL PARA LOS KPIs DE CONTENEDORES
//     private obtenerTitulosContenedores(codigo: string): any {
//         switch (codigo) {
//             case 'PTT_CONT_KPI_CARGADOS':
//                 return { titulo: 'CARGADOS PENDIENTES', icono: 'feather icon-box', colorBorde: 'borde-cyan' };
//             case 'PTT_CONT_KPI_VACIOS':
//                 return { titulo: 'VACÍOS POR DEVOLVER', icono: 'feather icon-refresh-cw', colorBorde: 'borde-naranja' };
//             case 'PTT_CONT_KPI_REEFER':
//                 return { titulo: 'REEFER ACTIVOS', icono: 'feather icon-thermometer', colorBorde: 'borde-teal' };
//             case 'PTT_CONT_KPI_FREETIME':
//                 return { titulo: 'FREE TIME VENCIDO', icono: 'feather icon-alert-triangle', colorBorde: 'borde-blue' };
//             default:
//                 return { titulo: 'Métrica Clave', icono: 'feather icon-activity', colorBorde: 'borde-primary' };
//         }
//     }

//     get data(): any {
//         if (!this.widgetConfig) return {};

//         const configBase = this.widgetConfig.data || this.widgetConfig || {};
//         const fuenteViva = this.datosAutonomosSQL || this.datosVivos || {};

//         return {
//             ...configBase,
//             ...fuenteViva,
//             titulo: fuenteViva.titulo || configBase.titulo || 'Métrica Clave',
//             valor:
//                 fuenteViva.valor !== undefined && fuenteViva.valor !== null
//                     ? fuenteViva.valor
//                     : configBase.valor || 0,
//             subtitulo: fuenteViva.subtitulo || configBase.subtitulo || '',
//             colorBorde: fuenteViva.colorBorde || configBase.colorBorde || configBase.color || 'info',
//             icono: fuenteViva.icono || configBase.icono || 'feather icon-activity'
//         };
//     }

//     get valorCompletoMuted(): string | null {
//         const origen = this.datosAutonomosSQL || this.widgetConfig?.data || this.widgetConfig || {};

//         if (origen.valorCompleto) {
//             return String(origen.valorCompleto);
//         }

//         const valorBruto = origen.valor ?? origen.value ?? '';
//         if (valorBruto === null || valorBruto === undefined || valorBruto === '') return null;

//         const texto = String(valorBruto).trim();
//         if (texto.includes('%')) return null;

//         const match = texto.match(/^([+-]?[\d.,]+)\s*([a-zA-Z/]+)?$/);
//         if (!match) return null;

//         const num = parseFloat(match[1].replace(/\./g, '').replace(',', '.'));
//         if (isNaN(num) || Math.abs(num) < 1000) {
//             return null;
//         }

//         const unidad = match[2] || origen.unidad || '';
//         const numeroFormateado = num.toLocaleString('es-CO', {
//             minimumFractionDigits: num % 1 !== 0 ? 1 : 0,
//             maximumFractionDigits: 1
//         });

//         return unidad ? `${numeroFormateado} ${unidad}` : numeroFormateado;
//     }

//     get isLoading(): boolean {
//         return !this.widgetConfig || (this.cargandoKpi && !this.datosAutonomosSQL && !this.datosVivos);
//     }

//     maximizarDesdeShell(): void {
//         if (this.isEnfoque) {
//             this._torreService.cerrarModoEnfoque();
//         } else {
//             this._torreService.abrirModoEnfoque(
//                 this.widgetConfig?.type || this.widgetConfig?.codigoWidget || 'PTT_MAE_KPI_CAMIONES',
//                 this.data
//             );
//         }
//     }
// }
/* eslint-disable @typescript-eslint/no-explicit-any */
/*
    Author: German Valencia
    Pattern: PORTTOS Smart Widget - KPI Card Inteligente (Autónomo + Retrocompatible)
    Description: Tarjeta universal que detecta su prefijo (PTT_MAE_, PTT_BOD_, PTT_GATE_, PTT_GNL_, PTT_CONT_)
                 y se auto-conecta a su respectivo servicio en la Torre de Control.
*/
import { Component, Input, OnInit, OnChanges, OnDestroy, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { DashboardService } from 'src/app/theme/shared/service/tablero-control/dashboard.service';
import { MaritimoService } from 'src/app/theme/shared/service/tablero-control/maritimo.service';
import { BodegasService } from 'src/app/theme/shared/service/tablero-control/bodegas.service';
import { VirtualGateService } from 'src/app/theme/shared/service/tablero-control/virtual-gate.service';
import { GnlStateService } from 'src/app/theme/shared/service/tablero-control/gnl-state.service';
import { ContenedoresService } from 'src/app/theme/shared/service/tablero-control/contenedores.service';

import { KpiShellComponent } from 'src/app/theme/shared/components/kpi-shell/kpi-shell.component';
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

    // Bandera para evitar múltiples suscripciones en modo autónomo (Memory Leak)
    private gnlSubscrito: boolean = false;

    private readonly destroy$ = new Subject<void>();

    constructor(
        private _maritimoService: MaritimoService,
        private _bodegasService: BodegasService,
        private _virtualGateService: VirtualGateService,
        private _gnlState: GnlStateService,
        private _contenedoresService: ContenedoresService,
        private _torreService: DashboardService,
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

        if (!codigoWidget) {
            this.cargandoKpi = false;
            return;
        }

        this.cargandoKpi = true;

        // 2. Consumo autónomo para KPIs Marítimos
        if (codigoWidget.startsWith('PTT_MAE_KPI_')) {
            this._maritimoService.obtenerDatosWidgetMaritimo(puerto, codigoWidget)
                .pipe(takeUntil(this.destroy$)).subscribe({
                    next: (kpiData: any) => {
                        if (kpiData) this.datosAutonomosSQL = kpiData;
                        this.cargandoKpi = false;
                        this.cdr.detectChanges();
                    },
                    error: () => this.marcarError()
                });
            return;
        }

        // 3. Consumo autónomo para KPIs de Bodegas
        if (codigoWidget.startsWith('PTT_BOD_') || codigoWidget.includes('_BOD_')) {
            this._bodegasService.obtenerDatosWidgetBodegas(puerto, codigoWidget)
                .pipe(takeUntil(this.destroy$)).subscribe({
                    next: (kpiData: any) => {
                        if (kpiData) this.datosAutonomosSQL = kpiData;
                        this.cargandoKpi = false;
                        this.cdr.detectChanges();
                    },
                    error: () => this.marcarError()
                });
            return;
        }

        // 4. Consumo autónomo para KPIs de Virtual Gate
        if (codigoWidget.startsWith('PTT_GATE_KPI_')) {
            this._virtualGateService.obtenerDatosWidgetGate(codigoWidget, puerto)
                .pipe(takeUntil(this.destroy$)).subscribe({
                    next: (kpiData: any) => {
                        if (kpiData) this.datosAutonomosSQL = kpiData;
                        this.cargandoKpi = false;
                        this.cdr.detectChanges();
                    },
                    error: () => this.marcarError()
                });
            return;
        }

        // 5. Consumo autónomo para KPIs de Contenedores
        if (codigoWidget.startsWith('PTT_CONT_KPI_')) {
            this._contenedoresService.obtenerDatosWidgetContenedores(codigoWidget, puerto)
                .pipe(takeUntil(this.destroy$)).subscribe({
                    next: (res: any) => {
                        const infoBase = this.obtenerTitulosContenedores(codigoWidget);
                        this.datosAutonomosSQL = { ...infoBase, ...res };
                        this.cargandoKpi = false;
                        this.cdr.detectChanges();
                    },
                    error: () => this.marcarError()
                });
            return;
        }

        // 6. Consumo autónomo para KPIs de GNL (Socket Reactivo)
        if (codigoWidget.startsWith('PTT_GNL_KPI_') || codigoWidget.includes('_GNL_')) {

            // Prevención de fugas de memoria y recálculos innecesarios
            if (this.gnlSubscrito) {
                this.cargandoKpi = false;
                return;
            }
            this.gnlSubscrito = true;

            this._gnlState.telemetriaFiltrada$
                .pipe(takeUntil(this.destroy$))
                .subscribe((telemetria: any) => {
                    const t = telemetria || {};
                    const esConsolidado = t.esConsolidado;
                    const brazoLabel = esConsolidado ? 'SISTEMA CONSOLIDADO' : `BRAZO ${t.brazo_id || 'GENERAL'}`;

                    // CÁLCULO DE ENERGÍA DINÁMICO
                    const flujoParaEnergia = Number(t.caudal_m3h ?? t.flujo_m3h ?? t.flujo_m3 ?? 0);
                    const energiaCalculada = flujoParaEnergia > 0 ? ((flujoParaEnergia * 22.4) / 3600).toFixed(4) : 0;

                    // DICCIONARIO CALIBRADO EXACTAMENTE CON EL JSON SCADA
                    const mapaGnlKpis: { [key: string]: any } = {
                        'PTT_GNL_KPI_FLUJO': {
                            titulo: 'CAUDAL DE FLUJO',
                            valor: t.caudal_m3h ?? t.flujo_m3h ?? t.flujo_m3 ?? 0,
                            unidad: 'm³/h',
                            subtitulo: brazoLabel,
                            colorBorde: 'borde-cyan'
                        },
                        'PTT_GNL_KPI_PRESION': {
                            titulo: 'PRESIÓN',
                            valor: t.presion ?? 0,
                            unidad: 'psi',
                            subtitulo: brazoLabel,
                            colorBorde: 'borde-naranja'
                        },
                        'PTT_GNL_KPI_TEMP': {
                            titulo: 'TEMPERATURA',
                            valor: t.temp_ducto ?? 0,
                            unidad: '°C',
                            subtitulo: brazoLabel,
                            colorBorde: 'borde-rojo'
                        },
                        'PTT_GNL_KPI_BOG': {
                            titulo: 'BOG',
                            valor: t.bog ?? 0,
                            unidad: 'kg/h',
                            subtitulo: 'Gas evaporado / Boil-off',
                            colorBorde: 'borde-purple',
                            icono: 'feather icon-wind'
                        },
                        'PTT_GNL_KPI_DESCARGA': {
                            titulo: 'DESCARGA DE BUQUE',
                            valor: t.descarga_buque ?? 0,
                            unidad: 'm³/h',
                            subtitulo: 'Telemetría de entrada',
                            colorBorde: 'borde-blue',
                            icono: 'feather icon-anchor'
                        },
                        'PTT_GNL_KPI_INYECCION': {
                            titulo: 'INYECCIÓN A RED',
                            valor: t.inyeccion ?? 0,
                            unidad: 'm³/h',
                            subtitulo: 'Flujo de salida a red',
                            colorBorde: 'borde-green',
                            icono: 'feather icon-log-out'
                        },
                        'PTT_GNL_KPI_TNQ_OCUP': {
                            titulo: 'OCUPACIÓN DE PLANTA',
                            valor: t.volumen_almacenado ?? 0,
                            unidad: '%',
                            subtitulo: 'Porcentaje de llenado de tanques',
                            colorBorde: 'borde-amarillo',
                            icono: 'feather icon-database'
                        },
                        'PTT_GNL_KPI_VOLUMEN': {
                            titulo: 'ENERGÍA TRANSFERIDA',
                            valor: energiaCalculada,
                            unidad: 'MMBTU',
                            subtitulo: 'Energía del último segundo',
                            colorBorde: 'borde-indigo',
                            icono: 'feather icon-zap'
                        },
                        'PTT_GNL_KPI_CALIDAD': {
                            titulo: 'PODER CALORÍFICO',
                            valor: t.poder_calorifico ?? 0,
                            unidad: 'BTU/ft³',
                            subtitulo: 'Calidad de la mezcla GNL',
                            colorBorde: 'borde-teal',
                            icono: 'feather icon-thermometer'
                        },
                        // Agregados 2026-10-17: estaban en el registro pero caían en "Código no reconocido"
                        'PTT_GNL_KPI_CALORIFICO': {
                            titulo: 'PODER CALORÍFICO',
                            valor: t.poder_calorifico ?? 0,
                            unidad: 'BTU/ft³',
                            subtitulo: brazoLabel,
                            colorBorde: 'borde-teal',
                            icono: 'feather icon-thermometer'
                        },
                        'PTT_GNL_KPI_ALERTAS': {
                            titulo: 'ALARMAS ACTIVAS',
                            valor: Array.isArray(t.alertas) ? t.alertas.length : (t.alarma_activa ? 1 : 0),
                            unidad: '',
                            subtitulo: t.alarma_activa ? 'Alarma en el último pulso' : 'Sin alarma en el último pulso',
                            colorBorde: t.alarma_activa ? 'borde-rojo' : 'borde-green',
                            icono: 'feather icon-bell'
                        },
                        'PTT_GNL_KPI_ODO_MMBTU': {
                            titulo: 'ENERGÍA ACUMULADA',
                            valor: this.acumularEnergiaGnl(Number(energiaCalculada) || 0, t.timestamp).toFixed(2),
                            unidad: 'MMBTU',
                            subtitulo: 'Desde que se abrió el tablero',
                            colorBorde: 'borde-indigo',
                            icono: 'feather icon-zap'
                        }
                    };

                    if (mapaGnlKpis[codigoWidget]) {
                        const kpi = mapaGnlKpis[codigoWidget];
                        // Datos de demo: se rotulan para que no se presenten como telemetría real
                        this.datosAutonomosSQL = t.simulado
                            ? { ...kpi, subtitulo: `${kpi.subtitulo} · SIMULADO` }
                            : kpi;
                    } else {
                        // Fallback si el código no está mapeado
                        this.datosAutonomosSQL = {
                            valor: 0,
                            titulo: 'Métrica GNL',
                            subtitulo: 'Código no reconocido',
                            colorBorde: 'borde-secundario'
                        };
                    }
                    this.cargandoKpi = false;
                    this.cdr.detectChanges();
                });
            return;
        }

        // Si el código no matchea con nada, marcamos error
        this.marcarError();
    }

    private marcarError(): void {
        this.datosAutonomosSQL = { valor: 0, subtitulo: 'Sin conexión de datos' };
        this.cargandoKpi = false;
        this.cdr.detectChanges();
    }

    // DICCIONARIO VISUAL PARA LOS KPIs DE CONTENEDORES
    /** Totalizador simple de energía GNL por instancia de tarjeta (un pulso por timestamp). */
    private energiaAcumuladaGnl = 0;
    private ultimoPulsoGnl: string | null = null;
    private acumularEnergiaGnl(energiaPulso: number, timestamp?: string): number {
        if (timestamp && timestamp !== this.ultimoPulsoGnl) {
            this.ultimoPulsoGnl = timestamp;
            this.energiaAcumuladaGnl += energiaPulso;
        }
        return this.energiaAcumuladaGnl;
    }

    private obtenerTitulosContenedores(codigo: string): any {
        switch (codigo) {
            case 'PTT_CONT_KPI_CARGADOS':
                return { titulo: 'CARGADOS PENDIENTES', icono: 'feather icon-box', colorBorde: 'borde-cyan' };
            case 'PTT_CONT_KPI_VACIOS':
                return { titulo: 'VACÍOS POR DEVOLVER', icono: 'feather icon-refresh-cw', colorBorde: 'borde-naranja' };
            case 'PTT_CONT_KPI_REEFER':
                return { titulo: 'REEFER ACTIVOS', icono: 'feather icon-thermometer', colorBorde: 'borde-teal' };
            case 'PTT_CONT_KPI_FREETIME':
                return { titulo: 'FREE TIME VENCIDO', icono: 'feather icon-alert-triangle', colorBorde: 'borde-blue' };
            default:
                return { titulo: 'Métrica Clave', icono: 'feather icon-activity', colorBorde: 'borde-primary' };
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
            colorBorde: fuenteViva.colorBorde || configBase.colorBorde || configBase.color || 'info',
            icono: fuenteViva.icono || configBase.icono || 'feather icon-activity'
        };
    }

    get valorCompletoMuted(): string | null {
        const origen = this.datosAutonomosSQL || this.widgetConfig?.data || this.widgetConfig || {};

        if (origen.valorCompleto) {
            return String(origen.valorCompleto);
        }

        const valorBruto = origen.valor ?? origen.value ?? '';
        if (valorBruto === null || valorBruto === undefined || valorBruto === '') return null;

        const texto = String(valorBruto).trim();
        if (texto.includes('%')) return null;

        const match = texto.match(/^([+-]?[\d.,]+)\s*([a-zA-Z/]+)?$/);
        if (!match) return null;

        const num = parseFloat(match[1].replace(/\./g, '').replace(',', '.'));
        if (isNaN(num) || Math.abs(num) < 1000) {
            return null;
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
                this.widgetConfig?.type || this.widgetConfig?.codigoWidget || 'PTT_MAE_KPI_CAMIONES',
                this.data
            );
        }
    }
}
