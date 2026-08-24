export class PTLTipoPaqueteModel {
    constructor(
        public tipoPaqueteId?: number,
        public codigoTipoPaquete?: string,
        public nombreTipoPaquete?: string,
        public descripcionTipo?: string,
        public numMeses?: number,
        public descuentoMeses?: number,
        public estadoTipo?: boolean,
        public codigoUsuarioCreacion?: string,
        public fechaCreacion?: string,
        public codigoUsuarioModificacion?: string,
        public fechaModificacion?: string
    ) { }
}
