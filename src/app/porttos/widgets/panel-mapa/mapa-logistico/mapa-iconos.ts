/*
    Author: German Valencia
    Pattern: PORTTOS Map Iconography - Íconos vectoriales del Mapa Logístico
    Description: Un solo sistema visual para todo el mapa, dibujado en SVG y cargado en MapLibre como imágenes
      nítidas (pixelRatio 2). La misma definición alimenta la leyenda, así el mapa y las convenciones nunca difieren.

      Gramática visual:
        - Infraestructura fija (puerto, terminal, muelle, bodega, silo, patio, tanque) → cuadro redondeado.
        - Activos en movimiento (camiones) y servicios (peajes, clima) → círculo.
        - Naves → casco visto desde arriba, rotado según el rumbo AIS y coloreado por su estado.
        - Incidentes viales → su propia señal (triángulo, cono, prohibido, semáforo).
        - Grupos (clusters) → círculo grande con halo del color de la entidad, su glifo arriba y la cantidad abajo.
      Cada entidad tiene un color propio; el anillo blanco y la sombra la separan de cualquier mapa base.
*/

export interface IconoMapa {
    id: string;
    svg: string;
    ancho: number;
    alto: number;
}

/** Colores por entidad (también los usa la leyenda y el relleno de las geocercas). */
export const COLORES_MAPA = {
    puerto: '#2563eb',
    terminal: '#7c3aed',
    muelle: '#0891b2',
    bodega: '#d97706',
    silo: '#c2410c',
    patio: '#4d7c0f',
    tanque: '#be185d',
    infraestructura: '#475569',
    /** Estado de muelles (capa muelles-estado): libre, ocupado, reservado por el line-up, en mantenimiento */
    muelleEstado: {
        LIBRE: '#16a34a',
        OCUPADO: '#dc2626',
        RESERVADO: '#f59e0b',
        MANTENIMIENTO: '#64748b'
    } as Record<string, string>,
    /** Modo reproducir: estelas de naves y camiones */
    recorridoNave: '#0ea5e9',
    recorridoCamion: '#10b981',
    camionRuta: '#059669',
    camionDetenido: '#ea580c',
    peaje: '#eab308',
    clima: '#0369a1',
    incidente: '#dc2626',
    obra: '#ea580c',
    cierre: '#991b1b',
    congestion: '#d97706',
    nave: {
        NAVEGANDO: '#0284c7',
        'EN MANIOBRA': '#06b6d4',
        FONDEADO: '#f59e0b',
        ATRACADO: '#16a34a',
        DETENIDO: '#64748b',
        ALERTA: '#dc2626',
        SIN_ESTADO: '#475569'
    } as Record<string, string>
};

// ---------------------------------------------------------------------------------------------
// Glifos 24×24. c = color del trazo/relleno principal, f = color de fondo (para "recortes").
// ---------------------------------------------------------------------------------------------
type Glifo = (c: string, f: string) => string;
const trazo = (c: string, w = 2) => `fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"`;

const GLIFOS: Record<string, Glifo> = {
    ancla: (c) => `<g ${trazo(c, 2.2)}><circle cx="12" cy="4.8" r="2.2"/><path d="M12 7v14M7.5 10.5h9M4.5 13.5a7.5 7.5 0 0 0 15 0M4.5 13.5 3 15.5M4.5 13.5l2.2 1M19.5 13.5 21 15.5M19.5 13.5l-2.2 1"/></g>`,
    grua: (c) => `<g ${trazo(c, 2)}><path d="M5.5 21V8M10 21V8M2.5 8h19M5.5 8 8.5 3.5h2V8M17.5 8v4.5"/><rect x="15.5" y="12.5" width="4" height="3" rx=".6" fill="${c}"/><path d="M3 21h9.5"/></g>`,
    muelle: (c) => `<g ${trazo(c, 2)}><path d="M2.5 9.5h19M2.5 13.5h19M5 9.5v6M12 9.5v6M19 9.5v6M2.5 19.5c1.6-1.4 3.2-1.4 4.8 0s3.2 1.4 4.8 0 3.2-1.4 4.8 0 3.2 1.4 4.6 0"/></g>`,
    bodega: (c) => `<g ${trazo(c, 2)}><path d="M3 10.5 12 4l9 6.5V20.5H3z"/><path d="M8 20.5v-6.5h8v6.5M8 17.2h8"/></g>`,
    silo: (c) => `<g ${trazo(c, 2)}><path d="M6.5 9c0-2.6 2.5-4.5 5.5-4.5s5.5 1.9 5.5 4.5v11.5h-11z"/><path d="M6.5 12.5h11M6.5 16.5h11M12 2.2v2.3"/></g>`,
    patio: (c) => `<g fill="${c}"><rect x="2.5" y="13" width="9" height="7" rx="1"/><rect x="12.5" y="13" width="9" height="7" rx="1"/><rect x="7.5" y="5" width="9" height="7" rx="1"/></g>`,
    tanque: (c) => `<g ${trazo(c, 2)}><path d="M5 7.5c0-1.9 3.1-3.3 7-3.3s7 1.4 7 3.3v9c0 1.9-3.1 3.3-7 3.3s-7-1.4-7-3.3z"/><path d="M5 7.5c0 1.9 3.1 3.3 7 3.3s7-1.4 7-3.3"/></g>`,
    infra: (c) => `<g ${trazo(c, 2)}><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M4 10h16M10 10v10"/></g>`,
    camion: (c, f) => `<g fill="${c}"><path d="M1.8 6.5h11.4v9.7H1.8z"/><path d="M13.2 9.5h4.6l3.9 3.8v2.9h-8.5z"/><circle cx="6" cy="17.3" r="2.4" stroke="${f}" stroke-width="1.4"/><circle cx="17" cy="17.3" r="2.4" stroke="${f}" stroke-width="1.4"/></g><path d="M15 10.8h2.2l2 2H15z" fill="${f}"/>`,
    barcoLateral: (c) => `<g fill="${c}"><path d="M2.5 13.5h19l-2.6 5.8H5.1z"/><path d="M7 13.5V9h7.5v4.5z"/><path d="M9.2 9V5.5h2.4V9z"/></g>`,
    peaje: (c, f) => `<g fill="${c}"><path d="M3 20.5V8.5h6.5v12z"/><path d="M9.5 12.2H22v2.8H9.5z"/><path d="M2 20.5h9v1.5H2z"/></g><g fill="${f}"><rect x="4.4" y="10" width="3.7" height="3.2" rx=".5"/><path d="M12.5 12.2h2.3V15h-2.3zM17.3 12.2h2.3V15h-2.3z"/></g>`,
    nube: (c, f) => `<circle cx="8.5" cy="8" r="3.3" fill="none" stroke="${c}" stroke-width="2"/><path d="M8.5 2.2v1.2M3.6 4.1l.9.9M2.7 8h1.2" ${trazo(c, 2)}/><path d="M8 20.5h9.5a4 4 0 0 0 .3-8 5.2 5.2 0 0 0-9.9 1.6A3.2 3.2 0 0 0 8 20.5z" fill="${c}" stroke="${f}" stroke-width="1.2"/>`,
    alerta: (c, f) => `<path d="M12 2.8 22.6 20.8H1.4z" fill="${c}" stroke-linejoin="round"/><path d="M11 9.2h2l-.3 6.3h-1.4zM11 17h2v2h-2z" fill="${f}"/>`,
    cono: (c, f) => `<path d="M9.8 3.5h4.4l4.9 15.5H4.9z" fill="${c}"/><path d="M8.4 9.3h7.2v2.3H8.4zM7.1 13.6h9.8v2.3H7.1z" fill="${f}"/><rect x="3" y="18.6" width="18" height="2.6" rx="1" fill="${c}"/>`,
    prohibido: (c, f) => `<circle cx="12" cy="12" r="9.5" fill="${c}"/><rect x="6.5" y="10.4" width="11" height="3.2" rx="1" fill="${f}"/>`,
    semaforo: (c, f) => `<rect x="7.5" y="2" width="9" height="20" rx="2.5" fill="${c}"/><circle cx="12" cy="6.6" r="1.9" fill="${f}"/><circle cx="12" cy="12" r="1.9" fill="${f}"/><circle cx="12" cy="17.4" r="1.9" fill="${f}"/>`
};

const SOMBRA = `<defs><filter id="s" x="-40%" y="-40%" width="180%" height="180%"><feDropShadow dx="0" dy="1.4" stdDeviation="1.4" flood-color="#000" flood-opacity=".5"/></filter></defs>`;
const BLANCO = '#ffffff';

/** Marcador circular (activos y servicios). */
function marcadorCircular(id: string, glifo: string, color: string, colorGlifo = BLANCO): IconoMapa {
    const g = GLIFOS[glifo](colorGlifo, color);
    return {
        id, ancho: 40, alto: 40,
        svg: `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">${SOMBRA}` +
            `<circle cx="20" cy="20" r="16.5" fill="${color}" stroke="${BLANCO}" stroke-width="2.6" filter="url(#s)"/>` +
            `<g transform="translate(9 9) scale(.9167)">${g}</g></svg>`
    };
}

/** Marcador de infraestructura fija: cuadro redondeado, distinto de los activos que se mueven. */
function marcadorInfra(id: string, glifo: string, color: string): IconoMapa {
    const g = GLIFOS[glifo](BLANCO, color);
    return {
        id, ancho: 40, alto: 40,
        svg: `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">${SOMBRA}` +
            `<rect x="4" y="4" width="32" height="32" rx="9" fill="${color}" stroke="${BLANCO}" stroke-width="2.6" filter="url(#s)"/>` +
            `<g transform="translate(9 9) scale(.9167)">${g}</g></svg>`
    };
}

/** Señal vial (incidentes): la forma es la señal misma, con borde blanco para leerse sobre cualquier fondo. */
function marcadorSenal(id: string, glifo: string, color: string): IconoMapa {
    return {
        id, ancho: 40, alto: 40,
        svg: `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">${SOMBRA}` +
            `<circle cx="20" cy="20" r="16.5" fill="${BLANCO}" stroke="${color}" stroke-width="2.4" filter="url(#s)"/>` +
            `<g transform="translate(9 8.5) scale(.9167)">${GLIFOS[glifo](color, BLANCO)}</g></svg>`
    };
}

/** Grupo (cluster): halo del color de la entidad, glifo arriba; la cantidad la pinta la capa de texto debajo. */
function marcadorGrupo(id: string, glifo: string, color: string, colorGlifo = BLANCO): IconoMapa {
    return {
        id, ancho: 64, alto: 64,
        svg: `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">${SOMBRA}` +
            `<circle cx="32" cy="32" r="30" fill="${color}" fill-opacity=".25"/>` +
            `<circle cx="32" cy="32" r="23.5" fill="${color}" stroke="${BLANCO}" stroke-width="3" filter="url(#s)"/>` +
            `<g transform="translate(20.5 9.5) scale(.96)">${GLIFOS[glifo](colorGlifo, color)}</g></svg>`
    };
}

/** Nave vista desde arriba (proa hacia arriba: MapLibre la rota con el rumbo AIS). */
function marcadorNave(id: string, color: string): IconoMapa {
    return {
        id, ancho: 30, alto: 44,
        svg: `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="44" viewBox="0 0 30 44">${SOMBRA}` +
            `<path d="M15 2.5C20.5 9 22.6 14.5 22.6 19.5V37.5Q15 43 7.4 37.5V19.5C7.4 14.5 9.5 9 15 2.5Z" fill="${color}" stroke="${BLANCO}" stroke-width="2.4" stroke-linejoin="round" filter="url(#s)"/>` +
            `<rect x="10.6" y="26" width="8.8" height="6.2" rx="1.6" fill="${BLANCO}" fill-opacity=".92"/>` +
            `<circle cx="15" cy="13" r="1.8" fill="${BLANCO}"/></svg>`
    };
}

const N = COLORES_MAPA.nave;
export const ICONOS_MAPA: IconoMapa[] = [
    // Infraestructura
    marcadorInfra('infra-puerto', 'ancla', COLORES_MAPA.puerto),
    marcadorInfra('infra-terminal', 'grua', COLORES_MAPA.terminal),
    marcadorInfra('infra-muelle', 'muelle', COLORES_MAPA.muelle),
    marcadorInfra('infra-bodega', 'bodega', COLORES_MAPA.bodega),
    marcadorInfra('infra-silo', 'silo', COLORES_MAPA.silo),
    marcadorInfra('infra-patio', 'patio', COLORES_MAPA.patio),
    marcadorInfra('infra-tanque', 'tanque', COLORES_MAPA.tanque),
    marcadorInfra('infra-generica', 'infra', COLORES_MAPA.infraestructura),
    // Naves por estado AIS
    marcadorNave('nave-navegando', N['NAVEGANDO']),
    marcadorNave('nave-maniobra', N['EN MANIOBRA']),
    marcadorNave('nave-fondeado', N['FONDEADO']),
    marcadorNave('nave-atracado', N['ATRACADO']),
    marcadorNave('nave-detenido', N['DETENIDO']),
    marcadorNave('nave-alerta', N['ALERTA']),
    marcadorNave('nave-sin-estado', N['SIN_ESTADO']),
    marcadorGrupo('grupo-nave', 'barcoLateral', N['NAVEGANDO']),
    // Terrestre
    marcadorCircular('camion-ruta', 'camion', COLORES_MAPA.camionRuta),
    marcadorCircular('camion-detenido', 'camion', COLORES_MAPA.camionDetenido),
    marcadorGrupo('grupo-camion', 'camion', COLORES_MAPA.camionRuta),
    marcadorCircular('peaje', 'peaje', COLORES_MAPA.peaje, '#1c1917'),
    marcadorGrupo('grupo-peaje', 'peaje', COLORES_MAPA.peaje, '#1c1917'),
    // Riesgos viales
    marcadorSenal('incidente-accidente', 'alerta', COLORES_MAPA.incidente),
    marcadorSenal('incidente-obra', 'cono', COLORES_MAPA.obra),
    marcadorSenal('incidente-cierre', 'prohibido', COLORES_MAPA.cierre),
    marcadorSenal('incidente-congestion', 'semaforo', COLORES_MAPA.congestion),
    marcadorGrupo('grupo-incidente', 'alerta', COLORES_MAPA.incidente),
    // Clima
    marcadorCircular('clima', 'nube', COLORES_MAPA.clima),
    marcadorGrupo('grupo-clima', 'nube', COLORES_MAPA.clima)
];

/** Data URL de un ícono (para la leyenda en HTML). */
export function iconoDataUrl(id: string): string {
    const icono = ICONOS_MAPA.find((i) => i.id === id);
    return icono ? `data:image/svg+xml;charset=utf-8,${encodeURIComponent(icono.svg)}` : '';
}

/** Leyenda: mismos íconos que el mapa. */
export const LEYENDA_MAPA: Array<{ grupo: string; nota?: string; items: Array<{ icono?: string; color?: string; texto: string }> }> = [
    {
        grupo: 'Estado de muelles',
        nota: 'Borde continuo: confirmado por AIS · punteado: solo line-up',
        items: [
            { color: COLORES_MAPA.muelleEstado['LIBRE'], texto: 'Libre' },
            { color: COLORES_MAPA.muelleEstado['OCUPADO'], texto: 'Ocupado' },
            { color: COLORES_MAPA.muelleEstado['RESERVADO'], texto: 'Reservado (atraque en 24 h)' },
            { color: COLORES_MAPA.muelleEstado['MANTENIMIENTO'], texto: 'En mantenimiento' }
        ]
    },
    {
        grupo: 'Infraestructura portuaria',
        items: [
            { icono: 'infra-puerto', texto: 'Puerto' },
            { icono: 'infra-terminal', texto: 'Terminal' },
            { icono: 'infra-muelle', texto: 'Muelle' },
            { icono: 'infra-bodega', texto: 'Bodega' },
            { icono: 'infra-silo', texto: 'Silo' },
            { icono: 'infra-patio', texto: 'Patio de contenedores' },
            { icono: 'infra-tanque', texto: 'Tanque' }
        ]
    },
    {
        grupo: 'Motonaves (estado AIS · la proa indica el rumbo)',
        items: [
            { icono: 'nave-navegando', texto: 'Navegando' },
            { icono: 'nave-maniobra', texto: 'En maniobra' },
            { icono: 'nave-fondeado', texto: 'Fondeada' },
            { icono: 'nave-atracado', texto: 'Atracada' },
            { icono: 'nave-detenido', texto: 'Detenida' },
            { icono: 'nave-alerta', texto: 'Varada / emergencia' },
            { icono: 'nave-sin-estado', texto: 'Sin estado AIS' }
        ]
    },
    {
        grupo: 'Operación terrestre',
        items: [
            { icono: 'camion-ruta', texto: 'Camión en ruta' },
            { icono: 'camion-detenido', texto: 'Camión detenido (peaje, tráfico, cola, cargue o patio)' },
            { icono: 'peaje', texto: 'Peaje' }
        ]
    },
    {
        grupo: 'Riesgos y clima',
        items: [
            { icono: 'incidente-accidente', texto: 'Accidente / incidente' },
            { icono: 'incidente-obra', texto: 'Obra / mantenimiento' },
            { icono: 'incidente-cierre', texto: 'Cierre vial' },
            { icono: 'incidente-congestion', texto: 'Congestión' },
            { icono: 'clima', texto: 'Clima actual por puerto' }
        ]
    },
    {
        grupo: 'Grupos (clic para acercar)',
        items: [
            { icono: 'grupo-nave', texto: 'Motonaves agrupadas' },
            { icono: 'grupo-camion', texto: 'Camiones agrupados' },
            { icono: 'grupo-peaje', texto: 'Peajes agrupados' },
            { icono: 'grupo-incidente', texto: 'Incidentes agrupados' }
        ]
    },
    {
        grupo: 'Modo reproducir',
        nota: 'Solo mientras se reproduce: el camino de los últimos 15 min',
        items: [
            { color: COLORES_MAPA.recorridoNave, texto: 'Estela de una nave' },
            { color: COLORES_MAPA.recorridoCamion, texto: 'Estela de un camión' }
        ]
    }
];

/**
 * Registra los íconos en el mapa (una vez por estilo: setStyle borra las imágenes).
 * Se rasterizan al doble de resolución para que se vean nítidos en pantallas de alta densidad.
 */
export async function registrarIconosMapa(map: { hasImage(id: string): boolean; addImage(id: string, img: any, opts?: any): void }): Promise<void> {
    const ESCALA = 2;
    await Promise.all(ICONOS_MAPA.map(async (icono) => {
        if (map.hasImage(icono.id)) return;
        try {
            const img = new Image(icono.ancho * ESCALA, icono.alto * ESCALA);
            img.src = iconoDataUrl(icono.id);
            await img.decode();
            const canvas = document.createElement('canvas');
            canvas.width = icono.ancho * ESCALA;
            canvas.height = icono.alto * ESCALA;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            const datos = ctx.getImageData(0, 0, canvas.width, canvas.height);
            if (!map.hasImage(icono.id)) map.addImage(icono.id, datos, { pixelRatio: ESCALA });
        } catch (error) {
            console.error(`[Mapa] No se pudo dibujar el ícono ${icono.id}:`, error);
        }
    }));
}

/** Tipo de infraestructura a partir del texto de la base (tipo_infra / tipo). */
export function tipoInfraestructura(texto: string | null | undefined): string {
    const t = String(texto || '').toUpperCase();
    if (t.includes('SILO')) return 'silo';
    if (t.includes('BODEG') || t.includes('ALMAC') || t.includes('WAREHOUSE')) return 'bodega';
    if (t.includes('PATIO') || t.includes('CONTENED') || t.includes('DEPOT') || t.includes('DEPÓSITO')) return 'patio';
    if (t.includes('TANQ') || t.includes('GNL') || t.includes('GAS')) return 'tanque';
    if (t.includes('MUELLE') || t.includes('ATRAQ')) return 'muelle';
    return 'infraestructura';
}
