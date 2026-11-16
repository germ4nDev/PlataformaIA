/*
    Author: German Valencia
    Pattern: PLATAFORMA Núcleo (puro, AD-16) - Textos de la compilación (OT-034, CC-200)
    Description: el JSON de textos de la compilación de una app trae `_compilacion.sinPrefijos` (scripts/i18n-compilacion.js): los
      prefijos de las otras apps. Aquí se quita esa marca y se filtra igual lo que llega del API (Utilidades › Traducciones), para que
      una app no reciba los textos de las demás. La plataforma no trae la marca: todo igual que antes. Probado en
      _pruebas/compilaciones-aisladas.test.js.
*/
export function mezclarArboles(base: any, encima: any): any {
    if (!encima || typeof encima !== 'object' || Array.isArray(encima)) return encima ?? base;
    const r: any = base && typeof base === 'object' && !Array.isArray(base) ? { ...base } : {};
    for (const k of Object.keys(encima)) r[k] = mezclarArboles(r[k], encima[k]);
    return r;
}

export function textosDeLaCompilacion(build: any, api: any): any {
    const b: any = build && typeof build === 'object' ? { ...build } : {};
    const quitar: string[] = Array.isArray(b._compilacion?.sinPrefijos) ? b._compilacion.sinPrefijos : [];
    delete b._compilacion;
    const a: any = api && typeof api === 'object' && !Array.isArray(api) ? { ...api } : {};
    for (const p of quitar) delete a[p];
    return mezclarArboles(b, a);
}
