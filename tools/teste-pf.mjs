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

const { dadoDaFaixa, reservaDoNivel, reservaDoAtor, pontosAtuais, rolarPonto } =
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
  getFlag: (_id, chave) => (chave === "heroico" ? false : flag),
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

if (problemas.length) {
  for (const p of problemas) console.error(`  ✘ ${p}`);
  process.exit(1);
}
console.log("  ✔ pontos de força: reserva por nível e por tipo de ator, as três faixas, o maior de N e o zerar ao subir");
