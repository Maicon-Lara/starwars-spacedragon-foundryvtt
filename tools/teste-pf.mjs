// Teste da regra de Pontos de Força, sem Foundry.
//
// Confere o que a mesa não vê errar na hora: a reserva por nível, a faixa do
// dado, e o fato de subir de nível zerar e reencher.
//
// Uso: node tools/teste-pf.mjs

// ── O mínimo do Foundry que o arquivo toca ─────────────────────────────────
globalThis.Roll = class {
  constructor(f) { this.formula = f; }
  async evaluate() {
    const n = Number(this.formula.match(/^(\d+)d6$/)[1]);
    this.dice = [{ results: Array.from({ length: n }, (_, i) => ({ result: (i % 6) + 1 })) }];
    return this;
  }
};
globalThis.Hooks = { on() {} };
globalThis.ChatMessage = { create: async () => {}, getSpeaker: () => ({}) };
globalThis.CONFIG = { sounds: { dice: null } };

const { dadoDaFaixa, reservaDoNivel, reservaDoAtor, pontosAtuais, rolarPonto, montaPainel,
  nivelDe, TIPOS_COM_PAINEL, USOS, USO, usosDe, temAlcance, textoDoUso, rodadaAtual, jaGastouNaRodada } =
  await import("../starwars-sd-module/module/pontos-de-forca.js");

const problemas = [];
const confere = (ok, msg) => { if (!ok) problemas.push(msg); };

// ── A reserva: 5 por dado da faixa ─────────────────────────────────────────
//
// A reserva muda exatamente onde o dado muda: 5 · 10 · 15 nos três degraus.
const esperado = { 1: 5, 7: 5, 8: 10, 14: 10, 15: 15, 20: 15 };
for (const [nivel, pf] of Object.entries(esperado)) {
  confere(reservaDoNivel(Number(nivel)) === pf,
    `reserva do ${nivel}º devia ser ${pf}, deu ${reservaDoNivel(Number(nivel))}`);
}
// a reserva nunca encolhe ao subir
for (let n = 2; n <= 20; n++) {
  confere(reservaDoNivel(n) >= reservaDoNivel(n - 1),
    `a reserva encolheu do ${n - 1}º para o ${n}º`);
}

// ── As três faixas do dado ─────────────────────────────────────────────────
const faixas = { 1: 1, 7: 1, 8: 2, 14: 2, 15: 3, 20: 3 };
for (const [nivel, dados] of Object.entries(faixas)) {
  confere(dadoDaFaixa(Number(nivel)).dados === dados,
    `no ${nivel}º devia rolar ${dados}d6, rola ${dadoDaFaixa(Number(nivel)).dados}`);
}

// ── O que vale é o MAIOR, não a soma ───────────────────────────────────────
const r = await rolarPonto(15);            // 3d6, dados fixos 1,2,3
confere(r.valor === 3, `o maior de [${r.faces}] devia ser 3, deu ${r.valor}`);
confere(r.valor <= 6, "o dado nunca passa de 6, em faixa nenhuma");

// ── Subir de nível zera e reenche ──────────────────────────────────────────
//
// O flag guarda o nível em que a reserva vale. Com o ator no 4º e o flag do 3º,
// a reserva a valer é a do 4º, cheia — é assim que "zera ao subir" acontece
// sem ninguém precisar clicar em nada.
const ator = (nivel, flag, heroico = true) => ({
  system: { level: nivel },
  hasPlayerOwner: heroico,
  getFlag: (_id, chave) => (chave === "heroico" ? undefined : flag),
});
confere(pontosAtuais(ator(3, null)) === 5, "sem flag, a reserva é a cheia do nível");
confere(pontosAtuais(ator(3, { nivel: 3, valor: 2 })) === 2, "com flag do mesmo nível, vale o guardado");
confere(pontosAtuais(ator(8, { nivel: 7, valor: 0 })) === 10,
  "subir de faixa devia zerar o gasto e reencher: do 7º com 0 para o 8º cheio (10)");
confere(pontosAtuais(ator(3, { nivel: 3, valor: 99 })) === 5, "o guardado não passa do limite do nível");
confere(pontosAtuais(ator(3, { nivel: 3, valor: -5 })) === 0, "o guardado não fica negativo");

// ── A reserva cheia é de protagonista ──────────────────────────────────────
//
// Um PNJ comum tem 1 ponto. Sem isso o Mestre administra uma reserva por
// capanga, e o que devia ser um instante vira contabilidade.
confere(reservaDoAtor({ system: { level: 10 }, hasPlayerOwner: true }) === 10,
  "personagem de jogador tem a reserva do nível");
// a reserva e o dado andam juntos: é o ponto da regra
for (const n of [1, 5, 7, 8, 12, 14, 15, 20]) {
  confere(reservaDoNivel(n) === 5 * dadoDaFaixa(n).dados,
    `no ${n}º a reserva devia ser 5 x os dados da faixa`);
}
confere(reservaDoAtor({ system: { level: 10 }, hasPlayerOwner: false, getFlag: () => false }) === 1,
  "PNJ comum tem 1 ponto, não a reserva cheia");
confere(reservaDoAtor({ system: { level: 10 }, hasPlayerOwner: false, getFlag: (_i, c) => c === "heroico" }) === 10,
  "PNJ marcado como heroico tem a reserva cheia");
confere(pontosAtuais(ator(10, null, false)) === 1, "e o painel do PNJ comum mostra 1");
confere(reservaDoAtor({ system: { level: 20 }, hasPlayerOwner: true }) === 15, "no 20º são 15");

// ── A FICHA NOVA DE PERSONAGEM É PROTAGONISTA ──────────────────────────────
//
// O bug da 1.48.1: a ficha que o Mestre acaba de criar ainda não tem jogador
// dono, e nascia "PNJ comum" — 1 / 1, com o +1 e o ⟳ desabilitados e nada na
// tela para mudar isso. Ficha de personagem é protagonista até o Mestre dizer
// o contrário; o flag explícito manda nos dois sentidos.
const nova = (heroico) => ({ type: "character", system: { level: 3 }, hasPlayerOwner: false,
  getFlag: (_i, c) => (c === "heroico" ? heroico : undefined) });
confere(reservaDoAtor(nova(undefined)) === 5, "ficha nova de personagem, sem dono, devia ter a reserva cheia (5), não 1");
confere(reservaDoAtor(nova(false)) === 1, "personagem que o Mestre marcou como PNJ comum tem 1 ponto");
confere(reservaDoAtor({ ...nova(false), hasPlayerOwner: true }) === 1, "a marcação do Mestre vale mesmo com jogador dono");
confere(reservaDoAtor({ type: "monster", system: { level: 3 }, hasPlayerOwner: false, getFlag: () => undefined }) === 1,
  "ator que não é personagem, sem dono nem marca, segue PNJ comum");

// ── O BOTÃO DE RECARREGAR É SÓ DO MESTRE ──────────────────────────────────
//
// A ASSERÇÃO QUE MAIS IMPORTA DESTE BLOCO. "Não recarrega por descanso nem por
// sessão" é o que dá peso ao gasto: um ponto queimado na perseguição não está
// lá no duelo do fim do arco. Um botão de reenchar na ficha do JOGADOR desfaz
// essa regra inteira — a reserva deixa de ser do nível e passa a ser infinita.
//
// Por isso o ⟳ existe só para o Mestre, para o caso que a mesa tem de verdade:
// o nível que subiu depois de alguém já ter gasto, e a contagem errada.
{
  const heroi = { id: "a1", system: { level: 1 }, hasPlayerOwner: true, getFlag: () => null };

  globalThis.game = { user: { isGM: false } };
  const doJogador = montaPainel(heroi);
  confere(!doJogador.includes('data-pf="recarregar"'),
    "o jogador NÃO pode ter botão de recarregar — ele desfaria a regra da reserva");
  // o gastar continua com ele; o +1 não: cinco cliques nele enchiam a
  // reserva, e era o ⟳ por outro caminho
  confere(doJogador.includes('data-pf="gastar"'), "o jogador perdeu o gastar");
  confere(!doJogador.includes('data-pf="devolver"'),
    "o jogador NÃO pode ter o +1 — cinco cliques enchiam a reserva, como o ⟳");

  globalThis.game = { user: { isGM: true } };
  const doMestre = montaPainel(heroi);
  confere(doMestre.includes('data-pf="recarregar"'), "o Mestre devia ter o botão de recarregar");
  confere(doMestre.includes('data-pf="devolver"'), "o Mestre devia ter o +1, para desfazer um gasto");

  // Com a reserva CHEIA o botão não tem o que fazer, e botão que não faz nada
  // é botão que a mesa clica e desconfia.
  const cheio = { ...heroi, getFlag: () => ({ nivel: 1, valor: 5 }) };
  const html = montaPainel(cheio);
  const i = html.indexOf('data-pf="recarregar"');
  confere(html.slice(i, i + 120).includes("disabled"),
    "com a reserva cheia o ⟳ tem de vir desabilitado");

  // E com ponto gasto, habilitado
  const gasto = { ...heroi, getFlag: () => ({ nivel: 1, valor: 2 }) };
  const h2 = montaPainel(gasto);
  const j = h2.indexOf('data-pf="recarregar"');
  confere(!h2.slice(j, j + 120).includes("disabled"),
    "com ponto gasto o ⟳ tem de estar clicável");

  // O que o botão devolve é a reserva da FAIXA, não um número fixo: no 15º são
  // 15, e recarregar tem de respeitar isso.
  const alto = { id: "a2", system: { level: 15 }, hasPlayerOwner: true, getFlag: () => ({ nivel: 15, valor: 1 }) };
  confere(reservaDoAtor(alto) === 15, "no 15º o ⟳ devolve 15, não 5");

  // O botão de papel (protagonista / PNJ comum) é do Mestre, como o ⟳
  confere(doMestre.includes('data-pf="papel"') && doMestre.includes("protagonista"),
    "o Mestre devia ver o botão de papel, dizendo protagonista");
  confere(!doJogador.includes('data-pf="papel"'), "o jogador não pode trocar o próprio papel");
  confere(montaPainel(nova(false)).includes(">PNJ comum<"), "o botão do PNJ comum diz PNJ comum");

  globalThis.game = { user: { isGM: false } };
  // PNJ comum: 1 ponto, e o painel não promete mais do que isso
  const pnj = { id: "a3", system: { level: 9 }, hasPlayerOwner: false, getFlag: () => null };
  confere(montaPainel(pnj).includes("1 / 1"), "o PNJ comum tem 1 ponto, e o painel diz isso");
}

// ── O PNJ DO MESTRE TAMBÉM TEM O PONTO ─────────────────────────────────────
//
// Até a 1.50 o painel só entrava na ficha de personagem, e o "PNJ comum tem 1
// Ponto de Força" nunca chegava à ficha de ameaça.
confere(TIPOS_COM_PAINEL.includes("monster") && TIPOS_COM_PAINEL.includes("retainer"),
  "a ficha de ameaça e a de ajudante deviam receber o painel");
confere(nivelDe({ type: "monster", system: {} }) === 1, "a ameaça sem nível conta como 1º");
confere(nivelDe({ type: "character", system: { level: 0 } }) === 0, "personagem sem nível segue sem painel");
confere(nivelDe({ type: "character", system: { level: 9 } }) === 9, "o nível do personagem é o da ficha");
{
  globalThis.game = { user: { isGM: false } };
  const ameaca = { id: "m1", type: "monster", system: {}, hasPlayerOwner: false, getFlag: () => undefined };
  const html = montaPainel(ameaca);
  confere(!!html && html.includes("1 / 1"), "a ameaça devia mostrar o painel com 1 / 1");
}

// ── EM QUÊ, ANTES DO DADO ──────────────────────────────────────────────────
//
// A escolha entre Empurrar e Insistir vem antes de rolar. Insistir, reativar um
// poder e Escapar da morte não rolam: o ponto é o efeito inteiro.
for (const c of ["ataque", "atributo", "empurrar", "insistir", "alcance", "poder", "morte"]) {
  confere(!!USO[c], `falta o uso ${c}`);
}
confere(USO.empurrar.rola && !USO.insistir.rola, "Empurrar rola o dado; Insistir não");
confere(!USO.morte.rola && !USO.poder.rola, "Escapar da morte e reativar um poder não rolam");
confere(USO.alcance.rola, "recuperar Alcance rola o dado da faixa");

// as direções: soma no d20 maior-é-melhor, subtrai no roll-under, ×10 no d%
confere(textoDoUso("ataque", 4).includes("+4"), "ataque/JP soma o dado");
confere(textoDoUso("atributo", 4).includes("−4"), "atributo subtrai o dado do d20");
confere(textoDoUso("empurrar", 4).includes("+40%"), "Empurrar soma o dado × 10%");
confere(!textoDoUso("ataque", 4).includes("−4") && !textoDoUso("atributo", 4).includes("+4"),
  "cada uso mostra só a direção dele");

// ── RECUPERAÇÃO DA FORÇA SÓ PARA QUEM TEM ALCANCE ──────────────────────────
const comClasse = (chassi, nome = "x") => ({ items: [{ type: "class", name: nome, flags: { spacedragon: { chassi } } }] });
confere(temAlcance(comClasse("Mentálico")), "o Sensível (Mentálico) tem Alcance");
confere(!temAlcance(comClasse("Cosmonauta")), "o Veterano (Cosmonauta) não tem Alcance");
confere(temAlcance({ items: [{ type: "class", name: "Consular — Mentálico" }] }), "sem flag, o chassi sai do nome");
confere(usosDe(comClasse("Cosmonauta")).every((u) => !u.soAlcance), "o Veterano não vê a Recuperação da Força");
confere(usosDe(comClasse("Mentálico")).length === USOS.length, "o Sensível vê todos os usos");

// ── UM PONTO POR RODADA EM COMBATE ─────────────────────────────────────────
{
  const combate = (round, started = true, ids = ["a1"]) =>
    ({ id: "c1", round, started, combatants: ids.map((actorId) => ({ actorId })) });
  const quem = (flag) => ({ id: "a1", getFlag: (_i, c) => (c === "pfRodada" ? flag : undefined) });

  confere(rodadaAtual(quem(null), null) === null, "fora de combate não há rodada");
  confere(rodadaAtual(quem(null), combate(2, false)) === null, "combate não começado não conta");
  confere(rodadaAtual(quem(null), combate(2, true, ["outro"])) === null,
    "quem não está no combate não tem rodada");
  confere(rodadaAtual(quem(null), combate(2))?.rodada === 2, "no combate, a rodada é a dele");

  confere(!jaGastouNaRodada(quem(null), combate(2)), "sem gasto marcado, pode gastar");
  confere(jaGastouNaRodada(quem({ combate: "c1", rodada: 2 }), combate(2)),
    "gastou nesta rodada: não pode gastar de novo");
  confere(!jaGastouNaRodada(quem({ combate: "c1", rodada: 1 }), combate(2)),
    "a rodada seguinte libera o gasto");
  confere(!jaGastouNaRodada(quem({ combate: "c0", rodada: 2 }), combate(2)),
    "a mesma rodada de outro combate não conta");
  confere(!jaGastouNaRodada(quem({ combate: "c1", rodada: 2 }), null),
    "fora de combate não há limite por rodada");
}

if (problemas.length) {
  for (const p of problemas) console.error(`  ✘ ${p}`);
  process.exit(1);
}
console.log("  ✔ pontos de força: reserva por nível e por tipo de ator, as três faixas, o maior de N, " +
    "o zerar ao subir, a ficha nova com reserva cheia, o ⟳, o +1 e o papel SÓ para o Mestre, o PNJ com painel, " +
    "o uso escolhido antes do dado, a Recuperação só com Alcance e um ponto por rodada");
