/**
 * Gera as capas dos compêndios em SVG.
 *
 * O sistema OD2 traz 9 banners prontos, mas são arte medieval — um cavaleiro
 * na capa de "Star Wars: Espécies" fica pior que capa nenhuma. Estes são
 * autorais e abstratos: gradiente, campo de estrelas e um emblema geométrico
 * por pack. Nada de arte licenciada, nada de silhueta reconhecível.
 *
 * O campo de estrelas usa um gerador congruencial com semente fixa — Math.random
 * geraria um arquivo diferente a cada execução e sujaria o diff sem motivo.
 *
 * As cores são as do Star Dragon trocadas por brasa e o amarelo do letreiro:
 * com os dois módulos ligados no mesmo mundo, a capa diz de qual é o
 * compêndio antes de ler o nome.
 *
 * Uso: node tools/make-banners.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(fileURLToPath(import.meta.url), "../..");
const OUT = path.join(ROOT, "starwars-sd-module", "assets", "banners");

const L = 600;
const A = 200;

// Emblemas: traço claro sobre o fundo, centralizados à direita.
const EMBLEMAS = {
  especies: `
    <circle cx="470" cy="86" r="30"/>
    <circle cx="500" cy="112" r="30"/>
    <circle cx="440" cy="112" r="30"/>`,
  classes: `
    <path d="M420 128 L470 92 L520 128"/>
    <path d="M420 106 L470 70 L520 106"/>
    <path d="M420 150 L470 114 L520 150"/>`,
  equipamentos: `
    <circle cx="470" cy="100" r="34"/>
    <path d="M470 52 L470 78 M470 122 L470 148 M422 100 L448 100 M492 100 L518 100"/>
    <circle cx="470" cy="100" r="6"/>`,
  poderes: `
    <circle cx="470" cy="100" r="16"/>
    <path d="M470 66 A34 34 0 0 1 504 100"/>
    <path d="M470 134 A34 34 0 0 1 436 100"/>
    <path d="M470 52 A48 48 0 0 1 518 100"/>
    <path d="M470 148 A48 48 0 0 1 422 100"/>`,
  bestiario: `
    <path d="M430 62 Q452 100 442 140"/>
    <path d="M462 56 Q484 100 474 144"/>
    <path d="M494 62 Q516 100 506 140"/>`,
  journal: `
    <rect x="428" y="60" width="84" height="80" rx="4"/>
    <path d="M444 84 H496 M444 100 H496 M444 116 H478"/>`,
};

// LCG simples: mesma semente, mesmo céu, build após build.
function* estrelas(semente, n) {
  let s = semente;
  for (let i = 0; i < n; i++) {
    s = (s * 1103515245 + 12345) % 2147483648;
    const x = (s / 2147483648) * L;
    s = (s * 1103515245 + 12345) % 2147483648;
    const y = (s / 2147483648) * A;
    s = (s * 1103515245 + 12345) % 2147483648;
    const r = 0.4 + (s / 2147483648) * 1.1;
    yield { x, y, r };
  }
}

function banner(nome, semente) {
  const ceu = [...estrelas(semente, 70)]
    .map((e) => `<circle cx="${e.x.toFixed(1)}" cy="${e.y.toFixed(1)}" r="${e.r.toFixed(2)}"/>`)
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${L} ${A}" width="${L}" height="${A}" role="img">
  <defs>
    <linearGradient id="fundo" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#120a06"/>
      <stop offset="0.55" stop-color="#3b1d10"/>
      <stop offset="1" stop-color="#1a0d07"/>
    </linearGradient>
    <radialGradient id="brilho" cx="0.78" cy="0.5" r="0.6">
      <stop offset="0" stop-color="#d9783f" stop-opacity="0.35"/>
      <stop offset="1" stop-color="#d9783f" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${L}" height="${A}" fill="url(#fundo)"/>
  <g fill="#f5e6cf" opacity="0.55">${ceu}</g>
  <rect width="${L}" height="${A}" fill="url(#brilho)"/>
  <g fill="none" stroke="#f5e6cf" stroke-width="3" stroke-linecap="round" opacity="0.9">${EMBLEMAS[nome]}
  </g>
  <rect x="0" y="${A - 4}" width="${L}" height="4" fill="#e8c547"/>
</svg>
`;
}

fs.mkdirSync(OUT, { recursive: true });
let n = 0;
for (const [nome] of Object.entries(EMBLEMAS)) {
  fs.writeFileSync(path.join(OUT, `${nome}.svg`), banner(nome, 4127 + n * 104729), "utf8");
  n++;
}
console.log(`  OK ${n} banners em assets/banners/`);
