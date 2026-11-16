/*
    Author: German Valencia
    Pattern: PLATAFORMA Núcleo - Sitios: catálogo de websites de las aplicaciones (OT-036 fase 2, CC-207). Sin Angular: lo prueba node.
    Las mismas reglas que utils/plataforma/sitios.js del API. El contenido de cada sitio lo administra su aplicación en rutaAdministracion.
*/
export interface Sitio {
  sitioId?: number;
  codigoSitio: string;
  codigoAplicacion: string;
  nombreAplicacion?: string | null;
  nombreSitio: string;
  descripcionSitio: string;
  urlSitio: string;
  puertoSitio: number | null;
  estadoSitio: boolean;
  rutaAdministracion: string | null;
}

const txt = (v: any): string => (v === undefined || v === null ? '' : String(v).trim());
const bool = (v: any): boolean => v === true || v === 1 || v === '1' || v === 'true';

export const sitioVacio = (): Sitio => ({
  codigoSitio: '', codigoAplicacion: '', nombreSitio: '', descripcionSitio: '', urlSitio: 'https://', puertoSitio: null, estadoSitio: true, rutaAdministracion: null
});

/** Solo las columnas del sitio, limpias; el puerto por defecto sale del protocolo */
export function camposDeSitio(s: any): Sitio {
  const url = txt(s?.urlSitio).replace(/\/+$/, '');
  return {
    codigoSitio: txt(s?.codigoSitio).toUpperCase().replace(/[^A-Z0-9_]/g, '_'),
    codigoAplicacion: txt(s?.codigoAplicacion),
    nombreSitio: txt(s?.nombreSitio),
    descripcionSitio: txt(s?.descripcionSitio),
    urlSitio: url,
    puertoSitio: txt(s?.puertoSitio) === '' ? (url.startsWith('https://') ? 443 : 80) : Number(s.puertoSitio),
    estadoSitio: s?.estadoSitio === undefined || s?.estadoSitio === null ? true : bool(s.estadoSitio),
    rutaAdministracion: txt(s?.rutaAdministracion) === '' ? null : txt(s.rutaAdministracion)
  };
}

/** Llaves de texto de los obligatorios que faltan */
export function faltantesSitio(s: Sitio, nuevo = true): string[] {
  const f: string[] = [];
  if (nuevo && !s.codigoSitio) f.push('COMMON.CODE');
  if (!s.codigoAplicacion) f.push('COMMON.APPLICATION');
  if (!s.nombreSitio) f.push('COMMON.NAME');
  if (!/^https?:\/\/[^\s/]+/.test(s.urlSitio)) f.push('SITES.URL');
  return f;
}

/** Filtro de la lista: aplicación, estado (todos | activos | inactivos) y texto que contiene, sin mayúsculas ni tildes */
export function filtrarSitios(lista: Sitio[], f: { aplicacion: string; estado: string; texto: string }): Sitio[] {
  const plano = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const t = plano(txt(f.texto));
  return lista
    .filter((x) => !f.aplicacion || x.codigoAplicacion === f.aplicacion)
    .filter((x) => f.estado === 'todos' || (f.estado === 'activos') === bool(x.estadoSitio))
    .filter((x) => !t || plano(`${x.nombreSitio} ${x.urlSitio} ${x.descripcionSitio || ''} ${x.nombreAplicacion || ''}`).includes(t));
}

/** Acciones de la fila: ver el sitio (si está activo) y administrar su contenido (si la aplicación declaró dónde) */
export function accionesDeSitio(s: Sitio): { accion: 'VER' | 'ADMINISTRAR'; letra: string; color: string; tooltip: string }[] {
  const a: { accion: 'VER' | 'ADMINISTRAR'; letra: string; color: string; tooltip: string }[] = [];
  if (bool(s.estadoSitio) && /^https?:\/\//.test(s.urlSitio)) a.push({ accion: 'VER', letra: 'V', color: '#2563eb', tooltip: 'SITES.VIEW_SITE' });
  if (s.rutaAdministracion && /^\/[A-Za-z0-9/_-]*$/.test(s.rutaAdministracion)) {
    a.push({ accion: 'ADMINISTRAR', letra: 'A', color: '#16a34a', tooltip: 'SITES.MANAGE_CONTENT' });
  }
  return a;
}
