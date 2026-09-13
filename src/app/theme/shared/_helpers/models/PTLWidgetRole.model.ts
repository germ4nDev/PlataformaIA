export class PTLWidgetRoleModel {
    constructor(
        public idRelacion?: number,
        public codigoWidgetRole?: string,
        public codigoWidget?: string,
        public codigoRole?: string,
        public estadoRelacion?: boolean,
        public checked?: boolean,
        public nomRole?: string,
        public nomWidget?: string,
        public _acciones?: any,
        public codigoUsuarioCreacion?: string,
        public fechaCreacion?: string,
        public codigoUsuarioModificacion?: string,
        public codigoSuscriptor?: string,
        public fechaModificacion?: string
    ) { }
}
