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

const { dadoDaFaixa, reservaDoNivel, pontosAtuais, rolarPonto } =
  await import("../starwars-sd-module/module/pontos-de-forca.js");

const problemas = [];
const confere = (ok, msg) => { if (!ok) problemas.push(msg); };

// ── A reserva: 5 + (nível ÷ 2), para baixo ─────────────────────────────────
const esperado = { 1: 5, 2: 6, 3: 6, 4: 7, 5: 7, 10: 10, 11: 10, 15: 12, 20: 15 };
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
const ator = (nivel, flag) => ({
  system: { level: nivel },
  getFlag: () => flag,
});
confere(pontosAtuais(ator(3, null)) === 6, "sem flag, a reserva é a cheia do nível");
confere(pontosAtuais(ator(3, { nivel: 3, valor: 2 })) === 2, "com flag do mesmo nível, vale o guardado");
confere(pontosAtuais(ator(4, { nivel: 3, valor: 0 })) === 7,
  "subir de nível devia zerar o gasto e reencher: do 3º com 0 para o 4º cheio (7)");
confere(pontosAtuais(ator(3, { nivel: 3, valor: 99 })) === 6, "o guardado não passa do limite do nível");
confere(pontosAtuais(ator(3, { nivel: 3, valor: -5 })) === 0, "o guardado não fica negativo");

if (problemas.length) {
  for (const p of problemas) console.error(`  ✘ ${p}`);
  process.exit(1);
}
console.log("  ✔ pontos de força: a reserva por nível, as três faixas do dado, o maior de N e o zerar ao subir");
