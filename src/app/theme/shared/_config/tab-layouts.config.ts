// tab-layouts.config.ts

export interface IWidgetLayoutDef {
    type: string;
    x: number;
    y: number;
    cols?: number;
    rows?: number;
    data?: any;
}

/**
 * FABRICA 1: Layout Estático
 * Útil para las pestañas (Gate, Contenedores) donde la base de datos
 * dicta exactamente cómo debe verse todo, sin inyecciones dinámicas.
 */
export function construirLayoutEstatico(widgetsDesdeBD: any[]): IWidgetLayoutDef[] {
    return widgetsDesdeBD.map(w => ({
        type: w.type,
        x: w.x,
        y: w.y,
        cols: w.cols,
        rows: w.rows,
        data: w.data || null
    }));
}

export function construirLayoutMaritimo(layoutBase: any[], terminalesApi: any[]): any[] {
    const layoutFinal: any[] = [];

    const baseMaritima = layoutBase.filter(w => !w.pestana || w.pestana === 'TLC_MARITIMO_001');

    const kpisSuperiores = baseMaritima.filter(w => w.type && w.type.startsWith('WDG_PORT_KPI_'));
    kpisSuperiores.forEach(kpi => {
        layoutFinal.push({ ...kpi, y: 0, x: kpi.x ?? 0 });
    });

    const widget = layoutBase.find(x => x.codigoWidget == 'WDG_PORT_TERMINAL_INDIVIDUAL');
    console.log('************ datos del widget terminal', widget);

    let terminalX = 0;
    let terminalY = 2;
    const widgetMaestroTerminal = baseMaritima.find(w => w.type === 'WDG_PORT_TERMINAL_INDIVIDUAL');
    const terminalCols = widgetMaestroTerminal?.cols || 4;
    const terminalRows = 3;

    let ultimaFilaTerminales = terminalY;

    if (terminalesApi && terminalesApi.length > 0) {
        terminalesApi.forEach((terminalInfo, index) => {
            layoutFinal.push({
                ...widgetMaestroTerminal,
                idClon: `TERM_${terminalInfo.codigo || index}`,
                data: terminalInfo,
                x: terminalX,
                y: terminalY,
                cols: terminalCols,
                rows: terminalRows
            });

            terminalX += terminalCols;
            if (terminalX >= 12) {
                terminalX = 0;
                terminalY += terminalRows; // Salto de fila cuando completamos 3 terminales
            }
        });
        // Determinamos la fila exactísima donde terminaron los terminales
        ultimaFilaTerminales = terminalX > 0 ? terminalY + terminalRows : terminalY;
    } else {
        ultimaFilaTerminales = 2;
    }

    // 4. CAPA 3: Widgets Inferiores (Tablas, Gráficas y Paneles) ordenados sin huecos
    const widgetsInferiores = baseMaritima.filter(w => {
        const t = w.type || '';
        return !t.startsWith('WDG_PORT_KPI_') && t !== 'WDG_PORT_TERMINAL_INDIVIDUAL';
    });

    let currentY = ultimaFilaTerminales;
    let currentX = 0;

    widgetsInferiores.forEach((widget) => {
        const cols = widget.cols || widget.defaultCols || 4;
        const rows = widget.rows || widget.defaultRows || 4;

        // Si el widget no cabe en el ancho restante de la fila, bajamos a la siguiente
        if (currentX + cols > 12) {
            currentX = 0;
            currentY += rows;
        }

        layoutFinal.push({
            ...widget,
            x: currentX,
            y: currentY,
            cols: cols,
            rows: rows
        });

        currentX += cols;
        if (currentX >= 12) {
            currentX = 0;
            currentY += rows;
        }
    });

    return layoutFinal;
}
