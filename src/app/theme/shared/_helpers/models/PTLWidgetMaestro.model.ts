/* eslint-disable @typescript-eslint/no-explicit-any */
export class PTLWidgetMaestroModel {
    constructor(
        // 🟢 Campos Base de Datos
        public widgetId?: number,
        public codigoWidget?: string,
        public nombreWidget?: string,
        public descripcionWidget?: string,
        public imagenWidget?: string,
        public defaultCols?: number,
        public defaultRows?: number,
        public pestana?: string,
        public estadoWidget?: boolean,
        public layoutVersion?: number,

        // 🟡 Campos Auxiliares para la UI (Tablas, Modales, Selecciones)
        public checked?: boolean,
        public nomEstado?: string,
        public _roles?: any,
        public _acciones?: any,

        // 🔵 Campos de Auditoría
        public codigoUsuarioCreacion?: string,
        public fechaCreacion?: string,
        public codigoUsuarioModificacion?: string,
        public fechaModificacion?: string
    ) { }
}
