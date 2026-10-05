import { Injectable } from '@angular/core';
import { LayoutService } from 'src/app/theme/shared/service/layout.service';
import { LocalStorageService } from 'src/app/theme/shared/service';
import { PTLLayoutModel } from 'src/app/theme/shared/_helpers/models/PTLLayout.model';
import { v4 as uuidv4 } from 'uuid';

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
    async obtenerLayoutBase(pestana: string, usuarioId: string, lsWidgets: any[], entidadesDinamicas: any[] = []): Promise<any[]> {
        let layoutArmado: any[] = [];
        const usuario = usuarioId || 'SISTEMA_DEFAULT';

        try {
            const prefsCache = this._localStoragoService.getNavSettingsLocalStorage();
            if (prefsCache && prefsCache.layout && prefsCache.layout.length > 0) {
                const layoutCache = prefsCache.layout.filter((w: any) => w.pestana === pestana);
                if (layoutCache.length > 0) return layoutCache;
            }

            const layoutDesdeBD: PTLLayoutModel[] = await this._layoutService.cargarRegistrosUsuarioPestana(usuario, pestana).toPromise() || [];

            if (layoutDesdeBD.length > 0) {
                layoutArmado = layoutDesdeBD.map(itemDB => {
                    const esTerminalClon = itemDB.codigoWidget?.startsWith('TERM_SLOT_');
                    const codigoBusqueda = esTerminalClon ? 'PTT_MAE_WGT_TERMINAL' : itemDB.codigoWidget;
                    const widgetMaster = lsWidgets.find(w => (w as any).codigoWidget === codigoBusqueda) || {};

                    let configData = null;
                    if (itemDB.config) {
                        try { configData = typeof itemDB.config === 'string' ? JSON.parse(itemDB.config) : itemDB.config; } catch (e) { }
                    }

                    return {
                        ...widgetMaster,
                        type: codigoBusqueda,
                        codigoWidget: codigoBusqueda,
                        idClon: esTerminalClon ? itemDB.codigoWidget : undefined,
                        cols: itemDB.cols, rows: itemDB.rows,
                        x: itemDB.posicion_x, y: itemDB.posicion_y,
                        visible: true, pestana: pestana,
                        data: configData || (widgetMaster ? (widgetMaster as any).data : null)
                    };
                });
            } else {
                const metadatosBackend = await this._layoutService.getPlantillaMaestra(pestana).toPromise();
                if (metadatosBackend) {
                    layoutArmado = this.construirLayoutUniversal(lsWidgets, metadatosBackend, entidadesDinamicas);
                }
            }

            const layoutSinDuplicados = layoutArmado.filter((widget, index, self) =>
                index === self.findIndex((w) => (w.idClon || w.type) === (widget.idClon || widget.type))
            );

            layoutSinDuplicados.forEach(widget => {
                if ((widget.type || widget.codigoWidget || '').toUpperCase().includes('KPI')) {
                    widget.cols = 2; widget.rows = 2;
                }
            });

            return layoutSinDuplicados;
        } catch (error) {
            console.error("Error obteniendo layout base:", error);
            return [];
        }
    }

    // ==========================================
    // EL INTÉRPRETE UNIVERSAL (QPLUS METADATA ENGINE)
    // ==========================================
    private construirLayoutUniversal(widgetsDisponibles: any[], metadatosBackend: any, entidadesDinamicas: any[] = []): any[] {
        if (!metadatosBackend || !metadatosBackend.configuracion) return [];

        const layoutFinal: any[] = [];
        const config = metadatosBackend.configuracion;

        if (metadatosBackend.estrategia === 'ESTATICO_ANALITICO' || metadatosBackend.estrategia === 'FLUJO_PROCESO' || metadatosBackend.estrategia === 'ESTATICO_ANALITICO_GNL') {
            config.widgetsEstaticos.forEach((widgetBD: any) => {
                const widgetBase = widgetsDisponibles.find((w: any) => (w.type || w.codigoWidget) === widgetBD.codigoWidget);
                if (widgetBase) {
                    layoutFinal.push({ ...widgetBase, codigoWidget: widgetBD.codigoWidget, type: widgetBD.codigoWidget, x: widgetBD.x, y: widgetBD.y, cols: widgetBD.cols, rows: widgetBD.rows });
                }
            });
            return layoutFinal;
        }

        if (metadatosBackend.estrategia === 'CASCADA_DINAMICA' && config.zonaDinamica) {
            // (Aquí va exactamente tu mismo código de cascada dinámica que tenías en TorreControlComponent)
            // ... [Para brevedad mantengo la estructura, pega tu bloque de cascada dinámica aquí] ...
        }
        return layoutFinal;
    }
}
