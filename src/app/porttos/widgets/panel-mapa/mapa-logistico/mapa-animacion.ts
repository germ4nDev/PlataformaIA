/*
    Author: German Valencia
    Funciones puras de animación del mapa (sin MapLibre ni Angular).
    La flota llega cada 10 s; en vez de saltar, cada camión se desliza desde donde se ve hasta su nueva posición
    durante el intervalo, girando por el lado corto. Un salto de más de saltoMaxM (cambio de puerto, camión que
    reaparece) no se anima: va directo.
*/

export interface PosicionAnimada { lon: number; lat: number; rumbo: number | null }

/** Interpolación del rumbo por el lado corto (350° → 10° pasa por 0°). */
export function rumboEntre(a: number | null, b: number | null, f: number): number | null {
    if (a === null || !Number.isFinite(a)) return b;
    if (b === null || !Number.isFinite(b)) return a;
    const d = ((b - a + 540) % 360) - 180;
    return Math.round((a + d * f + 360) % 360);
}

/** Distancia aproximada en metros (equirectangular; suficiente para decidir si se anima). */
export function metrosAprox(a: [number, number], b: [number, number]): number {
    const k = Math.cos(((a[1] + b[1]) / 2) * Math.PI / 180);
    return Math.hypot((a[0] - b[0]) * k, a[1] - b[1]) * 111320;
}

/** Posición visible de cada objeto, por la propiedad clave (placa, mmsi…). */
export function indexarPosiciones(fc: any, clave = 'placa'): Map<string, PosicionAnimada> {
    const m = new Map<string, PosicionAnimada>();
    for (const f of fc?.features || []) {
        const id = f?.properties?.[clave];
        const c = f?.geometry?.coordinates;
        if (id == null || !Array.isArray(c)) continue;
        const r = Number(f.properties.rumbo);
        m.set(String(id), { lon: c[0], lat: c[1], rumbo: Number.isFinite(r) ? r : null });
    }
    return m;
}

/**
 * Fotograma intermedio entre lo que se ve (desde) y lo que llegó (hasta), con f entre 0 y 1.
 * Los objetos nuevos aparecen directamente en su posición final.
 */
export function interpolarColeccion(desde: Map<string, PosicionAnimada>, hasta: any, f: number, clave = 'placa', saltoMaxM = 3000): any {
    const t = Math.max(0, Math.min(1, f));
    return {
        type: 'FeatureCollection',
        features: (hasta?.features || []).map((feat: any) => {
            const prev = desde.get(String(feat?.properties?.[clave]));
            const c = feat?.geometry?.coordinates;
            if (!prev || !Array.isArray(c) || t >= 1 || metrosAprox([prev.lon, prev.lat], c as [number, number]) > saltoMaxM) return feat;
            const rumboFinal = Number(feat.properties.rumbo);
            return {
                ...feat,
                geometry: { type: 'Point', coordinates: [prev.lon + (c[0] - prev.lon) * t, prev.lat + (c[1] - prev.lat) * t] },
                properties: { ...feat.properties, rumbo: rumboEntre(prev.rumbo, Number.isFinite(rumboFinal) ? rumboFinal : null, t) ?? 0 }
            };
        })
    };
}
