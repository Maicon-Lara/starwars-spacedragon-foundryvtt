// A tabela do botão "Usar" contra os próprios itens do módulo.
//
// Confere que todo nome existe nos compêndios e que cada equivalente é o que a
// descrição do item daqui declara ("Poder Mental (SD): {Choque Mental}" ou
// "Aparato (SD): Pistola de Repetição").
//
// Uso: node tools/teste-automacao.mjs

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { EQUIVALENTES, PROPRIOS, registrarAutomacao } from "../starwars-sd-module/module/automacao.js";

const chave = (s) => String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "packs-src");
const itens = new Map();
for (const pack of ["starwars-sd-poderes", "starwars-sd-equipamentos"]) {
  for (const n of fs.readdirSync(path.join(RAIZ, pack))) {
    const d = JSON.parse(fs.readFileSync(path.join(RAIZ, pack, n), "utf8"));
    if (!d.type) continue;
    const v = d.system?.description;
    itens.set(chave(d.name), String(v?.value ?? v ?? "").replace(/<[^>]+>/g, " "));
  }
}

const problemas = [];
for (const [nome, sd] of Object.entries(EQUIVALENTES)) {
  const texto = itens.get(nome);
  if (texto === undefined) { problemas.push(`"${nome}" não existe nos compêndios`); continue; }
  const declarado = texto.match(/\{([^}]+)\}/)?.[1] ?? texto.match(/Aparato\s*\(SD\):\s*([^,]+),/)?.[1];
  if (chave(declarado) !== sd) problemas.push(`"${nome}" aponta para "${sd}", mas o item declara "${declarado}"`);
}
for (const nome of Object.keys(PROPRIOS)) {
  if (!itens.has(nome)) problemas.push(`"${nome}" não existe nos compêndios`);
}

const recebidas = [];
globalThis.game = { modules: { get: () => ({ api: { automacao: { registrar: (t) => recebidas.push(t) } } }) } };
if (registrarAutomacao() !== true || !recebidas[0]?.["choque da forca"]) problemas.push("a tabela não chegou ao motor do Space Dragon");
globalThis.game = { modules: { get: () => undefined } };
if (registrarAutomacao() !== false) problemas.push("sem o Space Dragon, registrar deve só devolver false");

if (problemas.length) {
  console.error(`✘ ${problemas.length} problema(s):\n  ${problemas.join("\n  ")}`);
  process.exit(1);
}
console.log(`✔ Automação: ${Object.keys(EQUIVALENTES).length} equivalentes e ${Object.keys(PROPRIOS).length} itens próprios conferidos.`);
