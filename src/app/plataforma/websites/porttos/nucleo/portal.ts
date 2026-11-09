/*
    Author: German Valencia
    Pattern: PORTTOS Núcleo (puro, AD-16) - Portal público porttos.co (OT-010, 2026-10-30)
    Description: Lógica sin Angular, sin red y sin navegador, probada en _pruebas/portal-web.test.js:
      destinoInicio(host, dominios, ses.)  a dónde va la raíz de la web: portal (dominios de Porttos, sin sesión) o login
      componenteDeSeccion(tipo)            qué componente pinta cada tipo de sección de /api/portal
      enlaceDe(url, base)                  enlace del contenido: interno (routerLink bajo /websites/porttos) o externo (href)
      formatoPrecio(valor, moneda)         precio en pesos colombianos sin decimales ("$ 3.500.000"); sin valor → null
      precioDePlan(plan, periodo)          lo que muestra la tarjeta de un plan en el periodo elegido
      metaDePagina(pagina, sufijo)         título y descripción para buscadores, sacados del hero de la página
      revisarFormulario(m)                 errores de Contáctenos antes de enviar (mismas reglas que el Joi del API)
      mensajeDeError(error)                texto honesto para la página cuando el API no responde
      Para quién, sector público y puertos en vivo (OT-011):
      planesActivos(config) · menuDe(menu, config) · motivosDe(config)
                                           planes de comercialización apagados por ahora (usuario, 2026-11-01, CC-106): sin
                                           planesActivos = '1' no hay página Planes, ni su entrada del menú, ni «con un plan»
      accionDePerfil(e, planes)            enlace de la tarjeta de un perfil: su plan recomendado o la propuesta que le toca
      puntosDe(texto)                      «a · b · c» → ['a', 'b', 'c'] (la ruta del Gobierno guarda así sus puntos)
      esNumeroDePaso(valor)                el valor de un paso es su número («01») o una fecha («Ene a mar 2027»)
      formatoToneladas(n) · nombreMes(m)   «1.859.649 t» · «agosto»
      textoVariacion(v)                    «+12,4 % frente a agosto de 2025» (o null)
      horaLectura(iso)                     hora de Colombia de una lectura («30 oct, 2:30 p. m.»)
      barrasTrafico(serie)                 alto (0–100 %) de cada mes de los últimos 12; sin dato, null
      App móvil (CC-103):
      sistemaMovil(ua, toques)             'android' | 'ios' | null (escritorio); el iPad que se presenta como Mac cuenta como ios
      urlTienda(url)                       solo https; lo demás (vacío, http, javascript:) → null: la tienda sale «Próximamente»
      tiendasDe(config, sistema)           Google Play y App Store con su enlace (o null), la del equipo primero
      accionMovil(config, sistema)         botón del encabezado en el teléfono o la tableta: la tienda del equipo o la página «App móvil»
    Nada de contenido aquí: los textos del portal salen de la base (TCL_Portal*). Solo hay etiquetas de la interfaz.
*/

export type TipoSeccion = 'hero' | 'cifras' | 'tarjetas' | 'tableros' | 'destacado' | 'cta' | 'pasos' | 'lista' | 'texto'
  | 'perfiles' | 'metas' | 'niveles' | 'app';
export type Periodo = 'mensual' | 'anual';

export interface ElementoPortal {
  titulo: string | null; texto: string | null; detalle?: string | null; icono: string | null; color: string | null;
  valor: string | null; url: string | null;
}
export interface SeccionPortal {
  codigo: string; tipo: string; antetitulo: string | null; titulo: string | null; subtitulo: string | null; cuerpo: string | null;
  imagen: string | null; enlace: { texto: string; url: string } | null; elementos: ElementoPortal[];
}
export interface PaginaPortal { pagina: string; secciones: SeccionPortal[] }
export interface ConfigPortal {
  correoContacto?: string | null; rutaIngreso?: string | null; avisoPrecios?: string | null;
  tiempoRespuesta?: string | null; textoPie?: string | null;
  /** Enlaces de las tiendas (CC-103). Vacíos mientras la app no esté publicada: el portal dice «Próximamente». */
  urlAndroid?: string | null; urlIos?: string | null;
  /** '1' muestra los planes de comercialización (CC-106); sin la clave o con otro valor, ocultos. */
  planesActivos?: string | null;
}
export interface PlanPortal {
  codigo: string; nombre: string; descripcion: string | null; precioMensual: number | null; precioAnual: number | null;
  moneda: string; etiquetaPrecio: string | null; destacado: boolean; simulado: boolean; caracteristicas: string[];
}
export interface PlanesPortal {
  simulado: boolean; aviso: string | null; planes: PlanPortal[];
  comparativo: { columnas: string[]; filas: { concepto: string; valores: Record<string, string> }[] };
}
export interface PreguntaPortal { pregunta: string; respuesta: string }
export interface MensajePortal {
  motivo: string; codigoPlan?: string | null; nombre: string; empresa?: string | null; correo: string; telefono?: string | null;
  puerto?: string | null; mensaje: string; aceptaDatos: boolean; sitioWeb: string;
}

/** Tipos de sección que el portal sabe pintar; uno desconocido no se pinta (no rompe la página). */
export const TIPOS_SECCION: readonly TipoSeccion[] = Object.freeze(
  ['hero', 'cifras', 'tarjetas', 'tableros', 'destacado', 'cta', 'pasos', 'lista', 'texto', 'perfiles', 'metas', 'niveles', 'app'] as TipoSeccion[]);

/** Motivos de Contáctenos: mismas claves que MOTIVOS del API (utils/portal/portal.js). No hay registro abierto. */
export const MOTIVOS: readonly { clave: string; etiqueta: string }[] = Object.freeze([
  { clave: 'DEMOSTRACION', etiqueta: 'WEB.PORTAL.SOLICITAR_UNA_DEMOSTRACION' },
  { clave: 'ACCESO', etiqueta: 'WEB.PORTAL.SOLICITAR_ACCESO_CON_UN_PLAN' },
  { clave: 'INFORMACION', etiqueta: 'WEB.PORTAL.INFORMACION_GENERAL' },
  { clave: 'SOPORTE', etiqueta: 'WEB.PORTAL.SOPORTE_A_UN_USUARIO_EXISTENTE' },
]);

/**
 * Inicio por dominio (la plataforma es compartida, AD-01): solo quien llega por un dominio de Porttos y sin sesión activa
 * cae en el portal; los demás dominios, y quien ya tiene sesión, siguen yendo al login como siempre.
 * `dominios` viene de los environment (nada fijo en el código); se comparan sin mayúsculas, sin puerto y sin punto final.
 */
export function destinoInicio(host: string | null | undefined, dominios: readonly string[] | null | undefined, conSesion: boolean): 'portal' | 'login' {
  if (conSesion) return 'login';
  const limpio = (h: unknown) => String(h || '').trim().toLowerCase().replace(/:\d+$/, '').replace(/\.$/, '');
  const h = limpio(host);
  return h && (dominios || []).some((d) => limpio(d) === h) ? 'portal' : 'login';
}

/**
 * Rutas que se ven sin sesión: el portal y los demás sitios públicos (/websites/…) y la raíz (ahí decide destinoInicio).
 * El AppComponent de la plataforma no manda al login desde estas rutas.
 */
export function esRutaPublica(ruta: string | null | undefined): boolean {
  const r = String(ruta || '/').split(/[?#]/)[0].replace(/\/+$/, '') || '/';
  return r === '/' || r === '/websites' || r.startsWith('/websites/');
}

export function componenteDeSeccion(tipo: string | null | undefined): TipoSeccion | null {
  const t = String(tipo || '').trim().toLowerCase() as TipoSeccion;
  return TIPOS_SECCION.includes(t) ? t : null;
}

/** Ruta de la web donde vive el portal (websites-routing → porttos). Los enlaces del contenido son relativos a ella. */
export const RUTA_PORTAL = '/websites/porttos';

/**
 * Interno: empieza por una sola "/" y se le antepone la base (por defecto la del portal: «/planes» → «/websites/porttos/planes»;
 * con base '' queda tal cual, para rutas de la plataforma como el login). Externo: http(s), mailto o tel. Lo demás no se enlaza.
 */
export function enlaceDe(url: string | null | undefined, base: string = RUTA_PORTAL):
  { tipo: 'interno'; ruta: string; query: Record<string, string> } | { tipo: 'externo'; href: string } | null {
  const u = String(url || '').trim();
  if (!u) return null;
  if (u.startsWith('/') && !u.startsWith('//')) {
    const [ruta, q = ''] = u.split('?');
    const query: Record<string, string> = {};
    for (const par of q.split('&').filter(Boolean)) {
      const [k, v = ''] = par.split('=');
      query[decodeURIComponent(k)] = decodeURIComponent(v);
    }
    const r = ruta === '/' ? '' : ruta;
    return { tipo: 'interno', ruta: `${base}${r}` || '/', query };
  }
  if (/^(https?:\/\/|mailto:|tel:)/i.test(u)) return { tipo: 'externo', href: u };
  return null;
}

export function formatoPrecio(valor: number | null | undefined, moneda = 'COP'): string | null {
  if (valor === null || valor === undefined || !Number.isFinite(Number(valor))) return null;
  const n = Math.round(Number(valor));
  const miles = String(Math.abs(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const signo = n < 0 ? '-' : '';
  return moneda === 'COP' ? `${signo}$ ${miles}` : `${signo}${miles} ${moneda}`;
}

/** Precio del plan en el periodo; sin precio, la etiqueta del plan («A la medida») o «—». Nunca un valor inventado. */
export function precioDePlan(plan: PlanPortal, periodo: Periodo): { principal: string; sufijo: string | null; nota: string | null } {
  const valor = periodo === 'anual' ? plan.precioAnual : plan.precioMensual;
  const p = formatoPrecio(valor, plan.moneda);
  if (!p) return { principal: plan.etiquetaPrecio || '—', sufijo: null, nota: null };
  let nota: string | null = null;
  if (periodo === 'anual' && plan.precioMensual && plan.precioAnual) {
    const ahorro = Math.round((1 - plan.precioAnual / (plan.precioMensual * 12)) * 100);
    if (ahorro > 0) nota = `Ahorro de ${ahorro} % frente al pago mensual`;
  }
  return { principal: p, sufijo: periodo === 'anual' ? '/año' : '/mes', nota };
}

/** Título y descripción de la página para buscadores, del hero que viene de la base. */
export function metaDePagina(pagina: PaginaPortal | null, sufijo = 'Porttos'): { titulo: string; descripcion: string | null } {
  const hero = pagina?.secciones.find((s) => s.tipo === 'hero') || pagina?.secciones[0];
  const nombre = pagina?.pagina === 'inicio' ? null : (hero?.antetitulo || null);
  const base = nombre || hero?.titulo || null;
  const titulo = base ? `${base} · ${sufijo}` : sufijo;
  const texto = (hero?.subtitulo || hero?.titulo || '').replace(/\s+/g, ' ').trim();
  const descripcion = texto ? (texto.length > 160 ? `${texto.slice(0, 157).replace(/\s+\S*$/, '')}…` : texto) : null;
  return { titulo, descripcion };
}

const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TELEFONO = /^[0-9+()\s.-]*$/;

/** Mismas reglas que MensajeBodySchema del API, para avisar antes de enviar. Devuelve { campo: mensaje }. */
export function revisarFormulario(m: Partial<MensajePortal>): Record<string, string> {
  const e: Record<string, string> = {};
  const t = (v: unknown) => String(v ?? '').trim();
  if (!MOTIVOS.some((x) => x.clave === t(m.motivo))) e['motivo'] = 'Escoja el motivo del mensaje.';
  if (t(m.nombre).length < 2) e['nombre'] = 'Escriba su nombre.';
  else if (t(m.nombre).length > 120) e['nombre'] = 'El nombre es muy largo.';
  if (!CORREO.test(t(m.correo)) || t(m.correo).length > 160) e['correo'] = 'Escriba un correo válido.';
  if (!TELEFONO.test(t(m.telefono)) || t(m.telefono).length > 40) e['telefono'] = 'El teléfono solo lleva números, espacios, +, ( ) y guiones.';
  if (t(m.empresa).length > 160) e['empresa'] = 'El nombre de la empresa es muy largo.';
  if (t(m.puerto).length > 60) e['puerto'] = 'El puerto es muy largo.';
  if (t(m.mensaje).length < 10) e['mensaje'] = 'Cuéntenos un poco más (mínimo 10 caracteres).';
  else if (t(m.mensaje).length > 4000) e['mensaje'] = 'El mensaje supera los 4.000 caracteres.';
  if (m.aceptaDatos !== true) e['aceptaDatos'] = 'Debe aceptar el tratamiento de sus datos para que podamos responderle.';
  return e;
}

/** Texto para la página cuando el API falla: honesto, sin inventar contenido de reemplazo. */
export function mensajeDeError(error: { status?: number; error?: { msg?: string; codigo?: string } } | null | undefined): string {
  const s = Number(error?.status ?? 0);
  if (error?.error?.codigo === 'MIGRACION_PENDIENTE') return 'El contenido del portal aún no está disponible. Intente más tarde.';
  if (s === 429 && error?.error?.msg) return error.error.msg;
  if (s === 400) return 'Revise los datos del formulario.';
  if (error && s === 0) return 'No pudimos conectarnos con Porttos. Revise su conexión e intente de nuevo.';
  return 'No pudimos cargar esta información en este momento. Intente de nuevo en unos minutos.';
}

// ── Para quién, sector público y puertos en vivo (OT-011) ─────────────────────────────────────────────────────────

/** Respuesta de GET /api/portal/puertos-en-vivo/:puerto (solo fuentes públicas; nunca simulados). */
export interface PuertoListado { id: string; nombre: string }
export interface MesTrafico { anio: number; mes: number; toneladas: number | null; parcial: boolean }
export interface PuertoEnVivo {
  puerto: PuertoListado;
  generado: string;
  vias: { fuente: string; lectura: string | null; sinDato: boolean; estado: string | null; semaforo: string | null; eventos: number;
    corredores: { corredor: string; estado: string; semaforo: string; eventos: number }[] };
  trafico: { fuente: string; lectura: string | null; unidad: string; sinDato: boolean; variacion: number | null;
    ultimoMes: { anio: number; mes: number; toneladas: number } | null; serie: MesTrafico[]; mesParcial: { anio: number; mes: number } | null };
  clima: { fuente: string; sinDato: boolean; lectura: string | null; temperatura: number | null; vientoNudos: number | null; tiempo: string | null };
  marea: { fuente: string; sinDato: boolean; lectura: string | null; pleamar: string | null; nivel: string | null };
}

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

/** Planes visibles solo con planesActivos = '1' (o true/si), igual que el API (utils/portal/portal.js). Sin config: ocultos. */
export function planesActivos(config: ConfigPortal | null | undefined): boolean {
  const v = String(config?.planesActivos ?? '').trim().toLowerCase();
  return v === '1' || v === 'true' || v === 'si' || v === 'sí';
}

/** Menú del portal sin la entrada de Planes mientras estén apagados. */
export function menuDe<T extends { ruta: string }>(menu: readonly T[], config: ConfigPortal | null | undefined): readonly T[] {
  return planesActivos(config) ? menu : menu.filter((i) => !/\/planes$/.test(i.ruta));
}

/** Motivos de Contáctenos: con los planes apagados, «Solicitar acceso» a secas (misma clave ACCESO). */
export function motivosDe(config: ConfigPortal | null | undefined): readonly { clave: string; etiqueta: string }[] {
  return planesActivos(config) ? MOTIVOS : MOTIVOS.map((m) => (m.clave === 'ACCESO' ? { ...m, etiqueta: 'WEB.ENCABEZADO.SOLICITAR_ACCESO' } : m));
}

/** Tarjeta de un perfil: si su valor es el código de un plan → «Plan recomendado: <plan>»; si no, la propuesta (p. ej. el sector público). */
export function accionDePerfil(e: ElementoPortal, planes: readonly PlanPortal[] = []): { texto: string; url: string } | null {
  const plan = planes.find((p) => p.codigo === String(e.valor || '').trim().toUpperCase());
  if (plan) return { texto: `Plan recomendado: ${plan.nombre}`, url: e.url || '/planes' };
  if (!e.url) return null;
  return { texto: e.valor ? `Ver la propuesta para el ${e.valor.charAt(0).toLowerCase()}${e.valor.slice(1)}` : 'WEB.PORTAL.VER_MAS', url: e.url };
}

export function puntosDe(texto: string | null | undefined): string[] {
  return String(texto || '').split(/\s+·\s+/).map((t) => t.trim()).filter(Boolean);
}

export function esNumeroDePaso(valor: string | null | undefined): boolean {
  return /^\d{1,3}$/.test(String(valor || '').trim());
}

export function formatoToneladas(n: number | null | undefined): string | null {
  if (n === null || n === undefined || !Number.isFinite(Number(n))) return null;
  return `${String(Math.round(Number(n))).replace(/\B(?=(\d{3})+(?!\d))/g, '.')} t`;
}

export function nombreMes(mes: number | null | undefined): string {
  return MESES[Number(mes) - 1] || '';
}

export function textoVariacion(variacion: number | null | undefined, ultimoMes: { anio: number; mes: number } | null | undefined): string | null {
  if (variacion === null || variacion === undefined || !ultimoMes || !Number.isFinite(Number(variacion))) return null;
  const v = Number(variacion);
  const signo = v > 0 ? '+' : v < 0 ? '−' : '';
  return `${signo}${Math.abs(v).toFixed(1).replace('.', ',')} % frente a ${nombreMes(ultimoMes.mes)} de ${ultimoMes.anio - 1}`;
}

/** Hora de Colombia (UTC−5, sin horario de verano) de una lectura: «30 oct, 2:30 p. m.». Sin fecha válida → null. */
export function horaLectura(iso: string | null | undefined): string | null {
  const t = Date.parse(String(iso || ''));
  if (!Number.isFinite(t)) return null;
  const d = new Date(t - 5 * 3600 * 1000);
  const h = d.getUTCHours();
  const min = String(d.getUTCMinutes()).padStart(2, '0');
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${d.getUTCDate()} ${MESES[d.getUTCMonth()].slice(0, 3)}, ${h12}:${min} ${h < 12 ? 'a. m.' : 'p. m.'}`;
}

/** Alto de cada barra frente al mes mayor del año (0–100). Un mes sin reporte no tiene barra (null), nunca cero. */
export function barrasTrafico(serie: readonly MesTrafico[] = []): { anio: number; mes: number; etiqueta: string; alto: number | null; toneladas: number | null; parcial: boolean }[] {
  const max = Math.max(0, ...serie.map((m) => m.toneladas ?? 0));
  return serie.map((m) => ({
    anio: m.anio,
    mes: m.mes,
    etiqueta: nombreMes(m.mes).slice(0, 3),
    alto: m.toneladas === null || !max ? null : Math.max(2, Math.round((m.toneladas / max) * 100)),
    toneladas: m.toneladas,
    parcial: !!m.parcial,
  }));
}

// ── App móvil (CC-103) ────────────────────────────────────────────────────────────────────────────────────────────
// En un teléfono o una tableta el portal se ve completo, pero sin «Iniciar sesión»: la plataforma se usa desde la app
// (decisión del usuario, 2026-10-31). El escritorio sigue igual.

export type SistemaMovil = 'android' | 'ios';

/** Página «App móvil» (CC-105): a donde lleva el botón del encabezado cuando la tienda del equipo aún no tiene enlace. */
export const SECCION_APP = { ruta: `${RUTA_PORTAL}/app`, ancla: 'app' } as const;

/**
 * Sistema del equipo según el navegador. Teléfonos y tabletas Android dicen «Android»; iPhone, iPad y iPod, su nombre.
 * Desde iPadOS 13 el iPad se presenta como «Macintosh»: se distingue de un Mac porque tiene pantalla táctil (toques > 1).
 */
export function sistemaMovil(ua: string | null | undefined, toquesMax = 0): SistemaMovil | null {
  const u = String(ua || '');
  if (/android/i.test(u)) return 'android';
  if (/iphone|ipad|ipod/i.test(u)) return 'ios';
  if (/macintosh/i.test(u) && Number(toquesMax) > 1) return 'ios';
  return null;
}

/** Enlace de tienda utilizable: solo https. Sin enlace la tienda se muestra como «Próximamente» (nada inventado). */
export function urlTienda(url: string | null | undefined): string | null {
  const u = String(url || '').trim();
  return /^https:\/\/[^\s]+$/i.test(u) ? u : null;
}

export interface TiendaApp { sistema: SistemaMovil; nombre: string; url: string | null; propia: boolean }

/** Las dos tiendas con su enlace; la del equipo del visitante va primero (en escritorio, Google Play y luego App Store). */
export function tiendasDe(config: ConfigPortal | null | undefined, sistema: SistemaMovil | null): TiendaApp[] {
  const lista: TiendaApp[] = [
    { sistema: 'android', nombre: 'Google Play', url: urlTienda(config?.urlAndroid), propia: sistema === 'android' },
    { sistema: 'ios', nombre: 'App Store', url: urlTienda(config?.urlIos), propia: sistema === 'ios' },
  ];
  return sistema === 'ios' ? [lista[1], lista[0]] : lista;
}

/**
 * Botón del encabezado en el teléfono o la tableta (reemplaza «Iniciar sesión»): con enlace a la tienda del equipo,
 * «Descargar la app» a la tienda; sin enlace, «App móvil» a la página de la app. En escritorio no hay botón (null).
 */
export function accionMovil(config: ConfigPortal | null | undefined, sistema: SistemaMovil | null):
  { texto: string; tienda: string | null } | null {
  if (!sistema) return null;
  const propia = tiendasDe(config, sistema).find((t) => t.propia);
  return propia?.url ? { texto: 'WEB.PORTAL.DESCARGAR_LA_APP', tienda: propia.url } : { texto: 'WEB.PIE.APP_MOVIL', tienda: null };
}
