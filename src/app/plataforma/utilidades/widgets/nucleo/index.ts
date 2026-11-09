/* eslint-disable @typescript-eslint/no-explicit-any */
/*
  Núcleo puro de la administración de widgets (Utilidades → Widgets y Widgets por rol). Sin Angular: lo prueba
  _pruebas/admin-widgets.test.js. Lo usan widgets.component, gestion-widget y gestion-widget-roles.
*/
/** Canal del widget para el formulario y el filtro: canal (migración 030) o, sin él, movil (028). */
export function canalDelFormulario(w: { canal?: string; movil?: boolean | number | string }): 'web' | 'telefono' | 'ambos' {
    const c = String(w?.canal ?? '').trim().toLowerCase();
    if (c === 'web' || c === 'telefono' || c === 'ambos') return c;
    return esVerdadero(w?.movil) ? 'telefono' : 'web';
}

/** Canal de un widget para la tabla (OT-017): web y tableta, solo teléfono o los tres equipos. */
export function canalDelWidget(w: { canal?: string; movil?: boolean | number | string }): string {
    const c = canalDelFormulario(w);
    return c === 'telefono' ? 'Teléfono' : c === 'ambos' ? 'Ambos' : 'Web y tableta';
}

/** Solo los campos de PTLWidgetsMaestro (sin los auxiliares de la tabla) para enviarlos al API. */
export function camposDelWidget(w: any): any {
    const campos = ['codigoWidget', 'codigoTipo', 'codigoPestana', 'codigoAplicacion', 'codigoSuite', 'nombreWidget',
        'descripcionWidget', 'imagenWidget_light', 'imagenWidget_dark', 'defaultCols', 'defaultRows', 'pos_x', 'pos_y',
        'layoutVersion', 'inicial', 'anclajeTipo', 'offsetY', 'estadoWidget', 'movil', 'canal',
        // Auditoría: sin ellos el API pone 'SISTEMA_ADMIN' como creador al actualizar.
        'codigoUsuarioCreacion', 'fechaCreacion'];
    const r: any = {};
    for (const c of campos) if (w?.[c] !== undefined && w?.[c] !== null) r[c] = w[c];
    if (r.movil !== undefined) r.movil = esVerdadero(r.movil);
    // canal manda (030); movil queda igual a (canal = 'telefono') para compatibilidad
    if (r.canal !== undefined || r.movil !== undefined) {
        r.canal = canalDelFormulario(r);
        r.movil = r.canal === 'telefono';
    }
    return r;
}

/** true si el valor viene como booleano o bit de SQL Server encendido. */
export function esVerdadero(v: any): boolean {
    return v === true || v === 1 || v === '1' || v === 'true';
}

/**
 * Roles que se ofrecen para un widget: activos y de la misma aplicación del widget (los roles de otras aplicaciones de
 * la plataforma no aplican). Cada uno con checked = tiene relación activa con el widget.
 */
export function rolesParaWidget(roles: any[], relaciones: any[], widget: { codigoWidget?: string; codigoAplicacion?: string }): any[] {
    // Sin distinguir mayúsculas: hubo widgets guardados con la aplicación en mayúsculas (OT-015, CC-113)
    const app = String(widget?.codigoAplicacion || '').toLowerCase();
    return (roles || [])
        .filter((r) => esVerdadero(r.estadoRole) && (!app || String(r.codigoAplicacion || '').toLowerCase() === app))
        .map((r) => {
            const rel = (relaciones || []).find((x) =>
                (x.codigoRole ?? x.codigoRol) === r.codigoRole && x.codigoWidget === widget?.codigoWidget);
            return { ...r, checked: !!rel && (rel.estadoRelacion === undefined || esVerdadero(rel.estadoRelacion)) };
        });
}
