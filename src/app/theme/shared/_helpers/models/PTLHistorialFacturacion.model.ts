export class PTLHistorialFacturacionModel {
    constructor(
        public historialId?: number,
        public codigoHistorial?: string,
        public codigoSuscriptor?: string,
        public codigoLicencia?: string,
        public codigoTipoPago?: string,
        public codigoPaquete?: string,
        public fechaPago?: string,
        public numFactura?: string,
        public montoPagado?: number,
        public numeroCuota?: number,
        public estadoPago?: boolean,
        public nomEstado?: string,
        public codigoUsuarioCreacion?: string,
        public fechaCreacion?: string,
        public codigoUsuarioModificacion?: string,
        public fechaModificacion?: string
    ) { }
}
