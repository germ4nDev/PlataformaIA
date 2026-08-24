/***
 * clienteModel.ts
 * CREADO POR: German Valencia
 *
 *
 *
 * clienteId	int	Unchecked
codigoCliente	nvarchar(200)	Unchecked
nombre	nvarchar(50)	Unchecked
direccion	nvarchar(100)	Checked
identificacion	nvarchar(50)	Checked
telefono	nvarchar(50)	Checked
estado	bit	Unchecked
tipoLicenciaId	int	Checked
codigoLicencia	nvarchar(100)	Unchecked
fechaVencimiento	date	Unchecked
numUsers	int	Unchecked
tipoBD	nvarchar(50)	Unchecked
nomBD	nvarchar(50)	Unchecked
hostBD	nvarchar(50)	Unchecked
userBD	nvarchar(50)	Unchecked
passBD	nvarchar(50)	Unchecked
portBD	nvarchar(50)	Unchecked
smtpHost	nvarchar(50)	Unchecked
strCorreo	nvarchar(50)	Unchecked
strPassword	nvarchar(50)	Unchecked
insLog	bit	Unchecked
tipoSync	int	Unchecked
tipoLogin	int	Unchecked
idioma	nvarchar(50)	Unchecked
tipo_Empresa	int	Checked
logo	nvarchar(50)	Checked
usuarioCreacion	nvarchar(50)	Unchecked
fechaCreacion	date	Unchecked
usuarioModificacion	nvarchar(50)	Checked
fechaModificacion	date	Checked
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
export class ClienteModel {
    constructor(
        public clienteId?: number,
        public codigoCliente?: string,
        public codigoTipoEmpresa?: string,
        public nombre?: string,
        public direccion?: string,
        public identificacion?: string,
        public telefono?: string,
        public tipoLicenciaId?: number,
        public codigoLicencia?: string,
        public fechaVencimiento?: string,
        public numEmpresas?: number,
        public numUsers?: number,
        public tipoBD?: string,
        public nomBD?: string,
        public hostBD?: string,
        public userBD?: string,
        public passBD?: string,
        public smtpHost?: string,
        public strCorreo?: string,
        public strPassword?: string,
        public insLog?: boolean,
        public tipoSync?: number,
        public tipoLogin?: number,
        public idioma?: string,
        public logo?: string,
        public estado?: boolean,
        public nomEstado?: boolean,

        public usuarioCreacion?: string,
        public usuarioModificacion?: string,
        public fechaCreacion?: Date,
        public fechaModificacion?: Date,
        public dataLog?: any
    ) { }
}
