export interface Motonave {
    motonave: string;
    naviera: string;
    lineaAgencia: string;
    terminal: string;
    eta: string;
    ata: string;
    fechaAtraque: string;     // Añadido para el HTML
    carga: string;
    trabajoOperacion: string; // Añadido para el HTML
    posicion: string;         // Añadido para el HTML
    estadoTexto: string;      // Añadido para el HTML
    estadoClase: string;
    puerto: string;
    // Line-up completo (Fase 3 · vista ampliada); opcionales porque no todas las fuentes los traen
    muelle?: string | null;
    viaje?: string | null;
    eslora?: number | null;
    zarpe?: string | null;
    novedades?: string | null;
    etaIso?: string | null;
    /** ETA ya pasó y no hay ATA. */
    atrasada?: boolean;
}

export interface VesselTableModel {
    titulo: string;
    subtitulo: string;
    icono: string;
    cargandoIA: boolean;
    motonaves: Motonave[];
}
