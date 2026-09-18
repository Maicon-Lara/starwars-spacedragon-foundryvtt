// Teste de fumaça da ficha de Nave, sem Foundry.
//
// Monta o mínimo do Foundry que o módulo toca (campos de dados, ficha V2,
// Roll, ChatMessage) e confere a REGRA, que é onde o erro custa na mesa:
//
//   · o dial: a Sobrecarga e o Leme bloqueiam as vermelhas; o colosso só tem
//     Reta, Inclinada e Parar; a Curva fechada anda metade da Velocidade;
//   · o ataque: o exemplo do próprio cofre — X-wing 4d8 num TIE, Esquiva 3d6
//     dá 5, 2, 6, dois êxitos, "sobram 2d8" — com os dados fixados;
//   · o crítico soma um dado, e a Brecha dobra o dano do tiro.
//
// Uso: node tools/teste-nave.mjs

// ── O mínimo do Foundry ─────────────────────────────────────────────────────
class Campo { constructor(...a) { this.a = a; } }
const fields = Object.fromEntries(
  ["StringField", "NumberField", "BooleanField", "SchemaField", "ArrayField", "HTMLField"].map((n) => [n, class extends Campo {}])
);

// Dados fixos: cada `new Roll(f).evaluate()` consome a próxima sequência.
let fila = [];
class Roll {
  constructor(formula) { this.formula = formula; }
  async evaluate() {
    const faces = fila.shift();
    if (!faces) throw new Error(`rolagem não prevista: ${this.formula}`);
    const m = this.formula.replace(/\s+/g, "").match(/^(\d+)d(\d+)(.*)$/);
    const soma = faces.reduce((a, b) => a + b, 0);
    const resto = m && m[3] ? Number(eval(m[3])) || 0 : 0; // "+ 18" do ataque
    this.dice = [{ results: faces.map((result) => ({ result })) }];
    this.total = soma + resto;
    return this;
  }
}

const mensagens = [];
globalThis.foundry = {
  data: { fields },
  abstract: { TypeDataModel: class {} },
  applications: {
    sheets: { ActorSheetV2: class {} },
    api: { HandlebarsApplicationMixin: (C) => C, DialogV2: null },
  },
};
globalThis.Roll = Roll;
globalThis.ChatMessage = { create: async (m) => { mensagens.push(m); return m; }, getSpeaker: () => ({}) };
globalThis.CONFIG = { sounds: { dice: "" } };
globalThis.ui = { notifications: { warn: () => {}, info: () => {} } };
globalThis.canvas = null;

const { NaveFicha, TIPO_NAVE } = await import("../starwars-sd-module/module/nave-ficha.js");
const { TIPOS } = await import("../starwars-sd-module/module/nave-modelo.js");

const problemas = [];
const confere = (ok, msg) => { if (!ok) problemas.push(msg); };

// ── Dial ────────────────────────────────────────────────────────────────────
const sistema = (tipo, extra = {}) => {
  const p = TIPOS[tipo];
  return {
    tipo, ba: p.ba, cp: p.cp, jp: p.jp, velocidade: p.velocidade, velocidadeEfetiva: p.velocidade,
    esquiva: p.esquiva, iniciativa: 0, perfil: p, colosso: !!p.colosso, sobrecarga: 0, trava: "",
    avarias: { motor: false, leme: false, armas: false, sensores: false, tripulacao: false },
    armas: [], pv: { value: 50, max: 50, formula: p.pv }, ...extra,
  };
};

const dialCaca = NaveFicha.montaDial(sistema("caca"));
const conta = (d, tipo) => d.filter((x) => x.tipo === tipo).length;
confere(conta(dialCaca, "reta") === 5, `Caça: ${conta(dialCaca, "reta")} retas, esperava 5 (Velocidade 5)`);
confere(conta(dialCaca, "inclinada") === 10, "Caça: esperava 10 inclinadas (5 velocidades × 2 lados)");
const curva = dialCaca.find((x) => x.tipo === "curva");
confere(curva?.velocidade === 2, `Curva fechada do Caça anda ${curva?.velocidade}, esperava 2 (metade de 5)`);
confere(!dialCaca.some((x) => x.bloqueada), "sem Sobrecarga, nenhuma manobra devia estar bloqueada");

const comSobrecarga = NaveFicha.montaDial(sistema("caca", { sobrecarga: 1 }));
confere(comSobrecarga.filter((x) => x.cor === "vermelha").every((x) => x.bloqueada), "com Sobrecarga, toda vermelha devia estar bloqueada");
confere(comSobrecarga.filter((x) => x.cor !== "vermelha").every((x) => !x.bloqueada), "com Sobrecarga, verde e branca continuam livres");
const comLeme = NaveFicha.montaDial(sistema("caca", { avarias: { motor: false, leme: true, armas: false, sensores: false, tripulacao: false } }));
confere(comLeme.filter((x) => x.cor === "vermelha").every((x) => x.bloqueada), "com o Leme avariado, toda vermelha devia estar bloqueada");

const dialCruzador = NaveFicha.montaDial(sistema("cruzador"));
const tiposCruzador = [...new Set(dialCruzador.map((x) => x.tipo))].sort().join(",");
confere(tiposCruzador === "inclinada,parar,reta", `colosso tem ${tiposCruzador}, esperava só inclinada, parar e reta`);

// ── Ataque: o exemplo do cofre ──────────────────────────────────────────────
// X-wing (Caça, BA +16) dispara 4d8 num TIE (Caça, CP 28, Esquiva 3d6).
const tie = {
  type: TIPO_NAVE, name: "TIE", isOwner: true,
  system: sistema("caca"),
  async update(u) { for (const [k, v] of Object.entries(u)) { const ch = k.split("."); let o = this; for (const c of ch.slice(0, -1)) o = o[c]; o[ch.at(-1)] = v; } },
};
globalThis.game = { user: { targets: new Set([{ actor: tie, name: "TIE" }]) }, combat: null };

const xwing = {
  name: "X-wing", type: TIPO_NAVE,
  system: sistema("caca", { armas: [{ nome: "Canhões laser", dano: "4d8", arco: "frontal" }] }),
  async update() {},
  getActiveTokens: () => [],
};
const ficha = { actor: xwing };
const atacar = NaveFicha.DEFAULT_OPTIONS.actions.atacar;

// O diálogo, respondido: faixa média, aplicar o dano no alvo.
const responder = (dados) => {
  globalThis.foundry.applications.api.DialogV2 = { wait: async () => ({ acao: "rolar", dados }) };
};

responder({ faixa: "media", extra: "0", aplicar: "on" });
// d20 = 15 (15 + 16 = 31 ≥ 28, acerta); Esquiva 5, 2, 6; sobram 2 dados: 7 e 3.
fila = [[15], [5, 2, 6], [7, 3]];
await atacar.call(ficha, {}, { dataset: { idx: "0" } });
const c1 = mensagens.at(-1).content;
confere(/Acertou/.test(c1), "o X-wing devia acertar: 15 + 16 = 31 contra CP 28");
confere(/<strong>2<\/strong> dado\(s\) cancelado\(s\) de 4/.test(c1), "a Esquiva 5, 2, 6 devia cancelar 2 dos 4 dados");
confere(/\(2d8\)/.test(c1), "deviam sobrar 2d8, como no exemplo do cofre");
confere(tie.system.pv.value === 40, `o TIE devia ficar com 40 PV (50 − 10), ficou com ${tie.system.pv.value}`);

// ── Crítico com Brecha ──────────────────────────────────────────────────────
tie.system.pv.value = 50;
fila = [[20], [1, 1, 1], [6], [2, 2, 2, 2, 2]];
await atacar.call(ficha, {}, { dataset: { idx: "0" } });
const c2 = mensagens.at(-1).content;
confere(/Crítico/.test(c2), "20 natural devia ser crítico");
confere(/de 5\./.test(c2), "o crítico devia somar um dado: 5 dados em vez de 4");
confere(/Dano: <strong>20<\/strong>/.test(c2) && /dobrado pela Brecha/.test(c2), "a Brecha (6) devia dobrar o dano: 5 dados de 2 = 10, ×2 = 20");
confere(tie.system.pv.value === 30, `com a Brecha o TIE devia ficar com 30 PV, ficou com ${tie.system.pv.value}`);

// ── Erro ────────────────────────────────────────────────────────────────────
fila = [[2]];
await atacar.call(ficha, {}, { dataset: { idx: "0" } });
confere(/Errou/.test(mensagens.at(-1).content), "2 + 16 = 18 contra CP 28 devia errar");

if (problemas.length) {
  for (const p of problemas) console.error(`  ✘ ${p}`);
  process.exit(1);
}
console.log("  ✔ nave: dial (Sobrecarga, Leme, colosso, curva pela metade) e ataque (o exemplo do X-wing, crítico e Brecha)");
