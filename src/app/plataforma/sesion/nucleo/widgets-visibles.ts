/*
    Author: German Valencia
    Pattern: PLATAFORMA Núcleo puro - Widgets visibles por rol y por canal (regla 18, fase 2)
    Description: Qué widgets ve el usuario, sin Angular ni red. Copia exacta en PlataformaApiIA/utils/layout/widgets-visibles.js
      (la usa el tablero del teléfono); _pruebas/widgets-visibles.test.js corre las dos con los mismos casos: si se cambia una,
      se cambia la otra.
      - Sin relación activa en PTLWidgetsRoles para un rol del usuario = no lo ve. Sin permisos (null: la sesión no los trajo)
        no se ve nada.
      - Canal del widget (PTLWidgetsMaestro.canal, migración 030; antes movil = 1 → 'telefono'): 'web' | 'telefono' | 'ambos'.
      - Canal de quien pinta (OT-017):
          'web'      la web y la tableta: los 'web' y 'ambos' (un widget solo de teléfono no se ofrece).
          'telefono' la web embebida en el teléfono: solo 'telefono' y 'ambos'.
          'nativo'   la vista nativa de la app (respaldo sin conexión): todo lo permitido, como en CC-115.
      - Las tarjetas de terminal (TERM_SLOT_n, molde PTT_MAE_WGT_TERMINAL) son la zona dinámica de la pestaña, no un widget del
        catálogo: no tienen fila en el maestro ni en PTLWidgetsRoles y se ven siempre.
      Un widget oculto no se borra del layout guardado: separarPorPermiso devuelve también los ocultos para conservarlos.
*/

/* eslint-disable @typescript-eslint/no-explicit-any */
export const MOLDE_TERMINAL = 'PTT_MAE_WGT_TERMINAL';
export const CANALES = ['web', 'telefono', 'ambos'];

/** Canal de quien pinta el tablero. */
export type CanalWidgets = 'web' | 'telefono' | 'nativo';
/** Canal de un widget del maestro. */
export type CanalDelWidget = 'web' | 'telefono' | 'ambos';

export interface PermisosWidgets {
  /** Códigos (mayúsculas) que permiten los roles del usuario. */
  codigos: string[];
  /** De esos, los solo de teléfono (canal 'telefono'). */
  telefono: string[];
  /** De esos, los de todos los equipos (canal 'ambos'). */
  ambos: string[];
}

const limpio = (v: unknown): string => String(v ?? '').trim().toUpperCase();

/** Código del widget de una celda de la regla, un item de gridster o una fila del maestro. */
export function codigoDe(item: any): string {
  const c = limpio(item?.codigo || item?.type || item?.codigoWidget || item?.idClon);
  return /^TERM_SLOT_\d+$/.test(c) ? MOLDE_TERMINAL : c;
}

/** PTLWidgetsMaestro.movil = 1 (migración 028). */
export function esDeTelefono(widget: any): boolean {
  const v = widget?.movil;
  return v === true || v === 1 || v === '1' || String(v).toLowerCase() === 'true';
}

/** Canal del widget: canal (030) si es válido; si no, desde movil (028): 'telefono' o 'web'. */
export function canalDe(widget: any): CanalDelWidget {
  const c = String(widget?.canal ?? '').trim().toLowerCase();
  if (CANALES.includes(c)) return c as CanalDelWidget;
  return esDeTelefono(widget) ? 'telefono' : 'web';
}

/** De los widgets que permiten los roles (usuario.widgets, filas del maestro) a sus permisos; null si no hay lista. */
export function permisosDeWidgets(widgets: any[] | null | undefined): PermisosWidgets | null {
  if (!Array.isArray(widgets)) return null;
  const de = (canal: CanalDelWidget) => [...new Set(widgets.filter((w) => canalDe(w) === canal).map(codigoDe).filter(Boolean))];
  return {
    codigos: [...new Set(widgets.map(codigoDe).filter(Boolean))],
    telefono: de('telefono'),
    ambos: de('ambos'),
  };
}

export function widgetVisible(codigo: string, permisos: PermisosWidgets | null, canal: CanalWidgets): boolean {
  const c = codigoDe({ codigo });
  if (c === MOLDE_TERMINAL) return true;
  if (!permisos || !c) return false;
  if (!permisos.codigos.includes(c)) return false;
  if (canal === 'nativo') return true;
  const soloTelefono = permisos.telefono.includes(c);
  if (canal === 'telefono') return soloTelefono || (permisos.ambos || []).includes(c);
  return !soloTelefono;
}

/** Parte un layout en lo que se ve y lo que se oculta (lo oculto se conserva al guardar). */
export function separarPorPermiso<T>(items: T[], permisos: PermisosWidgets | null, canal: CanalWidgets): { visibles: T[]; ocultos: T[] } {
  const visibles: T[] = [];
  const ocultos: T[] = [];
  for (const item of items || []) (widgetVisible(codigoDe(item), permisos, canal) ? visibles : ocultos).push(item);
  return { visibles, ocultos };
}
