export class PTLTipoItemModel {
    constructor(
        public tipoItemId?: number,
        public codigoTipoItem?: string,
        public nombreTipo?: string,
        public descripcionTipo?: string,
        public iconoTipo?: string,
        public estadoTipo?: boolean,
        public nomEstado?: string,
        public codigoUsuarioCreacion?: string,
        public fechaCreacion?: string,
        public codigoUsuarioModificacion?: string,
        public fechaModificacion?: string
    ) { }
}
