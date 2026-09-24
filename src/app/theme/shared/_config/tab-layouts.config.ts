import { WIDGET_MAP } from '../../../porttos/torre-control/widget-registry';

export interface IWidgetLayoutDef {
    type: string;
    x: number;
    y: number;
    // Opcional: Si quieres sobreescribir el tamaño por defecto del WIDGET_MAP
    cols?: number;
    rows?: number;
    data?: any;
}

export const DEFAULT_TAB_LAYOUTS: { [tabId: string]: IWidgetLayoutDef[] } = {

    // ==========================================
    // PESTAÑA: MARÍTIMO (TLC_MARITIMO_001)
    // ==========================================
    'TLC_MARITIMO_001': [
        // Fila 0: KPIs (y: 0)
        { type: 'WDG_PORT_KPI_CAMIONES_PUERTO', x: 0, y: 0 },
        { type: 'WDG_PORT_KPI_CONTENEDORES', x: 2, y: 0 },
        { type: 'WDG_PORT_KPI_GRANEL', x: 4, y: 0 },
        { type: 'WDG_PORT_KPI_CARGA_SUELTA', x: 6, y: 0 },
        { type: 'WDG_PORT_KPI_RORO', x: 8, y: 0 },
        { type: 'WDG_PORT_KPI_BODEGAS', x: 10, y: 0 },

        // Fila 1: Tabla y ETA (y: 1)
        { type: 'WDG_PORT_TABLE_REPORTE_MOTONAVES', x: 0, y: 1 },
        { type: 'WDG_PORT_CHART_ETA_ATA', x: 8, y: 1 },

        // Fila 2: Analíticas (y: 5 - asumiendo que la tabla ocupa 4 rows)
        { type: 'WDG_PORT_CHART_TONELADAS', x: 0, y: 5 },
        { type: 'WDG_PORT_CONDICIONES_CANAL', x: 6, y: 5 }
    ],

    // ==========================================
    // PESTAÑA: VIRTUAL GATE (TLC_VIRTUAL_GATE_001)
    // ==========================================
    'TLC_VIRTUAL_GATE_001': [
        // KPIs
        { type: 'WDG_PORT_KPI_GATE_OP', x: 0, y: 0 },
        { type: 'WDG_PORT_KPI_GATE_CONT', x: 2, y: 0 },
        { type: 'WDG_PORT_KPI_GATE_GRANEL', x: 4, y: 0 },

        // Gráficas
        { type: 'WDG_PORT_TABLE_COLA', x: 0, y: 1 },
        { type: 'WDG_PORT_CHART_CITAS', x: 0, y: 7 },
        { type: 'WDG_PORT_GATE_ESTADO', x: 8, y: 7 }
    ],

    // ==========================================
    // PESTAÑA: CONTENEDORES (TLC_CONTENEDORES_001)
    // ==========================================
    'TLC_CONTENEDORES_001': [
        { type: 'WDG_PORT_KPI_CONT_CARGADOS', x: 0, y: 0 },
        { type: 'WDG_PORT_KPI_CONT_VACIOS', x: 2, y: 0 },
        { type: 'WDG_PORT_CONT_TABLA', x: 0, y: 1 },
        { type: 'WDG_PORT_CONT_PATIOS', x: 0, y: 5 },
        { type: 'WDG_PORT_CONT_FREETIME_CHART', x: 6, y: 5 }
    ]
};
