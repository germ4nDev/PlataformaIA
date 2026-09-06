export class PTLUsuarioRoleAPModel {
    constructor(
        public usuarioRoleId?: number,
        public codigoUsuarioRole?: string,
        public codigoUsuarioSC?: string,
        public codigoEmpresaSC?: string,
        public codigoRole?: string,
        public codigoAplicacion?: string,
        public codigoSuite?: string,
        public codigoTipoRole?: string,
        public estadoUsuarioRole?: boolean,
        public checked?: boolean,
        public nomSuscriptor?: string,
        public nomAplicacion?: string,
        public _acciones?: any,
        public codigoUsuarioCreacion?: string,
        public fechaCreacion?: string,
        public codigoUsuarioModificacion?: string,
        public codigoSuscriptor?: string,
        public fechaModificacion?: string
    ) { }
}
