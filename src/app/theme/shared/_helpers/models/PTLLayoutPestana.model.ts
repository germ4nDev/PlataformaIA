export class PTLLayoutPestanaModel {
    layoutPestanaId?: number;
    codigoUsuario: string = '';
    codigoPestana: string = '';
    posicion: number = 0;

    codigoUsuarioCreacion?: string;
    fechaCreacion?: string;
    codigoUsuarioModificacion?: string;
    fechaModificacion?: string;

    constructor(init?: Partial<PTLLayoutPestanaModel>) {
        Object.assign(this, init);
    }
}
