/*
    Author: German Valencia
    Pattern: PLATAFORMA Núcleo (puro, AD-16) - Multidominio (OT-012, migración 026)
    Description: Lógica sin Angular, sin red y sin navegador, probada en _pruebas/dominios-web.test.js. Un despliegue de la web
      para todos los dominios; el contexto lo da GET /api/dominios/contexto (tabla PTLDominiosAP):
      hostEfectivo(host, query, prod, guardado)  el dominio a usar; en desarrollo se simula con ?dominio=<dominio> (nunca en producción)
      contextoNeutro(host)                       como hoy: sin marca, sin restricciones
      contextoDeRespaldo(host, dominiosPortal)   si el API no responde: los dominios del portal (environment, OT-010) siguen
                                                 abriendo el portal; nada más se restringe (no se adivina)
      normalizarContexto(data, host)             lo que llega del API, limpio; si no sirve → neutro
      destinoRaiz(ctx, conSesion)                raíz: portal del dominio (sin sesión) o login
      rutasDeAplicacion(app, suite, ctx)         primeros segmentos de las rutas del menú de la aplicación elegida
      rutaPermitida(ctx, url, appElegida, rutas) 'ok' | 'elegir' (falta elegir la app del dominio) | 'fuera' (ruta de otra app o de la consola)
      aplicacionesDelDominio(ctx, apps)          en un dominio de aplicación, solo la suya; en los demás, todas
      suiteDelDominio(ctx, suites)               la suite a la que se entra directo (la del dominio, o la única), o null
      loginDeDominio(ctx)                        cómo se ve el login (CC-104): con el diseño del portal en un dominio de aplicación
                                                 con portal (porttos.co); en la consola y los dominios neutros, el de siempre
*/
export type TipoDominio = 'consola' | 'aplicacion' | 'neutro';

export interface ContextoDominio {
  tipo: TipoDominio;
  dominio: string | null;
  codigoAplicacion: string | null;
  codigoSuite: string | null;
  rutaPortal: string | null;
  rutaInicio: string | null;
  marca: { nombre: string | null; logo: string | null };
  /** true si salió de la tabla; false si es el respaldo local (el API no respondió) */
  verificado: boolean;
}

const RUTA_LOGIN = '/autenticacion/login';
/** Rutas que no son de ninguna aplicación: entrada, selección de app/suite, sitios públicos y mantenimiento. */
// 'embebido': entrada de la web dentro de la app (OT-014)
const RUTAS_COMUNES = ['', 'autenticacion', 'starter', 'websites', 'maintenance', 'embebido'];

export function limpiarHost(valor: unknown): string {
  const t = String(valor ?? '').trim().toLowerCase()
    .replace(/^[a-z][a-z0-9+.-]*:\/\//, '').split(/[/?#]/)[0].replace(/:\d+$/, '').replace(/\.$/, '');
  return /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*$/.test(t) ? t : '';
}

export function hostEfectivo(host: string, query: string, produccion: boolean, guardado?: string | null): string {
  if (produccion) return limpiarHost(host);
  const simulado = limpiarHost(new URLSearchParams(String(query || '').replace(/^\?/, '')).get('dominio'));
  return simulado || limpiarHost(guardado) || limpiarHost(host);
}

const texto = (v: unknown): string | null => (v === null || v === undefined || String(v).trim() === '' ? null : String(v).trim());

export function contextoNeutro(host?: string | null): ContextoDominio {
  return { tipo: 'neutro', dominio: limpiarHost(host) || null, codigoAplicacion: null, codigoSuite: null, rutaPortal: null,
    rutaInicio: null, marca: { nombre: null, logo: null }, verificado: false };
}

export function contextoDeRespaldo(host: string, dominiosPortal: readonly string[] | null | undefined, rutaPortal: string): ContextoDominio {
  const h = limpiarHost(host);
  const neutro = contextoNeutro(h);
  return h && (dominiosPortal || []).some((d) => limpiarHost(d) === h) ? { ...neutro, rutaPortal } : neutro;
}

export function normalizarContexto(data: any, host: string): ContextoDominio {
  const tipo = String(data?.tipo || '').toLowerCase();
  if (!['consola', 'aplicacion', 'neutro'].includes(tipo)) return contextoNeutro(host);
  if (tipo === 'aplicacion' && !texto(data?.codigoAplicacion)) return contextoNeutro(host);
  return {
    tipo: tipo as TipoDominio,
    dominio: limpiarHost(data?.dominio) || limpiarHost(host) || null,
    codigoAplicacion: tipo === 'aplicacion' ? texto(data.codigoAplicacion) : null,
    codigoSuite: texto(data?.codigoSuite),
    rutaPortal: texto(data?.rutaPortal),
    rutaInicio: texto(data?.rutaInicio),
    marca: { nombre: texto(data?.marca?.nombre), logo: texto(data?.marca?.logo) },
    verificado: true,
  };
}

export function destinoRaiz(ctx: ContextoDominio | null | undefined, conSesion: boolean): string {
  return !conSesion && ctx?.rutaPortal ? ctx.rutaPortal : RUTA_LOGIN;
}

const primerSegmento = (ruta: unknown): string =>
  String(ruta ?? '').split(/[?#]/)[0].replace(/^\/+/, '').split('/')[0].trim().toLowerCase();

export function rutasDeAplicacion(app: any, suite: any, ctx?: ContextoDominio | null): string[] {
  const rutas = new Set<string>();
  const sumar = (r: unknown) => { const s = primerSegmento(r); if (s) rutas.add(s); };
  for (const m of app?.modulos || []) {
    sumar(m?.modulo?.rutaModulo ?? m?.rutaModulo);
    for (const s of m?.submodulos || []) sumar(s?.rutaModulo);
  }
  sumar(suite?.rutaInicio);
  sumar(ctx?.rutaInicio);
  return [...rutas];
}

export function rutaPermitida(ctx: ContextoDominio | null | undefined, url: string, appElegida: string | null | undefined,
  rutas: readonly string[]): 'ok' | 'elegir' | 'fuera' {
  if (!ctx || ctx.tipo !== 'aplicacion') return 'ok';
  const seg = primerSegmento(url);
  if (RUTAS_COMUNES.includes(seg)) return 'ok';
  if (!appElegida || String(appElegida).toLowerCase() !== String(ctx.codigoAplicacion).toLowerCase()) return 'elegir';
  return rutas.includes(seg) ? 'ok' : 'fuera';
}

export function aplicacionesDelDominio<T extends { codigoAplicacion?: string | null }>(ctx: ContextoDominio | null | undefined, apps: T[]): T[] {
  if (!ctx || ctx.tipo !== 'aplicacion') return apps || [];
  const cod = String(ctx.codigoAplicacion).toLowerCase();
  return (apps || []).filter((a) => String(a?.codigoAplicacion || '').toLowerCase() === cod);
}

export function suiteDelDominio<T extends { codigoSuite?: string | null }>(ctx: ContextoDominio | null | undefined, suites: T[]): T | null {
  if (!ctx || ctx.tipo !== 'aplicacion') return null;
  const lista = (suites || []).filter((s) => !!s?.codigoSuite);
  if (ctx.codigoSuite) return lista.find((s) => String(s.codigoSuite).toLowerCase() === String(ctx.codigoSuite).toLowerCase()) || null;
  return lista.length === 1 ? lista[0] : null;
}

/**
 * Login por dominio (CC-104, decisión del usuario 2026-10-31: el diseño del portal solo en porttos.co). Un dominio de
 * aplicación con portal toma la pantalla dividida del portal: marca, logo, «Volver al portal» y «Solicitar acceso»
 * (Contáctenos del portal con motivo ACCESO). Consola y neutro: `portal: false`, el login de siempre.
 */
export interface LoginDominio {
  portal: boolean;
  marca: string | null;
  logo: string | null;
  rutaPortal: string | null;
  acceso: { ruta: string; query: Record<string, string> } | null;
}

export function loginDeDominio(ctx: ContextoDominio | null | undefined): LoginDominio {
  const marca = texto(ctx?.marca?.nombre);
  const rutaPortal = ctx?.rutaPortal && ctx.rutaPortal.startsWith('/') && !ctx.rutaPortal.startsWith('//')
    ? ctx.rutaPortal.replace(/\/+$/, '') || null : null;
  const portal = ctx?.tipo === 'aplicacion' && !!rutaPortal;
  const logo = texto(ctx?.marca?.logo);
  return {
    portal,
    marca,
    // Logo: un asset de la web o una dirección https; lo demás no se usa (se muestra el nombre de la marca)
    logo: logo && (/^assets\//.test(logo) || /^https:\/\//i.test(logo)) ? logo : null,
    rutaPortal: portal ? rutaPortal : null,
    acceso: portal ? { ruta: `${rutaPortal}/contacto`, query: { motivo: 'ACCESO' } } : null,
  };
}
