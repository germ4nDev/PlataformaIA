/* eslint-disable @typescript-eslint/no-explicit-any */
export class PTLParametroSistemaModel {
    constructor(
        // Campos principales de la Base de Datos
        public parametroId?: number,
        public codigoParametro?: string,
        public llaveParametro?: string,
        public nombreParametro?: string,
        public descripcionParametro?: string,
        public valorParametro?: string,
        public tipoDato?: string,
        public estadoParametro?: boolean,

        // Campos auxiliares para la UI de QPLUS (Tablas y Formularios)
        public checked?: boolean,
        public nomEstado?: string,
        public _acciones?: any[],

        // Auditoría QPLUS
        public codigoUsuarioCreacion?: string,
        public fechaCreacion?: string,
        public codigoUsuarioModificacion?: string,
        public fechaModificacion?: string
    ) { }
}
