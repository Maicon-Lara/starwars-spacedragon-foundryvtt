// Teste das classes de nave (uma por tipo) e dos cômodos como habilidades.
//
// ── AS DUAS ASSERÇÕES QUE MAIS IMPORTAM ─────────────────────────────────────
//
// 1. O DADO DE VIDA FICA VAZIO. O campo `hp` da classe é o dado de vida POR
//    NÍVEL, e a T10-1 dá uma fórmula fechada (1d100, 2d1000). Escrever 100 ali
//    faria a nave ganhar 1d100 a CADA nível — outra regra, e uma que infla a
//    nave sem ninguém pedir.
//
// 2. OS CÔMODOS SÃO COMPARTILHADOS. As doze habilidades são as mesmas para as
//    oito classes. Se cada classe gerasse as suas, corrigir a descrição de uma
//    câmara viraria oito edições, e sete delas seriam esquecidas.
//
// Uso: node tools/teste-classes-nave.mjs

import { classesDeNave, comodosDaNave, niveisDoTipo } from "./data/classes-de-nave.mjs";
import { TIPOS } from "../starwars-sd-module/module/tipos-de-nave.js";
import { CAMARAS } from "../starwars-sd-module/module/camaras.js";

const problemas = [];
const confere = (ok, msg) => { if (!ok) problemas.push(msg); };

/* ── UMA CLASSE POR TIPO ──────────────────────────────────────────────────── */

confere(classesDeNave.length === Object.keys(TIPOS).length,
  `${classesDeNave.length} classes para ${Object.keys(TIPOS).length} tipos`);

for (const c of classesDeNave) {
  const t = TIPOS[c.chave];
  confere(!!t, `a classe ${c.chave} não corresponde a um tipo da T10-1`);
  if (!t) continue;

  // ── BA E JP, QUE É O MOTIVO DE EXISTIR UMA CLASSE POR TIPO ─────────────
  const niveis = Object.values(c.levels);
  confere(niveis.length === 20, `${c.nome}: ${niveis.length} níveis, deviam ser 20`);
  confere(niveis.every((n) => n.ba === t.ba),
    `${c.nome}: a BA devia ser +${t.ba} em todo nível — é o que a classe existe para dar`);
  confere(niveis.every((n) => n.jp === t.jp),
    `${c.nome}: a JP devia ser ${t.jp} em todo nível`);

  // ── O DADO DE VIDA ─────────────────────────────────────────────────────
  confere(c.dv == null,
    `${c.nome}: dado de vida ${c.dv} — este campo é PV POR NÍVEL, e a T10-1 dá ` +
    `uma fórmula fechada (${t.pv}). A nave ganharia isso a cada nível`);
  confere(c.descricao.includes(t.pv),
    `${c.nome}: a fórmula de PV (${t.pv}) não aparece na descrição, e é lá que ela mora agora`);

  // ── O SEED DISTINGUE DA RAÇA ───────────────────────────────────────────
  //
  // A raça e a classe de um tipo têm o MESMO nome visível ("Caça"). Sem um seed
  // diferente, as duas gerariam o mesmo id e uma sobrescreveria a outra no pack.
  confere(c.seedNome && c.seedNome !== c.nome,
    `${c.nome}: o seed do id é igual ao nome, e a raça de mesmo nome colidiria com ela`);
  confere(c.seedNome.includes(t.rotulo), `${c.nome}: o seed não identifica o tipo`);

  // a descrição aponta de onde vem cada metade
  confere(/CP/.test(c.descricao) && /raça/i.test(c.descricao),
    `${c.nome}: a descrição não diz que o CP vem da raça — quem lê só a classe fica sem metade`);
}

/* ── OS CÔMODOS, COMPARTILHADOS ───────────────────────────────────────────── */

confere(comodosDaNave.length === Object.keys(CAMARAS).length,
  `${comodosDaNave.length} cômodos para ${Object.keys(CAMARAS).length} câmaras da T10-2`);

for (const c of comodosDaNave) {
  const camara = CAMARAS[c.chave];
  confere(!!camara, `o cômodo ${c.chave} não é uma câmara da T10-2`);
  if (!camara) continue;
  confere(c.nome === camara.rotulo, `${c.chave}: o nome não é o da tabela`);
  confere(c.desc.includes(camara.efeito.slice(0, 30)),
    `${c.nome}: a descrição não traz o efeito do livro`);
  // o custo e o reparo: é o que a mesa consulta ao decidir consertar ou trocar
  if (camara.obra) {
    confere(/Obra:/.test(c.desc), `${c.nome}: falta o custo da obra`);
    confere(/Reparo em campo:/.test(c.desc), `${c.nome}: falta o reparo em campo (25%, T10-2)`);
  }
  // nível 1: o cômodo existe desde que a nave existe; o que muda é o ESTADO
  confere(c.level === 1,
    `${c.nome}: nível ${c.level} — cômodo não se ganha subindo de nível, nave não sobe`);
  // a flag é o que liga o cômodo ao estado na ficha
  confere(c.flags?.["starwars-sd"]?.camaraDeNave?.chave === c.chave,
    `${c.nome}: a flag que liga o cômodo ao estado está errada ou ausente`);
}

/* ── A TABELA DE NÍVEIS ───────────────────────────────────────────────────── */
{
  const n = niveisDoTipo({ ba: 7, jp: 9 });
  confere(Object.keys(n).length === 20, "a tabela devia ter 20 níveis");
  confere(n[1].ba === 7 && n[1].jp === 9, "o nível 1 não recebeu os valores");
  confere(n[20].ba === 7 && n[20].jp === 9,
    "o nível 20 mudou — nave não sobe de nível, e a tabela repete de propósito");
  // o nível 1 não pede XP: ele é onde o ator nasce
  confere(!("xp" in n[1]), "o nível 1 não deve exigir XP");
}

if (problemas.length) {
  for (const p of problemas) console.error(`  ✘ ${p}`);
  process.exit(1);
}
console.log(
  "  ✔ classes de nave: uma por tipo com a BA e a JP da T10-1 em todo nível, o dado " +
    "de vida VAZIO (a fórmula é fechada, não por nível), o seed distinto da raça, e os " +
    "doze cômodos compartilhados pelas oito"
);
