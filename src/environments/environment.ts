
import packageInfo from '../../package.json';

export const environment = {
    appVersion: packageInfo.version,
    production: true,
    apiUrl: 'https://porttosapi.porttos.co/api',
    sctUrl: 'https://porttosapi.porttos.co'
};

// export const environment = {
//     appVersion: packageInfo.version,
//     production: false,
//     apiUrl: 'http://localhost:3000/api',
//     sctUrl: 'http://localhost:3000'
// };

