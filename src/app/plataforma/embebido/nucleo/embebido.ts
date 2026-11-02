/*
    Author: German Valencia
    Pattern: PLATAFORMA Núcleo puro - Modo embebido (OT-014 fase 1, CC-109; regla 17: la tableta = la web)
    Description: La app Porttos (tableta) carga la web en un marco en /embebido. Contrato de mensajes (postMessage), sin Angular:
      web → app  { fuente: 'porttos-web', v: 1, tipo: 'listo' }                         la web espera la sesión
                 { ..., tipo: 'estado', puerto, pestana }                                  puerto y pestaña en pantalla
                 { ..., tipo: 'cerrar-sesion', motivo: usuario|expirada|reemplazada|sin-acceso }  la app hace su cierre
                 { ..., tipo: 'error', mensaje }                                           no se pudo entrar
      app → web  { fuente: 'porttos-app', v: 1, tipo: 'sesion', token, codigoSesion, codigoAplicacion?, codigoSuite?, puerto?, pestana? }
                 (codigoSuite: la suite a abrir, p. ej. la del tablero; sin ella, la del dominio o la primera con ruta de inicio)
    La sesión es la misma de la app (sesión única): nunca va en la URL y la web no registra otra.
    Solo se aceptan mensajes del marco padre con un origen de la app (https://localhost Android, capacitor://localhost iOS);
    fuera de producción también http://localhost y http://127.0.0.1 (banco de pruebas).
*/

export const RUTA_EMBEBIDA = '/embebido';
export const FUENTE_APP = 'porttos-app';
export const FUENTE_WEB = 'porttos-web';
export const VERSION_MENSAJES = 1;
export const ORIGENES_APP: readonly string[] = ['https://localhost', 'capacitor://localhost'];

export type TipoMensajeWeb = 'listo' | 'estado' | 'cerrar-sesion' | 'error';
export type MotivoCierreEmbebido = 'usuario' | 'expirada' | 'reemplazada' | 'sin-acceso';

export interface SesionEntregada {
  token: string;
  codigoSesion: string;
  codigoAplicacion: string | null;
  codigoSuite: string | null;
  puerto: string | null;
  pestana: string | null;
}

export function origenAppPermitido(origen: unknown, produccion: boolean): boolean {
  const o = String(origen ?? '').trim().toLowerCase();
  if (ORIGENES_APP.includes(o)) return true;
  return !produccion && /^http:\/\/(localhost|127\.0\.0\.1)(:\d{1,5})?$/.test(o);
}

/** La ruta de entrada del marco: /embebido (con o sin consulta). */
export function esRutaEmbebida(ruta: unknown): boolean {
  const r = String(ruta ?? '').split(/[?#]/)[0].replace(/\/+$/, '');
  return r === RUTA_EMBEBIDA;
}

/** A qué orígenes avisar: el del padre si es de la app; si no se conoce, a los de la app (postMessage descarta los demás). */
export function origenesDestino(ancestro: unknown, produccion: boolean): string[] {
  const a = String(ancestro ?? '').trim();
  return a && origenAppPermitido(a, produccion) ? [a] : [...ORIGENES_APP];
}

const texto = (v: unknown, max: number, patron: RegExp): string | null => {
  const t = typeof v === 'string' ? v.trim() : '';
  return t && t.length <= max && patron.test(t) ? t : null;
};
const JWT = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]*$/;
const CODIGO = /^[A-Za-z0-9_-]+$/;
const NOMBRE = /^[\p{L}\p{N} ._-]+$/u;

/** El mensaje 'sesion' de la app, validado; cualquier otra cosa → null. */
export function leerSesionEntregada(data: unknown): SesionEntregada | null {
  if (!data || typeof data !== 'object') return null;
  const m = data as Record<string, unknown>;
  if (m['fuente'] !== FUENTE_APP || m['tipo'] !== 'sesion' || Number(m['v']) !== VERSION_MENSAJES) return null;
  const token = texto(m['token'], 4096, JWT);
  const codigoSesion = texto(m['codigoSesion'], 64, CODIGO);
  if (!token || !codigoSesion) return null;
  return {
    token,
    codigoSesion,
    codigoAplicacion: texto(m['codigoAplicacion'], 64, CODIGO),
    codigoSuite: texto(m['codigoSuite'], 64, CODIGO),
    puerto: texto(m['puerto'], 80, NOMBRE),
    pestana: texto(m['pestana'], 80, CODIGO),
  };
}

export function mensajeParaApp(tipo: TipoMensajeWeb, datos: Record<string, unknown> = {}): Record<string, unknown> {
  return { ...datos, fuente: FUENTE_WEB, v: VERSION_MENSAJES, tipo };
}

/** Sesión provisional para que el interceptor mande x-token y x-sesion-id mientras se renueva y se arma el usuario. */
export function sesionProvisional(s: SesionEntregada): Record<string, unknown> {
  return { ok: true, token: s.token, codigoSesion: s.codigoSesion, usuario: { codigoSesion: s.codigoSesion } };
}

/** currentUser con la forma del login (token, usuario con su codigoSesion), a partir de GET /api/auth/renew. */
export function currentUserEmbebido(renovado: unknown, s: SesionEntregada): Record<string, any> | null {
  const r = (renovado && typeof renovado === 'object' ? renovado : {}) as Record<string, any>;
  const usuario = r['usuario'] && typeof r['usuario'] === 'object' ? r['usuario'] : null;
  if (!usuario?.codigoUsuario) return null;
  const token = typeof r['token'] === 'string' && JWT.test(r['token']) ? r['token'] : s.token;
  return { ok: true, token, codigoSesion: s.codigoSesion, usuario: { ...usuario, codigoSesion: s.codigoSesion } };
}

/* eslint-disable @typescript-eslint/no-explicit-any */
/** Primer suscriptor del usuario con la aplicación en un paquete activo (como la ofrece la entrada a aplicaciones); si no, null. */
export function suscriptorConAplicacion(usuariosSC: any[], codigoAplicacion: string): any | null {
  for (const usuSC of usuariosSC || []) {
    for (const susc of usuSC?.suscriptores || []) {
      const tiene = (susc?.paquetesActivos || []).some((paq: any) =>
        (paq?.modulosPaquete || []).some((mod: any) => mod?.codigoAplicacion == codigoAplicacion));
      if (tiene) return susc;
    }
  }
  return null;
}

/** Suite activa de la aplicación con ruta de inicio: la pedida (por la app o el dominio) si es de la aplicación; si no, la primera. */
export function suiteEmbebida(suites: any[], codigoAplicacion: string, codigoSuite?: string | null): any | null {
  const deLaApp = (suites || []).filter((s: any) => s?.codigoAplicacion == codigoAplicacion && s?.rutaInicio && s?.estadoSuite !== false);
  return deLaApp.find((s: any) => codigoSuite && s.codigoSuite == codigoSuite) || deLaApp[0] || null;
}

/** La aplicación a abrir: la que pide la app; si no, la del dominio. */
export function aplicacionEmbebida(s: SesionEntregada, codigoDelDominio: string | null | undefined): string | null {
  return s.codigoAplicacion || (codigoDelDominio ? String(codigoDelDominio) : null);
}
