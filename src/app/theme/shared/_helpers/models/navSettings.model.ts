import { PTLAplicacionModel } from "./PTLAplicacion.model"
import { PTLModuloAP } from "./PTLModuloAP.model"
import { PTLSuiteAPModel } from "./PTLSuiteAP.model"
import { PTLSuscriptorModel } from "./PTLSuscriptor.model"

/* eslint-disable @typescript-eslint/no-explicit-any */
export class NavSettings {
    constructor(
        public aplicacion?: PTLAplicacionModel,
        public suite?: PTLSuiteAPModel,
        public modulo?: PTLModuloAP,
        public contexto?: any,
        public suscriptor?: PTLSuscriptorModel,
        public aplicaciones?: PTLAplicacionModel[],
    ) { }
}
