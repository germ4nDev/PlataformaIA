/* eslint-disable @typescript-eslint/no-explicit-any */
export class PTLWidgetMaestroModel {
    constructor(
        // 🟢 Campos Base de Datos
        public widgetId?: number,
        public codigoWidget?: string,
        public codigoTipo?: string,
        public codigoPestana?: string,
        public codigoAplicacion?: string,
        public codigoSuite?: string,
        public nombreWidget?: string,
        public descripcionWidget?: string,
        public imagenWidget_light?: string,
        public imagenWidget_dark?: string,
        public defaultCols?: number,
        public defaultRows?: number,
        public pos_x?: number,
        public pos_y?: number,
        public offsetY?: number,
        public tipo?: string,
        public pestana?: string,
        public anclajeTipo?: string,
        public inicial?: boolean,
        public estadoWidget?: boolean,
        public layoutVersion?: number,
        /** Widget para el teléfono (migración 028): solo la app en el teléfono lo muestra; la web y la tableta no. */
        public movil?: boolean,
        /** Canal (migración 030, OT-017): 'web' (web y tableta) | 'telefono' | 'ambos'. Manda sobre movil. */
        public canal?: string,

        // 🟡 Campos Auxiliares para la UI (Tablas, Modales, Selecciones)
        public checked?: boolean,
        public nomInicial?: string,
        public nomEstado?: string,
        public nomCanal?: string,
        public _roles?: any,
        public _acciones?: any,

        // 🔵 Campos de Auditoría
        public codigoUsuarioCreacion?: string,
        public fechaCreacion?: string,
        public codigoUsuarioModificacion?: string,
        public fechaModificacion?: string
    ) { }
}
