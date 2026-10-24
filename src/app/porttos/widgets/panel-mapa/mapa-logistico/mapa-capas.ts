/*
    Author: German Valencia
    Pattern: PORTTOS Map Layers Registry - Catálogo único de capas del Mapa Logístico
    Description: Cada entrada del menú "Visualización de Capas" y las capas de MapLibre que controla.
      El menú, la visibilidad y los valores por defecto salen de aquí: si se agrega una capa al mapa,
      basta con registrarla en su grupo para que aparezca en el menú y se pueda encender/apagar.
*/
import { COLORES_MAPA } from './mapa-iconos';

export interface CapaMenu {
    /** Llave en MapaGeneralService.visibilidad$ */
    id: string;
    nombre: string;
    /** Ids de las capas de MapLibre que se muestran/ocultan juntas */
    capas: string[];
    /** Visible al abrir el mapa por primera vez */
    defecto: boolean;
    /** Ícono del mapa (mapa-iconos.ts) o, para polígonos, un color de muestra */
    icono?: string;
    color?: string;
}

export interface GrupoCapas {
    grupo: string;
    abierto: boolean;
    capas: CapaMenu[];
}

export const GRUPOS_CAPAS: GrupoCapas[] = [
    {
        grupo: 'Operación Marítima',
        abierto: true,
        capas: [
            { id: 'muelles-estado', nombre: 'Estado de muelles (libre · ocupado · reservado)', capas: ['muelles-estado-fill', 'muelles-estado-line', 'muelles-estado-line-lineup', 'muelles-estado-label'], defecto: true, color: COLORES_MAPA.muelleEstado['OCUPADO'] },
            { id: 'naves', nombre: 'Motonaves (AIS)', capas: ['naves-cluster-symbol', 'naves-individual'], defecto: true, icono: 'nave-navegando' },
            { id: 'naves-nombres', nombre: 'Nombres de motonaves', capas: ['naves-nombres'], defecto: true, color: '#e2e8f0' },
            { id: 'faros', nombre: 'Geocercas de control (faros)', capas: ['layer-faros-fill', 'layer-faros-line'], defecto: true, color: '#00E5FF' },
            { id: 'geocercas-kpi', nombre: 'Radar de geocercas (conteos)', capas: ['geocerca-fill-layer', 'geocerca-line-layer'], defecto: true, color: '#3b82f6' }
        ]
    },
    {
        grupo: 'Infraestructura',
        abierto: true,
        capas: [
            { id: 'puertos', nombre: 'Puertos', capas: ['puerto-fill', 'puerto-line', 'infra-marcadores-puerto'], defecto: true, icono: 'infra-puerto' },
            { id: 'terminales', nombre: 'Terminales', capas: ['capa-infra-terminal-fill', 'capa-infra-terminal-line', 'infra-marcadores-terminal'], defecto: true, icono: 'infra-terminal' },
            { id: 'muelles-almacenamiento', nombre: 'Muelles, bodegas, silos y patios', capas: ['capa-infra-fill', 'capa-infra-line', 'capa-infra-point', 'infra-marcadores-detalle'], defecto: true, icono: 'infra-bodega' }
        ]
    },
    {
        grupo: 'Operación Terrestre',
        abierto: true,
        capas: [
            { id: 'terrestre', nombre: 'Flota en ruta (GPS)', capas: ['terrestre-cluster-content', 'terrestre-individual'], defecto: true, icono: 'camion-ruta' },
            { id: 'peajes', nombre: 'Peajes', capas: ['peajes-cluster-content', 'peajes-individual'], defecto: true, icono: 'peaje' },
            { id: 'peajes-zonas', nombre: 'Zonas de influencia de peajes (2 km)', capas: ['geocercas-layer', 'geocercas-line-layer'], defecto: true, color: COLORES_MAPA.peaje },
            // Apagada por defecto: la red vial solo se descarga al activarla
            { id: 'vias', nombre: 'Red vial nacional', capas: ['vias-layer'], defecto: false, color: '#64748b' }
        ]
    },
    {
        grupo: 'Riesgos y Clima',
        abierto: true,
        capas: [
            { id: 'accidentes', nombre: 'Incidentes viales', capas: ['viales-cluster-content', 'viales-individual'], defecto: true, icono: 'incidente-accidente' },
            { id: 'clima', nombre: 'Clima actual por puerto', capas: ['clima-cluster-symbol', 'clima-individual'], defecto: true, icono: 'clima' }
        ]
    }
];

/** Estado inicial de visibilidad (para MapaGeneralService). */
export const VISIBILIDAD_INICIAL: Record<string, boolean> = Object.fromEntries(
    GRUPOS_CAPAS.flatMap((g) => g.capas.map((c) => [c.id, c.defecto]))
);

/** Lista plana { capa de MapLibre → visible } a partir del estado del menú. */
export function visibilidadPorCapaMapLibre(estado: Record<string, boolean | undefined>): Array<{ id: string; visible: boolean }> {
    return GRUPOS_CAPAS.flatMap((g) => g.capas.flatMap((c) => {
        const visible = estado[c.id] ?? c.defecto;
        return c.capas.map((id) => ({ id, visible }));
    }));
}
