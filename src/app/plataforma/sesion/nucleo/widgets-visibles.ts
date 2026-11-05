/*
    Author: German Valencia
    Pattern: PLATAFORMA Núcleo puro - Widgets visibles por rol y por canal (regla 18, fase 2)
    Description: Qué widgets ve el usuario, sin Angular ni red. Copia exacta en PlataformaApiIA/utils/layout/widgets-visibles.js
      (la usa el tablero del teléfono); _pruebas/widgets-visibles.test.js corre las dos con los mismos casos: si se cambia una,
      se cambia la otra.
      - Sin relación activa en PTLWidgetsRoles para un rol del usuario = no lo ve. Sin permisos (null: la sesión no los trajo)
        no se ve nada.
      - PTLWidgetsMaestro.movil = 1 = widget de teléfono: solo el canal 'telefono'; la web y la tableta no lo ofrecen.
      - Las tarjetas de terminal (TERM_SLOT_n, molde PTT_MAE_WGT_TERMINAL) son la zona dinámica de la pestaña, no un widget del
        catálogo: no tienen fila en el maestro ni en PTLWidgetsRoles y se ven siempre.
      Un widget oculto no se borra del layout guardado: separarPorPermiso devuelve también los ocultos para conservarlos.
*/

/* eslint-disable @typescript-eslint/no-explicit-any */
export const MOLDE_TERMINAL = 'PTT_MAE_WGT_TERMINAL';

export type CanalWidgets = 'web' | 'telefono';

export interface PermisosWidgets {
  /** Códigos (mayúsculas) que permiten los roles del usuario. */
  codigos: string[];
  /** De esos, los de teléfono (movil = 1). */
  telefono: string[];
}

const limpio = (v: unknown): string => String(v ?? '').trim().toUpperCase();

/** Código del widget de una celda de la regla, un item de gridster o una fila del maestro. */
export function codigoDe(item: any): string {
  const c = limpio(item?.codigo || item?.type || item?.codigoWidget || item?.idClon);
  return /^TERM_SLOT_\d+$/.test(c) ? MOLDE_TERMINAL : c;
}

/** PTLWidgetsMaestro.movil = 1. */
export function esDeTelefono(widget: any): boolean {
  const v = widget?.movil;
  return v === true || v === 1 || v === '1' || String(v).toLowerCase() === 'true';
}

/** De los widgets que permiten los roles (usuario.widgets, filas del maestro) a sus permisos; null si no hay lista. */
export function permisosDeWidgets(widgets: any[] | null | undefined): PermisosWidgets | null {
  if (!Array.isArray(widgets)) return null;
  return {
    codigos: [...new Set(widgets.map(codigoDe).filter(Boolean))],
    telefono: [...new Set(widgets.filter(esDeTelefono).map(codigoDe).filter(Boolean))],
  };
}

export function widgetVisible(codigo: string, permisos: PermisosWidgets | null, canal: CanalWidgets): boolean {
  const c = codigoDe({ codigo });
  if (c === MOLDE_TERMINAL) return true;
  if (!permisos || !c) return false;
  if (!permisos.codigos.includes(c)) return false;
  return canal === 'telefono' || !permisos.telefono.includes(c);
}

/** Parte un layout en lo que se ve y lo que se oculta (lo oculto se conserva al guardar). */
export function separarPorPermiso<T>(items: T[], permisos: PermisosWidgets | null, canal: CanalWidgets): { visibles: T[]; ocultos: T[] } {
  const visibles: T[] = [];
  const ocultos: T[] = [];
  for (const item of items || []) (widgetVisible(codigoDe(item), permisos, canal) ? visibles : ocultos).push(item);
  return { visibles, ocultos };
}
