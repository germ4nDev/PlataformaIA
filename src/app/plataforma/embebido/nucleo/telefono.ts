/* eslint-disable @typescript-eslint/no-explicit-any */
/*
    Author: German Valencia
    Pattern: PLATAFORMA Núcleo puro - Teléfono con la web embebida (OT-017 fase 3)
    Description: Sin Angular ni red; lo prueba _pruebas/telefono-embebido.test.js. Lo usan PestanaGridsterBase y la Torre de Control
      solo cuando la app entrega canal 'telefono'. La tableta y la web no pasan por aquí (garantía OT-017: la tableta = la web).
        COLUMNAS_TELEFONO = 4                 la web usa 12; una columna del teléfono equivale a 3 de la web
        altoFilaTelefono(ancho)               proporcional a la web: la fila del teléfono equivale a 2 filas de 160 px de la web en su
                                              ancho de referencia (1280 px): 320 × ancho / 1280 (390 px → 98; 412 px → 103), entre 72 y 140
        opcionesGridsterTelefono(ancho)       rejilla de 4 columnas, sin el corte que apila en una columna; layout fijo: sin
                                              mover ni cambiar tamaño (CC-124: la pulsación larga de Android cancelaba el arrastre)
        tamanoTelefono(widget)                igual que utils/layout/layout-telefono.js del API: ≤ 3 columnas de la web = 2; si no 4;
                                              filas de la web / 2, entre 1 y 6; el de ancho completo, mínimo 3
                                              (CC-122) y el angosto, mínimo 2 (KPI 2×2, CC-123); la prueba compara los dos
        itemsAGridster(items, catalogo)       del layout de /api/layout-telefono a items de gridster con la fila del maestro
        gridsterAItems(dashboard)             de gridster a { codigo, x, y, cols, rows } para guardar
        pestanasConWidgets(pestanas, resumen) las pestañas (en su orden) que tienen widgets de teléfono
        llavePestanasTelefono / ordenarPestanasTelefono  pestañas elegidas en el dispositivo (CC-125), sin tocar las de la web
*/

export const COLUMNAS_TELEFONO = 4;
export const ANCHO_REFERENCIA_WEB = 1280;
export const ALTO_FILA_WEB = 160;
export const FILAS_WEB_POR_FILA_TELEFONO = 2;
/** Filas mínimas de un widget de ancho completo en el teléfono (con 2 una tabla o gráfica no se lee; CC-122). */
export const MIN_FILAS_ANCHO_TELEFONO = 3;
/** Filas mínimas de un widget angosto (2 columnas) en el teléfono: el KPI queda de 2×2, casi cuadrado (CC-123). */
export const MIN_FILAS_ANGOSTO_TELEFONO = 2;

const entero = (v: unknown, min: number, max: number, porDefecto: number): number => {
  const n = Number.parseInt(String(v), 10);
  if (!Number.isFinite(n)) return porDefecto;
  return Math.min(max, Math.max(min, n));
};
const codigoDe = (v: unknown): string => String(v ?? '').trim().toUpperCase();

export function altoFilaTelefono(ancho: number): number {
  const a = Number(ancho) > 0 ? Number(ancho) : 390;
  const proporcional = (ALTO_FILA_WEB * FILAS_WEB_POR_FILA_TELEFONO * a) / ANCHO_REFERENCIA_WEB;
  return Math.min(140, Math.max(72, Math.round(proporcional)));
}

export function opcionesGridsterTelefono(ancho: number): Record<string, any> {
  return {
    minCols: COLUMNAS_TELEFONO,
    maxCols: COLUMNAS_TELEFONO,
    fixedRowHeight: altoFilaTelefono(ancho),
    margin: 8,
    outerMargin: true,
    outerMarginBottom: 16,
    defaultItemCols: 2,
    defaultItemRows: 1,
    mobileBreakpoint: 0,
    keepFixedHeightInMobile: true,
    compactType: 'none',
    pushItems: true,
    // Layout fijo en el teléfono (CC-124): ni mover ni cambiar tamaño; con el dedo solo se desplaza la página
    draggable: { enabled: false },
    resizable: { enabled: false },
  };
}

export function tamanoTelefono(widget: any): { cols: number; rows: number } {
  const colsWeb = entero(widget?.defaultCols, 1, 12, 4);
  const filasWeb = entero(widget?.defaultRows, 1, 40, 2);
  const cols = colsWeb <= 3 ? 2 : COLUMNAS_TELEFONO;
  const minimo = cols === COLUMNAS_TELEFONO ? MIN_FILAS_ANCHO_TELEFONO : MIN_FILAS_ANGOSTO_TELEFONO;
  return { cols, rows: Math.min(6, Math.max(minimo, Math.round(filasWeb / 2))) };
}

export function itemsAGridster(items: any[], catalogo: any[]): any[] {
  const porCodigo = new Map<string, any>();
  for (const w of catalogo || []) porCodigo.set(codigoDe(w?.codigoWidget || w?.codigo_widget), w);
  return (items || []).map((it: any) => {
    const codigo = codigoDe(it?.codigo);
    const maestro = porCodigo.get(codigo) || {};
    return {
      ...maestro,
      nombreWidget: maestro.nombreWidget || it?.nombre || codigo,
      type: codigo,
      codigoWidget: codigo,
      x: entero(it?.x, 0, COLUMNAS_TELEFONO - 1, 0),
      y: entero(it?.y, 0, 400, 0),
      cols: entero(it?.cols, 1, COLUMNAS_TELEFONO, 2),
      rows: entero(it?.rows, 1, 8, 1),
    };
  });
}

export function gridsterAItems(dashboard: any[]): Array<{ codigo: string; x: number; y: number; cols: number; rows: number }> {
  return (dashboard || [])
    .map((w: any) => ({
      codigo: codigoDe(w?.type || w?.codigoWidget),
      x: entero(w?.x, 0, COLUMNAS_TELEFONO - 1, 0),
      y: entero(w?.y, 0, 400, 0),
      cols: entero(w?.cols, 1, COLUMNAS_TELEFONO, 2),
      rows: entero(w?.rows, 1, 8, 1),
    }))
    .filter((i) => i.codigo && !i.codigo.includes('FANTASMA'));
}

export function pestanasConWidgets(pestanas: any[], resumen: Array<{ codigoPestana: string; widgets: number }>): any[] {
  const con = new Set((resumen || []).filter((r) => Number(r?.widgets) > 0).map((r) => codigoDe(r.codigoPestana)));
  return (pestanas || []).filter((p: any) => con.has(codigoDe(p?.codigoPestana)));
}

/** Llave del dispositivo donde el teléfono guarda las pestañas elegidas por cada usuario (CC-125; no toca la preferencia de la web). */
export function llavePestanasTelefono(usuario: unknown): string {
  return `porttos.pestanasTelefono.${String(usuario ?? '').trim() || 'anonimo'}`;
}

/**
 * Pestañas del teléfono (CC-125, CC-126): las candidatas son el mismo listado de pestañas de la web (la consulta del usuario, en su
 * orden); con una elección guardada en el dispositivo, solo las elegidas y en su orden. Una elegida que ya no está en el listado se ignora.
 * Sin elección válida (vacía, vieja o ilegible) salen las de `porDefecto` (las que tienen widgets de teléfono) o, si no hay, todas:
 * el teléfono nunca queda sin pestañas.
 */
export function ordenarPestanasTelefono(candidatas: any[], preferencia: unknown, porDefecto?: any[]): any[] {
  const todas = Array.isArray(candidatas) ? candidatas.filter(Boolean) : [];
  const respaldo = Array.isArray(porDefecto) && porDefecto.filter(Boolean).length ? porDefecto.filter(Boolean) : todas;
  const elegidas = Array.isArray(preferencia) ? [...new Set(preferencia.map(codigoDe).filter(Boolean))] : [];
  if (!elegidas.length) return [...respaldo];
  const porCodigo = new Map(todas.map((p: any) => [codigoDe(p?.codigoPestana), p]));
  const resultado = elegidas.map((c) => porCodigo.get(c)).filter(Boolean);
  return resultado.length ? resultado : [...respaldo];
}
