
import packageInfo from '../../package.json';

// export const environment = {
//     appVersion: packageInfo.version,
//     production: true,
//     apiUrl: 'https://api.dymsites.co/api',
//     sctUrl: 'https://api.dymsites.co',
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

