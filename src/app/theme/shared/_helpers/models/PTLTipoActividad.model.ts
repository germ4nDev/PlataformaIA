export class PTLTipoActividadModel {
    constructor(
        public tipoActividadId?: number,
        public codigoTipoActividad?: string,
        public nombreTipoActividad?: string,
        public descripcionTipoActividad?: string,
        public estadoTipoActividad?: boolean,
        public codigoUsuarioCreacion?: string,
        public fechaCreacion?: string,
        public codigoUsuarioModificacion?: string,
        public fechaModificacion?: string
    ) { }
}
