/*
    Author: German Valencia
    Pieza común (2026-10-25): ícono de cada pestaña de la Torre de Control (Font Awesome + color de texto). La usan la barra
    de pestañas (torre-control) y el lobby de pestañas (pestana-lobby-tcl), para que siempre muestren lo mismo.
    Noticias: en PTLPestanas es TLC_NOTICIAS (sin _001); se aceptan los dos. La app móvil tiene su equivalente con sus propios
    íconos SVG en PorttosCore/src/pestanas.ts (ESTILO_PESTANAS).
*/
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

export function iconoPestana(codigoPestana: string): string {
    return ICONOS_PESTANA[(codigoPestana || '').trim().toUpperCase()] || ICONO_PESTANA_DEFECTO;
}
