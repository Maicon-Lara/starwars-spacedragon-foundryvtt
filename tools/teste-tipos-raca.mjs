// Teste dos tipos de nave (T10-1) gerados como itens de RAÇA.
//
// ── A ASSERÇÃO QUE MAIS IMPORTA ─────────────────────────────────────────────
//
// `natural_armor` é a CA **BASE**, e não um bônus: o sistema RETORNA esse valor
// no lugar dos 10 padrão. Essa distinção já custou caro neste projeto — o
// módulo escrevia 1 ali para dizer "+1 natural", e o resultado foi um Wookiee
// com CA total −3, que toda criatura da galáxia acertava automaticamente.
//
// Numa nave o erro seria pior e mais discreto: um Caça com `natural_armor: 18`
// (pensando "28 − 10") teria CP 18, e o Mestre levaria sessões para notar que
// os caças morrem demais.
//
// Uso: node tools/teste-tipos-raca.mjs

import { tiposComoRaca, metrosDe, habilidadeDoTipo } from "./data/tipos-como-raca.mjs";
import { TIPOS } from "../starwars-sd-module/module/tipos-de-nave.js";

const problemas = [];
const confere = (ok, msg) => { if (!ok) problemas.push(msg); };

/* ── OS OITO TIPOS ────────────────────────────────────────────────────────── */

confere(tiposComoRaca.length === 8, `a T10-1 tem 8 tipos, geraram ${tiposComoRaca.length}`);

for (const r of tiposComoRaca) {
  const t = TIPOS[r.chave];
  confere(!!t, `o tipo ${r.chave} não existe na T10-1`);
  if (!t) continue;

  confere(r.nome === t.rotulo, `${r.chave}: o nome não é o da tabela`);

  // ── A CA BASE ──────────────────────────────────────────────────────────
  confere(r.habilidade.natural_armor === t.cp,
    `${t.rotulo}: natural_armor ${r.habilidade.natural_armor}, e o CP da tabela é ${t.cp}. ` +
    `É a CA BASE, não um bônus — escrever ${t.cp - 10} aqui daria CP ${t.cp - 10}`);

  // ── O MOVIMENTO ────────────────────────────────────────────────────────
  confere(r.movement === metrosDe(t.mov),
    `${t.rotulo}: movimento ${r.movement}, a tabela diz ${t.mov}`);
  confere(r.movement > 0, `${t.rotulo}: movimento zero — a nave não sairia do lugar`);

  // ── O QUE A RAÇA NÃO CARREGA FICA ESCRITO ──────────────────────────────
  //
  // BA e JP vêm da classe no sistema, e o PV é fórmula. Se não estiverem no
  // texto da habilidade, somem — e o Mestre fica sem os três números no meio
  // do combate.
  const d = r.habilidade.desc;
  confere(d.includes(`+${t.ba}`), `${t.rotulo}: a BA +${t.ba} não aparece na habilidade`);
  confere(d.includes(`${t.jp}`), `${t.rotulo}: a JP ${t.jp} não aparece na habilidade`);
  confere(d.includes(t.pv), `${t.rotulo}: a fórmula de PV ${t.pv} não aparece na habilidade`);
  confere(/menor é melhor/.test(d),
    `${t.rotulo}: a habilidade não avisa que a JP é número-alvo — é o que a mesa mais erra`);
  confere(d.includes(t.tamanho), `${t.rotulo}: o tamanho não aparece, e ele decide o que cabe (T10-4)`);

  // nave não tem tendência de alinhamento
  confere(r.alignment_tendency === "none",
    `${t.rotulo}: a nave recebeu tendência de alinhamento "${r.alignment_tendency}"`);
}

/* ── O COLOSSO É MARCADO ──────────────────────────────────────────────────── */
//
// Cruzador e Nave-mãe só fazem Reta, Inclinada e Parar. Isso vale no Combate
// Tático, e mesmo quem não o usa precisa saber que a nave é dessa escala.
{
  for (const [chave, t] of Object.entries(TIPOS)) {
    if (!t.colosso) continue;
    const r = tiposComoRaca.find((x) => x.chave === chave);
    confere(/colosso/i.test(r.habilidade.desc), `${t.rotulo} é colosso e a habilidade não diz`);
  }
}

/* ── A CONVERSÃO DO MOVIMENTO ─────────────────────────────────────────────── */
confere(metrosDe("150 m") === 150, "150 m → 150");
confere(metrosDe("20 m") === 20, "20 m → 20");
confere(metrosDe("") === 0 && metrosDe(undefined) === 0, "vazio não quebra");
confere(metrosDe("sem número") === 0, "texto sem número vira 0");

/* ── A HABILIDADE É GERADA DA TABELA, NÃO ESCRITA À MÃO ──────────────────── */
//
// Se alguém editar a tabela, a habilidade acompanha. Uma habilidade com números
// digitados viraria mentira na primeira correção da T10-1.
{
  const falso = { rotulo: "Teste", tamanho: "Média", tripulacao: "2", cp: 99,
                  mov: "77 m", ba: 7, jp: 9, pv: "5d10", esquiva: 4 };
  const h = habilidadeDoTipo("teste", falso);
  confere(h.natural_armor === 99, "a habilidade não leu o CP da tabela");
  for (const esperado of ["99", "77 m", "+7", "9", "5d10", "4d6"]) {
    confere(h.desc.includes(esperado), `a habilidade não reflete "${esperado}" da tabela`);
  }
}

if (problemas.length) {
  for (const p of problemas) console.error(`  ✘ ${p}`);
  process.exit(1);
}
console.log(
  `  ✔ tipos como raça: os 8 da T10-1, o CP como CA BASE (e não bônus), o movimento ` +
    `em metros, a BA/JP/PV escritas na habilidade, o colosso marcado e tudo gerado da tabela`
);
