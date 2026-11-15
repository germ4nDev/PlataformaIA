import { withNativeFederation, fromPackageJson } from '@angular-architects/native-federation/config';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// @ngx-translate/core 15 y http-loader 8 publican en package.json una entrada 'esm' que apunta a un archivo que no existe
// (./esm2022/…; el real está en dist/fesm2022). Native Federation usa esa entrada: se le da la correcta (OT-034).
const entradaNgxTranslate = (paquete, archivo) => {
  const raiz = resolve('node_modules', paquete);
  const { version } = JSON.parse(readFileSync(resolve(raiz, 'package.json'), 'utf8'));
  return { packageInfo: { entryPoint: resolve(raiz, 'dist/fesm2022', archivo), version, esm: true } };
};

export default withNativeFederation({
  name: 'full-version',

  //shareScope: autoShareScope({level: 'minor'}),

  shared: fromPackageJson({ singleton: true, strictVersion: true, requiredVersion: 'auto', build: 'package' })
    // Solo lo que la plataforma y sus remotos deben tener como instancia única (OT-034). Compartir todo package.json arrastraba
    // paquetes de Node (las schematics de @angular/cdk con keepAll) que no corren en el navegador
    .only(['@angular/*', '@ngx-translate/*', 'rxjs', 'tslib'])
    .patch(['@angular/*'], { includeSecondaries: true })
    .patch(['@ngx-translate/core'], entradaNgxTranslate('@ngx-translate/core', 'ngx-translate-core.mjs'))
    .patch(['@ngx-translate/http-loader'], entradaNgxTranslate('@ngx-translate/http-loader', 'ngx-translate-http-loader.mjs')),

  // El alias src/* de tsconfig (en lugar de baseUrl) es código propio de cada aplicación, no una librería compartida (OT-034)
  sharedMappings: [],

  // datatables.net y socket.io-client: Native Federation no comparte paquetes con punto en el nombre (vite #21036); la plataforma
  // los empaqueta para sí y ningún remoto los necesita por ahora (OT-034)
  skip: ['rxjs/ajax', 'rxjs/fetch', 'rxjs/testing', 'rxjs/webSocket', '@angular/cdk/schematics', 'datatables.net', 'datatables.net-buttons', 'datatables.net-colreorder', 'datatables.net-dt', 'datatables.net-responsive', 'datatables.net-select', 'socket.io-client'],

  // Please read our docs about configuring native federation:
  // https://native-federation.com/docs/v4/angular-adapter/configuration/

  features: {
    denseChunking: true,
    denseExternals: true,
    strictImports: false
  }
});
