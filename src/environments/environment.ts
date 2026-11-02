
import packageInfo from '../../package.json';

// export const environment = {
//     appVersion: packageInfo.version,
//     production: true,
//     // API de producción (despliegue del 2026-10-29). La app móvil usa la misma dirección (PorttosMovil/src/environments/environment.prod.ts).
//     apiUrl: 'https://api.dymsites.co/api',
//     sctUrl: 'https://api.dymsites.co',
//     // Respaldo del multidominio (OT-012): la tabla PTLDominiosAP manda; esta lista solo se usa si el API no responde al arrancar
//     dominiosPortal: ['porttos.co', 'www.porttos.co']
// };

export const environment = {
    appVersion: packageInfo.version,
    production: false,
    apiUrl: 'http://localhost:3000/api',
    sctUrl: 'http://localhost:3000',
    // Respaldo del multidominio (OT-012; manda PTLDominiosAP). En local se simula un dominio con ?dominio=porttos.co
    dominiosPortal: [] as string[]
};

