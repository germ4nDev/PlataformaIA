/*
    Núcleo puro (AD-16, prueba en _pruebas/empresa-permisos.test.js). CC-132.
    Elige el vínculo usuario–suscriptor y la empresa con la que se cargan los permisos (menú, botones) y que se manda a la sesión
    (validarPermiso del API). Web, tableta y teléfono (web embebida) usan la misma regla:
      1. la empresa ya elegida (navsettings.contexto) si pertenece al usuario y al suscriptor activo;
      2. la primera empresa con roles del suscriptor activo (el de la aplicación abierta);
      3. la primera empresa con roles de cualquier suscriptor; 4. la primera empresa. Sin empresas → null.
*/
/* eslint-disable @typescript-eslint/no-explicit-any */
export interface EleccionEmpresa {
  codigoUsuarioSC: string;
  codigoSuscriptor: string;
  codigoEmpresaSC: string;
}

interface Candidata extends EleccionEmpresa { conRoles: boolean; }

function candidatas(usuariosSC: any[]): Candidata[] {
  const salida: Candidata[] = [];
  for (const usu of usuariosSC || []) {
    for (const susc of usu?.suscriptores || []) {
      for (const emp of susc?.empresasAsignadas || []) {
        if (!emp?.codigoEmpresaSC) continue;
        salida.push({
          codigoUsuarioSC: usu.codigoUsuarioSC,
          codigoSuscriptor: susc.codigoSuscriptor,
          codigoEmpresaSC: emp.codigoEmpresaSC,
          conRoles: Array.isArray(emp.rolesAsignados) && emp.rolesAsignados.length > 0
        });
      }
    }
  }
  return salida;
}

export function empresaParaPermisos(
  usuariosSC: any[],
  preferida?: { codigoEmpresaSC?: string | null; codigoSuscriptor?: string | null } | null,
  suscriptorActivo?: string | null
): EleccionEmpresa | null {
  const todas = candidatas(usuariosSC);
  if (!todas.length) return null;
  const delActivo = suscriptorActivo ? todas.filter((c) => c.codigoSuscriptor === suscriptorActivo) : todas;
  const sinMarca = (c: Candidata | undefined): EleccionEmpresa | null =>
    c ? { codigoUsuarioSC: c.codigoUsuarioSC, codigoSuscriptor: c.codigoSuscriptor, codigoEmpresaSC: c.codigoEmpresaSC } : null;

  if (preferida?.codigoEmpresaSC) {
    const p = delActivo.find((c) => c.codigoEmpresaSC === preferida.codigoEmpresaSC
      && (!preferida.codigoSuscriptor || c.codigoSuscriptor === preferida.codigoSuscriptor));
    if (p) return sinMarca(p);
  }
  return sinMarca(delActivo.find((c) => c.conRoles) || todas.find((c) => c.conRoles) || todas[0]);
}
