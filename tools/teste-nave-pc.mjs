// Teste da Ficha de Nave feita sobre a ficha de personagem, sem Foundry.
//
// ── O QUE DÁ PARA TESTAR DAQUI, E O QUE NÃO ─────────────────────────────────
//
// Não dá para instanciar a ficha: ela herda uma classe do sistema, que só existe
// com o Foundry rodando. O que dá — e é onde os erros moram — é a parte que não
// depende dele: o mapa de rótulos, a troca no DOM e o que o CSS esconde.
//
// ── A ASSERÇÃO QUE MAIS IMPORTA ─────────────────────────────────────────────
//
// Que os rótulos sejam trocados no DOM, e NÃO no `lang`. O idioma é global: um
// "Raça" renomeado para "Tipo" no lang faria o personagem comum da mesma mesa
// mostrar "Tipo" na ficha dele. É o tipo de erro que só aparece quando alguém
// abre a ficha errada, três sessões depois.
//
// Uso: node tools/teste-nave-pc.mjs

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { ROTULOS, MARCA_NAVE_PC, renomearAbas } from "../starwars-sd-module/module/nave-pc-ficha.js";

const RAIZ = path.resolve(fileURLToPath(import.meta.url), "../..");
const problemas = [];
const confere = (ok, msg) => { if (!ok) problemas.push(msg); };

/* ── O MAPA DE RÓTULOS ────────────────────────────────────────────────────── */
//
// As abas da ficha de personagem do sistema, medidas na ficha real:
// attacks, race, class, spells, equipment, details — e attributes, que a nave
// não usa.

const ABAS_DO_SISTEMA = ["attacks", "race", "class", "spells", "equipment", "details"];
for (const aba of ABAS_DO_SISTEMA) {
  confere(ROTULOS[aba], `a aba ${aba} não tem rótulo de nave`);
}
confere(!ROTULOS.attributes,
  "a aba de atributos NÃO deve ter rótulo: ela some, porque nave não tem Força nem Intelecto");

// Os rótulos que o autor decidiu, um a um. Se mudarem, que seja de propósito.
confere(ROTULOS.race === "Tipo", `a aba Raça devia virar "Tipo", veio "${ROTULOS.race}"`);
confere(ROTULOS.class === "Câmaras", `a aba Classe devia virar "Câmaras", veio "${ROTULOS.class}"`);
confere(ROTULOS.spells === "Tripulação", `a aba Poderes devia virar "Tripulação", veio "${ROTULOS.spells}"`);

/* ── A TROCA ACONTECE NO DOM, NÃO NO LANG ─────────────────────────────────── */
{
  const lang = fs.readFileSync(path.join(RAIZ, "starwars-sd-module", "lang", "pt-BR.json"), "utf8");
  // O lang do sistema é quem nomeia as abas. Se este módulo passar a traduzir
  // "Raça" para "Tipo", quebra a ficha do personagem comum da mesma mesa.
  for (const [chave, rotulo] of Object.entries(ROTULOS)) {
    const suspeito = new RegExp(`"[^"]*(tabs?|abas?)[^"]*"\\s*:\\s*"${rotulo}"`, "i");
    confere(!suspeito.test(lang),
      `o lang parece renomear a aba ${chave} para "${rotulo}" — o idioma é GLOBAL, ` +
      `e isso mudaria a ficha de todo personagem da mesa`);
  }
}

/* ── A TROCA NO DOM ───────────────────────────────────────────────────────── */
//
// DOM de mentira com o mínimo: a nav, os itens e os nós de texto.

function abaFalsa(chave, texto) {
  const filho = { nodeType: 3, textContent: texto };
  return {
    dataset: { tab: chave },
    childNodes: [filho],
    get textContent() { return this.childNodes.map((n) => n.textContent).join(""); },
    set textContent(v) { this.childNodes = [{ nodeType: 3, textContent: v }]; },
  };
}

{
  const abas = [abaFalsa("race", "Raça"), abaFalsa("class", "Classe"),
                abaFalsa("spells", "Poderes"), abaFalsa("attacks", "Ataques")];
  const raiz = { querySelectorAll: () => abas };

  const trocados = renomearAbas(raiz);
  confere(trocados >= 4, `esperava ao menos 4 rótulos trocados, veio ${trocados}`);
  confere(abas[0].textContent.includes("Tipo"), `a aba Raça virou "${abas[0].textContent}"`);
  confere(abas[1].textContent.includes("Câmaras"), `a aba Classe virou "${abas[1].textContent}"`);
  confere(abas[2].textContent.includes("Tripulação"), `a aba Poderes virou "${abas[2].textContent}"`);

  // Roda de novo sem estragar: o sistema redesenha a ficha a cada alteração, e
  // renomearAbas roda em todo render. Um rótulo que acumulasse viraria
  // "TipoTipo" no segundo salvamento.
  renomearAbas(raiz);
  confere(abas[0].textContent.trim() === "Tipo",
    `rodar duas vezes acumulou o rótulo: "${abas[0].textContent}"`);
}
{
  // Aba que o mapa não conhece fica como está — a ficha do sistema pode ganhar
  // abas novas, e renomear o que não se conhece seria pior que não renomear.
  const outra = abaFalsa("favorites", "Favoritos");
  renomearAbas({ querySelectorAll: () => [outra] });
  confere(outra.textContent === "Favoritos", `aba desconhecida foi renomeada para "${outra.textContent}"`);
}
confere(renomearAbas(null) === 0, "raiz ausente não quebra");

/* ── O QUE O CSS ESCONDE ──────────────────────────────────────────────────── */
{
  const css = fs
    .readFileSync(path.join(RAIZ, "starwars-sd-module", "styles", "starwars-sd.css"), "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "");

  confere(css.includes(`.${MARCA_NAVE_PC}`),
    `o CSS não tem regra para .${MARCA_NAVE_PC} — a ficha não esconderia nada`);

  // A aba de atributos tem de sumir: é o único bloco da ficha de personagem que
  // não tem NENHUM equivalente numa nave.
  const i = css.indexOf(`.${MARCA_NAVE_PC}`);
  const trecho = css.slice(i, i + 600);
  confere(/attributes/.test(trecho), "a aba de atributos não é escondida");
  confere(/display:\s*none/.test(trecho), "o CSS não esconde nada");

  // Esconder, e não remover: o sistema redesenha a ficha a cada alteração, e o
  // que se remove no JS volta no próximo render.
  const js = fs.readFileSync(
    path.join(RAIZ, "starwars-sd-module", "module", "nave-pc-ficha.js"), "utf8");
  // Remover o PRÓPRIO botão antes de redesenhar é obrigatório: a ficha redesenha
  // a cada alteração, e sem isso o seletor se duplicaria a cada render. O que a
  // regra proíbe é remover conteúdo DO SISTEMA — esse volta no próximo render, e
  // o efeito dura até ele.
  for (const m of js.matchAll(/(.{0,80})\.remove\(\)/g)) {
    const trecho = m[1];
    const ehNosso = /CLASSE_SELETOR|MARCA|sw-|starwars-sd/.test(trecho);
    confere(ehNosso,
      `a ficha remove algo que não é nosso ("…${trecho.slice(-50)}.remove()") — ` +
      `o sistema traz de volta no próximo render; esconda por CSS`);
  }
}

/* ── O REGISTRO ───────────────────────────────────────────────────────────── */
{
  const js = fs.readFileSync(
    path.join(RAIZ, "starwars-sd-module", "module", "nave-pc-ficha.js"), "utf8");

  // NUNCA padrão: o mundo é de personagens, e esta ficha é para os atores que
  // são naves. Virar padrão abriria toda ficha de personagem como nave.
  confere(/makeDefault:\s*false/.test(js),
    "a Ficha de Nave não pode ser padrão — abriria todo personagem da mesa como nave");
  confere(/types:\s*\["character"\]/.test(js), "a ficha precisa ser registrada para character");

  // A classe-base vem do REGISTRO do Foundry, com queda para a do sistema: se o
  // módulo vizinho não estiver lá, a ficha ainda entra.
  confere(/SDCharacterSheet/.test(js) && /OD2CharacterSheet/.test(js),
    "a busca da classe-base precisa tentar a do vizinho E a do sistema");

  const entrada = fs.readFileSync(
    path.join(RAIZ, "starwars-sd-module", "module", "starwars-sd.js"), "utf8");
  confere(/registrarFichaDeNavePC\(\)/.test(entrada), "a ficha não é registrada no ponto de entrada");
  // No ready, e não no init: no init o registro de fichas do sistema está vazio.
  const iReady = entrada.indexOf('Hooks.once("ready"');
  confere(iReady > 0 && entrada.indexOf("registrarFichaDeNavePC()") > iReady,
    "o registro tem de ficar no ready — no init a classe-base ainda não existe");
}

if (problemas.length) {
  for (const p of problemas) console.error(`  ✘ ${p}`);
  process.exit(1);
}
console.log(
  "  ✔ ficha de nave sobre personagem: o mapa de rótulos do autor, a troca no DOM " +
    "(e não no lang global), sem acumular ao redesenhar, aba desconhecida intacta, " +
    "os atributos escondidos por CSS, e o registro no ready sem virar padrão"
);
