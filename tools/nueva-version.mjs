#!/usr/bin/env node
/**
 * Sube la versión del sitio antes de publicar, para que TODOS reciban los archivos nuevos
 * (quien ya instaló la app y quien ya abrió la página en el navegador).
 *
 *   node tools/nueva-version.mjs          → siguiente número (70 → 71)
 *   node tools/nueva-version.mjs 80       → número indicado
 *
 * Qué cambia:
 *   1. sw.js                → ASSET_VERSION (el service worker nuevo reemplaza al viejo y borra su caché)
 *   2. index.html           → ?v=N en los <link> de css/ y <script> de js/
 *   3. js/**                → ?v=N en los import relativos ("./x.js", "../y.js")
 * Como cada archivo cambia de dirección (styles.css?v=71), ninguna caché puede servir uno viejo.
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");
const leer = (p) => readFileSync(join(raiz, p), "utf8");
const escribir = (p, s) => writeFileSync(join(raiz, p), s);

// 1) Versión actual y nueva
let sw = leer("sw.js");
const actual = sw.match(/const ASSET_VERSION = "(\d+)";/);
if (!actual) {
    console.error('No encontré `const ASSET_VERSION = "N";` en sw.js');
    process.exit(1);
}
const nueva = process.argv[2] ?? String(Number(actual[1]) + 1);
if (!/^\d+$/.test(nueva)) {
    console.error(`Versión inválida: "${nueva}" (usa solo números)`);
    process.exit(1);
}
sw = sw.replace(actual[0], `const ASSET_VERSION = "${nueva}";`);
escribir("sw.js", sw);

// 2) index.html: css/… y js/… locales
let html = leer("index.html");
let enHtml = 0;
html = html.replace(/((?:href|src)=")((?:css|js)\/[^"?]+\.(?:css|js))(?:\?v=[^"]*)?(")/g, (_, a, ruta, c) => {
    enHtml++;
    return `${a}${ruta}?v=${nueva}${c}`;
});
escribir("index.html", html);

// 3) import relativos en js/
let enJs = 0;
const archivos = [];
(function recorrer(dir) {
    for (const nombre of readdirSync(join(raiz, dir))) {
        const ruta = join(dir, nombre);
        if (statSync(join(raiz, ruta)).isDirectory()) recorrer(ruta);
        else if (nombre.endsWith(".js")) archivos.push(ruta);
    }
})("js");
for (const ruta of archivos) {
    const antes = leer(ruta);
    const despues = antes.replace(/(from\s+["'])(\.{1,2}\/[^"'?]+\.js)(?:\?v=[^"']*)?(["'])/g, (_, a, spec, c) => {
        enJs++;
        return `${a}${spec}?v=${nueva}${c}`;
    });
    if (despues !== antes) escribir(ruta, despues);
}

console.log(`Versión ${actual[1]} → ${nueva}`);
console.log(`  sw.js: ASSET_VERSION = "${nueva}"`);
console.log(`  index.html: ${enHtml} archivos css/js con ?v=${nueva}`);
console.log(`  js/: ${enJs} import con ?v=${nueva}`);
console.log("Listo para publicar. Sube TODOS los archivos (incluido sw.js).");
