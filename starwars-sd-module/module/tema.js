/**
 * Liga e desliga a paleta do livro nas fichas do sistema.
 *
 * ── O QUE ESTA CAMADA FAZ, E O QUE ELA NÃO FAZ ──────────────────────────────
 *
 * A ficha de personagem é do sistema `olddragon2e`, não deste módulo. O módulo
 * Space Dragon já tem uma camada que a repinta, sob `body.spacedragon-tema`, e
 * essa camada fez o trabalho difícil: o sistema pinta o mesmo carmim em vinte e
 * três seletores longos, e a folha dele os cobre com `!important`, concentrando
 * tudo em cinco variáveis.
 *
 * Então aqui não se reescreve seletor nenhum — só se trocam as cinco cores pela
 * paleta do livro (styles/livro.css), e a maquinaria do vizinho faz o resto.
 *
 * ── POR QUE UMA CLASSE NO <body> ────────────────────────────────────────────
 *
 * Mesma razão do módulo Space Dragon, e vale repetir porque já falhou aqui: um
 * gancho de render deixa o tema refém de o gancho da ficha disparar. Uma classe
 * no <body> vale para a ficha de personagem, de monstro, de item e para o que o
 * sistema criar depois, sem uma linha a mais.
 *
 * ── POR QUE É OPT-IN ────────────────────────────────────────────────────────
 *
 * Porque repintar a ficha de quem instalou o módulo é decidir pelo outro, e num
 * mundo misto — Ekhoria e Star Wars no mesmo servidor — a paleta de um cenário
 * na ficha do outro é um erro, não um estilo. É `client`, como a do vizinho:
 * quem olha decide.
 */

const ID = "starwars-sd";
const CLASSE = "starwars-sd-tema";
const VIZINHO = "spacedragon-tema";

function aplicar(ligado) {
  document.body?.classList.toggle(CLASSE, !!ligado);
  if (ligado) avisarSeSozinho();
}

/**
 * As variáveis sem as regras não pintam nada.
 *
 * As regras que consomem `--sd-*` moram na folha do módulo Space Dragon, sob
 * `body.spacedragon-tema`. Com o tema dele desligado, esta camada define cinco
 * variáveis que ninguém lê — e o usuário veria a opção ligada sem efeito, sem
 * uma linha que explicasse. Daí o aviso.
 */
function avisarSeSozinho() {
  if (document.body?.classList.contains(VIZINHO)) return;
  const msg =
    "O tema do livro precisa do tema do módulo Space Dragon ligado para " +
    "alcançar a ficha de personagem: é a folha dele que cobre os seletores do " +
    "sistema, e esta camada só troca as cores. Ligue “Tema Space Dragon nas " +
    "fichas” nas configurações do módulo Space Dragon.";
  console.warn(`${ID} | ${msg}`);
  ui.notifications?.warn(msg, { permanent: false });
}

export function registrarTema() {
  game.settings.register(ID, "temaDoLivro", {
    name: "starwars-sd.settings.temaDoLivro.nome",
    hint: "starwars-sd.settings.temaDoLivro.dica",
    scope: "client",
    config: true,
    type: Boolean,
    default: false,
    // Sem recarregar: a classe sai e a paleta do Space Dragon volta.
    onChange: aplicar,
  });
}

export function ligarTema() {
  try {
    aplicar(game.settings.get(ID, "temaDoLivro"));
  } catch {
    /* mundo sem a opção ainda registrada: nada a fazer */
  }
}
