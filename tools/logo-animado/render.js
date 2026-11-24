// Dibuja cada cuadro del logo VOS 91.3 animado (fondo transparente) como PNG.
// Uso: npm run build  (ver README.md)  ·  directo: node render.js <logo.svg> <carpeta-salida> <color-letras> [ancho] [fps]
const fs = require('fs');
const path = require('path');
const { Resvg } = require('@resvg/resvg-js');
const { svgPathProperties } = require('svg-path-properties');

const [, , srcSvg, outDir, letter = '#ffffff', widthArg = '1000', fpsArg = '30'] = process.argv;
const WIDTH = +widthArg, FPS = +fpsArg, T = 6; // segundos por vuelta
const FRAMES = Math.round(T * FPS);

const d = [...fs.readFileSync(srcSvg, 'utf8').matchAll(/<path d="([^"]+)"/g)].map((m) => m[1]);
const [O, S, V, N9, N3, N1, DOT] = d;
const len = (p) => new svgPathProperties(p).getTotalLength();
const LV = len(V), LS = len(S);

const OC = [633.5, 575.5];      // centro de la "O"
const LC = [627, 640];          // centro del logo
const VB = '0 328 1254 564';    // incluye espacio para las ondas

const clamp = (x) => Math.min(1, Math.max(0, x));
const prog = (t, a, b) => clamp((t - a) / (b - a));
const easeInOut = (x) => (x < 0.5 ? 4 * x ** 3 : 1 - (-2 * x + 2) ** 3 / 2);
const easeOut = (x) => 1 - (1 - x) ** 3;
const easeIn = (x) => x ** 3;
const easeOutBack = (x) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * (x - 1) ** 3 + c1 * (x - 1) ** 2; };
const lerpKeys = (x, keys) => { // keys: [[pos, val], ...] interpolación suave
    for (let i = 1; i < keys.length; i++) {
        if (x <= keys[i][0]) {
            const [p0, v0] = keys[i - 1], [p1, v1] = keys[i];
            return v0 + (v1 - v0) * easeInOut((x - p0) / (p1 - p0));
        }
    }
    return keys[keys.length - 1][1];
};
const scaleAt = ([cx, cy], s) => `translate(${cx} ${cy}) scale(${s}) translate(${-cx} ${-cy})`;
const f = (n) => +n.toFixed(4);

function frameSvg(t) {
    // 1) V y S se dibujan y luego se rellenan
    const draw = (L, a) => {
        const p = easeInOut(prog(t, a, a + 1.0));
        const fill = easeOut(prog(t, a + 0.8, a + 1.2));
        return `stroke="${letter}" stroke-width="4" stroke-linejoin="round" stroke-dasharray="${f(L)}" stroke-dashoffset="${f(L * (1 - p))}" stroke-opacity="${f(1 - fill)}" fill="${letter}" fill-opacity="${f(fill)}"`;
    };

    // 2) "O": aparece con rebote; luego late (2.0 s – 5.0 s)
    const pop = prog(t, 0.45, 1.25);
    let oScale = pop < 1 ? Math.max(0, easeOutBack(pop)) : 1;
    const oRot = -12 * (1 - easeOut(pop));
    const oOpacity = easeOut(prog(t, 0.45, 0.75));
    const beatEnv = prog(t, 1.8, 2.1) * (1 - prog(t, 4.7, 5.0));
    if (beatEnv > 0) {
        const beat = lerpKeys(((t - 1.8) % 0.9) / 0.9, [[0, 1], [0.15, 1.07], [0.3, 0.99], [0.45, 1.04], [1, 1]]);
        oScale *= 1 + (beat - 1) * beatEnv;
    }
    const gradAngle = (360 * t) / T; // da una vuelta completa: el loop no salta

    // 3) "91.3" sube cifra por cifra
    const digit = (p, i) => {
        const x = prog(t, 1.2 + i * 0.1, 1.7 + i * 0.1);
        const y = 60 * (1 - (x < 1 ? easeOutBack(x) : 1));
        return `<path fill="${letter}" fill-rule="evenodd" opacity="${f(easeOut(x))}" transform="translate(0 ${f(y)})" d="${p}"/>`;
    };

    // 4) Ondas de sonido desde la "O"
    let waves = '';
    const waveEnv = 1 - prog(t, 4.6, 5.0);
    for (let k = 0; k < 3; k++) {
        const local = t - 1.8 - k * 0.8;
        if (local < 0 || t > 5.0) continue;
        const ph = (local % 2.4) / 2.4;
        const op = 0.75 * (1 - ph) * waveEnv * prog(t, 1.8 + k * 0.8, 2.0 + k * 0.8);
        if (op <= 0.003) continue;
        waves += `<path fill="none" stroke="url(#g)" stroke-width="7" opacity="${f(op)}" transform="${scaleAt(OC, f(1 + 0.55 * easeOut(ph)))}" fill-rule="evenodd" d="${O}"/>`;
    }

    // 5) Brillo que cruza (2.2 s – 3.1 s)
    const sh = prog(t, 2.2, 3.1);
    const shine = sh > 0 && sh < 1
        ? `<g clip-path="url(#c)"><rect x="0" y="380" width="260" height="520" fill="url(#w)" transform="translate(${f(-200 + 1800 * easeInOut(sh))} 0) skewX(-18)"/></g>`
        : '';

    // 6) Salida (5.1 s – 5.8 s) para que el loop vuelva a empezar
    const out = prog(t, 5.1, 5.8);
    const gOpacity = 1 - easeIn(out);
    const gScale = 1 - 0.06 * easeIn(out);

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${VB}" width="1254" height="564">
<defs>
  <linearGradient id="g" gradientUnits="userSpaceOnUse" x1="446" y1="542" x2="790" y2="684" gradientTransform="rotate(${f(gradAngle)} ${OC[0]} ${OC[1]})">
    <stop stop-color="#FF0015"/><stop offset="0.22" stop-color="#FF0015"/><stop offset="0.4" stop-color="#C00052"/>
    <stop offset="0.54" stop-color="#6300B8"/><stop offset="0.7" stop-color="#1000FF"/><stop offset="0.84" stop-color="#004CFF"/>
    <stop offset="1" stop-color="#00DCFF"/>
  </linearGradient>
  <linearGradient id="w" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="0.5" stop-color="#fff" stop-opacity="0.85"/><stop offset="1" stop-color="#fff" stop-opacity="0"/>
  </linearGradient>
  <clipPath id="c">
    <path fill-rule="evenodd" clip-rule="evenodd" d="${O}"/><path d="${S}"/><path d="${V}"/>
    <path fill-rule="evenodd" clip-rule="evenodd" d="${N9}"/><path d="${N3}"/><path d="${N1}"/><path d="${DOT}"/>
  </clipPath>
</defs>
<g opacity="${f(gOpacity)}" transform="${scaleAt(LC, f(gScale))}">
  ${waves}
  <path ${draw(LV, 0.1)} d="${V}"/>
  <path fill="url(#g)" fill-rule="evenodd" opacity="${f(oOpacity)}" transform="${scaleAt(OC, f(oScale))} rotate(${f(oRot)} ${OC[0]} ${OC[1]})" d="${O}"/>
  <path ${draw(LS, 0.35)} d="${S}"/>
  ${digit(N9, 0)}${digit(N1, 1)}${digit(DOT, 2)}${digit(N3, 3)}
  ${shine}
</g>
</svg>`;
}

fs.mkdirSync(outDir, { recursive: true });
for (let i = 0; i < FRAMES; i++) {
    const png = new Resvg(frameSvg(i / FPS), { fitTo: { mode: 'width', value: WIDTH }, background: 'rgba(0,0,0,0)' }).render().asPng();
    fs.writeFileSync(path.join(outDir, String(i).padStart(4, '0') + '.png'), png);
}
console.log(`${FRAMES} cuadros (${WIDTH}px, ${FPS} fps) en ${outDir}`);
