export class PTLTipoPagoModel {
    constructor(
        public tipoPagoId?: number,
        public codigoTipoPago?: string,
        public nombreTipoPago?: string,
        public descripcionTipo?: string,
        public estadoTipo?: boolean,
        public codigoUsuarioCreacion?: string,
        public fechaCreacion?: string,
        public codigoUsuarioModificacion?: string,
        public fechaModificacion?: string
    ) { }
}
