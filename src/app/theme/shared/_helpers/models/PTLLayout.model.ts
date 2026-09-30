export class PTLLayoutModel {
    constructor(
        public layoutId?: number,
        public codigoLayout?: string,
        public codigoUsuario?: string,
        public codigoPestana?: string,
        public codigoWidget?: string,
        public posicion_x?: number,
        public posicion_y?: number,
        public cols?: number,
        public rows?: number,
        public config?: any,
        public codigoUsuarioCreacion?: string,
        public fechaCreacion?: string,
        public codigoUsuarioModificacion?: string,
        public fechaModificacion?: string
    ) { }
}
