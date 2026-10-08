// Nenhuma função é chamada sem estar definida ou importada.
//
// ── O BUG QUE ISTO EXISTE PARA NÃO DEIXAR VOLTAR ────────────────────────────
//
// Ao tirar as naves deste módulo, os imports de `nave-converter.js` saíram e um
// bloco de 23 linhas que chamava `navesAntigas()` ficou no `ready`.
//
// O arquivo CARREGA sem erro — o `import` some, mas a chamada só explode quando
// a linha roda. E ela rodava no `ready`, isto é, ao abrir o mundo. Resultado na
// mesa: "navesAntigas is not defined", e tudo o que vinha depois no `ready`
// simplesmente não acontecia — nem os pontos de Força foram registrados.
//
// Nenhum teste viu. O de carga importa os módulos, e importar não executa o
// `ready`; sem um Foundry de verdade, nada executa o `ready`. É a mesma classe
// de falha do conversor inalcançável ("código morto com teste verde"), só que
// desta vez chegou à mesa, num módulo publicado.
//
// ── COMO ISTO FUNCIONA ──────────────────────────────────────────────────────
//
// Varredura léxica, não execução: colhe o que o arquivo DEFINE (imports,
// const/let/var, function, class, parâmetros) e compara com o que ele CHAMA
// como função. É grosseiro de propósito — o alvo é estreito e vale a pena: um
// nome que sumiu do topo e ficou no meio do corpo.
//
// Uso: node tools/teste-simbolos.mjs

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = path.resolve(fileURLToPath(import.meta.url), "../..");
const DIR = path.join(RAIZ, "starwars-sd-module", "module");

const problemas = [];
const confere = (ok, msg) => { if (!ok) problemas.push(msg); };

/** O que o navegador e o Foundry dão de graça, mais as palavras da linguagem. */
const DE_GRACA = new Set([
  // navegador
  "globalThis", "window", "document", "console", "Math", "JSON", "Object", "Array",
  "String", "Number", "Boolean", "Set", "Map", "WeakMap", "Date", "Promise", "RegExp",
  "Error", "parseInt", "parseFloat", "isNaN", "isFinite", "setTimeout", "clearTimeout",
  "setInterval", "clearInterval", "fetch", "structuredClone", "queueMicrotask",
  "requestAnimationFrame", "encodeURIComponent", "decodeURIComponent", "Intl", "Symbol",
  "Proxy", "Reflect", "BigInt", "Infinity", "NaN", "alert", "confirm", "prompt",
  // Foundry
  "game", "ui", "CONFIG", "CONST", "Hooks", "foundry", "Actor", "Actors", "Item", "Items",
  "ActorSheet", "ItemSheet", "ChatMessage", "Roll", "Dialog", "Application", "FormApplication",
  "canvas", "Combat", "Combatant", "CombatTracker", "TextEditor", "Token", "TokenDocument",
  "JournalEntry", "Macro", "Folder", "Scene", "User", "Users", "Hotbar", "SortingHelpers",
  "renderTemplate", "loadTemplates", "duplicate", "mergeObject", "setProperty", "getProperty",
  "expandObject", "flattenObject", "randomID", "libWrapper", "Handlebars", "$", "jQuery",
  // DOM
  "HTMLElement", "Element", "Node", "NodeList", "DocumentFragment", "CustomEvent", "Event",
  "FormData", "URL", "URLSearchParams", "Image", "Blob", "File", "FileReader",
  // palavras da linguagem que o regex de chamada pode capturar
  "if", "for", "while", "switch", "catch", "return", "typeof", "new", "await", "async",
  "function", "class", "const", "let", "var", "this", "super", "null", "undefined",
  "true", "false", "void", "delete", "in", "of", "instanceof", "case", "default", "do",
  "else", "try", "finally", "throw", "break", "continue", "export", "import", "from", "as",
  "yield", "static", "get", "set",
]);

/**
 * O arquivo sem comentários nem literais: um nome citado em prosa não é uso.
 *
 * Os regex de literal são montados a partir de `String.raw` porque a barra
 * invertida dentro de template literal já me custou três idas e voltas — `\s`
 * virando "s" e `\b` virando backspace.
 */
const BARRA = String.raw`\\`;
const TEMPLATE = new RegExp("`(?:[^`" + BARRA + "]|" + BARRA + ".)*`", "g");
const ASPA_DUPLA = new RegExp('"(?:[^"' + BARRA + "]|" + BARRA + '.)*"', "g");
const ASPA_SIMPLES = new RegExp("'(?:[^'" + BARRA + "]|" + BARRA + ".)*'", "g");

function semTextoMorto(js) {
  return js
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/\/\/[^\n]*/g, " ")
    .replace(TEMPLATE, "``")
    .replace(ASPA_DUPLA, '""')
    .replace(ASPA_SIMPLES, "''");
}

/** Tudo o que o arquivo traz ou declara por nome. */
function definidos(js) {
  const nomes = new Set(DE_GRACA);

  // imports: `import x from`, `import { a, b as c } from`, `import * as ns from`
  for (const m of js.matchAll(/import\s+([^;]*?)\s+from/g)) {
    const spec = m[1];
    for (const chaves of spec.matchAll(/\{([^}]*)\}/g)) {
      for (const n of chaves[1].split(",")) {
        const nome = n.split(/\s+as\s+/).pop().trim();
        if (nome) nomes.add(nome);
      }
    }
    const semChaves = spec.replace(/\{[^}]*\}/g, "").replace(/\*\s+as\s+/, "");
    for (const n of semChaves.split(",")) {
      const nome = n.trim();
      if (/^[\w$]+$/.test(nome)) nomes.add(nome);
    }
  }

  // declarações simples
  for (const m of js.matchAll(/\b(?:const|let|var)\s+([\w$]+)/g)) nomes.add(m[1]);
  for (const m of js.matchAll(/\b(?:async\s+)?function\s*\*?\s*([\w$]+)/g)) nomes.add(m[1]);
  for (const m of js.matchAll(/\bclass\s+([\w$]+)/g)) nomes.add(m[1]);

  // desestruturação de objeto: `const { a, b: c } = x`
  for (const m of js.matchAll(/(?:const|let|var)\s*\{([^}]*)\}/g)) {
    for (const n of m[1].split(",")) {
      const nome = n.split(/[:=]/).pop().trim();
      if (/^[\w$]+$/.test(nome)) nomes.add(nome);
    }
  }
  // e de arranjo: `const [a, b] = x`
  for (const m of js.matchAll(/(?:const|let|var)\s*\[([^\]]*)\]/g)) {
    for (const n of m[1].split(",")) {
      const nome = n.split("=")[0].trim();
      if (/^[\w$]+$/.test(nome)) nomes.add(nome);
    }
  }

  // parâmetros de função e de arrow: tudo entre ( ) antes de => ou {
  for (const m of js.matchAll(/\(([^()]*)\)\s*(?:=>|\{)/g)) {
    for (const n of m[1].split(",")) {
      const nome = n.split(/[:=]/)[0].replace(/[{}[\].]/g, "").replace(/\s/g, "");
      if (/^[\w$]+$/.test(nome)) nomes.add(nome);
    }
  }
  // arrow de um parâmetro sem parênteses: `x => …`
  for (const m of js.matchAll(/(?<![.\w$])([a-zA-Z_$][\w$]*)\s*=>/g)) nomes.add(m[1]);

  // métodos de classe: `nome(args) {` no começo da linha
  for (const m of js.matchAll(/^\s*(?:static\s+|async\s+|\*\s*|#)*([\w$]+)\s*\(/gm)) {
    nomes.add(m[1]);
  }

  return nomes;
}

/** As chamadas que não têm de onde vir. */
function orfaos(js) {
  const tem = definidos(js);
  const achados = [];
  for (const m of js.matchAll(/(?<![.\w$?])([a-zA-Z_$][\w$]*)\s*\(/g)) {
    if (tem.has(m[1])) continue;
    achados.push({ nome: m[1], linha: js.slice(0, m.index).split("\n").length });
  }
  return achados;
}

/* ── A VARREDURA ───────────────────────────────────────────────────────────── */

const arquivos = fs.readdirSync(DIR).filter((f) => f.endsWith(".js"));
confere(arquivos.length > 0, `nenhum .js achado em ${DIR} — a leitura falhou`);

for (const arq of arquivos) {
  const js = semTextoMorto(fs.readFileSync(path.join(DIR, arq), "utf8"));
  for (const o of orfaos(js)) {
    confere(false,
      `${arq}:${o.linha} chama \`${o.nome}()\`, que não é definido nem importado — ` +
      `o arquivo CARREGA assim mesmo, e isso só explode quando a linha roda`);
  }
}

/* ── A ASSERÇÃO SE SABOTA ──────────────────────────────────────────────────── */
//
// Uma varredura léxica frouxa passa verde por não achar nada, e não por não
// haver nada. Então o detector é posto contra o bug original, reescrito aqui: se
// ele não pegar `navesAntigas()` sem import, o teste inteiro não vale — e é
// melhor saber agora que no mundo do usuário.
{
  const comoEra = [
    "import { registrarPontosDeForca } from './pontos-de-forca.js';",
    "Hooks.once('ready', () => {",
    "  const antigas = navesAntigas();",
    "  if (antigas.length) converterTodas();",
    "});",
  ].join("\n");
  const nomes = orfaos(semTextoMorto(comoEra)).map((o) => o.nome);
  confere(nomes.includes("navesAntigas"),
    "o detector não pega `navesAntigas()` sem import — era exatamente este o bug da " +
    "1.48.0, então o teste estaria verde por cegueira, não por saúde");
  confere(nomes.includes("converterTodas"),
    "o detector acha a primeira chamada órfã e perde a segunda — um bloco removido pela " +
    "metade passaria");
}

if (problemas.length) {
  for (const p of problemas) console.error(`  ✘ ${p}`);
  process.exit(1);
}
console.log(
  `  ✔ símbolos: ${arquivos.length} arquivo(s) sem nenhuma função chamada sem import — o ` +
    "erro que o teste de carga não vê, porque carregar não é executar o `ready` (e o " +
    "detector foi provado contra o bug da 1.48.0)"
);
