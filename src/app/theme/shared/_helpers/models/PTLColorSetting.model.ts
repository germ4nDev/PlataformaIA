export class PTLColorSettingModel {
    constructor(
        public colorNavId?: number,
        public codigoColorSetting?: string,
        public navbarColor?: string,
        public textoColor?: string,
        public iconosColor?: string,
        public buttonsHoverColor?: string,
        public estadoColor?: boolean,
        public nomEstado?: string,
        public codigoUsuarioCreacion?: string,
        public fechaCreacion?: string,
        public codigoUsuarioModificacion?: string,
        public fechaModificacion?: string
    ) { }
}
