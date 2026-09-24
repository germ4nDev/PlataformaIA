export class PTLTipoWidgetModel {
    constructor(
        public idTipo?: number,
        public codigoTipo?: string,
        public nombreTipo?: string,
        public descripcion?: string,
        public estado?: boolean,
        public codigoUsuarioCreacion?: string,
        public fechaCreacion?: string,
        public codigoUsuarioModificacion?: string,
        public fechaModificacion?: string
    ) { }
}
