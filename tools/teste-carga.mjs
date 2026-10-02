// Teste da carga dos itens, sem Foundry.
//
// ── POR QUE ESTE TESTE EXISTE ───────────────────────────────────────────────
//
// A carga falha em silêncio dos dois lados. Zerada, ninguém fica sobrecarregado
// e a regra some sem erro nenhum — foi o que esteve acontecendo com os 146
// itens, todos em `weight_in_load: 0`. E errada, ela pesa na mesa sem que nada
// no build acuse.
//
// A asserção mais importante aqui é a DISTRIBUIÇÃO: se nenhum item cai numa das
// faixas, a régua está quebrada. Foi exatamente o sintoma do primeiro bug —
// nenhum item com carga 1, porque o cofre escreve "0,5" com vírgula e
// `Number("0,5")` devolve NaN.
//
// Uso: node tools/teste-carga.mjs

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { cargaDoItem, porteDoItem, FAIXAS_DE_PORTE } from "./data/carga.mjs";

const ROOT = path.resolve(fileURLToPath(import.meta.url), "../..");
const problemas = [];
const confere = (ok, msg) => { if (!ok) problemas.push(msg); };

// ── A VÍRGULA DECIMAL ──────────────────────────────────────────────────────
//
// O cofre escreve o decimal com vírgula. Um `Number("0,5")` é NaN, vira zero, e
// toda arma pequena ficou sem carga.
confere(cargaDoItem("Faca", "0,5") === 1, `"0,5" devia dar carga 1, deu ${cargaDoItem("Faca", "0,5")}`);
confere(cargaDoItem("Maça", "1,5") === 2, `"1,5" devia dar carga 2, deu ${cargaDoItem("Maça", "1,5")}`);
// e o ponto continua valendo, para quem escrever assim
confere(cargaDoItem("Faca", "0.5") === 1, "o ponto decimal também tem de funcionar");
confere(cargaDoItem("Faca", 0.5) === 1, "o número puro também");

// ── A RÉGUA, CALIBRADA NO LIVRO ────────────────────────────────────────────
//
// As cinco armas que o livro entrega com porte E peso. Se a régua deixar de
// acertá-las, ela deixou de ser a do livro.
const DO_LIVRO = [
  ["Zarabatana", "0,5", "P", 1],
  ["Porrete", "1", "M", 2],
  ["Rifle laser", "2", "M", 2],
  ["Rifle de plasma", "4", "M", 2],
  ["Rifle de projéteis", "4", "M", 2],
];
for (const [nome, peso, porte, carga] of DO_LIVRO) {
  confere(porteDoItem(peso) === porte,
    `${nome} (${peso} kg): o livro diz porte ${porte}, a régua deu ${porteDoItem(peso)}`);
  confere(cargaDoItem(nome, peso) === carga,
    `${nome}: carga devia ser ${carga}, deu ${cargaDoItem(nome, peso)}`);
}
// e o degrau seguinte é grande
confere(cargaDoItem("Machado", "5") === 3, "acima de 4 kg a arma é grande, carga 3");

// ── O QUE A TABELA 5-1 NOMEIA ──────────────────────────────────────────────
//
// O nome manda sobre a régua, porque a tabela trata casos que o peso erraria:
// um Escudo de Energia é leve mas não é "arma pequena", e munição não agrega
// carga por mais que pese.
confere(cargaDoItem("Vestes Leves", "0,5") === 1, "Vestes Leves: carga 1");
confere(cargaDoItem("Vestes Médias", "1") === 2, "Vestes Médias: carga 2");
confere(cargaDoItem("Traje de Combate", "2") === 3, "Traje de Combate: carga 3");
confere(cargaDoItem("Armadura Defletora", "1") === 3, "Armadura Defletora: carga 3");
confere(cargaDoItem("Traje Espacial", "3") === 3, "Traje Espacial: carga 3");
// "muito leve para ser considerado no limite de carga"
confere(cargaDoItem("Escudo de Energia", "2") === 0,
  "Escudo de Energia não entra no limite, por mais que pese");
confere(cargaDoItem("Anel de Laser", "1") === 0, "Anel de Laser: não entra no limite");
// munição
confere(cargaDoItem("Projéteis (30)", "0,5") === 0, "munição não agrega carga");
confere(cargaDoItem("Carga de Energia", "0,5") === 0, "a célula de uma arma é munição");

// o nome tem de bater de verdade, e não por pedaço: "Faca" não é "Flecha"
confere(cargaDoItem("Facão de mato", "1") === 2,
  "um nome que apenas COMEÇA parecido não deve cair na lista nomeada");

// ── SEM PESO, SEM CARGA ────────────────────────────────────────────────────
confere(cargaDoItem("Coisa qualquer", "") === 0, "item sem peso não tem carga");
confere(cargaDoItem("Coisa qualquer", "—") === 0, "o travessão do cofre não vira carga");
confere(cargaDoItem("Coisa qualquer", undefined) === 0, "peso ausente não quebra");

// ── OS PACKS: A DISTRIBUIÇÃO ───────────────────────────────────────────────
//
// Esta é a asserção que teria pego o bug de origem. Com a vírgula engolida,
// NENHUM item caía na faixa 1 — e um build que gera 146 itens sem um único de
// carga 1 está errado, qualquer que seja a causa.
const dir = path.join(ROOT, "packs-src", "starwars-sd-equipamentos");
const porCarga = new Map();
let semCampo = 0;
for (const f of fs.readdirSync(dir).filter((x) => x.endsWith(".json"))) {
  const d = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
  if (!d.system || typeof d.system !== "object") continue; // pastas
  const c = d.system.weight_in_load;
  if (c === undefined || c === null) { semCampo++; continue; }
  porCarga.set(c, (porCarga.get(c) ?? 0) + 1);
}
confere(semCampo === 0, `${semCampo} item(ns) sem weight_in_load`);

for (const faixa of [0, 1, 2, 3]) {
  confere((porCarga.get(faixa) ?? 0) > 0,
    `nenhum item com carga ${faixa} — a régua não está distribuindo, como quando` +
    ` a vírgula decimal virava NaN`);
}
const total = [...porCarga.values()].reduce((a, b) => a + b, 0);
confere(total > 100, `só ${total} itens com carga; o compêndio tem mais que isso`);
// e nada fora da escala da Tabela 5-1
for (const c of porCarga.keys()) {
  confere([0, 1, 2, 3].includes(c), `carga fora da escala da Tabela 5-1: ${c}`);
}

// as faixas têm de estar em ordem crescente, senão o `find` pega a errada
for (let i = 1; i < FAIXAS_DE_PORTE.length; i++) {
  confere(FAIXAS_DE_PORTE[i].ate > FAIXAS_DE_PORTE[i - 1].ate,
    "as faixas de porte têm de estar em ordem crescente de peso");
}

if (problemas.length) {
  for (const p of problemas) console.error(`  ✘ ${p}`);
  process.exit(1);
}
console.log(
  `  ✔ carga: a vírgula decimal, as 5 armas do livro, o que a Tab. 5-1 nomeia, ` +
    `e a distribuição nos packs (${[...porCarga.entries()].sort().map(([c, n]) => `${c}:${n}`).join(" ")})`
);
