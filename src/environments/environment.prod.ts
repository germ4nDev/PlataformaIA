import packageInfo from '../../package.json';

export const environment = {
    appVersion: packageInfo.version,
    production: true,
    // API de producción (despliegue del 2026-10-29). La app móvil usa la misma dirección (PorttosMovil/src/environments/environment.prod.ts).
    apiUrl: 'https://api.dymsites.co/api',
    sctUrl: 'https://api.dymsites.co',
    // Respaldo del multidominio (OT-012): la tabla PTLDominiosAP manda; esta lista solo se usa si el API no responde al arrancar
    dominiosPortal: ['porttos.co', 'www.porttos.co']
};
