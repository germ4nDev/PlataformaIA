/*
    Author: German Valencia
    Pieza común (2026-10-25): ícono de cada pestaña de la Torre de Control (Font Awesome + color de texto). La usan la barra
    de pestañas (torre-control) y el lobby de pestañas (pestana-lobby-tcl), para que siempre muestren lo mismo.
    Noticias: en PTLPestanas es TLC_NOTICIAS (sin _001); se aceptan los dos. La app móvil tiene su equivalente con sus propios
    íconos SVG en PorttosMovil/src/app/nucleo/pestanas.ts (ESTILO_PESTANAS).
    OT-008 (2026-10-29): el ícono y el color salen de la BD (PTLPestanas.icono / .color, migración 020, en /api/pestanas). El
    ícono es un nombre neutro (barco, camion…) que aquí se dibuja con Font Awesome (ICONO_FA). ICONOS_PESTANA queda solo como
    respaldo cuando la BD no trae valor o la migración no está corrida.
*/

/** Nombre neutro del ícono de la BD → clase de Font Awesome (la app dibuja el mismo nombre con sus SVG). */
export const ICONO_FA: Readonly<Record<string, string>> = Object.freeze({
    barco: 'fas fa-ship',
    camion: 'fas fa-truck',
    bodega: 'fas fa-th-large',
    contenedor: 'fas fa-box',
    gnl: 'fas fa-fire-alt',
    mapa: 'fas fa-map-marked-alt',
    noticias: 'fas fa-newspaper',
    granel: 'fas fa-seedling',
    suelta: 'fas fa-car',
    capacidad: 'fas fa-warehouse',
    tablero: 'fas fa-th-large'
});

/** Lo que trae /api/pestanas de cada pestaña (null sin la migración 020). */
export interface EstiloPestanaBD { icono?: string | null; color?: string | null; }

const COLOR_VALIDO = /^#(?:[0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
export const ICONOS_PESTANA: Readonly<Record<string, string>> = Object.freeze({
    TLC_MARITIMO_001: 'fas fa-ship text-info',
    TLC_VIRTUAL_GATE_001: 'fas fa-truck text-warning',
    TLC_BODEGAS_001: 'fas fa-th-large text-info',
    TLC_CONTENEDORES_001: 'fas fa-box text-success',
    TLC_GNL_001: 'fas fa-fire-alt text-danger',
    TLC_MAPA_001: 'fas fa-map-marked-alt text-danger',
    TLC_NOTICIAS_001: 'fas fa-newspaper text-primary',
    TLC_NOTICIAS: 'fas fa-newspaper text-primary',
    TLC_GRANEL_001: 'fas fa-seedling text-success',
    TLC_SUELTA_001: 'fas fa-car text-warning',
    TLC_CAPACIDAD_001: 'fas fa-warehouse text-info'
});

/** Ícono por defecto para una pestaña nueva que aún no tiene el suyo. */
export const ICONO_PESTANA_DEFECTO = 'fas fa-th-large text-secondary';

/** Clase del ícono: el de la BD si es conocido; si no, el respaldo (con su clase de color text-*, que solo se usa sin color de la BD). */
export function iconoPestana(codigoPestana: string, desdeBD?: EstiloPestanaBD | null): string {
    const respaldo = ICONOS_PESTANA[(codigoPestana || '').trim().toUpperCase()] || ICONO_PESTANA_DEFECTO;
    const fa = ICONO_FA[String(desdeBD?.icono ?? '').trim().toLowerCase()];
    if (!fa) return colorPestana(desdeBD) ? respaldo.replace(/\s*text-\S+/g, '') : respaldo;
    return colorPestana(desdeBD) ? fa : `${fa} ${(respaldo.match(/text-\S+/) || ['text-secondary'])[0]}`;
}

/** Color de la BD (hexadecimal) o null: con null manda la clase text-* del respaldo. */
export function colorPestana(desdeBD?: EstiloPestanaBD | null): string | null {
    const c = String(desdeBD?.color ?? '').trim();
    return COLOR_VALIDO.test(c) ? c : null;
}
