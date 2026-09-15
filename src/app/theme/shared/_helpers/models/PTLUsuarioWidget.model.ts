export class PTLUsuarioWidgetModel {
    constructor(
        public id?: number,
        public codigoUsuario?: string,
        public codigoWidget?: string,
        public pestana?: string,
        public cols?: number,
        public rows?: number,
        public x?: number,
        public y?: number,
        public visible?: boolean,
        public codigoUsuarioCreacion?: string,
        public fechaCreacion?: string,
        public codigoUsuarioModificacion?: string,
        public fechaModificacion?: string
    ) { }
}

