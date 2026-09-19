export class PTLListaPreciosModel {
    constructor(
        public listaPrecioId?: number,
        public codigoLista?: string,
        public nombreLista?: string,
        public moneda?: string,
        public paisAplica?: string,
        public fechaInicio?: string,
        public fechaFin?: string,
        public estadoLista?: boolean,
        public codigoUsuarioCreacion?: string,
        public fechaCreacion?: string,
        public codigoUsuarioModificacion?: string,
        public fechaModificacion?: string,
    ) { }
}
