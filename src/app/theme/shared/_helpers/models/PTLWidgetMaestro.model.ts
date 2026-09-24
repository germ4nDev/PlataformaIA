/* eslint-disable @typescript-eslint/no-explicit-any */
export class PTLWidgetMaestroModel {
    constructor(
        // 🟢 Campos Base de Datos
        public widgetId?: number,
        public codigoWidget?: string,
        public codigoTipo?: string,
        public codigoPestana?: string,
        public nombreWidget?: string,
        public descripcionWidget?: string,
        public imagenWidget_light?: string,
        public imagenWidget_dark?: string,
        public defaultCols?: number,
        public defaultRows?: number,
        public pos_x?: number,
        public pos_y?: number,
        public tipo?: string,
        public pestana?: string,
        public inicial?: boolean,
        public estadoWidget?: boolean,
        public layoutVersion?: number,

        // 🟡 Campos Auxiliares para la UI (Tablas, Modales, Selecciones)
        public checked?: boolean,
        public nomInicial?: string,
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
