/*
    Author: German Valencia
    CC-221 (usuario, 2026-11-16): las acciones «subir» y «bajar» de la columna de opciones de app-table-data, con el mismo color en toda la
    solución (verde y naranja: variables --accion-subir y --accion-bajar de datatables_buttons.scss). Uso en las filas de una tabla:
      _acciones: [...accionesOrden('<LLAVE_PERMISO>', { subir: traducir('…MOVE_UP'), bajar: traducir('…MOVE_DOWN') })]
*/
export const COLOR_SUBIR = 'var(--accion-subir)';
export const COLOR_BAJAR = 'var(--accion-bajar)';

export interface AccionFila { accion: string; permiso: string; letra: string; color: string; tooltip: string }

export function accionesOrden(permiso: string, tooltips: { subir: string; bajar: string }, acciones = { subir: 'ARRIBA', bajar: 'ABAJO' }): AccionFila[] {
  return [
    { accion: acciones.subir, permiso, letra: '↑', color: COLOR_SUBIR, tooltip: tooltips.subir },
    { accion: acciones.bajar, permiso, letra: '↓', color: COLOR_BAJAR, tooltip: tooltips.bajar }
  ];
}
