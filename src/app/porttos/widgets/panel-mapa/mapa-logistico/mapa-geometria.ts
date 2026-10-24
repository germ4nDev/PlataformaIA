/*
    Author: German Valencia
    Pattern: PORTTOS Front - Geometría del mapa logístico
    Description: Funciones puras (sin estado del componente) para validar y transformar geometrías:
      círculos de influencia, WKT → GeoJSON, infraestructura jerárquica, marcadores y límites.
*/
import maplibregl from 'maplibre-gl';
import { parse } from 'wellknown';
import * as turf from '@turf/turf';
import { tipoInfraestructura } from './mapa-iconos';

export function esPosicion(c: any): boolean {
    return Array.isArray(c) && c.length >= 2 && Number.isFinite(c[0]) && Number.isFinite(c[1]);
}

export function esPoligonoValido(g: any): boolean {
    if (!g || !Array.isArray(g.coordinates)) return false;
    const anilloOk = (r: any) => Array.isArray(r) && r.length >= 4 && r.every(esPosicion);
    if (g.type === 'Polygon') return g.coordinates.length > 0 && g.coordinates.every(anilloOk);
    if (g.type === 'MultiPolygon') return g.coordinates.length > 0 && g.coordinates.every((p: any) => Array.isArray(p) && p.every(anilloOk));
    return false;
}

export function hacerCircular(geojsonOriginal: any, radioMetrosDB?: number): any {
    try {
        if (!geojsonOriginal) return null;
        let geom = geojsonOriginal;
        if (geojsonOriginal.type === 'FeatureCollection') geom = geojsonOriginal.features[0]?.geometry;
        else if (geojsonOriginal.type === 'Feature') geom = geojsonOriginal.geometry;

        if (!geom) return geojsonOriginal;

        if (radioMetrosDB && radioMetrosDB > 0) {
            const centro = turf.centroid(geom);
            return turf.circle(centro.geometry.coordinates, radioMetrosDB / 1000, {
                steps: 64,
                units: 'kilometers'
            }).geometry;
        }

        if (geom.type === 'Point') {
            return turf.circle(geom.coordinates, 2, { steps: 64, units: 'kilometers' }).geometry;
        }

        const centro = turf.centroid(geom);
        const bbox = turf.bbox(geom);
        const puntoBorde = turf.point([centro.geometry.coordinates[0], bbox[1]]);
        let radioKm = turf.distance(centro, puntoBorde, { units: 'kilometers' });

        if (radioKm === 0) radioKm = 1;
        return turf.circle(centro.geometry.coordinates, radioKm, { steps: 64, units: 'kilometers' }).geometry;
    } catch (e) {
        return geojsonOriginal;
    }
}

export function convertirWKT_ACirculo(wkt: string, radioMetrosDB?: number): any {
    try {
        const geojsonOriginal = parse(wkt);
        return hacerCircular(geojsonOriginal, radioMetrosDB);
    } catch (e) {
        return parse(wkt);
    }
}

export function calcularBboxGeoJSON(geojson: any): maplibregl.LngLatBounds | null {
    if (!geojson) return null;
    try {
        const bbox = turf.bbox(geojson);
        return new maplibregl.LngLatBounds([bbox[0], bbox[1]], [bbox[2], bbox[3]]);
    } catch (e) {
        return null;
    }
}

export function procesarInfraestructuraWkt(puertosArray: any[]): any {
    const features: any[] = [];
    if (!Array.isArray(puertosArray)) return { type: 'FeatureCollection', features };

    puertosArray.forEach((puerto) => {
        const wktPuerto = puerto.puerto_wkt || puerto.puerto_geocerca_wkt;
        if (wktPuerto) {
            const geo = convertirWKT_ACirculo(wktPuerto);
            if (geo) {
                features.push({
                    type: 'Feature',
                    geometry: geo as any,
                    properties: {
                        id: puerto.id_puerto,
                        nombre: puerto.nombre_puerto,
                        tipo: 'puerto',
                        color_ui: puerto.color_ui
                    }
                });
            }
        }

        if (Array.isArray(puerto.terminales)) {
            puerto.terminales.forEach((terminal: any) => {
                const muellesFeaturesTerminal: any[] = [];
                if (Array.isArray(terminal.muelles)) {
                    terminal.muelles.forEach((muelle: any) => {
                        const wktMuelle = muelle.muelle_wkt || muelle.muelle_geocerca_wkt;
                        if (wktMuelle) {
                            const geo = parse(wktMuelle);
                            if (geo) {
                                const muelleFeature = {
                                    type: 'Feature',
                                    geometry: geo as any,
                                    properties: {
                                        id: muelle.id_interno,
                                        nombre: muelle.nombre_muelle,
                                        tipo: 'muelle',
                                        color_ui: muelle.color_ui
                                    }
                                };
                                muellesFeaturesTerminal.push(muelleFeature);
                                features.push(muelleFeature);
                            }
                        }
                    });
                }

                // Agregado 2026-10-18: bodegas, silos, patios y tanques de la terminal (antes se ignoraban)
                if (Array.isArray(terminal.infraestructuras)) {
                    terminal.infraestructuras.forEach((infra: any) => {
                        const wktInfra = infra.infra_geocerca_wkt || infra.infra_ubicacion_wkt;
                        if (!wktInfra) return;
                        try {
                            const geo = parse(wktInfra);
                            if (!geo) return;
                            features.push({
                                type: 'Feature',
                                geometry: geo as any,
                                properties: {
                                    id: infra.id_infraestructura,
                                    nombre: infra.nombre_infra,
                                    tipo: tipoInfraestructura(infra.tipo_infra || infra.nombre_infra),
                                    tipo_original: infra.tipo_infra,
                                    terminal: terminal.nombre_terminal,
                                    color_ui: infra.color_ui
                                }
                            });
                        } catch {
                            // WKT inválido: se omite esa infraestructura
                        }
                    });
                }

                const wktTerminal = terminal.terminal_wkt || terminal.terminal_geocerca_wkt;
                let terminalGeo = null;

                if (wktTerminal) {
                    terminalGeo = parse(wktTerminal);
                } else if (muellesFeaturesTerminal.length > 0) {
                    try {
                        const featureCollection = turf.featureCollection(muellesFeaturesTerminal);
                        const envolvente = turf.envelope(featureCollection);
                        const envolventeConMargen = turf.buffer(envolvente, 0.05, { units: 'kilometers' });
                        if (envolventeConMargen && envolventeConMargen.geometry) {
                            terminalGeo = envolventeConMargen.geometry;
                        }
                    } catch (e) { }
                }

                if (terminalGeo) {
                    features.push({
                        type: 'Feature',
                        geometry: terminalGeo as any,
                        properties: {
                            id: terminal.id_terminal,
                            nombre: terminal.nombre_terminal,
                            tipo: 'terminal',
                            autogenerada: !wktTerminal,
                            color_ui: terminal.color_ui
                        }
                    });
                }
            });
        }
    });

    return { type: 'FeatureCollection', features };
}

/** Un punto por elemento de infraestructura (centro de su polígono) para pintar su ícono. */
export function marcadoresDeInfraestructura(infra: any): any {
    const features: any[] = [];
    (infra?.features || []).forEach((f: any) => {
        try {
            const punto = f.geometry?.type === 'Point' ? f : turf.pointOnFeature(f);
            const c = punto?.geometry?.coordinates;
            if (!Array.isArray(c) || !Number.isFinite(c[0]) || !Number.isFinite(c[1])) return;
            features.push({ type: 'Feature', geometry: { type: 'Point', coordinates: c }, properties: { ...f.properties } });
        } catch {
            // geometría que turf no puede procesar: sin ícono
        }
    });
    return { type: 'FeatureCollection', features };
}
