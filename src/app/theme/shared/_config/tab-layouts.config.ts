export interface IWidgetLayoutDef {
    type: string;
    x: number;
    y: number;
    cols?: number;
    rows?: number;
    data?: any;
    idClon?: string;
}

// 🚨 PLANTILLA INTELIGENTE: Busca coincidencias parciales para no fallar jamás
function obtenerPlantilla(codigo: string) {
    if (!codigo) return null;
    const cod = codigo.toUpperCase();

    // KPIs (Fila 0)
    if (cod.includes('KPI_CAMIONES')) return { x: 0, y: 0, cols: 2, rows: 2 };
    if (cod.includes('KPI_CONTENEDORES')) return { x: 2, y: 0, cols: 2, rows: 2 };
    if (cod.includes('KPI_GRANEL')) return { x: 4, y: 0, cols: 2, rows: 2 };
    if (cod.includes('KPI_CARGA_SUELTA') || cod.includes('KPI_SUELTA')) return { x: 6, y: 0, cols: 2, rows: 2 };
    if (cod.includes('KPI_RORO')) return { x: 8, y: 0, cols: 2, rows: 2 };
    if (cod.includes('KPI_BODEGAS')) return { x: 10, y: 0, cols: 2, rows: 2 };

    // Fila 2: Motonaves (debajo de los terminales)
    if (cod.includes('MOTONAVES')) return { x: 0, y: 5, cols: 8, rows: 4 };
    if (cod.includes('ETA_ATA')) return { x: 8, y: 5, cols: 4, rows: 4 };

    // Fila 3
    if (cod.includes('TONELADAS')) return { x: 0, y: 9, cols: 8, rows: 4 };
    if (cod.includes('CANAL')) return { x: 8, y: 9, cols: 4, rows: 4 };

    // Fila 4
    if (cod.includes('RESUMEN')) return { x: 0, y: 13, cols: 4, rows: 4 };
    if (cod.includes('PROD')) return { x: 4, y: 13, cols: 4, rows: 4 };
    if (cod.includes('ALERTAS') || cod.includes('REPORTES_OP')) return { x: 8, y: 13, cols: 4, rows: 4 };

    // Fila 5
    if (cod.includes('TRAFICO')) return { x: 0, y: 17, cols: 12, rows: 4 };

    // Fila 6
    if (cod.includes('PART_TERM') || cod.includes('PARTICIPACION')) return { x: 0, y: 21, cols: 4, rows: 4 };
    if (cod.includes('MEZCLA')) return { x: 4, y: 21, cols: 4, rows: 4 };
    if (cod.includes('TIPO_OP')) return { x: 8, y: 21, cols: 4, rows: 4 };

    // Fila 7
    if (cod.includes('MATRIZ')) return { x: 0, y: 25, cols: 8, rows: 4 };
    if (cod.includes('HISTORICO')) return { x: 8, y: 25, cols: 4, rows: 4 };

    // Fila 8
    if (cod.includes('IMPLICACIONES')) return { x: 0, y: 29, cols: 12, rows: 2 };

    return null;
}

export function construirLayoutEstatico(layoutBase: any[]): any[] {
    // 🚨 DICCIONARIO AUTO-HEAL GLOBAL PARA VIRTUAL GATE Y CONTENEDORES
    // Traduce los códigos viejos que vengan de la BD a la nueva nomenclatura
    const MAPEO_GLOBAL: Record<string, string> = {
        // VIRTUAL GATE
        'WDG_PORT_KPI_GATE_OP': 'PTT_GATE_KPI_OP',
        'WDG_PORT_KPI_GATE_CONT': 'PTT_GATE_KPI_CONT',
        'WDG_PORT_KPI_GATE_GRANEL': 'PTT_GATE_KPI_GRANEL',
        'WDG_PORT_KPI_GATE_SUELTA': 'PTT_GATE_KPI_SUELTA',
        'WDG_PORT_KPI_GATE_RORO': 'PTT_GATE_KPI_RORO',
        'WDG_PORT_KPI_GATE_BODEGAS': 'PTT_GATE_KPI_BODEGAS',
        'WDG_PORT_KPI_SUB_CONT': 'PTT_GATE_KPI_SUB_CONT',
        'WDG_PORT_KPI_SUB_GRANEL': 'PTT_GATE_KPI_SUB_GRANEL',
        'WDG_PORT_KPI_SUB_SUELTA': 'PTT_GATE_KPI_SUB_SUELTA',
        'WDG_PORT_KPI_SUB_NINERAS': 'PTT_GATE_KPI_SUB_NINERAS',
        'WDG_PORT_PREGATE_VAL': 'PTT_GATE_PANEL_VAL',
        'WDG_PORT_GATE_ALERT': 'PTT_GATE_PANEL_ALERTAS',
        'WDG_PORT_CHART_DIST': 'PTT_GATE_CHRT_DIST',
        'WDG_PORT_CHART_CITAS': 'PTT_GATE_CHRT_CITAS',
        'WDG_PORT_GATE_ESTADO': 'PTT_GATE_PANEL_ESTADO',
        'WDG_PORT_TABLE_COLA': 'PTT_GATE_TAB_COLA',

        // CONTENEDORES
        'WDG_PORT_KPI_CONT_CARGADOS': 'PTT_CONT_KPI_CARGADOS',
        'WDG_PORT_KPI_CONT_VACIOS': 'PTT_CONT_KPI_VACIOS',
        'WDG_PORT_KPI_CONT_REEFER': 'PTT_CONT_KPI_REEFER',
        'WDG_PORT_KPI_CONT_FREETIME': 'PTT_CONT_KPI_FREETIME',
        'WDG_PORT_CONT_RETIROS': 'PTT_CONT_CHRT_RETIROS',
        'WDG_PORT_CONT_NAVIERA': 'PTT_CONT_CHRT_NAVIERA',
        'WDG_PORT_CONT_PATIOS': 'PTT_CONT_PANEL_PATIOS',
        'WDG_PORT_CONT_FREETIME_CHART': 'PTT_CONT_CHRT_FREETIME',
        'WDG_PORT_CONT_TABLA': 'PTT_CONT_TAB_MOVIMIENTOS'
    };

    return layoutBase
        .filter(widget => {
            // 🚨 ESCUDO PURGADOR: Si por error quedó guardado un Terminal Marítimo en estas pestañas, lo EXTERMINA
            const type = (widget.codigoWidget || widget.type || '').toUpperCase();
            if (type.includes('TERMINAL_INDIVIDUAL') || type.includes('TERM_SLOT') || type.includes('WGT_TERMINAL')) {
                return false; // Falso = No pasa al tablero, muere aquí.
            }
            return true;
        })
        .map(widget => {
            const typeOriginal = widget.codigoWidget || widget.type;

            // Revisa el diccionario. Si es viejo lo traduce, si es nuevo lo deja intacto.
            const typeCorregido = MAPEO_GLOBAL[typeOriginal] || typeOriginal;

            return {
                ...widget,
                type: typeCorregido,
                codigoWidget: typeCorregido,
                // Blindamos que nunca llegue undefined a Gridster
                cols: Number(widget.cols) || widget.defaultCols || widget.cols_defecto || 4,
                rows: Number(widget.rows) || widget.defaultRows || widget.rows_defecto || 3,
            };
        });
}

// export function construirLayoutMaritimo(layoutBase: any[], terminalesApi: any[]): any[] {
//     const layoutFinal: any[] = [];

//     // 1. Identificar el molde maestro de terminales
//     let widgetMaestroTerminal = layoutBase.find(w =>
//         w.codigoWidget === 'PTT_MAE_WGT_TERMINAL' || w.type === 'PTT_MAE_WGT_TERMINAL' || w.idClon?.startsWith('TERM_SLOT_')
//     );

//     if (!widgetMaestroTerminal) {
//         widgetMaestroTerminal = { type: 'PTT_MAE_WGT_TERMINAL', codigoWidget: 'PTT_MAE_WGT_TERMINAL', cols: 4, rows: 3 };
//     }

//     const kpisYNormales = layoutBase.filter(w =>
//         w.codigoWidget !== 'PTT_MAE_WGT_TERMINAL' &&
//         w.type !== 'PTT_MAE_WGT_TERMINAL' &&
//         !(w.idClon && w.idClon.startsWith('TERM_SLOT_')) &&
//         w.type !== 'WDG_FANTASMA' && !(w.idClon && w.idClon.startsWith('FANTASMA_'))
//     );

//     // 2. PARÁMETROS DEL BLOQUE DE TERMINALES
//     const termCols = widgetMaestroTerminal.cols || 4;
//     const termRows = widgetMaestroTerminal.rows || 3;
//     const filaFijaTerminales = 2; // Nacen en Y=2

//     const terminalesPorFila = Math.floor(12 / termCols);
//     const cantidadTerminales = terminalesApi ? terminalesApi.length : 0;

//     const filasDeTerminales = Math.max(1, Math.ceil(cantidadTerminales / terminalesPorFila));
//     const huecosACompletar = (filasDeTerminales * terminalesPorFila) - cantidadTerminales;

//     // Evaluamos si debemos resetear y empujar el tablero
//     const tieneTerminalesGuardados = layoutBase.some(w => w.idClon?.startsWith('TERM_SLOT_'));
//     const filasExtrasOffset = tieneTerminalesGuardados ? 0 : (filasDeTerminales - 1) * termRows;

//     // 3. INYECTAR TERMINALES REALES
//     if (cantidadTerminales > 0) {
//         terminalesApi.forEach((terminalInfo, index) => {
//             const idSlotUnico = `TERM_SLOT_${index}`;
//             const slotGuardado = layoutBase.find(w => w.idClon === idSlotUnico);

//             const xPos = (index * termCols) % 12;
//             const yPos = filaFijaTerminales + (Math.floor(index / terminalesPorFila) * termRows);

//             if (slotGuardado) {
//                 layoutFinal.push({ ...slotGuardado, data: terminalInfo, type: 'PTT_MAE_WGT_TERMINAL', codigoWidget: idSlotUnico, idClon: idSlotUnico });
//             } else {
//                 layoutFinal.push({ ...widgetMaestroTerminal, codigoWidget: idSlotUnico, type: 'PTT_MAE_WGT_TERMINAL', idClon: idSlotUnico, data: terminalInfo, x: xPos, y: yPos, cols: termCols, rows: termRows });
//             }
//         });
//     }

//     // 4. INYECTAR BLOQUES FANTASMAS (Evita que Gridster succione gráficas hacia arriba)
//     for (let i = 0; i < huecosACompletar; i++) {
//         const indexFantasma = cantidadTerminales + i;
//         const xPos = (indexFantasma * termCols) % 12;
//         const yPos = filaFijaTerminales + (Math.floor(indexFantasma / terminalesPorFila) * termRows);

//         layoutFinal.push({
//             type: 'WDG_FANTASMA', codigoWidget: `FANTASMA_${indexFantasma}`, idClon: `FANTASMA_${indexFantasma}`,
//             x: xPos, y: yPos, cols: termCols, rows: termRows, visible: true, data: null
//         });
//     }

//     // 5. INYECTAR KPIS Y RESTO DE GRÁFICAS (MODO ESTRICTO)
//     const yBaseMotonaves = filaFijaTerminales + termRows;

//     kpisYNormales.forEach((widget) => {
//         const codigo = widget.codigoWidget || widget.type || '';

//         // Asignamos valores por defecto para evitar NaN
//         let xFinal = Number(widget.x) || 0;
//         let yFinal = Number(widget.y) || 0;
//         let colsFinal = Number(widget.cols) || widget.defaultCols || 4;
//         let rowsFinal = Number(widget.rows) || widget.defaultRows || 3;

//         // 🚨 MODO NUCLEAR: Ignoramos el layout guardado y FORZAMOS la plantilla siempre
//         const temp = obtenerPlantilla(codigo);
//         if (temp) {
//             xFinal = temp.x;
//             yFinal = temp.y;
//             colsFinal = temp.cols;
//             rowsFinal = temp.rows;
//         }

//         // Aplicamos el empuje matemático hacia abajo a todo lo que esté debajo de los terminales
//         if (yFinal >= yBaseMotonaves) {
//             yFinal += filasExtrasOffset;
//         }

//         layoutFinal.push({ ...widget, x: xFinal, y: yFinal, cols: colsFinal, rows: rowsFinal });
//     });

//     // 6. ORDENAR MATEMÁTICAMENTE: Evita pánico de colisiones en el render de Gridster
//     layoutFinal.sort((a, b) => (a.y === b.y ? a.x - b.x : a.y - b.y));

//     return layoutFinal;
// }
export function construirLayoutMaritimo(layoutBase: any[], terminalesApi: any[]): any[] {
    const layoutFinal: any[] = [];

    // 🚨 DICCIONARIO AUTO-HEAL: Conecta nombres viejos con el WIDGET_MAP nuevo
    const MAPEO_OFICIAL: Record<string, string> = {
        'KPI_CAMIONES': 'PTT_MAE_KPI_CAMIONES',
        'KPI_CONTENEDORES': 'PTT_MAE_KPI_CONTENEDORES',
        'KPI_GRANEL': 'PTT_MAE_KPI_GRANEL',
        'KPI_CARGA_SUELTA': 'PTT_MAE_KPI_CARGA_SUELTA',
        'KPI_SUELTA': 'PTT_MAE_KPI_CARGA_SUELTA',
        'KPI_RORO': 'PTT_MAE_KPI_RORO',
        'KPI_BODEGAS': 'PTT_MAE_KPI_BODEGAS',
        'MOTONAVES': 'PTT_MAE_TAB_MOTONAVES',
        'ETA_ATA': 'PTT_MAE_CHRT_ETA_ATA',
        'TONELADAS': 'PTT_MAE_CHRT_TONELADAS',
        'CANAL': 'PTT_MAE_PANEL_CANAL',
        'RESUMEN': 'PTT_MAE_PANEL_RESUMEN',
        'PRODUCTIVIDAD': 'PTT_MAE_CHRT_PROD',
        'PROD': 'PTT_MAE_CHRT_PROD',
        'ALERTAS': 'PTT_MAE_PANEL_ALERTAS',
        'REPORTES_OP': 'PTT_MAE_PANEL_ALERTAS',
        'TRAFICO': 'PTT_MAE_PANEL_TRAFICO',
        'PARTICIPACION': 'PTT_MAE_CHRT_PART_TERM',
        'PART_TERM': 'PTT_MAE_CHRT_PART_TERM',
        'MEZCLA': 'PTT_MAE_CHRT_MEZCLA',
        'TIPO_OPERACION': 'PTT_MAE_CHRT_TIPO_OP',
        'TIPO_OP': 'PTT_MAE_CHRT_TIPO_OP',
        'MATRIZ': 'PTT_MAE_TAB_MATRIZ_CARGA',
        'HISTORICO': 'PTT_MAE_CHRT_HISTORICO',
        'IMPLICACIONES': 'PTT_MAE_PANEL_IMPLICACIONES'
    };

    // Clonamos la lista para no mutar el array original de Angular
    let sobrantes = [...layoutBase];

    // Función "cazadora": Busca el widget, lo extrae y lo borra de la lista temporal
    const getW = (clavesBusqueda: string[]) => {
        const idx = sobrantes.findIndex(w => clavesBusqueda.some(c => (w.codigoWidget || w.type || '').toUpperCase().includes(c)));
        if (idx !== -1) return sobrantes.splice(idx, 1)[0];
        return null;
    };

    // 1. EXTRAER MOLDE DE TERMINALES (Tomamos uno solo como maestro)
    let maestroTerminal = getW(['WGT_TERMINAL', 'TERMINAL_INDIVIDUAL', 'TERM_SLOT']);
    if (!maestroTerminal) maestroTerminal = { type: 'PTT_MAE_WGT_TERMINAL', codigoWidget: 'PTT_MAE_WGT_TERMINAL', cols: 4, rows: 3 };

    // 🚨 EL FIX CLAVE: Exterminamos cualquier otro terminal viejo que haya quedado en 'sobrantes'
    // para que la rutina de "rezagados" al final no los duplique en el fondo.
    sobrantes = sobrantes.filter(w => {
        const cod = (w.codigoWidget || w.type || '').toUpperCase();
        return !cod.includes('WGT_TERMINAL') && !cod.includes('TERMINAL_INDIVIDUAL') && !cod.includes('TERM_SLOT');
    });

    let currentY = 0; // Puntero maestro de filas

    // 2. FUNCIÓN DE INYECCIÓN ESTRICTA
    const inyectar = (clavesBusqueda: string[], claveOficial: string, x: number, cols: number, rows: number) => {
        const w = getW(clavesBusqueda);
        if (w) {
            const typeCorregido = MAPEO_OFICIAL[claveOficial] || w.type;
            const rFinal = Number(w.rows) || rows;
            layoutFinal.push({ ...w, type: typeCorregido, codigoWidget: typeCorregido, x, y: currentY, cols: Number(w.cols) || cols, rows: rFinal });
            return rFinal;
        }
        return 0;
    };

    // ===============================================
    // CASCADA MATEMÁTICA
    // ===============================================

    // BLOQUE 0: KPIs Principales
    let maxR = 0;
    maxR = Math.max(maxR, inyectar(['KPI_CAMIONES'], 'KPI_CAMIONES', 0, 2, 2));
    maxR = Math.max(maxR, inyectar(['KPI_CONTENEDORES'], 'KPI_CONTENEDORES', 2, 2, 2));
    maxR = Math.max(maxR, inyectar(['KPI_GRANEL'], 'KPI_GRANEL', 4, 2, 2));
    maxR = Math.max(maxR, inyectar(['KPI_CARGA_SUELTA', 'KPI_SUELTA'], 'KPI_CARGA_SUELTA', 6, 2, 2));
    maxR = Math.max(maxR, inyectar(['KPI_RORO'], 'KPI_RORO', 8, 2, 2));
    maxR = Math.max(maxR, inyectar(['KPI_BODEGAS'], 'KPI_BODEGAS', 10, 2, 2));
    currentY += (maxR > 0 ? maxR : 2);

    // BLOQUE 1: TERMINALES Y FANTASMAS (Dinámico)
    const tCols = Number(maestroTerminal.cols) || 4;
    const tRows = Number(maestroTerminal.rows) || 3;
    const termsPorFila = Math.floor(12 / tCols);
    const cantTerms = terminalesApi ? terminalesApi.length : 0;
    const filasTerms = Math.max(1, Math.ceil(cantTerms / termsPorFila));

    if (cantTerms > 0) {
        terminalesApi.forEach((tData, i) => {
            const x = (i * tCols) % 12;
            const y = currentY + (Math.floor(i / termsPorFila) * tRows);
            layoutFinal.push({ ...maestroTerminal, type: 'PTT_MAE_WGT_TERMINAL', codigoWidget: `TERM_SLOT_${i}`, idClon: `TERM_SLOT_${i}`, data: tData, x, y, cols: tCols, rows: tRows });
        });
    }

    // Rellenamos con Fantasmas
    const huecos = (filasTerms * termsPorFila) - cantTerms;
    for (let i = 0; i < huecos; i++) {
        const idx = cantTerms + i;
        const x = (idx * tCols) % 12;
        const y = currentY + (Math.floor(idx / termsPorFila) * tRows);
        layoutFinal.push({ type: 'WDG_FANTASMA', codigoWidget: `FANTASMA_${idx}`, idClon: `FANTASMA_${idx}`, x, y, cols: tCols, rows: tRows, visible: true, data: null });
    }

    currentY += (filasTerms * tRows);

    // BLOQUE 2: Motonaves y ETA
    maxR = 0;
    maxR = Math.max(maxR, inyectar(['MOTONAVES'], 'MOTONAVES', 0, 8, 4));
    maxR = Math.max(maxR, inyectar(['ETA_ATA'], 'ETA_ATA', 8, 4, 4));
    currentY += maxR;

    // BLOQUE 3: Toneladas y Canal
    maxR = 0;
    maxR = Math.max(maxR, inyectar(['TONELADAS'], 'TONELADAS', 0, 8, 4));
    maxR = Math.max(maxR, inyectar(['CANAL'], 'CANAL', 8, 4, 4));
    currentY += maxR;

    // BLOQUE 4: Paneles Operativos
    maxR = 0;
    maxR = Math.max(maxR, inyectar(['RESUMEN'], 'RESUMEN', 0, 4, 4));
    maxR = Math.max(maxR, inyectar(['PROD', 'PRODUCTIVIDAD'], 'PRODUCTIVIDAD', 4, 4, 4));
    maxR = Math.max(maxR, inyectar(['ALERTAS', 'REPORTES_OP'], 'ALERTAS', 8, 4, 4));
    currentY += maxR;

    // BLOQUE 5: Tráfico
    maxR = 0;
    maxR = Math.max(maxR, inyectar(['TRAFICO'], 'TRAFICO', 0, 12, 4));
    currentY += maxR;

    // BLOQUE 6: Gráficas Inferiores
    maxR = 0;
    maxR = Math.max(maxR, inyectar(['PART_TERM', 'PARTICIPACION'], 'PARTICIPACION', 0, 4, 4));
    maxR = Math.max(maxR, inyectar(['MEZCLA'], 'MEZCLA', 4, 4, 4));
    maxR = Math.max(maxR, inyectar(['TIPO_OP', 'TIPO_OPERACION'], 'TIPO_OPERACION', 8, 4, 4));
    currentY += maxR;

    // BLOQUE 7: Matriz e Histórico
    maxR = 0;
    maxR = Math.max(maxR, inyectar(['MATRIZ'], 'MATRIZ', 0, 8, 4));
    maxR = Math.max(maxR, inyectar(['HISTORICO'], 'HISTORICO', 8, 4, 4));
    currentY += maxR;

    // BLOQUE 8: Implicaciones
    maxR = 0;
    maxR = Math.max(maxR, inyectar(['IMPLICACIONES'], 'IMPLICACIONES', 0, 12, 2));
    currentY += maxR;

    // REZAGADOS: Todo lo que sobró (Widgets custom o extraños, EXCEPTO terminales y fantasmas)
    sobrantes.forEach(w => {
        if (!w.type?.includes('FANTASMA') && !w.codigoWidget?.includes('FANTASMA')) {
            const r = Number(w.rows) || 3;
            layoutFinal.push({ ...w, x: 0, y: currentY, cols: Number(w.cols) || 4, rows: r });
            currentY += r;
        }
    });

    return layoutFinal.sort((a, b) => (a.y === b.y ? a.x - b.x : a.y - b.y));
}
