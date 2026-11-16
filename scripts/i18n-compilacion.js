/*
    Author: German Valencia
    Pattern: PLATAFORMA - Textos de la compilación de una aplicación (OT-034, CC-200)
    Description: `node scripts/i18n-compilacion.js <app>` arma .i18n-compilacion/<app>/{es,en}.json desde src/assets/i18n (la única fuente,
      reglas 22 y 23): el núcleo y los textos de la app, sin los de las demás aplicaciones (su prefijoLlaves en
      src/app/apps/<app>/app.manifest.json). Deja `_compilacion` con los prefijos quitados para que el cargador de traducciones filtre
      también lo que llega del API. Lo corren los scripts start:<app> y build:<app>; la carpeta no se versiona.
*/
const fs = require('fs');
const path = require('path');

const RAIZ = path.resolve(__dirname, '..');
const APPS = path.join(RAIZ, 'src/app/apps');
const IDIOMAS = ['es', 'en'];

function prefijosDeApps(dirApps = APPS) {
    const out = {};
    for (const app of fs.readdirSync(dirApps)) {
        const m = path.join(dirApps, app, 'app.manifest.json');
        if (!fs.existsSync(m)) continue;
        const pref = JSON.parse(fs.readFileSync(m, 'utf8')).prefijoLlaves;
        if (pref) out[app] = pref;
    }
    return out;
}

/** El árbol de textos para la compilación de `app`: sin los prefijos de las otras apps, con `_compilacion`. */
function textosDeCompilacion(arbol, app, prefijos) {
    if (!prefijos[app]) throw new Error(`La aplicación ${app} no tiene prefijoLlaves en su app.manifest.json`);
    const quitar = Object.entries(prefijos).filter(([a]) => a !== app).map(([, p]) => p).sort();
    const out = {};
    for (const [k, v] of Object.entries(arbol)) if (!quitar.includes(k)) out[k] = v;
    out._compilacion = { aplicacion: app, sinPrefijos: quitar };
    return out;
}

function generar(app) {
    const prefijos = prefijosDeApps();
    const destino = path.join(RAIZ, '.i18n-compilacion', app);
    fs.mkdirSync(destino, { recursive: true });
    for (const l of IDIOMAS) {
        const arbol = JSON.parse(fs.readFileSync(path.join(RAIZ, 'src/assets/i18n', `${l}.json`), 'utf8'));
        fs.writeFileSync(path.join(destino, `${l}.json`), JSON.stringify(textosDeCompilacion(arbol, app, prefijos)));
    }
    console.log(`textos de ${app} en .i18n-compilacion/${app} (sin ${Object.values(prefijos).filter((p) => p !== prefijos[app]).join(', ') || 'nada'})`);
}

module.exports = { prefijosDeApps, textosDeCompilacion };

if (require.main === module) {
    const app = process.argv[2];
    if (!app) {
        console.error('Uso: node scripts/i18n-compilacion.js <app>');
        process.exit(1);
    }
    generar(app);
}
