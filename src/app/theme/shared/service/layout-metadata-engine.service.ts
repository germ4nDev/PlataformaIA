/* eslint-disable @typescript-eslint/no-explicit-any */
/*
    Author: German Valencia
    Pattern: Layout Metadata Engine (QPLUS Architecture)
    Refactor: WIDGET_MAP SSOT Integration & CASCADA_DINAMICA Auto-healing
*/
import { Injectable } from '@angular/core';
import { LayoutService } from 'src/app/theme/shared/service/layout.service';
import { LocalStorageService } from 'src/app/theme/shared/service';
import { PTLLayoutModel } from 'src/app/theme/shared/_helpers/models/PTLLayout.model';

import { WIDGET_MAP } from 'src/app/porttos/torre-control/widget-registry';

@Injectable({
    providedIn: 'root'
})
export class LayoutMetadataEngineService {

    constructor(
        private _layoutService: LayoutService,
        private _localStoragoService: LocalStorageService
    ) { }

    // ==========================================
    // OBTENCIÓN CENTRALIZADA DE LAYOUT BASE
    // ==========================================
    async obtenerLayoutBase(
        pestana: string,
        usuarioId: string,
        lsWidgetsAux: any[],
        entidadesDinamicas: any[] = []
    ): Promise<any[]> {
        let layoutArmado: any[] = [];
        const usuario = usuarioId || 'SISTEMA_DEFAULT';
        const pestanaNorm = (pestana || '').trim().toUpperCase();
        const esMaritimo =
            pestanaNorm === 'TLC_MARITIMO_001' ||
            pestanaNorm === 'TLC-MARITIMO-001' ||
            pestanaNorm.includes('MARITIMO');

        try {
            // 1. Verificamos Caché (Arrastre local del usuario)
            const prefsCache = this._localStoragoService.getNavSettingsLocalStorage();
            if (prefsCache && Array.isArray(prefsCache.layout) && prefsCache.layout.length > 0) {
                const layoutCache = prefsCache.layout.filter((w: any) => w.pestana === pestana);
                if (layoutCache.length > 0) {
                    layoutArmado = layoutCache.map((w: any) => {
                        const esTerminalClon = String(w.idClon || w.codigoWidget || w.type || '').startsWith('TERM_SLOT_');
                        const codigoBusqueda = esTerminalClon ? 'PTT_MAE_WGT_TERMINAL' : (w.type || w.codigoWidget);
                        const registroLocal = WIDGET_MAP[codigoBusqueda || ''] || {};
                        return {
                            ...registroLocal,
                            ...w,
                            type: codigoBusqueda,
                            codigoWidget: codigoBusqueda,
                            idClon: esTerminalClon ? (w.idClon || w.codigoWidget || w.type) : w.idClon
                        };
                    });
                }
            }

            // 2. Si no hubo en caché, verificamos Base de Datos (Personalización guardada)
            if (layoutArmado.length === 0) {
                const layoutDesdeBD: PTLLayoutModel[] =
                    (await this._layoutService.cargarRegistrosUsuarioPestana(usuario, pestana).toPromise()) || [];

                if (layoutDesdeBD.length > 0) {
                    layoutArmado = layoutDesdeBD.map((itemDB) => {
                        const esTerminalClon = itemDB.codigoWidget?.startsWith('TERM_SLOT_');
                        const codigoBusqueda = esTerminalClon ? 'PTT_MAE_WGT_TERMINAL' : itemDB.codigoWidget;
                        const registroLocal = WIDGET_MAP[codigoBusqueda || ''] || {};

                        let configData = null;
                        if (itemDB.config) {
                            try {
                                configData = typeof itemDB.config === 'string' ? JSON.parse(itemDB.config) : itemDB.config;
                            } catch (e) { }
                        }

                        return {
                            ...registroLocal,
                            type: codigoBusqueda,
                            codigoWidget: codigoBusqueda,
                            idClon: esTerminalClon ? itemDB.codigoWidget : undefined,
                            cols: Number(itemDB.cols || (registroLocal as any).defaultCols || 4),
                            rows: Number(itemDB.rows || (registroLocal as any).defaultRows || 3),
                            x: Number(itemDB.posicion_x ?? 0),
                            y: Number(itemDB.posicion_y ?? 0),
                            visible: true,
                            pestana: pestana,
                            data: configData
                        };
                    });
                }
            }

            // 3. Fallback: Plantilla Maestra del Motor si no había en Caché ni en BD
            if (layoutArmado.length === 0) {
                let metadatosBackend = await this._layoutService.getPlantillaMaestra(pestana).toPromise();

                // 🟢 CORREGIDO: Soporta 'TLC_MARITIMO_001' con guion bajo
                if (
                    esMaritimo &&
                    (!metadatosBackend ||
                        metadatosBackend.estrategia !== 'CASCADA_DINAMICA' ||
                        !metadatosBackend.configuracion?.zonaDinamica)
                ) {
                    console.warn(`⚠️ [Motor Metadata] Forzando Fallback a CASCADA_DINAMICA para Marítimo.`);
                    // Corregido 2026-10-18: el respaldo solo completa la zona dinámica (terminales). Si la BD ya
                    // tiene widgets para la pestaña (layout por defecto guardado), se respetan sus posiciones.
                    const respaldo = this.obtenerPlantillaCascadaMaritimo();
                    const widgetsBD = metadatosBackend?.configuracion?.widgetsEstaticos;
                    metadatosBackend = {
                        estrategia: 'CASCADA_DINAMICA',
                        configuracion: {
                            widgetsEstaticos: Array.isArray(widgetsBD) && widgetsBD.length > 0
                                ? widgetsBD
                                : respaldo.configuracion.widgetsEstaticos,
                            zonaDinamica: respaldo.configuracion.zonaDinamica
                        }
                    };
                }

                if (metadatosBackend) {
                    layoutArmado = this.construirLayoutUniversal(metadatosBackend, entidadesDinamicas);
                }
            }

            // 4. 🟢 AUTO-HEALING DE TERMINALES DINÁMICAS EN MARÍTIMO
            // Si el layout vino de Caché o BD sin los TERM_SLOT_N (o cambió el puerto), los sincronizamos
            if (esMaritimo && Array.isArray(entidadesDinamicas) && entidadesDinamicas.length > 0) {
                layoutArmado = this.aplicarAutoHealingTerminales(layoutArmado, entidadesDinamicas, pestana);
            }

            const layoutLimpio = layoutArmado.filter((w) => w !== undefined && w.type !== undefined);

            // Eliminamos posibles duplicados conservando cada TERM_SLOT_N único
            const layoutSinDuplicados = layoutLimpio.filter(
                (widget, index, self) =>
                    index === self.findIndex((w) => (w.idClon || w.type) === (widget.idClon || widget.type))
            );

            return layoutSinDuplicados;
        } catch (error) {
            console.error('❌ Error en Motor Metadata obteniendo layout base:', error);
            return [];
        }
    }

    /**
     * Garantiza que en la pestaña Marítimo siempre existan las tarjetas TERM_SLOT_0..N
     * correspondientes a las terminales del puerto activo, sin pisar los demás widgets.
     */
    private aplicarAutoHealingTerminales(layoutActual: any[], terminales: any[], pestana: string): any[] {
        const codigoMolde = 'PTT_MAE_WGT_TERMINAL';
        const registroMoldeLocal = WIDGET_MAP[codigoMolde] || {};
        const colsItem = 4;
        const rowsItem = 3;
        const maxFila = 3;

        const slotsExistentes = layoutActual.filter((w) => {
            const idClon = String(w.idClon || '').toUpperCase();
            const tipo = String(w.type || w.codigoWidget || '').toUpperCase();
            return (
                idClon.startsWith('TERM_SLOT_') ||
                tipo === 'PTT_MAE_WGT_TERMINAL' ||
                tipo === 'WDG_PORT_TERMINAL_INDIVIDUAL'
            );
        });

        // CASO A: El layout guardado en BD/Caché NO tenía ningún slot de terminal (ej. solo tenía gráficas)
        if (slotsExistentes.length === 0) {
            const kpis = layoutActual.filter((w) =>
                String(w.type || w.codigoWidget || '').toUpperCase().includes('KPI')
            );
            const otrosWidgets = layoutActual.filter(
                (w) => !String(w.type || w.codigoWidget || '').toUpperCase().includes('KPI')
            );

            // Calculamos la fila Y donde deben empezar las terminales (debajo de los KPIs si existen, o en Y=0)
            const inicioY =
                kpis.length > 0
                    ? Math.max(...kpis.map((k) => Number(k.y || 0) + Number(k.rows || 2)))
                    : 0;

            const nuevosSlots: any[] = [];
            let colX = 0;
            let currentY = inicioY;

            terminales.forEach((entidad, index) => {
                if (index > 0 && index % maxFila === 0) {
                    colX = 0;
                    currentY += rowsItem;
                }

                nuevosSlots.push({
                    ...registroMoldeLocal,
                    codigoWidget: codigoMolde,
                    type: codigoMolde,
                    idClon: `TERM_SLOT_${index}`,
                    dataTerminal: entidad,
                    x: colX,
                    y: currentY,
                    cols: colsItem,
                    rows: rowsItem,
                    pestana: pestana,
                    dragEnabled: true,
                    resizeEnabled: true
                });

                colX += colsItem;
            });

            const altoTotalTerminales = Math.ceil(terminales.length / maxFila) * rowsItem;
            const minYOtros =
                otrosWidgets.length > 0
                    ? Math.min(...otrosWidgets.map((w) => Number(w.y ?? 0)))
                    : inicioY;

            // Si los widgets existentes chocan con la zona de terminales, los empujamos hacia abajo
            const desplazamientoY =
                minYOtros < inicioY + altoTotalTerminales
                    ? inicioY + altoTotalTerminales - minYOtros
                    : 0;

            const otrosDesplazados = otrosWidgets.map((w) => ({
                ...w,
                y: Number(w.y ?? 0) + desplazamientoY
            }));

            return [...kpis, ...nuevosSlots, ...otrosDesplazados];
        }

        // CASO B: El layout ya tenía slots de terminales; los hidratamos y ajustamos a la cantidad del puerto actual
        const otrosSinTerminales = layoutActual.filter((w) => !slotsExistentes.includes(w));
        const slotsActualizados: any[] = [];

        const baseY = Math.min(...slotsExistentes.map((s) => Number(s.y ?? 2)));

        terminales.forEach((entidad, index) => {
            const slotGuardado = slotsExistentes.find((s) => s.idClon === `TERM_SLOT_${index}`) || slotsExistentes[index];
            const fila = Math.floor(index / maxFila);
            const col = (index % maxFila) * colsItem;

            slotsActualizados.push({
                ...registroMoldeLocal,
                ...(slotGuardado || {}),
                codigoWidget: codigoMolde,
                type: codigoMolde,
                idClon: `TERM_SLOT_${index}`,
                dataTerminal: entidad,
                x: slotGuardado?.x !== undefined ? Number(slotGuardado.x) : col,
                y: slotGuardado?.y !== undefined ? Number(slotGuardado.y) : baseY + fila * rowsItem,
                cols: Number(slotGuardado?.cols || colsItem),
                rows: Number(slotGuardado?.rows || rowsItem),
                pestana: pestana
            });
        });

        return [...slotsActualizados, ...otrosSinTerminales];
    }

    private obtenerPlantillaCascadaMaritimo(): any {
        return {
            estrategia: 'CASCADA_DINAMICA',
            configuracion: {
                widgetsEstaticos: [
                    { codigoWidget: 'PTT_MAE_KPI_CAMIONES', x: 0, y: 0, cols: 2, rows: 2, anclaje: 'ABSOLUTO' },
                    { codigoWidget: 'PTT_MAE_KPI_CONTENEDORES', x: 2, y: 0, cols: 2, rows: 2, anclaje: 'ABSOLUTO' },
                    { codigoWidget: 'PTT_MAE_KPI_GRANEL', x: 4, y: 0, cols: 2, rows: 2, anclaje: 'ABSOLUTO' },
                    { codigoWidget: 'PTT_MAE_KPI_CARGA_SUELTA', x: 6, y: 0, cols: 2, rows: 2, anclaje: 'ABSOLUTO' },
                    { codigoWidget: 'PTT_MAE_KPI_RORO', x: 8, y: 0, cols: 2, rows: 2, anclaje: 'ABSOLUTO' },
                    { codigoWidget: 'PTT_MAE_KPI_BODEGAS', x: 10, y: 0, cols: 2, rows: 2, anclaje: 'ABSOLUTO' },

                    { codigoWidget: 'PTT_MAE_TAB_MOTONAVES', x: 0, y: 5, cols: 8, rows: 4, anclaje: 'RELATIVO' },
                    { codigoWidget: 'PTT_MAE_CHRT_ETA_ATA', x: 8, y: 5, cols: 4, rows: 4, anclaje: 'RELATIVO' },
                    { codigoWidget: 'PTT_MAE_CHRT_TONELADAS', x: 0, y: 9, cols: 6, rows: 3, anclaje: 'RELATIVO' },
                    { codigoWidget: 'PTT_MAE_PANEL_CANAL', x: 6, y: 9, cols: 6, rows: 3, anclaje: 'RELATIVO' },
                    { codigoWidget: 'PTT_MAE_PANEL_RESUMEN', x: 0, y: 12, cols: 4, rows: 3, anclaje: 'RELATIVO' },
                    { codigoWidget: 'PTT_MAE_CHRT_PROD', x: 4, y: 12, cols: 4, rows: 3, anclaje: 'RELATIVO' },
                    { codigoWidget: 'PTT_MAE_PANEL_ALERTAS', x: 8, y: 12, cols: 4, rows: 3, anclaje: 'RELATIVO' },
                    { codigoWidget: 'PTT_MAE_PANEL_TRAFICO', x: 0, y: 15, cols: 12, rows: 4, anclaje: 'RELATIVO' },
                    { codigoWidget: 'PTT_MAE_CHRT_PART_TERM', x: 0, y: 19, cols: 4, rows: 3, anclaje: 'RELATIVO' },
                    { codigoWidget: 'PTT_MAE_CHRT_MEZCLA', x: 4, y: 19, cols: 4, rows: 3, anclaje: 'RELATIVO' },
                    { codigoWidget: 'PTT_MAE_CHRT_TIPO_OP', x: 8, y: 19, cols: 4, rows: 3, anclaje: 'RELATIVO' },
                    { codigoWidget: 'PTT_MAE_TAB_MATRIZ_CARGA', x: 0, y: 22, cols: 8, rows: 3, anclaje: 'RELATIVO' },
                    { codigoWidget: 'PTT_MAE_CHRT_HISTORICO', x: 8, y: 22, cols: 4, rows: 3, anclaje: 'RELATIVO' },
                    { codigoWidget: 'PTT_MAE_PANEL_IMPLICACIONES', x: 0, y: 25, cols: 12, rows: 2, anclaje: 'RELATIVO' }
                ],
                zonaDinamica: {
                    activa: true,
                    codigoMolde: 'PTT_MAE_WGT_TERMINAL',
                    inicioX: 0,
                    inicioY: 2,
                    colsPorItem: 4,
                    rowsPorItem: 3,
                    maxItemsPorFila: 3
                }
            }
        };
    }

    // ==========================================
    // EL INTÉRPRETE UNIVERSAL (QPLUS METADATA ENGINE)
    // ==========================================
    private construirLayoutUniversal(metadatosBackend: any, entidadesDinamicas: any[] = []): any[] {
        if (!metadatosBackend || !metadatosBackend.configuracion) return [];

        const layoutFinal: any[] = [];
        const config = metadatosBackend.configuracion;
        const estaticosBD = config.widgetsEstaticos || [];

        const estaticosVisiblesPorDefecto = estaticosBD.filter(
            (w: any) =>
                w.inicial === undefined ||
                w.inicial === null ||
                w.inicial === true ||
                w.inicial === 1 ||
                String(w.inicial).toLowerCase() === 'true'
        );

        const widgetsNormalizados = estaticosVisiblesPorDefecto.map((w: any) => {
            const registroLocal = WIDGET_MAP[w.codigoWidget] || {};
            const colsLocales = (registroLocal as any).defaultCols || 4;
            const rowsLocales = (registroLocal as any).defaultRows || 4;

            return {
                ...w,
                ...registroLocal,
                codigoWidget: w.codigoWidget,
                type: w.codigoWidget,
                x: Number(w.x !== undefined && w.x !== null ? w.x : (w.pos_x || 0)),
                y: Number(w.y !== undefined && w.y !== null ? w.y : (w.pos_y || 0)),
                cols: Math.max(1, Number(w.cols || colsLocales)),
                rows: Math.max(1, Number(w.rows || rowsLocales)),
                anclaje: w.anclaje || w.anclajeTipo || 'RELATIVO',
                offsetY: Number(w.offsetY || 0)
            };
        });

        // ESTRATEGIA 1: ESTÁTICO ANALÍTICO
        if (
            metadatosBackend.estrategia === 'ESTATICO_ANALITICO' ||
            metadatosBackend.estrategia === 'FLUJO_PROCESO' ||
            metadatosBackend.estrategia === 'ESTATICO_ANALITICO_GNL'
        ) {
            // Agregado 2026-10-18: si la plantilla trae posiciones (layout por defecto guardado con
            // "Predeterminar"), se respetan tal cual. Una plantilla antigua tiene todo en (0,0): se acomoda en flujo.
            const tienePosiciones = widgetsNormalizados.some((w: any) => Number(w.x) > 0 || Number(w.y) > 0);
            if (tienePosiciones) {
                return widgetsNormalizados.map((wNorm: any) => {
                    const registroLocal = WIDGET_MAP[wNorm.codigoWidget] || {};
                    const cols = Math.min(12, Math.max(1, Number(wNorm.cols || 4)));
                    return {
                        ...registroLocal,
                        codigoWidget: wNorm.codigoWidget,
                        type: wNorm.codigoWidget,
                        cols,
                        rows: Math.max(1, Number(wNorm.rows || 4)),
                        x: Math.min(Math.max(0, Number(wNorm.x) || 0), 12 - cols),
                        y: Math.max(0, Number(wNorm.y) || 0)
                    };
                });
            }

            let cursorX = 0;
            let cursorY = 0;
            let maxRowHeight = 0;

            widgetsNormalizados.forEach((wNorm: any) => {
                const registroLocal = WIDGET_MAP[wNorm.codigoWidget] || {};
                const safeCols = Math.min(12, Math.max(1, Number(wNorm.cols || 4)));
                const safeRows = Math.max(1, Number(wNorm.rows || 4));

                if (cursorX + safeCols > 12) {
                    cursorX = 0;
                    cursorY += maxRowHeight;
                    maxRowHeight = 0;
                }

                layoutFinal.push({
                    ...registroLocal,
                    codigoWidget: wNorm.codigoWidget,
                    type: wNorm.codigoWidget,
                    cols: safeCols,
                    rows: safeRows,
                    x: cursorX,
                    y: cursorY
                });

                cursorX += safeCols;
                if (safeRows > maxRowHeight) maxRowHeight = safeRows;
            });

            return layoutFinal;
        }

        if (metadatosBackend.estrategia === 'CASCADA_DINAMICA' && config.zonaDinamica) {
            const zona = config.zonaDinamica;
            let currentY = zona.inicioY ?? 2;

            // 1. ABSOLUTOS (KPIs Superiores)
            widgetsNormalizados
                .filter((w: any) => w.anclaje === 'ABSOLUTO')
                .forEach((wBD: any) => {
                    const registroLocal = WIDGET_MAP[wBD.codigoWidget] || {};
                    layoutFinal.push({
                        ...registroLocal,
                        codigoWidget: wBD.codigoWidget,
                        type: wBD.codigoWidget,
                        x: wBD.x,
                        y: wBD.y,
                        cols: wBD.cols,
                        rows: wBD.rows
                    });
                });

            // 2. DINÁMICOS (Terminales Portuarias)
            if (entidadesDinamicas && entidadesDinamicas.length > 0) {
                const codigoMolde = zona.codigoMolde || 'PTT_MAE_WGT_TERMINAL';
                const registroMoldeLocal = WIDGET_MAP[codigoMolde] || {};
                let colX = zona.inicioX || 0;
                const rowsItem = zona.rowsPorItem || (registroMoldeLocal as any).defaultRows || 3;
                const colsItem = zona.colsPorItem || (registroMoldeLocal as any).defaultCols || 4;
                const maxFila = zona.maxItemsPorFila || 3;

                entidadesDinamicas.forEach((entidad, index) => {
                    if (index > 0 && index % maxFila === 0) {
                        colX = zona.inicioX || 0;
                        currentY += rowsItem;
                    }
                    layoutFinal.push({
                        ...registroMoldeLocal,
                        codigoWidget: codigoMolde,
                        type: codigoMolde,
                        idClon: `TERM_SLOT_${index}`,
                        dataTerminal: entidad,
                        x: colX,
                        y: currentY,
                        cols: colsItem,
                        rows: rowsItem,
                        dragEnabled: true,
                        resizeEnabled: true
                    });
                    colX += colsItem;
                });
                // 🟢 AQUÍ ESTÁ LA CLAVE: Avanzamos el puntero Y completo de la última fila de terminales
                currentY += rowsItem;
            } else {
                currentY = zona.inicioY ?? 2;
            }

            // 3. RELATIVOS (Tablas y Gráficas que van debajo)
            widgetsNormalizados
                .filter((w: any) => w.anclaje === 'RELATIVO' || w.anclaje === 'RELATIVO_DINAMICO')
                .forEach((wBD: any) => {
                    const registroLocal = WIDGET_MAP[wBD.codigoWidget] || {};

                    // Calculamos la distancia relativa original que tenía el widget en la plantilla maestra
                    const baseRefY = zona.inicioY ?? 2;
                    const distanciaBase = wBD.y >= baseRefY ? wBD.y - baseRefY : 0;

                    // 🟢 Posicionamos el widget justo donde termina la cascada dinámica + su distancia original
                    layoutFinal.push({
                        ...registroLocal,
                        codigoWidget: wBD.codigoWidget,
                        type: wBD.codigoWidget,
                        x: wBD.x,
                        y: currentY + distanciaBase,
                        cols: wBD.cols,
                        rows: wBD.rows
                    });
                });

            return layoutFinal;
        }

        return layoutFinal;
    }
}
