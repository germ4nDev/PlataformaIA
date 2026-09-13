import { Type } from '@angular/core';

// Importaciones de Plataforma (Generales)
import { WdgUsuariosComponent } from 'src/app/plataforma/starter/home/widgets/wdg-usuarios/wdg-usuarios.component';
import { WdgPaquetesComponent } from 'src/app/plataforma/starter/home/widgets/wdg-paquetes/wdg-paquetes.component';
import { WdgTicketsComponent } from 'src/app/plataforma/starter/home/widgets/wdg-tickets/wdg-tickets.component';

// 🟢 Importaciones de los Nuevos KPIs Independientes
import { WdgKpiUsuariosComponent } from './widgets/wdg-kpi-usuarios/wdg-kpi-usuarios.component';
import { WdgKpiPaquetesComponent } from './widgets/wdg-kpi-paquetes/wdg-kpi-paquetes.component';
import { WdgKpiAplicacionesComponent } from './widgets/wdg-kpi-aplicaciones/wdg-kpi-aplicaciones.component';
import { WdgKpiSuscriptoresComponent } from './widgets/wdg-kpi-suscriptores/wdg-kpi-suscriptores.component';
import { WdgPaquetesDgtComponent } from './widgets/wdg-paquetes-dgt/wdg-paquetes-dgt.component';
import { WdgTicketsSbarComponent } from './widgets/wdg-tickets-sbar/wdg-tickets-sbar.component';
import { WdgFacturacionAreaComponent } from './widgets/wdg-facturacion-area/wdg-facturacion-area.component';

export interface IWidgetRegistryDef {
    componente: Type<unknown>;
    defaultCols: number;
    defaultRows: number;
}

export const WIDGET_MAP: { [key: string]: IWidgetRegistryDef } = {
    // ==========================================
    // KPIS ESTILO PORTTOS (Minimizados)
    // ==========================================
    'WDG_PLAT_KPI_USUARIOS': { componente: WdgKpiUsuariosComponent, defaultCols: 3, defaultRows: 1 },
    'WDG_PLAT_KPI_PAQUETES': { componente: WdgKpiPaquetesComponent, defaultCols: 3, defaultRows: 1 },
    'WDG_PLAT_KPI_APLICACIONES': { componente: WdgKpiAplicacionesComponent, defaultCols: 3, defaultRows: 1 },
    'WDG_PLAT_KPI_SUSCRIPTORES': { componente: WdgKpiSuscriptoresComponent, defaultCols: 3, defaultRows: 1 },

    // ==========================================
    // PESTAÑAS: PLATAFORMA (PRINCIPAL / SISTEMA)
    // ==========================================
    'WDG_PLAT_USUARIOS': { componente: WdgUsuariosComponent, defaultCols: 4, defaultRows: 3 },
    'WDG_PLAT_PAQUETES': { componente: WdgPaquetesComponent, defaultCols: 12, defaultRows: 4 },
    'WDG_PLAT_TICKETS': { componente: WdgTicketsComponent, defaultCols: 8, defaultRows: 3 },

    'WDG_PLAT_PAQUETES_DGT': { componente: WdgPaquetesDgtComponent, defaultCols: 4, defaultRows: 4 },
    'WDG_PLAT_TICKETS_SBAR': { componente: WdgTicketsSbarComponent, defaultCols: 8, defaultRows: 4 },
    'WDG_PLAT_FACTURACION_AREA': { componente: WdgFacturacionAreaComponent, defaultCols: 12, defaultRows: 4 }
};
