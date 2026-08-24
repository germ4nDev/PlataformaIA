/* eslint-disable @typescript-eslint/no-explicit-any */
export class FuncionarioModel {
    constructor(
        public id_funcionario?: number,
        public codigoFuncionario?: string,
        public codigoEmpresa?: string,
        public codigoCargo?: string,
        public codigoZona?: string,
        public codigoOficina?: string,
        public codigoSede?: string,
        public codigoTipoContrato?: string,
        public identificacion?: number,
        public nombre?: string,
        public genero?: number,
        public email?: string,
        public cenco?: number,
        public nivelSeguridad?: number,
        public nuevo?: boolean,
        public estadoPerfil?: boolean,
        public hojadevida?: boolean,
        public indiEstrategico?: boolean,
        public fechaIngreso?: string,
        public sueldo?: number,
        public estado?: boolean,
        public nomEstado?: boolean,

        public usuarioCreacion?: string,
        public usuarioModificacion?: string,
        public fechaCreacion?: Date,
        public fechaModificacion?: Date,
        public dataLog?: any
    ) { }
}
