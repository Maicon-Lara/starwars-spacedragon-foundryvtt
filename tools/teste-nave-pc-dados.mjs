// Teste dos dados da nave quando ela é um ator do tipo `character`.
//
// ── POR QUE ISTO É TESTÁVEL, E A FICHA NÃO ──────────────────────────────────
//
// Porque é dado puro. A ficha herda uma classe do sistema e só existe com o
// Foundry rodando; estas funções não dependem de nada — e é por isso que a
// T10-1 foi extraída para tipos-de-nave.js antes de escrever uma linha disto.
// Enquanto ela morava no modelo, importá-la arrastava o DataModel junto.
//
// ── A ASSERÇÃO QUE MAIS IMPORTA ─────────────────────────────────────────────
//
// Que `aplicarTipo` devolva a FÓRMULA do PV, e não um PV rolado. A tabela dá o
// dado; quem rola é a mesa. Rolar aqui faria duas naves do mesmo tipo nascerem
// diferentes sem ninguém ter pedido, e tiraria do Mestre a nave-padrão.
//
// Uso: node tools/teste-nave-pc-dados.mjs

import {
  naveVazia, naveDe, aplicarTipo, faltaConfigurar, POSTOS_DA_NAVE, postosOcupados, FLAG,
} from "../starwars-sd-module/module/nave-pc-dados.js";
import { TIPOS } from "../starwars-sd-module/module/tipos-de-nave.js";

const problemas = [];
const confere = (ok, msg) => { if (!ok) problemas.push(msg); };

/* ── A T10-1 INTEIRA ──────────────────────────────────────────────────────── */

confere(Object.keys(TIPOS).length === 8, `a T10-1 tem 8 tipos, achei ${Object.keys(TIPOS).length}`);

for (const [chave, t] of Object.entries(TIPOS)) {
  const r = aplicarTipo(chave);
  confere(!!r, `aplicarTipo("${chave}") devolveu nada`);
  if (!r) continue;
  // o que a tabela diz é o que a flag recebe, linha a linha
  confere(r.flag.cp === t.cp, `${t.rotulo}: CP ${r.flag.cp}, a tabela diz ${t.cp}`);
  confere(r.flag.ba === t.ba, `${t.rotulo}: BA ${r.flag.ba}, a tabela diz ${t.ba}`);
  confere(r.flag.jp === t.jp, `${t.rotulo}: JP ${r.flag.jp}, a tabela diz ${t.jp}`);
  confere(r.flag.esquiva === t.esquiva, `${t.rotulo}: esquiva fora da tabela`);
  confere(r.flag.tamanho === t.tamanho, `${t.rotulo}: tamanho fora da tabela`);
  // a FÓRMULA, não o resultado
  confere(r.formulaDePV === t.pv, `${t.rotulo}: a fórmula de PV devia ser ${t.pv}`);
  confere(/d\d/.test(r.formulaDePV),
    `${t.rotulo}: o PV veio "${r.formulaDePV}" — devia ser a fórmula, e quem rola é a mesa`);
  confere(!Number.isFinite(Number(r.formulaDePV)),
    `${t.rotulo}: o PV veio ROLADO. Duas naves do mesmo tipo nasceriam diferentes, ` +
    `e o Mestre perderia a nave-padrão`);
}

confere(aplicarTipo("inexistente") === null, "tipo desconhecido não pode inventar valores");
confere(aplicarTipo(undefined) === null, "tipo ausente não quebra");

/* ── A NAVE VAZIA E A LEITURA ─────────────────────────────────────────────── */
{
  const v = naveVazia();
  for (const campo of ["tipo", "esquiva", "cp", "ba", "jp", "combustivel", "postos"]) {
    confere(campo in v, `a nave vazia não tem o campo ${campo}`);
  }

  // Ator sem flag nenhuma: devolve a vazia, e não `undefined` — a ficha lê isso
  // a cada render, e um `undefined` ali vira erro no meio da rodada.
  const semFlag = { getFlag: () => undefined };
  confere(naveDe(semFlag).tipo === "", "ator sem flag devia devolver a nave vazia");

  // Flag PARCIAL (de uma versão anterior, ou escrita à mão): os campos que
  // faltam vêm da vazia, e os que existem são preservados.
  const parcial = { getFlag: () => ({ tipo: "caca", cp: 28 }) };
  const lida = naveDe(parcial);
  confere(lida.tipo === "caca" && lida.cp === 28, "a flag parcial perdeu o que tinha");
  confere(lida.esquiva === 0 && typeof lida.postos === "object",
    "a flag parcial não foi completada com a nave vazia");

  confere(FLAG === "nave", `a flag mudou de nome para "${FLAG}" — isso perde as naves já criadas`);
}

/* ── O AVISO DE NAVE INCOMPLETA ───────────────────────────────────────────── */
//
// Uma nave sem tipo tem CP 0 e BA 0. Na mesa isso aparece como "meus tiros
// nunca acertam", três rodadas depois, e ninguém liga ao fato de a ficha estar
// pela metade. Melhor dizer na ficha, antes.
{
  const faltas = faltaConfigurar(naveVazia());
  confere(faltas.length >= 3, `a nave vazia devia acusar ao menos 3 faltas, veio ${faltas.length}`);
  confere(faltas.some((f) => f.includes("T10-1")), "o aviso precisa apontar a tabela");

  const pronta = { ...naveVazia(), ...aplicarTipo("cruzador").flag };
  confere(faltaConfigurar(pronta).length === 0,
    `uma nave com tipo aplicado não deveria faltar nada: ${faltaConfigurar(pronta).join(", ")}`);
}

/* ── OS POSTOS ────────────────────────────────────────────────────────────── */
{
  confere(POSTOS_DA_NAVE.length === 5, `são 5 postos, achei ${POSTOS_DA_NAVE.length}`);
  for (const [chave, rotulo, oQueFaz] of POSTOS_DA_NAVE) {
    confere(chave && rotulo, "posto sem chave ou sem rótulo");
    confere(typeof oQueFaz === "string" && oQueFaz.length > 15,
      `o posto ${rotulo} não diz o que faz — e é isso que a mesa precisa saber`);
  }

  confere(postosOcupados(naveVazia()) === 0, "nave vazia não tem posto ocupado");
  const comDois = { ...naveVazia(), postos: { pilotagem: "Han", armas: "Chewie", escudos: "  " } };
  confere(postosOcupados(comDois) === 2,
    `dois postos ocupados (espaço em branco não conta), veio ${postosOcupados(comDois)}`);
}

if (problemas.length) {
  for (const p of problemas) console.error(`  ✘ ${p}`);
  process.exit(1);
}
console.log(
  "  ✔ dados da nave sobre personagem: a T10-1 inteira linha a linha, o PV como " +
    "FÓRMULA e não rolado, a flag parcial completada sem perder nada, o aviso de " +
    "nave incompleta e os cinco postos"
);
