// As regras de raça contra as habilidades do compêndio.
//
// Uso: node tools/teste-racas.mjs

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { REGRAS_DE_RACA as R, registrarRacas } from "../starwars-sd-module/module/racas.js";

const chave = (s) => String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
const PASTA = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "packs-src", "starwars-sd-especies");
const nomes = new Set(fs.readdirSync(PASTA).filter((n) => n.includes("__race_ability__"))
  .map((n) => chave(JSON.parse(fs.readFileSync(path.join(PASTA, n), "utf8")).name)));

const problemas = [];
const confere = (ok, msg) => { if (!ok) problemas.push(msg); };
for (const k of Object.keys(R)) confere(nomes.has(k), `"${k}" não existe no compêndio`);

const ator = (value) => ({ system: { hp: { value, max: 30 } } });
const melee = { system: { type: "melee" } };
confere(R["furia selvagem"].dano(ator(14), melee) === 2, "Fúria abaixo da metade dá +2");
confere(R["furia selvagem"].dano(ator(15), melee) === 0, "Fúria na metade exata não dá bônus");
confere(R["furia selvagem"].dano(ator(14), { system: { type: "ranged" } }) === 0, "Fúria é só corpo a corpo");
confere(R.restricao.dano(ator(30), { system: { two_handed: false } }) === -1, "arma de uma mão dá −1");
confere(R.restricao.dano(ator(30), { system: { two_handed: true } }) === 0, "arma de duas mãos não dá −1");
confere(R["corpo robotico"].venceJP.jpc(ator(0)) && !R["corpo robotico"].venceJP.jpc(ator(-1)), "Corpo Robótico rola com PV negativo");

const recebidas = [];
globalThis.game = { modules: { get: () => ({ api: { racas: { registrar: (t) => recebidas.push(t) } } }) } };
confere(registrarRacas() === true && recebidas[0] === R, "a tabela não chegou ao motor");
globalThis.game = { modules: { get: () => ({ api: {} }) } };
confere(registrarRacas() === false, "sem o motor, não registra");

if (problemas.length) {
  console.error(`✘ ${problemas.length} problema(s):\n  ${problemas.join("\n  ")}`);
  process.exit(1);
}
console.log("✔ Regras de raça conferem com o compêndio.");
