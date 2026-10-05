// Teste dos cartões que o módulo manda ao chat.
//
// ── POR QUE ESTE TESTE EXISTE ───────────────────────────────────────────────
//
// O cartão da Ordem de Ação saiu ilegível na mesa: texto em rgb(217,214,204) —
// bege claro — sobre o pergaminho claro do chat. Medido no console, não
// suposto. Só o título sobrevivia, porque `.title` tem cor própria do sistema.
//
// A cor herdada do chat muda com o tema do Foundry, com o sistema e com
// qualquer módulo de interface instalado. Então o cartão não pode depender
// dela: fundo e cor próprios, declarados juntos.
//
// A parte que este teste guarda é a OUTRA metade do erro. Quando a correção foi
// escrita, metade dos cartões deste módulo não tinha a marca — os de Pontos de
// Força e os da ficha de Nave montavam `.title` e parágrafos soltos. Eles
// ficariam ilegíveis mesmo depois da correção, e ninguém notaria até alguém
// gastar um Ponto de Força na mesa.
//
// Por isso aqui não se confere só o CSS: confere-se que TODO `ChatMessage`
// deste módulo nasce dentro da marca.
//
// Uso: node tools/teste-cartoes.mjs

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = path.resolve(fileURLToPath(import.meta.url), "../..");
const MODULO = path.join(RAIZ, "starwars-sd-module");
const FOLHA = "starwars-sd.css";
const MARCA = "sw-cartao";

const problemas = [];
const confere = (ok, msg) => { if (!ok) problemas.push(msg); };

/* ── TODO CARTÃO NASCE COM A MARCA ───────────────────────────────────────── */

const arquivos = fs.readdirSync(path.join(MODULO, "module")).filter((f) => f.endsWith(".js"));
let cartoes = 0;

for (const f of arquivos) {
  const js = fs.readFileSync(path.join(MODULO, "module", f), "utf8");

  // Cada `content:` de um ChatMessage.create. A regex pega o início do valor,
  // que é onde a marca precisa estar — em algum ponto dele, não necessariamente
  // abrindo. Aqui a marca envolve o cartão inteiro, título incluído; no módulo
  // base ela envolve só o corpo, porque lá o `.title` fica fora. As duas formas
  // valem — o que não vale é um cartão sem marca nenhuma.
  for (const m of js.matchAll(/ChatMessage\.create\(\{/g)) {
    const trecho = js.slice(m.index, js.indexOf("});", m.index) + 3);
    if (!/content:/.test(trecho)) continue;
    cartoes += 1;
    const abertura = (trecho.match(/content:\s*\n?\s*`([^`]{0,60})/) ?? [])[1] ?? "?";
    confere(trecho.includes(MARCA),
      `${f}: um ChatMessage ("${abertura.slice(0, 44)}…") não tem .${MARCA} em lugar ` +
      `nenhum — o corpo dele sai ilegível, porque herda a cor do tema`);
  }

  // E as <div> abrem e fecham DENTRO de cada cartão: uma marca aberta e não
  // fechada engole o resto, e o Foundry não reclama — ele só renderiza torto.
  //
  // Contar `</div>` isolados no arquivo inteiro não serve: o fechamento pode vir
  // colado no fim de outra string (`…</p></div>`), e o arquivo tem <div> de
  // painel de ficha que nada têm a ver com o cartão. O que se mede é o
  // BALANCEAMENTO no trecho de cada ChatMessage.
  for (const m of js.matchAll(/ChatMessage\.create\(\{/g)) {
    const trecho = js.slice(m.index, js.indexOf("});", m.index) + 3);
    if (!trecho.includes(MARCA)) continue;
    const abre = (trecho.match(/<div[\s>]/g) ?? []).length;
    const fecha = (trecho.match(/<\/div>/g) ?? []).length;
    confere(abre === fecha,
      `${f}: um cartão abre ${abre} <div> e fecha ${fecha} — o HTML sai torto e o Foundry não avisa`);
  }
}

confere(cartoes >= 4, `só ${cartoes} cartões encontrados — a varredura deve ter deixado de achar algum`);

/* ── O CONTRASTE, CALCULADO ──────────────────────────────────────────────── */

{
  const css = fs
    .readFileSync(path.join(MODULO, "styles", "starwars-sd.css"), "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "");

  const luminancia = (hex) => {
    const n = hex.replace("#", "");
    const c = [0, 2, 4]
      .map((i) => parseInt(n.slice(i, i + 2), 16) / 255)
      .map((x) => (x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4));
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  };
  const contraste = (a, b) => {
    const [maior, menor] = [luminancia(a), luminancia(b)].sort((x, y) => y - x);
    return (maior + 0.05) / (menor + 0.05);
  };

  const i = css.indexOf(`.chat-message .${MARCA} {`);
  confere(i > 0, `não há regra para .chat-message .${MARCA} — o cartão herdaria a cor do chat`);
  const bloco = i > 0 ? css.slice(i, css.indexOf("}", i)) : "";

  const fundo = bloco.match(/background:\s*(#[0-9a-fA-F]{6})/)?.[1];
  const cor = bloco.match(/color:\s*(#[0-9a-fA-F]{6})/)?.[1];
  confere(!!fundo && !!cor,
    "fundo e cor têm de vir JUNTOS: fundo sem cor herda o texto do tema (foi o bug), " +
    "e cor sem fundo aposta no que o chat faz");

  if (fundo && cor) {
    const r = contraste(cor, fundo);
    confere(r >= 4.5, `contraste do cartão ${r.toFixed(2)}:1 — a WCAG pede 4,5:1`);
  }

  // O `!important` aqui NÃO é preguiça, e o teste o exige: a primeira versão
  // declarou o par sem ele e perdeu para o CSS de fora — medido no console da
  // mesa, rgb(217,214,204) continuou valendo. Sem o !important o bug volta.
  confere(/color:\s*#[0-9a-fA-F]{6}\s*!important/.test(bloco),
    "a cor precisa de !important: sem ele perde para o CSS que pinta o chat");
  confere(/background:\s*#[0-9a-fA-F]{6}\s*!important/.test(bloco),
    "o fundo precisa de !important pelo mesmo motivo");

  // E `opacity` não entra: ela mascara a queda de contraste.
  confere(!/opacity:/.test(bloco), "o cartão não deve usar opacity — ela esconde o contraste perdido");
}

/* ── TODA CLASSE DO CARTÃO ESTÁ NOMEADA NO CSS ───────────────────────────── */
//
// A ASSERÇÃO QUE FECHA ESTE BUG. Cobrir os filhos por ELEMENTO (`p`, `span`)
// não bastou na mesa: ficaram legíveis só as classes que o CSS nomeava, e
// continuaram invisíveis as outras — entre elas `.result`, a mais usada dos
// cartões. É especificidade: uma regra de elemento perde para uma regra de
// classe com `!important` do outro lado.
//
// Então o CSS precisa nomear cada classe, e este teste recusa qualquer classe
// nova que apareça num cartão e não tenha sido coberta. Sem ele, o próximo
// cartão com uma classe nova volta a sair pela metade, e em silêncio.
{
  const css = fs
    .readFileSync(path.join(MODULO, "styles", FOLHA), "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "");

  // `title` tem cor própria do sistema e sobreviveu ao bug no print da mesa;
  // a própria marca e o escopo de livro não são texto.
  const ISENTAS = new Set(["title", MARCA, "starwars-sd-doc"]);
  const usadas = new Set();

  for (const f of arquivos) {
    const js = fs.readFileSync(path.join(MODULO, "module", f), "utf8");
    for (const m of js.matchAll(/ChatMessage\.create\(\{/g)) {
      const trecho = js.slice(m.index, js.indexOf("});", m.index) + 3);
      for (const c of trecho.matchAll(/class="([a-z0-9 -]+)"/g)) {
        for (const nome of c[1].split(/\s+/)) if (nome && !ISENTAS.has(nome)) usadas.add(nome);
      }
    }
  }

  confere(usadas.size > 0, "nenhuma classe encontrada nos cartões — a varredura falhou");

  for (const nome of [...usadas].sort()) {
    confere(css.includes(`.${MARCA} .${nome}`),
      `a classe .${nome} aparece num cartão e o CSS não a nomeia — ela vai herdar a ` +
      `cor do tema e sair invisível, como aconteceu com .result`);
  }
}

if (problemas.length) {
  for (const p of problemas) console.error(`  ✘ ${p}`);
  process.exit(1);
}
console.log(
  `  ✔ cartões no chat: os ${cartoes} ChatMessage do módulo nascem em .${MARCA}, ` +
    "as <div> fecham, e o par cor+fundo tem !important e contraste medido"
);
