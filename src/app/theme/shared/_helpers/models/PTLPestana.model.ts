export class PTLPestanaModel {
    constructor(
        public idPestana?: number,
        public codigoPestana?: string,
        public nombrePestana?: string,
        public orden?: number,
        public descripcion?: string,
        public estado?: boolean,
        public codigoUsuarioCreacion?: string,
        public fechaCreacion?: string,
        public codigoUsuarioModificacion?: string,
        public fechaModificacion?: string
    ) { }
}
