// Teste do layout que encolhe: as container queries das fichas.
//
// ── POR QUE ESTE TESTE EXISTE ───────────────────────────────────────────────
//
// Três erros possíveis aqui, e os três são SILENCIOSOS — o CSS continua válido,
// o navegador não reclama, e a regra simplesmente não vale:
//
//   1. `@container nome (…)` com um nome que ninguém declarou. A regra não acha
//      contêiner e é letra morta. Aconteceu na primeira versão deste bloco: a
//      Ficha de Ameaça não tinha `container-type`, e a regra dos atributos
//      nunca se aplicava.
//
//   2. `@media (max-width: …)` para adaptar uma ficha. Media query responde ao
//      tamanho da TELA; a ficha do Foundry é uma janela que o jogador arrasta, e
//      a tela não muda quando ele a encolhe. O layout parece responsivo no
//      navegador redimensionado e não funciona na mesa.
//
//   3. Um grid de três ou mais colunas sem versão estreita. Seis colunas numa
//      janela apertada não são seis campos pequenos: são seis rótulos ilegíveis
//      sobre seis números cortados.
//
// Uso: node tools/teste-responsivo.mjs

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = path.resolve(fileURLToPath(import.meta.url), "../..");
const FOLHAS = [
  "starwars-sd-module/styles/starwars-sd.css",
  "starwars-sd-module/styles/livro.css",
  "starwars-sd-module/styles/fontes.css",
];

// As raízes de ficha, que o Foundry dimensiona pela janela e por isso não
// precisam de largura explícita. Qualquer OUTRO elemento com
// `container-type: inline-size` precisa — ver a conferência 5.
const RAIZES_DE_FICHA = new Set([".starwars-sd.nave-ficha"]);

const problemas = [];
const confere = (ok, msg) => { if (!ok) problemas.push(msg); };

/** O CSS sem comentários: senão um exemplo comentado conta como regra. */
const semComentarios = (css) => css.replace(/\/\*[\s\S]*?\*\//g, "");

let houveContainer = false;

for (const rel of FOLHAS) {
  const css = semComentarios(fs.readFileSync(path.join(RAIZ, rel), "utf8"));
  const nome = path.basename(rel);

  // ── 1. todo @container nomeado tem contêiner declarado ──────────────────
  const declarados = new Set([...css.matchAll(/container-name:\s*([a-zA-Z-]+)/g)].map((m) => m[1]));
  const usados = [...css.matchAll(/@container\s+([a-zA-Z-]+)\s*\(/g)].map((m) => m[1]);
  for (const u of usados) {
    confere(declarados.has(u),
      `${nome}: @container "${u}" não tem container-name declarado — a regra é letra morta`);
  }
  // e o contrário: contêiner declarado e nunca consultado é peso morto, e
  // `container-type` não é gratuito (ele contém o eixo inline do elemento)
  for (const d of declarados) {
    confere(usados.includes(d), `${nome}: container-name "${d}" declarado e nunca usado`);
  }
  // nome sem tipo não cria contêiner nenhum
  const comTipo = (css.match(/container-type:\s*inline-size/g) ?? []).length;
  confere(comTipo >= declarados.size,
    `${nome}: ${declarados.size} container-name para ${comTipo} container-type — nome sem tipo não cria contêiner`);
  if (usados.length) houveContainer = true;

  // ── 2. nada de media query de LARGURA para adaptar ficha ────────────────
  // `prefers-color-scheme` e `print` são outra coisa, e continuam valendo.
  const mediaLargura = [...css.matchAll(/@media[^{]*\((min|max)-width[^{]*\{/g)].map((m) => m[0].trim());
  confere(mediaLargura.length === 0,
    `${nome}: @media de largura não enxerga a janela da ficha, só a tela — use @container: ${mediaLargura.join(" | ")}`);

  // ── 3. grid de 3+ colunas precisa de versão estreita ────────────────────
  //
  // Varre bloco a bloco. Para cada seletor com `repeat(N, …)` e N ≥ 3, exige
  // que o mesmo seletor reapareça dentro de algum `@container`.
  const dentroDeContainer = css
    .split(/@container/)
    .slice(1)
    .join("\n");

  for (const m of css.matchAll(/([^{}@]+)\{([^{}]*grid-template-columns:\s*repeat\((\d+)\s*,[^{}]*)\}/g)) {
    const [, seletor, , colunas] = m;
    if (Number(colunas) < 3) continue;
    const sel = seletor.trim().split("\n").pop().trim();
    // a classe final do seletor é o que a regra estreita precisa repetir
    const classe = sel.split(/\s+/).pop();
    confere(dentroDeContainer.includes(classe),
      `${nome}: "${sel}" tem ${colunas} colunas e nenhuma versão estreita em @container — ` +
      `numa ficha apertada isso vira ${colunas} rótulos ilegíveis`);
  }

  // ── 5. CONTAINMENT EXIGE LARGURA EXPLÍCITA ──────────────────────────────
  //
  // `container-type: inline-size` tira do elemento o dimensionamento pelo
  // conteúdo no eixo horizontal. Num pai que estica os filhos ninguém nota; num
  // pai que os alinha pelo início, o elemento COLAPSA até o mínimo. Foi assim
  // que o painel da Ordem de Ação saiu como uma coluna de 60px, com o título
  // quebrado em três linhas e o botão cortado.
  //
  // Não vale para a RAIZ de uma ficha: quem a dimensiona é a janela do Foundry.
  for (const m of css.matchAll(/([^{}@]+)\{([^{}]*container-type:\s*inline-size[^{}]*)\}/g)) {
    const sel = m[1].trim().split("\n").pop().trim();
    const corpo = m[2];
    // Lista EXPLÍCITA, e não um padrão de nome: a primeira versão disto usava
    // /^\.[a-z-]+(-ficha)?$/, que é guloso e também casava ".sd-ordem-ficha" —
    // justamente o elemento que o teste existe para cobrir. A sabotagem passou
    // batida, e a asserção não valia nada.
    if (RAIZES_DE_FICHA.has(sel)) continue;
    confere(/width:\s*100%/.test(corpo),
      `${nome}: "${sel}" tem container-type sem width explícita — num pai que ` +
      `não estica os filhos, ele colapsa até o mínimo`);
  }

  // ── 4. mínimo fixo que não cede ─────────────────────────────────────────
  //
  // `min-width: 230px` numa coluna de ficha empurra o conteúdo para fora quando
  // a ficha é mais estreita que isso. `min(230px, 100%)` cede.
  for (const m of css.matchAll(/([^{}@]+)\{[^{}]*min-width:\s*(\d{3,})px/g)) {
    const sel = m[1].trim().split("\n").pop().trim();
    confere(/barra|pct|input|button|select/.test(sel),
      `${nome}: "${sel}" exige ${m[2]}px de largura mínima — use min(${m[2]}px, 100%) para ceder`);
  }
}

confere(houveContainer, "nenhuma container query nas folhas — o layout não encolhe em lugar nenhum");

// ── 5. A ORDEM, E QUE A QUERY SOBRESCREVA ALGO ───────────────────────────
//
// `@container` não acrescenta especificidade: com a mesma do seletor base,
// vence quem vem DEPOIS no arquivo. Então todo seletor ajustado numa query
// precisa ter a regra base ANTES dela — e precisa TER uma regra base: query que
// não sobrescreve nada é query que não faz nada, e ninguém nota.
{
  const css = semComentarios(fs.readFileSync(path.join(RAIZ, FOLHAS[0]), "utf8"));
  const corte = css.indexOf("@container");
  const antes = css.slice(0, corte);
  const queries = css.slice(corte);

  for (const m of queries.matchAll(/([.][a-zA-Z][\w-]*(?:\s+[.][a-zA-Z][\w-]*)*)\s*[,{]/g)) {
    const sel = m[1].trim();
    const classe = sel.split(/\s+/).pop();
    confere(antes.includes(classe),
      `"${sel}" é ajustado numa @container, mas a classe ${classe} não tem regra ` +
      `antes dela — ou a base está depois (e vence), ou a query não ajusta nada`);
  }
}

if (problemas.length) {
  for (const p of problemas) console.error(`  ✘ ${p}`);
  process.exit(1);
}
console.log(
  "  ✔ layout que encolhe: todo @container tem contêiner declarado (e todo " +
    "contêiner é usado), nenhuma @media de largura onde a janela é que muda, " +
    "todo grid de 3+ colunas tem versão estreita, e as queries vêm depois das " +
    "regras base"
);
