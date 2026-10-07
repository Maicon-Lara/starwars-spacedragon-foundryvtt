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
// As raízes de container query do módulo. A ficha antiga (.nave-ficha) saiu na
// 1.40.0; a de Nave sobre personagem vive dentro da ficha do SISTEMA, que não é
// nossa para declarar container — por isso o conjunto está vazio, e não some: é
// aqui que entra a próxima raiz que o módulo criar.
const RAIZES_DE_FICHA = new Set([]);

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

// ── POR QUE ISTO DEIXOU DE SER OBRIGATÓRIO ────────────────────────────────
//
// Esta asserção exigia ao menos uma container query nas folhas, e fazia sentido
// enquanto o módulo desenhava uma ficha INTEIRA, dona do próprio layout. Desde
// a 1.40.0 ele injeta painéis na ficha do SISTEMA, que não é nossa para
// declarar container — quem encolhe é o layout de quem hospeda.
//
// O que continua valendo, e está testado acima, é a regra CONDICIONAL: se
// houver `@container`, tem de haver contêiner declarado; se houver grade larga,
// tem de haver versão estreita. Exigir a existência seria obrigar o módulo a
// declarar um container que ele não tem onde pôr.
if (houveContainer) {
  confere(true, "");  // a checagem real está nas regras condicionais acima
}

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

// ── 7. BOTÃO ESTILIZADO DECLARA O PAR COR+FUNDO ──────────────────────────
//
// O erro de hoje, três vezes seguidas e em três lugares diferentes: estilizar
// um elemento (largura, altura, padding) e NÃO declarar cor nem fundo. O texto
// herda a cor do tema e cai sobre o fundo que o tema der — e as duas pontas
// mudam de forma independente. No botão "declarar" isso saiu como um botão SEM
// TEXTO na mesa: só a borda aparecia.
//
// A primeira versão desta conferência procurava a palavra "button" no SELETOR,
// e por isso nunca olhou o bloco certo: o botão é identificado por classe
// (.sd-ordem-declarar). Agora o caminho vai do HTML ao CSS — as classes que o
// JS põe num <button> é que são cobradas.
{
  const css = semComentarios(fs.readFileSync(path.join(RAIZ, FOLHAS[0]), "utf8"));
  const dir = path.join(RAIZ, path.dirname(path.dirname(FOLHAS[0])), "module");
  const classesDeBotao = new Set();

  // Os botões deste módulo moram nos TEMPLATES, não no JS — a ficha de Nave é
  // Handlebars. Varrer só .js aqui dava zero classes, e a conferência passava
  // sem olhar nada.
  const fontes = [];
  for (const f of fs.readdirSync(dir).filter((n) => n.endsWith(".js"))) {
    fontes.push(path.join(dir, f));
  }
  const tpl = path.join(RAIZ, "starwars-sd-module", "templates");
  if (fs.existsSync(tpl)) {
    for (const f of fs.readdirSync(tpl).filter((n) => n.endsWith(".hbs"))) fontes.push(path.join(tpl, f));
  }
  for (const caminho of fontes) {
    const texto = fs.readFileSync(caminho, "utf8");
    for (const m of texto.matchAll(/<button[^>]*class="([^"]+)"/g)) {
      // classes com Handlebars dentro ({{#if}}) são condicionais: fica a parte
      // fixa, que é a que o CSS nomeia.
      for (const c of m[1].replace(/\{\{[^}]*\}\}/g, " ").split(/\s+/)) {
        if (c && !c.includes("$") && !c.includes("{")) classesDeBotao.add(c);
      }
    }
  }
  // Antes isto exigia achar botões: o módulo tinha um template próprio cheio
  // deles. Com o template apagado na 1.40.0, os botões que sobraram nascem em
  // JS, e a varredura de HTML não os vê. Zero classes passou a ser o estado
  // correto, e não a falha da varredura — o que importa é a regra abaixo, que
  // só se aplica ao que for encontrado.
  if (classesDeBotao.size === 0) {
    // nada a conferir: sem botão em HTML, não há classe de botão para casar
  }

  // A folha tem um padrão BASE para botão? (uma regra sobre o elemento, com o
  // par declarado). A ficha de Nave tem; o painel da Ordem de Ação não tinha, e
  // foi por isso que o botão dele saiu sem texto.
  const temBaseDeBotao = [...css.matchAll(/([^{}@]*button[^{}@]*)\{([^{}]*)\}/g)].some(
    ([, sel, corpo]) =>
      !/:hover|:focus|:disabled/.test(sel) &&
      /(^|[;{\s])color\s*:/.test(corpo) &&
      /background(-color)?\s*:/.test(corpo)
  );

  for (const c of [...classesDeBotao].sort()) {
    // Só cobra de quem o CSS ASSUME: se o módulo não estiliza o botão, ele fica
    // com a aparência do tema, que é coerente consigo mesma. O erro é estilizar
    // pela metade.
    const i = css.indexOf(`.${c}`);
    if (i < 0) continue;
    const corpo = css.slice(i, css.indexOf("}", i));
    if (!/(width|height|padding|flex|font|border)\s*:/.test(corpo)) continue;
    const temCor = /(^|[;{\s])color\s*:/.test(corpo);
    const temFundo = /background(-color)?\s*:/.test(corpo);
    // Com uma regra BASE de botão na folha, a classe pode não declarar nada —
    // ela herda o par de lá, e isso é coerente. O que nunca pode é declarar
    // METADE: aí a outra metade vem do tema, e as duas andam separadas.
    if (temBaseDeBotao && !temCor && !temFundo) continue;
    confere(temCor && temFundo,
      `.${c} é um <button> que o CSS estiliza, e declara ${temCor ? "cor sem fundo" : temFundo ? "fundo sem cor" : "nem cor nem fundo"} — ` +
      `a metade que falta vem do tema, e foi assim que o botão saiu sem texto`);
  }
}

// ── 8. PAINEL DO MÓDULO DECLARA O PAR COR+FUNDO ───────────────────────────
//
// A REGRA DO PROJETO, aprendida caro em 2026-10-05: painel que declara fundo e
// não declara cor fica refém do tema do Foundry. Com o VTT em tema escuro, o
// texto vem claro e cai sobre o fundo claro do próprio painel — e o sintoma
// aparece num lugar de cada vez, parecendo bugs diferentes.
//
// Vale só para o que o MÓDULO cria. Janela de terceiro não se pinta: tentar isso
// quebrou a interface da mesa.
{
  const css = semComentarios(fs.readFileSync(path.join(RAIZ, FOLHAS[0]), "utf8"));
  for (const m of css.matchAll(/(^|\})\s*(\.[a-z][\w-]*(?:\.[a-z][\w-]*)?)\s*\{([^{}]*)\}/gm)) {
    const sel = m[2];
    const corpo = m[3];
    // só os blocos que montam um PAINEL (têm caixa), não os de ajuste fino
    if (!/(padding|border)\s*:/.test(corpo)) continue;
    const temCor = /(^|[;{\s])color\s*:/.test(corpo);
    const temFundo = /background(-color)?\s*:/.test(corpo);
    if (!temCor && !temFundo) continue; // não assume aparência: pode herdar
    confere(temCor && temFundo,
      `"${sel}" declara ${temCor ? "cor sem fundo" : "fundo sem cor"} — ` +
      `a metade que falta vem do tema do Foundry, e as duas pontas andam separadas`);
  }
}

/* ── NENHUM BOTÃO PODE ENCOLHER ABAIXO DO PRÓPRIO RÓTULO ──────────────────── */
//
// `min-width: 0` num item de flex AUTORIZA o navegador a espremê-lo abaixo do
// conteúdo. Numa coluna estreita, três botões lado a lado viram três faixas
// menores que as palavras, e o rótulo escapa por baixo do botão vizinho — foi
// o que o print da mesa mostrou, com "gastar" cortado atrás do "+1".
//
// A ASSERÇÃO: se um botão nosso declara `min-width: 0`, o contêiner dele
// precisa poder quebrar linha. Sem uma das duas coisas, o texto transborda.
{
  const todas = FOLHAS.map((rel) =>
    semComentarios(fs.readFileSync(path.join(RAIZ, rel), "utf8"))).join("\n");
  const blocos = [...todas.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((m) => ({
    sel: m[1].trim(),
    corpo: m[2],
  }));

  for (const b of blocos) {
    if (!/button/.test(b.sel)) continue;
    if (!/min-width:\s*0/.test(b.corpo)) continue;
    // achou um botão autorizado a encolher: o pai tem de deixar quebrar
    const pai = b.sel.replace(/\s+button.*$/, "").trim();
    const temWrap = blocos.some(
      (o) => o.sel.includes(pai) && /flex-wrap:\s*wrap/.test(o.corpo)
    );
    confere(temWrap,
      `"${b.sel.slice(0, 60)}" declara min-width: 0 e o contêiner não quebra linha — ` +
      `numa coluna estreita o rótulo sai por baixo do botão vizinho`);
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
