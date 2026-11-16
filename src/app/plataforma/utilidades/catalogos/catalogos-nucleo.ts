/*
    Author: German Valencia
    Pattern: PLATAFORMA Núcleo - Utilidades › Catálogos (CC-204; usuario 2026-11-15, grupo 2 de las tablas sin pantalla)
    Description: definición de los catálogos simples que administra una sola pantalla (regla 10): tipos de rol, de widget, de pago, de
    paquete, de actividad, tipos de estado y estados. Las mismas llaves, tablas y reglas que utils/plataforma/catalogos.js del API
    (_pruebas/admin-catalogos.test.js lo comprueba). Sin Angular: lo prueba node.
*/
export type TipoCampo = 'codigo' | 'texto' | 'textoLargo' | 'entero' | 'decimal';

export interface CampoCatalogo {
  nombre: string;
  etiqueta: string;
  tipo: TipoCampo;
  max?: number;
  min?: number;
  maxValor?: number;
  requerido?: boolean;
  mayusculas?: boolean;
  enLista?: boolean;
  /** el valor es el número de un tipo de estado (se sugiere de ese catálogo) */
  deTiposEstado?: boolean;
}

export interface Permisos {
  crear: string;
  modificar: string;
  eliminar: string;
}

export interface DefCatalogo {
  clave: string;
  api: string;
  titulo: string;
  subtitulo: string;
  llave: string;
  autonumerica?: boolean;
  estado: string | null;
  permisos: Permisos;
  campos: CampoCatalogo[];
}

const CODIGO = 'COMMON.CODE';
const NOMBRE = 'COMMON.NAME';
const DESCRIPCION = 'COMMON.DESCRIPTION';

export const CATALOGOS: DefCatalogo[] = [
  {
    clave: 'tipos-rol', api: 'tipos-roles', titulo: 'UTILIDADES.CATALOGOS.ROLE_TYPES', subtitulo: 'UTILIDADES.CATALOGOS.CLASSIFY_APPLICATION_ROLES',
    llave: 'codigoTipoRole', estado: 'estadoTipoRole',
    permisos: { crear: 'ACT_TIPOSROLE_CREAR', modificar: 'ACT_TIPOSROLE_MODIFICAR', eliminar: 'ACT_TIPOSROLE_ELIMINAR' },
    campos: [
      { nombre: 'codigoTipoRole', etiqueta: CODIGO, tipo: 'codigo', max: 200, requerido: true, enLista: true },
      { nombre: 'nombreTipoRole', etiqueta: NOMBRE, tipo: 'texto', max: 100, requerido: true, mayusculas: true, enLista: true },
      { nombre: 'descripcionTipoRole', etiqueta: DESCRIPCION, tipo: 'textoLargo', max: 4000 }
    ]
  },
  {
    clave: 'tipos-widget', api: 'tipos-widget', titulo: 'UTILIDADES.CATALOGOS.WIDGET_TYPES', subtitulo: 'UTILIDADES.CATALOGOS.CLASSIFY_DASHBOARD_WIDGETS',
    llave: 'codigoTipo', estado: 'estado',
    permisos: { crear: 'ACT_TIPOSWDGT_CREAR', modificar: 'ACT_TIPOSWDGT_MODIFICAR', eliminar: 'ACT_TIPOSWDGT_ELIMINAR' },
    campos: [
      { nombre: 'codigoTipo', etiqueta: CODIGO, tipo: 'codigo', max: 200, requerido: true, enLista: true },
      { nombre: 'nombreTipo', etiqueta: NOMBRE, tipo: 'texto', max: 100, requerido: true, enLista: true },
      { nombre: 'descripcion', etiqueta: DESCRIPCION, tipo: 'textoLargo', max: 4000 }
    ]
  },
  {
    clave: 'tipos-pago', api: 'tipos-pago', titulo: 'UTILIDADES.CATALOGOS.PAYMENT_TYPES', subtitulo: 'UTILIDADES.CATALOGOS.PAYMENT_METHODS_BILLING',
    llave: 'codigoTipoPago', estado: 'estadoTipo',
    permisos: { crear: 'ACT_TIPOSPAGO_CREAR', modificar: 'ACT_TIPOSPAGO_MODIFICAR', eliminar: 'ACT_TIPOSPAGO_ELIMINAR' },
    campos: [
      { nombre: 'codigoTipoPago', etiqueta: CODIGO, tipo: 'codigo', max: 200, requerido: true, enLista: true },
      { nombre: 'nombreTipoPago', etiqueta: NOMBRE, tipo: 'texto', max: 100, requerido: true, mayusculas: true, enLista: true },
      { nombre: 'descripcionTipo', etiqueta: DESCRIPCION, tipo: 'textoLargo', max: 4000 }
    ]
  },
  {
    clave: 'tipos-paquete', api: 'tipos-paquete', titulo: 'UTILIDADES.CATALOGOS.PACKAGE_TYPES', subtitulo: 'UTILIDADES.CATALOGOS.PACKAGE_TERM_MONTHLY_DISCOUNT',
    llave: 'codigoTipoPaquete', estado: 'estadoTipo',
    permisos: { crear: 'ACT_TIPOSPAQ_CREAR', modificar: 'ACT_TIPOSPAQ_MODIFICAR', eliminar: 'ACT_TIPOSPAQ_ELIMINAR' },
    campos: [
      { nombre: 'codigoTipoPaquete', etiqueta: CODIGO, tipo: 'codigo', max: 200, requerido: true, enLista: true },
      { nombre: 'nombreTipoPaquete', etiqueta: NOMBRE, tipo: 'texto', max: 100, requerido: true, mayusculas: true, enLista: true },
      { nombre: 'numMeses', etiqueta: 'UTILIDADES.CATALOGOS.MONTHS', tipo: 'entero', requerido: true, min: 1, maxValor: 120, enLista: true },
      { nombre: 'descuentoMeses', etiqueta: 'UTILIDADES.CATALOGOS.DISCOUNT', tipo: 'decimal', requerido: true, min: 0, maxValor: 100, enLista: true },
      { nombre: 'descripcionTipo', etiqueta: DESCRIPCION, tipo: 'textoLargo', max: 4000 }
    ]
  },
  {
    clave: 'tipos-actividad', api: 'tipos-actividad', titulo: 'UTILIDADES.CATALOGOS.ACTIVITY_TYPES', subtitulo: 'UTILIDADES.CATALOGOS.GROUP_PERMISSION_ACTIVITIES',
    llave: 'codigoTipoActividad', estado: 'estadoTipoActividad',
    permisos: { crear: 'ACT_TIPOSACT_CREAR', modificar: 'ACT_TIPOSACT_MODIFICAR', eliminar: 'ACT_TIPOSACT_ELIMINAR' },
    campos: [
      { nombre: 'codigoTipoActividad', etiqueta: CODIGO, tipo: 'codigo', max: 100, requerido: true, enLista: true },
      { nombre: 'nombreTipoActividad', etiqueta: NOMBRE, tipo: 'texto', max: 200, requerido: true, enLista: true },
      { nombre: 'descripcionTipoActividad', etiqueta: DESCRIPCION, tipo: 'textoLargo', max: 500 }
    ]
  },
  {
    clave: 'tipos-estado', api: 'tipos-estados', titulo: 'UTILIDADES.CATALOGOS.STATUS_TYPES', subtitulo: 'UTILIDADES.CATALOGOS.GROUP_STATUSES_BY_NUMBER',
    llave: 'codigoTipoEstado', estado: 'estado',
    permisos: { crear: 'ACT_TIPOSEST_CREAR', modificar: 'ACT_TIPOSEST_MODIFICAR', eliminar: 'ACT_TIPOSEST_ELIMINAR' },
    campos: [
      { nombre: 'codigoTipoEstado', etiqueta: CODIGO, tipo: 'codigo', max: 50, requerido: true, enLista: true },
      { nombre: 'tipoEstado', etiqueta: 'UTILIDADES.CATALOGOS.TYPE_NUMBER', tipo: 'entero', requerido: true, min: 0, maxValor: 32767, enLista: true },
      { nombre: 'nombreTipo', etiqueta: NOMBRE, tipo: 'texto', max: 100, requerido: true, enLista: true },
      { nombre: 'descripcionEstado', etiqueta: DESCRIPCION, tipo: 'textoLargo', max: 255 }
    ]
  },
  {
    clave: 'estados', api: 'estados', titulo: 'UTILIDADES.CATALOGOS.STATUSES', subtitulo: 'UTILIDADES.CATALOGOS.STATUSES_EACH_TYPE_ABBREVIATION',
    llave: 'estadoId', autonumerica: true, estado: null,
    permisos: { crear: 'ACT_ESTADOS_CREAR', modificar: 'ACT_ESTADOS_MODIFICAR', eliminar: 'ACT_ESTADOS_ELIMINAR' },
    campos: [
      { nombre: 'tipoEstado', etiqueta: 'UTILIDADES.CATALOGOS.TYPE_NUMBER', tipo: 'entero', requerido: true, min: 0, maxValor: 32767, enLista: true, deTiposEstado: true },
      { nombre: 'nombreEstado', etiqueta: NOMBRE, tipo: 'texto', max: 100, requerido: true, enLista: true },
      { nombre: 'siglaEstado', etiqueta: 'UTILIDADES.CATALOGOS.ABBREVIATION', tipo: 'texto', max: 10, requerido: true, mayusculas: true, enLista: true }
    ]
  }
];

export const catalogo = (clave: string | null | undefined): DefCatalogo | null => CATALOGOS.find((c) => c.clave === clave) || null;

const txt = (v: any): string => (v === undefined || v === null ? '' : String(v).trim());
const bool = (v: any): boolean => v === true || v === 1 || v === '1' || v === 'true';

/** Estado del registro (los catálogos sin columna de estado siempre están activos) */
export const activo = (def: DefCatalogo, r: any): boolean => (def.estado ? bool(r?.[def.estado]) : true);

/** Id del registro en la ruta (código, o el número en los autonuméricos) */
export const idDe = (def: DefCatalogo, r: any): string => txt(r?.[def.llave]);

export function registroVacio(def: DefCatalogo): Record<string, any> {
  const r: Record<string, any> = {};
  for (const c of def.campos) r[c.nombre] = c.tipo === 'entero' || c.tipo === 'decimal' ? null : '';
  if (def.estado) r[def.estado] = true;
  return r;
}

/** Código como lo guarda el API: MAYÚSCULAS, números y _ */
export const codigoLimpio = (v: any): string => txt(v).toUpperCase().replace(/[^A-Z0-9_]/g, '_');

/** Solo las columnas del catálogo, limpias (trim, mayúsculas, números; '' → null) */
export function camposDe(def: DefCatalogo, r: any): Record<string, any> {
  const p: Record<string, any> = {};
  for (const c of def.campos) {
    const v = r?.[c.nombre];
    if (c.tipo === 'codigo') p[c.nombre] = codigoLimpio(v);
    else if (c.tipo === 'entero' || c.tipo === 'decimal') p[c.nombre] = txt(v) === '' ? null : Number(String(v).replace(',', '.'));
    else {
      const s = c.mayusculas ? txt(v).toUpperCase() : txt(v);
      p[c.nombre] = s === '' ? null : s;
    }
  }
  if (def.estado) p[def.estado] = r?.[def.estado] === undefined || r?.[def.estado] === null || r?.[def.estado] === '' ? true : bool(r[def.estado]);
  return p;
}

/** Etiquetas (llaves de texto) de los obligatorios que faltan o no son número */
export function faltantes(def: DefCatalogo, p: Record<string, any>, nuevo = true): string[] {
  return def.campos
    .filter((c) => c.requerido && !(c.tipo === 'codigo' && !nuevo))
    .filter((c) => {
      const v = p[c.nombre];
      if (c.tipo === 'entero' || c.tipo === 'decimal') return v === null || v === undefined || !Number.isFinite(v);
      return !v;
    })
    .map((c) => c.etiqueta);
}

/** Las filas de la respuesta de la lista (cada API la envuelve distinto: respuesta.msg, tipos, estados…) */
export function filasDe(r: any): any[] {
  if (Array.isArray(r)) return r;
  if (!r || typeof r !== 'object') return [];
  for (const k of ['registros', 'respuesta', 'data', 'msg']) if (k in r) { const f = filasDe(r[k]); if (f.length || Array.isArray(r[k])) return f; }
  for (const v of Object.values(r)) if (Array.isArray(v)) return v;
  return [];
}

/** Filtro de la lista: estado (todos | activos | inactivos) y texto que contiene, sin mayúsculas ni tildes */
export function filtrar(def: DefCatalogo, lista: any[], f: { estado: string; texto: string }): any[] {
  const plano = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const t = plano(txt(f.texto));
  return lista
    .filter((x) => f.estado === 'todos' || !def.estado || (f.estado === 'activos') === activo(def, x))
    .filter((x) => !t || plano(def.campos.map((c) => txt(x[c.nombre])).join(' ')).includes(t));
}
