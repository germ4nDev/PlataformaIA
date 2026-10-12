/*
    Author: German Valencia
    Pattern: Layout Metadata Engine (QPLUS Architecture)
    Refactor: WIDGET_MAP SSOT Integration & CASCADA_DINAMICA Auto-healing
*/
import { Injectable } from '@angular/core';
import { LayoutService } from 'src/app/theme/shared/service/layout.service';
import { LocalStorageService } from 'src/app/theme/shared/service';
import { PTLLayoutModel } from 'src/app/theme/shared/_helpers/models/PTLLayout.model';

// 🟢 IMPORTAMOS EL DICCIONARIO MAESTRO DIRECTAMENTE
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
    async obtenerLayoutBase(pestana: string, usuarioId: string, lsWidgetsAux: any[], entidadesDinamicas: any[] = []): Promise<any[]> {
        let layoutArmado: any[] = [];
        const usuario = usuarioId || 'SISTEMA_DEFAULT';

        try {
            // 1. Verificamos Caché (Arrastre local del usuario)
            const prefsCache = this._localStoragoService.getNavSettingsLocalStorage();
            if (prefsCache && prefsCache.layout && prefsCache.layout.length > 0) {
                const layoutCache = prefsCache.layout.filter((w: any) => w.pestana === pestana);
                if (layoutCache.length > 0) return layoutCache;
            }

            // 2. Verificamos Base de Datos (Personalización guardada)
            const layoutDesdeBD: PTLLayoutModel[] = await this._layoutService.cargarRegistrosUsuarioPestana(usuario, pestana).toPromise() || [];

            if (layoutDesdeBD.length > 0) {
                layoutArmado = layoutDesdeBD.map(itemDB => {
                    const esTerminalClon = itemDB.codigoWidget?.startsWith('TERM_SLOT_');
                    const codigoBusqueda = esTerminalClon ? 'PTT_MAE_WGT_TERMINAL' : itemDB.codigoWidget;

                    // 🟢 BUSCAMOS EN EL DICCIONARIO FÍSICO DE ANGULAR, NO EN LA BD
                    const registroLocal = WIDGET_MAP[codigoBusqueda || ''] || {};

                    let configData = null;
                    if (itemDB.config) {
                        try { configData = typeof itemDB.config === 'string' ? JSON.parse(itemDB.config) : itemDB.config; } catch (e) { }
                    }

                    return {
                        ...registroLocal,
                        type: codigoBusqueda,
                        codigoWidget: codigoBusqueda,
                        idClon: esTerminalClon ? itemDB.codigoWidget : undefined,
                        cols: itemDB.cols || (registroLocal as any).defaultCols || 4,
                        rows: itemDB.rows || (registroLocal as any).defaultRows || 4,
                        x: itemDB.posicion_x,
                        y: itemDB.posicion_y,
                        visible: true,
                        pestana: pestana,
                        data: configData
                    };
                });
            } else {
                // 3. Fallback: Plantilla Maestra del Motor
                let metadatosBackend = await this._layoutService.getPlantillaMaestra(pestana).toPromise();

                // 🟢 BLINDAJE DE EMERGENCIA MARÍTIMO (Forzando la Cascada Dinámica)
                if (pestana === 'TLC-MARITIMO-001' && (!metadatosBackend || metadatosBackend.estrategia !== 'CASCADA_DINAMICA' || !metadatosBackend.configuracion?.zonaDinamica)) {
                    console.warn(`⚠️ [Motor Metadata] Forzando Fallback a CASCADA_DINAMICA para Marítimo.`);
                    metadatosBackend = {
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
                                { codigoWidget: 'PTT_MAE_CHRT_TONELADAS', x: 0, y: 9, cols: 8, rows: 4, anclaje: 'RELATIVO' },
                                { codigoWidget: 'PTT_MAE_PANEL_CANAL', x: 8, y: 9, cols: 4, rows: 4, anclaje: 'RELATIVO' },
                                { codigoWidget: 'PTT_MAE_PANEL_RESUMEN', x: 0, y: 13, cols: 4, rows: 4, anclaje: 'RELATIVO' },
                                { codigoWidget: 'PTT_MAE_CHRT_PROD', x: 4, y: 13, cols: 4, rows: 4, anclaje: 'RELATIVO' },
                                { codigoWidget: 'PTT_MAE_PANEL_ALERTAS', x: 8, y: 13, cols: 4, rows: 4, anclaje: 'RELATIVO' },
                                { codigoWidget: 'PTT_MAE_PANEL_TRAFICO', x: 0, y: 17, cols: 12, rows: 4, anclaje: 'RELATIVO' },
                                { codigoWidget: 'PTT_MAE_CHRT_PART_TERM', x: 0, y: 21, cols: 4, rows: 4, anclaje: 'RELATIVO' },
                                { codigoWidget: 'PTT_MAE_CHRT_MEZCLA', x: 4, y: 21, cols: 4, rows: 4, anclaje: 'RELATIVO' },
                                { codigoWidget: 'PTT_MAE_CHRT_TIPO_OP', x: 8, y: 21, cols: 4, rows: 4, anclaje: 'RELATIVO' },
                                { codigoWidget: 'PTT_MAE_TAB_MATRIZ_CARGA', x: 0, y: 25, cols: 8, rows: 4, anclaje: 'RELATIVO' },
                                { codigoWidget: 'PTT_MAE_CHRT_HISTORICO', x: 8, y: 25, cols: 4, rows: 4, anclaje: 'RELATIVO' },
                                { codigoWidget: 'PTT_MAE_PANEL_IMPLICACIONES', x: 0, y: 29, cols: 12, rows: 2, anclaje: 'RELATIVO' }
                            ],
                            zonaDinamica: {
                                activa: true,
                                codigoMolde: 'PTT_MAE_WGT_TERMINAL',
                                inicioX: 0,
                                inicioY: 5,
                                colsPorItem: 4,
                                rowsPorItem: 3,
                                maxItemsPorFila: 3
                            }
                        }
                    };
                }

                if (metadatosBackend) {
                    layoutArmado = this.construirLayoutUniversal(metadatosBackend, entidadesDinamicas);
                }
            }

            const layoutLimpio = layoutArmado.filter(w => w !== undefined && w.type !== undefined);

            // Eliminamos posibles duplicados generados por arrastres inconsistentes
            const layoutSinDuplicados = layoutLimpio.filter((widget, index, self) =>
                index === self.findIndex((w) => (w.idClon || w.type) === (widget.idClon || widget.type))
            );

            return layoutSinDuplicados;
        } catch (error) {
            console.error("❌ Error en Motor Metadata obteniendo layout base:", error);
            return [];
        }
    }

    // ==========================================
    // EL INTÉRPRETE UNIVERSAL (QPLUS METADATA ENGINE)
    // ==========================================

    // private construirLayoutUniversal(metadatosBackend: any, entidadesDinamicas: any[] = []): any[] {
    //     if (!metadatosBackend || !metadatosBackend.configuracion) return [];

    //     const layoutFinal: any[] = [];
    //     const config = metadatosBackend.configuracion;
    //     const estaticosBD = config.widgetsEstaticos || [];

    //     // 🟢 1. FILTRO DE ESTADO INICIAL (Para el Lobby)
    //     // Solo dejamos pasar los widgets que el negocio dice que van por defecto al entrar por primera vez.
    //     // const estaticosVisiblesPorDefecto = estaticosBD.filter((w: any) =>
    //     //     w.inicial === true || w.inicial === 1 || String(w.inicial).toLowerCase() === 'true'
    //     // );
    //     const estaticosVisiblesPorDefecto = estaticosBD.filter((w: any) =>
    //         w.inicial === undefined ||
    //         w.inicial === null ||
    //         w.inicial === true ||
    //         w.inicial === 1 ||
    //         String(w.inicial).toLowerCase() === 'true'
    //     );

    //     const widgetsNormalizados = estaticosVisiblesPorDefecto.map((w: any) => {
    //         // Buscamos los tamaños por defecto si la BD no los trae
    //         const registroLocal = WIDGET_MAP[w.codigoWidget] || {};
    //         const colsLocales = (registroLocal as any).defaultCols || 4;
    //         const rowsLocales = (registroLocal as any).defaultRows || 4;

    //         return {
    //             ...w,
    //             ...registroLocal, // Traemos el componente Angular
    //             codigoWidget: w.codigoWidget,
    //             type: w.codigoWidget,

    //             // 🛡️ CASTEO MATEMÁTICO: Obligamos a que todo sea un número puro (Number)
    //             x: Number(w.x !== undefined && w.x !== null ? w.x : (w.pos_x || 0)),
    //             y: Number(w.y !== undefined && w.y !== null ? w.y : (w.pos_y || 0)),

    //             // 🛡️ PROTECCIÓN CONTRA CEROS: Math.max(1, ...) evita colapso por área cero
    //             cols: Math.max(1, Number(w.cols || colsLocales)),
    //             rows: Math.max(1, Number(w.rows || rowsLocales)),

    //             anclaje: w.anclaje || w.anclajeTipo || 'RELATIVO',
    //             offsetY: Number(w.offsetY || 0)
    //         };
    //     });

    //     // ==========================================
    //     // ESTRATEGIA 1: ESTÁTICO ANALÍTICO (Protector Anti-Congelamiento Definitivo)
    //     // ==========================================
    //     if (metadatosBackend.estrategia === 'ESTATICO_ANALITICO' || metadatosBackend.estrategia === 'FLUJO_PROCESO' || metadatosBackend.estrategia === 'ESTATICO_ANALITICO_GNL') {

    //         const coordenadasOcupadas = new Set<string>();
    //         let ySalvavidas = 100; // Fila lejana para apilar los widgets que la BD manda mal

    //         widgetsNormalizados.forEach((wNorm: any) => {
    //             const registroLocal = WIDGET_MAP[wNorm.codigoWidget] || {};

    //             const widgetFinal: any = {
    //                 ...registroLocal,
    //                 codigoWidget: wNorm.codigoWidget,
    //                 type: wNorm.codigoWidget,
    //                 cols: wNorm.cols,
    //                 rows: wNorm.rows
    //             };

    //             const claveCoordenada = `${wNorm.x}-${wNorm.y}`;

    //             // Si dos widgets intentan nacer en el mismo cuadro exacto, Gridster colapsa.
    //             if (coordenadasOcupadas.has(claveCoordenada)) {
    //                 console.warn(`⚠️ Salvavidas activado para: ${wNorm.codigoWidget}`);

    //                 // Lo mandamos al "Salvavidas" (Lejos de los demás)
    //                 widgetFinal.x = 0;
    //                 widgetFinal.y = ySalvavidas;

    //                 // 🟢 LA MAGIA AQUÍ: Bajamos el salvavidas para que el próximo que choque vaya DEBAJO de este
    //                 ySalvavidas += wNorm.rows;
    //             } else {
    //                 // Si la coordenada está libre, la usamos y la bloqueamos
    //                 coordenadasOcupadas.add(claveCoordenada);
    //                 widgetFinal.x = wNorm.x;
    //                 widgetFinal.y = wNorm.y;
    //             }

    //             layoutFinal.push(widgetFinal);
    //         });

    //         return layoutFinal;
    //     }

    //     // ==========================================
    //     // ESTRATEGIA 2: CASCADA DINÁMICA
    //     // ==========================================
    //     if (metadatosBackend.estrategia === 'CASCADA_DINAMICA' && config.zonaDinamica) {
    //         const zona = config.zonaDinamica;
    //         let currentY = zona.inicioY || 5;

    //         // 1. ABSOLUTOS (KPIs Superiores)
    //         widgetsNormalizados
    //             .filter((w: any) => w.anclaje === 'ABSOLUTO')
    //             .forEach((wBD: any) => {
    //                 const registroLocal = WIDGET_MAP[wBD.codigoWidget] || {};
    //                 layoutFinal.push({
    //                     ...registroLocal,
    //                     codigoWidget: wBD.codigoWidget,
    //                     type: wBD.codigoWidget,
    //                     x: wBD.x,
    //                     y: wBD.y,
    //                     cols: wBD.cols || (registroLocal as any).defaultCols || 2,
    //                     rows: wBD.rows || (registroLocal as any).defaultRows || 2
    //                 });
    //             });

    //         // 2. DINÁMICOS (Terminales Portuarios)
    //         if (entidadesDinamicas && entidadesDinamicas.length > 0) {
    //             const codigoMolde = zona.codigoMolde || 'PTT_MAE_WGT_TERMINAL';
    //             const registroMoldeLocal = WIDGET_MAP[codigoMolde] || {};

    //             let colX = zona.inicioX || 0;
    //             const rowsItem = zona.rowsPorItem || (registroMoldeLocal as any).defaultRows || 3;
    //             const colsItem = zona.colsPorItem || (registroMoldeLocal as any).defaultCols || 4;
    //             const maxFila = zona.maxItemsPorFila || 3;

    //             entidadesDinamicas.forEach((entidad, index) => {
    //                 if (index > 0 && index % maxFila === 0) {
    //                     colX = zona.inicioX || 0;
    //                     currentY += rowsItem;
    //                 }

    //                 layoutFinal.push({
    //                     ...registroMoldeLocal,
    //                     codigoWidget: codigoMolde,
    //                     type: codigoMolde,
    //                     idClon: `TERM_SLOT_${index}`,
    //                     dataTerminal: entidad,
    //                     x: colX,
    //                     y: currentY,
    //                     cols: colsItem,
    //                     rows: rowsItem,
    //                     dragEnabled: true, // Opcional: Bloquea arrastre de terminales si lo deseas
    //                     resizeEnabled: true
    //                 });
    //                 colX += colsItem;
    //             });
    //             currentY += rowsItem; // Deja el puntero Y debajo del último terminal creado
    //         } else {
    //             currentY = zona.inicioY || 5;
    //         }

    //         // 3. RELATIVOS (Tablas, Paneles, Gráficas)
    //         widgetsNormalizados
    //             .filter((w: any) => w.anclaje === 'RELATIVO' || w.anclaje === 'RELATIVO_DINAMICO')
    //             .forEach((wBD: any) => {
    //                 const registroLocal = WIDGET_MAP[wBD.codigoWidget] || {};

    //                 // Empuje dinámico: Mantiene la distancia original de la BD empujada por la cascada
    //                 const distanciaBase = wBD.y >= (zona.inicioY || 5) ? (wBD.y - (zona.inicioY || 5)) : 0;
    //                 const posYFinal = currentY + distanciaBase;

    //                 layoutFinal.push({
    //                     ...registroLocal,
    //                     codigoWidget: wBD.codigoWidget,
    //                     type: wBD.codigoWidget,
    //                     x: wBD.x,
    //                     y: posYFinal,
    //                     cols: wBD.cols || (registroLocal as any).defaultCols || 4,
    //                     rows: wBD.rows || (registroLocal as any).defaultRows || 4
    //                 });
    //             });

    //         return layoutFinal;
    //     }

    //     return layoutFinal;
    // }

    private construirLayoutUniversal(metadatosBackend: any, entidadesDinamicas: any[] = []): any[] {
        if (!metadatosBackend || !metadatosBackend.configuracion) return [];

        const layoutFinal: any[] = [];
        const config = metadatosBackend.configuracion;
        const estaticosBD = config.widgetsEstaticos || [];

        // 🟢 1. FILTRO DE ESTADO INICIAL (Para el Lobby)
        const estaticosVisiblesPorDefecto = estaticosBD.filter((w: any) =>
            w.inicial === undefined || w.inicial === null ||
            w.inicial === true || w.inicial === 1 || String(w.inicial).toLowerCase() === 'true'
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

        // ==========================================
        // ESTRATEGIA 1: ESTÁTICO ANALÍTICO (Distribuidor Perfecto a prueba de fallos)
        // ==========================================
        if (metadatosBackend.estrategia === 'ESTATICO_ANALITICO' || metadatosBackend.estrategia === 'FLUJO_PROCESO' || metadatosBackend.estrategia === 'ESTATICO_ANALITICO_GNL') {

            let cursorX = 0;
            let cursorY = 0;
            let maxRowHeight = 0;

            widgetsNormalizados.forEach((wNorm: any) => {
                const registroLocal = WIDGET_MAP[wNorm.codigoWidget] || {};

                // 🛡️ 1. Blindaje Extremo: Ningún widget puede tener más de 12 columnas ni 0 de tamaño
                const safeCols = Math.min(12, Math.max(1, Number(wNorm.cols || 4)));
                const safeRows = Math.max(1, Number(wNorm.rows || 4));

                // 🛡️ 2. Lógica Flexbox: Si no cabe en la fila actual, salta a la siguiente
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
                    x: cursorX, // 🟢 Asignamos coordenadas matemáticamente puras
                    y: cursorY  // 🟢 (Ignoramos el desorden de la base de datos temporalmente)
                });

                cursorX += safeCols;
                if (safeRows > maxRowHeight) maxRowHeight = safeRows;
            });

            return layoutFinal;
        }

        // ==========================================
        // ESTRATEGIA 2: CASCADA DINÁMICA (Sin cambios)
        // ==========================================
        if (metadatosBackend.estrategia === 'CASCADA_DINAMICA' && config.zonaDinamica) {
            const zona = config.zonaDinamica;
            let currentY = zona.inicioY || 5;

            // 1. ABSOLUTOS
            widgetsNormalizados.filter((w: any) => w.anclaje === 'ABSOLUTO').forEach((wBD: any) => {
                const registroLocal = WIDGET_MAP[wBD.codigoWidget] || {};
                layoutFinal.push({ ...registroLocal, codigoWidget: wBD.codigoWidget, type: wBD.codigoWidget, x: wBD.x, y: wBD.y, cols: wBD.cols, rows: wBD.rows });
            });

            // 2. DINÁMICOS
            if (entidadesDinamicas && entidadesDinamicas.length > 0) {
                const codigoMolde = zona.codigoMolde || 'PTT_MAE_WGT_TERMINAL';
                const registroMoldeLocal = WIDGET_MAP[codigoMolde] || {};
                let colX = zona.inicioX || 0;
                const rowsItem = zona.rowsPorItem || (registroMoldeLocal as any).defaultRows || 3;
                const colsItem = zona.colsPorItem || (registroMoldeLocal as any).defaultCols || 4;
                const maxFila = zona.maxItemsPorFila || 3;

                entidadesDinamicas.forEach((entidad, index) => {
                    if (index > 0 && index % maxFila === 0) { colX = zona.inicioX || 0; currentY += rowsItem; }
                    layoutFinal.push({ ...registroMoldeLocal, codigoWidget: codigoMolde, type: codigoMolde, idClon: `TERM_SLOT_${index}`, dataTerminal: entidad, x: colX, y: currentY, cols: colsItem, rows: rowsItem, dragEnabled: true, resizeEnabled: true });
                    colX += colsItem;
                });
                currentY += rowsItem;
            } else { currentY = zona.inicioY || 5; }

            // 3. RELATIVOS
            widgetsNormalizados.filter((w: any) => w.anclaje === 'RELATIVO' || w.anclaje === 'RELATIVO_DINAMICO').forEach((wBD: any) => {
                const registroLocal = WIDGET_MAP[wBD.codigoWidget] || {};
                const distanciaBase = wBD.y >= (zona.inicioY || 5) ? (wBD.y - (zona.inicioY || 5)) : 0;
                layoutFinal.push({ ...registroLocal, codigoWidget: wBD.codigoWidget, type: wBD.codigoWidget, x: wBD.x, y: currentY + distanciaBase, cols: wBD.cols, rows: wBD.rows });
            });

            return layoutFinal;
        }

        return layoutFinal;
    }

    // ==========================================
    // ESTRATEGIA 1: ESTÁTICO ANALÍTICO (VERSIÓN 2: MODO PRODUCCIÓN)
    // ==========================================
    // if (metadatosBackend.estrategia === 'ESTATICO_ANALITICO' || metadatosBackend.estrategia === 'FLUJO_PROCESO' || metadatosBackend.estrategia === 'ESTATICO_ANALITICO_GNL') {

    //     widgetsNormalizados.forEach((wNorm: any) => {
    //         const registroLocal = WIDGET_MAP[wNorm.codigoWidget] || {};

    //         layoutFinal.push({
    //             ...registroLocal,
    //             codigoWidget: wNorm.codigoWidget,
    //             type: wNorm.codigoWidget,
    //             cols: wNorm.cols,
    //             rows: wNorm.rows,

    //             // 🟢 VOLVEMOS A LA NORMALIDAD: Gridster obedece a tu base de datos curada
    //             x: wNorm.x,
    //             y: wNorm.y
    //         });
    //     });

    //     return layoutFinal;
    // }
}
