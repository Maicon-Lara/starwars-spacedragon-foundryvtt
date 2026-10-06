// Teste dos modos de tema do livro: pergaminho e espaço, forçados ou não.
//
// ── O BUG QUE ESTE TESTE EXISTE PARA NÃO DEIXAR VOLTAR ──────────────────────
//
// O tema tem dois conjuntos de variáveis: os `--sd-*` da ficha e os `--sw-*` do
// livro. Quando o modo forçado foi criado, só os `--sd-*` passaram a ceder a
// ele. Com o Foundry em tema escuro e o pergaminho ligado, o fundo vinha claro
// e `--sw-cor` continuava `#ffd93b`: o painel de Pontos de Força ficava
// amarelo-neon sobre papel.
//
// ── A ASSERÇÃO QUE MAIS IMPORTA ─────────────────────────────────────────────
//
// Que os CONJUNTOS DE NOMES sejam iguais. Um modo que define dez das onze
// variáveis não erra feio — erra pela metade, que é pior: a tela fica
// quase certa, e a única variável esquecida é a que ninguém procura.
//
// Uso: node tools/teste-modos.mjs

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = path.resolve(fileURLToPath(import.meta.url), "../..");
const CSS = fs
  .readFileSync(path.join(RAIZ, "starwars-sd-module", "styles", "livro.css"), "utf8")
  .replace(/\/\*[\s\S]*?\*\//g, "");

const problemas = [];
const confere = (ok, msg) => { if (!ok) problemas.push(msg); };

/**
 * As declarações de um bloco, achado pelo seu seletor EXATO.
 *
 * Casar por `includes` seria errado: ".theme-dark" aparece dentro de
 * "body.sw-papel .theme-dark", e os dois blocos seriam confundidos. Esta
 * sessão já perdeu tempo com exatamente esse tipo de substring.
 */
function declaracoesDe(seletorExato) {
  for (const m of CSS.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const seletores = m[1].split(",").map((x) => x.trim()).filter(Boolean);
    if (!seletores.includes(seletorExato)) continue;
    const vars = {};
    for (const d of m[2].matchAll(/(--[a-z0-9-]+)\s*:\s*([^;]+);/gi)) {
      vars[d[1]] = d[2].trim();
    }
    return vars;
  }
  return null;
}

const claro = declaracoesDe(":root");
const escuro = declaracoesDe("body.theme-dark");
const papelForcado = declaracoesDe("body.sw-papel");
const espacoForcado = declaracoesDe("body.sw-espaco");

confere(claro, "não achei o bloco :root");
confere(escuro, "não achei o bloco body.theme-dark");
confere(papelForcado, "não achei o bloco body.sw-papel — o pergaminho forçado não repõe nada");
confere(espacoForcado, "não achei o bloco body.sw-espaco");

if (claro && escuro && papelForcado && espacoForcado) {
  // As variáveis que o modo escuro TROCA são exatamente as que um modo forçado
  // precisa devolver. Esta é a lista que manda.
  const trocadas = Object.keys(escuro).filter((v) => v.startsWith("--sw-"));
  confere(trocadas.length >= 10,
    `o bloco escuro troca só ${trocadas.length} variáveis --sw-* — a lista parece incompleta`);

  for (const v of trocadas) {
    confere(v in papelForcado,
      `o modo escuro troca ${v}, e o PERGAMINHO FORÇADO não devolve. ` +
      `Foi assim que o painel de Pontos de Força ficou amarelo sobre papel`);
    confere(v in espacoForcado,
      `o modo escuro troca ${v}, e o ESPAÇO FORÇADO não a define — com o Foundry ` +
      `em tema claro ela fica no valor de papel, escura sobre fundo escuro`);
  }

  // O pergaminho forçado tem de dar os valores do CLARO, e não outros: se
  // divergirem, o mesmo pergaminho fica com duas aparências dependendo de como
  // se chegou nele.
  for (const v of trocadas) {
    if (!(v in claro) || !(v in papelForcado)) continue;
    confere(claro[v] === papelForcado[v],
      `${v} vale "${claro[v]}" no claro e "${papelForcado[v]}" no pergaminho forçado — ` +
      `o mesmo modo com duas aparências`);
  }
  // e o espaço forçado, os valores do escuro
  for (const v of trocadas) {
    if (!(v in espacoForcado)) continue;
    confere(escuro[v] === espacoForcado[v],
      `${v} vale "${escuro[v]}" no escuro e "${espacoForcado[v]}" no espaço forçado`);
  }

  /* ── A ESPECIFICIDADE ──────────────────────────────────────────────────── */
  //
  // `body.sw-papel` sozinho EMPATA com `body.theme-dark` e só vence pela ordem
  // no arquivo. Um bloco movido de lugar inverteria o tema sem erro visível no
  // código, então os seletores com classe dupla são obrigatórios.
  for (const [modo, oposto] of [["sw-papel", "theme-dark"], ["sw-espaco", "theme-light"]]) {
    confere(CSS.includes(`body.${modo}.${oposto}`),
      `falta body.${modo}.${oposto} — sem ele o modo forçado empata com o tema do ` +
      `Foundry e vence só pela ordem do arquivo`);
    confere(CSS.includes(`body.${modo} .${oposto}`),
      `falta body.${modo} .${oposto} — o Foundry marca CADA JANELA com a classe do ` +
      `tema, e dentro delas o modo forçado não valeria`);
  }

  /* ── O AMARELO DO CRAWL NÃO PINTA TEXTO SOBRE PAPEL ────────────────────── */
  //
  // O sintoma relatado pela mesa, dito em valores: no papel, --sw-cor é um ouro
  // escuro, e nunca o #ffd93b da tela.
  confere(!/ffd93b/i.test(papelForcado["--sw-cor"] ?? ""),
    "o pergaminho forçado deixa --sw-cor no amarelo do crawl");
  confere(!/crawl/.test(papelForcado["--sw-cor"] ?? ""),
    `o pergaminho forçado aponta --sw-cor para ${papelForcado["--sw-cor"]} — ` +
    `o crawl é a cor de TELA, e sobre papel ela não se lê`);
}

if (problemas.length) {
  for (const p of problemas) console.error(`  ✘ ${p}`);
  process.exit(1);
}
console.log(
  "  ✔ modos de tema: pergaminho e espaço forçados devolvem TODAS as variáveis que o " +
    "tema escuro troca, com os mesmos valores do modo que imitam, a especificidade que " +
    "vence o tema do Foundry (inclusive dentro das janelas), e o crawl fora do papel"
);
