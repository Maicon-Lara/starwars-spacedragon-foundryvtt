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
  ESTADOS, estadoDoComodo, proximoEstado, comodosInstalados,
  CAMARAS_BASE, LIVRES_POR_TAMANHO, padraoDoComodo, orcamentoDeCamaras,
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

/* ── O MÍNIMO PARA VOAR, E O ORÇAMENTO DO TAMANHO ─────────────────────────── */
//
// ── A ASSERÇÃO QUE MAIS IMPORTA ─────────────────────────────────────────────
//
// Que a Ponte e a Sala de Máquinas venham de fábrica, e SÓ elas. São as duas
// com veto no texto das regras: sem a Ponte a nave «não pode ser pilotada nem
// operar escudos ou armas»; a Sala de Máquinas é «lugar obrigatório do
// acelerador hiperespacial e dos tanques», e sem tanque não há combustível.
//
// Se mais alguma entrasse na base, toda nave nasceria com algo que ninguém
// escolheu e que custa dinheiro. Se uma das duas saísse, a nave nasceria
// incapaz de voar — e o Mestre descobriria isso no meio de uma sessão.
{
  confere(CAMARAS_BASE.length === 2, `${CAMARAS_BASE.length} câmaras de base, deviam ser 2`);
  confere(CAMARAS_BASE.includes("ponte"),
    "a Ponte não vem de fábrica — sem ela a nave não pode ser pilotada (§4)");
  confere(CAMARAS_BASE.includes("maquinas"),
    "a Sala de Máquinas não vem de fábrica — é onde ficam os motores e os tanques (§4)");

  // nenhuma outra: as dez restantes são escolha de quem monta a nave
  for (const c of ["aposentos", "deposito", "refeitorio", "arsenal", "hospital",
                   "laboratorio", "acoplagem", "despressurizacao", "corredores", "emergencia"]) {
    confere(!CAMARAS_BASE.includes(c),
      `"${c}" entrou na base — toda nave nasceria com ela, e ela custa dinheiro`);
    confere(padraoDoComodo(c) === "ausente", `"${c}" vem instalada de fábrica e não devia`);
  }
  confere(padraoDoComodo("ponte") === "instalada", "a Ponte devia vir de pé");
  confere(padraoDoComodo("maquinas") === "instalada", "a Sala de Máquinas devia vir de pé");
}

{
  confere(ESTADOS.length === 3, `${ESTADOS.length} estados, deviam ser 3`);

  // sem registro, vale o de fábrica — e é por isso que a flag de uma nave nova
  // é `{}` em vez de doze linhas dizendo "ausente"
  confere(estadoDoComodo({}, "ponte") === "instalada", "a Ponte de uma nave nova devia estar de pé");
  confere(estadoDoComodo({}, "hospital") === "ausente", "a Ala Hospitalar não vem de fábrica");
  confere(estadoDoComodo({ camaras: {} }, "maquinas") === "instalada", "nave sem registro nenhum");

  // o que foi gravado manda, inclusive contra o padrão: a Ponte PODE ser
  // desinstalada, e aí a nave deixa de voar. A regra diz o que acontece; não
  // impede que aconteça.
  confere(estadoDoComodo({ camaras: { ponte: "ausente" } }, "ponte") === "ausente",
    "não dá para desinstalar a Ponte — a regra diz a consequência, não proíbe o ato");
  confere(estadoDoComodo({ camaras: { hospital: "instalada" } }, "hospital") === "instalada",
    "a câmara comprada tem de ficar instalada");
  confere(estadoDoComodo({ camaras: { ponte: "lixo" } }, "ponte") === "instalada",
    "estado inválido cai no padrão, e não quebra a ficha");

  // o ciclo: instala, estraga, arranca
  confere(proximoEstado("ausente") === "instalada", "o primeiro clique instala");
  confere(proximoEstado("instalada") === "danificada", "o segundo marca o estrago");
  confere(proximoEstado("danificada") === "ausente", "o terceiro desinstala");
  confere(proximoEstado("lixo") === "instalada", "estado desconhecido entra pelo começo");
}

/* ── O ORÇAMENTO ──────────────────────────────────────────────────────────── */
//
// O tamanho dá o número de câmaras livres. É o que faz um caça ser cabine e
// motor enquanto uma nave-mãe nasce cidade — e o que deixa duas espaçonaves
// particulares do mesmo tipo saírem diferentes.
{
  confere(LIVRES_POR_TAMANHO["Pequena"] === 0, "nave pequena não tem câmara livre: é cabine e motor");
  confere(LIVRES_POR_TAMANHO["Média"] === 2, "nave média devia ter 2 livres");
  confere(LIVRES_POR_TAMANHO["Gigantesca"] === 4, "nave gigantesca devia ter 4 livres");
  confere(LIVRES_POR_TAMANHO["Colossal"] === 6, "nave colossal devia ter 6 livres");

  // os quatro nomes têm de ser os da T10-1, ou o orçamento sai zero sem avisar
  const daTabela = new Set(Object.values(TIPOS).map((t) => t.tamanho));
  for (const t of daTabela) {
    confere(t in LIVRES_POR_TAMANHO,
      `a T10-1 tem o tamanho "${t}" e o orçamento não o conhece — a nave ficaria com 0 livres`);
  }

  const TODAS = ["ponte", "maquinas", "aposentos", "deposito", "refeitorio", "arsenal",
                 "hospital", "laboratorio", "acoplagem", "despressurizacao", "corredores",
                 "emergencia"];

  // nave nova: nada gasto, porque a base não conta
  const nova = orcamentoDeCamaras({}, TODAS, "Média");
  confere(nova.usadas === 0,
    `nave nova gastou ${nova.usadas} do orçamento — a Ponte e as Máquinas NÃO contam, ` +
    `elas não são escolha`);
  confere(nova.saldo === 2 && !nova.excedeu, "nave média nova devia ter 2 livres de saldo");

  // duas compradas: o saldo zera
  const cheia = orcamentoDeCamaras(
    { camaras: { hospital: "instalada", laboratorio: "instalada" } }, TODAS, "Média");
  confere(cheia.usadas === 2 && cheia.saldo === 0 && !cheia.excedeu,
    `duas câmaras numa média deviam zerar o saldo, veio ${JSON.stringify(cheia)}`);

  // a danificada OCUPA o lugar: ela está lá, e o conserto custa 25% da obra em
  // vez da obra inteira — o que só faz sentido se a câmara continuar na nave
  const comQuebrada = orcamentoDeCamaras(
    { camaras: { hospital: "danificada" } }, TODAS, "Média");
  confere(comQuebrada.usadas === 1,
    "a câmara danificada não contou no orçamento — ela ocupa o lugar, e é por isso " +
    "que o conserto custa 25% da obra e não a obra inteira");

  // passar do orçamento AVISA, e não trava: nave comprada usada, nave de enredo
  // e reforma paga em jogo são exatamente as naves interessantes
  const demais = orcamentoDeCamaras(
    { camaras: { hospital: "instalada", laboratorio: "instalada", arsenal: "instalada" } },
    TODAS, "Média");
  confere(demais.excedeu && demais.saldo === -1,
    `três câmaras numa média deviam acusar excesso, veio ${JSON.stringify(demais)}`);

  // o caça: zero livres, e a base não o deixa no vermelho
  const caca = orcamentoDeCamaras({}, TODAS, "Pequena");
  confere(!caca.excedeu && caca.saldo === 0,
    "o caça recém-criado já nasce no vermelho — a base não pode contar contra o orçamento");

  confere(orcamentoDeCamaras({}, TODAS, "Inventada").livres === 0, "tamanho desconhecido não quebra");
}

if (problemas.length) {
  for (const p of problemas) console.error(`  ✘ ${p}`);
  process.exit(1);
}
console.log(
  "  ✔ dados da nave sobre personagem: a T10-1 inteira linha a linha, o PV como " +
    "FÓRMULA e não rolado, a flag parcial completada sem perder nada, o aviso de " +
    "nave incompleta, os cinco postos, e o mínimo de fábrica (só Ponte e Sala de Máquinas, as duas com veto no texto) e o orçamento de câmaras livres por tamanho, que avisa sem travar"
);
