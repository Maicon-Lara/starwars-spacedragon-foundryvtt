// Teste da progressão que o item de classe leva para o motor, sem Foundry.
//
// ── POR QUE ESTE TESTE EXISTE ───────────────────────────────────────────────
//
// `flags.spacedragon.progressao.colunas` é o que faz a ficha da especialização
// calcular diferente da classe-base: o Alcance do Consular, a Grandeza do
// Artífice, os PV que ele volta a ganhar no 17º. O build monta isso lendo o
// CABEÇALHO da tabela do cofre — e um cabeçalho renomeado no cofre não é erro
// de build: a coluna simplesmente não é encontrada, `colunas` sai sem ela, e o
// build imprime "✔". Foi o que aconteceu quando a coluna "PV por nível" do
// Artífice virou "Conserto / Modificação" e o +4 do 17º passou a vir no DV:
// nada falhou, e a ficha teria parado de dar os PV em silêncio.
//
// Por isso o teste lê o PACK GERADO, não a tabela: é o que o Foundry consome.
//
// Uso: node tools/teste-progressao.mjs

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(fileURLToPath(import.meta.url), "../..");
const CLASSES = path.join(ROOT, "packs-src", "starwars-sd-classes");

const problemas = [];
const confere = (ok, msg) => { if (!ok) problemas.push(msg); };

/** O item de classe cujo nome começa com a especialização. */
function classeDe(nome) {
  for (const f of fs.readdirSync(CLASSES)) {
    if (!f.endsWith(".json") || !f.includes("__class__")) continue;
    const d = JSON.parse(fs.readFileSync(path.join(CLASSES, f), "utf8"));
    if (d.name?.startsWith(nome)) return d;
  }
  return null;
}

const colunasDe = (nome) => {
  const d = classeDe(nome);
  confere(d, `não achei o item de classe de ${nome}`);
  return d?.flags?.spacedragon?.progressao?.colunas ?? {};
};

// ── O Artífice: os PV do 17º, e a Grandeza travada ─────────────────────────
//
// Os +2 do 17º ao 20º são os do Hipercientista do livro: ele não alcança a
// plenitude do 16º, então o corpo não congela. Se esta asserção cair, a ficha
// voltou a congelar os PV (ou a dobrá-los, como até a 1.48.1).
const art = colunasDe("Artífice");
for (const n of ["17", "18", "19", "20"]) {
  confere(art.dv?.[n] === "+2 PV",
    `Artífice: PV do ${n}º devia ser "+2 PV", veio ${JSON.stringify(art.dv?.[n])}`);
}
// nos níveis baixos a coluna DV traz o NÚMERO de dados ("5", "6"), não bônus
for (const n of ["5", "6", "7", "8", "9"]) {
  confere(art.dv?.[n] === undefined,
    `Artífice: o ${n}º não devia declarar PV fixo, veio ${JSON.stringify(art.dv?.[n])}`);
}
// e a base do Mentálico nesses níveis, que a tabela repete
confere(art.dv?.["10"] === "+1 PV", `Artífice: 10º devia ser "+1 PV", veio ${JSON.stringify(art.dv?.["10"])}`);
confere(art.dv?.["15"] === "+2 PV", `Artífice: 15º devia ser "+2 PV", veio ${JSON.stringify(art.dv?.["15"])}`);

// a Grandeza trava na 3ª, destrava na 4ª no 9º e chega à 8ª no 19º
confere(art.grandezaMental?.["8"] === "3ª", "Artífice: a Grandeza devia estar travada na 3ª no 8º");
confere(art.grandezaMental?.["9"] === "4ª", "Artífice: a Grandeza devia destravar na 4ª no 9º");
confere(art.grandezaMental?.["13"] === "5ª", "Artífice: a Grandeza devia destravar na 5ª no 13º");
confere(art.grandezaMental?.["19"] === "8ª", "Artífice: a Grandeza devia chegar à 8ª no 19º");
// o Alcance anda uma linha a cada dois níveis
confere(art.alcanceMental?.["5"] === "9%", "Artífice: Alcance do 5º devia ser 9%");
confere(art.alcanceMental?.["7"] === "13%", "Artífice: Alcance do 7º devia ser 13% (a linha do 6º)");
confere(art.alcanceMental?.["20"] === "53%", "Artífice: Alcance do 20º devia ser 53%");

// e a BA e a JP seguem a do Mentálico: o Hipercientista não congela o corpo
const levelsArt = classeDe("Artífice")?.system?.levels ?? {};
confere(levelsArt["13"]?.ba === 5 && levelsArt["13"]?.jp === 10,
  `Artífice: 13º devia ter BA +5 e JP 10, veio ${JSON.stringify(levelsArt["13"])}`);

// ── O Consular PERDE PV do 10º ao 16º ──────────────────────────────────────
//
// O Psiquista do livro "perde 1 ou 2 pontos de vida ao subir de nível ao invés
// de ganhá-los". Sem estas células a ficha cairia na tabela do Mentálico e
// daria +1 PV, o contrário da regra.
const cons = colunasDe("Consular");
for (const n of ["10", "11", "12", "13", "14"]) {
  confere(cons.dv?.[n] === "−1 PV", `Consular: ${n}º devia ser "−1 PV", veio ${JSON.stringify(cons.dv?.[n])}`);
}
for (const n of ["15", "16"]) {
  confere(cons.dv?.[n] === "−2 PV", `Consular: ${n}º devia ser "−2 PV", veio ${JSON.stringify(cons.dv?.[n])}`);
}
// e o Alcance +2 níveis só começa no 10º
confere(cons.alcanceMental?.["5"] === "9%", "Consular: Alcance do 5º devia ser o normal, 9%");
confere(cons.alcanceMental?.["10"] === "53%", "Consular: Alcance do 10º devia ser o do 12º, 53%");

// ── As outras Sendas não devem ganhar PV fixo por acidente ────────────────
//
// Passar a ler a coluna DV valeu para todas as especializações; nas outras os
// valores são os da base, e nenhuma delas dá PV depois do 16º.
for (const nome of ["Guardião", "Consular", "Sentinela", "Vidente"]) {
  const c = colunasDe(nome);
  for (const n of ["17", "18", "19", "20"]) {
    confere(c.dv?.[n] === undefined,
      `${nome}: não devia declarar PV no ${n}º, veio ${JSON.stringify(c.dv?.[n])}`);
  }
}

if (problemas.length) {
  for (const p of problemas) console.error(`  ✘ ${p}`);
  process.exit(1);
}
console.log("  ✔ progressão: os PV do Artífice no 17º, a perda do Consular, a Grandeza travada e destravada, o Alcance de duas em duas, e as outras Sendas sem PV fixo");
