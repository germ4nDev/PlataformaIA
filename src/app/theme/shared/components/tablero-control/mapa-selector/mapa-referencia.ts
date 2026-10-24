/*
    Capa de referencia para los editores espaciales (app-mapa-selector) — AD-17.
    Pinta geometrías conocidas (OpenStreetMap) debajo del dibujo para calcar
    o adoptar con un clic la geometría real de muelles, terminales, bodegas y tanques.
    Hay un archivo por puerto (registro generado por PlataformaApiIA/scripts/osm-referencia.js);
    solo se cargan los puertos que están a la vista.
    Funciones puras sobre el mapa: el componente solo decide cuándo llamarlas.
    Datos © colaboradores de OpenStreetMap, licencia ODbL (requiere atribución visible).
*/
import maplibregl from 'maplibre-gl';
import * as turf from '@turf/turf';
import { CAPAS_REFERENCIA, CapaReferencia } from './capas-referencia.generado';

export { CAPAS_REFERENCIA };
export const ATRIBUCION_REFERENCIA = '© colaboradores de OpenStreetMap (ODbL)';

const PREFIJO = 'ref-osm-';
const SUFIJOS = ['relleno', 'contorno', 'lineas', 'tanques'];
const SUFIJOS_INTERACTIVOS = ['relleno', 'lineas', 'tanques'];
/** Desde este zoom se cargan los puertos a la vista (antes la capa no se distingue). */
const ZOOM_MINIMO = 9;

const COLOR_POR_TIPO: any = [
    'match', ['get', 'tipo'],
    'area_portuaria', '#1e88e5',
    'muelle', '#fb8c00',
    'edificacion_en_terminal', '#8e24aa',
    'rompeolas', '#6d4c41',
    'tanque', '#e53935',
    '#607d8b'
];

export const ETIQUETA_TIPO: Record<string, string> = {
    area_portuaria: 'Área portuaria / terminal',
    muelle: 'Muelle',
    edificacion_en_terminal: 'Bodega / edificación',
    rompeolas: 'Rompeolas',
    tanque: 'Tanque / silo'
};

const fuenteDe = (capa: CapaReferencia) => `${PREFIJO}${capa.id}`;
const capaId = (capa: CapaReferencia, sufijo: string) => `${PREFIJO}${capa.id}-${sufijo}`;

function idsDeCapas(map: maplibregl.Map, sufijos: string[]): string[] {
    return (map.getStyle()?.layers || [])
        .map((l: any) => l.id as string)
        .filter((id) => id.startsWith(PREFIJO) && sufijos.some((s) => id.endsWith(`-${s}`)));
}

function aLaVista(map: maplibregl.Map, capa: CapaReferencia): boolean {
    if (map.getZoom() < ZOOM_MINIMO) return false;
    const b = map.getBounds();
    const [w, s, e, n] = capa.bbox;
    return !(e < b.getWest() || w > b.getEast() || n < b.getSouth() || s > b.getNorth());
}

/**
 * Agrega las capas de los puertos a la vista que aún no estén en el mapa
 * (llamar al cargar, al mover el mapa y tras un cambio de estilo).
 */
export function agregarCapaReferencia(map: maplibregl.Map, visible: boolean): void {
    const vis = visible ? 'visible' : 'none';
    // Se insertan antes de las capas de Draw para quedar siempre debajo del dibujo.
    const antesDe = map.getStyle()?.layers?.find((l: any) => l.id.startsWith('gl-draw'))?.id;

    CAPAS_REFERENCIA.filter((capa) => aLaVista(map, capa)).forEach((capa) => {
        const fuente = fuenteDe(capa);
        if (!map.getSource(fuente)) map.addSource(fuente, { type: 'geojson', data: capa.url });
        // Metros por píxel a zoom 0 en la latitud del puerto, para el radio real de los tanques.
        const mppZ0 = 156543.03 * Math.cos(((capa.bbox[1] + capa.bbox[3]) / 2) * Math.PI / 180);
        const agregar = (sufijo: string, def: any) => {
            const id = capaId(capa, sufijo);
            if (!map.getLayer(id)) map.addLayer({ id, source: fuente, ...def, layout: { visibility: vis } }, antesDe);
        };
        agregar('relleno', {
            type: 'fill',
            filter: ['in', ['geometry-type'], ['literal', ['Polygon', 'MultiPolygon']]],
            paint: { 'fill-color': COLOR_POR_TIPO, 'fill-opacity': ['match', ['get', 'tipo'], 'area_portuaria', 0.08, 0.3] }
        });
        agregar('contorno', {
            type: 'line',
            filter: ['in', ['geometry-type'], ['literal', ['Polygon', 'MultiPolygon']]],
            paint: {
                'line-color': COLOR_POR_TIPO,
                'line-width': ['match', ['get', 'tipo'], 'area_portuaria', 2, 1],
                'line-dasharray': ['literal', [3, 2]]
            }
        });
        agregar('lineas', {
            type: 'line',
            filter: ['==', ['geometry-type'], 'LineString'],
            paint: { 'line-color': COLOR_POR_TIPO, 'line-width': 3 }
        });
        agregar('tanques', {
            type: 'circle',
            filter: ['==', ['geometry-type'], 'Point'],
            paint: {
                'circle-color': COLOR_POR_TIPO,
                'circle-opacity': 0.35,
                'circle-stroke-color': COLOR_POR_TIPO,
                'circle-stroke-width': 1,
                'circle-radius': ['interpolate', ['exponential', 2], ['zoom'],
                    10, ['max', 1, ['/', ['get', 'radio_m'], mppZ0 / 1024]],
                    22, ['/', ['get', 'radio_m'], mppZ0 / 4194304]]
            }
        });
    });
}

export function alternarCapaReferencia(map: maplibregl.Map, visible: boolean): void {
    idsDeCapas(map, SUFIJOS).forEach((id) => map.setLayoutProperty(id, 'visibility', visible ? 'visible' : 'none'));
}

/** Elemento de referencia bajo el clic (si la capa está visible). */
export function referenciaEn(map: maplibregl.Map, punto: maplibregl.PointLike): any | null {
    const capas = idsDeCapas(map, SUFIJOS_INTERACTIVOS).filter((id) => map.getLayoutProperty(id, 'visibility') !== 'none');
    if (!capas.length) return null;
    const hallados = map.queryRenderedFeatures(punto, { layers: capas });
    if (!hallados.length) return null;
    // Preferimos lo más específico: tanque > muelle/bodega > área
    const prioridad = (f: any) => (f.properties?.['tipo'] === 'area_portuaria' ? 1 : 0);
    return [...hallados].sort((a, b) => prioridad(a) - prioridad(b))[0];
}

/**
 * Geometría original (sin recorte de teselas ni simplificación) del elemento,
 * buscada por osm_id en los datos completos de su fuente.
 */
export async function elementoOriginal(map: maplibregl.Map, fuente: string, osmId: string): Promise<any | null> {
    const src = map.getSource(fuente) as maplibregl.GeoJSONSource | undefined;
    if (!src || !fuente.startsWith(PREFIJO)) return null;
    const datos: any = await src.getData();
    return (datos?.features || []).find((f: any) => f.properties?.['osm_id'] === osmId) || null;
}

/**
 * Convierte un elemento de referencia en la geometría que espera el editor.
 * - modo 'poligono': Polygon (MultiPolygon → la parte más grande; tanque → círculo con su radio).
 * - modo 'punto': centro del elemento.
 * Devuelve null si no aplica (p. ej. un muelle trazado como línea en modo polígono).
 */
export function geometriaParaEditor(feature: any, modo: 'punto' | 'poligono' | 'linea'): any | null {
    const g = feature?.geometry;
    if (!g) return null;
    const props = feature.properties || {};
    if (modo === 'punto') {
        const c = g.type === 'Point' ? g.coordinates : turf.centroid(feature).geometry.coordinates;
        return { type: 'Point', coordinates: [redondear(c[0]), redondear(c[1])] };
    }
    if (modo !== 'poligono') return null;
    if (g.type === 'Polygon') return { type: 'Polygon', coordinates: g.coordinates };
    if (g.type === 'MultiPolygon') {
        const partes = g.coordinates.map((c: any) => turf.polygon(c));
        partes.sort((a: any, b: any) => turf.area(b) - turf.area(a));
        return { type: 'Polygon', coordinates: partes[0].geometry.coordinates };
    }
    if (g.type === 'Point' && props['radio_m']) {
        return turf.circle(g.coordinates, Number(props['radio_m']), { units: 'meters', steps: 24 }).geometry;
    }
    return null;
}

function redondear(n: number): number { return Math.round(n * 1e6) / 1e6; }

/** Texto seguro para el popup (sin HTML). */
export function describirReferencia(feature: any): { titulo: string; detalle: string } {
    const p = feature?.properties || {};
    const tipo = ETIQUETA_TIPO[p['tipo']] || p['tipo'] || 'Elemento';
    const titulo = p['nombre'] && p['nombre'] !== 'null' ? `${tipo}: ${p['nombre']}` : tipo;
    const partes: string[] = [];
    if (p['area'] && p['area'] !== 'null') partes.push(`En: ${p['area']}`);
    if (p['radio_m']) partes.push(`Radio ≈ ${p['radio_m']} m`);
    partes.push(`OSM ${p['osm_id']}`);
    return { titulo, detalle: partes.join(' · ') };
}
