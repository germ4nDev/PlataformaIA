/*
    Author: German Valencia
    Pattern: PLATAFORMA Websites - Rutas públicas (núcleo puro, CC-177)
    Description: los websites viven en la carpeta de su aplicación (regla 27) y la plataforma los sirve bajo /websites/<sitio>.
      Lo que se ve sin sesión: la raíz (ahí decide el dominio) y todo /websites/…; el AppComponent no manda al login desde ahí.
*/
export function esRutaPublica(ruta: string | null | undefined): boolean {
  const r = String(ruta || '/').split(/[?#]/)[0].replace(/\/+$/, '') || '/';
  return r === '/' || r === '/websites' || r.startsWith('/websites/');
}
