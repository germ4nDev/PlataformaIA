export class PTLListaPreciosDetalleModel {
    constructor(
        public detalleListaId?: number,
        public codigoDetalle?: string,
        public codigoLista?: string,
        public tipoReferencia?: string,
        public codigoReferencia?: string,
        public valorMensual?: number,
        public valorAnual?: number,
        public precioSetup?: number,
        public estadoDetalle?: boolean,
        public codigoUsuarioCreacion?: string,
        public fechaCreacion?: string,
        public codigoUsuarioModificacion?: string,
        public fechaModificacion?: string,
    ) { }
}


