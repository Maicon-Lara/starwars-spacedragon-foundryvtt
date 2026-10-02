// Os críticos do Space Dragon como EFEITOS do "Old Dragon 2: Qualidade de Vida".
//
// ── O QUE ISTO RESOLVE ──────────────────────────────────────────────────────
//
// As tabelas roláveis (criticos.mjs) dizem o que aconteceu. Elas não APLICAM
// nada: o "−2 no CP" da T7-4 fica num cartão de chat, e a mesa precisa lembrar
// dele até o ferimento sarar. É justo o tipo de coisa que se esquece na terceira
// rodada.
//
// O QdV tem um gerenciador de efeitos que já faz essa conta na ficha. Estes
// documentos são MODELOS para ele: o Mestre arrasta o efeito do nosso compêndio
// para a ficha de quem levou o crítico, e o CP, o ataque ou o movimento mudam
// sozinhos — com duração, com expiração, e visíveis na ficha.
//
// ── COMO ELE ACEITA UM MODELO DE FORA ───────────────────────────────────────
//
// Lido do código do QdV (v0.10.96), em `scripts/features/effect-manager/`:
//
//   • `effectTemplateFromDrop` aceita QUALQUER Item com a flag
//     `flags["old-dragon-2-qualidade-de-vida"].effectTemplate` — ele confere
//     apenas `documentName === "Item"`, e não de qual compêndio o item veio.
//     Por isso o modelo pode morar aqui, no nosso pack.
//
//   • `libraryItemData` mostra a forma do item: `type: "misc"`, `img` = o ícone
//     do efeito, `system.description` = a descrição, e o efeito inteiro na flag.
//
//   • `normalizeEffect` descarta em silêncio todo modificador cuja `key` não
//     esteja em EFFECT_KEYS ou cujo `mode` não esteja em EFFECT_MODES — sem
//     erro, sem aviso. Um efeito com a chave errada entra na ficha e não faz
//     NADA. É o motivo de teste-efeitos-criticos.mjs conferir chave por chave
//     contra as constantes copiadas abaixo.
//
//   • a pasta importa: `importEffectTemplate` lê o NOME da pasta e, se for
//     "Classe", "Raça", "Magia" ou "Equipamentos", amarra o efeito àquele item
//     — e aí o efeito morre junto com a classe. A nossa pasta se chama
//     "Críticos", de propósito: nenhum desses quatro nomes, nenhuma amarra.
//
// ── O ACOPLAMENTO, DITO EM VOZ ALTA ─────────────────────────────────────────
//
// Esta é uma dependência de formato de um módulo de TERCEIRO, e o formato não é
// API pública dele: se o QdV renomear a flag ou uma chave, estes itens param de
// ser reconhecidos. O prejuízo é contido — o item continua no compêndio, e o
// arrasto só avisa "este item não é um efeito da biblioteca do QdV" —, e as
// tabelas roláveis continuam valendo sozinhas. O módulo NÃO declara o QdV como
// dependência: quem não o tem só vê itens de descrição.
//
// ── POR QUE NÃO TEM OS CRÍTICOS DE NAVE ─────────────────────────────────────
//
// Porque as chaves do QdV são de personagem e de monstro (`ac`, `attack`,
// `movement.*`), e a nave é ator do módulo spacedragon, com campos próprios. O
// gerenciador dele não alcança a ficha de nave — e não precisa: a ficha de Nave
// já rola a T10-6 e aplica a avaria sozinha.

/* ── AS CONSTANTES DO QdV, COPIADAS ───────────────────────────────────────
 *
 * Copiadas de `scripts/features/effect-manager/model.js` para o teste poder
 * conferir sem ter o módulo instalado. Se divergirem da versão instalada, é o
 * teste que precisa ser atualizado — não o silêncio do `normalizeEffect`.
 */
export const QDV_ID = "old-dragon-2-qualidade-de-vida";
export const QDV_FLAG = "effectTemplate";

export const QDV_KEYS = new Set([
  "forca", "destreza", "constituicao", "inteligencia", "sabedoria", "carisma",
  "ac", "ba", "bac", "bad", "jpd", "jpc", "jps",
  "attack", "damage", "damage.strength", "rogue.stealth", "immunity",
  "incoming.attack", "test.difficulty", "damage.dieStep", "attacks.extra",
  "hp.max",
  "movement.normal", "movement.run", "movement.climb", "movement.swim", "movement.fly",
  "load.max", "reputation",
  "monster.ac", "monster.jp", "monster.morale", "monster.dvBonus",
]);
export const QDV_MODES = new Set(["add", "reduce", "multiply", "divide", "override"]);
export const QDV_DURACOES = new Set(["permanent", "rounds", "turns", "minutes", "hours", "rest"]);

/* ── OS EFEITOS ───────────────────────────────────────────────────────────
 *
 * Só os resultados que mudam um NÚMERO da ficha. "Derruba a arma" e "arma
 * danificada" são efeitos de mesa, não de planilha: não entram como efeito para
 * não encher a ficha de marcadores que não calculam nada.
 *
 * Sobre a duração: o livro NÃO diz quando o ferimento sara, então nenhum destes
 * inventa um prazo. Os da T7-4 ficam permanentes e saem quando o Mestre tira —
 * pôr "até o próximo descanso" por conta própria seria escrever regra. Só o
 * desequilíbrio da T7-5 tem prazo, porque ali o livro dá um: ele dura até o
 * personagem se recompor, e uma rodada é a leitura mínima.
 *
 * `ac` é a Classe de Armadura do OD2, que neste cenário É o CP do Space Dragon:
 * mesmo campo, outro nome.
 */
export const EFEITOS_CRITICOS = [
  {
    nome: "Ferimento — movimentação à metade",
    de: "T7-4, resultado 2",
    icone: "icons/svg/blood.svg",
    descricao:
      "<p><strong>Acerto crítico, T7-4 — resultado 2.</strong> O ferimento reduz a " +
      "<strong>movimentação do alvo à metade</strong>.</p>" +
      "<p><em>O efeito divide o Movimento normal por 2. Se a corrida da sua ficha " +
      "não acompanhar sozinha, ajuste-a à mão: o livro fala de movimentação, e " +
      "dividir os dois campos arriscaria cortar a corrida a um quarto.</em></p>",
    modificadores: [{ key: "movement.normal", mode: "divide", value: "2" }],
  },
  {
    nome: "Ferimento — −2 nos ataques",
    de: "T7-4, resultado 3",
    icone: "icons/svg/sword.svg",
    descricao:
      "<p><strong>Acerto crítico, T7-4 — resultado 3.</strong> O ferimento impõe " +
      "<strong>−2 nos ataques desferidos pelo alvo</strong>.</p>",
    modificadores: [{ key: "attack", mode: "reduce", value: "2" }],
  },
  {
    nome: "Vestes avariadas — −2 no CP",
    de: "T7-4, resultado 4",
    icone: "icons/svg/shield.svg",
    descricao:
      "<p><strong>Acerto crítico, T7-4 — resultado 4.</strong> As vestes do alvo se " +
      "rasgam: <strong>−2 no CP</strong>.</p>" +
      "<p><em>Dura até as vestes serem consertadas ou trocadas — por isso é " +
      "permanente, e sai pela mão do Mestre.</em></p>",
    modificadores: [{ key: "ac", mode: "reduce", value: "2" }],
  },
  {
    nome: "Desequilíbrio — −1 no CP",
    de: "T7-5, resultado 2",
    icone: "icons/svg/hazard.svg",
    descricao:
      "<p><strong>Falha crítica, T7-5 — resultado 2.</strong> Quem errou se " +
      "desequilibra: <strong>−1 no CP</strong> até se recompor.</p>",
    duracao: { type: "rounds", value: 1 },
    apagarAoExpirar: true,
    modificadores: [{ key: "ac", mode: "reduce", value: "1" }],
  },
  {
    nome: "Queda — −1 no CP",
    de: "T7-5, resultado 6",
    icone: "icons/svg/hazard.svg",
    descricao:
      "<p><strong>Falha crítica, T7-5 — resultado 6.</strong> Quem errou cai: " +
      "<strong>−1 no CP</strong>, e <strong>uma ação de movimento</strong> para se " +
      "levantar.</p>" +
      "<p><em>Sai quando o personagem se levanta — o Mestre tira o efeito, porque é " +
      "a ação de movimento dele que o encerra, e não a passagem da rodada.</em></p>",
    modificadores: [{ key: "ac", mode: "reduce", value: "1" }],
  },
];

/**
 * O efeito na forma que `normalizeEffect` do QdV devolve.
 *
 * Monta o objeto COMPLETO, e não um parcial: o QdV normaliza o que recebe, mas
 * um modelo completo é o que a biblioteca dele guarda, e é o que o editor de
 * efeitos abre sem reclamar de campo faltando.
 */
export function templateDoQdV(efeito, id) {
  const dur = efeito.duracao ?? { type: "permanent", value: 0 };
  const valor = Math.max(0, Math.trunc(Number(dur.value) || 0));
  return {
    id,
    name: efeito.nome,
    icon: efeito.icone,
    enabled: true,
    // A origem aparece na ficha ao lado do efeito: o Mestre precisa saber de
    // qual tabela aquilo veio sem abrir o editor.
    origin: `Space Dragon — ${efeito.de}`,
    sourceActorUuid: "",
    // Vazia de propósito: associação amarra o efeito a uma classe, raça, magia
    // ou equipamento, e um crítico não pertence a nenhum dos quatro.
    association: { type: "", id: "", name: "", effectId: "" },
    description: efeito.descricao,
    gmNotes: "",
    deleteOnExpire: efeito.apagarAoExpirar === true,
    duration: { type: dur.type, value: valor, remaining: valor, expiresAt: 0 },
    conditional: { enabled: false, flow: "if", trigger: "manual", conditions: [], actions: [] },
    eventAction: {
      type: "none", formula: "1d20", target: "self",
      resourceName: "", radius: 0, privateResult: false,
    },
    uses: { max: 0, remaining: 0, resetOnRest: true },
    modifiers: efeito.modificadores.map((m) => ({
      key: m.key, mode: m.mode, value: String(m.value), resolvedValue: null,
    })),
  };
}
