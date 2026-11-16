/*
    Author: German Valencia
    Pattern: PLATAFORMA Núcleo (puro) - Utilidades › Pestañas y Tipos de pestaña (CC-203; patrón de los módulos de administración)
    Sin Angular ni red; probado en _pruebas/admin-pestanas.test.js. Las mismas reglas que valida el API (utils/plataforma/pestanas.js).
*/
export const ESTRATEGIAS = ['CASCADA_DINAMICA', 'ESTATICO_ANALITICO', 'FLUJO_PROCESO', 'LIENZO_ESPACIAL'] as const;
/** Nombres neutros de ícono que ya dibujan las aplicaciones (la web con Font Awesome, la app con SVG). */
export const ICONOS_SUGERIDOS = ['barco', 'camion', 'bodega', 'contenedor', 'granel', 'suelta', 'gnl', 'capacidad', 'mapa', 'noticias'];

export interface PestanaAdmin {
    codigoPestana: string;
    codigoTipoPestana: string;
    codigoAplicacion: string;
    codigoSuite: string;
    nombrePestana: string;
    orden: number;
    descripcion: string | null;
    estado: boolean;
    icono: string | null;
    color: string | null;
}

export interface TipoPestana {
    codigoTipo: string;
    estrategia: string;
    descripcion: string | null;
    estado: boolean;
}

const CODIGO = /^[A-Z0-9_]{3,50}$/;
const COLOR = /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
const t = (v: unknown) => (v === null || v === undefined ? '' : String(v).trim());

export function pestanaNueva(): PestanaAdmin {
    return {
        codigoPestana: '', codigoTipoPestana: '', codigoAplicacion: '', codigoSuite: '', nombrePestana: '',
        orden: 0, descripcion: null, estado: true, icono: null, color: null
    };
}

/** El registro que se envía: solo las columnas de la tabla, normalizadas (sin auxiliares de pantalla). */
export function camposDePestana(p: Partial<PestanaAdmin>): PestanaAdmin {
    const orden = Number.parseInt(String(p.orden ?? 0), 10);
    return {
        codigoPestana: t(p.codigoPestana).toUpperCase(),
        codigoTipoPestana: t(p.codigoTipoPestana),
        codigoAplicacion: t(p.codigoAplicacion),
        codigoSuite: t(p.codigoSuite),
        nombrePestana: t(p.nombrePestana),
        orden: Number.isFinite(orden) && orden >= 0 ? orden : 0,
        descripcion: t(p.descripcion) || null,
        estado: p.estado !== false,
        icono: t(p.icono) || null,
        color: t(p.color) ? t(p.color).toLowerCase() : null
    };
}

/** Campos que faltan o están mal, como llaves de texto de la gestión (para nombrarlos en el aviso). */
export function faltantesPestana(p: PestanaAdmin): string[] {
    const f: string[] = [];
    if (!CODIGO.test(p.codigoPestana)) f.push('COMMON.CODE');
    if (!p.nombrePestana) f.push('COMMON.NAME');
    if (!p.codigoAplicacion) f.push('COMMON.APPLICATION');
    if (!p.codigoSuite) f.push('COMMON.SUITE');
    if (!p.codigoTipoPestana) f.push('UTILIDADES.PESTANAS.TAB_TYPE');
    if (p.color && !COLOR.test(p.color)) f.push('COMMON.COLOR');
    return f;
}

export function camposDeTipo(x: Partial<TipoPestana>): TipoPestana {
    return {
        codigoTipo: t(x.codigoTipo).toUpperCase(),
        estrategia: t(x.estrategia).toUpperCase(),
        descripcion: t(x.descripcion) || null,
        estado: x.estado !== false
    };
}

export function faltantesTipo(x: TipoPestana): string[] {
    const f: string[] = [];
    if (!CODIGO.test(x.codigoTipo)) f.push('COMMON.CODE');
    if (!(ESTRATEGIAS as readonly string[]).includes(x.estrategia)) f.push('UTILIDADES.PESTANAS.STRATEGY');
    return f;
}

export interface FiltrosPestanas {
    aplicacion: string; // '' = todas
    estado: 'todos' | 'activos' | 'inactivos';
    texto: string;
}

/** Filtros de la lista: «Todos» muestra todo; el texto busca contenido sin distinguir mayúsculas. */
export function filtrarPestanas<T extends PestanaAdmin>(lista: T[], f: FiltrosPestanas, extra: (p: T) => string = () => ''): T[] {
    const txt = t(f.texto).toLowerCase();
    return (lista || [])
        .filter((p) => !f.aplicacion || p.codigoAplicacion === f.aplicacion)
        .filter((p) => f.estado === 'todos' || (f.estado === 'activos') === !!p.estado)
        .filter((p) => !txt || `${p.codigoPestana} ${p.nombrePestana} ${p.codigoTipoPestana} ${p.icono || ''} ${extra(p)}`.toLowerCase().includes(txt));
}
