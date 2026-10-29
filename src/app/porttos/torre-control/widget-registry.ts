/*
    Author: German Valencia
    Pattern: Widget Registry
*/
import { Type } from '@angular/core';

import {
    KpiCardTclComponent,
    VesselTableComponent,
    EtaChartComponent,
    ToneladasChartComponent,
    CanalConditionsComponent,
    ReportesOperativosComponent,
    TerminalSummaryCardComponent,
    ProductividadChartComponent,
    TipoOperacionComponent,
    MatrizCargaComponent,
    HistoricoAnualComponent,
    ImplicacionesOperativasComponent,
    MapaLogisticoComponent,
} from '../../theme/shared/widgets/widget-index';

import { ReporteSemanalMaritimoComponent } from '../widgets/panel-maritimo/reporte-semanal-maritimo/reporte-semanal-maritimo.component';
import { AnalisisTraficoComponent } from '../widgets/panel-maritimo/analisis-trafico/analisis-trafico.component';
import { ParticipacionNacionalComponent } from '../widgets/panel-maritimo/participacion-nacional/participacion-nacional.component';
import { MezclaCargaComponent } from '../widgets/panel-maritimo/mezcla-carga/mezcla-carga.component';
import { TableColaGateComponent } from '../widgets/panel-virtual-gate/table-cola-gate/table-cola-gate.component';
import { GateValidacionComponent } from '../widgets/panel-virtual-gate/gate-validacion/gate-validacion.component';
import { GateAlertasComponent } from '../widgets/panel-virtual-gate/gate-alertas/gate-alertas.component';
import { ChartDoughnutComponent } from '../widgets/panel-virtual-gate/chart-doughnut/chart-doughnut.component';
import { ChartStackedBarComponent } from '../widgets/panel-virtual-gate/chart-stacked-bar/chart-stacked-bar.component';
import { GateEstadoCitasComponent } from '../widgets/panel-virtual-gate/gate-estado-citas/gate-estado-citas.component';
import { ContenedoresPatiosComponent } from '../widgets/panel-contenedores/contenedores-patios/contenedores-patios.component';
import { TableContenedoresComponent } from '../widgets/panel-contenedores/table-contenedores/table-contenedores.component';
import { ChartBarContComponent } from '../widgets/panel-contenedores/chart-bar-cont/chart-bar-cont.component';
import { ChartStackedBarContComponent } from '../widgets/panel-contenedores/chart-stacked-bar-cont/chart-stacked-bar-cont.component';
import { ChartDoughnutContComponent } from '../widgets/panel-contenedores/chart-doughnut-cont/chart-doughnut-cont.component';
import { GnlGaugeWidgetComponent } from '../widgets/panel-gnl/gnl-gauge-widget/gnl-gauge-widget.component';
import { GnlFlujoChartComponent } from '../widgets/panel-gnl/gnl-flujo-chart/gnl-flujo-chart.component';
import { GnlAlarmasWidgetComponent } from '../widgets/panel-gnl/gnl-alarmas-widget/gnl-alarmas-widget.component';
import { GnlTempSparklineWidgetComponent } from '../widgets/panel-gnl/gnl-temp-sparkline-widget/gnl-temp-sparkline-widget.component';
import { BodegasSaturacionComponent } from '../widgets/panel-bodegas/bodegas-saturacion/bodegas-saturacion.component';
import { ChartBarBodegasComponent } from '../widgets/panel-bodegas/chart-bar-bodegas/chart-bar-bodegas.component';
import { ChartDoughnutBodegasComponent } from '../widgets/panel-bodegas/chart-doughnut-bodegas/chart-doughnut-bodegas.component';
import { TableBodegasComponent } from '../widgets/panel-bodegas/table-bodegas/table-bodegas.component';

// Marítimo en vivo (AIS + DIMAR)
import { KpisMaritimoVivoComponent } from '../widgets/panel-maritimo-vivo/kpis-vivo/kpis-maritimo-vivo.component';
import { ColaFondeoComponent } from '../widgets/panel-maritimo-vivo/cola-fondeo/cola-fondeo.component';
import { OcupacionMuellesComponent } from '../widgets/panel-maritimo-vivo/ocupacion-muelles/ocupacion-muelles.component';
import { LlegadasMaritimasComponent } from '../widgets/panel-maritimo-vivo/llegadas/llegadas-maritimas.component';
import { TiemposFondeoComponent } from '../widgets/panel-maritimo-vivo/tiempos-fondeo/tiempos-fondeo.component';

// Pestañas Granel, Carga suelta, Capacidad y Noticias (migración 013; datos en TablerosPestanasService)
import { MotonavesGranelComponent } from '../widgets/panel-granel/motonaves-granel/motonaves-granel.component';
import { ProductoGranelComponent } from '../widgets/panel-granel/producto-granel/producto-granel.component';
import { EquiposGranelComponent } from '../widgets/panel-granel/equipos-granel/equipos-granel.component';
import { BodegasGranelComponent } from '../widgets/panel-granel/bodegas-granel/bodegas-granel.component';
import { TendenciaGranelComponent } from '../widgets/panel-granel/tendencia-granel/tendencia-granel.component';
import { HistoricoGranelComponent } from '../widgets/panel-granel/historico-granel/historico-granel.component';
import { BreakbulkSueltaComponent } from '../widgets/panel-carga-suelta/breakbulk-suelta/breakbulk-suelta.component';
import { ProyectoSueltaComponent } from '../widgets/panel-carga-suelta/proyecto-suelta/proyecto-suelta.component';
import { ComposicionSueltaComponent } from '../widgets/panel-carga-suelta/composicion-suelta/composicion-suelta.component';
import { PatiosVehiculosComponent } from '../widgets/panel-carga-suelta/patios-vehiculos/patios-vehiculos.component';
import { RoroSueltaComponent } from '../widgets/panel-carga-suelta/roro-suelta/roro-suelta.component';
import { MarcasVehiculosComponent } from '../widgets/panel-carga-suelta/marcas-vehiculos/marcas-vehiculos.component';
import { IndicadoresSueltaComponent } from '../widgets/panel-carga-suelta/indicadores-suelta/indicadores-suelta.component';
import { HistoricoSueltaComponent } from '../widgets/panel-carga-suelta/historico-suelta/historico-suelta.component';
import { SaturacionCapacidadComponent } from '../widgets/panel-capacidad/saturacion-capacidad/saturacion-capacidad.component';
import { TraficoCapacidadComponent } from '../widgets/panel-capacidad/trafico-capacidad/trafico-capacidad.component';
import { NodosCapacidadComponent } from '../widgets/panel-capacidad/nodos-capacidad/nodos-capacidad.component';
import { TendenciaCapacidadComponent } from '../widgets/panel-capacidad/tendencia-capacidad/tendencia-capacidad.component';
import { FeedNoticiasComponent } from '../widgets/panel-noticias/feed-noticias/feed-noticias.component';
import { CorredoresNoticiasComponent } from '../widgets/panel-noticias/corredores-noticias/corredores-noticias.component';
import { ClimaPuertosComponent } from '../widgets/panel-noticias/clima-puertos/clima-puertos.component';
import { FuentesNoticiasComponent } from '../widgets/panel-noticias/fuentes-noticias/fuentes-noticias.component';
import { AnalistaIAComponent } from '../widgets/panel-ia/analista-ia/analista-ia.component';

export interface IWidgetRegistryDef {
    componente: Type<unknown>;
    defaultCols: number;
    defaultRows: number;
}

const DEFINICION_TERMINAL_DINAMICA: IWidgetRegistryDef = {
    componente: TerminalSummaryCardComponent,
    defaultCols: 4,
    defaultRows: 3
};

/** Analista IA (fase 3): un código por pestaña, PTT_IA_ANALISTA_<PESTAÑA> (migración 016). Se resuelve por prefijo. */
const DEFINICION_ANALISTA_IA: IWidgetRegistryDef = {
    componente: AnalistaIAComponent,
    defaultCols: 4,
    defaultRows: 6
};

const BASE_WIDGET_MAP: { [key: string]: IWidgetRegistryDef } = {
    // ==========================================
    // PESTAÑA 1: MARÍTIMO (PTT_MAE_)
    // ==========================================
    'PTT_MAE_KPI_CAMIONES': { componente: KpiCardTclComponent, defaultCols: 2, defaultRows: 2 },
    'PTT_MAE_KPI_CONTENEDORES': { componente: KpiCardTclComponent, defaultCols: 2, defaultRows: 2 },
    'PTT_MAE_KPI_GRANEL': { componente: KpiCardTclComponent, defaultCols: 2, defaultRows: 2 },
    'PTT_MAE_KPI_CARGA_SUELTA': { componente: KpiCardTclComponent, defaultCols: 2, defaultRows: 2 },
    'PTT_MAE_KPI_RORO': { componente: KpiCardTclComponent, defaultCols: 2, defaultRows: 2 },
    'PTT_MAE_KPI_BODEGAS': { componente: KpiCardTclComponent, defaultCols: 2, defaultRows: 2 },
    'PTT_MAE_KPI_ESPERADOS': { componente: KpiCardTclComponent, defaultCols: 2, defaultRows: 2 },
    'PTT_MAE_KPI_FONDEO': { componente: KpiCardTclComponent, defaultCols: 2, defaultRows: 2 },
    'PTT_MAE_KPI_MUELLE': { componente: KpiCardTclComponent, defaultCols: 2, defaultRows: 2 },

    'PTT_MAE_WGT_TERMINAL': DEFINICION_TERMINAL_DINAMICA,
    'WDG_PORT_TERMINAL_INDIVIDUAL': DEFINICION_TERMINAL_DINAMICA,
    'WDG_TERMINALES': DEFINICION_TERMINAL_DINAMICA,
    'TERM_SLOT_0': DEFINICION_TERMINAL_DINAMICA,
    'TERM_SLOT_1': DEFINICION_TERMINAL_DINAMICA,
    'TERM_SLOT_2': DEFINICION_TERMINAL_DINAMICA,
    'TERM_SLOT_3': DEFINICION_TERMINAL_DINAMICA,
    'TERM_SLOT_4': DEFINICION_TERMINAL_DINAMICA,
    'TERM_SLOT_5': DEFINICION_TERMINAL_DINAMICA,
    'TERM_SLOT_6': DEFINICION_TERMINAL_DINAMICA,
    'TERM_SLOT_7': DEFINICION_TERMINAL_DINAMICA,
    'TERM_SLOT_8': DEFINICION_TERMINAL_DINAMICA,
    'TERM_SLOT_9': DEFINICION_TERMINAL_DINAMICA,

    'PTT_MAE_TAB_MOTONAVES': { componente: VesselTableComponent, defaultCols: 8, defaultRows: 4 },
    'PTT_MAE_CHRT_ETA_ATA': { componente: EtaChartComponent, defaultCols: 4, defaultRows: 4 },
    'PTT_MAE_CHRT_TONELADAS': { componente: ToneladasChartComponent, defaultCols: 6, defaultRows: 3 },
    'PTT_MAE_PANEL_CANAL': { componente: CanalConditionsComponent, defaultCols: 6, defaultRows: 3 },
    'PTT_MAE_PANEL_RESUMEN': { componente: ReporteSemanalMaritimoComponent, defaultCols: 4, defaultRows: 3 },
    'PTT_MAE_CHRT_PROD': { componente: ProductividadChartComponent, defaultCols: 4, defaultRows: 3 },
    'PTT_MAE_PANEL_ALERTAS': { componente: ReportesOperativosComponent, defaultCols: 4, defaultRows: 3 },
    'PTT_MAE_PANEL_TRAFICO': {
        componente: AnalisisTraficoComponent,
        defaultCols: 12,
        defaultRows: 4
    },
    'PTT_MAE_CHRT_PART_TERM': {
        componente: ParticipacionNacionalComponent,
        defaultCols: 4,
        defaultRows: 3
    },
    'PTT_MAE_CHRT_MEZCLA': { componente: MezclaCargaComponent, defaultCols: 4, defaultRows: 3 },
    'PTT_MAE_CHRT_TIPO_OP': { componente: TipoOperacionComponent, defaultCols: 4, defaultRows: 3 },
    'PTT_MAE_TAB_MATRIZ_CARGA': { componente: MatrizCargaComponent, defaultCols: 8, defaultRows: 3 },
    'PTT_MAE_MATRIZ_CARGA': { componente: MatrizCargaComponent, defaultCols: 8, defaultRows: 4 },
    'PTT_MAE_CHRT_HISTORICO': { componente: HistoricoAnualComponent, defaultCols: 4, defaultRows: 4 },
    'PTT_MAE_PANEL_IMPLICACIONES': { componente: ImplicacionesOperativasComponent, defaultCols: 12, defaultRows: 4 },
    // Marítimo en vivo: se auto-hidratan y se refrescan con los cambios de estado AIS
    'PTT_MAE_VIVO_KPIS': { componente: KpisMaritimoVivoComponent, defaultCols: 12, defaultRows: 2 },
    'PTT_MAE_VIVO_COLA_FONDEO': { componente: ColaFondeoComponent, defaultCols: 4, defaultRows: 5 },
    'PTT_MAE_VIVO_MUELLES': { componente: OcupacionMuellesComponent, defaultCols: 8, defaultRows: 5 },
    'PTT_MAE_VIVO_LLEGADAS': { componente: LlegadasMaritimasComponent, defaultCols: 8, defaultRows: 5 },
    'PTT_MAE_VIVO_TIEMPOS': { componente: TiemposFondeoComponent, defaultCols: 4, defaultRows: 5 },
    'PTT_IA_ANALISTA_MARITIMO': { componente: TiemposFondeoComponent, defaultCols: 4, defaultRows: 6 },

    'PTT_MAP_WGT_LOGISTICO': { componente: MapaLogisticoComponent, defaultCols: 12, defaultRows: 12 },
    'PTT_IA_ANALISTA_MAPA': { componente: AnalistaIAComponent, defaultCols: 4, defaultRows: 6 },

    // ==========================================
    // PESTAÑA 2: VIRTUAL GATE (PTT_GATE_)
    // ==========================================
    'PTT_GATE_KPI_OP': { componente: KpiCardTclComponent, defaultCols: 2, defaultRows: 2 },
    'PTT_GATE_KPI_CONT': { componente: KpiCardTclComponent, defaultCols: 2, defaultRows: 2 },
    'PTT_GATE_KPI_GRANEL': { componente: KpiCardTclComponent, defaultCols: 2, defaultRows: 2 },
    'PTT_GATE_KPI_SUELTA': { componente: KpiCardTclComponent, defaultCols: 2, defaultRows: 2 },
    'PTT_GATE_KPI_RORO': { componente: KpiCardTclComponent, defaultCols: 2, defaultRows: 2 },
    'PTT_GATE_KPI_BODEGAS': { componente: KpiCardTclComponent, defaultCols: 2, defaultRows: 2 },
    'PTT_GATE_KPI_SUB_CONT': { componente: KpiCardTclComponent, defaultCols: 2, defaultRows: 2 },
    'PTT_GATE_KPI_SUB_GRANEL': { componente: KpiCardTclComponent, defaultCols: 2, defaultRows: 2 },
    'PTT_GATE_KPI_SUB_SUELTA': { componente: KpiCardTclComponent, defaultCols: 2, defaultRows: 2 },
    'PTT_GATE_KPI_SUB_NINERAS': { componente: KpiCardTclComponent, defaultCols: 2, defaultRows: 2 },
    'PTT_GATE_PANEL_VAL': { componente: GateValidacionComponent, defaultCols: 4, defaultRows: 4 },
    'PTT_GATE_PANEL_ALERTAS': { componente: GateAlertasComponent, defaultCols: 4, defaultRows: 4 },
    'PTT_GATE_CHRT_DIST': { componente: ChartDoughnutComponent, defaultCols: 4, defaultRows: 4 },
    'PTT_GATE_CHRT_10KM': { componente: ChartDoughnutComponent, defaultCols: 4, defaultRows: 4 },
    'PTT_GATE_CHRT_CITAS': { componente: ChartStackedBarComponent, defaultCols: 8, defaultRows: 4 },
    'PTT_GATE_PANEL_ESTADO': { componente: GateEstadoCitasComponent, defaultCols: 4, defaultRows: 4 },
    'PTT_GATE_TAB_COLA': { componente: TableColaGateComponent, defaultCols: 12, defaultRows: 6 },
    'PTT_GATE_TABLA_COLA': { componente: TableColaGateComponent, defaultCols: 12, defaultRows: 6 },
    'PTT_IA_ANALISTA_VIRTUAL_GATE': { componente: AnalistaIAComponent, defaultCols: 4, defaultRows: 6 },

    // ==========================================
    // PESTAÑA 3: CONTENEDORES (PTT_CONT_)
    // ==========================================
    'PTT_CONT_KPI_CARGADOS': { componente: KpiCardTclComponent, defaultCols: 2, defaultRows: 2 },
    'PTT_CONT_KPI_VACIOS': { componente: KpiCardTclComponent, defaultCols: 2, defaultRows: 2 },
    'PTT_CONT_KPI_REEFER': { componente: KpiCardTclComponent, defaultCols: 2, defaultRows: 2 },
    'PTT_CONT_KPI_FREETIME': { componente: KpiCardTclComponent, defaultCols: 2, defaultRows: 2 },
    'PTT_CONT_CHRT_RETIROS': { componente: ChartStackedBarContComponent, defaultCols: 6, defaultRows: 4 },
    'PTT_CONT_CHRT_NAVIERA': { componente: ChartBarContComponent, defaultCols: 6, defaultRows: 4 },
    'PTT_CONT_CHRT_FLUJO': { componente: ChartBarContComponent, defaultCols: 6, defaultRows: 4 },
    'PTT_CONT_PANEL_PATIOS': { componente: ContenedoresPatiosComponent, defaultCols: 6, defaultRows: 4 },
    'PTT_CONT_CHRT_FREETIME': { componente: ChartDoughnutContComponent, defaultCols: 6, defaultRows: 4 },
    'PTT_CONT_CHRT_NAVIERAS': { componente: ChartDoughnutContComponent, defaultCols: 6, defaultRows: 4 },
    'PTT_CONT_TAB_MOVIMIENTOS': { componente: TableContenedoresComponent, defaultCols: 12, defaultRows: 4 },
    'PTT_IA_ANALISTA_CONTENEDORES': { componente: AnalistaIAComponent, defaultCols: 4, defaultRows: 6 },

    // ==========================================
    // PESTAÑA 4: GNL Gas Natural Liquido (PTT_GNL_)
    // ==========================================
    'PTT_GNL_KPI_VOLUMEN': { componente: KpiCardTclComponent, defaultCols: 2, defaultRows: 2 },
    'PTT_GNL_KPI_DESCARGA': { componente: KpiCardTclComponent, defaultCols: 2, defaultRows: 2 },
    'PTT_GNL_KPI_INYECCION': { componente: KpiCardTclComponent, defaultCols: 2, defaultRows: 2 },
    'PTT_GNL_KPI_BOG': { componente: KpiCardTclComponent, defaultCols: 2, defaultRows: 2 },
    'PTT_GNL_KPI_CALIDAD': { componente: KpiCardTclComponent, defaultCols: 2, defaultRows: 2 },
    'PTT_GNL_KPI_CALORIFICO': { componente: KpiCardTclComponent, defaultCols: 2, defaultRows: 2 },
    'PTT_GNL_KPI_FLUJO': { componente: KpiCardTclComponent, defaultCols: 2, defaultRows: 2 },
    'PTT_GNL_KPI_PRESION': { componente: KpiCardTclComponent, defaultCols: 2, defaultRows: 2 },
    'PTT_GNL_KPI_TEMP': { componente: KpiCardTclComponent, defaultCols: 2, defaultRows: 2 },
    'PTT_GNL_KPI_ALERTAS': { componente: KpiCardTclComponent, defaultCols: 2, defaultRows: 2 },
    'PTT_GNL_KPI_ODO_MMBTU': { componente: KpiCardTclComponent, defaultCols: 2, defaultRows: 2 },
    'PTT_GNL_KPI_TNQ_OCUP': { componente: KpiCardTclComponent, defaultCols: 2, defaultRows: 2 },
    'PTT_GNL_GAUGE_PRESION': { componente: GnlGaugeWidgetComponent, defaultCols: 3, defaultRows: 3 },
    'PTT_GNL_LINECHART_FLUJO': { componente: GnlFlujoChartComponent, defaultCols: 6, defaultRows: 3 },
    'PTT_GNL_CHART_ALM_EVENT': { componente: GnlAlarmasWidgetComponent, defaultCols: 6, defaultRows: 3 },
    'PTT_GNL_CHART_SPK_TEMP': { componente: GnlTempSparklineWidgetComponent, defaultCols: 6, defaultRows: 3 },
    'PTT_IA_ANALISTA_GNL': { componente: AnalistaIAComponent, defaultCols: 4, defaultRows: 6 },

    // ==========================================
    // PESTAÑA 5: BODEGAS (PTT_BOD_)
    // ==========================================
    'PTT_BOD_KPI_OCUPACION': { componente: KpiCardTclComponent, defaultCols: 2, defaultRows: 2 },
    'PTT_BOD_KPI_INVENTARIO': { componente: KpiCardTclComponent, defaultCols: 2, defaultRows: 2 },
    'PTT_BOD_KPI_DESPACHOS': { componente: KpiCardTclComponent, defaultCols: 2, defaultRows: 2 },
    'PTT_BOD_KPI_ALERTAS': { componente: KpiCardTclComponent, defaultCols: 2, defaultRows: 2 },
    'PTT_BOD_PANEL_SATURACION': { componente: BodegasSaturacionComponent, defaultCols: 4, defaultRows: 4 },
    'PTT_BOD_CHRT_FLUJO': { componente: ChartBarBodegasComponent, defaultCols: 4, defaultRows: 4 },
    'PTT_BOD_CHRT_CARGA': { componente: ChartDoughnutBodegasComponent, defaultCols: 4, defaultRows: 4 },
    'PTT_BOD_TAB_MOVIMIENTOS': { componente: TableBodegasComponent, defaultCols: 12, defaultRows: 4 },
    'PTT_IA_ANALISTA_BODEGAS': { componente: AnalistaIAComponent, defaultCols: 4, defaultRows: 6 },

    // ==========================================
    // PESTAÑA 5: Granel, Carga suelta, Capacidad y Noticias (KPIs por kpi-card-tcl; el resto, widgets de cada pestaña) ──
    // ==========================================
    'PTT_GRA_KPI_AGRICOLA': { componente: KpiCardTclComponent, defaultCols: 3, defaultRows: 2 },
    'PTT_GRA_KPI_MINERAL': { componente: KpiCardTclComponent, defaultCols: 3, defaultRows: 2 },
    'PTT_GRA_KPI_LIQUIDO': { componente: KpiCardTclComponent, defaultCols: 3, defaultRows: 2 },
    'PTT_GRA_KPI_EQUIPOS': { componente: KpiCardTclComponent, defaultCols: 3, defaultRows: 2 },
    'PTT_GRA_TAB_MOTONAVES': { componente: MotonavesGranelComponent, defaultCols: 8, defaultRows: 3 },
    'PTT_GRA_CHRT_PRODUCTO': { componente: ProductoGranelComponent, defaultCols: 4, defaultRows: 3 },
    'PTT_GRA_TAB_EQUIPOS': { componente: EquiposGranelComponent, defaultCols: 8, defaultRows: 3 },
    'PTT_GRA_PANEL_BODEGAS': { componente: BodegasGranelComponent, defaultCols: 4, defaultRows: 3 },
    'PTT_GRA_CHRT_TENDENCIA': { componente: TendenciaGranelComponent, defaultCols: 4, defaultRows: 3 },
    'PTT_GRA_CHRT_HISTORICO': { componente: HistoricoGranelComponent, defaultCols: 4, defaultRows: 3 },
    'PTT_IA_ANALISTA_GRANEL': { componente: AnalistaIAComponent, defaultCols: 4, defaultRows: 6 },


    'PTT_SUE_KPI_BREAKBULK': { componente: KpiCardTclComponent, defaultCols: 3, defaultRows: 2 },
    'PTT_SUE_KPI_PROYECTO': { componente: KpiCardTclComponent, defaultCols: 3, defaultRows: 2 },
    'PTT_SUE_KPI_VEH_IMPORT': { componente: KpiCardTclComponent, defaultCols: 3, defaultRows: 2 },
    'PTT_SUE_KPI_VEH_EXPORT': { componente: KpiCardTclComponent, defaultCols: 3, defaultRows: 2 },
    'PTT_SUE_TAB_BREAKBULK': { componente: BreakbulkSueltaComponent, defaultCols: 8, defaultRows: 3 },
    'PTT_SUE_TAB_PROYECTO': { componente: ProyectoSueltaComponent, defaultCols: 8, defaultRows: 3 },
    'PTT_SUE_CHRT_COMPOSICION': { componente: ComposicionSueltaComponent, defaultCols: 4, defaultRows: 3 },
    'PTT_SUE_PANEL_PATIOS': { componente: PatiosVehiculosComponent, defaultCols: 4, defaultRows: 3 },
    'PTT_SUE_TAB_RORO': { componente: RoroSueltaComponent, defaultCols: 8, defaultRows: 3 },
    'PTT_SUE_CHRT_MARCAS': { componente: MarcasVehiculosComponent, defaultCols: 4, defaultRows: 3 },
    'PTT_SUE_PANEL_INDICADORES': { componente: IndicadoresSueltaComponent, defaultCols: 4, defaultRows: 3 },
    'PTT_SUE_CHRT_HISTORICO': { componente: HistoricoSueltaComponent, defaultCols: 4, defaultRows: 3 },
    'PTT_IA_ANALISTA_SUELTA': { componente: AnalistaIAComponent, defaultCols: 4, defaultRows: 6 },

    'PTT_CAP_KPI_NODOS': { componente: KpiCardTclComponent, defaultCols: 3, defaultRows: 2 },
    'PTT_CAP_KPI_TEU': { componente: KpiCardTclComponent, defaultCols: 3, defaultRows: 2 },
    'PTT_CAP_KPI_TON': { componente: KpiCardTclComponent, defaultCols: 3, defaultRows: 2 },
    'PTT_CAP_KPI_CRITICOS': { componente: KpiCardTclComponent, defaultCols: 3, defaultRows: 2 },
    'PTT_CAP_CHRT_SATURACION': { componente: SaturacionCapacidadComponent, defaultCols: 4, defaultRows: 3 },
    'PTT_CAP_CHRT_TRAFICO': { componente: TraficoCapacidadComponent, defaultCols: 4, defaultRows: 3 },
    'PTT_CAP_TAB_NODOS': { componente: NodosCapacidadComponent, defaultCols: 8, defaultRows: 3 },
    'PTT_CAP_CHRT_TENDENCIA': { componente: TendenciaCapacidadComponent, defaultCols: 4, defaultRows: 3 },
    'PTT_IA_ANALISTA_CAPACIDAD': { componente: AnalistaIAComponent, defaultCols: 4, defaultRows: 6 },

    'PTT_NOT_KPI_TRM': { componente: KpiCardTclComponent, defaultCols: 3, defaultRows: 2 },
    'PTT_NOT_KPI_NOTICIAS': { componente: KpiCardTclComponent, defaultCols: 3, defaultRows: 2 },
    'PTT_NOT_KPI_VIAS': { componente: KpiCardTclComponent, defaultCols: 3, defaultRows: 2 },
    'PTT_NOT_KPI_CLIMA': { componente: KpiCardTclComponent, defaultCols: 3, defaultRows: 2 },
    'PTT_NOT_FEED': { componente: FeedNoticiasComponent, defaultCols: 8, defaultRows: 5 },
    'PTT_NOT_CORREDORES': { componente: CorredoresNoticiasComponent, defaultCols: 4, defaultRows: 5 },
    'PTT_NOT_CLIMA_PUERTOS': { componente: ClimaPuertosComponent, defaultCols: 6, defaultRows: 3 },
    'PTT_NOT_FUENTES': { componente: FuentesNoticiasComponent, defaultCols: 6, defaultRows: 3 },
    'PTT_IA_ANALISTA_NOTICIAS': { componente: AnalistaIAComponent, defaultCols: 4, defaultRows: 6 },
};

export const WIDGET_MAP: { [key: string]: IWidgetRegistryDef } = new Proxy(BASE_WIDGET_MAP, {
    get(target, prop: string) {
        if (typeof prop !== 'string') return Reflect.get(target, prop);

        const key = prop.trim().toUpperCase();
        if (target[key]) {
            return target[key];
        }

        // Soporte dinámico infinito para clones de terminales (TERM_SLOT_0 ... TERM_SLOT_N)
        if (key.startsWith('TERM_SLOT_')) {
            return DEFINICION_TERMINAL_DINAMICA;
        }

        // Analista IA en cualquier pestaña (PTT_IA_ANALISTA, PTT_IA_ANALISTA_MARITIMO, ..._NOTICIAS)
        if (key.startsWith('PTT_IA_ANALISTA')) {
            return DEFINICION_ANALISTA_IA;
        }

        // Fallback seguro para cualquier KPI nuevo agregado en Base de Datos
        if (key.includes('_KPI_')) {
            return { componente: KpiCardTclComponent, defaultCols: 2, defaultRows: 2 };
        }

        return undefined;
    }
});
