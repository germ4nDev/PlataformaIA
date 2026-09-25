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

/**
 * FABRICA 2: Layout Marítimo (Híbrido)
 * Toma los widgets de la BD, inyecta los terminales del puerto en la mitad,
 * y empuja las analíticas hacia abajo para evitar colisiones.
 */
export function construirLayoutMaritimo(widgetsDesdeBD: any[], terminalesDelPuerto: any[]): IWidgetLayoutDef[] {
    let layoutFinal: IWidgetLayoutDef[] = [];

    // 1. Separar widgets de la BD: KPIs (Fila 0) y Analíticas (Resto)
    const widgetsArriba = widgetsDesdeBD.filter(w => w.y === 0);
    const widgetsAbajo = widgetsDesdeBD.filter(w => w.y > 0);

    // Pintamos los KPIs en su posición original
    layoutFinal.push(...widgetsArriba);

    // 2. Inyección Dinámica de Terminales
    let currentX = 0;
    let currentY = 1; // Los terminales siempre arrancan debajo de los KPIs
    const ALTO_TERMINAL = 2;
    const ANCHO_TERMINAL = 4; // 12 / 4 = 3 terminales por fila

    terminalesDelPuerto.forEach(terminal => {
        layoutFinal.push({
            type: `WDG_DINAMICO_TERM_${terminal.id}`,
            x: currentX,
            y: currentY,
            cols: ANCHO_TERMINAL,
            rows: ALTO_TERMINAL,
            data: terminal // Pasamos la metadata del terminal al componente
        });

        currentX += ANCHO_TERMINAL;

        // Salto de línea si llenamos las 12 columnas
        if (currentX >= 12) {
            currentX = 0;
            currentY += ALTO_TERMINAL;
        }
    });

    // 3. Calcular el Desplazamiento (Offset) para los widgets de abajo
    // Saber en qué fila exacta terminaron de dibujarse los terminales
    let filaFinTerminales = currentX > 0 ? currentY + ALTO_TERMINAL : currentY;

    if (widgetsAbajo.length > 0) {
        // Encontramos el "y" más pequeño del bloque de analíticas según la BD
        const minYOriginal = Math.min(...widgetsAbajo.map(w => w.y));

        // El offset calcula cuánto espacio extra generaron los terminales
        // respecto a donde la BD creía que empezaban las analíticas.
        const offset = filaFinTerminales - minYOriginal;

        // 4. Mapear y empujar los widgets inferiores manteniendo sus distancias relativas
        widgetsAbajo.forEach(w => {
            layoutFinal.push({
                type: w.type,
                x: w.x,
                y: w.y + offset, // 🟢 Desplazamiento mágico
                cols: w.cols,
                rows: w.rows,
                data: w.data || null
            });
        });
    }

    return layoutFinal;
}
