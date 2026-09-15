/*
    Author: German Valencia
    Refactored for: QPLUS Architecture Pattern
*/
export class PTLSesionModel {
    constructor(
        public sesionId?: number,
        public codigoSesion?: string,
        public codigoUsuario?: string,
        public codigoSuscriptor?: string,
        public codigoSuite?: string,
        public codigoAplicacion?: string,
        public codigoModulo?: string,
        public nombreUsuario?: string,
        public rol?: string,
        public correo?: string,
        public dispositivo?: string,
        public activa?: boolean,
        public fechaLogin?: string,
        public fechaLogout?: string
    ) { }
}
