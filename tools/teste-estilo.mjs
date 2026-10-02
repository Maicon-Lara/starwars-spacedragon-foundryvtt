// Teste do estilo do livro no módulo, sem Foundry.
//
// ── POR QUE ESTE TESTE EXISTE ───────────────────────────────────────────────
//
// Estilo falha CALADO. Um .woff2 que não foi para o zip, um seletor preso ao
// container errado, um selo que continuou <code>: nada disso quebra o build,
// nada aparece no console do Foundry, e o resultado é só "ficou feio" na mesa
// de alguém. Cada asserção aqui corresponde a uma dessas falhas.
//
// Uso: node tools/teste-estilo.mjs

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { enfeitar, enfeitarDoc } from "./lib.mjs";

const ROOT = path.resolve(fileURLToPath(import.meta.url), "../..");
const MOD = path.join(ROOT, "starwars-sd-module");
const PACKS = path.join(ROOT, "packs-src");

const problemas = [];
const confere = (ok, msg) => { if (!ok) problemas.push(msg); };

const ler = (...p) => fs.readFileSync(path.join(...p), "utf8");

// ── enfeitar(): o que vira enfeite e o que NÃO vira ───────────────────────
const sel = enfeitar("<code>[U]</code><code>[L]</code><code>[S]</code><code>[C]</code>");
for (const [letra, classe] of [["U", "u"], ["L", "l"], ["S", "s"], ["C", "c"]]) {
  confere(sel.includes(`<span class="sw-selo ${classe}">${letra}</span>`),
    `o selo [${letra}] não virou hexágono: ${sel}`);
}
confere(enfeitar("no <code>10º</code>") === 'no <span class="sw-tarja">10º</span>',
  "o nível `10º` não virou tarja");
confere(enfeitar("<code>[11]</code>") === '<span class="sw-tarja">11</span>',
  "o nível `[11]` não virou tarja");
confere(enfeitar("★").includes("sw-selo estrela"), "a estrela não virou selo");

// código de verdade continua código: é a diferença entre marcador e código
const cod = "<code>actor.setFlag</code>";
confere(enfeitar(cod) === cod, `enfeitar() mexeu em código de verdade: ${enfeitar(cod)}`);
// e um número de três dígitos não é nível
confere(enfeitar("<code>100º</code>") === "<code>100º</code>",
  "enfeitar() tratou 100º como nível");

// ── enfeitarDoc(): só os campos de HTML ───────────────────────────────────
//
// Um ★ no NOME de um poder não pode virar <span>: o Foundry mostra o campo
// `name` como texto puro, e a tag apareceria literal na lista do compêndio.
const doc = {
  name: "Poder ★",
  system: { description: "<p><code>[S]</code> corrompe ★</p>" },
};
enfeitarDoc(doc);
confere(doc.name === "Poder ★", `enfeitarDoc() mexeu no name: ${doc.name}`);
confere(doc.system.description.includes("sw-selo s"), "enfeitarDoc() não enfeitou a descrição");

// e aplicar duas vezes não aninha span dentro de span
const duas = enfeitarDoc(enfeitarDoc({ system: { description: "★" } }));
confere(!/<span[^>]*><span/.test(duas.system.description),
  `enfeitarDoc() aplicado duas vezes aninhou spans: ${duas.system.description}`);

// ── As fontes: cada arquivo citado no CSS existe de verdade ───────────────
//
// Esta é a falha mais silenciosa de todas. Um url() apontando para um .woff2
// que não foi para o repo (ou que o zip não levou) não dá erro em lugar
// nenhum: o navegador cai para a fonte seguinte da pilha e a mesa vê Georgia.
const fontesCss = ler(MOD, "styles", "fontes.css");
const citadas = [...fontesCss.matchAll(/url\('\.\.\/fonts\/([^']+)'\)/g)].map((m) => m[1]);
confere(citadas.length >= 9, `fontes.css cita só ${citadas.length} arquivos`);
for (const f of new Set(citadas)) {
  confere(fs.existsSync(path.join(MOD, "fonts", f)), `fonte citada e ausente: fonts/${f}`);
}
// as três famílias do livro, todas presentes
for (const fam of ["Orbitron", "Saira Condensed", "Source Serif 4"]) {
  confere(fontesCss.includes(`font-family: '${fam}'`), `faltou a família ${fam}`);
}

// ── O module.json declara as três folhas, na ordem ────────────────────────
//
// A ordem importa: fontes.css antes de livro.css (que usa as famílias) e
// livro.css antes de starwars-sd.css (que lê as variáveis --sw-*).
const mj = JSON.parse(ler(MOD, "module.json"));
confere(
  JSON.stringify(mj.styles) ===
    JSON.stringify(["styles/fontes.css", "styles/livro.css", "styles/starwars-sd.css"]),
  `styles fora de ordem: ${JSON.stringify(mj.styles)}`
);

// ── O CSS: selo e tarja NÃO podem depender do container do journal ───────
//
// As habilidades de classe aparecem na ficha, no cartão de chat e no tooltip,
// todos fora de .starwars-sd-doc. Preso ao container, o nível sairia sem
// estilo justamente na ficha — que é onde o jogador olha.
const livroCss = ler(MOD, "styles", "livro.css");
confere(/^\.sw-selo \{/m.test(livroCss), "o .sw-selo não está solto no CSS");
confere(/^\.sw-tarja \{/m.test(livroCss), "o .sw-tarja não está solto no CSS");
confere(!livroCss.includes(".starwars-sd-doc .sw-selo"),
  "o .sw-selo voltou a depender do container do journal");

// toda variável --sw-* usada no CSS tem de estar definida em algum :root dele
const definidas = new Set([...livroCss.matchAll(/^\s*(--sw-[\w-]+):/gm)].map((m) => m[1]));
const usadas = new Set(
  [...livroCss, ...ler(MOD, "styles", "starwars-sd.css")]
    .join("")
    .match(/var\((--sw-[\w-]+)/g)
    ?.map((v) => v.slice(4)) ?? []
);
for (const v of usadas) {
  confere(definidas.has(v), `variável usada e nunca definida: ${v}`);
}

// ── Os packs: nenhum selo ficou como <code>, e os capítulos têm cor ───────
const arquivos = fs
  .readdirSync(PACKS)
  .flatMap((d) => fs.readdirSync(path.join(PACKS, d)).map((f) => path.join(PACKS, d, f)))
  .filter((f) => f.endsWith(".json"));

let selos = 0;
let sobrou = 0;
for (const f of arquivos) {
  const d = JSON.parse(fs.readFileSync(f, "utf8"));
  const alvos = [d.system?.description, ...(d.pages ?? []).map((p) => p.text?.content)];
  for (const t of alvos.filter(Boolean)) {
    selos += (t.match(/class="sw-selo/g) ?? []).length;
    sobrou += (t.match(/<code>\[[ULSC]\]<\/code>/g) ?? []).length;
    sobrou += (t.match(/<code>\d{1,2}[ºo°]<\/code>/g) ?? []).length;
  }
}
confere(selos > 100, `só ${selos} selos nos packs — a pós-passagem rodou?`);
confere(sobrou === 0, `${sobrou} marcadores ficaram como <code> nos packs`);

// os dez capítulos: cada um com a classe de cor e a faixa de abertura
const journals = fs
  .readdirSync(path.join(PACKS, "starwars-sd-journal"))
  .map((f) => JSON.parse(ler(PACKS, "starwars-sd-journal", f)))
  .filter((d) => d.pages?.length);
// O número cresce quando um capítulo é escrito, e travá-lo aqui só obrigaria a
// editar o teste junto. O que importa é que TODOS tenham cor, faixa e epígrafe,
// e que os números não se repitam — é isso que as asserções abaixo cobrem.
confere(journals.length >= 10, `só ${journals.length} capítulos com página`);
const numeros = new Set();
for (const d of journals) {
  const p0 = d.pages[0].text.content;
  const cor = p0.match(/starwars-sd-doc c-(\w+)/);
  confere(cor, `${d.name}: página de abertura sem classe de cor`);
  const ab = p0.match(/<div class="abertura"><div class="n">(\d+)<\/div>/);
  confere(ab, `${d.name}: sem a faixa de abertura`);
  if (ab) numeros.add(ab[1]);
  confere(p0.includes('class="epigrafe"'), `${d.name}: sem epígrafe`);
  // o título não pode sair duas vezes: a faixa já o mostra
  confere(d.pages[0].title.show === false,
    `${d.name}: a página de abertura ainda mostra o próprio título`);
  // e as páginas seguintes continuam mostrando o delas
  if (d.pages.length > 1) {
    confere(d.pages[1].title.show === true,
      `${d.name}: a segunda página escondeu o título`);
  }
}
confere(numeros.size === journals.length,
  `números de capítulo repetidos: ${[...numeros].sort().join(", ")}`);

if (problemas.length) {
  for (const p of problemas) console.error(`  ✘ ${p}`);
  process.exit(1);
}
console.log(
  "  ✔ estilo: selos e tarjas (e o que não é marcador), as fontes citadas existem, " +
    "a ordem das folhas, --sw-* sem variável órfã, e todo capítulo com cor, faixa e epígrafe"
);
