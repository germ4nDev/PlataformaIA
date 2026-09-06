export class PTLTiposRoleModel {
    constructor(
        public tipoRoleId?: number,
        public codigoTipoRole?: string,
        public nombreTipoRole?: string,
        public descripcionTipoRole?: string,
        public estadoTipoRole?: boolean,
        public codigoUsuarioCreacion?: string,
        public fechaCreacion?: string,
        public codigoUsuarioModificacion?: string,
        public fechaModificacion?: string
    ) { }
}
