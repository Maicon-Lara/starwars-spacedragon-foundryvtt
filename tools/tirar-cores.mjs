// Remove as declarações de COR de uma folha, mantendo tudo o mais.
//
// ── POR QUE ISTO É UMA FERRAMENTA, E NÃO UMA EDIÇÃO À MÃO ───────────────────
//
// São centenas de declarações em seis folhas. À mão, o erro não é escrever
// errado: é esquecer uma, e uma regra de cor esquecida no meio de uma folha
// sem cor é pior que a folha inteira colorida — ela pinta um pedaço só, e
// ninguém acha de onde veio.
//
// ── O QUE SAI E O QUE FICA ──────────────────────────────────────────────────
//
// Sai: `color`, `background`, as bordas COLORIDAS, `accent-color`,
// `text-decoration-color`, `box-shadow`, `opacity`, e as variáveis `--sw-*` e
// `--sd-*` que guardam cor.
//
// Fica: toda a tipografia (`font-*`, `letter-spacing`, `text-transform`), o
// layout (`display`, `flex`, `grid`, `margin`, `padding`, `gap`), e as bordas
// que são ESTRUTURA — `border-width`, `border-style`, `border-radius` —, porque
// uma caixa sem contorno deixa de ser caixa.
//
// Uso: node tools/tirar-cores.mjs <arquivo.css> [...]

import fs from "node:fs";

/** As propriedades que carregam cor. */
const PROP_DE_COR = [
  /^color$/,
  /^background(-color|-image)?$/,
  /^border(-top|-right|-bottom|-left)?-color$/,
  /^outline-color$/,
  /^accent-color$/,
  /^text-decoration-color$/,
  /^box-shadow$/,
  /^text-shadow$/,
  /^fill$/,
  /^stroke$/,
  /^caret-color$/,
  // o prefixo da WebKit para a cor do texto: mesma coisa com outro nome, e o
  // removedor não o conhecia — sobrou pintando quatro regras numa folha que
  // deveria estar sem cor nenhuma
  /^-webkit-text-fill-color$/,
  /^-webkit-text-stroke(-color)?$/,
];

/** As variáveis que guardam cor — as de tipografia têm nomes próprios. */
const VAR_DE_COR =
  /^--(sw|sd|starwars-sd|spacedragon)-(?!serif|display|condensada|font)|^--color-/;
// `--color-*` são as variáveis de cor do PRÓPRIO Foundry, que o módulo
// redefinia para impor a paleta dele. Elas não têm o prefixo do módulo e
// escapavam da limpeza — sobravam apontando para variáveis nossas que já
// tinham sido removidas, o que é pior que pintar: é pintar com o vazio.

/** Esta declaração é de cor? */
export function ehCor(prop, valor) {
  const p = prop.trim().toLowerCase();
  if (VAR_DE_COR.test(p)) return true;
  if (PROP_DE_COR.some((rx) => rx.test(p))) return true;
  // `border: 1px solid #ccc` é mista: a cor sai, a estrutura fica. Tratada à
  // parte em `limparDeclaracao`.
  return false;
}

/**
 * Uma declaração limpa, ou null se ela sumir por inteiro.
 *
 * O caso misto é `border: 1px solid cor`: a largura e o estilo são estrutura e
 * ficam; só a cor sai. Jogar a regra inteira fora apagaria o contorno da caixa.
 */
export function limparDeclaracao(prop, valor) {
  const p = prop.trim().toLowerCase();
  if (ehCor(p, valor)) return null;

  if (/^border(-top|-right|-bottom|-left)?$/.test(p) || p === "outline") {
    /* ── O SPLIT TEM DE RESPEITAR OS PARÊNTESES ────────────────────────
     *
     * `border: 1px solid color-mix(in srgb, var(--x) 40%, transparent)` tem
     * espaços DENTRO da função. Partindo por espaço, `color-mix(in` e `srgb,`
     * viram pedaços soltos — e o resultado foi `border: 1px solid srgb,;`,
     * que não é CSS válido e quebra a regra inteira.
     *
     * Este split conta parênteses e só corta no nível zero.
     */
    const partes = [];
    let atual = "";
    let nivel = 0;
    for (const ch of valor.trim()) {
      if (ch === "(") nivel += 1;
      else if (ch === ")") nivel -= 1;
      if (/\s/.test(ch) && nivel === 0) {
        if (atual) partes.push(atual);
        atual = "";
      } else {
        atual += ch;
      }
    }
    if (atual) partes.push(atual);
    const semCor = partes.filter((x) => !pareceCor(x));
    return semCor.length ? `${prop.trim()}: ${semCor.join(" ")}` : null;
  }
  return `${prop.trim()}: ${valor.trim()}`;
}

/** Este pedaço de valor é uma cor? */
function pareceCor(x) {
  const v = x.trim().toLowerCase();
  return (
    v.startsWith("#") ||
    /^(rgb|rgba|hsl|hsla|color-mix)\(/.test(v) ||
    /^var\(--(sw|sd)-/.test(v) ||
    ["transparent", "currentcolor", "inherit", "black", "white", "red", "green", "blue"].includes(v)
  );
}

/** A folha sem cor. Devolve o texto novo e quantas declarações saíram. */
export function tirarCores(css) {
  let fora = 0;
  const saida = [];
  let i = 0;

  while (i < css.length) {
    const abre = css.indexOf("{", i);
    if (abre < 0) {
      saida.push(css.slice(i));
      break;
    }
    // acha o fecho correspondente
    let nivel = 0;
    let j = abre;
    for (; j < css.length; j += 1) {
      if (css[j] === "{") nivel += 1;
      else if (css[j] === "}") {
        nivel -= 1;
        if (nivel === 0) break;
      }
    }
    const sel = css.slice(i, abre);
    const miolo = css.slice(abre + 1, j);

    // bloco @ (media/container): processa o interior e mantém
    if (sel.replace(/\/\*[\s\S]*?\*\//g, "").trim().startsWith("@")) {
      const dentro = tirarCores(miolo);
      fora += dentro.fora;
      if (dentro.css.trim()) saida.push(`${sel}{${dentro.css}}`);
      i = j + 1;
      continue;
    }

    const decls = [];
    for (const d of miolo.split(";")) {
      const bruto = d.trim();
      if (!bruto) continue;
      // comentário solto entre declarações: preserva
      if (bruto.startsWith("/*") && bruto.endsWith("*/")) {
        decls.push(bruto);
        continue;
      }
      /* ── O COMENTÁRIO SAI ANTES DE PROCURAR O ":" ──────────────────────
       *
       * Duas armadilhas, as duas vividas:
       *
       *   1. Dividindo por `;`, um comentário colado na linha de cima vem
       *      junto, e o nome da propriedade passa a incluí-lo.
       *   2. Pior: um `:` DENTRO do comentário é encontrado primeiro. Em
       *      "/* o par: sem a cor… * / color: var(…)", o corte caía no "o par:"
       *      e a declaração de cor passava intacta — foi assim que uma `color`
       *      sobreviveu a três passagens da limpeza.
       *
       * Então o comentário é separado primeiro, e o `:` é procurado no que
       * sobra.
       */
      const comentarios = bruto.match(/\/\*[\s\S]*?\*\//g) ?? [];
      const semComentario = bruto.replace(/\/\*[\s\S]*?\*\//g, "").trim();
      for (const c of comentarios) decls.push(c);
      if (!semComentario) continue;

      const corte = semComentario.indexOf(":");
      if (corte < 0) {
        decls.push(semComentario);
        continue;
      }
      const prop = semComentario.slice(0, corte).trim();
      const valor = semComentario.slice(corte + 1);
      const limpa = limparDeclaracao(prop, valor);
      if (limpa === null) fora += 1;
      else decls.push(limpa);
    }

    const temAlgo = decls.some((d) => !d.startsWith("/*"));
    if (temAlgo) {
      saida.push(`${sel}{\n  ${decls.join(";\n  ")};\n}`);
    }
    i = j + 1;
  }

  return { css: saida.join("").replace(/\n{3,}/g, "\n\n"), fora };
}

/* ── Linha de comando ─────────────────────────────────────────────────────── */
if (process.argv[1]?.endsWith("tirar-cores.mjs")) {
  for (const arq of process.argv.slice(2)) {
    const antes = fs.readFileSync(arq, "utf8");
    const { css, fora } = tirarCores(antes);
    fs.writeFileSync(arq, css, "utf8");
    console.log(`  ${arq}: ${fora} declaração(ões) de cor removida(s), ` +
      `${antes.length} → ${css.length} bytes`);
  }
}
