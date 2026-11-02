/*
    Author: German Valencia
    Pattern: PLATAFORMA Núcleo puro - Armado de la sesión (OT-014, CC-109)
    Description: Lo que el login y la entrada a una aplicación hacían en línea, como pieza común sin Angular ni red:
      - normalizarListasSesion: las respuestas de los servicios (cada una con su propia envoltura) a arreglos.
      - armarUsuariosSC: usuario → suscriptores → empresas asignadas (con sus roles) y paquetes activos (con sus módulos).
      - rolesYWidgetsDeAplicacion: roles del usuario en la aplicación y widgets que esos roles permiten.
      - contextoDeUsuario: empresa y usuario de suscriptor por defecto (los primeros).
    Lo usan el login, la entrada a una aplicación y el modo embebido de la app (la tableta).
*/

/* eslint-disable @typescript-eslint/no-explicit-any */
export interface ListasSesion {
  usuariosSC: any[];
  usuariosEmpresasSC: any[];
  empresasSC: any[];
  suscriptores: any[];
  paquetesSC: any[];
  modulosPQ: any[];
  usuariosRoles: any[];
  rolesMaestros: any[];
}

/** La lista dentro de la respuesta: la primera clave que traiga un arreglo, o la respuesta si ya es uno; si no, vacía. */
export function listaDe(resp: unknown, ...claves: string[]): any[] {
  if (Array.isArray(resp)) return resp;
  if (resp && typeof resp === 'object') {
    for (const c of claves) {
      const v = (resp as Record<string, unknown>)[c];
      if (Array.isArray(v)) return v;
    }
  }
  return [];
}

export function normalizarListasSesion(data: Record<string, unknown>): ListasSesion {
  return {
    usuariosSC: listaDe(data['usuariosSC'], 'usuariosSC', 'usuarios'),
    usuariosEmpresasSC: listaDe(data['usuariosEmpresasSC'], 'usuariosEmpresasSC'),
    empresasSC: listaDe(data['empresasSC'], 'empresasSC', 'empresas'),
    suscriptores: listaDe(data['suscriptores'], 'suscriptores'),
    paquetesSC: listaDe(data['paquetesSC'], 'paquetesSC'),
    modulosPQ: listaDe(data['modulosPQ'], 'modulosPQ'),
    usuariosRoles: listaDe(data['usuariosRoles'], 'usuariosRoles', 'usuarioRole'),
    rolesMaestros: listaDe(data['rolesMaestros'], 'roles', 'data'),
  };
}

/** Árbol del usuario: sus usuarios de suscriptor, cada uno con sus suscriptores, empresas (y roles) y paquetes (y módulos). */
export function armarUsuariosSC(codigoUsuario: string | null | undefined, l: ListasSesion): any[] {
  return l.usuariosSC
    .filter((x) => x.codigoUsuario === codigoUsuario)
    .map((usuSC) => {
      const suscriptores = l.suscriptores
        .filter((x) => x.codigoSuscriptor === usuSC.codigoSuscriptor)
        .map((susc) => {
          const empresasAsignadas: any[] = [];
          l.usuariosEmpresasSC
            .filter((x) => x.codigoUsuarioSC === usuSC.codigoUsuarioSC)
            .forEach((usuEmp) => {
              const emp = l.empresasSC.find((x) => x.codigoEmpresaSC === usuEmp.codigoEmpresaSC);
              if (!emp || emp.codigoSuscriptor !== susc.codigoSuscriptor) return;
              const rolesAsignados = l.usuariosRoles
                .filter((rol) => rol.codigoUsuarioSC === usuSC.codigoUsuarioSC && rol.codigoEmpresaSC === emp.codigoEmpresaSC
                  && rol.estadoUsuarioRole === true)
                .map((rolUsuario) => {
                  const detalleRol = l.rolesMaestros.find((r) => r.codigoRole === rolUsuario.codigoRole);
                  return { ...rolUsuario, detalleRole: detalleRol || null, nombreRolLegible: detalleRol ? detalleRol.nombreRole : 'DESCONOCIDO' };
                });
              empresasAsignadas.push({ ...usuEmp, empresa: emp, rolesAsignados });
            });
          const paquetesActivos = l.paquetesSC
            .filter((paq) => paq.codigoSuscriptor === susc.codigoSuscriptor && paq.estadoLicencia === true)
            .map((paq) => ({ ...paq, modulosPaquete: l.modulosPQ.filter((mod) => mod.codigoPaquete === paq.codigoPaquete) }));
          return { ...susc, empresasAsignadas, paquetesActivos };
        });
      return { ...usuSC, suscriptores };
    });
}

export interface DatosRolesAplicacion {
  codigoUsuario: string | null | undefined;
  codigoAplicacion: string | null | undefined;
  usuariosSC: any[];
  roles: any[];
  usuariosRoles: any[];
  widgetsMaestro: any[];
  widgetsRoles: any[];
}

/** Roles del usuario (con `role` cuando el rol es de la aplicación) y los widgets que esos roles permiten, sin repetir. */
export function rolesYWidgetsDeAplicacion(d: DatosRolesAplicacion): { roles: any[]; widgets: any[] } {
  const usuSC = d.usuariosSC.find((x) => x.codigoUsuario == d.codigoUsuario);
  const rolesApp = d.roles.filter((x) => x.codigoAplicacion == d.codigoAplicacion);
  const permitidos = new Map<string, any>();
  const roles = d.usuariosRoles
    .filter((x) => x.codigoUsuarioSC == usuSC?.codigoUsuarioSC)
    .map((usuRole) => {
      const role = rolesApp.find((x) => x.codigoRole == usuRole.codigoRole);
      if (role) {
        d.widgetsRoles
          .filter((wr) => wr.codigoRole === role.codigoRole && wr.estadoRelacion === true)
          .forEach((asignacion) => {
            const widget = d.widgetsMaestro.find((w) => w.codigoWidget === asignacion.codigoWidget);
            if (widget) permitidos.set(widget.codigoWidget, widget);
          });
      }
      return { ...usuRole, role };
    });
  return { roles, widgets: Array.from(permitidos.values()) };
}

/** Empresa y usuario de suscriptor por defecto (los primeros del árbol), como los usa la navegación. */
export function contextoDeUsuario(current: any): { codigoEmpresaSC: string; codigoUsuarioSC: string } {
  return {
    codigoEmpresaSC: current?.usuariosSC?.[0]?.suscriptores?.[0]?.empresasAsignadas?.[0]?.codigoEmpresaSC || '',
    codigoUsuarioSC: current?.usuariosSC?.[0]?.codigoUsuarioSC || '',
  };
}
