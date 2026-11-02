/* eslint-disable @typescript-eslint/no-explicit-any */
/*
    Author: German Valencia
    Pattern: Layout Metadata Engine (QPLUS Architecture)
    Refactor: WIDGET_MAP SSOT Integration & CASCADA_DINAMICA Auto-healing
    OT-008 (2026-10-29): qué widgets van, dónde y de qué tamaño lo decide layout-efectivo.ts, la MISMA regla del API para la
    app móvil (_pruebas/layout-paridad.test.js lo verifica). Aquí queda lo propio de la web: el arrastre local sin guardar
    (solo existe en este navegador), el registro WIDGET_MAP y los datos de cada terminal. El por defecto ya no incluye los
    widgets inactivos del maestro y las terminales usan la zona dinámica de la BD (antes 4×3×3 y una plantilla de Marítimo
    escritas en el código; copia en _respaldos/2026-10-29_layout-unico/).
*/
import { Injectable } from '@angular/core';
import { LayoutService } from 'src/app/theme/shared/service/layout.service';
import { LocalStorageService } from 'src/app/theme/shared/service';
import { PtlpestanasService } from 'src/app/theme/shared/service/ptlpestanas.service';
import { PTLLayoutModel } from 'src/app/theme/shared/_helpers/models/PTLLayout.model';

import { WIDGET_MAP } from 'src/app/porttos/torre-control/widget-registry';
import { CeldaLayout, MOLDE_TERMINAL, ajustarTerminales, layoutEfectivo } from './layout-efectivo';

@Injectable({
    providedIn: 'root'
})
export class LayoutMetadataEngineService {

    constructor(
        private _layoutService: LayoutService,
        private _localStoragoService: LocalStorageService,
        private _pestanasService: PtlpestanasService
    ) { }

    // ==========================================
    // OBTENCIÓN CENTRALIZADA DE LAYOUT BASE
    // ==========================================
    /**
     * @param lsWidgetsAux maestro de widgets (/widgets/activos, con estadoWidget): los inactivos no entran al por defecto
     * @param entidadesDinamicas terminales del puerto (Marítimo); vacío = aún no se saben y el layout no se toca
     */
    async obtenerLayoutBase(
        pestana: string,
        usuarioId: string,
        lsWidgetsAux: any[],
        entidadesDinamicas: any[] = []
    ): Promise<any[]> {
        const usuario = usuarioId || 'SISTEMA_DEFAULT';
        const terminales = Array.isArray(entidadesDinamicas) && entidadesDinamicas.length > 0 ? entidadesDinamicas.length : null;

        try {
            // 1. Arrastre local del usuario sin guardar (solo en este navegador): se respeta y solo se ajustan las terminales
            const prefsCache = this._localStoragoService.getNavSettingsLocalStorage();
            const layoutCache = prefsCache && Array.isArray(prefsCache.layout) ? prefsCache.layout.filter((w: any) => w.pestana === pestana) : [];
            if (layoutCache.length > 0) {
                const celdas = layoutCache.map((w: any) => {
                    const idClon = String(w.idClon || w.codigoWidget || w.type || '').startsWith('TERM_SLOT_') ? (w.idClon || w.codigoWidget || w.type) : w.idClon;
                    const codigo = idClon ? MOLDE_TERMINAL : (w.type || w.codigoWidget);
                    return { ...w, codigo, idClon, x: Number(w.x ?? 0), y: Number(w.y ?? 0), cols: Number(w.cols || 4), rows: Number(w.rows || 3) };
                });
                const info: any = (this._pestanasService.getPestanasActuales() || [])
                    .find((p: any) => String(p?.codigoPestana || '').trim().toUpperCase() === String(pestana || '').trim().toUpperCase());
                return this.aWidgetsWeb(ajustarTerminales(celdas, terminales, info?.zonaDinamica || null), pestana, entidadesDinamicas, new Map(celdas.map((c: any) => [c.idClon || c.codigo, c])));
            }

            // 2. Lo mismo que la app: layout del usuario en la BD o, si no tiene, la plantilla maestra (sin inactivos)
            const filasUsuario: PTLLayoutModel[] =
                (await this._layoutService.cargarRegistrosUsuarioPestana(usuario, pestana).toPromise()) || [];
            const maestra = filasUsuario.length ? null : await this._layoutService.getPlantillaMaestra(pestana).toPromise();
            // La estrategia y la zona dinámica salen de la pestaña (/api/pestanas: PTLPestanas y PTLCfgZonasDinamicas), como en
            // la app: /api/layout/plantilla las lee de PTLLayoutPestanas y devuelve Marítimo como estático y sin zona
            const info: any = (this._pestanasService.getPestanasActuales() || [])
                .find((p: any) => String(p?.codigoPestana || '').trim().toUpperCase() === String(pestana || '').trim().toUpperCase());
            const plantilla = {
                estrategia: info?.codigoTipoPestana || maestra?.estrategia || null,
                widgetsEstaticos: maestra?.configuracion?.widgetsEstaticos || [],
                zonaDinamica: info?.zonaDinamica || maestra?.configuracion?.zonaDinamica || null
            };
            const estados = Object.fromEntries((lsWidgetsAux || []).map((w: any) => [String(w.codigoWidget || '').trim().toUpperCase(), w.estadoWidget]));
            const { celdas } = layoutEfectivo({ usuario: filasUsuario, plantilla, estados, terminales });

            // La configuración guardada de cada widget del usuario (config) viaja con su celda
            const guardados = new Map<string, any>();
            for (const itemDB of filasUsuario as any[]) {
                let data = null;
                if (itemDB.config) {
                    try { data = typeof itemDB.config === 'string' ? JSON.parse(itemDB.config) : itemDB.config; } catch (e) { }
                }
                guardados.set(String(itemDB.codigoWidget || '').trim().toUpperCase(), { data });
            }
            return this.aWidgetsWeb(celdas, pestana, entidadesDinamicas, guardados);
        } catch (error) {
            console.error('❌ Error en Motor Metadata obteniendo layout base:', error);
            return [];
        }
    }

    /** Celdas de la regla → widgets de gridster con su registro local (WIDGET_MAP) y, las terminales, su terminal. */
    private aWidgetsWeb(celdas: CeldaLayout[], pestana: string, entidadesDinamicas: any[], previos: Map<string, any>): any[] {
        return celdas.map((c) => {
            const registroLocal = WIDGET_MAP[c.codigo] || {};
            const previo = previos.get(c.idClon || c.codigo) || {};
            const indice = c.idClon ? Number(/^TERM_SLOT_(\d+)$/.exec(c.idClon)?.[1]) : NaN;
            return {
                ...registroLocal,
                ...previo,
                codigoWidget: c.codigo,
                type: c.codigo,
                idClon: c.idClon,
                x: c.x, y: c.y, cols: c.cols, rows: c.rows,
                visible: true,
                pestana,
                ...(c.idClon ? { dataTerminal: entidadesDinamicas?.[indice], dragEnabled: true, resizeEnabled: true } : {})
            };
        }).filter((w) => w.type !== undefined);
    }
}
