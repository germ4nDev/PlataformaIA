// Generado por PlataformaApiIA/scripts/osm-referencia.js — no editar a mano.
// Datos © colaboradores de OpenStreetMap, licencia ODbL.

export interface CapaReferencia {
    id: string;
    nombre: string;
    url: string;
    /** [oeste, sur, este, norte] */
    bbox: [number, number, number, number];
    elementos: number;
    generado: string | null;
}

export const CAPAS_REFERENCIA: CapaReferencia[] = [
    {
        "id": "buenaventura",
        "nombre": "Buenaventura",
        "url": "assets/data/referencia/osm_buenaventura_infraestructura.geojson",
        "bbox": [
            -77.1798,
            3.8325,
            -77.0238,
            3.907
        ],
        "elementos": 349,
        "generado": "2026-10-18"
    },
    {
        "id": "cartagena",
        "nombre": "Cartagena (bahía, Mamonal, Barú)",
        "url": "assets/data/referencia/osm_cartagena_infraestructura.geojson",
        "bbox": [
            -75.5778,
            10.2782,
            -75.4887,
            10.4224
        ],
        "elementos": 235,
        "generado": "2026-10-18"
    },
    {
        "id": "san_andres",
        "nombre": "San Andrés",
        "url": "assets/data/referencia/osm_san_andres_infraestructura.geojson",
        "bbox": [
            -81.7075,
            12.5505,
            -81.6872,
            12.5999
        ],
        "elementos": 74,
        "generado": "2026-10-18"
    },
    {
        "id": "tumaco",
        "nombre": "Tumaco",
        "url": "assets/data/referencia/osm_tumaco_infraestructura.geojson",
        "bbox": [
            -78.7805,
            1.8034,
            -78.7286,
            1.8234
        ],
        "elementos": 47,
        "generado": "2026-10-18"
    }
];
