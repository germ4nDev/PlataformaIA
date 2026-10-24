/*
    Author: German Valencia
    Pattern: PORTTOS Front - Fuentes y capas MapLibre del mapa logístico
    Description: Declara todas las fuentes (sources) y capas (layers) del mapa sobre un estilo recién cargado.
      Los nombres de capa coinciden con el registro del menú (mapa-capas.ts). Devuelve si la red vial quedó cargada.
*/
import maplibregl from 'maplibre-gl';
import { COLORES_MAPA } from './mapa-iconos';

export interface ContextoCapas {
    isDark: boolean;
    viasGeoJson: any;
}

export function agregarFuentesYCapas(map: maplibregl.Map, ctx: ContextoCapas): boolean {
    let viasDescargadas = false;
    const emptyData: any = { type: 'FeatureCollection', features: [] };

    [
        'infra-source',
        'infra-marcadores-source',
        'naves-source',
        'clima-source',
        'alertas-viales-source',
        'terrestre-source',
        'highlight-source',
        'peajes-source',
        'geocercas-peajes-source',
        'geocercas-kpi-source',
        'muelles-estado-source',
        'embudo-resaltado-source',
        'recorrido-estelas-source'
    ].forEach((id) => {
        if (!map.getSource(id)) {
            const isClusterable =
                id === 'terrestre-source' ||
                id === 'alertas-viales-source' ||
                id === 'peajes-source' ||
                id === 'naves-source';
            map.addSource(id, {
                type: 'geojson',
                data: emptyData,
                cluster: isClusterable,
                clusterMaxZoom: 14,
                clusterRadius: 50
            } as any);
        }
    });

    if (!map.getSource('source-faros')) {
        map.addSource('source-faros', { type: 'geojson', data: emptyData });
    }

    // Corregido 2026-10-18: antes se descargaba la red vial completa (245 MB) en cada carga y en cada cambio
    // de estilo, aunque la capa estuviera apagada. Ahora la fuente nace vacía y se llena al activar la capa.
    if (!map.getSource('vias-source')) {
        map.addSource('vias-source', { type: 'geojson', data: ctx.viasGeoJson || emptyData });
        viasDescargadas = !!ctx.viasGeoJson;
    }

    const layers = [
        {
            id: 'capa-infra-fill',
            type: 'fill',
            source: 'infra-source',
            // Terminales van en su propia capa (se encienden/apagan aparte en el menú)
            filter: ['all', ['==', '$type', 'Polygon'], ['!=', 'tipo', 'puerto'], ['!=', 'tipo', 'terminal']],
            // Rediseño 2026-10-18: cada tipo con el color de su ícono; relleno suave para no tapar el mapa base
            paint: {
                'fill-color': ['coalesce', ['get', 'color_ui'], ['match', ['get', 'tipo'],
                    'terminal', COLORES_MAPA.terminal, 'muelle', COLORES_MAPA.muelle, 'bodega', COLORES_MAPA.bodega,
                    'silo', COLORES_MAPA.silo, 'patio', COLORES_MAPA.patio, 'tanque', COLORES_MAPA.tanque,
                    COLORES_MAPA.infraestructura]],
                'fill-opacity': ['match', ['get', 'tipo'], 'terminal', 0.18, 0.4]
            }
        },
        {
            id: 'capa-infra-line',
            type: 'line',
            source: 'infra-source',
            filter: ['all', ['==', '$type', 'Polygon'], ['!=', 'tipo', 'puerto'], ['!=', 'tipo', 'terminal']],
            paint: {
                'line-color': ['coalesce', ['get', 'color_ui'], ['match', ['get', 'tipo'],
                    'terminal', COLORES_MAPA.terminal, 'muelle', COLORES_MAPA.muelle, 'bodega', COLORES_MAPA.bodega,
                    'silo', COLORES_MAPA.silo, 'patio', COLORES_MAPA.patio, 'tanque', COLORES_MAPA.tanque,
                    COLORES_MAPA.infraestructura]],
                'line-width': ['match', ['get', 'tipo'], 'terminal', 2, 1.5]
            }
        },
        {
            id: 'capa-infra-terminal-fill',
            type: 'fill',
            source: 'infra-source',
            filter: ['all', ['==', '$type', 'Polygon'], ['==', 'tipo', 'terminal']],
            paint: {
                'fill-color': ['coalesce', ['get', 'color_ui'], COLORES_MAPA.terminal],
                'fill-opacity': 0.18
            }
        },
        {
            id: 'capa-infra-terminal-line',
            type: 'line',
            source: 'infra-source',
            filter: ['all', ['==', '$type', 'Polygon'], ['==', 'tipo', 'terminal']],
            paint: {
                'line-color': ['coalesce', ['get', 'color_ui'], COLORES_MAPA.terminal],
                'line-width': 2
            }
        },
        // Estado de muelles (GET /api/maritimo/:puerto/muelles-estado): color por estado sobre el polígono del muelle.
        // Borde continuo = confirmado por AIS; punteado = solo line-up (sin confirmar).
        {
            id: 'muelles-estado-fill',
            type: 'fill',
            source: 'muelles-estado-source',
            paint: {
                'fill-color': ['match', ['get', 'estado'],
                    'OCUPADO', COLORES_MAPA.muelleEstado['OCUPADO'], 'RESERVADO', COLORES_MAPA.muelleEstado['RESERVADO'],
                    'MANTENIMIENTO', COLORES_MAPA.muelleEstado['MANTENIMIENTO'], COLORES_MAPA.muelleEstado['LIBRE']],
                'fill-opacity': ['case', ['==', ['get', 'fuente'], 'LINEUP'], 0.35, 0.6]
            }
        },
        {
            id: 'muelles-estado-line',
            type: 'line',
            source: 'muelles-estado-source',
            filter: ['!=', ['get', 'fuente'], 'LINEUP'],
            paint: {
                'line-color': ['match', ['get', 'estado'],
                    'OCUPADO', COLORES_MAPA.muelleEstado['OCUPADO'], 'RESERVADO', COLORES_MAPA.muelleEstado['RESERVADO'],
                    'MANTENIMIENTO', COLORES_MAPA.muelleEstado['MANTENIMIENTO'], COLORES_MAPA.muelleEstado['LIBRE']],
                'line-width': ['case', ['==', ['get', 'verificacion'], 'DISCREPANCIA'], 3, 2]
            }
        },
        {
            id: 'muelles-estado-line-lineup',
            type: 'line',
            source: 'muelles-estado-source',
            filter: ['==', ['get', 'fuente'], 'LINEUP'],
            paint: {
                'line-color': COLORES_MAPA.muelleEstado['OCUPADO'],
                'line-width': 2,
                'line-dasharray': ['literal', [2, 1.5]]
            }
        },
        {
            id: 'muelles-estado-label',
            type: 'symbol',
            source: 'muelles-estado-source',
            minzoom: 14,
            layout: {
                'text-field': ['get', 'etiqueta'],
                'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
                'text-size': 11,
                'text-allow-overlap': false
            },
            paint: {
                'text-color': ctx.isDark ? '#f8fafc' : '#0f172a',
                'text-halo-color': ctx.isDark ? '#0f172a' : '#ffffff',
                'text-halo-width': 1.5
            }
        },
        {
            id: 'puerto-fill',
            type: 'fill',
            source: 'infra-source',
            filter: ['all', ['==', '$type', 'Polygon'], ['==', 'tipo', 'puerto']],
            paint: {
                'fill-color': ['coalesce', ['get', 'color_ui'], COLORES_MAPA.puerto],
                'fill-opacity': 0.15
            }
        },
        {
            id: 'puerto-line',
            type: 'line',
            source: 'infra-source',
            filter: ['all', ['==', '$type', 'Polygon'], ['==', 'tipo', 'puerto']],
            paint: {
                'line-color': ['coalesce', ['get', 'color_ui'], COLORES_MAPA.puerto],
                'line-width': 2.5,
                'line-dasharray': [4, 2]
            }
        },
        {
            id: 'vias-layer',
            type: 'line',
            source: 'vias-source',
            layout: { 'line-cap': 'round', 'line-join': 'round', visibility: 'visible' },
            paint: {
                'line-color': !ctx.isDark ? '#5d85be' : '#64748b',
                'line-width': 1.8,
                'line-opacity': 0.75
            }
        },
        {
            id: 'geocercas-layer',
            type: 'fill',
            source: 'geocercas-peajes-source',
            paint: {
                'fill-color': ['coalesce', ['get', 'color_ui'], '#eab308'],
                'fill-opacity': 0.15
            }
        },
        {
            id: 'geocercas-line-layer',
            type: 'line',
            source: 'geocercas-peajes-source',
            paint: {
                'line-color': ['coalesce', ['get', 'color_ui'], '#ca8a04'],
                'line-width': 1,
                'line-dasharray': [4, 4]
            }
        },
        {
            id: 'geocerca-fill-layer',
            type: 'fill',
            source: 'geocercas-kpi-source',
            paint: {
                'fill-color': ['coalesce', ['get', 'color_ui'], '#94a3b8'],
                'fill-opacity': 0.3
            }
        },
        {
            id: 'geocerca-line-layer',
            type: 'line',
            source: 'geocercas-kpi-source',
            paint: {
                'line-color': ['coalesce', ['get', 'color_ui'], '#3b82f6'],
                'line-width': 2,
                'line-dasharray': [4, 2]
            }
        },
        {
            id: 'layer-faros-fill',
            type: 'fill',
            source: 'source-faros',
            paint: {
                'fill-color': ['coalesce', ['get', 'color_ui'], '#00E5FF'],
                'fill-opacity': 0.25
            }
        },
        {
            id: 'layer-faros-line',
            type: 'line',
            source: 'source-faros',
            paint: {
                'line-color': ['coalesce', ['get', 'color_ui'], '#00E5FF'],
                'line-width': 2,
                'line-dasharray': [3, 3]
            }
        },
        {
            id: 'highlight-layer',
            type: 'line',
            source: 'highlight-source',
            paint: {
                'line-color': ctx.isDark ? '#f59e0b' : '#c2410c',
                'line-width': 4,
                'line-opacity': 0.9,
                'line-dasharray': [2, 2]
            },
            layout: { 'line-cap': 'round', 'line-join': 'round' }
        },
        {
            id: 'capa-infra-point',
            type: 'circle',
            source: 'infra-source',
            filter: ['==', '$type', 'Point'],
            paint: {
                'circle-radius': 8,
                'circle-stroke-width': 2,
                'circle-stroke-color': '#ffffff',
                'circle-color': [
                    'match',
                    ['get', 'estado_operativo'],
                    'libre',
                    '#22c55e',
                    'ocupado',
                    '#facc15',
                    'congestionado',
                    '#f59e0b',
                    'critico',
                    '#dc2626',
                    'desocupado',
                    '#94a3b8',
                    '#38bdf8'
                ]
            }
        },
        // =====================================================================================
        // ÍCONOS Y GRUPOS (rediseño 2026-10-18 · ver mapa-iconos.ts)
        // Infraestructura: cuadros redondeados por tipo, que aparecen según el zoom para no saturar.
        // Activos: círculos por color de entidad. Grupos: círculo con halo + glifo + cantidad (clic = acercar).
        // =====================================================================================
        {
            id: 'infra-marcadores-puerto',
            type: 'symbol',
            source: 'infra-marcadores-source',
            filter: ['==', ['get', 'tipo'], 'puerto'],
            layout: {
                'icon-image': 'infra-puerto',
                'icon-size': ['interpolate', ['linear'], ['zoom'], 4, 0.75, 10, 1],
                'icon-allow-overlap': true,
                'text-field': ['get', 'nombre'],
                'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
                'text-size': 12,
                'text-offset': [0, 1.6],
                'text-anchor': 'top',
                'text-optional': true
            },
            paint: { 'text-color': '#ffffff', 'text-halo-color': COLORES_MAPA.puerto, 'text-halo-width': 1.6 }
        },
        {
            id: 'infra-marcadores-terminal',
            type: 'symbol',
            source: 'infra-marcadores-source',
            minzoom: 10,
            filter: ['==', ['get', 'tipo'], 'terminal'],
            layout: {
                'icon-image': 'infra-terminal',
                'icon-size': 0.85,
                'icon-allow-overlap': true,
                'text-field': ['get', 'nombre'],
                'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
                'text-size': 11,
                'text-offset': [0, 1.5],
                'text-anchor': 'top',
                'text-optional': true
            },
            paint: { 'text-color': '#ffffff', 'text-halo-color': COLORES_MAPA.terminal, 'text-halo-width': 1.5 }
        },
        {
            id: 'infra-marcadores-detalle',
            type: 'symbol',
            source: 'infra-marcadores-source',
            minzoom: 12.5,
            filter: ['match', ['get', 'tipo'], ['puerto', 'terminal'], false, true],
            layout: {
                'icon-image': [
                    'match', ['get', 'tipo'],
                    'muelle', 'infra-muelle',
                    'bodega', 'infra-bodega',
                    'silo', 'infra-silo',
                    'patio', 'infra-patio',
                    'tanque', 'infra-tanque',
                    'infra-generica'
                ],
                'icon-size': 0.75,
                'icon-allow-overlap': true,
                'text-field': ['step', ['zoom'], '', 14, ['get', 'nombre']],
                'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
                'text-size': 10,
                'text-offset': [0, 1.4],
                'text-anchor': 'top',
                'text-optional': true
            },
            paint: { 'text-color': '#ffffff', 'text-halo-color': '#0f172a', 'text-halo-width': 1.4 }
        },
        // Modo reproducir: camino de los últimos 15 min de cada nave y camión (debajo de sus íconos; vacío en vivo)
        {
            id: 'recorrido-estelas',
            type: 'line',
            source: 'recorrido-estelas-source',
            layout: { 'line-cap': 'round', 'line-join': 'round' },
            paint: {
                'line-color': ['match', ['get', 'tipo'], 'NAVE', COLORES_MAPA.recorridoNave, COLORES_MAPA.recorridoCamion],
                'line-width': ['interpolate', ['linear'], ['zoom'], 6, 1.5, 12, 3],
                'line-opacity': 0.75
            }
        },
        {
            id: 'terrestre-cluster-content',
            type: 'symbol',
            source: 'terrestre-source',
            filter: ['has', 'point_count'],
            layout: {
                'icon-image': 'grupo-camion',
                'icon-size': ['step', ['get', 'point_count'], 0.8, 25, 0.95, 100, 1.1],
                'text-field': '{point_count_abbreviated}',
                'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
                'text-size': 13,
                'text-offset': [0, 0.75],
                'icon-allow-overlap': true,
                'text-allow-overlap': true
            },
            paint: { 'text-color': '#ffffff', 'text-halo-color': '#064e3b', 'text-halo-width': 1 }
        },
        {
            id: 'terrestre-individual',
            type: 'symbol',
            source: 'terrestre-source',
            filter: ['!', ['has', 'point_count']],
            layout: {
                'icon-image': ['match', ['get', 'estado'], 'EN_RUTA', 'camion-ruta', 'camion-detenido'],
                'icon-size': 0.8,
                'icon-allow-overlap': true
            }
        },
        {
            id: 'peajes-cluster-content',
            type: 'symbol',
            source: 'peajes-source',
            filter: ['has', 'point_count'],
            layout: {
                'icon-image': 'grupo-peaje',
                'icon-size': ['step', ['get', 'point_count'], 0.7, 10, 0.82, 25, 0.95],
                'text-field': '{point_count_abbreviated}',
                'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
                'text-size': 12,
                'text-offset': [0, 0.72],
                'icon-allow-overlap': true,
                'text-allow-overlap': true
            },
            paint: { 'text-color': '#1c1917' }
        },
        {
            id: 'peajes-individual',
            type: 'symbol',
            source: 'peajes-source',
            filter: ['!', ['has', 'point_count']],
            layout: { 'icon-image': 'peaje', 'icon-size': 0.65, 'icon-allow-overlap': true }
        },
        {
            id: 'viales-cluster-content',
            type: 'symbol',
            source: 'alertas-viales-source',
            filter: ['has', 'point_count'],
            layout: {
                'icon-image': 'grupo-incidente',
                'icon-size': ['step', ['get', 'point_count'], 0.75, 50, 0.9, 500, 1.05],
                'text-field': '{point_count_abbreviated}',
                'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
                'text-size': 13,
                'text-offset': [0, 0.75],
                'icon-allow-overlap': true,
                'text-allow-overlap': true
            },
            paint: { 'text-color': '#ffffff', 'text-halo-color': '#7f1d1d', 'text-halo-width': 1 }
        },
        {
            id: 'viales-individual',
            type: 'symbol',
            source: 'alertas-viales-source',
            filter: ['!', ['has', 'point_count']],
            layout: {
                'icon-image': [
                    'match',
                    ['upcase', ['coalesce', ['get', 'tipoEvento'], '']],
                    ['MANTENIMIENTO_OBRA', 'OBRA', 'OBRAS', 'MANTENIMIENTO'], 'incidente-obra',
                    ['CIERRE_VIAL', 'CIERRE', 'CIERRE TOTAL', 'VIA CERRADA'], 'incidente-cierre',
                    ['CONGESTION', 'CONGESTIÓN', 'TRAFICO', 'PASO A UN CARRIL'], 'incidente-congestion',
                    'incidente-accidente'
                ],
                'icon-size': 0.75,
                'icon-allow-overlap': true,
                'icon-ignore-placement': true
            }
        },
        {
            id: 'clima-cluster-symbol',
            type: 'symbol',
            source: 'clima-source',
            filter: ['has', 'point_count'],
            layout: {
                'icon-image': 'grupo-clima',
                'icon-size': 0.75,
                'icon-allow-overlap': true,
                'text-field': '{point_count}',
                'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
                'text-size': 12,
                'text-offset': [0, 0.75],
                'text-allow-overlap': true
            },
            paint: { 'text-color': '#ffffff' }
        },
        {
            id: 'clima-individual',
            type: 'symbol',
            source: 'clima-source',
            filter: ['!', ['has', 'point_count']],
            layout: {
                'icon-image': 'clima',
                'icon-size': 0.75,
                'icon-allow-overlap': true,
                // Temperatura junto al ícono (OpenWeather: properties.temp)
                'text-field': ['case', ['has', 'temp'], ['concat', ['to-string', ['round', ['to-number', ['get', 'temp'], 0]]], '°'], ''],
                'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
                'text-size': 12,
                'text-offset': [1.4, 0],
                'text-anchor': 'left',
                'text-allow-overlap': true
            },
            paint: { 'text-color': '#ffffff', 'text-halo-color': COLORES_MAPA.clima, 'text-halo-width': 1.6 }
        },
        {
            id: 'naves-cluster-symbol',
            type: 'symbol',
            source: 'naves-source',
            filter: ['has', 'point_count'],
            layout: {
                'icon-image': 'grupo-nave',
                'icon-size': ['step', ['get', 'point_count'], 0.8, 25, 0.95, 100, 1.1],
                'icon-allow-overlap': true,
                'text-field': '{point_count_abbreviated}',
                'text-size': 13,
                'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
                'text-allow-overlap': true,
                'text-offset': [0, 0.75]
            },
            paint: { 'text-color': '#ffffff', 'text-halo-color': '#0c4a6e', 'text-halo-width': 1 }
        },
        {
            id: 'naves-individual',
            type: 'symbol',
            source: 'naves-source',
            filter: ['!', ['has', 'point_count']],
            layout: {
                // Color por estado AIS; sin estado AIS, por el estado DIMAR (FONDEADAS / ARRIBADAS)
                'icon-image': [
                    'match',
                    ['coalesce', ['get', 'estado_ais'], ['get', 'estado_inferido'], ['get', 'estado_nave'], ''],
                    'NAVEGANDO', 'nave-navegando',
                    'EN MANIOBRA', 'nave-maniobra',
                    ['FONDEADO', 'FONDEADAS'], 'nave-fondeado',
                    ['ATRACADO', 'ARRIBADAS'], 'nave-atracado',
                    'DETENIDO', 'nave-detenido',
                    ['VARADO', 'SIN GOBIERNO', 'EMERGENCIA'], 'nave-alerta',
                    'nave-sin-estado'
                ],
                'icon-size': ['interpolate', ['linear'], ['zoom'], 5, 0.65, 11, 0.9, 15, 1.1],
                'icon-allow-overlap': true,
                'icon-rotate': ['to-number', ['get', 'rumbo'], 0],
                'icon-rotation-alignment': 'map'
            }
        },
        {
            id: 'naves-nombres',
            type: 'symbol',
            source: 'naves-source',
            minzoom: 9,
            filter: ['!', ['has', 'point_count']],
            layout: {
                'text-field': ['coalesce', ['get', 'nombre_motonave'], ''],
                'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
                'text-size': 11,
                'text-offset': [0, 1.8],
                'text-anchor': 'top',
                'text-optional': true
            },
            paint: { 'text-color': '#ffffff', 'text-halo-color': '#020617', 'text-halo-width': 2 }
        },
        // Resaltado del embudo de llegada: anillo sobre las naves de la etapa elegida (encima de todo)
        {
            id: 'embudo-resaltado',
            type: 'circle',
            source: 'embudo-resaltado-source',
            paint: {
                'circle-radius': 18,
                'circle-color': 'rgba(47, 150, 180, 0.12)',
                'circle-stroke-color': '#2f96b4',
                'circle-stroke-width': 3
            }
        }
    ];

    layers.forEach((l) => {
        try {
            if (map.getLayer(l.id)) map.removeLayer(l.id);
            map.addLayer(l as any);
        } catch (e) {
            console.error('Error cargando capa:', l.id, e);
        }
    });
    return viasDescargadas;
}
